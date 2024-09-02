import { ethers } from "ethers";
import { KalspsoConfig } from "kalypso-sdk/dist/types";
import { KalypsoSdk } from "kalypso-sdk";

import * as fs from "fs";

const kalypsoConfig: KalspsoConfig = JSON.parse(
  fs.readFileSync("./contracts/kalypso-chain.json", "utf-8"),
);
const keys = JSON.parse(fs.readFileSync("./keys/kalypso-chain.json", "utf-8"));

const provider = new ethers.JsonRpcProvider(keys.rpc);
const wallet = new ethers.Wallet(keys.admin_private_key, provider);

async function main(): Promise<string> {
  console.log("using address", await wallet.getAddress());
  const kalypso = new KalypsoSdk(wallet, kalypsoConfig);

  const result = await kalypso
    .Admin()
    .grantUpdaterRole(await wallet.getAddress());

  console.log({ result: result.hash });

  return "Done";
}

main().then(console.log).catch(console.log);
