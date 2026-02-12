import { PrismaClient, WalletType, Currency } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();
import { logger } from './logger';

// System account configurations
const SYSTEM_ACCOUNTS = [
  {
    id: 'system-revenue-account',
    userId: 'system',
    type: 'SYSTEM',
    currency: Currency.USD,
    description: 'System revenue from fees and charges',
  },
  {
    id: 'system-float-account',
    userId: 'system',
    type: 'SYSTEM',
    currency: Currency.USD,
    description: 'System float for operational liquidity',
  },
  {
    id: 'system-reserve-account',
    userId: 'system',
    type: 'SYSTEM',
    currency: Currency.USD,
    description: 'System reserve for regulatory compliance',
  },
  {
    id: 'system-settlement-account',
    userId: 'system',
    type: 'SYSTEM',
    currency: Currency.USD,
    description: 'System settlement account for inter-wallet transfers',
  },
];

// Initialize system accounts
export const initializeSystemAccounts = async () => {
  try {
    logger.info('Initializing system accounts');

    for (const accountConfig of SYSTEM_ACCOUNTS) {
      try {
        // Check if account already exists
        const existingAccount = await prisma.wallet.findUnique({
          where: { id: accountConfig.id },
        });

        if (existingAccount) {
          logger.info(`System account ${accountConfig.id} already exists`);
          continue;
        }

        // Create system account
        const account = await prisma.wallet.create({
          data: {
            id: accountConfig.id,
            userId: accountConfig.userId,
            type: WalletType.SYSTEM,
            currency: accountConfig.currency,
            balance: 0,
            availableBalance: 0,
            holdBalance: 0,
            creditLimit: 0,
            isActive: true,
          },
        });

        logger.info(`Created system account: ${account.id}`);
      } catch (error) {
        logger.error(`Failed to create system account ${accountConfig.id}:`, error);
        // Continue with other accounts even if one fails
      }
    }

    logger.info('System accounts initialization completed');
  } catch (error) {
    logger.error('Failed to initialize system accounts:', error);
    throw error;
  }
};

// Get system account by ID
export const getSystemAccount = async (accountId: string) => {
  try {
    const account = await prisma.wallet.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error(`System account ${accountId} not found`);
    }

    return account;
  } catch (error) {
    logger.error(`Failed to get system account ${accountId}:`, error);
    throw error;
  }
};

// Get all system accounts
export const getAllSystemAccounts = async () => {
  try {
    const accounts = await prisma.wallet.findMany({
      where: {
        type: WalletType.SYSTEM,
        userId: 'system',
      },
      orderBy: { id: 'asc' },
    });

    return accounts;
  } catch (error) {
    logger.error('Failed to get all system accounts:', error);
    throw error;
  }
};

// Update system account balance
export const updateSystemAccountBalance = async (
  accountId: string,
  amount: number,
  transactionType: 'CREDIT' | 'DEBIT',
  tx?: any
) => {
  const client = tx || prisma;

  try {
    const account = await client.wallet.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error(`System account ${accountId} not found`);
    }

    if (account.type !== WalletType.SYSTEM) {
      throw new Error(`Account ${accountId} is not a system account`);
    }

    let newBalance: number;
    
    switch (transactionType) {
      case 'CREDIT':
        newBalance = account.balance + amount;
        break;
      case 'DEBIT':
        if (account.balance < amount) {
          throw new Error(`Insufficient balance in system account ${accountId}`);
        }
        newBalance = account.balance - amount;
        break;
      default:
        throw new Error(`Unsupported transaction type: ${transactionType}`);
    }

    const updatedAccount = await client.wallet.update({
      where: { id: accountId },
      data: {
        balance: newBalance,
        lastActivityAt: new Date(),
      },
    });

    logger.info(`Updated system account ${accountId} balance: ${account.balance} → ${newBalance} (${transactionType}: ${amount})`);

    return updatedAccount;
  } catch (error) {
    logger.error(`Failed to update system account ${accountId} balance:`, error);
    throw error;
  }
};

// Get system account balance summary
export const getSystemAccountSummary = async () => {
  try {
    const accounts = await getAllSystemAccounts();
    
    const summary = {
      totalBalance: accounts.reduce((sum, account) => sum.plus(account.balance), new Decimal(0)),
      accounts: accounts.map(account => ({
        id: account.id,
        balance: account.balance,
        currency: account.currency,
        lastActivityAt: account.lastActivityAt,
      })),
      timestamp: new Date(),
    };

    return summary;
  } catch (error) {
    logger.error('Failed to get system account summary:', error);
    throw error;
  }
};

// Reconcile system accounts
export const reconcileSystemAccounts = async () => {
  try {
    logger.info('Starting system accounts reconciliation');

    const accounts = await getAllSystemAccounts();
    const reconciliationResults = [];

    for (const account of accounts) {
      try {
        // Get all transactions for this account
        const transactions = await prisma.transaction.findMany({
          where: { walletId: account.id },
          orderBy: { createdAt: 'asc' },
        });

        // Calculate expected balance from transactions
        let calculatedBalance = new Decimal(0);
        
        for (const transaction of transactions) {
          switch (transaction.type) {
            case 'DEPOSIT':
            case 'REFUND':
            case 'SETTLEMENT':
            case 'ESCROW_RELEASE':
            case 'EXCHANGE':
              calculatedBalance = calculatedBalance.plus(transaction.amount);
              break;
            case 'WITHDRAWAL':
            case 'FEE':
            case 'TRANSFER':
            case 'ESCROW_HOLD':
            case 'PAYOUT_HOLD':
            case 'PAYOUT':
              calculatedBalance = calculatedBalance.minus(transaction.amount);
              break;
          }
        }

        // Compare with actual balance
        const balanceDifference = calculatedBalance.minus(account.balance).abs();
        const isBalanced = balanceDifference.lessThan(0.01); // Allow for small rounding differences

        reconciliationResults.push({
          accountId: account.id,
          actualBalance: account.balance,
          calculatedBalance,
          difference: calculatedBalance.minus(account.balance),
          isBalanced,
          transactionCount: transactions.length,
        });

        if (!isBalanced) {
          logger.warn(`System account ${account.id} balance mismatch: actual=${account.balance}, calculated=${calculatedBalance}, difference=${calculatedBalance.minus(account.balance)}`);
        }
      } catch (error) {
        logger.error(`Failed to reconcile system account ${account.id}:`, error);
        reconciliationResults.push({
          accountId: account.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info('System accounts reconciliation completed');
    return reconciliationResults;
  } catch (error) {
    logger.error('Failed to reconcile system accounts:', error);
    throw error;
  }
};