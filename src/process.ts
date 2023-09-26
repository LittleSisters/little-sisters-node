// @ts-ignore
import { ethers } from "ethers";
import fs from 'fs';
import path from 'path';
import watch from 'node-watch';
import lighthouse from '@lighthouse-web3/sdk';
import 'dotenv/config'
import { Sisters } from "../typechain-types";

const camLastFile: any = {};
let provider: ethers.providers.JsonRpcProvider;
let signer: ethers.Wallet;
let sisters: Sisters;

const getTheAbi = () => {
  try {
    const dir = path.resolve(
      __dirname,
      "../artifacts/contracts/Sisters.sol/Sisters.json"
    )
    const file = fs.readFileSync(dir, "utf8")
    const json = JSON.parse(file)
    return json.abi
  } catch (e) {
    console.error(`error`, e)
  }
}

/*
 * Returns the last file complete recording file for a camera (when new file is detected for this cam)
 */
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

  async function processFile(filename: string) {
    const completeName = path.parse(filename).name;
    const [cam, date, time, segmentLengthSec] = completeName.split('_');
    // get unix timestamp UTC
    const timeStart = Date.parse(`${date} ${time?.split('-').join(':')}`) / 1000;
    const timeEnd = timeStart + parseInt(segmentLengthSec);

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
          Name: path.parse(filename).base,
          Hash: 'QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMi' + Date.now().toString(),
          Size: fs.statSync(filename).size.toString()
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
  }

// For now no error handling yet
  watch('recs', { recursive: true, delay: 500 }, async function(evt, fileChanged) {
    if (evt !== 'update') return; // ignore other events
    const nameChanged = path.parse(fileChanged).name;
    const camName = nameChanged.split('_')[0];
    const completeFile = completeSegmentFile(camName, fileChanged);

    if (!completeFile) return;
    console.log('completeFile:', completeFile);
    // TODO make upload queue instead of multithreaded to avoid jams
    await processFile(completeFile);
  });
}

main().then();

