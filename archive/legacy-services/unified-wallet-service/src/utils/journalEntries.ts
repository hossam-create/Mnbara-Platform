import { Decimal } from 'decimal.js';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

interface JournalEntryData {
  transactionId: string;
  walletId: string;
  userId: string;
  amount: Decimal;
  fee?: Decimal;
  currency: string;
  transactionType: string;
  destinationWalletId?: string;
  tx: any; // Prisma transaction client
}

export const createJournalEntries = async ({
  transactionId,
  walletId,
  userId,
  amount,
  fee,
  currency,
  transactionType,
  destinationWalletId,
  tx,
}: JournalEntryData): Promise<void> => {
  try {
    const entryDate = new Date();
    const period = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;

    switch (transactionType) {
      case 'DEPOSIT':
        await createDepositJournalEntries({
          transactionId,
          walletId,
          userId,
          amount,
          currency: currency as any,
          entryDate,
          period,
          tx,
        });
        break;

      case 'WITHDRAWAL':
        await createWithdrawalJournalEntries({
          transactionId,
          walletId,
          userId,
          amount,
          fee: fee || new Decimal(0),
          currency: currency as any,
          entryDate,
          period,
          tx,
        });
        break;

      case 'TRANSFER':
        await createTransferJournalEntries({
          transactionId,
          walletId,
          userId,
          amount,
          fee: fee || new Decimal(0),
          currency,
          ...(destinationWalletId && { destinationWalletId }),
          entryDate,
          period,
          tx,
        });
        break;

      case 'FEE':
        await createFeeJournalEntries({
          transactionId,
          walletId,
          userId,
          amount,
          currency,
          entryDate,
          period,
          tx,
        });
        break;

      default:
        throw new Error(`Unsupported transaction type for journal entries: ${transactionType}`);
    }

    logger.info(`Journal entries created for transaction: ${transactionId}`, {
      transactionType,
      amount: amount.toString(),
      currency,
      walletId,
      userId,
    });
  } catch (error) {
    logger.error('Error creating journal entries:', error);
    throw error;
  }
};

const createDepositJournalEntries = async ({
  transactionId,
  walletId,
  userId,
  amount,
  currency,
  entryDate,
  period,
  tx,
}: {
  transactionId: string;
  walletId: string;
  userId: string;
  amount: Decimal;
  currency: string;
  entryDate: Date;
  period: string;
  tx: PrismaClient;
}) => {
  // For deposits, we debit the cash/bank account and credit the wallet liability
  
  // Debit: Cash/Bank Account (Asset)
  const cashAccount = await getSystemAccount('CASH', tx);
  await tx.journalEntry.create({
    data: {
      transactionId,
      walletId,
      userId,
      accountId: cashAccount.id,
      debit: amount,
      credit: new Decimal(0),
      currency: currency as any,
      description: 'Deposit - Cash received',
      entryDate,
      period,
    },
  });

  // Credit: Wallet Liability Account (Liability)
  const walletLiabilityAccount = await getWalletLiabilityAccount(walletId, tx);
  await tx.journalEntry.create({
    data: {
      transactionId,
      walletId,
      userId,
      accountId: walletLiabilityAccount.id,
      debit: new Decimal(0),
      credit: amount,
      currency: currency as any,
      description: 'Deposit - Wallet liability increased',
      entryDate,
      period,
    },
  });
};

const createWithdrawalJournalEntries = async ({
  transactionId,
  walletId,
  userId,
  amount,
  fee,
  currency,
  entryDate,
  period,
  tx,
}: {
  transactionId: string;
  walletId: string;
  userId: string;
  amount: Decimal;
  fee: Decimal;
  currency: string;
  entryDate: Date;
  period: string;
  tx: PrismaClient;
}) => {
  const totalAmount = amount.plus(fee);

  // Debit: Wallet Liability Account (Liability)
  const walletLiabilityAccount = await getWalletLiabilityAccount(walletId, tx);
  await tx.journalEntry.create({
    data: {
      transactionId,
      walletId,
      userId,
      accountId: walletLiabilityAccount.id,
      debit: totalAmount,
      credit: new Decimal(0),
      currency: currency as any,
      description: 'Withdrawal - Wallet liability decreased',
      entryDate,
      period,
    },
  });

  // Credit: Cash/Bank Account (Asset) for the main amount
  const cashAccount = await getSystemAccount('CASH', tx);
  await tx.journalEntry.create({
    data: {
      transactionId,
      walletId,
      userId,
      accountId: cashAccount.id,
      debit: new Decimal(0),
      credit: amount,
      currency: currency as any,
      description: 'Withdrawal - Cash paid out',
      entryDate,
      period,
    },
  });

  // Credit: Fee Revenue Account (Revenue) for the fee
  if (fee.gt(0)) {
    const feeRevenueAccount = await getSystemAccount('FEE_REVENUE', tx);
    await tx.journalEntry.create({
      data: {
        transactionId,
        walletId,
        userId,
        accountId: feeRevenueAccount.id,
        debit: new Decimal(0),
        credit: fee,
        currency: currency as any,
        description: 'Withdrawal fee revenue',
        entryDate,
        period,
      },
    });
  }
};

