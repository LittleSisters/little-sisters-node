import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { type SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers, upgrades } from "hardhat";
import { type TablelandTables } from "@tableland/evm";
// Import your contracts from `contracts` directory
import { type Sisters } from "../typechain-types";

chai.use(chaiAsPromised);
const expect = chai.expect;

// Test smart contract deployment and method calls
// Note: SQL *does not* get validated nor materialized in this environment
describe("Recs contract", function () {
  // Set global accounts and the Tableland registry contract
  let accounts: SignerWithAddress[];
  let registry: TablelandTables;
  // Custom `Starter` contract
  let sisters: Sisters;

  // Deploy the`TablelandTables` registry contract once
  async function deployFixture() {
    // Set global accounts
    accounts = await ethers.getSigners();
    // Deploy `TablelandTables` to allow for table creates and mutates
    const TablelandTablesFactory = await ethers.getContractFactory(
      "TablelandTables"
    );
    registry = await (
      (await upgrades.deployProxy(
        TablelandTablesFactory,
        ["http://localhost:8080/"],
        {
          kind: "uups",
        }
      )) as TablelandTables
    ).deployed();
  }

  // Deploy the fixture and `Starter` to ensure deterministic table IDs
  beforeEach(async function () {
    await loadFixture(deployFixture);
    const SistersFactory = await ethers.getContractFactory("Sisters");
    sisters = (await SistersFactory.deploy()) as Sisters;
    await sisters.deployed();
  });

  it("should deploy, create a table, and set the controller", async function () {
    // Check that the registry minted a table to the sisters and set the controller
    await expect(sisters.deployTransaction)
      .to.emit(registry, "CreateTable")
      .withArgs(sisters.address, 1, anyValue) // Use `anyValue` instead of a CREATE TABLE statement
      .to.emit(registry, "SetController")
      .withArgs(1, sisters.address);
  });

  it("should have the contract own the tables", async function () {
    expect(await registry.ownerOf(1)).to.equal(sisters.address); // Recs Table ID is `1` in this environment
    expect(await registry.ownerOf(2)).to.equal(sisters.address); // Evts Table ID is `2` in this environment
  });

  it("should have the correct policy set", async function () {
    await sisters.insertRec('cam1', 'cid1', -2^63, 2^63-1);
    const tableEvents = await registry.queryFilter(registry.filters.RunSQL());
    const [event] = tableEvents ?? [];
    const policy = event.args?.policy;
    // Check the policy values are equal to those set in the contract
    expect(policy.allowInsert).to.equal(true);
    expect(policy.allowUpdate).to.equal(false);
    expect(policy.allowDelete).to.equal(false);
    expect(policy.whereClause).to.equal("");
    expect(policy.withCheck).to.equal("");
    expect(policy.updatableColumns).to.deep.equal([]);
  });

  it("should return the sisters table name", async function () {
    // Custom getter method
    expect(await sisters.recsTableName()).to.equal("recs_31337_1");
  });

  it("should return the evts table name", async function () {
    // Custom getter method
    expect(await sisters.evtsTableName()).to.equal("evts_31337_2");
  });

  // TODO check table exists in database

  // TODO evts table tests
  it("should call registry to insert value", async function () {
    // Call the method externally, albeit, the contract is sending the SQL
    // You *could* directly call the registry contract such that ACLs are enforced
    await expect(await sisters.connect(accounts[1]).insertRec('cam1', 'cid1', -2^63, 2^63-1))
      .to.emit(registry, "RunSQL")
      .withArgs(sisters.address, true, 1, anyValue, anyValue);
  });

  // TODO check inserted value in table

});
