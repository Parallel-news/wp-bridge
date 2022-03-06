import log from "loglevel";
import * as fs from "fs";
import { readContract } from "smartweave";
import inquirer from "inquirer";
import { initer, spinner, spinnerStyle } from "./initer.js";
import { green, red } from "./colors.js";
import {
  arweave,
  loadWallet,
  balanceOf,
  deployContract,
  addArticle,
  signTransaction,
  balanceDiffsAfterArchiving,
} from "../utils/arweave.js";
import { checkFileExtension, isParsable, isWordpress } from "../utils/types-checking.js";
import {
  setConfig,
  hasConfig,
  getConfig,
  delConfig,
  loadAccount,
  isSignedIn,
  sessionStatus,
  hasRegistered,
} from "./config.js";
import { getAllPosts } from "../utils/wp-api.js";
import beautify from "json-beautify";
import { readContractState } from "../utils/smartweave.js";
import CLI from "clui";
const { Spinner } = CLI;

export async function signup(argv) {
  const keyFile = argv.keyFile;
  const walletName = argv.walletName;

  if (await isSignedIn()) {
    console.log(red("ERROR: you are signed in, you can use the wallet!"));
    return;
  }

  if (await hasRegistered()) {
    console.log(red("ERROR: profile already created, please sign-in"));
    process.exit(1);
  }

  if (!checkFileExtension(keyFile, "json")) {
    console.log(
      red("ERROR: a non-JSON file path has been provided, please check again")
    );
    process.exit(1);
  }

  const keyfile = fs.readFileSync(keyFile, "utf8");

  if (!isParsable(keyfile)) {
    console.log(red(`ERROR: unable to parse ${red(keyFile)}`));
    process.exit(1);
  }

  const pk = JSON.parse(keyfile);
  const address = await loadWallet(pk);
  const balance = await balanceOf(address);

  console.log(
    green("signed in successfully!\n\n") +
      `address: ${green(address)}\n` +
      `name: ${green(walletName)}\n` +
      `balance: ${green(balance)} AR\n` +
      `deployed-contract: ${red("undefined")}\n\n`
  );

  console.log(
    `run ${green("wp-bridge deploy-contract")} to create a registry contract!\n`
  );
  console.log(`run ${green("wp-bridge profile")} to check your profile\n`);
  await setConfig("keyfile", { pk });
  await setConfig("name", { walletName });
  await setConfig("address", { address });
  await setConfig("status", { status: "signed-in" });

  process.exit(0);
}

export async function getProfile() {
  spinner("fetching the profile metadata").start();

  if (!(await isSignedIn()) && !(await hasRegistered())) {
    console.log(red("ERROR: please signup to create a profile"));
    spinner().stop();
    process.exit(1);
  }

  if (!(await sessionStatus())) {
    console.log(red("ERROR: please sign-in to fetch your profile"));
    spinner().stop();
    process.exit(1);
  }

  const config = await loadAccount();

  const address = config.address;
  const name = config.name;
  const contract = config.contract;
  // balance is dynamic
  const balance = config.balance;

  spinner().stop();

  console.log(
    `address: ${green(address)}\n` +
      `name: ${green(name)}\n` +
      `balance: ${green(balance)} AR\n` +
      `deployed-contract: ${green(contract)}`
  );

  process.exit(0);
}

export async function setup(argv) {
  const blog_name = argv.blogName;
  const blog_url = argv.blogUrl;

  spinner("attempt to deploy a blogs registry contract").start();

  if (!(await isSignedIn())) {
    console.log(red("ERROR: please signin to create the registry contract"));
    return;
  }

  if (typeof blog_name !== "string" || typeof blog_url !== "string") {
    console.log(
      red("ERROR: please make sure that blog's name & url are string literal")
    );
    process.exit(1);
  }

  if (!blog_url.startsWith("http://") && !blog_url.startsWith("https://")) {
    console.log(
      red("ERROR: please seed the URL with HTTP(s) included:\n") +
        green(`try http://${blog_url} or https://${blog_url}`)
    );
    process.exit(1);
  }

  const configs = await loadAccount();

  const transaction = await deployContract({
    blog_name: blog_name,
    blog_url: blog_url,
    deployer: await arweave.wallets.ownerToAddress(configs.pk.n),
    pk_n: configs.pk,
  });

  await setConfig("contract", { contract: transaction });
  spinner().stop();

  console.log("contract deployed successfully!");
  console.log(`contract-id: ${green(transaction)}`);

  process.exit(0);
}

