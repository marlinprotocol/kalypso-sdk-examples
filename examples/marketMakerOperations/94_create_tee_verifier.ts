import { ethers } from "ethers";
import { KalspsoConfig } from "kalypso-sdk/dist/types";
import { KalypsoSdk } from "kalypso-sdk";

import * as fs from "fs";
import { PublicKey } from "eciesjs";

const kalypsoConfig: KalspsoConfig = JSON.parse(
  fs.readFileSync("./contracts/arb-sepolia.json", "utf-8")
);
const keys = JSON.parse(fs.readFileSync("./keys/arb-sepolia.json", "utf-8"));

const provider = new ethers.JsonRpcProvider(keys.rpc);
const wallet = new ethers.Wallet(keys.treasury_private_key, provider);

async function main(): Promise<string> {
  console.log("using address", await wallet.getAddress());
  const kalypso = new KalypsoSdk(wallet, kalypsoConfig);
  //
  // 0x701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82 private
  // 02e393c954d127d79d56b594a46df6b2e053f49446759eac612dbe12ade3095c67 pubkey compressed
  // 04e393c954d127d79d56b594a46df6b2e053f49446759eac612dbe12ade3095c679eeda1cafbff9d8fe17b8550d9d0d1fd71a2f5849b520c7bde795a3600b54616 pubkey uncompressed
  // const proverAttestationData = await kalypso
  //   .Generator()
  //   .GeneratorEnclaveConnector()
  //   .getMockAttestation(
  //     "0xe393c954d127d79d56b594a46df6b2e053f49446759eac612dbe12ade3095c679eeda1cafbff9d8fe17b8550d9d0d1fd71a2f5849b520c7bde795a3600b54616",
  //   );

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

  const data = await kalypso
    .MarketPlace()
    .createTeeVerifier(
      await wallet.getAddress(),
      kalypsoConfig.tee_verifier_deployer,
      kalypsoConfig.attestation_verifier,
      proverImagePcrs
    );

  console.log("Tee Verifier Creation Receipt hash", data.hash);

  return "Done";
}

main().then(console.log).catch(console.log);
