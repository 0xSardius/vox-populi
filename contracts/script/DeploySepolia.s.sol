// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/VoxVault.sol";

/**
 * @notice Deploy VoxVault to Base Sepolia testnet.
 *
 * Aave V3 on Base Sepolia uses its OWN mock USDC, not Circle's.
 * Mint test USDC at: https://staging.aave.com/faucet/
 *
 * Usage:
 *   cd contracts
 *   source .env
 *   forge script script/DeploySepolia.s.sol --rpc-url base_sepolia --broadcast --verify
 */
contract DeployVoxVaultSepolia is Script {
    // ── Base Sepolia addresses (from aave-address-book) ──
    address constant USDC = 0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f;
    address constant A_BAS_USDC = 0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC;
    address constant AAVE_POOL = 0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // For testnet, newsroom fund = deployer (simplifies testing)
        address deployer = vm.addr(deployerPrivateKey);
        address newsroomFund = vm.envOr("NEWSROOM_FUND", deployer);

        console.log("Deployer:", deployer);
        console.log("Newsroom fund:", newsroomFund);

        vm.startBroadcast(deployerPrivateKey);

        VoxVault vault = new VoxVault(
            USDC,
            A_BAS_USDC,
            AAVE_POOL,
            newsroomFund
        );

        console.log("VoxVault deployed at:", address(vault));

        vm.stopBroadcast();
    }
}