export async function fetchContent(argv) {
  if (!(await isSignedIn())) {
    console.log(red("ERROR: please signin to create a smartweave contract"));
    return;
  }
  const transactions_array = [];
  const contract = (await getConfig("contract")).contract;
  const address = (await getConfig("address")).address;

  let loader = new Spinner(`reading the state of ${contract}`, spinnerStyle);
  loader.start();

  const contractState = await readContract(arweave, contract);
  const articlesIds = contractState["articles"].map((article) => article.wpaid);

  if (!contractState || !contractState.web2_url) {
    console.log(
      red(`ERROR: something went wrong while reading the state of ${contract}`)
    );
    loader.stop();
    process.exit(1);
  }

  loader.stop();

  console.log(`state loaded successfully!\n\n`);
  console.log(`blog's SWC: ${green(contract)}`);
  console.log(`blog name: ${green(contractState.name)}`);
  console.log(`blog url: ${green(contractState.web2_url)}\n\n`);

  loader = new Spinner(
    `fetching the database of ${contractState.web2_url}`,
    spinnerStyle
  );
  loader.start();

  const blogContent = await getAllPosts(contractState.web2_url);

  loader.stop();

  for (let article of blogContent) {
    loader = new Spinner(
      `creating archive transaction for ${article.id}`,
      spinnerStyle
    );
    loader.start();

    if (articlesIds.includes(article.id)) {
      loader.stop();
      console.log(
        `\t\t\tarticle having ID ${green(
          article.id
        )} has been already archived!\n\n`
      );
      continue;
    }

    const tx = await addArticle({
      data: article,
      contract_id: contract,
      pk_n: (await loadAccount()).pk,
    });

    transactions_array.push({
      tx_object: tx,
      tx_metadata: {
        slug: article.slug,
        wpaid: article.id,
      },
    });

    loader.stop();
  }
  const archiveStats = await balanceDiffsAfterArchiving({
    address,
    transactions_array,
  });

  if (!archiveStats.can_archive) {
    console.log(
      red("unsufficient wallet balance, please top-up AR in your wallet")
    );
    process.exit(1);
  }
  const balance_before = archiveStats["balance_before"];
  const balance_after = archiveStats["balance_after"];

  const message = green(
    `do you really want to archive the database  (y/n)\n\n` +
      `balance before archiving: ${balance_before} AR\n` +
      `balance after archiving: ${balance_after} AR\n\n`
  );

  const inquiry = await inquirer.prompt([
    {
      name: "archive",
      type: "input",
      message: message,
    },
  ]);

  if (inquiry.archive !== "y") {
    console.log(red("process terminated"));
    process.exit(1);
  }

  for (let tx_obj of transactions_array) {
    const tx = await signTransaction({
      pk_n: (await loadAccount()).pk,
      transaction_object: tx_obj,
    });
    console.log(`---> archived successfully:\n`);
    console.log(`\t\t\tarticle ID: ${green(tx.article_wpaid)}`);
    console.log(`\t\t\tarticle slug: ${green(tx.article_slug)}`);
    console.log(`\t\t\tarchive TXID: ${green(tx.txid)}\n\n`);
  }
  process.exit(0);
}


export async function loadContractState() {
  if (!(await isSignedIn())) {
    console.log(red("ERROR: please signin to create a smartweave contract"));
    return;
  }

  const contract_id = (await getConfig("contract")).contract;
  spinner(`loading the state of ${contract_id}`).start();
  const state = await readContractState(contract_id);
  spinner().stop();

  const prettifiedState = beautify(state, null, 2, 100);
  console.log(`state of ${green(contract_id)} loaded successfully!\n\n`);
  console.log(prettifiedState);

  process.exit(1);
}

export async function signOut() {
  if (!(await isSignedIn())) {
    console.log(red("ERROR: no signed-in session detected."));
    process.exit(1);
  }

  const inquiry = await inquirer.prompt([
    {
      name: "signout",
      type: "input",
      message: green("do you really want to sign-out? (y/n)"),
    },
  ]);

  if (inquiry.signout !== "y") {
    console.log(red("process terminated"));
    process.exit(1);
  }
  await delConfig("keyfile");
  setConfig("status", { status: "signed-out" });
  console.log(green("signed-out successfully!"));
  process.exit(1);
}

export async function signIn(argv) {
  const keyFile = argv.keyFile;

  if (await isSignedIn()) {
    // check's keyfile existence in configstore
    console.log(red("ERROR: user already signed in"));
    process.exit(1);
  }

  if (await sessionStatus()) {
    // double-check: configstore session status
    console.log(red("ERROR: user already signed in"));
    process.exit(1);
  }

  if (!checkFileExtension(keyFile, "json")) {
    console.log(
      red("ERROR: a non-JSON file path has been seeded, please check again")
    );
    process.exit(1);
  }

  const keyfile = fs.readFileSync(keyFile, "utf8");

  if (!isParsable(keyfile)) {
    console.log(red(`ERROR: unable to parse ${red(keyFile)}`));
    process.exit(1);
  }

  const pk = JSON.parse(keyfile);
  const new_address = await arweave.wallets.ownerToAddress(pk.n);
  const stored_address = (await getConfig("address")).address;
  const wallet_name = (await getConfig("name")).walletName;

  if (new_address !== stored_address) {
    console.log(
      red(`ERROR: the given keyfile is not the pk of ${stored_address}`)
    );
    process.exit(1);
  }

  await setConfig("keyfile", { pk });
  await setConfig("status", { status: "signed-in" });
  console.log(
    `welcome back\n` +
      `signed-in as ${green(`${new_address} (${wallet_name})`)}`
  );
  process.exit(0);
}

export async function checkWebsiteCompatibility(domain) {
  try {
    const status = await isWordpress(domain);

    if (status) {
      console.log(green(`${domain} is wordpress compatible!`));
      process.exit(0);
    }

    console.log(red(`${domain} is not wordpress compatible!`));
  } catch (error) {
    console.log(red("ERROR: something wrong happend"));
    process.exit(1);
  }
}
