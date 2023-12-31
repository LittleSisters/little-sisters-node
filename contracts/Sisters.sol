// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.10 <0.9.0;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {TablelandController} from "@tableland/evm/contracts/TablelandController.sol";
import {TablelandPolicy} from "@tableland/evm/contracts/TablelandPolicy.sol";
import {SQLHelpers} from "@tableland/evm/contracts/utils/SQLHelpers.sol";
import {ITablelandTables} from "@tableland/evm/contracts/interfaces/ITablelandTables.sol";
import {Deployments} from "./Deployments.sol";

// Starter template for contract owned and controlled tables
contract Sisters is TablelandController {
    using SQLHelpers for string;
    using Strings for uint;
    using Strings for int64;
    using Strings for address;

    ITablelandTables public immutable tableland;

    uint public immutable recsId;
    uint public immutable evtsId;
    string private constant _RECS_PREFIX = "recs"; // Records table prefix
    string private constant _EVTS_PREFIX = "evts"; // Records table prefix

    // Constructor that creates a table, sets the controller, and inserts data
    constructor() {
        tableland = Deployments.get();
        // Create a recordings table
        recsId = tableland.create(
            address(this),
            SQLHelpers.toCreateFromSchema(
                "stp text,"
                "snd text,"
                "cam text,"
                "cid text,"
                "stt integer,"
                "edt integer",
                _RECS_PREFIX
            )
        );
        // Create a events table
        evtsId = tableland.create(
            address(this),
            SQLHelpers.toCreateFromSchema(
                "stp text,"
                "snd text,"
                "cam text,"
                "cid text,"
                "tim integer,"
                "typ text,"
                "val text",
                _EVTS_PREFIX
            )
        );
        // Set the ACL controller to enable writes to others besides the table owner
        tableland.setController(
            address(this), // Table owner, i.e., this contract
            recsId,
            address(this) // Set the controller address—also this contract
        );
        tableland.setController(
            address(this), // Table owner, i.e., this contract
            evtsId,
            address(this) // Set the controller address—also this contract
        );
    }

    // Sample getter to retrieve the table name
    function recsTableName() external view returns (string memory) {
        return SQLHelpers.toNameFromId(_RECS_PREFIX, recsId);
    }

    // Sample getter to retrieve the table name
    function evtsTableName() external view returns (string memory) {
        return SQLHelpers.toNameFromId(_EVTS_PREFIX, evtsId);
    }

    // TODO bath insert
    // Insert a row into the table from an external call (`id` will autoincrement)

    /**
     * @dev Insert a row into the recs (recordings) table
     *
     * @param cam - camera name
     * @param cid - camera id
     * @param stt - start time
     * @param edt - end time
     */
    function insertRec(string memory cam, string memory cid, int64 stt, int64 edt) external {
        tableland.mutate(
            address(this),
            recsId,
            _toInsertAll(
                _RECS_PREFIX,
                recsId,
                string.concat(
                    block.timestamp.toString(),',',
                    msg.sender.toHexString().quote(),',',
                    cam.quote(),',',
                    cid.quote(),',',
                    stt.toString(),',',
                    edt.toString()
                )
            )
        );
    }

    // Insert a row into the evts (events) table
    function insertEvts(string memory cam, string memory cid, int64 tim, string[] memory typ, string[] memory val) external {
        string memory same = string.concat(
            block.timestamp.toString(),',',
            msg.sender.toHexString().quote(),',',
            cam.quote(),',',
            cid.quote(),',',
            tim.toString(),','
        );

        string[] memory values = new string[](typ.length);
        for (uint256 i = 0; i < typ.length; i++) {
            values[i] = string.concat(same, typ[i].quote(), ',', val[i].quote());
        }

        tableland.mutate( address(this), evtsId,
            _toBatchInsertAll(_EVTS_PREFIX, evtsId, values)
        );
    }

    // Dynamic ACL controller policy that allows any inserts and no updates or deletes
    function getPolicy(
        address,
        uint
    ) public payable override returns (TablelandPolicy memory) {
        string[] memory updatableColumns;
        // Return the policy
        return
            TablelandPolicy({
                allowInsert: true,
                allowUpdate: false,
                allowDelete: false,
                whereClause: "",
                withCheck: "",
                updatableColumns: updatableColumns
            });
    }

    /// Insert all values without columns specified to reduce gas cost
    /// https://docs.tableland.xyz/fundamentals/architecture/query-optimization#table--schema-definition
    function _toInsertAll(
        string memory prefix,
        uint256 tableId,
        string memory values
    ) internal view returns (string memory) {
        string memory name = SQLHelpers.toNameFromId(prefix, tableId);
        return
            string(
            abi.encodePacked(
                "INSERT INTO ",
                name,
                " VALUES(",
                values,
                ")"
            )
        );
    }

    function _toBatchInsertAll(
        string memory prefix,
        uint256 tableId,
        string[] memory values
    ) internal view returns (string memory) {
        string memory name = SQLHelpers.toNameFromId(prefix, tableId);
        string memory insert = string(
            abi.encodePacked("INSERT INTO ", name, " VALUES")
        );
        insert = string(abi.encodePacked(insert, "(", values[0], ")"));

        for (uint256 i = 1; i < values.length; i++) {
            insert = string(abi.encodePacked(insert, ",(", values[i], ")"));
        }
        return insert;
    }


}
