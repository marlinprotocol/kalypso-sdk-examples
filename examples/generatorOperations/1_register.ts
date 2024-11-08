import {
  ContractTransactionReceipt,
  ContractTransactionResponse,
  ethers,
} from "ethers";
import { KalspsoConfig } from "kalypso-sdk/dist/types";
import { KalypsoSdk } from "kalypso-sdk";
import * as fs from "fs";

const kalypsoConfig: KalspsoConfig = JSON.parse(
  fs.readFileSync("./contracts/arb-sepolia.json", "utf-8")
);
const keys = JSON.parse(fs.readFileSync("./keys/arb-sepolia.json", "utf-8"));

const provider = new ethers.JsonRpcProvider(keys.rpc);
const wallet = new ethers.Wallet(`${keys.generator_private_key}`, provider);

const declaredCompute = 100;

const generator = {
  display_name: "display name",
  display_description: "description",
  contact_email: "contact_email@contact_email.com",
  github: "coming soon",
  repo_url: "coming soom",
  version: "1",
  categories: ['best', 'higher APR'],
  tags: ['tester', 'first', 'ui'],
  license: "nothing",
  terms_of_service_url: "nothing...",
  privacy_policy_url: "testing",
};

const generatorMetadata = Buffer.from(JSON.stringify(generator), "utf-8");

async function main() {
  console.log("using address", await wallet.getAddress());
  const rewardAddress = await wallet.getAddress(); // address which receives the proof generation rewards

  const kalypso = new KalypsoSdk(wallet, kalypsoConfig);

  let tx: ContractTransactionResponse;
  let receipt: ContractTransactionReceipt | null;

  tx = await kalypso
    .Generator()
    .register(rewardAddress, declaredCompute, generatorMetadata);
  receipt = await tx.wait();
  console.log("Registration Transaction: ", receipt?.hash);

  return "Done Registration";
}

main().then(console.log).catch(console.log);
