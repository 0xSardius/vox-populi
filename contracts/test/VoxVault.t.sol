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

    function burn(address from, uint256 amount) external {
        _burn(from, amount);
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
        // Burn aUSDC from caller (mirrors real Aave behavior)
        aUsdc.burn(msg.sender, amount);
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

    // ── Deposit Tests ──────────────────────────────

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
        vault.deposit(0.5e6, VoxVault.LockTier.Flexible);
    }

    // ── Yield Split Tests ──────────────────────────

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

    // ── Multi-User Yield Fairness (the critical bug fix) ───

    function test_MultiUserYieldFairness() public {
        // User A and User B each deposit 100 USDC
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.ThreeMonth);

        vm.prank(user2);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.ThreeMonth);

        // 20 USDC yield accrues
        uint256 yieldAmount = 20e6;
        aavePool.simulateYield(address(vault), yieldAmount);

        // User A claims first
        uint256 userABalBefore = usdc.balanceOf(user);
        vm.prank(user);
        vault.claimYield(0);
        uint256 userAReceived = usdc.balanceOf(user) - userABalBefore;

        // User B claims second — should get the SAME amount (fair split)
        uint256 userBBalBefore = usdc.balanceOf(user2);
        vm.prank(user2);
        vault.claimYield(0);
        uint256 userBReceived = usdc.balanceOf(user2) - userBBalBefore;

        // Both at ThreeMonth tier (50% user share), so each should get 50% of their 10 USDC share = 5
        uint256 expectedPerUser = (10e6 * 5000) / 10000; // 5 USDC each
        assertEq(userAReceived, expectedPerUser, "User A yield unfair");
        assertEq(userBReceived, expectedPerUser, "User B yield unfair");
    }

    function test_MultiUserYieldFairness_DifferentAmounts() public {
        // User A deposits 300, User B deposits 100 (3:1 ratio)
        vm.prank(user);
        vault.deposit(300e6, VoxVault.LockTier.Flexible);

        vm.prank(user2);
        vault.deposit(100e6, VoxVault.LockTier.Flexible);

        // 40 USDC yield accrues
        aavePool.simulateYield(address(vault), 40e6);

        // User B claims first this time
        uint256 userBBalBefore = usdc.balanceOf(user2);
        vm.prank(user2);
        vault.claimYield(0);
        uint256 userBReceived = usdc.balanceOf(user2) - userBBalBefore;

        // User A claims second
        uint256 userABalBefore = usdc.balanceOf(user);
        vm.prank(user);
        vault.claimYield(0);
        uint256 userAReceived = usdc.balanceOf(user) - userABalBefore;

        // Total yield = 40. A has 75% of pool, B has 25%.
        // A's yield share = 30, B's yield share = 10
        // Flexible tier = 25% user share
        uint256 expectedA = (30e6 * 2500) / 10000; // 7.5 USDC
        uint256 expectedB = (10e6 * 2500) / 10000; // 2.5 USDC

        assertEq(userAReceived, expectedA, "User A yield unfair");
        assertEq(userBReceived, expectedB, "User B yield unfair");
    }

    function test_NoDuplicateYieldOnSecondClaim() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.ThreeMonth);

        // First yield accrual + claim
        aavePool.simulateYield(address(vault), 10e6);
        vm.prank(user);
        vault.claimYield(0);

        // Second claim with no new yield — should get nothing
        uint256 balBefore = usdc.balanceOf(user);
        vm.prank(user);
        vault.claimYield(0);
        uint256 received = usdc.balanceOf(user) - balBefore;

        assertEq(received, 0, "Should not receive yield twice");
    }

    function test_YieldAccruesAfterFirstClaim() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.ThreeMonth);

        // First yield
        aavePool.simulateYield(address(vault), 10e6);
        vm.prank(user);
        vault.claimYield(0);

        // More yield accrues
        aavePool.simulateYield(address(vault), 5e6);

        uint256 balBefore = usdc.balanceOf(user);
        vm.prank(user);
        vault.claimYield(0);
        uint256 received = usdc.balanceOf(user) - balBefore;

        uint256 expected = (5e6 * 5000) / 10000; // 2.5 USDC (50% of 5)
        assertEq(received, expected, "Second yield claim incorrect");
    }

    // ── Withdrawal Tests ───────────────────────────

    function test_WithdrawFlexibleNoPenalty() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.Flexible);

        uint256 balBefore = usdc.balanceOf(user);

        vm.prank(user);
        vault.withdraw(0);

        uint256 balAfter = usdc.balanceOf(user);
        assertEq(balAfter - balBefore, DEPOSIT_AMOUNT);
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

    // ── Scaled Early Withdrawal Penalty Tests ──────

    function test_EarlyWithdrawalPenalty_ThreeMonth() public {
        _testEarlyPenalty(VoxVault.LockTier.ThreeMonth, 500); // 5%
    }

    function test_EarlyWithdrawalPenalty_SixMonth() public {
        _testEarlyPenalty(VoxVault.LockTier.SixMonth, 750); // 7.5%
    }

    function test_EarlyWithdrawalPenalty_TwelveMonth() public {
        _testEarlyPenalty(VoxVault.LockTier.TwelveMonth, 1000); // 10%
    }

    function _testEarlyPenalty(VoxVault.LockTier tier, uint256 expectedPenaltyBps) internal {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, tier);

        uint256 userBalBefore = usdc.balanceOf(user);
        uint256 newsroomBalBefore = usdc.balanceOf(newsroom);

        vm.prank(user);
        vault.withdraw(0);

        uint256 expectedPenalty = (DEPOSIT_AMOUNT * expectedPenaltyBps) / 10000;
        uint256 userReceived = usdc.balanceOf(user) - userBalBefore;
        uint256 newsroomReceived = usdc.balanceOf(newsroom) - newsroomBalBefore;

        assertEq(userReceived, DEPOSIT_AMOUNT - expectedPenalty, "User should receive amount minus penalty");
        assertEq(newsroomReceived, expectedPenalty, "Newsroom should receive penalty");
    }

    // ── View Function Tests ────────────────────────

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

    function test_GetPendingYield() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.ThreeMonth);

        aavePool.simulateYield(address(vault), 10e6);

        (uint256 userAmount, uint256 newsroomAmount) = vault.getPendingYield(user, 0);
        assertEq(userAmount, 5e6, "Pending user yield");      // 50% of 10
        assertEq(newsroomAmount, 5e6, "Pending newsroom yield"); // 50% of 10
    }

    function test_GetPendingYieldInactivePosition() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.Flexible);
        vm.prank(user);
        vault.withdraw(0);

        (uint256 userAmount, uint256 newsroomAmount) = vault.getPendingYield(user, 0);
        assertEq(userAmount, 0);
        assertEq(newsroomAmount, 0);
    }

    // ── Admin Tests ────────────────────────────────

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

    function test_RevertSetNewsroomFundZeroAddress() public {
        vm.expectRevert("Invalid newsroom address");
        vault.setNewsroomFund(address(0));
    }

    function test_PauseDeposit() public {
        vault.pause();

        vm.prank(user);
        vm.expectRevert();
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.Flexible);
    }

    function test_PauseWithdraw() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.Flexible);

        vault.pause();

        vm.prank(user);
        vm.expectRevert();
        vault.withdraw(0);
    }

    function test_PauseClaimYield() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.Flexible);
        aavePool.simulateYield(address(vault), 10e6);

        vault.pause();

        vm.prank(user);
        vm.expectRevert();
        vault.claimYield(0);
    }

    function test_UnpauseResumesOperations() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.Flexible);

        vault.pause();
        vault.unpause();

        // Should succeed after unpause
        uint256 balBefore = usdc.balanceOf(user);
        vm.prank(user);
        vault.withdraw(0);
        assertEq(usdc.balanceOf(user) - balBefore, DEPOSIT_AMOUNT);
    }

    function test_RevertPauseNotOwner() public {
        vm.prank(user);
        vm.expectRevert();
        vault.pause();
    }

    // ── Constructor Validation Tests ───────────────

    function test_RevertConstructorZeroUsdc() public {
        vm.expectRevert("Invalid USDC address");
        new VoxVault(address(0), address(aUsdc), address(aavePool), newsroom);
    }

    function test_RevertConstructorZeroAUsdc() public {
        vm.expectRevert("Invalid aUSDC address");
        new VoxVault(address(usdc), address(0), address(aavePool), newsroom);
    }

    function test_RevertConstructorZeroPool() public {
        vm.expectRevert("Invalid Aave pool address");
        new VoxVault(address(usdc), address(aUsdc), address(0), newsroom);
    }

    function test_RevertConstructorZeroNewsroom() public {
        vm.expectRevert("Invalid newsroom address");
        new VoxVault(address(usdc), address(aUsdc), address(aavePool), address(0));
    }

    // ── Yield Edge Cases (from security audit) ─────

    function test_LateDepositorDoesNotStealEarlyYield() public {
        // User A deposits, yield accrues, THEN User B deposits
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.ThreeMonth);

        // 10 USDC yield accrues before User B joins
        aavePool.simulateYield(address(vault), 10e6);

        // User B deposits same amount
        vm.prank(user2);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.ThreeMonth);

        // User A should get all 10 USDC yield (their 50% share = 5 USDC)
        uint256 userABalBefore = usdc.balanceOf(user);
        vm.prank(user);
        vault.claimYield(0);
        uint256 userAReceived = usdc.balanceOf(user) - userABalBefore;
        assertEq(userAReceived, 5e6, "User A should get all pre-B yield (50% of 10)");

        // User B should get 0 (no yield accrued since they joined)
        uint256 userBBalBefore = usdc.balanceOf(user2);
        vm.prank(user2);
        vault.claimYield(0);
        uint256 userBReceived = usdc.balanceOf(user2) - userBBalBefore;
        assertEq(userBReceived, 0, "User B should get zero - joined after yield accrued");
    }

    function test_WithdrawSettlesYieldBeforePrincipal() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.Flexible);

        // 10 USDC yield
        aavePool.simulateYield(address(vault), 10e6);

        uint256 userBalBefore = usdc.balanceOf(user);
        uint256 newsroomBalBefore = usdc.balanceOf(newsroom);

        vm.prank(user);
        vault.withdraw(0);

        uint256 userReceived = usdc.balanceOf(user) - userBalBefore;
        uint256 newsroomReceived = usdc.balanceOf(newsroom) - newsroomBalBefore;

        // Flexible = 25% user yield. User gets: 2.5 (yield) + 100 (principal) = 102.5
        uint256 expectedYieldUser = (10e6 * 2500) / 10000; // 2.5 USDC
        uint256 expectedYieldNewsroom = 10e6 - expectedYieldUser; // 7.5 USDC
        assertEq(userReceived, DEPOSIT_AMOUNT + expectedYieldUser, "Withdraw should include settled yield");
        assertEq(newsroomReceived, expectedYieldNewsroom, "Newsroom gets yield share on withdraw");
    }

    function test_ClaimYieldWithNoYieldAccrued() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.ThreeMonth);

        // Claim immediately — no yield has accrued
        uint256 balBefore = usdc.balanceOf(user);
        vm.prank(user);
        vault.claimYield(0); // should not revert
        uint256 received = usdc.balanceOf(user) - balBefore;
        assertEq(received, 0, "No yield to claim");
    }

    function test_MultiplePositionsDifferentTiersYieldSplit() public {
        // User creates a Flexible and TwelveMonth position, same amount
        vm.startPrank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.Flexible);      // pos 0
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.TwelveMonth);   // pos 1
        vm.stopPrank();

        // 20 USDC yield accrues (10 per position, since equal deposits)
        aavePool.simulateYield(address(vault), 20e6);

        // Claim Flexible (25% user share)
        uint256 balBefore0 = usdc.balanceOf(user);
        vm.prank(user);
        vault.claimYield(0);
        uint256 received0 = usdc.balanceOf(user) - balBefore0;
        assertEq(received0, (10e6 * 2500) / 10000, "Flexible: 25% of 10 = 2.5 USDC");

        // Claim TwelveMonth (75% user share)
        uint256 balBefore1 = usdc.balanceOf(user);
        vm.prank(user);
        vault.claimYield(1);
        uint256 received1 = usdc.balanceOf(user) - balBefore1;
        assertEq(received1, (10e6 * 7500) / 10000, "TwelveMonth: 75% of 10 = 7.5 USDC");
    }

    function test_DepositAfterAllWithdrawals_NoResidualYieldWindfall() public {
        // User A deposits and withdraws
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.Flexible);
        vm.prank(user);
        vault.withdraw(0);

        // Simulate residual aUSDC left in contract (e.g., Aave rebasing after withdrawal)
        aavePool.simulateYield(address(vault), 5e6);

        // User B deposits small amount — should NOT get the 5 USDC windfall
        vm.prank(user2);
        vault.deposit(1e6, VoxVault.LockTier.Flexible); // 1 USDC

        // Check pending yield for User B — should be 0
        (uint256 userAmount, uint256 newsroomAmount) = vault.getPendingYield(user2, 0);
        assertEq(userAmount, 0, "New depositor should not get residual yield");
        assertEq(newsroomAmount, 0, "Newsroom should not get residual yield");
    }

    function test_DepositAndWithdrawSameBlock() public {
        vm.startPrank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.Flexible);

        uint256 balBefore = usdc.balanceOf(user);
        vault.withdraw(0); // Flexible unlockTime = block.timestamp, so no penalty
        vm.stopPrank();

        assertEq(usdc.balanceOf(user) - balBefore, DEPOSIT_AMOUNT, "Same-block withdraw should return full amount");
    }

    function test_PauseUnpausePreservesYield() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.ThreeMonth);

        // Yield accrues before pause
        aavePool.simulateYield(address(vault), 5e6);
        vault.pause();

        // More yield accrues during pause
        aavePool.simulateYield(address(vault), 5e6);
        vault.unpause();

        // User claims — should get ALL yield (pre + during pause)
        uint256 balBefore = usdc.balanceOf(user);
        vm.prank(user);
        vault.claimYield(0);
        uint256 received = usdc.balanceOf(user) - balBefore;

        // Total yield = 10, ThreeMonth = 50% user share = 5 USDC
        assertEq(received, 5e6, "All yield (pre + during pause) should be claimable");
    }

    function test_ClaimYieldInvalidPositionIdReverts() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.Flexible);

        vm.prank(user);
        vm.expectRevert(); // array out-of-bounds
        vault.claimYield(999);
    }

    function test_RenounceOwnershipReverts() public {
        vm.expectRevert("Ownership renunciation disabled");
        vault.renounceOwnership();
    }

    function test_AUsdcBalanceDecreaseDoesNotBreakAccumulator() public {
        vm.prank(user);
        vault.deposit(DEPOSIT_AMOUNT, VoxVault.LockTier.ThreeMonth);

        // Yield accrues normally
        aavePool.simulateYield(address(vault), 10e6);

        // Simulate aUSDC bad debt: burn some aUSDC from vault
        aUsdc.burn(address(vault), 5e6);

        // User claims — should not revert, accumulator should recover
        // The 5 USDC of yield is still there (10 accrued - 5 burned = 5 actual)
        vm.prank(user);
        vault.claimYield(0);

        // Verify vault is still functional: new yield can accrue
        aavePool.simulateYield(address(vault), 3e6);

        uint256 balBefore = usdc.balanceOf(user);
        vm.prank(user);
        vault.claimYield(0);
        uint256 received = usdc.balanceOf(user) - balBefore;

        // 3 USDC new yield, 50% user share = 1.5
        assertEq(received, (3e6 * 5000) / 10000, "Accumulator should recover after aUSDC decrease");
    }
}
