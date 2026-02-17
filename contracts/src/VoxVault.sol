// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

contract VoxVault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    enum LockTier { Flexible, ThreeMonth, SixMonth, TwelveMonth }

    struct Position {
        uint256 amount;
        uint256 depositTime;
        uint256 unlockTime;
        LockTier tier;
        uint256 yieldDebt;      // accumulated yield already accounted for
        bool active;
    }

    IERC20 public immutable usdc;
    IERC20 public immutable aUsdc;
    IAavePool public immutable aavePool;
    address public newsroomFund;

    uint256 public constant PRECISION = 1e18;
    uint256 public constant MIN_DEPOSIT = 1e6; // 1 USDC

    mapping(LockTier => uint256) public userShareBps;
    mapping(LockTier => uint256) public earlyWithdrawalPenaltyBps;
    mapping(address => Position[]) public positions;

    uint256 public totalDeposited;
    uint256 public totalNewsroomFunded;
    uint256 public accYieldPerShare;    // accumulated yield per deposited unit, scaled by PRECISION
    uint256 public lastTrackedBalance;  // expected aUSDC balance (for detecting new yield from rebasing)

    event Deposited(address indexed user, uint256 indexed positionId, uint256 amount, LockTier tier);
    event Withdrawn(address indexed user, uint256 indexed positionId, uint256 amount, uint256 penalty);
    event YieldClaimed(address indexed user, uint256 indexed positionId, uint256 userAmount, uint256 newsroomAmount);
    event NewsroomFundUpdated(address indexed oldFund, address indexed newFund);

    constructor(
        address _usdc,
        address _aUsdc,
        address _aavePool,
        address _newsroomFund
    ) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_aUsdc != address(0), "Invalid aUSDC address");
        require(_aavePool != address(0), "Invalid Aave pool address");
        require(_newsroomFund != address(0), "Invalid newsroom address");

        usdc = IERC20(_usdc);
        aUsdc = IERC20(_aUsdc);
        aavePool = IAavePool(_aavePool);
        newsroomFund = _newsroomFund;

        // Yield split: user keeps this %, newsroom gets the rest
        userShareBps[LockTier.Flexible] = 2500;      // 25%
        userShareBps[LockTier.ThreeMonth] = 5000;     // 50%
        userShareBps[LockTier.SixMonth] = 6000;       // 60%
        userShareBps[LockTier.TwelveMonth] = 7500;    // 75%

        // Early withdrawal penalties scaled by tier (per PRD)
        earlyWithdrawalPenaltyBps[LockTier.Flexible] = 0;        // no lock = no penalty
        earlyWithdrawalPenaltyBps[LockTier.ThreeMonth] = 500;    // 5%
        earlyWithdrawalPenaltyBps[LockTier.SixMonth] = 750;      // 7.5%
        earlyWithdrawalPenaltyBps[LockTier.TwelveMonth] = 1000;  // 10%
    }

    // ── Yield Accumulator ──────────────────────────

    /// @dev Captures any new yield from aUSDC rebasing into the per-share accumulator.
    ///      Must be called before any operation that changes totalDeposited or aUSDC balance.
    function _updatePool() internal {
        if (totalDeposited == 0) return;
        uint256 currentBalance = aUsdc.balanceOf(address(this));
        if (currentBalance > lastTrackedBalance) {
            uint256 newYield = currentBalance - lastTrackedBalance;
            accYieldPerShare += (newYield * PRECISION) / totalDeposited;
            lastTrackedBalance = currentBalance;
        } else if (currentBalance < lastTrackedBalance) {
            // aUSDC balance decreased (Aave bad debt / protocol issue).
            // Reset tracking to prevent permanently broken accumulator.
            lastTrackedBalance = currentBalance;
        }
    }

    /// @dev Returns pending yield for a position without modifying state (for view functions).
    function _pendingYield(Position storage pos) internal view returns (uint256) {
        uint256 currentAcc = accYieldPerShare;
        if (totalDeposited > 0) {
            uint256 currentBalance = aUsdc.balanceOf(address(this));
            if (currentBalance > lastTrackedBalance) {
                uint256 newYield = currentBalance - lastTrackedBalance;
                currentAcc += (newYield * PRECISION) / totalDeposited;
            }
        }
        uint256 accumulated = (pos.amount * currentAcc) / PRECISION;
        return accumulated > pos.yieldDebt ? accumulated - pos.yieldDebt : 0;
    }

    // ── Core Functions ─────────────────────────────

    function deposit(uint256 amount, LockTier tier) external nonReentrant whenNotPaused {
        require(amount >= MIN_DEPOSIT, "Below minimum deposit");

        _updatePool();

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        usdc.forceApprove(address(aavePool), amount);
        aavePool.supply(address(usdc), amount, address(this), 0);

        uint256 unlockTime;
        if (tier == LockTier.Flexible) {
            unlockTime = block.timestamp;
        } else if (tier == LockTier.ThreeMonth) {
            unlockTime = block.timestamp + 90 days;
        } else if (tier == LockTier.SixMonth) {
            unlockTime = block.timestamp + 180 days;
        } else {
            unlockTime = block.timestamp + 365 days;
        }

        positions[msg.sender].push(Position({
            amount: amount,
            depositTime: block.timestamp,
            unlockTime: unlockTime,
            tier: tier,
            yieldDebt: (amount * accYieldPerShare) / PRECISION,
            active: true
        }));

        bool wasEmpty = totalDeposited == 0;
        totalDeposited += amount;

        // If this is the first deposit (or first after all withdrawals), sync to actual
        // aUSDC balance to prevent residual yield from giving the new depositor a windfall.
        if (wasEmpty) {
            lastTrackedBalance = aUsdc.balanceOf(address(this));
        } else {
            lastTrackedBalance += amount;
        }

        emit Deposited(msg.sender, positions[msg.sender].length - 1, amount, tier);
    }

    function withdraw(uint256 positionId) external nonReentrant whenNotPaused {
        Position storage pos = positions[msg.sender][positionId];
        require(pos.active, "Position not active");

        _updatePool();
        _settleYield(msg.sender, positionId);

        uint256 amount = pos.amount;
        uint256 penalty = 0;

        if (block.timestamp < pos.unlockTime) {
            penalty = (amount * earlyWithdrawalPenaltyBps[pos.tier]) / 10000;
        }

        pos.active = false;
        totalDeposited -= amount;

        // Cap withdrawal to actual aUSDC balance (Aave's scaled math can round down by 1-2 wei)
        uint256 aUsdcBal = aUsdc.balanceOf(address(this));
        uint256 toWithdraw = amount > aUsdcBal ? aUsdcBal : amount;
        uint256 actualWithdrawn = aavePool.withdraw(address(usdc), toWithdraw, address(this));
        lastTrackedBalance = lastTrackedBalance > actualWithdrawn ? lastTrackedBalance - actualWithdrawn : 0;

        // Distribute what was actually received; penalty still based on original amount
        uint256 userReceives = actualWithdrawn > penalty ? actualWithdrawn - penalty : 0;
        usdc.safeTransfer(msg.sender, userReceives);

        if (penalty > 0) {
            usdc.safeTransfer(newsroomFund, penalty);
            totalNewsroomFunded += penalty;
        }

        emit Withdrawn(msg.sender, positionId, actualWithdrawn, penalty);
    }

    function claimYield(uint256 positionId) external nonReentrant whenNotPaused {
        _updatePool();
        _settleYield(msg.sender, positionId);
    }

    /// @dev Settles pending yield for a position: splits between user and newsroom, withdraws from Aave.
    function _settleYield(address user, uint256 positionId) internal {
        Position storage pos = positions[user][positionId];
        require(pos.active, "Position not active");

        uint256 accumulated = (pos.amount * accYieldPerShare) / PRECISION;
        uint256 pending = accumulated > pos.yieldDebt ? accumulated - pos.yieldDebt : 0;
        pos.yieldDebt = accumulated;

        if (pending == 0) return;

        // Cap to actual aUSDC balance (Aave rounding)
        uint256 aUsdcBal = aUsdc.balanceOf(address(this));
        uint256 toWithdraw = pending > aUsdcBal ? aUsdcBal : pending;
        if (toWithdraw == 0) return;

        uint256 actualWithdrawn = aavePool.withdraw(address(usdc), toWithdraw, address(this));
        lastTrackedBalance = lastTrackedBalance > actualWithdrawn ? lastTrackedBalance - actualWithdrawn : 0;

        uint256 userYield = (actualWithdrawn * userShareBps[pos.tier]) / 10000;
        uint256 newsroomYield = actualWithdrawn - userYield;

        if (userYield > 0) usdc.safeTransfer(user, userYield);
        if (newsroomYield > 0) {
            usdc.safeTransfer(newsroomFund, newsroomYield);
            totalNewsroomFunded += newsroomYield;
        }

        emit YieldClaimed(user, positionId, userYield, newsroomYield);
    }

    // ── View Functions ─────────────────────────────

    function getPositionCount(address user) external view returns (uint256) {
        return positions[user].length;
    }

    function getPosition(address user, uint256 positionId) external view returns (Position memory) {
        return positions[user][positionId];
    }

    function getUserPositions(address user) external view returns (Position[] memory) {
        return positions[user];
    }

    /// @notice Returns pending yield split into user and newsroom shares.
    function getPendingYield(address user, uint256 positionId) external view returns (uint256 userAmount, uint256 newsroomAmount) {
        Position storage pos = positions[user][positionId];
        if (!pos.active) return (0, 0);
        uint256 pending = _pendingYield(pos);
        userAmount = (pending * userShareBps[pos.tier]) / 10000;
        newsroomAmount = pending - userAmount;
    }

    // ── Admin Functions ────────────────────────────

    function setNewsroomFund(address _newsroomFund) external onlyOwner {
        require(_newsroomFund != address(0), "Invalid newsroom address");
        emit NewsroomFundUpdated(newsroomFund, _newsroomFund);
        newsroomFund = _newsroomFund;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @dev Prevent accidental ownership renunciation which would brick pause/unpause and admin functions.
    function renounceOwnership() public pure override {
        revert("Ownership renunciation disabled");
    }
}
