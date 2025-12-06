import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ContractsService } from '../../../services/contracts.service';
import { ethers } from 'ethers';

@Controller('api/blockchain/staking')
export class StakingController {
  constructor(private readonly contractsService: ContractsService) {}

  /**
   * Create staking pool (admin only)
   * POST /api/blockchain/staking/create-pool
   */
  @Post('create-pool')
  async createPool(@Body() body: {
    name: string;
    lockPeriod: number;
    minStakeAmount: string;
    maxStakeAmount: string;
    rewardRate: number;
  }) {
    try {
      const { name, lockPeriod, minStakeAmount, maxStakeAmount, rewardRate } = body;

      const tx = await this.contractsService.writeContract(
        'MNBStaking',
        'createStakingPool',
        [
          name,
          lockPeriod,
          ethers.parseEther(minStakeAmount),
          ethers.parseEther(maxStakeAmount),
          rewardRate
        ]
      );

      return {
        success: true,
        transactionHash: tx.hash,
        pool: { name, lockPeriod, minStakeAmount, maxStakeAmount, rewardRate }
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get pool info
   * GET /api/blockchain/staking/pool/:poolId
   */
  @Get('pool/:poolId')
  async getPoolInfo(@Param('poolId') poolId: string) {
    try {
      const pool = await this.contractsService.readContract(
        'MNBStaking',
        'stakingPools',
        [poolId]
      );

      return {
        success: true,
        pool: {
          name: pool.name,
          lockPeriod: Number(pool.lockPeriod),
          minStakeAmount: ethers.formatEther(pool.minStakeAmount),
          maxStakeAmount: ethers.formatEther(pool.maxStakeAmount),
          rewardRate: Number(pool.rewardRate),
          totalStaked: ethers.formatEther(pool.totalStaked),
          isActive: pool.isActive
        }
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Stake tokens
   * POST /api/blockchain/staking/stake
   */
  @Post('stake')
  async stake(@Body() body: { poolId: number; amount: string }) {
    try {
      const { poolId, amount } = body;
      const amountWei = ethers.parseEther(amount);

      const tx = await this.contractsService.writeContract(
        'MNBStaking',
        'stake',
        [poolId, amountWei]
      );

      return {
        success: true,
        transactionHash: tx.hash,
        poolId,
        amount,
        amountWei: amountWei.toString()
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Unstake tokens
   * POST /api/blockchain/staking/unstake
   */
  @Post('unstake')
  async unstake(@Body() body: { stakeId: number }) {
    try {
      const { stakeId } = body;

      const tx = await this.contractsService.writeContract(
        'MNBStaking',
        'unstake',
        [stakeId]
      );

      return {
        success: true,
        transactionHash: tx.hash,
        stakeId
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Claim rewards
   * POST /api/blockchain/staking/claim-rewards
   */
  @Post('claim-rewards')
  async claimRewards(@Body() body: { stakeId: number }) {
    try {
      const { stakeId } = body;

      const tx = await this.contractsService.writeContract(
        'MNBStaking',
        'claimRewards',
        [stakeId]
      );

      return {
        success: true,
        transactionHash: tx.hash,
        stakeId
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get user stakes
   * GET /api/blockchain/staking/user-stakes/:address
   */
  @Get('user-stakes/:address')
  async getUserStakes(@Param('address') address: string) {
    try {
      if (!ethers.isAddress(address)) {
        throw new HttpException('Invalid address', HttpStatus.BAD_REQUEST);
      }

      const stakeIds = await this.contractsService.readContract(
        'MNBStaking',
        'getUserStakes',
        [address]
      );

      return {
        success: true,
        address,
        stakeIds: stakeIds.map(id => Number(id)),
        count: stakeIds.length
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Calculate pending rewards
   * GET /api/blockchain/staking/pending-rewards/:stakeId
   */
  @Get('pending-rewards/:stakeId')
  async getPendingRewards(@Param('stakeId') stakeId: string) {
    try {
      const rewards = await this.contractsService.readContract(
        'MNBStaking',
        'calculatePendingRewards',
        [stakeId]
      );

      return {
        success: true,
        stakeId,
        pendingRewards: ethers.formatEther(rewards),
        pendingRewardsWei: rewards.toString()
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all active pools
   * GET /api/blockchain/staking/pools
   */
  @Get('pools')
  async getAllPools() {
    try {
      const poolCount = await this.contractsService.readContract(
        'MNBStaking',
        'poolCount'
      );

      const pools = [];
      for (let i = 1; i <= Number(poolCount); i++) {
        const pool = await this.contractsService.readContract(
          'MNBStaking',
          'stakingPools',
          [i]
        );

        if (pool.isActive) {
          pools.push({
            id: i,
            name: pool.name,
            lockPeriod: Number(pool.lockPeriod),
            minStakeAmount: ethers.formatEther(pool.minStakeAmount),
            maxStakeAmount: ethers.formatEther(pool.maxStakeAmount),
            rewardRate: Number(pool.rewardRate),
            totalStaked: ethers.formatEther(pool.totalStaked)
          });
        }
      }

      return {
        success: true,
        pools,
        totalPools: pools.length
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
