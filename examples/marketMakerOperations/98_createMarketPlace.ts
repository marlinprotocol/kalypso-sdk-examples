import { ethers } from "ethers";
import { KalspsoConfig } from "kalypso-sdk/dist/types";
import { KalypsoSdk } from "kalypso-sdk";
import { attestation_zk_verifier_wrapper } from "../../requestData.json";

import * as fs from "fs";

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
    zk_app_name: "Attestation Zk Prover Market",
    prover_code: "coming soon ...",
    verifier_code: "coming soon ...",
    prover_oyster_image: "coming soon ...",
    input_output_verifier_url: "not available in testnet...",
    description: "market for getting the attestation zk proofs",
    website: "coming soon ...",
    twitter: "coming soon ...",
    discord: "coming soon ...",
    github: "coming soon ...",
    license: "coming soon ...",
    categories: ["attestation", "zkproofs"],
    tags: ["attestation", "zkproofs"],
    contact_email: "comingsoon@comingsoon"
  };
  const marketBytes = Buffer.from(JSON.stringify(marketSetupData), "utf-8");

  const wrapperAddress = attestation_zk_verifier_wrapper;
  const slashingPenalty = "10000000000";

  const attestation = await kalypso.MarketPlace().IvsEnclaveConnector().getAttestation();
  const pcrs = KalypsoSdk.getRlpedPcrsFromAttestation(
    attestation.attestation_document
  );
  const tx = await kalypso
    .MarketPlace()
    .createPublicMarket(
      marketBytes,
      wrapperAddress,
      slashingPenalty,
      pcrs
    );
  console.log("Market Creation Receipt hash", tx.hash);

  return "Done";
}

main().then(console.log).catch(console.log);
