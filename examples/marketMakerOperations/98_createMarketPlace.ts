import { ethers } from "ethers";
import { KalspsoConfig } from "kalypso-sdk/dist/types";
import { KalypsoSdk } from "kalypso-sdk";
import {zkb_verifier_wrapper} from "../../contracts/arb-sepolia.json"

import * as fs from "fs";
import { PublicKey } from "eciesjs";

const kalypsoConfig: KalspsoConfig = JSON.parse(fs.readFileSync("./contracts/arb-sepolia.json", "utf-8"));
const keys = JSON.parse(fs.readFileSync("./keys/arb-sepolia.json", "utf-8"));

const provider = new ethers.JsonRpcProvider(keys.rpc);
const wallet = new ethers.Wallet(keys.treasury_private_key, provider);

async function main(): Promise<string> {
  console.log("using address", await wallet.getAddress());
  const kalypso = new KalypsoSdk(wallet, kalypsoConfig);
  const marketSetupData = {
    zkAppName: "Name of the app",
    proverCode: "link to the prover code",
    verifierCode: "link to the verifier code",
    proverOysterImage: "link to the oyster code",
    inputOuputVerifierUrl: "ivs optional for private markets",
  };
  const marketBytes = Buffer.from(JSON.stringify(marketSetupData), "utf-8");

  const slashingPenalty = "10000000000";

  const proverAttestationData = await kalypso.Generator().GeneratorEnclaveConnector().getAttestation();
  console.log({ prover_enclave_key: proverAttestationData.secp_key });
  const proverPubKey = PublicKey.fromHex(proverAttestationData.secp_key as string);
  console.log({ prover_compressed: proverPubKey.compressed.toString("hex") });

  const proverImagePcrs = KalypsoSdk.getRlpedPcrsFromAttestation(proverAttestationData.attestation_document);
  console.log({ proverImagePcrs });

  const tx = await kalypso.MarketPlace().createPrivateMarket(marketBytes, zkb_verifier_wrapper, slashingPenalty, proverImagePcrs);
  console.log("Market Creation Receipt hash", tx.hash);

  return "Done";
}

main().then(console.log).catch(console.log);
