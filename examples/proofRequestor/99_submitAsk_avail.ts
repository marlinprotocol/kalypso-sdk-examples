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
  fs.readFileSync("./contracts/arb-sepolia.json", "utf-8")
);
const keys = JSON.parse(fs.readFileSync("./keys/arb-sepolia.json", "utf-8"));

const reward = new BigNumber(10).pow(18).multipliedBy(145).div(10).toFixed(0);

const createAskTest = async () => {
  const provider = new ethers.JsonRpcProvider(keys.rpc);
  const wallet = new ethers.Wallet(keys.treasury_private_key, provider);

  console.log("using address", await wallet.getAddress());

  let abiCoder = new ethers.AbiCoder();
  let inputBytes = abiCoder.encode(["string[1]"], [[public_input.public]]);
  console.log({ inputBytes });

  const kalypso = new KalypsoSdk(wallet as any, kalypsoConfig);
  const matchingEngineKey = (
    await kalypso.MarketPlace().readMePubKeyInContract()
  ).toString();

  const secretString = JSON.stringify(secret);

  const latestBlock = await provider.getBlockNumber();

  const assignmentDeadline = new BigNumber(latestBlock).plus(100000000000);
  console.log({
    latestBlock,
    assignmentDeadline: assignmentDeadline.toFixed(0),
  });
  const proofGenerationTimeInBlocks = new BigNumber(100000000000);

  // 1. NOTES: Encrypt the data on client side, i.e users themselves can encrypt the requests and send.
  const encryptedRequestData = await MarketPlace.createEncryptedRequestData(
    inputBytes,
    Buffer.from(secretString),
    marketId,
    matchingEngineKey
  );
  // console.log(JSON.stringify(encryptedRequestData));

  // 2. NOTES: Additional check can be performed both at client-level or avail-server to see if the request is valid...
  const isValid = await kalypso
    .MarketPlace()
    .verifyEncryptedInputs(encryptedRequestData, marketId.toString());

  if (!isValid) {
    throw new Error("Better not create a request, if it is not provable to prevent loss of funds");
  }

  // 3. NOTES: Avail server should have a new end point that creates a request. STEP2 and STEP3 can be combined in avail server into a single point.
  const askRequest = await kalypso.MarketPlace().createAskWithEncryptedSecretAndAcl(
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
  const tx = await askRequest.wait();
  console.log("Ask Request Hash: ", askRequest.hash, " at block", tx?.blockNumber);

  const askId = await kalypso.MarketPlace().getAskId(tx!);
  const proof = await kalypso.MarketPlace().getProofByAskId(askId, tx!.blockNumber);
  console.log({ proof })
};

createAskTest();
