// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.10 <0.9.0;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {TablelandController} from "@tableland/evm/contracts/TablelandController.sol";
import {TablelandPolicy} from "@tableland/evm/contracts/TablelandPolicy.sol";
import {TablelandDeployments} from "@tableland/evm/contracts/utils/TablelandDeployments.sol";
import {SQLHelpers} from "@tableland/evm/contracts/utils/SQLHelpers.sol";
import {ITablelandTables} from "@tableland/evm/contracts/interfaces/ITablelandTables.sol";

// Starter template for contract owned and controlled tables
contract Sisters is TablelandController {
    using SQLHelpers for string;
    using Strings for uint;
    using Strings for int64;
    using Strings for address;

    ITablelandTables public immutable tableland;

    uint public immutable recsId;
    uint public immutable evtsId;
    string private constant _REX_PREFIX = "recs"; // Records table prefix
    string private constant _EVTS_PREFIX = "evts"; // Records table prefix

    // Constructor that creates a table, sets the controller, and inserts data
    constructor() {
        tableland = TablelandDeployments.get();
        // Create a recordings table
        recsId = tableland.create(
            address(this),
            SQLHelpers.toCreateFromSchema(
                "stp text,"
                "snd text,"
                "cam text,"
                "cid text,"
                "stt integer,"
                "end integer,",
                _REX_PREFIX
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
                "s1 text,"
                "s2 text,"
                "s3 text,"
                "n1 integer,"
                "n2 integer,"
                "n3 integer",
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
        return SQLHelpers.toNameFromId(_REX_PREFIX, recsId);
    }

    // Sample getter to retrieve the table name
    function evtsTableName() external view returns (string memory) {
        return SQLHelpers.toNameFromId(_EVTS_PREFIX, evtsId);
    }

    // TODO bath insert
    // Insert a row into the table from an external call (`id` will autoincrement)
    function insertRec(string memory cam, string memory cid, int64 stt, int64 end) external {
        tableland.mutate(
            address(this),
            recsId,
            SQLHelpers.toInsert(
                _REX_PREFIX,
                recsId,
                "*",
                string.concat(
                    block.timestamp.toString(),',',
                    msg.sender.toHexString().quote(),',',
                    cam.quote(),',',
                    cid.quote(),',',
                    stt.toString(),',',
                    end.toString()
                )
            )
        );
    }

    // TODO bath insert
    // Insert a row into the table from an external call (`id` will autoincrement)
    function insertEvt(string memory cam, string memory cid, int64 tim, string memory typ, string memory s1, string memory s2, string memory s3, int64 n1, int64 n2, int64 n3) external {
        string memory s = string.concat(
            cam.quote(),',',
            cid.quote(),',',
            tim.toString(),',',
            typ.quote(),',',
            s1.quote(), ',',
            s2.quote(), ',',
            s3.quote()
        );

        tableland.mutate(
            address(this),
            recsId,
            SQLHelpers.toInsert(
                _EVTS_PREFIX,
                evtsId,
                "*",
                string.concat(
                    block.timestamp.toString(),',',
                    msg.sender.toHexString().quote(),',',
                    s,',',
                    n1.toString(),',',
                    n2.toString(),',',
                    n3.toString()
                )
            )
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
}
