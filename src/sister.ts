import { startRecording } from "./recorder";
import { startProcessing } from "./process";


async function main() {
  console.log('Little Sisters PoC Node version 0.0.1');
  await startRecording();
  await startProcessing();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
