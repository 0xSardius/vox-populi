// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {VoxVault} from "../src/VoxVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    uint8 private _decimals;

    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_) {
        _decimals = decimals_;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}

contract MockAavePool {
    IERC20 public usdc;
    MockERC20 public aUsdc;

    constructor(address _usdc, address _aUsdc) {
        usdc = IERC20(_usdc);
        aUsdc = MockERC20(_aUsdc);
    }

    function supply(address asset, uint256 amount, address onBehalfOf, uint16) external {
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        aUsdc.mint(onBehalfOf, amount);
    }

    function withdraw(address, uint256 amount, address to) external returns (uint256) {
        usdc.transfer(to, amount);
        return amount;
    }

    function simulateYield(address vaultAddr, uint256 amount) external {
        aUsdc.mint(vaultAddr, amount);
    }
}
contract VoxVaultTest is Test {
    VoxVault public vault;
    MockERC20 public usdc;
    MockERC20 public aUsdc;
    MockAavePool public aavePool;

    address public user = address(0xBEEF);
    address public user2 = address(0xCAFE);
    address public newsroom = address(0x4E45);

    uint256 public constant DEPOSIT_AMOUNT = 100e6;

    function setUp() public {
        usdc = new MockERC20("USD Coin", "USDC", 6);
        aUsdc = new MockERC20("Aave Base USDC", "aBasUSDC", 6);
        aavePool = new MockAavePool(address(usdc), address(aUsdc));

        usdc.mint(address(aavePool), 1_000_000e6);

        vault = new VoxVault(
            address(usdc),
            address(aUsdc),
            address(aavePool),
            newsroom
        );

        usdc.mint(user, 10_000e6);
        usdc.mint(user2, 10_000e6);

        vm.prank(user);
        usdc.approve(address(vault), type(uint256).max);

        vm.prank(user2);
        usdc.approve(address(vault), type(uint256).max);
    }

    function test_DepositFlexible() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.Flexible);

        VoxVault.Position memory pos = vault.getPosition(user, 0);
        assertEq(pos.amount, DEPOSIT_AMOUNT);
        assertEq(pos.unlockTime, pos.depositTime);
        assertEq(uint256(pos.tier), uint256(VoxVault.LockTier.Flexible));
        assertTrue(pos.active);
        assertEq(vault.totalDeposited(), DEPOSIT_AMOUNT);
    }

    function test_DepositThreeMonth() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.ThreeMonth);

        VoxVault.Position memory pos = vault.getPosition(user, 0);
        assertEq(pos.unlockTime, pos.depositTime + 90 days);
        assertEq(uint256(pos.tier), uint256(VoxVault.LockTier.ThreeMonth));
    }

    function test_DepositSixMonth() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.SixMonth);

        VoxVault.Position memory pos = vault.getPosition(user, 0);
        assertEq(pos.unlockTime, pos.depositTime + 180 days);
    }

    function test_DepositTwelveMonth() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.TwelveMonth);

        VoxVault.Position memory pos = vault.getPosition(user, 0);
        assertEq(pos.unlockTime, pos.depositTime + 365 days);
    }

    function test_RevertBelowMinDeposit() public {
        vm.prank(user);
        vm.expectRevert("Below minimum deposit");
        vault.deposit(5e6, VoxVault.LockTier.Flexible);
    }
    function test_YieldSplitFlexible() public {
        _depositAndClaimYield(VoxVault.LockTier.Flexible, 2500);
    }

    function test_YieldSplitThreeMonth() public {
        _depositAndClaimYield(VoxVault.LockTier.ThreeMonth, 5000);
    }

    function test_YieldSplitSixMonth() public {
        _depositAndClaimYield(VoxVault.LockTier.SixMonth, 6000);
    }

    function test_YieldSplitTwelveMonth() public {
        _depositAndClaimYield(VoxVault.LockTier.TwelveMonth, 7500);
    }

    function _depositAndClaimYield(VoxVault.LockTier tier, uint256 expectedUserBps) internal {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, tier);

        uint256 yieldAmount = 10e6;
        aavePool.simulateYield(address(vault), yieldAmount);

        uint256 userBalBefore = usdc.balanceOf(user);
        uint256 newsroomBalBefore = usdc.balanceOf(newsroom);

        vm.prank(user);
        vault.claimYield(0);

        uint256 userReceived = usdc.balanceOf(user) - userBalBefore;
        uint256 newsroomReceived = usdc.balanceOf(newsroom) - newsroomBalBefore;

        uint256 expectedUserYield = (yieldAmount * expectedUserBps) / 10000;
        uint256 expectedNewsroomYield = yieldAmount - expectedUserYield;

        assertEq(userReceived, expectedUserYield, "User yield mismatch");
        assertEq(newsroomReceived, expectedNewsroomYield, "Newsroom yield mismatch");
    }
    function test_WithdrawFlexibleNoPenalty() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.Flexible);

        uint256 balBefore = usdc.balanceOf(user);

        vm.prank(user);
        vault.withdraw(0);

        uint256 balAfter = usdc.balanceOf(user);
        assertEq(balAfter - balBefore, DEPOSIT_AMOUNT);
    }

    function test_EarlyWithdrawalPenalty() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.ThreeMonth);

        uint256 userBalBefore = usdc.balanceOf(user);
        uint256 newsroomBalBefore = usdc.balanceOf(newsroom);

        vm.prank(user);
        vault.withdraw(0);

        uint256 expectedPenalty = (DEPOSIT_AMOUNT * 500) / 10000;
        uint256 userReceived = usdc.balanceOf(user) - userBalBefore;
        uint256 newsroomReceived = usdc.balanceOf(newsroom) - newsroomBalBefore;

        assertEq(userReceived, DEPOSIT_AMOUNT - expectedPenalty, "User should receive amount minus penalty");
        assertEq(newsroomReceived, expectedPenalty, "Newsroom should receive penalty");
        assertEq(vault.totalNewsroomFunded(), expectedPenalty, "totalNewsroomFunded should track penalty");
    }

    function test_WithdrawAfterLockNoPenalty() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.ThreeMonth);

        vm.warp(block.timestamp + 91 days);

        uint256 balBefore = usdc.balanceOf(user);

        vm.prank(user);
        vault.withdraw(0);

        uint256 balAfter = usdc.balanceOf(user);
        assertEq(balAfter - balBefore, DEPOSIT_AMOUNT);
    }

    function test_RevertWithdrawInactivePosition() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.Flexible);

        vm.prank(user);
        vault.withdraw(0);

        vm.prank(user);
        vm.expectRevert("Position not active");
        vault.withdraw(0);
    }
    function test_GetUserPositions() public {
        vm.startPrank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.Flexible);
        vault.deposit(200e6, VoxVault.LockTier.ThreeMonth);
        vault.deposit(300e6, VoxVault.LockTier.TwelveMonth);
        vm.stopPrank();

        VoxVault.Position[] memory userPositions = vault.getUserPositions(user);
        assertEq(userPositions.length, 3);
        assertEq(userPositions[0].amount, DEPOSIT_AMOUNT);
        assertEq(userPositions[1].amount, 200e6);
        assertEq(userPositions[2].amount, 300e6);
        assertEq(uint256(userPositions[2].tier), uint256(VoxVault.LockTier.TwelveMonth));
    }

    function test_GetPositionCount() public {
        assertEq(vault.getPositionCount(user), 0);

        vm.startPrank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.Flexible);
        assertEq(vault.getPositionCount(user), 1);

        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.ThreeMonth);
        assertEq(vault.getPositionCount(user), 2);
        vm.stopPrank();
    }

    function test_SetNewsroomFund() public {
        address newNewsroom = address(0xDEAD);
        vault.setNewsroomFund(newNewsroom);
        assertEq(vault.newsroomFund(), newNewsroom);
    }

    function test_RevertSetNewsroomFundNotOwner() public {
        vm.prank(user);
        vm.expectRevert();
        vault.setNewsroomFund(address(0xDEAD));
    }
}