import { prisma } from '../index';
import { logger } from './logger';
import { Decimal } from '@prisma/client/runtime/library';

export const updateWalletBalance = async (
  walletId: string,
  amount: number,
  transactionType: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_IN' | 'TRANSFER_OUT',
  tx?: any
) => {
  const client = tx || prisma;

  try {
    // Get current wallet balance
    const wallet = await client.wallet.findUnique({
      where: { id: walletId },
      select: { balance: true, currency: true },
    });

    if (!wallet) {
      throw new Error(`Wallet ${walletId} not found`);
    }

    // Calculate new balance based on transaction type
    let newBalance: number;
    let balanceChange: number;

    switch (transactionType) {
      case 'DEPOSIT':
      case 'TRANSFER_IN':
        newBalance = wallet.balance + amount;
        balanceChange = amount;
        break;
      case 'WITHDRAWAL':
      case 'TRANSFER_OUT':
        if (wallet.balance < amount) {
          throw new Error(`Insufficient balance in wallet ${walletId}. Available: ${wallet.balance}, Required: ${amount}`);
        }
        newBalance = wallet.balance - amount;
        balanceChange = -amount;
        break;
      default:
        throw new Error(`Unsupported transaction type: ${transactionType}`);
    }

    // Update wallet balance
    const updatedWallet = await client.wallet.update({
      where: { id: walletId },
      data: {
        balance: newBalance,
        lastActivityAt: new Date(),
      },
    });

    // Create audit log entry for balance change
    await client.auditLog.create({
      data: {
        walletId,
        action: 'WALLET_BALANCE_UPDATE',
        resourceType: 'wallet',
        resourceId: walletId,
        oldValue: { balance: wallet.balance },
        newValue: { balance: newBalance },
        metadata: {
          changeAmount: balanceChange,
          changeType: transactionType,
        },
      },
    });

    logger.info(`Updated wallet ${walletId} balance: ${wallet.balance} → ${newBalance} (${transactionType}: ${balanceChange})`);

    return updatedWallet;
  } catch (error) {
    logger.error(`Failed to update wallet ${walletId} balance:`, error instanceof Error ? error.message : String(error));
    throw error;
  }
};

// Get wallet balance with locking (for concurrent operations)
export const getWalletBalanceWithLock = async (walletId: string, tx?: any) => {
  const client = tx || prisma;

  try {
    // Use SELECT FOR UPDATE to lock the wallet row
    const wallet = await client.$queryRaw`
      SELECT * FROM "Wallet" 
      WHERE id = ${walletId} 
      FOR UPDATE
    `;

    if (!wallet || wallet.length === 0) {
      throw new Error(`Wallet ${walletId} not found`);
    }

    return wallet[0];
  } catch (error) {
    logger.error(`Failed to get wallet ${walletId} balance with lock:`, error instanceof Error ? error.message : String(error));
    throw error;
  }
};

// Validate wallet balance for a transaction
export const validateWalletBalance = async (
  walletId: string,
  requiredAmount: number,
  tx?: any
) => {
  const client = tx || prisma;

  try {
    const wallet = await client.wallet.findUnique({
      where: { id: walletId },
      select: { balance: true, currency: true },
    });

    if (!wallet) {
      throw new Error(`Wallet ${walletId} not found`);
    }

    if (wallet.balance < requiredAmount) {
      throw new Error(`Insufficient balance. Available: ${wallet.balance} ${wallet.currency}, Required: ${requiredAmount} ${wallet.currency}`);
    }

    return true;
  } catch (error) {
    logger.error(`Failed to validate wallet ${walletId} balance:`, error instanceof Error ? error.message : String(error));
    throw error;
  }
};

// Get wallet balance history
export const getWalletBalanceHistory = async (
  walletId: string,
  options: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}
) => {
  const { limit = 50, offset = 0, startDate, endDate } = options;

  try {
    const where: any = { 
      walletId,
      action: 'WALLET_BALANCE_UPDATE',
      resourceType: 'wallet'
    };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [history, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      history,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  } catch (error) {
    logger.error(`Failed to get wallet ${walletId} balance history:`, error instanceof Error ? error.message : String(error));
    throw error;
  }
};

// Recalculate wallet balance from transaction history (for reconciliation)
export const recalculateWalletBalance = async (walletId: string) => {
  try {
    // Get all completed transactions for the wallet
    const transactions = await prisma.transaction.findMany({
      where: {
        walletId,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate balance from transactions
    let calculatedBalance = new Decimal(0);
    
    for (const transaction of transactions) {
      switch (transaction.type) {
        case 'DEPOSIT':
          calculatedBalance = calculatedBalance.plus(transaction.amount);
          break;
        case 'WITHDRAWAL':
          calculatedBalance = calculatedBalance.minus(transaction.amount);
          break;
        case 'TRANSFER':
          if (transaction.destinationWalletId === walletId) {
            calculatedBalance = calculatedBalance.plus(transaction.amount);
          } else {
            calculatedBalance = calculatedBalance.minus(transaction.amount);
          }
          break;
      }
    }

    // Get current wallet balance
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      select: { balance: true },
    });

    if (!wallet) {
      throw new Error(`Wallet ${walletId} not found`);
    }

    // Compare calculated balance with stored balance
    const balanceDifference = calculatedBalance.minus(wallet.balance).abs();
    const isBalanced = balanceDifference.lessThan(new Decimal(0.01)); // Allow for small rounding differences

    return {
      walletId,
      currentBalance: wallet.balance,
      calculatedBalance: calculatedBalance.toNumber(),
      difference: calculatedBalance.minus(wallet.balance).toNumber(),
      isBalanced,
      transactionCount: transactions.length,
    };
  } catch (error) {
    logger.error(`Failed to recalculate wallet ${walletId} balance:`, error instanceof Error ? error.message : String(error));
    throw error;
  }
};