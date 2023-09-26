// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {TablelandDeployments} from "@tableland/evm/contracts/utils/TablelandDeployments.sol";
import {ITablelandTables} from "@tableland/evm/contracts/interfaces/ITablelandTables.sol";

library Deployments {

    address internal constant LITTLE_SISTERS_TESTNET = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;

    function get() internal view returns (ITablelandTables) {
        if (block.chainid == 3671802658509828) {
            return ITablelandTables(LITTLE_SISTERS_TESTNET);
        } else {
            return TablelandDeployments.get();
        }
    }
}
