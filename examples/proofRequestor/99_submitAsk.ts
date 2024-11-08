import { KalspsoConfig } from "kalypso-sdk/dist/types";
import { KalypsoSdk } from "kalypso-sdk";

import { ethers } from "ethers";

import BigNumber from "bignumber.js";

import * as fs from "fs";
import { marketId } from "../../requestData.json";

const kalypsoConfig: KalspsoConfig = JSON.parse(
  fs.readFileSync("./contracts/arb-sepolia.json", "utf-8")
);
const keys = JSON.parse(fs.readFileSync("./keys/arb-sepolia.json", "utf-8"));

const reward = new BigNumber(10).pow(18).multipliedBy(145).div(10).toFixed(0);

const provider = new ethers.JsonRpcProvider(keys.rpc);
const wallet = new ethers.Wallet(keys.treasury_private_key, provider);


const kalypso = new KalypsoSdk(wallet as any, kalypsoConfig);

const createAskTest = async () => {
  console.log("using address", await wallet.getAddress());

  const matchingEngineKey = (
    await kalypso.MarketPlace().readMePubKeyInContract()
  ).toString();
  
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

  const attestation_live = await readFullData();
  console.log("attestation length", attestation_live.length/2 -1);

  // 2.TODO. Verify before whether this request is provable before shooting request out
  const askRequest = await kalypso
    .MarketPlace()
    .createAsk(
      marketId,
      attestation_live,
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

async function readFullData(): Promise<string> {
  try {
    const stream = await kalypso.MarketPlace().MatchingEngineEnclaveConnector().buildAttestation(false);

    let data = '0x'; // Initialize with '0x' to signify a hex string
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        data += Buffer.from(chunk).toString('hex'); // Ensure each chunk is appended as hex
      });

      stream.on('end', () => {
        resolve(data); // Resolve with the full hex string when the stream ends
      });

      stream.on('error', (err) => {
        reject(err); // Reject on error
      });
    });
  } catch (err) {
    console.error('Error reading attestation:', err);
    throw err;
  }
}
