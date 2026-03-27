import { Decimal } from '@prisma/client/runtime/library';
import { TrustLevelService } from '../services/trust-level.service';
import { ExceedsTransactionLimitError } from '../errors/ExchangeErrors';

/**
 * Trust Level Configuration
 * Defines transaction limits and requirements for each trust level
 */
export const TRUST_LEVELS = {
  1: { maxAmount: 100, requiredExchanges: 0, requiredVolume: 0 },
  2: { maxAmount: 500, requiredExchanges: 5, requiredVolume: 500 },
  3: { maxAmount: 2000, requiredExchanges: 20, requiredVolume: 5000 },
  4: { maxAmount: 10000, requiredExchanges: 100, requiredVolume: 50000 },
  5: {
    maxAmount: 50000,
    requiredExchanges: 500,
    requiredVolume: 500000,
    manualReview: true,
  },
} as const;

/**
 * Trust Level Guard - Layer 2 of Seven-Layer Anti-Scam Architecture
 * 
 * Enforces progressive trust levels based on user history.
 * Limits transaction amounts based on trust level.
 * Automatically upgrades users as they build reputation.
 * 
 * Trust Levels:
 * - Level 1: $100 max (new users)
 * - Level 2: $500 max (5 exchanges, $500 volume)
 * - Level 3: $2,000 max (20 exchanges, $5,000 volume)
 * - Level 4: $10,000 max (100 exchanges, $50,000 volume)
 * - Level 5: $50,000 max (500 exchanges, $500,000 volume, manual review)
 */
export class TrustLevelGuard {
  constructor(private readonly trustLevelService: TrustLevelService) {}

  /**
   * Validate that transaction amount is within user's trust level limit
   * 
   * @param userId - User ID
   * @param amount - Transaction amount
   * @throws ExceedsTransactionLimitError if amount exceeds limit
   */
  async validateTransactionAmount(userId: number, amount: Decimal): Promise<void> {
    const trustLevel = await this.trustLevelService.getTrustLevel(userId);
    const maxAmount = new Decimal(trustLevel.maxTransactionAmount);

    if (amount.greaterThan(maxAmount)) {
      throw new ExceedsTransactionLimitError(
        userId,
        trustLevel.level,
        amount.toString(),
        maxAmount.toString()
      );
    }
  }

  /**
   * Update trust level after successful exchange
   * Automatically upgrades user if requirements are met
   * 
   * @param userId - User ID
   * @param amount - Transaction amount
   */
  async updateAfterSuccess(userId: number, amount: Decimal): Promise<void> {
    await this.trustLevelService.updateAfterExchange(userId, amount);

    const trustLevel = await this.trustLevelService.getTrustLevel(userId);

    // Check for level up
    const nextLevel = trustLevel.level + 1;
    if (TRUST_LEVELS[nextLevel as keyof typeof TRUST_LEVELS]) {
      const requirements = TRUST_LEVELS[nextLevel as keyof typeof TRUST_LEVELS];

      if (
        trustLevel.successfulExchanges >= requirements.requiredExchanges &&
        trustLevel.totalVolume.greaterThanOrEqualTo(requirements.requiredVolume)
      ) {
        // Level up!
        console.log('TRUST_LEVEL_UP', {
          userId,
          oldLevel: trustLevel.level,
          newLevel: nextLevel,
          successfulExchanges: trustLevel.successfulExchanges,
          totalVolume: trustLevel.totalVolume.toString(),
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Downgrade trust level after violation
   * 
   * @param userId - User ID
   * @param reason - Reason for downgrade ('dispute' or 'timeout')
   */
  async downgradeLevel(userId: number, reason: 'dispute' | 'timeout'): Promise<void> {
    await this.trustLevelService.downgradeLevel(userId, reason);

    console.log('TRUST_LEVEL_DOWNGRADE', {
      userId,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get maximum transaction amount for user
   * 
   * @param userId - User ID
   * @returns Maximum transaction amount
   */
  async getMaxTransactionAmount(userId: number): Promise<Decimal> {
    const trustLevel = await this.trustLevelService.getTrustLevel(userId);
    return new Decimal(trustLevel.maxTransactionAmount);
  }

  /**
   * Get trust level requirements for next level
   * 
   * @param userId - User ID
   * @returns Requirements for next level or null if at max level
   */
  async getNextLevelRequirements(
    userId: number
  ): Promise<{ level: number; exchangesNeeded: number; volumeNeeded: Decimal } | null> {
    const trustLevel = await this.trustLevelService.getTrustLevel(userId);
    const nextLevel = trustLevel.level + 1;

    if (!TRUST_LEVELS[nextLevel as keyof typeof TRUST_LEVELS]) {
      return null; // Already at max level
    }

    const requirements = TRUST_LEVELS[nextLevel as keyof typeof TRUST_LEVELS];

    return {
      level: nextLevel,
      exchangesNeeded: Math.max(
        0,
        requirements.requiredExchanges - trustLevel.successfulExchanges
      ),
      volumeNeeded: new Decimal(
        Math.max(0, requirements.requiredVolume - trustLevel.totalVolume.toNumber())
      ),
    };
  }

  /**
   * Check if user can perform exchange without throwing
   * 
   * @param userId - User ID
   * @param amount - Transaction amount
   * @returns True if allowed, false otherwise
   */
  async canPerformExchange(userId: number, amount: Decimal): Promise<boolean> {
    try {
      await this.validateTransactionAmount(userId, amount);
      return true;
    } catch (error) {
      if (error instanceof ExceedsTransactionLimitError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get trust level configuration
   * 
   * @param level - Trust level number
   * @returns Trust level configuration
   */
  getTrustLevelConfig(level: number): typeof TRUST_LEVELS[keyof typeof TRUST_LEVELS] | null {
    return TRUST_LEVELS[level as keyof typeof TRUST_LEVELS] || null;
  }

  /**
   * Record timeout for user (affects trust level)
   * 
   * @param userId - User ID
   * @param stage - Stage where timeout occurred
   */
  async recordTimeout(userId: number, stage: string): Promise<void> {
    const trustLevel = await this.trustLevelService.getTrustLevel(userId);

    // Downgrade after 3 timeouts
    if (trustLevel.timeoutCount >= 3) {
      await this.downgradeLevel(userId, 'timeout');
    }

    console.log('TIMEOUT_RECORDED', {
      userId,
      stage,
      timeoutCount: trustLevel.timeoutCount,
      timestamp: new Date().toISOString(),
    });
  }
}
