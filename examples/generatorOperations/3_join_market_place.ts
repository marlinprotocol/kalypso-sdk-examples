import {
  ContractTransactionReceipt,
  ContractTransactionResponse,
  ethers,
} from "ethers";
import { KalspsoConfig } from "kalypso-sdk/dist/types";
import { KalypsoSdk } from "kalypso-sdk";
import * as fs from "fs";
import BigNumber from "bignumber.js";
import { marketId } from "../../requestData.json";

const kalypsoConfig: KalspsoConfig = JSON.parse(
  fs.readFileSync("./contracts/kalypso-chain.json", "utf-8"),
);
const keys = JSON.parse(fs.readFileSync("./keys/kalypso-chain.json", "utf-8"));

const provider = new ethers.JsonRpcProvider(keys.rpc);
const wallet = new ethers.Wallet(`${keys.generator_private_key}`, provider);

const computeAllocatedPerRequest = 1;
const proofGenerationCost = new BigNumber(10).pow(15).toFixed(0);
const proposedTimeInBlocks = 100000;

async function main() {
  console.log("using address", await wallet.getAddress());

  const kalypso = new KalypsoSdk(wallet, kalypsoConfig);

  let tx: ContractTransactionResponse;
  let receipt: ContractTransactionReceipt | null;

  tx = await kalypso
    .Generator()
    .joinMarketPlaceWithoutEnclave(
      marketId,
      computeAllocatedPerRequest,
      proofGenerationCost,
      proposedTimeInBlocks
    );
  receipt = await tx.wait();
  console.log("Joined Market Place Transaction: ", receipt?.hash);

  return "Done Joining Market Place";
}

main().then(console.log).catch(console.log);
