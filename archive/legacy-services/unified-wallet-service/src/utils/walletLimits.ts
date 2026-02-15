import { Decimal } from 'decimal.js';
import { logger } from './logger';

interface WalletLimitCheck {
  walletId: string;
  transactionType: string;
  amount: Decimal;
  currency: string;
}

interface LimitCheckResult {
  allowed: boolean;
  message?: string;
  remaining?: Decimal;
  limit?: Decimal;
}

export const checkWalletLimits = async ({
  walletId,
  transactionType,
  amount,
  currency,
}: WalletLimitCheck): Promise<LimitCheckResult> => {
  try {
    // Get all active limits for the wallet
    const limits = await (global as any).prisma.walletLimit.findMany({
      where: {
        walletId,
        isActive: true,
      },
    });

    if (limits.length === 0) {
      return { allowed: true }; // No limits configured
    }

    // Check each limit type
    for (const limit of limits) {
      const limitAmount = new Decimal(limit.maxAmount);
      const currentUsage = new Decimal(limit.currentUsage);
      
      // Check if this limit applies to the transaction type
      if (!appliesToTransaction(limit.type, transactionType)) {
        continue;
      }

      // Check if limit needs to be reset
      if (shouldResetLimit(limit)) {
        await resetLimit(limit);
        continue;
      }

      // Check if transaction would exceed limit
      const newUsage = currentUsage.plus(amount);
      if (newUsage.gt(limitAmount)) {
        const remaining = limitAmount.minus(currentUsage);
        return {
          allowed: false,
          message: `${limit.type} ${limit.limitType} limit exceeded. Remaining: ${remaining.toString()} ${currency}`,
          remaining,
          limit: limitAmount,
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    logger.error('Error checking wallet limits:', error);
    return { allowed: false, message: 'Failed to check limits' };
  }
};

export const updateWalletLimitUsage = async ({
  walletId,
  transactionType,
  amount,
}: WalletLimitCheck): Promise<void> => {
  try {
    const limits = await (global as any).prisma.walletLimit.findMany({
      where: {
        walletId,
        isActive: true,
      },
    });

    for (const limit of limits) {
      if (!appliesToTransaction(limit.type, transactionType)) {
        continue;
      }

      // Check if limit needs to be reset
      if (shouldResetLimit(limit)) {
        await resetLimit(limit);
        continue;
      }

      // Update current usage
      const currentUsage = new Decimal(limit.currentUsage);
      const newUsage = currentUsage.plus(amount);

      await (global as any).prisma.walletLimit.update({
        where: { id: limit.id },
        data: {
          currentUsage: newUsage.toString(),
          updatedAt: new Date(),
        },
      });

      logger.info(`Updated wallet limit usage: ${limit.id}, new usage: ${newUsage.toString()}`);
    }
  } catch (error) {
    logger.error('Error updating wallet limit usage:', error);
    throw new Error('Failed to update wallet limits');
  }
};

const appliesToTransaction = (limitType: string, transactionType: string): boolean => {
  const limitTypeMap: Record<string, string[]> = {
    'daily': ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'],
    'weekly': ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'],
    'monthly': ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'],
    'yearly': ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'],
    'transaction': ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'],
  };

  return limitTypeMap[limitType]?.includes(transactionType) || false;
};

const shouldResetLimit = (limit: any): boolean => {
  if (!limit.lastResetAt || !limit.resetPeriod) {
    return false;
  }

  const now = new Date();
  const lastReset = new Date(limit.lastResetAt);
  const resetPeriod = limit.resetPeriod;

  switch (resetPeriod) {
    case 'daily':
      return now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
    case 'weekly':
      const weekDiff = Math.floor((now.getTime() - lastReset.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return weekDiff >= 1;
    case 'monthly':
      return now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
    case 'yearly':
      return now.getFullYear() !== lastReset.getFullYear();
    default:
      return false;
  }
};

const resetLimit = async (limit: any): Promise<void> => {
  try {
    await (global as any).prisma.walletLimit.update({
      where: { id: limit.id },
      data: {
        currentUsage: '0',
        lastResetAt: new Date(),
        updatedAt: new Date(),
      },
    });

    logger.info(`Reset wallet limit: ${limit.id}`);
  } catch (error) {
    logger.error('Error resetting wallet limit:', error);
    throw new Error('Failed to reset wallet limit');
  }
};

export const createWalletLimit = async ({
  walletId,
  type,
  limitType,
  currency,
  maxAmount,
  resetPeriod,
}: {
  walletId: string;
  type: string;
  limitType: string;
  currency: string;
  maxAmount: Decimal;
  resetPeriod?: string;
}): Promise<void> => {
  try {
    await (global as any).prisma.walletLimit.create({
      data: {
        walletId,
        type,
        limitType,
        currency,
        maxAmount: maxAmount.toString(),
        currentUsage: '0',
        resetPeriod,
        lastResetAt: new Date(),
      },
    });

    logger.info(`Created wallet limit: ${walletId} - ${type} ${limitType}: ${maxAmount.toString()} ${currency}`);
  } catch (error) {
    logger.error('Error creating wallet limit:', error);
    throw new Error('Failed to create wallet limit');
  }
};