
// JS for rapid prototyping. TODO migrate to TS
const fs = require('fs');
const path = require('path');
const watch = require('node-watch');
const lighthouse = require('@lighthouse-web3/sdk');
require('dotenv').config()

const camLastFile = {};

function completeSegmentFile(cam, filename) {
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
        Hash: 'QmcXXX' + Date.now().toString(),
        Size: '555'
      }
    }
  }


  console.log(lhUploadResponse);


});


