import { KalspsoConfig } from "kalypso-sdk/dist/types";
import { KalypsoSdk } from "kalypso-sdk";

import { ethers } from "ethers";

import * as secret from "../../avail_private_auth.json";
import * as public_input from "../../avail.json";
import BigNumber from "bignumber.js";

import * as fs from "fs";
import { marketId } from "../../requestData.json";

const kalypsoConfig: KalspsoConfig = JSON.parse(fs.readFileSync("./contracts/arb-sepolia.json", "utf-8"));
const keys = JSON.parse(fs.readFileSync("./keys/arb-sepolia.json", "utf-8"));


const reward = new BigNumber(10).pow(18).multipliedBy(145).div(10).toFixed(0);

const createAskTest = async () => {
  const provider = new ethers.JsonRpcProvider(keys.rpc);
  const wallet = new ethers.Wallet(keys.treasury_private_key, provider);

  console.log("using address", await wallet.getAddress());

  let abiCoder = new ethers.AbiCoder();
  let inputBytes = abiCoder.encode(["string[1]"], [[public_input.public]]);
  console.log({ inputBytes });

  const kalypso = new KalypsoSdk(wallet, kalypsoConfig);

  const secretString = JSON.stringify(secret);

  const latestBlock = await provider.getBlockNumber();

  const assignmentDeadline = new BigNumber(latestBlock).plus(100000000000);
  console.log({ latestBlock, assignmentDeadline: assignmentDeadline.toFixed(0) });
  const proofGenerationTimeInBlocks = new BigNumber(100000000000);

  // data
  const encryptedRequestData = await kalypso.MarketPlace().createEncryptedRequestData(inputBytes, Buffer.from(secretString), marketId);
  console.log({ encryptedRequestData });
  
  const ivsCheckEciesCheckingKey = await kalypso.MarketPlace().IvsEnclaveConnector().fetchInputVerifierPublicKeys();

  const isGoodRequest = await kalypso.MarketPlace().checkInputsAndEncryptedSecretWithIvs(
    marketId,
    inputBytes,
    Buffer.from(secretString),
    kalypso.MarketPlace().IvsEnclaveConnector().checkInputUrl(),
    ivsCheckEciesCheckingKey.data.ecies_public_key
  );

  if (!isGoodRequest) {
    throw new Error("Better not create a request, if it is not provable to prevent loss of funds");
  }
  console.log({ isGoodRequest });

  // Create ASK request
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
};

createAskTest();
