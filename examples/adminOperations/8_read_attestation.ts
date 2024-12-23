import { ethers } from "ethers";
import { KalspsoConfig } from "kalypso-sdk/dist/types";
import { KalypsoSdk } from "kalypso-sdk";
import * as fs from "fs";
import { assert } from "console";

const kalypsoConfig: KalspsoConfig = JSON.parse(fs.readFileSync("./contracts/arb-sepolia.json", "utf-8"));
const keys = JSON.parse(fs.readFileSync("./keys/arb-sepolia.json", "utf-8"));

const provider = new ethers.JsonRpcProvider(keys.rpc);
const wallet = new ethers.Wallet(`${keys.generator_private_key}`, provider);

async function main() {
  console.log("using address", await wallet.getAddress());

  const kalypso = new KalypsoSdk(wallet as any, kalypsoConfig);

  const attestationResult1 = await kalypso.MarketPlace().MatchingEngineEnclaveConnector().getAttestation(false);
  const attestationResult2 = await kalypso.MarketPlace().MatchingEngineEnclaveConnector().getAttestation(true);

  const doc1 = attestationResult1.attestation_document;
  const doc2 = attestationResult2.attestation_document;

  const key1 = attestationResult1.secp_key;
  const key2 = attestationResult2.secp_key;

  console.log({doc1, doc2});

  assert(key1 == key2, "Key Doesn't match");

  return "Done";
}

main().then(console.log).catch(console.log);
