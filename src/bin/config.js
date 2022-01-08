import Configstore from "configstore";
const config = new Configstore("WPBRIDGE2");
import { balanceOf } from "../utils/arweave.js";

export async function setConfig(key, data) {
  config.set(key, data);
}

export async function hasConfig(key) {
  return config.has(key);
}

export async function getConfig(key) {
  return config.get(key);
}

export async function delConfig(key) {
  return config.delete(key);
}

export async function loadAccount() {
  const pk = (await getConfig("keyfile"))?.pk;
  const address = (await getConfig("address")).address;
  const name = (await getConfig("name")).walletName;
  const contract = (await getConfig("contract"))?.contract;
  const status = (await getConfig("status"))?.status;
  const balance = await balanceOf(address);

  return {
    address,
    name,
    balance,
    contract,
    status,
    pk,
  };
}

export async function hasRegistered() {
  return await hasConfig("contract");
}

export async function sessionStatus() {
  return (await getConfig("status")).status === "signed-in" ? true : false;
}

export async function isSignedIn() {
  return (await hasConfig("keyfile")) ? true : false;
}
