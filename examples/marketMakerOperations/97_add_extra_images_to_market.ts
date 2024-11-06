import { ethers } from "ethers";
import { KalspsoConfig } from "kalypso-sdk/dist/types";
import { KalypsoSdk } from "kalypso-sdk";

import * as fs from "fs";
import { PublicKey } from "eciesjs";

import { marketId } from "../../requestData.json";

const kalypsoConfig: KalspsoConfig = JSON.parse(
  fs.readFileSync("./contracts/arb-sepolia.json", "utf-8")
);
const keys = JSON.parse(fs.readFileSync("./keys/arb-sepolia.json", "utf-8"));

const provider = new ethers.JsonRpcProvider(keys.rpc);
const wallet = new ethers.Wallet(keys.treasury_private_key, provider);

async function main(): Promise<string> {
  console.log("using address", await wallet.getAddress());
  const kalypso = new KalypsoSdk(wallet, kalypsoConfig);

  const ivsAttestationData = await kalypso
    .MarketPlace()
    .IvsEnclaveConnector()
    .getAttestation();
  console.log({ ivs_enclave_key: ivsAttestationData.secp_key });

  const ivsPubKey = PublicKey.fromHex(
    ivsAttestationData.secp_key as string
  );
  console.log({ ivs_compressed: ivsPubKey.compressed.toString("hex") });

  const ivsImagePcrs = KalypsoSdk.getRlpedPcrsFromAttestation(
    ivsAttestationData.attestation_document
  );

  const tx = await kalypso
    .MarketPlace()
    .addExtraImagesToMarket(marketId, [], [ivsImagePcrs]);
  console.log("Add Extra Images to Market", tx.hash);

  return "Done";
}

main().then(console.log).catch(console.log);
