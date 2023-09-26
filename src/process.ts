// @ts-ignore
import { ethers } from "ethers";
import fs from 'fs';
import path from 'path';
import watch from 'node-watch';
import lighthouse from '@lighthouse-web3/sdk';
import 'dotenv/config'
import { Sisters } from "../typechain-types";


const camLastFile: any = {};
let sisters: Sisters;
let provider: ethers.providers.JsonRpcProvider;
let signer: ethers.Wallet;

const getTheAbi = () => {
  try {
    const dir = path.resolve(
      __dirname,
      "../artifacts/contracts/Sisters.sol/Sisters.json"
    )
    const file = fs.readFileSync(dir, "utf8")
    const json = JSON.parse(file)
    const abi = json.abi
    return abi
  } catch (e) {
    console.log(`error`, e)
  }
}
function completeSegmentFile(cam: string, filename: string) {
  if (!camLastFile[cam]) {
    camLastFile[cam] = filename;
    return undefined;
  }

  if (camLastFile[cam] === filename) {
    return undefined;
  }

  const lastFile = camLastFile[cam];
  camLastFile[cam] = filename;

  return lastFile;
}

async function main() {
  console.log('Sisters PoC Node version 0.0.1');
  console.log('TBL_PROVIDER_URL', process.env.TBL_PROVIDER_URL);
  provider = new ethers.providers.JsonRpcProvider(process.env.TBL_PROVIDER_URL);
  if (!process.env.TBL_PRIVATE_KEY) throw new Error('TBL_PRIVATE_KEY is not set');

  signer = new ethers.Wallet(process.env.TBL_PRIVATE_KEY, provider)
  // Connect to Sisters contract by address
  if (!process.env.SISTERS_CONTRACT) throw new Error('SISTERS_CONTRACT is not set');
  sisters = new ethers.Contract(process.env.SISTERS_CONTRACT, getTheAbi(), signer) as Sisters;

// For now no error handling yet
  watch('recs', { recursive: true, delay: 500 }, async function(evt, name) {
    if (evt !== 'update') return; // ignore other events
    const baseName = path.parse(name).name;
    const camName = baseName.split('_')[0];
    const completeFile = completeSegmentFile(camName, name);

    if (!completeFile) return;

    console.log('completeFile:', completeFile);

    const base = path.parse(name).name;
    const [cam, date, time, segmentLengthSec] = base.split('_');
    // get unix timestamp UTC
    const timeStart = Date.parse(`${date} ${time?.split('-').join(':')}`) / 1000;
    const timeEnd = timeStart + parseInt(segmentLengthSec);

    // TODO make upload queue instead of multithreaded to avoid crowding

    const apiKey = process.env.LIGHTHOUSE_API_KEY;
    if (apiKey) {
      /// We can use encrypted upload for private (indoor) camera recordings later
      // const lhUploadResponse = await lighthouse.upload(
      //   completeFile,
      //   apiKey,
      //   false
      // );
      const lhUploadResponse = { // mock response
        data: {
          Name: 'cam1_2023-09-25_12-49-52_10.mkv',
          Hash: 'QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMi' + Date.now().toString(),
          Size: fs.statSync(completeFile).size.toString()
        }
      }
      console.log(lhUploadResponse);

      // Insert recording into tableland database
      console.log('insertRec', cam, lhUploadResponse.data.Hash, timeStart, timeEnd);
      const tx = await sisters.insertRec(cam, lhUploadResponse.data.Hash, timeStart, timeEnd);
      console.log('tx', tx.hash);
      const receipt = await tx.wait();
      console.log('receipt gasUsed', receipt.gasUsed.toString());

    }
  });
}

main().then();

