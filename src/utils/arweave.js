import Arweave from "arweave";
import log from "loglevel";
import { red } from "../bin/colors.js";
import { stateTemplate, BLOG_SWC_SRC } from "../contracts/utils.js";

export const arweave = Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https",
  timeout: 20000,
  logging: false,
});

export async function balanceOf(address) {
  const balance = (await arweave.wallets.getBalance(address)) * 1e-12;

  return balance;
}

export async function loadWallet(keyfile) {
  try {
    const address = await arweave.wallets.ownerToAddress(keyfile.n);

    return address;
  } catch (error) {
    log.error(red("unable to load an Arweave wallet from the given keyfile"));
    process.exit(1);
  }
}

export async function deployContract({
  blog_name,
  blog_url,
  deployer,
  pk_n,
} = {}) {
  try {
    const state = stateTemplate;
    // set the state
    state.name = blog_name;
    state.web2_url = blog_url;
    state.maintainers.push(deployer);

    const tx = await arweave.createTransaction(
      {
        data: JSON.stringify(state),
      },
      pk_n
    );

    tx.addTag("App-Name", "SmartWeaveContract");
    tx.addTag("App-Version", "0.3.0");
    tx.addTag("Contract-Src", BLOG_SWC_SRC);
    tx.addTag("Content-Type", "application/json");
    tx.addTag("Protocol-Name", "WP-Bridge");
    tx.addTag("Protocol-Action", "Launch-Registry");

    await arweave.transactions.sign(tx, pk_n);
    await arweave.transactions.post(tx);

    if (tx.id) {
      return tx.id;
    }
  } catch (error) {
    console.log(
      red(
        "ERROR: something went wrong while deploying the registry contract, please try again :("
      )
    );
    process.exit(1);
  }
}

export async function addArticle({ data, contract_id, pk_n } = {}) {
  try {
    const id = data.id;
    const slug = data.slug;

    const tx = await arweave.createTransaction(
      {
        data: JSON.stringify(data),
      },
      pk_n
    );

    const input = `{"function": "addArticle", "id": ${id}, "slug": "${slug}"}`;
    // SmartWeave Tags
    tx.addTag("App-Name", "SmartWeaveAction");
    tx.addTag("App-Version", "0.3.0");
    tx.addTag("Contract", contract_id);
    tx.addTag("Input", input);
    // WP-Bridge Tags
    tx.addTag("Protocol-Name", "WP-Bridge");
    tx.addTag("Protocol-Action", "Add-Archive");
    tx.addTag("Content-Type", "application/json");

    return tx;
  } catch (error) {
    console.log(red(`ERROR: ${error.name} : ${error.description}`));
    process.exit(0);
  }
}

async function calculateTotalTransactionSize(transactions_array) {
  // tx.reward is a string
  const sizes = transactions_array.map(tx => +(tx.tx_object.reward));
  const totalSize = sizes.reduce((a,b) => a + b, 0);

  return totalSize;
};

export async function balanceDiffsAfterArchiving({address, transactions_array} = {}) {

  const stats = {
    can_archive: false,
    balance_before: 0,
    balance_after: 0
  }

  const totalArchiveSize = await calculateTotalTransactionSize(transactions_array);
  const addressBalance = +(await arweave.wallets.getBalance(address));
  const diff = addressBalance - totalArchiveSize;

  if (diff <= 0) {
    return stats;
  }

  stats.can_archive = true;
  stats.balance_before = addressBalance * 1e-12;
  stats.balance_after = diff * 1e-12;

  return stats;

}

export async function signTransaction({pk_n, transaction_object} = {}) {
  const tx = transaction_object.tx_object;

  await arweave.transactions.sign(tx, pk_n);
  await arweave.transactions.post(tx);

  return {
    txid: tx.id,
    article_slug: transaction_object.tx_metadata.slug,
    article_wpaid: transaction_object.tx_metadata.wpaid
  }
}
