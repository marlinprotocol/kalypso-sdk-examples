import { ethers } from "ethers";
import { KalspsoConfig } from "kalypso-sdk/dist/types";
import { KalypsoSdk } from "kalypso-sdk";
import * as fs from "fs";

const kalypsoConfig: KalspsoConfig = JSON.parse(fs.readFileSync("./contracts/arb-sepolia.json", "utf-8"));
const keys = JSON.parse(fs.readFileSync("./keys/arb-sepolia.json", "utf-8"));

const provider = new ethers.JsonRpcProvider(keys.rpc);
const wallet = new ethers.Wallet(`${keys.generator_private_key}`, provider);

async function main() {
  console.log("using address", await wallet.getAddress());

  const kalypso = new KalypsoSdk(wallet, kalypsoConfig);

  const attestationResult = await kalypso.MarketPlace().MatchingEngineEnclaveConnector().getAttestation();

  console.log({ attestationResult });

  const data = await kalypso
    .MarketPlace()
    .MatchingEngineEnclaveConnector()
    .getAttestationSignature(attestationResult.attestation_document.toString(), await wallet.getAddress());

  console.log(JSON.stringify(data, null, 4)); // signed attestation from the attestation verifier

  return "Done";
}

main().then(console.log).catch(console.log);
