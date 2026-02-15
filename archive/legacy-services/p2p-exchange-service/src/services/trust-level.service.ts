// ============================================================
// Trust Level Service (Layer 2: Anti-Scam)
// ============================================================

import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import {
  TrustLevel,
  CreateTrustLevelInput,
  UpdateTrustLevelInput,
  TrustLevelRequirements,
  NextLevelRequirements,
  TrustLevelCheck,
} from '../types/trust-level.types';
import {
  TrustLevelNotFoundError,
  ExceedsTransactionLimitError,
  InsufficientTrustLevelError,
} from '../errors/ExchangeErrors';

export class TrustLevelService {
  // Trust level configuration
  private readonly LEVEL_CONFIG: Record<number, TrustLevelRequirements> = {
    1: {
      level: 1,
      maxTransactionAmount: new Decimal(100),
      requiredExchanges: 0,
      requiredVolume: new Decimal(0),
      maxDisputes: 0,
      maxTimeouts: 0,
    },
    2: {
      level: 2,
      maxTransactionAmount: new Decimal(500),
      requiredExchanges: 5,
      requiredVolume: new Decimal(500),
      maxDisputes: 0,
      maxTimeouts: 1,
    },
    3: {
      level: 3,
      maxTransactionAmount: new Decimal(2000),
      requiredExchanges: 20,
      requiredVolume: new Decimal(5000),
      maxDisputes: 1,
      maxTimeouts: 2,
    },
    4: {
      // VIP
      level: 4,
      maxTransactionAmount: new Decimal(10000),
      requiredExchanges: 100,
      requiredVolume: new Decimal(50000),
      maxDisputes: 2,
      maxTimeouts: 3,
    },
  };

  constructor(private prisma: PrismaClient) {}

  /**
   * Get user's trust level
   */
  async getTrustLevel(userId: number): Promise<TrustLevel> {
    const trustLevel = await this.prisma.trustLevel.findUnique({
      where: { userId },
    });

    if (!trustLevel) {
      throw new TrustLevelNotFoundError(userId);
    }

    return this.mapToTrustLevel(trustLevel);
  }

  /**
   * Initialize trust level for new user
   */
  async initializeTrustLevel(userId: number): Promise<TrustLevel> {
    // Check if already exists
    const existing = await this.prisma.trustLevel.findUnique({
      where: { userId },
    });

    if (existing) {
      return this.mapToTrustLevel(existing);
    }

    // Create Level 1
    const config = this.LEVEL_CONFIG[1];
    const trustLevel = await this.prisma.trustLevel.create({
      data: {
        userId,
        level: 1,
        maxTransactionAmount: config.maxTransactionAmount,
        successfulExchanges: 0,
        totalVolume: new Decimal(0),
        disputeCount: 0,
        timeoutCount: 0,
      },
    });

    return this.mapToTrustLevel(trustLevel);
  }

  /**
   * Update trust level after successful exchange
   */
  async updateAfterExchange(userId: number, amount: Decimal): Promise<void> {
    const trustLevel = await this.getTrustLevel(userId);

    // Increment counters
    const newSuccessfulExchanges = trustLevel.successfulExchanges + 1;
    const newTotalVolume = trustLevel.totalVolume.add(amount);

    // Check if eligible for level up
    const currentConfig = this.LEVEL_CONFIG[trustLevel.level];
    const nextLevel = trustLevel.level + 1;
    const nextConfig = this.LEVEL_CONFIG[nextLevel];

    let newLevel = trustLevel.level;
    let newMaxAmount = trustLevel.maxTransactionAmount;
    let lastLevelUpAt = trustLevel.lastLevelUpAt;

    if (nextConfig && this.canLevelUp(trustLevel, nextConfig)) {
      newLevel = nextLevel;
      newMaxAmount = nextConfig.maxTransactionAmount;
      lastLevelUpAt = new Date();
    }

    // Update
    await this.prisma.trustLevel.update({
      where: { userId },
      data: {
        level: newLevel,
        maxTransactionAmount: newMaxAmount,
        successfulExchanges: newSuccessfulExchanges,
        totalVolume: newTotalVolume,
        lastLevelUpAt,
      },
    });
  }

