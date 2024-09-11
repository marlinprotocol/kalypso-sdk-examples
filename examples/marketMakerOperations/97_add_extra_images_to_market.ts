import { ethers } from "ethers";
import { KalspsoConfig } from "kalypso-sdk/dist/types";
import { KalypsoSdk } from "kalypso-sdk";

import * as fs from "fs";
import { PublicKey } from "eciesjs";

import { marketId } from "../../requestData.json";

const kalypsoConfig: KalspsoConfig = JSON.parse(
  fs.readFileSync("./contracts/kalypso-chain.json", "utf-8")
);
const keys = JSON.parse(fs.readFileSync("./keys/kalypso-chain.json", "utf-8"));

const provider = new ethers.JsonRpcProvider(keys.rpc);
const wallet = new ethers.Wallet(keys.treasury_private_key, provider);

async function main(): Promise<string> {
  console.log("using address", await wallet.getAddress());
  const kalypso = new KalypsoSdk(wallet, kalypsoConfig);

  const proverAttestationData = await kalypso
    .Generator()
    .GeneratorEnclaveConnector()
    .getAttestation();
  console.log({ prover_enclave_key: proverAttestationData.secp_key });
  const proverPubKey = PublicKey.fromHex(
    proverAttestationData.secp_key as string
  );
  console.log({ prover_compressed: proverPubKey.compressed.toString("hex") });

  const proverImagePcrs = KalypsoSdk.getRlpedPcrsFromAttestation(
    proverAttestationData.attestation_document
  );
  console.log({ proverImagePcrs });

  const ivsImagePcrs = proverImagePcrs;
  const tx = await kalypso
    .MarketPlace()
    .addExtraImagesToMarket(marketId, [proverImagePcrs], [ivsImagePcrs]);
  console.log("Add Extra Images to Market", tx.hash);

  return "Done";
}

main().then(console.log).catch(console.log);
