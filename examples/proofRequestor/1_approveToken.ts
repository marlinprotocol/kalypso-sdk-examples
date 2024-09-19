import { KalspsoConfig } from "kalypso-sdk/dist/types";
import { KalypsoSdk } from "kalypso-sdk";
import { ethers } from "ethers";

import * as fs from "fs";

const kalypsoConfig: KalspsoConfig = JSON.parse(fs.readFileSync("./contracts/arb-sepolia.json", "utf-8"));

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC);
  const private_key = `${process.env.PRIVATE_KEY}`;
  const wallet = new ethers.Wallet(private_key, provider);
  console.log("using address", await wallet.getAddress());
  const approval_amount = "10000000000000000000000";

  const kalypso = new KalypsoSdk(wallet, kalypsoConfig);
  let payment_token_approval = await kalypso.MarketPlace().approvePaymentTokenToMarketPlace(approval_amount);
  let py_approval_tx = await payment_token_approval.wait();
  console.log("Payment Approval Tx: ", py_approval_tx?.hash);
  console.log("Payment token approval done");
  return "Approval done";
}

main().then(console.log).catch(console.log);