const createTransferJournalEntries = async ({
  transactionId,
  walletId,
  userId,
  amount,
  fee,
  currency,
  destinationWalletId,
  entryDate,
  period,
  tx,
}: {
  transactionId: string;
  walletId: string;
  userId: string;
  amount: Decimal;
  fee: Decimal;
  currency: string;
  destinationWalletId?: string;
  entryDate: Date;
  period: string;
  tx: PrismaClient;
}) => {
  // For transfers between wallets of the same user
  // We debit the source wallet liability and credit the destination wallet liability

  // Debit: Source Wallet Liability Account (Liability)
  const sourceWalletLiabilityAccount = await getWalletLiabilityAccount(walletId, tx);
  await tx.journalEntry.create({
    data: {
      transactionId,
      walletId,
      userId,
      accountId: sourceWalletLiabilityAccount.id,
      debit: amount.plus(fee),
      credit: new Decimal(0),
      currency: currency as any,
      description: 'Transfer - Source wallet liability decreased',
      entryDate,
      period,
    },
  });

  // Credit: Destination Wallet Liability Account (Liability) - only if destinationWalletId is provided
  if (destinationWalletId) {
    const destinationWalletLiabilityAccount = await getWalletLiabilityAccount(destinationWalletId, tx);
    await tx.journalEntry.create({
      data: {
        transactionId,
        walletId: destinationWalletId,
        userId,
        accountId: destinationWalletLiabilityAccount.id,
        debit: new Decimal(0),
        credit: amount,
        currency: currency as any,
        description: `Transfer credit to ${destinationWalletId}`,
        entryDate,
        period,
      },
    });
  }

  // Credit: Fee Revenue Account (Revenue) for the fee
  if (fee.gt(0)) {
    const feeRevenueAccount = await getSystemAccount('FEE_REVENUE', tx);
    await tx.journalEntry.create({
      data: {
        transactionId,
        walletId,
        userId,
        accountId: feeRevenueAccount.id,
        debit: new Decimal(0),
        credit: fee,
        currency: currency as any,
        description: 'Transfer fee revenue',
        entryDate,
        period,
      },
    });
  }
};

const createFeeJournalEntries = async ({
  transactionId,
  walletId,
  userId,
  amount,
  currency,
  entryDate,
  period,
  tx,
}: {
  transactionId: string;
  walletId: string;
  userId: string;
  amount: Decimal;
  currency: string;
  entryDate: Date;
  period: string;
  tx: PrismaClient;
}) => {
  // For fee transactions, we debit the wallet liability and credit the fee revenue

  // Debit: Wallet Liability Account (Liability)
  const walletLiabilityAccount = await getWalletLiabilityAccount(walletId, tx);
  await tx.journalEntry.create({
    data: {
      transactionId,
      walletId,
      userId,
      accountId: walletLiabilityAccount.id,
      debit: amount,
      credit: new Decimal(0),
      currency: currency as any,
      description: 'Fee charged - Wallet liability decreased',
      entryDate,
      period,
    },
  });

  // Credit: Fee Revenue Account (Revenue)
  const feeRevenueAccount = await getSystemAccount('FEE_REVENUE', tx);
  await tx.journalEntry.create({
    data: {
      transactionId,
      walletId,
      userId,
      accountId: feeRevenueAccount.id,
      debit: new Decimal(0),
      credit: amount,
      currency: currency as any,
      description: 'Fee revenue',
      entryDate,
      period,
    },
  });
};

// Helper functions to get accounts
const getSystemAccount = async (accountCode: string, tx: PrismaClient) => {
  const account = await tx.account.findUnique({
    where: { code: accountCode },
  });

  if (!account) {
    throw new Error(`System account not found: ${accountCode}`);
  }

  return account;
};

const getWalletLiabilityAccount = async (_walletId: string, tx: PrismaClient) => {
  // For now, we'll use a generic wallet liability account
  // In a real system, you might want to create individual liability accounts per wallet
  const account = await tx.account.findUnique({
    where: { code: 'WALLET_LIABILITY' },
  });

  if (!account) {
    throw new Error('Wallet liability account not found');
  }

  return account;
};