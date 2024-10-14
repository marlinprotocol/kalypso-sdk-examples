import { AbiCoder, ethers } from "ethers";
import { KalspsoConfig } from "kalypso-sdk/dist/types";
import { KalypsoSdk } from "kalypso-sdk";

import * as fs from "fs";
import { PublicKey } from "eciesjs";

const kalypsoConfig: KalspsoConfig = JSON.parse(fs.readFileSync("./contracts/arb-sepolia.json", "utf-8"));
const keys = JSON.parse(fs.readFileSync("./keys/arb-sepolia.json", "utf-8"));

const provider = new ethers.JsonRpcProvider(keys.rpc);
const wallet = new ethers.Wallet(keys.private_key, provider);

async function main(): Promise<string> {
  console.log("using address", await wallet.getAddress());
  const kalypso = new KalypsoSdk(wallet, kalypsoConfig);

  // const proverAttestationData = await kalypso.Generator().GeneratorEnclaveConnector().getAttestation();
  // console.log({ prover_enclave_key: proverAttestationData.secp_key });
  // const proverPubKey = PublicKey.fromHex(proverAttestationData.secp_key as string);
  // console.log({ prover_compressed: proverPubKey.compressed.toString("hex") });

  // const proverImagePcrs = KalypsoSdk.getRlpedPcrsFromAttestation(proverAttestationData.attestation_document);
  // console.log({ proverImagePcrs });

  const pcrJson = {
    "PCR0": "79f30b845cf0fe67f960adc84cdd5e80bcf06a96640acf4dbc393e277ba73782020c16188ad3fd0f60b0121a2f2da968",
    "PCR1": "bcdf05fefccaa8e55bf2c8d6dee9e79bbff31e34bf28a99aa19e6b29c37ee80b214a414b7607236edf26fcb78654e63f",
    "PCR2": "c580b951db7b9981bde4ec14d7c1bc8cce2d51b873cdd4a47a34c5d4279163b0928c82bc3410cc405301be66357f3ddd"
  }


  const proverImagePcrs = new AbiCoder().encode(["bytes", "bytes", "bytes"], [pcrJson.PCR0, pcrJson.PCR1, pcrJson.PCR2]);

  const data = await kalypso
    .MarketPlace()
    .createTeeVerifier(await wallet.getAddress(), kalypsoConfig.tee_verifier_deployer, kalypsoConfig.attestation_verifier, proverImagePcrs);

  console.log("Tee Verifier Creation Receipt hash", data.hash);

  const tx = await data.wait();
  const teeVerifierAddress = await kalypso.MarketPlace().getTeeVerifierAddress(tx!);

  console.log({teeVerifierAddress});

  return "Done";
}

main().then(console.log).catch(console.log);
