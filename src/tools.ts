import path from "path";
import fs from "fs";
import { ethers, Signer } from "ethers";
import { Sisters } from "../typechain-types";
import 'dotenv/config'
import { Provider } from "@ethersproject/providers";

export const getTheAbi = () => {
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

let provider: Provider;
let signer: Signer;
let sisters: Sisters;

export async function getNetworkObjects() {
  if (!provider) provider = new ethers.providers.JsonRpcProvider(process.env.TBL_PROVIDER_URL);
  if (!process.env.TBL_PRIVATE_KEY) throw new Error('TBL_PRIVATE_KEY is not set');

  if (!signer) signer = new ethers.Wallet(process.env.TBL_PRIVATE_KEY, provider)
  // Connect to Sisters contract by address
  if (!process.env.SISTERS_CONTRACT) throw new Error('SISTERS_CONTRACT is not set');
  if (!sisters) sisters = new ethers.Contract(process.env.SISTERS_CONTRACT, getTheAbi(), signer) as Sisters;
  return {provider, signer, sisters};
}

export function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export const fillTemplate = function(templateString: string, templateVars: any){
  return new Function("return `"+templateString +"`;").call(templateVars);
}

export function unixTimestamp (date = Date.now()) {
  return Math.floor(date / 1000)
}
