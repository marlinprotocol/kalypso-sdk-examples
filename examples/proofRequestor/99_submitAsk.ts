import { KalspsoConfig } from "kalypso-sdk/dist/types";
import { KalypsoSdk } from "kalypso-sdk";

import { ethers } from "ethers";

import BigNumber from "bignumber.js";

import * as fs from "fs";
import { marketId } from "../../requestData.json";

const attestation = {
  "enclavePubKey": "0xe646f8b0071d5ba75931402522cc6a5c42a84a6fea238864e5ac9a0e12d83bd36d0c8109d3ca2b699fce8d082bf313f5d2ae249bb275b6b6e91e0fcd9262f4bb",
  "PCR0": "0x189038eccf28a3a098949e402f3b3d86a876f4915c5b02d546abb5d8c507ceb1755b8192d8cfca66e8f226160ca4c7a6",
  "PCR1": "0x5d3938eb05288e20a981038b1861062ff4174884968a39aee5982b312894e60561883576cc7381d1a7d05b809936bd16",
  "PCR2": "0x6c3ef363c488a9a86faa63a44653fd806e645d4540b40540876f3b811fc1bceecf036a4703f07587c501ee45bb56a1aa",
  "timestampInMilliseconds": 1729701976691
};

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
  let attestation_object = attestation;
    const types = ["tuple(bytes enclavePubKey, bytes PCR0, bytes PCR1, bytes PCR2, uint256 timestampInMilliseconds)"];
    let inputBytes = abiCoder.encode(types, [attestation_object]);

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
