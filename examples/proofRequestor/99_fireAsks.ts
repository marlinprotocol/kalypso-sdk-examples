import { KalspsoConfig } from "kalypso-sdk/dist/types";
import { KalypsoSdk } from "kalypso-sdk";

import { ethers } from "ethers";

import BigNumber from "bignumber.js";

import * as fs from "fs";
import { marketId } from "../../requestDataSymbiotic.json";

const kalypsoConfig: KalspsoConfig = JSON.parse(
  fs.readFileSync("./contracts/arb-sepolia-symbiotic.json", "utf-8")
);
const keys = JSON.parse(fs.readFileSync("./keys/arb-sepolia-symbiotic.json", "utf-8"));

const reward = new BigNumber(10).pow(18).multipliedBy(145).div(10).toFixed(0);

const provider = new ethers.JsonRpcProvider(keys.rpc);
const provider_sepolia = new ethers.JsonRpcProvider(keys.sepolia_rpc);
const wallet = new ethers.Wallet(keys.treasury_private_key, provider);


const kalypso = new KalypsoSdk(wallet as any, kalypsoConfig);

const createAskTest = async () => {
  console.log("using address", await wallet.getAddress());
  // const response = await fetch("https://kalypso-symbiotic-indexer.justfortesting.me/ui/market/3");
  // const data = JSON.parse(await response.text());
  // const registered_generators = data.registered_generators;
  // console.log("Registered generators: ", registered_generators);
  // const jobs_pending = data.jobs.proofs_pending;
  // const jobs_in_progress = data.jobs.proofs_in_progress;
  // console.log("Jobs pending: ", jobs_pending);
  // console.log("Jobs in progress: ", jobs_in_progress);

  const matchingEngineKey = (
    await kalypso.MarketPlace().readMePubKeyInContract()
  ).toString();
  console.log({ matchingEngineKey });

  const latestBlock = await provider_sepolia.getBlockNumber();
  const assignmentDeadline = new BigNumber(0).plus(latestBlock).plus(200);
  console.log({
    // latestBlock,
    assignmentDeadline: assignmentDeadline.toFixed(0),
  });
  const proofGenerationTimeInBlocks = new BigNumber(200);
  let toggle = true;
  setInterval(async() => {
    if(toggle) {
      console.log("Creating a valid proof generation ask request");
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
          empty,
          false, 
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
      toggle = false;
    } else {
      console.log("Creating an invalid proof generation ask request");
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
      const old_attestation = "0x8444a1013822a059114ba9696d6f64756c655f69647827692d30383465316464326631623263353239622d656e633031393331666432346630346238386266646967657374665348413338346974696d657374616d701b000001938c210e176470637273b0005830b9eea7b7cfa395305b9ac5634bd3f90aa66811f4f2bdf81ab68a4f8d05bbf23b8480df6dec3a29dab40be69ceea29e8a015830bcdf05fefccaa8e55bf2c8d6dee9e79bbff31e34bf28a99aa19e6b29c37ee80b214a414b7607236edf26fcb78654e63f025830e7094c6b2b2ff2c491e18614ed60cef0efe4f8df928721392f07335a8d38e002b16a711280d4595d04222180f5b2189d0358300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000458304b41d8e9ba3411505c1604762a2e91ba72c2c11d954f4a640bf4402bd195dd432804ffa0ceed1b6c39233d13b1e2e5950558300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000658300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000758300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000858300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000958300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a58300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000b58300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c58300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d58300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e58300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f58300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006b63657274696669636174655902813082027d30820203a003020102021001931fd24f04b88b00000000674ece3b300a06082a8648ce3d04030330818f310b30090603550406130255533113301106035504080c0a57617368696e67746f6e3110300e06035504070c0753656174746c65310f300d060355040a0c06416d617a6f6e310c300a060355040b0c03415753313a303806035504030c31692d30383465316464326631623263353239622e61702d736f7574682d312e6177732e6e6974726f2d656e636c61766573301e170d3234313230333039323430385a170d3234313230333132323431315a308194310b30090603550406130255533113301106035504080c0a57617368696e67746f6e3110300e06035504070c0753656174746c65310f300d060355040a0c06416d617a6f6e310c300a060355040b0c03415753313f303d06035504030c36692d30383465316464326631623263353239622d656e63303139333166643234663034623838622e61702d736f7574682d312e6177733076301006072a8648ce3d020106052b8104002203620004832c36ad057e86931daa6b721187d1317ccdde15e169cdddcb43bf67113066c4c97487597217fc1bc085003ec6049f490e1a9f6c7e332131dbe4d4756fd6c3ed190f520f7e0f22ae924bb63924c2024b8088fc5ff76c2e31761163e6a24b6e96a31d301b300c0603551d130101ff04023000300b0603551d0f0404030206c0300a06082a8648ce3d040303036800306502302599c720f293482e465a999cd88ad365d96c0dbb7b1f76d2c5768859f8d7dea1759946e15692b915cc2fa59ad1ba071602310098ad5887a2cd63050fdc59e96c76f1fdaf38757a575e8a01c9a5a2b9c85a97dd74576e6545ddecfa77ac70a2e58950f268636162756e646c65845902153082021130820196a003020102021100f93175681b90afe11d46ccb4e4e7f856300a06082a8648ce3d0403033049310b3009060355040613025553310f300d060355040a0c06416d617a6f6e310c300a060355040b0c03415753311b301906035504030c126177732e6e6974726f2d656e636c61766573301e170d3139313032383133323830355a170d3439313032383134323830355a3049310b3009060355040613025553310f300d060355040a0c06416d617a6f6e310c300a060355040b0c03415753311b301906035504030c126177732e6e6974726f2d656e636c617665733076301006072a8648ce3d020106052b8104002203620004fc0254eba608c1f36870e29ada90be46383292736e894bfff672d989444b5051e534a4b1f6dbe3c0bc581a32b7b176070ede12d69a3fea211b66e752cf7dd1dd095f6f1370f4170843d9dc100121e4cf63012809664487c9796284304dc53ff4a3423040300f0603551d130101ff040530030101ff301d0603551d0e041604149025b50dd90547e796c396fa729dcf99a9df4b96300e0603551d0f0101ff040403020186300a06082a8648ce3d0403030369003066023100a37f2f91a1c9bd5ee7b8627c1698d255038e1f0343f95b63a9628c3d39809545a11ebcbf2e3b55d8aeee71b4c3d6adf3023100a2f39b1605b27028a5dd4ba069b5016e65b4fbde8fe0061d6a53197f9cdaf5d943bc61fc2beb03cb6fee8d2302f3dff65902c4308202c030820245a0030201020210294428bbe3fead1dd87504c677bb4f84300a06082a8648ce3d0403033049310b3009060355040613025553310f300d060355040a0c06416d617a6f6e310c300a060355040b0c03415753311b301906035504030c126177732e6e6974726f2d656e636c61766573301e170d3234313230323035323535345a170d3234313232323036323535345a3065310b3009060355040613025553310f300d060355040a0c06416d617a6f6e310c300a060355040b0c034157533137303506035504030c2e623633643261643539303834376365332e61702d736f7574682d312e6177732e6e6974726f2d656e636c617665733076301006072a8648ce3d020106052b810400220362000498cd97db1d6dffb9bd0a53001ca95fa931faa8e1f1340cd98019d56358687b2fd6c4603ba603fa0db6953d8389c6d2ed4679328dac0154a113dd518a39f268eb6f299b23e00bcff262030d4fa5ad9bf2890f4309ab9431a5468dc996bc86fb1ca381d53081d230120603551d130101ff040830060101ff020102301f0603551d230418301680149025b50dd90547e796c396fa729dcf99a9df4b96301d0603551d0e04160414b1c6ec98bacd16e4d8f6a54aacbf84c25da1db45300e0603551d0f0101ff040403020186306c0603551d1f046530633061a05fa05d865b687474703a2f2f6177732d6e6974726f2d656e636c617665732d63726c2e73332e616d617a6f6e6177732e636f6d2f63726c2f61623439363063632d376436332d343262642d396539662d3539333338636236376638342e63726c300a06082a8648ce3d0403030369003066023100b0c80efe5fc564bfab12aba9861f19b47de7e453c7e1d5edceea4793881b0b765625a2d4681e2e3c690bcf4ce2da1ab1023100b9bed9cb403190e18fc2314d3a747bf33ee778924abbbae7dac9e783961ae753468e73d26ba95b6b08635680c5dd177159031d308203193082029fa003020102021100eb54ce972971030a5411656b3dfe572a300a06082a8648ce3d0403033065310b3009060355040613025553310f300d060355040a0c06416d617a6f6e310c300a060355040b0c034157533137303506035504030c2e623633643261643539303834376365332e61702d736f7574682d312e6177732e6e6974726f2d656e636c61766573301e170d3234313230333030353235355a170d3234313230383134353235355a30818a313d303b06035504030c34346230623931633736316433646263332e7a6f6e616c2e61702d736f7574682d312e6177732e6e6974726f2d656e636c61766573310c300a060355040b0c03415753310f300d060355040a0c06416d617a6f6e310b3009060355040613025553310b300906035504080c0257413110300e06035504070c0753656174746c653076301006072a8648ce3d020106052b8104002203620004255d7618966c607a95aeb2596209b4978a81500d5b6ff4e5fac678d5ae764c622454143b11f910d681027ea6532cd4933d593db916ffa389e9d7ee95f8088a88a3a6894679975d34ef32b1e67162271f562775ea87e4824333778a537d6b5729a381ec3081e930120603551d130101ff040830060101ff020101301f0603551d23041830168014b1c6ec98bacd16e4d8f6a54aacbf84c25da1db45301d0603551d0e04160414f4ca740d221a510282259448cbcfcbc84c4825e5300e0603551d0f0101ff0404030201863081820603551d1f047b30793077a075a0738671687474703a2f2f63726c2d61702d736f7574682d312d6177732d6e6974726f2d656e636c617665732e73332e61702d736f7574682d312e616d617a6f6e6177732e636f6d2f63726c2f38336637666539652d313834662d343633632d393030332d3063353666303864363637652e63726c300a06082a8648ce3d0403030368003065023044e9527cf8bc28d82be72d726089663a714ad9f9d42a79c8bcba8921c579c1387149fe0c89bf7c057b074260da13bc53023100e9f259985a879eb8891c281233bd5dac222a3b2de9300689b0d8d6e5558504f2a0118ad1423ca08bb483eb530c9b03a65902c5308202c130820247a003020102021500ac72ebe6858748975e913d11ac2163c0cc853e20300a06082a8648ce3d04030330818a313d303b06035504030c34346230623931633736316433646263332e7a6f6e616c2e61702d736f7574682d312e6177732e6e6974726f2d656e636c61766573310c300a060355040b0c03415753310f300d060355040a0c06416d617a6f6e310b3009060355040613025553310b300906035504080c0257413110300e06035504070c0753656174746c65301e170d3234313230333033313432325a170d3234313230343033313432325a30818f310b30090603550406130255533113301106035504080c0a57617368696e67746f6e3110300e06035504070c0753656174746c65310f300d060355040a0c06416d617a6f6e310c300a060355040b0c03415753313a303806035504030c31692d30383465316464326631623263353239622e61702d736f7574682d312e6177732e6e6974726f2d656e636c617665733076301006072a8648ce3d020106052b8104002203620004cc8e7ddbb457bb509633e999265e0bd04d27656a5be67bd391442f59b859fd49dfa614d58be55a36d67c10fe371d115f4e60fc428f9f3a6053ef668c18cb7073ea024d0c6bcf38f582424d03088da503b454e88517c888b7019b40a433ae6b04a366306430120603551d130101ff040830060101ff020100300e0603551d0f0101ff040403020204301d0603551d0e04160414ee7124baf4ecbfc39072ef63596522ea904b0a3d301f0603551d23041830168014f4ca740d221a510282259448cbcfcbc84c4825e5300a06082a8648ce3d040303036800306502307f273543ba03f24b534d0044fb3a7257379fc5edd51cab65bae6c44e8c7c667ed9c5f520efcfbeaca3af0b5a85a2aa71023100efac0342d02f5d7279dc9005e7c042fbce0e7e2678761c2dc2b10de8f1a46168873b7a42a3605e2b657a00edf4b5674b6a7075626c69635f6b65795840f294e410a78585e4cb685fc62015f1b3ce5fd15844cbbfefddf1d13ab7fcc44cca83a53eae668239003836318681e3b34c78208cb4c3ae2e4e004205bb71df2b69757365725f64617461f6656e6f6e6365f65860f171befa4df1392460b1951aa5f646bd80d311ba0fdf4a1484b4a7e40d76187bcfd761a887eec17ef77792664cfffc0d5f4fd1f7a8388be3feab6e3a2a0b48b2375d9d4facac421ce787fa96e00fcc82d03d578a1a7274349c2803760e4e3f6d";
    
      // 2.TODO. Verify before whether this request is provable before shooting request out
      const askRequest = await kalypso
        .MarketPlace()
        .createAsk(
          marketId,
          old_attestation,
          reward,
          assignmentDeadline.toFixed(0),
          proofGenerationTimeInBlocks.toFixed(0),
          await wallet.getAddress(),
          0, // TODO: keep this 0 for now
          empty,
          false, 
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
      toggle = true;
    }   
  }, 60 * 5000); // wait 5 minute before firing requests
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
