// @ts-ignore
import fs from 'fs';
import path from 'path';
import watch from 'node-watch';
import lighthouse from '@lighthouse-web3/sdk';
import 'dotenv/config'
import { Sisters } from "../typechain-types";
import { getNetworkObjects } from "./tools";

let sisters: Sisters;

const camLastFile: any = {};
const filesToProcess: any = [];


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

export async function startProcessing() {
  console.log('\n=== Start Processing ===');

  sisters = (await getNetworkObjects()).sisters;

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
      console.log('receipt gasUsed', receipt.gasUsed.toString(), '\n');

    }
  }

// For now no error handling yet
  watch('recs', { recursive: true, delay: 500 }, async function(evt, fileChanged) {
    if (evt !== 'update') return; // ignore other events
    if (fs.lstatSync(fileChanged).isDirectory()) return; // ignore directories
    const nameChanged = path.parse(fileChanged).name;
    const [camName, date, time, segmentLengthSec] = nameChanged.split('_');
    if (!(camName && date && time && segmentLengthSec)) {
      console.log('Skipping Invalid filename:', fileChanged);
      console.log('Filename must be in format "CameraId_UnixTimestampStart_UnixTimestampEnd.ext" ex. cam1_1620000000_1620000060.mp4');
      return;
    }
    const completeFile = completeSegmentFile(camName, fileChanged);

    if (!completeFile) return;
    console.log('completeFile:', completeFile);
    filesToProcess.push(completeFile);
  });

  // Processing queue
  let processing: boolean;
  setInterval(async () => {
    if (processing) return;
    processing = true;
    try {
      if (filesToProcess.length === 0) return;
      const completeFile = filesToProcess.shift();
      console.log('Processing ', completeFile);
      await processFile(completeFile);

    } catch (e) {
      console.error('Error processing file', e);

    } finally {
      processing = false;
    }
  }, 100);
}

