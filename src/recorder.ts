import * as child_process from "child_process";
import config from '../recorder.config.json';
import { Sisters } from "../typechain-types";
import { ensureDir, fillTemplate, getNetworkObjects, unixTimestamp } from "./tools";
import 'dotenv/config'

let sisters: Sisters;

type Parameters = {[index: string]:any};
export async function startRecording() {
  console.log('\n=== Start Recording ===');
  console.time('startRecording');

  ensureDir(config.recordings_directory);
  const cameras = config.cameras;

  sisters = (await getNetworkObjects()).sisters;

  for (const camera of cameras) {
    const cam = {...config.defaults, ...camera} as Parameters
    console.log();
    console.log(`*** CAMERA ${cam.id} ***`);
    console.log(cam);
    const cmd = fillTemplate(cam.cmd, cam);
    console.log('cmd', cmd);
    console.log('process.cwd()', process.cwd());

    /// start recording command
    ensureDir(config.recordings_directory + '/' + cam.id);
    child_process.exec(cmd, {cwd:config.recordings_directory}, function(error, stdout, stderr){
      if (stdout) console.log('Camera:', cam.id, stdout);
      if (stderr) console.log('Camera Error:', cam.id, stderr);
      if (error) throw error;
      // TODO try to restart camera on error
    });
    console.log('Populating', cam.id);

    /// populate events table with camera metadata
    const params = {...cam}
    delete params['id']; // remove id from params
    delete params['cmd']; // remove cmd from params
    const keys = Object.keys(params);
    const values = Object.values(params).map((v) => v.toString());
    console.log('keys', keys);
    console.log('values', values);
    await sisters.insertEvts(cam.id, '', unixTimestamp(), keys, values);
  }
  console.timeEnd('startRecording');

}
