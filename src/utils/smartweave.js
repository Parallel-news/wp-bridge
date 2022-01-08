import { arweave } from "./arweave.js";
import { readContract } from "smartweave";
import { red } from "../bin/colors.js";

export async function readContractState(contract_id) {
  try {
    const state = await readContract(arweave, contract_id);
    return state;
  } catch (error) {
    console.log(
      red(
        `ERROR: something went wrong while reading the state of ${contract_id} `
      )
    );
    process.exit(0);
  }
}
