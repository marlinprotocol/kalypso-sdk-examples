import { AbiCoder, ethers } from "ethers";
import { KalspsoConfig } from "kalypso-sdk/dist/types";
import { KalypsoSdk } from "kalypso-sdk";
import { teeVerifier } from "../../requestData.json";

import * as fs from "fs";
import { PublicKey } from "eciesjs";

const kalypsoConfig: KalspsoConfig = JSON.parse(fs.readFileSync("./contracts/arb-sepolia.json", "utf-8"));
const keys = JSON.parse(fs.readFileSync("./keys/arb-sepolia.json", "utf-8"));

const provider = new ethers.JsonRpcProvider(keys.rpc);
const wallet = new ethers.Wallet(keys.private_key, provider);

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

  // const wrapperAddress = "0xD8bfa8E31Caa0088cD86993a0D3e2329Fc3A8B8d";

  const wrapperAddress = teeVerifier;
  const slashingPenalty = "10000000000";

  // const ivsAttestationData = await kalypso.MarketPlace().IvsEnclaveConnector().getAttestation();
  // console.log({ ivs_enclave_ecies_key: ivsAttestationData.secp_key });
  // const ivsPubkey = PublicKey.fromHex(ivsAttestationData.secp_key as string);
  // console.log({ ivs_compressed: ivsPubkey.compressed.toString("hex") });
  // const ivsImagePcrs = KalypsoSdk.getRlpedPcrsFromAttestation(ivsAttestationData.attestation_document);

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
  
  const tx = await kalypso.MarketPlace().createPrivateMarket(marketBytes, wrapperAddress, slashingPenalty, proverImagePcrs);
  console.log("Market Creation Receipt hash", tx.hash);

  const receipt = await tx.wait();

  const marketId = await kalypso.MarketPlace().getMarketId(receipt!);

  console.log({marketId});
  return "Done";
}

main().then(console.log).catch(console.log);
