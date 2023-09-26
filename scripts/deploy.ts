// @ts-ignore
import { ethers } from "hardhat";

async function main() {
  const Sisters = await ethers.getContractFactory("Sisters");
  const sisters = await Sisters.deploy();

  await sisters.deployed();
  console.log(`Sisters Contract deployed to '${sisters.address}'.\n`);

  const recsTableName = await sisters.recsTableName();
  console.log(`Recordings Table name '${recsTableName}' minted to contract.`);
  const evtsTableName = await sisters.evtsTableName();
  console.log(`Events     Table name '${evtsTableName}' minted to contract.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
