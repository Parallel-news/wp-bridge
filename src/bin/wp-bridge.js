#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { initer } from "./initer.js";
import { arweave, balanceOf } from "../utils/arweave.js";
import {
  signup,
  signOut,
  signIn,
  getProfile,
  setup,
  fetchContent,
  loadContractState,
  checkWebsiteCompatibility,
} from "./handlers.js";

const argvs = yargs(hideBin(process.argv))
  .command({
    command: "balance <address>",
    aliases: ["b"],
    handler: async (argv) => {
      initer();
      const balance = await balanceOf(argv.address);
      console.log(`balance: ${green(balance)} AR`);
    },
  })
  .command({
    command: "sign-up [key-file] [wallet-name]",
    builder: (yargs) => {
      yargs.options({
        "key-file": {
          describe: "path to the keyfile JSON",
          demandOption: true,
        },
        "wallet-name": {
          describe: "wallet's label/name",
          demandOption: true,
        },
      });
    },
    handler: async (argv) => {
      await initer();
      await signup(argv);
    },
  })
  .command({
    command: "profile",
    aliases: ["whoami"],
    handler: async (argv) => {
      await initer();
      const balance = await getProfile();
    },
  })
  .command({
    command: "deploy-contract",
    aliases: ["dc"],
    builder: (yargs) => {
      yargs.options({
        "blog-name": {
          describe: "name of the blog/site",
          demandOption: true,
        },
        "blog-url": {
          describe: "URL of the blog - http(s) required",
          demandOption: true,
        },
      });
    },
    handler: async (argv) => {
      await initer();
      await setup(argv);
    },
  })
  .command({
    command: "fetch-content",
    aliases: ["fc"],
    builder: (yargs) => {
      yargs.options({
        "dry-run": {
          describe: "simulate database fetching",
          demandOption: false,
        },
      });
    },
    handler: async (argv) => {
      await initer();
      await fetchContent(argv);
    },
  })
  .command({
    command: "read-registry",
    aliases: ["rgc"],
    handler: async (argv) => {
      await initer();
      await loadContractState();
    },
  })
  .command({
    command: "sign-out",
    handler: async (argv) => {
      // await initer();
      await signOut();
    },
  })
  .command({
    command: "sign-in [key-file]",
    builder: (yargs) => {
      yargs.options({
        "key-file": {
          describe: "path to the keyfile JSON",
          demandOption: true,
        },
      });
    },
    handler: async (argv) => {
      await initer();
      await signIn(argv);
    },
  })
  .command({
    command: "is-wordpress [domain]",
    builder: (yargs) => {
      yargs.options({
        "domain": {
          describe: "domain name. E.g. arweave.news",
          demandOption: true,
        },
      });
    },
    handler: async (argv) => {
      await checkWebsiteCompatibility(argv.domain);
    },
  })
  .help().argv;
