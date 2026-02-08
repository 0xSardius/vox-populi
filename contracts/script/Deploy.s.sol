// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/VoxVault.sol";

contract DeployVoxVault is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address newsroomFund = vm.envAddress("NEWSROOM_FUND");

        vm.startBroadcast(deployerPrivateKey);

        VoxVault vault = new VoxVault(
            0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913, // USDC
            0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB, // aBasUSDC
            0xA238Dd80C259a72e81d7e4664a9801593F98d1c5, // Aave Pool
            newsroomFund
        );

        vm.stopBroadcast();
    }
}