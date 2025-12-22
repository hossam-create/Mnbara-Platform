import { PrismaClient, WalletLedgerType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export interface WalletLedgerEntry {
  walletId: number;
  amount: Decimal;
  type: WalletLedgerType;
  transactionId?: number;
  orderId?: number;
  escrowId?: number;
  description?: string;
  metadata?: any;
  performedBy?: number;
  ipAddress?: string;
}

export class WalletLedgerService {
  /**
   * Record a wallet transaction with automatic balance tracking
   * This method ensures atomicity by using a database transaction
   */
  static async recordTransaction(entry: WalletLedgerEntry) {
    return await prisma.$transaction(async (tx) => {
      // Get current wallet balance
      const wallet = await tx.wallet.findUnique({
        where: { id: entry.walletId }
      });

      if (!wallet) {
        throw new Error(`Wallet ${entry.walletId} not found`);
      }

      if (wallet.isLocked) {
        throw new Error(`Wallet ${entry.walletId} is locked`);
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore.add(entry.amount);

      // Validate sufficient balance for debits
      if (entry.amount.isNegative() && balanceAfter.isNegative()) {
        throw new Error(
          `Insufficient balance. Current: ${balanceBefore}, Required: ${entry.amount.abs()}`
        );
      }

      // Update wallet balance
      await tx.wallet.update({
        where: { id: entry.walletId },
        data: { balance: balanceAfter }
      });

      // Create ledger entry
      const ledgerEntry = await tx.walletLedger.create({
        data: {
          walletId: entry.walletId,
          amount: entry.amount,
          currency: wallet.currency,
          type: entry.type,
          balanceBefore,
          balanceAfter,
          transactionId: entry.transactionId,
          orderId: entry.orderId,
          escrowId: entry.escrowId,
          description: entry.description,
          metadata: entry.metadata,
          performedBy: entry.performedBy,
          ipAddress: entry.ipAddress
        }
      });

      return {
        ledgerEntry,
        balanceBefore,
        balanceAfter
      };
    });
  }

  /**
   * Record a deposit to a wallet
   */
  static async recordDeposit(
    walletId: number,
    amount: Decimal,
    transactionId: number,
    userId: number,
    ipAddress?: string
  ) {
    return await this.recordTransaction({
      walletId,
      amount,
      type: WalletLedgerType.DEPOSIT,
      transactionId,
      description: 'Deposit to wallet',
      performedBy: userId,
      ipAddress
    });
  }

  /**
   * Record a withdrawal from a wallet
   */
  static async recordWithdrawal(
    walletId: number,
    amount: Decimal,
    transactionId: number,
    userId: number,
    ipAddress?: string
  ) {
    return await this.recordTransaction({
      walletId,
      amount: amount.negated(), // Negative for debit
      type: WalletLedgerType.WITHDRAWAL,
      transactionId,
      description: 'Withdrawal from wallet',
      performedBy: userId,
      ipAddress
    });
  }

  /**
   * Hold funds in escrow
   */
  static async holdEscrow(
    walletId: number,
    amount: Decimal,
    orderId: number,
    escrowId: number,
    userId: number
  ) {
    return await this.recordTransaction({
      walletId,
      amount: amount.negated(), // Negative for debit
      type: WalletLedgerType.ESCROW_HOLD,
      orderId,
      escrowId,
      description: `Escrow hold for order #${orderId}`,
      performedBy: userId,
      metadata: { orderId, escrowId }
    });
  }

  /**
   * Release escrow funds to recipient
   */
  static async releaseEscrow(
    recipientWalletId: number,
    amount: Decimal,
    orderId: number,
    escrowId: number,
    systemUserId: number
  ) {
    return await this.recordTransaction({
      walletId: recipientWalletId,
      amount, // Positive for credit
      type: WalletLedgerType.ESCROW_RELEASE,
      orderId,
      escrowId,
      description: `Escrow released for order #${orderId}`,
      performedBy: systemUserId,
      metadata: { orderId, escrowId, releaseReason: 'Delivery confirmed' }
    });
  }

  /**
   * Refund escrow funds to buyer
   */
  static async refundEscrow(
    buyerWalletId: number,
    amount: Decimal,
    orderId: number,
    escrowId: number,
    systemUserId: number,
    reason: string
  ) {
    return await this.recordTransaction({
      walletId: buyerWalletId,
      amount, // Positive for credit
      type: WalletLedgerType.ESCROW_REFUND,
      orderId,
      escrowId,
      description: `Escrow refunded for order #${orderId}`,
      performedBy: systemUserId,
      metadata: { orderId, escrowId, refundReason: reason }
    });
  }

  /**
   * Transfer between wallets
   */
  static async transferBetweenWallets(
    fromWalletId: number,
    toWalletId: number,
    amount: Decimal,
    userId: number,
    description?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // Debit from sender
      const debit = await this.recordTransaction({
        walletId: fromWalletId,
        amount: amount.negated(),
        type: WalletLedgerType.TRANSFER_OUT,
        description: description || `Transfer to wallet #${toWalletId}`,
        performedBy: userId,
        metadata: { toWalletId }
      });

      // Credit to recipient
      const credit = await this.recordTransaction({
        walletId: toWalletId,
        amount,
        type: WalletLedgerType.TRANSFER_IN,
        description: description || `Transfer from wallet #${fromWalletId}`,
        performedBy: userId,
        metadata: { fromWalletId }
      });

      return { debit, credit };
    });
  }

  /**
   * Get wallet transaction history
   */
  static async getWalletHistory(
    walletId: number,
    limit: number = 50,
    offset: number = 0
  ) {
    return await prisma.walletLedger.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Get wallet balance at a specific point in time
   */
  static async getBalanceAtTime(walletId: number, timestamp: Date) {
    const entry = await prisma.walletLedger.findFirst({
      where: {
        walletId,
        createdAt: { lte: timestamp }
      },
      orderBy: { createdAt: 'desc' }
    });

    return entry ? entry.balanceAfter : new Decimal(0);
  }

  /**
   * Reconcile wallet balance with ledger
   */
  static async reconcileBalance(walletId: number) {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId }
    });

    if (!wallet) {
      throw new Error(`Wallet ${walletId} not found`);
    }

    const lastEntry = await prisma.walletLedger.findFirst({
      where: { walletId },
      orderBy: { createdAt: 'desc' }
    });

    if (!lastEntry) {
      return {
        currentBalance: wallet.balance,
        ledgerBalance: new Decimal(0),
        isReconciled: wallet.balance.equals(0),
        message: 'No transactions yet'
      };
    }

    const isReconciled = wallet.balance.equals(lastEntry.balanceAfter);

    return {
      currentBalance: wallet.balance,
      ledgerBalance: lastEntry.balanceAfter,
      isReconciled,
      lastTransaction: lastEntry.createdAt,
      message: isReconciled
        ? 'Balance reconciled'
        : 'Balance mismatch detected!'
    };
  }

  /**
   * Get transactions by type
   */
  static async getTransactionsByType(
    walletId: number,
    type: WalletLedgerType,
    limit: number = 50
  ) {
    return await prisma.walletLedger.findMany({
      where: { walletId, type },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Get total amount by transaction type
   */
  static async getTotalByType(walletId: number, type: WalletLedgerType) {
    const result = await prisma.walletLedger.aggregate({
      where: { walletId, type },
      _sum: { amount: true }
    });

    return result._sum.amount || new Decimal(0);
  }

  /**
   * Get transactions within date range
   */
  static async getTransactionsByDateRange(
    walletId: number,
    startDate: Date,
    endDate: Date
  ) {
    return await prisma.walletLedger.findMany({
      where: {
        walletId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}

export default WalletLedgerService;
