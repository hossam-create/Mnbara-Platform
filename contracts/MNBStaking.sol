// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MNBToken.sol";

/**
 * @title MNBStaking
 * @dev Staking contract for MNBToken with reward distribution and flexible staking periods
 */
contract MNBStaking is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    using EnumerableSet for EnumerableSet.UintSet;

    bytes32 public constant STAKING_ADMIN_ROLE = keccak256("STAKING_ADMIN_ROLE");
    bytes32 public constant REWARD_MANAGER_ROLE = keccak256("REWARD_MANAGER_ROLE");

    IERC20 public stakingToken;
    IERC20 public rewardToken;

    struct StakingPool {
        uint256 poolId;
        string name;
        uint256 lockPeriod; // in seconds
        uint256 minStakeAmount;
        uint256 maxStakeAmount;
        uint256 rewardRate; // rewards per second per token
        uint256 totalStaked;
        uint256 totalRewardsDistributed;
        bool isActive;
        uint256 createdAt;
    }

    struct UserStake {
        uint256 stakeId;
        uint256 poolId;
        uint256 amount;
        uint256 stakedAt;
        uint256 unlockTime;
        uint256 lastRewardClaimTime;
        uint256 claimedRewards;
        bool isActive;
    }

    // Pool management
    mapping(uint256 => StakingPool) public stakingPools;
    uint256 public nextPoolId;

    // User stakes
    mapping(address => EnumerableSet.UintSet) private userStakeIds;
    mapping(uint256 => UserStake) public userStakes;
    uint256 public nextStakeId;

    // User rewards tracking
    mapping(address => uint256) public userTotalRewards;
    mapping(address => uint256) public userPendingRewards;

    // Global statistics
    uint256 public totalStaked;
    uint256 public totalRewardsDistributed;
    uint256 public totalActiveStakers;

    // Events
    event PoolCreated(uint256 indexed poolId, string name, uint256 lockPeriod, uint256 rewardRate);
    event PoolUpdated(uint256 indexed poolId, uint256 rewardRate, bool isActive);
    event Staked(address indexed user, uint256 indexed stakeId, uint256 poolId, uint256 amount, uint256 unlockTime);
    event Unstaked(address indexed user, uint256 indexed stakeId, uint256 amount, uint256 rewards);
    event RewardsClaimed(address indexed user, uint256 amount);
    event EmergencyUnstake(address indexed user, uint256 stakeId, uint256 amount, uint256 penalty);
    event RewardsAdded(uint256 amount);
    event RewardsDistributed(uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _stakingToken,
        address _rewardToken,
        address defaultAdmin
    ) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(STAKING_ADMIN_ROLE, defaultAdmin);
        _grantRole(REWARD_MANAGER_ROLE, defaultAdmin);

        nextPoolId = 1;
        nextStakeId = 1;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
     * @dev Create a new staking pool
     */
    function createStakingPool(
        string memory name,
        uint256 lockPeriod,
        uint256 minStakeAmount,
        uint256 maxStakeAmount,
        uint256 rewardRate
    ) external onlyRole(STAKING_ADMIN_ROLE) returns (uint256) {
        uint256 poolId = nextPoolId++;
        
        stakingPools[poolId] = StakingPool({
            poolId: poolId,
            name: name,
            lockPeriod: lockPeriod,
            minStakeAmount: minStakeAmount,
            maxStakeAmount: maxStakeAmount,
            rewardRate: rewardRate,
            totalStaked: 0,
            totalRewardsDistributed: 0,
            isActive: true,
            createdAt: block.timestamp
        });

        emit PoolCreated(poolId, name, lockPeriod, rewardRate);
        return poolId;
    }

    /**
     * @dev Update staking pool parameters
     */
    function updateStakingPool(
        uint256 poolId,
        uint256 rewardRate,
        bool isActive
    ) external onlyRole(STAKING_ADMIN_ROLE) {
        require(stakingPools[poolId].poolId == poolId, "Pool does not exist");
        
        stakingPools[poolId].rewardRate = rewardRate;
        stakingPools[poolId].isActive = isActive;

        emit PoolUpdated(poolId, rewardRate, isActive);
    }

    /**
     * @dev Stake tokens in a pool
     */
    function stake(uint256 poolId, uint256 amount) external {
        StakingPool storage pool = stakingPools[poolId];
        require(pool.poolId == poolId, "Pool does not exist");
        require(pool.isActive, "Pool is not active");
        require(amount >= pool.minStakeAmount, "Amount below minimum");
        require(amount <= pool.maxStakeAmount, "Amount exceeds maximum");
        
        // Transfer tokens from user
        require(stakingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        uint256 stakeId = nextStakeId++;
        uint256 unlockTime = block.timestamp + pool.lockPeriod;

        userStakes[stakeId] = UserStake({
            stakeId: stakeId,
            poolId: poolId,
            amount: amount,
            stakedAt: block.timestamp,
            unlockTime: unlockTime,
            lastRewardClaimTime: block.timestamp,
            claimedRewards: 0,
            isActive: true
        });

        userStakeIds[msg.sender].add(stakeId);
        
        // Update pool and global statistics
        pool.totalStaked += amount;
        totalStaked += amount;
        totalActiveStakers++;

        emit Staked(msg.sender, stakeId, poolId, amount, unlockTime);
    }

    /**
     * @dev Calculate pending rewards for a stake
     */
    function calculatePendingRewards(uint256 stakeId) public view returns (uint256) {
        UserStake memory stakeInfo = userStakes[stakeId];
        if (!stakeInfo.isActive) return 0;

        StakingPool memory pool = stakingPools[stakeInfo.poolId];
        uint256 timeStaked = block.timestamp - stakeInfo.lastRewardClaimTime;
        
        return (stakeInfo.amount * pool.rewardRate * timeStaked) / 1e18;
    }

    /**
     * @dev Claim rewards for a specific stake
     */
    function claimRewards(uint256 stakeId) external {
        UserStake storage stakeInfo = userStakes[stakeId];
        require(stakeInfo.isActive, "Stake not active");
        require(userStakeIds[msg.sender].contains(stakeId), "Not your stake");

        uint256 rewards = calculatePendingRewards(stakeId);
        require(rewards > 0, "No rewards to claim");

        // Update stake info
        stakeInfo.lastRewardClaimTime = block.timestamp;
        stakeInfo.claimedRewards += rewards;

        // Update global statistics
        stakingPools[stakeInfo.poolId].totalRewardsDistributed += rewards;
        totalRewardsDistributed += rewards;
        userTotalRewards[msg.sender] += rewards;

        // Transfer rewards
        require(rewardToken.transfer(msg.sender, rewards), "Reward transfer failed");

        emit RewardsClaimed(msg.sender, rewards);
    }

    /**
     * @dev Unstake tokens after lock period
     */
    function unstake(uint256 stakeId) external {
        UserStake storage stakeInfo = userStakes[stakeId];
        require(stakeInfo.isActive, "Stake not active");
        require(userStakeIds[msg.sender].contains(stakeId), "Not your stake");
        require(block.timestamp >= stakeInfo.unlockTime, "Lock period not ended");

        // Claim any remaining rewards first
        uint256 rewards = calculatePendingRewards(stakeId);
        if (rewards > 0) {
            stakeInfo.lastRewardClaimTime = block.timestamp;
            stakeInfo.claimedRewards += rewards;
            
            stakingPools[stakeInfo.poolId].totalRewardsDistributed += rewards;
            totalRewardsDistributed += rewards;
            userTotalRewards[msg.sender] += rewards;

            require(rewardToken.transfer(msg.sender, rewards), "Reward transfer failed");
        }

        // Return staked tokens
        uint256 stakedAmount = stakeInfo.amount;
        stakeInfo.isActive = false;
        
        // Update statistics
        stakingPools[stakeInfo.poolId].totalStaked -= stakedAmount;
        totalStaked -= stakedAmount;
        totalActiveStakers--;

        userStakeIds[msg.sender].remove(stakeId);

        require(stakingToken.transfer(msg.sender, stakedAmount), "Stake return failed");

        emit Unstaked(msg.sender, stakeId, stakedAmount, rewards);
    }

    /**
     * @dev Emergency unstake with penalty
     */
    function emergencyUnstake(uint256 stakeId) external {
        UserStake storage stakeInfo = userStakes[stakeId];
        require(stakeInfo.isActive, "Stake not active");
        require(userStakeIds[msg.sender].contains(stakeId), "Not your stake");
        require(block.timestamp < stakeInfo.unlockTime, "Use regular unstake");

        // Calculate penalty (50% of staked amount)
        uint256 stakedAmount = stakeInfo.amount;
        uint256 penalty = stakedAmount / 2;
        uint256 returnAmount = stakedAmount - penalty;

        stakeInfo.isActive = false;

        // Update statistics
        stakingPools[stakeInfo.poolId].totalStaked -= stakedAmount;
        totalStaked -= stakedAmount;
        totalActiveStakers--;

        userStakeIds[msg.sender].remove(stakeId);

        // Transfer remaining tokens back to user
        require(stakingToken.transfer(msg.sender, returnAmount), "Stake return failed");
        // Burn penalty or send to treasury
        require(stakingToken.transfer(address(0xdead), penalty), "Penalty transfer failed");

        emit EmergencyUnstake(msg.sender, stakeId, returnAmount, penalty);
    }

    /**
     * @dev Add rewards to the contract
     */
    function addRewards(uint256 amount) external onlyRole(REWARD_MANAGER_ROLE) {
        require(rewardToken.transferFrom(msg.sender, address(this), amount), "Reward transfer failed");
        emit RewardsAdded(amount);
    }

    /**
     * @dev Get user's active stake IDs
     */
    function getUserStakeIds(address user) external view returns (uint256[] memory) {
        return userStakeIds[user].values();
    }

    /**
     * @dev Get user's total pending rewards across all stakes
     */
    function getUserTotalPendingRewards(address user) external view returns (uint256) {
        uint256 totalPending;
        uint256[] memory stakeIds = userStakeIds[user].values();
        
        for (uint256 i = 0; i < stakeIds.length; i++) {
            totalPending += calculatePendingRewards(stakeIds[i]);
        }
        
        return totalPending;
    }

    /**
     * @dev Get pool information
     */
    function getPoolInfo(uint256 poolId) external view returns (
        string memory name,
        uint256 lockPeriod,
        uint256 minStakeAmount,
        uint256 maxStakeAmount,
        uint256 rewardRate,
        uint256 totalStaked,
        bool isActive
    ) {
        StakingPool memory pool = stakingPools[poolId];
        return (
            pool.name,
            pool.lockPeriod,
            pool.minStakeAmount,
            pool.maxStakeAmount,
            pool.rewardRate,
            pool.totalStaked,
            pool.isActive
        );
    }

    /**
     * @dev Get stake information
     */
    function getStakeInfo(uint256 stakeId) external view returns (
        uint256 poolId,
        uint256 amount,
        uint256 stakedAt,
        uint256 unlockTime,
        uint256 lastRewardClaimTime,
        uint256 claimedRewards,
        uint256 pendingRewards,
        bool isActive
    ) {
        UserStake memory stakeInfo = userStakes[stakeId];
        uint256 pending = calculatePendingRewards(stakeId);
        
        return (
            stakeInfo.poolId,
            stakeInfo.amount,
            stakeInfo.stakedAt,
            stakeInfo.unlockTime,
            stakeInfo.lastRewardClaimTime,
            stakeInfo.claimedRewards,
            pending,
            stakeInfo.isActive
        );
    }

    // Admin functions
    function withdrawExcessRewards(address to, uint256 amount) external onlyRole(REWARD_MANAGER_ROLE) {
        uint256 contractBalance = rewardToken.balanceOf(address(this));
        uint256 requiredRewards = totalRewardsDistributed - userTotalRewards[to];
        
        require(contractBalance > requiredRewards, "Insufficient excess rewards");
        require(amount <= contractBalance - requiredRewards, "Amount too high");
        
        require(rewardToken.transfer(to, amount), "Transfer failed");
    }

    function migrateStakingToken(address newToken) external onlyRole(STAKING_ADMIN_ROLE) {
        stakingToken = IERC20(newToken);
    }

    function migrateRewardToken(address newToken) external onlyRole(STAKING_ADMIN_ROLE) {
        rewardToken = IERC20(newToken);
    }
}