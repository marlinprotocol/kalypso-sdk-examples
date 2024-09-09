import { KalspsoConfig } from "kalypso-sdk/dist/types";
import { KalypsoSdk } from "kalypso-sdk";

import { ethers } from "ethers";

import * as secret from "../../avail_private_auth.json";
import * as public_input from "../../avail.json";
import BigNumber from "bignumber.js";

import * as fs from "fs";
import { marketId } from "../../requestData.json";
import { MarketPlace } from "kalypso-sdk/dist/operators/marketPlace";

const kalypsoConfig: KalspsoConfig = JSON.parse(
  fs.readFileSync("./contracts/kalypso-chain.json", "utf-8"),
);
const keys = JSON.parse(fs.readFileSync("./keys/kalypso-chain.json", "utf-8"));

const reward = new BigNumber(10).pow(18).multipliedBy(145).div(10).toFixed(0);

const createAskTest = async () => {
  const provider = new ethers.JsonRpcProvider(keys.rpc);
  const wallet = new ethers.Wallet(keys.treasury_private_key, provider);

  console.log("using address", await wallet.getAddress());

  let abiCoder = new ethers.AbiCoder();
  let inputBytes = abiCoder.encode(["string[1]"], [[public_input.public]]);
  console.log({ inputBytes });

  const kalypso = new KalypsoSdk(wallet as any, kalypsoConfig);
  // const matchingEngineKey = (
  //   await kalypso.MarketPlace().readMePubKeyInContract()
  // ).toString();
  const matchingEngineKey =
    "0x820bfa6059825247edeed10b2ef8a07b7e89d12283566538378d5fcc6dd7a47e09d67375960f2491251475cc11f5f8dc5d1802472b81b7d4f8626a7ebdddcf1e";

  const secretString = JSON.stringify(secret);

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
      date.getSeconds(),
    );
  }

  // 1. NOTES: Encrypt the data on client side, i.e users themselves can encrypt the requests and send.
  const encryptedRequestData = await MarketPlace.createEncryptedRequestData(
    inputBytes,
    Buffer.from(secretString),
    marketId,
    matchingEngineKey,
  );
  // console.log(JSON.stringify(encryptedRequestData));
  {
    const date = new Date();
    console.log("encryption done", date.getMinutes(), ":", date.getSeconds());
  }

  // 2. NOTES: Additional check can be performed both at client-level or avail-server to see if the request is valid...
  const isValid = await kalypso
    .MarketPlace()
    .verifyEncryptedInputs(
      encryptedRequestData,
      "http://localhost:3000/decryptRequest",
      marketId.toString(),
    );

  if (!isValid) {
    throw new Error(
      "Better not create a request, if it is not provable to prevent loss of funds",
    );
  }

  {
    const date = new Date();
    console.log(
      "validity checked and placing request on chain",
      date.getMinutes(),
      ":",
      date.getSeconds(),
    );
  }

  const possibleAskId = await kalypso.MarketPlace().askCounter(); // this is a wrong way to get asks

  // 3. NOTES: Avail server should have a new end point that creates a request. STEP2 and STEP3 can be combined in avail server into a single point.
  const askRequest = await kalypso
    .MarketPlace()
    .createAskWithEncryptedSecretAndAcl(
      marketId,
      encryptedRequestData.publicInputs,
      reward,
      assignmentDeadline.toFixed(0),
      proofGenerationTimeInBlocks.toFixed(0),
      await wallet.getAddress(),
      0, // TODO: keep this 0 for now
      encryptedRequestData.encryptedSecret,
      encryptedRequestData.acl,
    );
  let tx = await askRequest.wait(10);
  const date = new Date();
  console.log(
    "completed placing the request on chain",
    date.getMinutes(),
    ":",
    date.getSeconds(),
  );

  console.log(
    "Ask Request Hash: ",
    askRequest.hash,
    " at block",
    tx?.blockNumber,
  );

  const proof = await kalypso
    .MarketPlace()
    .getProofByAskId(possibleAskId, tx!.blockNumber);
  console.log({ proof });
};

createAskTest();