  /**
   * Downgrade trust level after dispute/timeout
   */
  async downgradeLevel(userId: number, reason: 'dispute' | 'timeout'): Promise<void> {
    const trustLevel = await this.getTrustLevel(userId);

    // Increment counter
    const updates: any = {};
    if (reason === 'dispute') {
      updates.disputeCount = trustLevel.disputeCount + 1;
    } else {
      updates.timeoutCount = trustLevel.timeoutCount + 1;
    }

    // Check if should downgrade level
    const currentConfig = this.LEVEL_CONFIG[trustLevel.level];
    const newDisputeCount = updates.disputeCount || trustLevel.disputeCount;
    const newTimeoutCount = updates.timeoutCount || trustLevel.timeoutCount;

    if (
      newDisputeCount > currentConfig.maxDisputes ||
      newTimeoutCount > currentConfig.maxTimeouts
    ) {
      // Downgrade to previous level
      const newLevel = Math.max(1, trustLevel.level - 1);
      const newConfig = this.LEVEL_CONFIG[newLevel];

      updates.level = newLevel;
      updates.maxTransactionAmount = newConfig.maxTransactionAmount;
    }

    // Update
    await this.prisma.trustLevel.update({
      where: { userId },
      data: updates,
    });
  }

  /**
   * Check if user can perform exchange
   */
  async canPerformExchange(userId: number, amount: Decimal): Promise<TrustLevelCheck> {
    try {
      const trustLevel = await this.getTrustLevel(userId);

      if (amount.gt(trustLevel.maxTransactionAmount)) {
        return {
          canPerformExchange: false,
          reason: `Amount exceeds trust level ${trustLevel.level} limit of ${trustLevel.maxTransactionAmount}`,
          maxAllowedAmount: trustLevel.maxTransactionAmount,
        };
      }

      return {
        canPerformExchange: true,
        maxAllowedAmount: trustLevel.maxTransactionAmount,
      };
    } catch (error) {
      if (error instanceof TrustLevelNotFoundError) {
        // Initialize trust level for new user
        await this.initializeTrustLevel(userId);
        return this.canPerformExchange(userId, amount);
      }
      throw error;
    }
  }

  /**
   * Get max transaction amount for user
   */
  async getMaxTransactionAmount(userId: number): Promise<Decimal> {
    const trustLevel = await this.getTrustLevel(userId);
    return trustLevel.maxTransactionAmount;
  }

  /**
   * Get next level requirements
   */
  async getNextLevelRequirements(userId: number): Promise<NextLevelRequirements | null> {
    const trustLevel = await this.getTrustLevel(userId);
    const nextLevel = trustLevel.level + 1;
    const nextConfig = this.LEVEL_CONFIG[nextLevel];

    if (!nextConfig) {
      return null; // Already at max level
    }

    const exchangesNeeded = Math.max(
      0,
      nextConfig.requiredExchanges - trustLevel.successfulExchanges
    );
    const volumeNeeded = Decimal.max(
      0,
      nextConfig.requiredVolume.sub(trustLevel.totalVolume)
    );

    return {
      currentLevel: trustLevel.level,
      nextLevel,
      exchangesNeeded,
      volumeNeeded,
      canUpgrade: this.canLevelUp(trustLevel, nextConfig),
    };
  }

  // ============================================================
  // Private Helper Methods
  // ============================================================

  private canLevelUp(
    trustLevel: TrustLevel,
    nextConfig: TrustLevelRequirements
  ): boolean {
    return (
      trustLevel.successfulExchanges >= nextConfig.requiredExchanges &&
      trustLevel.totalVolume.gte(nextConfig.requiredVolume) &&
      trustLevel.disputeCount <= nextConfig.maxDisputes &&
      trustLevel.timeoutCount <= nextConfig.maxTimeouts
    );
  }

  private mapToTrustLevel(data: any): TrustLevel {
    return {
      id: data.id,
      userId: data.userId,
      level: data.level,
      maxTransactionAmount: new Decimal(data.maxTransactionAmount),
      successfulExchanges: data.successfulExchanges,
      totalVolume: new Decimal(data.totalVolume),
      disputeCount: data.disputeCount,
      timeoutCount: data.timeoutCount,
      lastLevelUpAt: data.lastLevelUpAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
