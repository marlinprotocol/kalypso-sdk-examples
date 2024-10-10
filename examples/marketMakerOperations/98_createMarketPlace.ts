import { ethers } from "ethers";
import { KalspsoConfig } from "kalypso-sdk/dist/types";
import { KalypsoSdk } from "kalypso-sdk";
import { PublicKey } from "eciesjs";
import { mockVerifier } from "../../requestData.json";

import * as fs from "fs";
import { rlpedPcrs, someRandomPcrs } from "../utils";

const kalypsoConfig: KalspsoConfig = JSON.parse(
  fs.readFileSync("./contracts/arb-sepolia.json", "utf-8"),
);
const keys = JSON.parse(fs.readFileSync("./keys/arb-sepolia.json", "utf-8"));

const provider = new ethers.JsonRpcProvider(keys.rpc);
const wallet = new ethers.Wallet(keys.treasury_private_key, provider);

async function main(): Promise<string> {
  console.log("using address", await wallet.getAddress());
  const kalypso = new KalypsoSdk(wallet, kalypsoConfig);
  const marketSetupData = {
    zkAppName: "aztec prover net",
  };
  const marketBytes = Buffer.from(JSON.stringify(marketSetupData), "utf-8");

  const wrapperAddress = mockVerifier;
  const slashingPenalty = "10000000000";

  const attestation = await kalypso.MarketPlace().MatchingEngineEnclaveConnector().getAttestation();
  const randomPcrs = KalypsoSdk.getRlpedPcrsFromAttestation(
    attestation.attestation_document
  );
  const tx = await kalypso
    .MarketPlace()
    .createPublicMarket(
      marketBytes,
      wrapperAddress,
      slashingPenalty,
      randomPcrs
    );
  console.log("Market Creation Receipt hash", tx.hash);

  return "Done";
}

main().then(console.log).catch(console.log);
