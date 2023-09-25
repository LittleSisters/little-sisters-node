
import fs from 'fs';
import path from 'path';
import watch from 'node-watch';
import lighthouse from '@lighthouse-web3/sdk';
import 'dotenv/config'

const camLastFile: any = {};

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

// For now no error handling yet
watch('recs', { recursive: true, delay: 500 }, async function(evt, name) {
  if (evt !== 'update') return; // ignore other events
  const baseName = path.parse(name).name;
  const camName = baseName.split('_')[0];
  const completeFile = completeSegmentFile(camName, name);

  if (!completeFile) return;

  console.log('completeFile:', completeFile);

  const [cam, date, time, segmentLengthSec] = completeFile.split('_');
  // get unix timestamp UTC
  const timeStart = Date.parse(`${date} ${time?.replaceAll('-', ':')}`) / 1000;
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
  }




});


