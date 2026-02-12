// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

contract VoxVault is Ownable {
    using SafeERC20 for IERC20;

    enum LockTier { Flexible, ThreeMonth, SixMonth, TwelveMonth }

    struct Position {
        uint256 amount;
        uint256 depositTime;
        uint256 unlockTime;
        LockTier tier;
        uint256 lastClaimTime;
        bool active;
    }

    IERC20 public immutable usdc;
    IERC20 public immutable aUsdc;
    IAavePool public immutable aavePool;
    address public newsroomFund;

    mapping(LockTier => uint256) public userShareBps;
    mapping(address => Position[]) public positions;

    uint256 public totalDeposited;
    uint256 public totalNewsroomFunded;
    uint256 public constant EARLY_WITHDRAWAL_PENALTY_BPS = 500; // 5%
    uint256 public constant MIN_DEPOSIT = 1e6; // 1 USDC

    event Deposited(address indexed user, uint256 indexed positionId, uint256 amount, LockTier tier);
    event Withdrawn(address indexed user, uint256 indexed positionId, uint256 amount, uint256 penalty);
    event YieldClaimed(address indexed user, uint256 indexed positionId, uint256 userAmount, uint256 newsroomAmount);

    constructor(
        address _usdc,
        address _aUsdc,
        address _aavePool,
        address _newsroomFund
    ) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        aUsdc = IERC20(_aUsdc);
        aavePool = IAavePool(_aavePool);
        newsroomFund = _newsroomFund;

        userShareBps[LockTier.Flexible] = 2500;
        userShareBps[LockTier.ThreeMonth] = 5000;
        userShareBps[LockTier.SixMonth] = 6000;
        userShareBps[LockTier.TwelveMonth] = 7500;
    }

    function deposit(uint256 amount, LockTier tier) external {
        require(amount >= MIN_DEPOSIT, "Below minimum deposit");

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        usdc.approve(address(aavePool), amount);
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
            lastClaimTime: block.timestamp,
            active: true
        }));

        totalDeposited += amount;
        emit Deposited(msg.sender, positions[msg.sender].length - 1, amount, tier);
    }

    function withdraw(uint256 positionId) external {
        Position storage pos = positions[msg.sender][positionId];
        require(pos.active, "Position not active");

        _claimYield(msg.sender, positionId);

        uint256 amount = pos.amount;
        uint256 penalty = 0;

        if (block.timestamp < pos.unlockTime) {
            penalty = (amount * EARLY_WITHDRAWAL_PENALTY_BPS) / 10000;
        }

        pos.active = false;
        totalDeposited -= amount;

        aavePool.withdraw(address(usdc), amount, address(this));
        usdc.safeTransfer(msg.sender, amount - penalty);

        if (penalty > 0) {
            usdc.safeTransfer(newsroomFund, penalty);
            totalNewsroomFunded += penalty;
        }

        emit Withdrawn(msg.sender, positionId, amount, penalty);
    }

    function claimYield(uint256 positionId) external {
        _claimYield(msg.sender, positionId);
    }

    function _claimYield(address user, uint256 positionId) internal {
        Position storage pos = positions[user][positionId];
        require(pos.active, "Position not active");

        uint256 aUsdcBalance = aUsdc.balanceOf(address(this));
        if (aUsdcBalance <= totalDeposited || totalDeposited == 0) return;

        uint256 totalYield = aUsdcBalance - totalDeposited;
        uint256 positionYield = (totalYield * pos.amount) / totalDeposited;
        if (positionYield == 0) return;

        uint256 userYield = (positionYield * userShareBps[pos.tier]) / 10000;
        uint256 newsroomYield = positionYield - userYield;

        pos.lastClaimTime = block.timestamp;

        aavePool.withdraw(address(usdc), positionYield, address(this));

        if (userYield > 0) usdc.safeTransfer(user, userYield);
        if (newsroomYield > 0) {
            usdc.safeTransfer(newsroomFund, newsroomYield);
            totalNewsroomFunded += newsroomYield;
        }

        emit YieldClaimed(user, positionId, userYield, newsroomYield);
    }

    // View functions
    function getPositionCount(address user) external view returns (uint256) {
        return positions[user].length;
    }

    function getPosition(address user, uint256 positionId) external view returns (Position memory) {
        return positions[user][positionId];
    }

    function getUserPositions(address user) external view returns (Position[] memory) {
        return positions[user];
    }

    function setNewsroomFund(address _newsroomFund) external onlyOwner {
        newsroomFund = _newsroomFund;
    }
}
