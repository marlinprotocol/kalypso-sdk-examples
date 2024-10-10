import { KalspsoConfig } from "kalypso-sdk/dist/types";
import { KalypsoSdk } from "kalypso-sdk";

import { ethers } from "ethers";

import BigNumber from "bignumber.js";

import * as fs from "fs";
import { marketId } from "../../requestData.json";
import { MarketPlace } from "kalypso-sdk/dist/operators/marketPlace";

const kalypsoConfig: KalspsoConfig = JSON.parse(
  fs.readFileSync("./contracts/arb-sepolia.json", "utf-8")
);
const keys = JSON.parse(fs.readFileSync("./keys/arb-sepolia.json", "utf-8"));

const reward = new BigNumber(10).pow(18).multipliedBy(145).div(10).toFixed(0);

const createAskTest = async () => {
  const provider = new ethers.JsonRpcProvider(keys.rpc);
  const wallet = new ethers.Wallet(keys.treasury_private_key, provider);

  console.log("using address", await wallet.getAddress());

  let abiCoder = new ethers.AbiCoder();
  let inputBytes = abiCoder.encode(["string"], ["43e72a96-084a-43c6-9dd6-c55f26939e07"]); // only do base parity from here right now
  console.log({ inputBytes });

  const kalypso = new KalypsoSdk(wallet as any, kalypsoConfig);
  const matchingEngineKey = (
    await kalypso.MarketPlace().readMePubKeyInContract()
  ).toString();
  // const matchingEngineKey =
  //   "0x83717e9d52af153aeee3b0f6258b40581ee0921cefc47a6e1cd3258aa85189151c232098116477dd901f20216fe9b25a4569cbce61f6fc33eca3070b4b2405f1";
  console.log({ matchingEngineKey });


  // const latestBlock = await provider.getBlockNumber();

  const assignmentDeadline = new BigNumber(0).plus(1000000000000);
  console.log({
    // latestBlock,
    assignmentDeadline: assignmentDeadline.toFixed(0),
  });
  const proofGenerationTimeInBlocks = new BigNumber(1000000000000);
  {
    const date = new Date();
    console.log(
      "start encrypting the request",
      date.getMinutes(),
      ":",
      date.getSeconds()
    );
  }

  const empty = Buffer.from("0x");

  // 2.TODO. Verify before whether this request is provable before shooting request out
  const askRequest = await kalypso
    .MarketPlace()
    .createAsk(
      marketId,
      inputBytes,
      reward,
      assignmentDeadline.toFixed(0),
      proofGenerationTimeInBlocks.toFixed(0),
      await wallet.getAddress(),
      0, // TODO: keep this 0 for now
      empty
    );
  let tx = await askRequest.wait(10);
  const date = new Date();
  console.log(
    "completed placing the request on chain",
    date.getMinutes(),
    ":",
    date.getSeconds()
  );

  console.log(
    "Ask Request Hash: ",
    askRequest.hash,
    " at block",
    tx?.blockNumber
  );

  const askId = await kalypso.MarketPlace().getAskId(tx as any);

  const proof = await kalypso
    .MarketPlace()
    .getProofByAskId(askId, tx!.blockNumber);
  console.log({ proof });
};

createAskTest();
