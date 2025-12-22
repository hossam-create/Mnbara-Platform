/**
 * Balance Verification Service
 * Provides pre-payment balance checks and insufficient funds handling
 * Requirements: 9.1, 9.2
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Type for Prisma transaction client
type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export interface BalanceCheckResult {
  hasBalance: boolean;
  currentBalance: Decimal;
  requiredAmount: Decimal;
  shortfall: Decimal;
  currency: string;
  walletId: number;
  userId: number;
  isLocked: boolean;
  message: string;
}

export interface ReserveBalanceResult {
  success: boolean;
  reservationId: string;
  amount: Decimal;
  expiresAt: Date;
  walletId: number;
}

export interface InsufficientFundsError extends Error {
  code: 'INSUFFICIENT_FUNDS';
  currentBalance: Decimal;
  requiredAmount: Decimal;
  shortfall: Decimal;
  currency: string;
}

// Reservation expiry time (5 minutes)
const RESERVATION_EXPIRY_MS = 5 * 60 * 1000;

// In-memory reservation store (in production, use Redis)
const reservations = new Map<string, {
  walletId: number;
  amount: Decimal;
  expiresAt: Date;
  orderId?: number;
}>();

/**
 * Create an InsufficientFundsError
 */
function createInsufficientFundsError(
  currentBalance: Decimal,
  requiredAmount: Decimal,
  currency: string
): InsufficientFundsError {
  const shortfall = requiredAmount.sub(currentBalance);
  const error = new Error(
    `Insufficient funds. Required: ${requiredAmount} ${currency}, Available: ${currentBalance} ${currency}, Shortfall: ${shortfall} ${currency}`
  ) as InsufficientFundsError;
  error.code = 'INSUFFICIENT_FUNDS';
  error.currentBalance = currentBalance;
  error.requiredAmount = requiredAmount;
  error.shortfall = shortfall;
  error.currency = currency;
  return error;
}

export class BalanceVerificationService {
  /**
   * Check if user has sufficient balance for a payment
   * This is a read-only check that doesn't modify any data
   */
  static async checkBalance(
    userId: number,
    amount: Decimal | number,
    currency: string = 'USD'
  ): Promise<BalanceCheckResult> {
    const requiredAmount = amount instanceof Decimal ? amount : new Decimal(amount);

    // Get user's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      return {
        hasBalance: false,
        currentBalance: new Decimal(0),
        requiredAmount,
        shortfall: requiredAmount,
        currency,
        walletId: 0,
        userId,
        isLocked: false,
        message: `Wallet not found for user ${userId}`
      };
    }

    // Check currency match
    if (wallet.currency !== currency) {
      return {
        hasBalance: false,
        currentBalance: wallet.balance,
        requiredAmount,
        shortfall: requiredAmount,
        currency,
        walletId: wallet.id,
        userId,
        isLocked: wallet.isLocked,
        message: `Currency mismatch. Wallet currency: ${wallet.currency}, Required: ${currency}`
      };
    }

    // Check if wallet is locked
    if (wallet.isLocked) {
      return {
        hasBalance: false,
        currentBalance: wallet.balance,
        requiredAmount,
        shortfall: Decimal.max(requiredAmount.sub(wallet.balance), new Decimal(0)),
        currency,
        walletId: wallet.id,
        userId,
        isLocked: true,
        message: 'Wallet is locked and cannot be used for payments'
      };
    }

    // Calculate available balance (considering active reservations)
    const reservedAmount = this.getReservedAmount(wallet.id);
    const availableBalance = wallet.balance.sub(reservedAmount);

    const hasBalance = availableBalance.gte(requiredAmount);
    const shortfall = hasBalance ? new Decimal(0) : requiredAmount.sub(availableBalance);

    return {
      hasBalance,
      currentBalance: availableBalance,
      requiredAmount,
      shortfall,
      currency,
      walletId: wallet.id,
      userId,
      isLocked: false,
      message: hasBalance 
        ? 'Sufficient balance available' 
        : `Insufficient balance. Need ${shortfall} ${currency} more`
    };
  }

  /**
   * Verify balance and throw error if insufficient
   * Use this before initiating a payment
   */
  static async verifyBalanceOrThrow(
    userId: number,
    amount: Decimal | number,
    currency: string = 'USD'
  ): Promise<BalanceCheckResult> {
    const result = await this.checkBalance(userId, amount, currency);

    if (!result.hasBalance) {
      if (result.isLocked) {
        throw new Error('Wallet is locked and cannot be used for payments');
      }
      if (result.walletId === 0) {
        throw new Error(`Wallet not found for user ${userId}`);
      }
      throw createInsufficientFundsError(
        result.currentBalance,
        result.requiredAmount,
        currency
      );
    }

    return result;
  }

  /**
   * Reserve balance for a pending payment
   * This temporarily holds the amount to prevent double-spending
   */
  static async reserveBalance(
    userId: number,
    amount: Decimal | number,
    orderId?: number
  ): Promise<ReserveBalanceResult> {
    const requiredAmount = amount instanceof Decimal ? amount : new Decimal(amount);

    // First verify balance
    const balanceCheck = await this.verifyBalanceOrThrow(userId, requiredAmount);

    // Generate reservation ID
    const reservationId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + RESERVATION_EXPIRY_MS);

    // Store reservation
    reservations.set(reservationId, {
      walletId: balanceCheck.walletId,
      amount: requiredAmount,
      expiresAt,
      orderId
    });

    // Schedule cleanup
    setTimeout(() => {
      this.releaseReservation(reservationId);
    }, RESERVATION_EXPIRY_MS);

    return {
      success: true,
      reservationId,
      amount: requiredAmount,
      expiresAt,
      walletId: balanceCheck.walletId
    };
  }

  /**
   * Release a balance reservation
   */
  static releaseReservation(reservationId: string): boolean {
    return reservations.delete(reservationId);
  }

  /**
   * Get total reserved amount for a wallet
   */
  static getReservedAmount(walletId: number): Decimal {
    const now = new Date();
    let total = new Decimal(0);

    for (const [id, reservation] of reservations.entries()) {
      if (reservation.walletId === walletId) {
        if (reservation.expiresAt > now) {
          total = total.add(reservation.amount);
        } else {
          // Clean up expired reservation
          reservations.delete(id);
        }
      }
    }

    return total;
  }

  /**
   * Confirm a reservation and deduct from wallet
   * This should be called when payment is confirmed
   */
  static async confirmReservation(
    reservationId: string,
    performedBy: number
  ): Promise<{ success: boolean; ledgerEntryId?: number }> {
    const reservation = reservations.get(reservationId);

    if (!reservation) {
      throw new Error(`Reservation ${reservationId} not found or expired`);
    }

    if (reservation.expiresAt < new Date()) {
      reservations.delete(reservationId);
      throw new Error(`Reservation ${reservationId} has expired`);
    }

    return await prisma.$transaction(async (tx: TransactionClient) => {
      // Get wallet with lock
      const wallet = await tx.wallet.findUnique({
        where: { id: reservation.walletId }
      });

      if (!wallet) {
        throw new Error(`Wallet ${reservation.walletId} not found`);
      }

      if (wallet.isLocked) {
        throw new Error('Wallet is locked');
      }

      // Verify balance again (in case of concurrent modifications)
      if (wallet.balance.lessThan(reservation.amount)) {
        throw createInsufficientFundsError(
          wallet.balance,
          reservation.amount,
          wallet.currency
        );
      }

      // Deduct from wallet
      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore.sub(reservation.amount);

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter }
      });

      // Create ledger entry
      const ledgerEntry = await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          amount: reservation.amount.negated(),
          currency: wallet.currency,
          type: 'PAYMENT',
          balanceBefore,
          balanceAfter,
          orderId: reservation.orderId,
          description: `Payment confirmed (reservation: ${reservationId})`,
          performedBy,
          metadata: { reservationId }
        }
      });

      // Remove reservation
      reservations.delete(reservationId);

      return {
        success: true,
        ledgerEntryId: ledgerEntry.id
      };
    }, {
      isolationLevel: 'Serializable' as any,
      timeout: 10000
    });
  }


  /**
   * Check balance for multiple users (batch operation)
   * Useful for marketplace transactions involving multiple parties
   */
  static async checkMultipleBalances(
    checks: Array<{
      userId: number;
      amount: Decimal | number;
      currency?: string;
    }>
  ): Promise<Map<number, BalanceCheckResult>> {
    const results = new Map<number, BalanceCheckResult>();

    // Batch fetch all wallets
    const userIds = checks.map(c => c.userId);
    const wallets = await prisma.wallet.findMany({
      where: { userId: { in: userIds } }
    });

    const walletMap = new Map(wallets.map((w: any) => [w.userId, w]));

    for (const check of checks) {
      const wallet = walletMap.get(check.userId);
      const requiredAmount = check.amount instanceof Decimal 
        ? check.amount 
        : new Decimal(check.amount);
      const currency = check.currency || 'USD';

      if (!wallet) {
        results.set(check.userId, {
          hasBalance: false,
          currentBalance: new Decimal(0),
          requiredAmount,
          shortfall: requiredAmount,
          currency,
          walletId: 0,
          userId: check.userId,
          isLocked: false,
          message: `Wallet not found for user ${check.userId}`
        });
        continue;
      }

      const walletData = wallet as any;
      const reservedAmount = this.getReservedAmount(walletData.id);
      const availableBalance = walletData.balance.sub(reservedAmount);
      const hasBalance = availableBalance.gte(requiredAmount);
      const shortfall = hasBalance ? new Decimal(0) : requiredAmount.sub(availableBalance);

      results.set(check.userId, {
        hasBalance,
        currentBalance: availableBalance,
        requiredAmount,
        shortfall,
        currency,
        walletId: walletData.id,
        userId: check.userId,
        isLocked: walletData.isLocked,
        message: hasBalance 
          ? 'Sufficient balance available' 
          : `Insufficient balance. Need ${shortfall} ${currency} more`
      });
    }

    return results;
  }

  /**
   * Get wallet balance with pending transactions
   * Provides a complete picture of available funds
   */
  static async getDetailedBalance(userId: number): Promise<{
    totalBalance: Decimal;
    availableBalance: Decimal;
    reservedBalance: Decimal;
    pendingDeposits: Decimal;
    pendingWithdrawals: Decimal;
    currency: string;
    isLocked: boolean;
  }> {
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error(`Wallet not found for user ${userId}`);
    }

    // Get pending transactions
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'PENDING'
      }
    });

    let pendingDeposits = new Decimal(0);
    let pendingWithdrawals = new Decimal(0);

    for (const tx of pendingTransactions) {
      if (tx.type === 'DEPOSIT') {
        pendingDeposits = pendingDeposits.add(tx.amount);
      } else if (tx.type === 'WITHDRAWAL') {
        pendingWithdrawals = pendingWithdrawals.add(tx.amount.abs());
      }
    }

    const reservedBalance = this.getReservedAmount(wallet.id);
    const availableBalance = wallet.balance.sub(reservedBalance);

    return {
      totalBalance: wallet.balance,
      availableBalance,
      reservedBalance,
      pendingDeposits,
      pendingWithdrawals,
      currency: wallet.currency,
      isLocked: wallet.isLocked
    };
  }

  /**
   * Pre-authorize a payment amount
   * Creates a hold on the wallet that can be captured or released
   */
  static async preAuthorize(
    userId: number,
    amount: Decimal | number,
    orderId: number,
    expiryMinutes: number = 30
  ): Promise<{
    authorizationId: number;
    amount: Decimal;
    expiresAt: Date;
  }> {
    const requiredAmount = amount instanceof Decimal ? amount : new Decimal(amount);

    return await prisma.$transaction(async (tx: TransactionClient) => {
      // Get wallet
      const wallet = await tx.wallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        throw new Error(`Wallet not found for user ${userId}`);
      }

      if (wallet.isLocked) {
        throw new Error('Wallet is locked');
      }

      // Check balance
      if (wallet.balance.lessThan(requiredAmount)) {
        throw createInsufficientFundsError(
          wallet.balance,
          requiredAmount,
          wallet.currency
        );
      }

      // Deduct from available balance (hold)
      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore.sub(requiredAmount);

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter }
      });

      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

      // Create ledger entry for the hold
      const ledgerEntry = await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          amount: requiredAmount.negated(),
          currency: wallet.currency,
          type: 'ESCROW_HOLD',
          balanceBefore,
          balanceAfter,
          orderId,
          description: `Pre-authorization hold for order #${orderId}`,
          performedBy: userId,
          metadata: {
            type: 'pre_authorization',
            expiresAt: expiresAt.toISOString(),
            status: 'held'
          }
        }
      });

      return {
        authorizationId: ledgerEntry.id,
        amount: requiredAmount,
        expiresAt
      };
    }, {
      isolationLevel: 'Serializable' as any,
      timeout: 10000
    });
  }

  /**
   * Capture a pre-authorized amount
   */
  static async captureAuthorization(
    authorizationId: number,
    captureAmount?: Decimal | number
  ): Promise<{ success: boolean; capturedAmount: Decimal }> {
    return await prisma.$transaction(async (tx: TransactionClient) => {
      // Get the authorization ledger entry
      const authEntry = await tx.walletLedger.findUnique({
        where: { id: authorizationId }
      });

      if (!authEntry) {
        throw new Error(`Authorization ${authorizationId} not found`);
      }

      const metadata = authEntry.metadata as any;
      if (metadata?.type !== 'pre_authorization' || metadata?.status !== 'held') {
        throw new Error('Invalid or already processed authorization');
      }

      // Check expiry
      if (metadata.expiresAt && new Date(metadata.expiresAt) < new Date()) {
        throw new Error('Authorization has expired');
      }

      const authorizedAmount = authEntry.amount.abs();
      const amountToCapture = captureAmount 
        ? (captureAmount instanceof Decimal ? captureAmount : new Decimal(captureAmount))
        : authorizedAmount;

      if (amountToCapture.greaterThan(authorizedAmount)) {
        throw new Error(
          `Capture amount (${amountToCapture}) exceeds authorized amount (${authorizedAmount})`
        );
      }

      // If partial capture, refund the difference
      if (amountToCapture.lessThan(authorizedAmount)) {
        const refundAmount = authorizedAmount.sub(amountToCapture);
        
        const wallet = await tx.wallet.findUnique({
          where: { id: authEntry.walletId }
        });

        if (wallet) {
          const balanceBefore = wallet.balance;
          const balanceAfter = balanceBefore.add(refundAmount);

          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: balanceAfter }
          });

          await tx.walletLedger.create({
            data: {
              walletId: wallet.id,
              amount: refundAmount,
              currency: wallet.currency,
              type: 'REFUND',
              balanceBefore,
              balanceAfter,
              orderId: authEntry.orderId,
              description: `Partial capture refund for authorization #${authorizationId}`,
              metadata: {
                originalAuthorizationId: authorizationId,
                authorizedAmount: authorizedAmount.toString(),
                capturedAmount: amountToCapture.toString(),
                refundedAmount: refundAmount.toString()
              }
            }
          });
        }
      }

      // Update authorization status
      await tx.walletLedger.update({
        where: { id: authorizationId },
        data: {
          metadata: {
            ...metadata,
            status: 'captured',
            capturedAt: new Date().toISOString(),
            capturedAmount: amountToCapture.toString()
          }
        }
      });

      return {
        success: true,
        capturedAmount: amountToCapture
      };
    }, {
      isolationLevel: 'Serializable' as any,
      timeout: 10000
    });
  }

  /**
   * Void/Release a pre-authorization
   */
  static async voidAuthorization(
    authorizationId: number,
    reason: string = 'Voided by user'
  ): Promise<{ success: boolean; refundedAmount: Decimal }> {
    return await prisma.$transaction(async (tx: TransactionClient) => {
      // Get the authorization ledger entry
      const authEntry = await tx.walletLedger.findUnique({
        where: { id: authorizationId }
      });

      if (!authEntry) {
        throw new Error(`Authorization ${authorizationId} not found`);
      }

      const metadata = authEntry.metadata as any;
      if (metadata?.type !== 'pre_authorization' || metadata?.status !== 'held') {
        throw new Error('Invalid or already processed authorization');
      }

      const authorizedAmount = authEntry.amount.abs();

      // Refund the held amount
      const wallet = await tx.wallet.findUnique({
        where: { id: authEntry.walletId }
      });

      if (!wallet) {
        throw new Error(`Wallet ${authEntry.walletId} not found`);
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore.add(authorizedAmount);

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter }
      });

      // Create refund ledger entry
      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          amount: authorizedAmount,
          currency: wallet.currency,
          type: 'REFUND',
          balanceBefore,
          balanceAfter,
          orderId: authEntry.orderId,
          description: `Authorization voided: ${reason}`,
          metadata: {
            originalAuthorizationId: authorizationId,
            voidReason: reason
          }
        }
      });

      // Update authorization status
      await tx.walletLedger.update({
        where: { id: authorizationId },
        data: {
          metadata: {
            ...metadata,
            status: 'voided',
            voidedAt: new Date().toISOString(),
            voidReason: reason
          }
        }
      });

      return {
        success: true,
        refundedAmount: authorizedAmount
      };
    }, {
      isolationLevel: 'Serializable' as any,
      timeout: 10000
    });
  }

  /**
   * Clean up expired authorizations (should be run by cron job)
   */
  static async cleanupExpiredAuthorizations(): Promise<{
    processed: number;
    voided: number;
    errors: string[];
  }> {
    // Find expired authorizations
    const expiredAuths = await prisma.walletLedger.findMany({
      where: {
        type: 'ESCROW_HOLD',
        metadata: {
          path: ['type'],
          equals: 'pre_authorization'
        }
      }
    });

    let processed = 0;
    let voided = 0;
    const errors: string[] = [];

    for (const auth of expiredAuths) {
      const metadata = auth.metadata as any;
      
      if (metadata?.status !== 'held') continue;
      if (!metadata?.expiresAt) continue;
      
      const expiresAt = new Date(metadata.expiresAt);
      if (expiresAt > new Date()) continue;

      processed++;

      try {
        await this.voidAuthorization(auth.id, 'Expired authorization');
        voided++;
      } catch (error) {
        errors.push(`Failed to void authorization ${auth.id}: ${error}`);
      }
    }

    return { processed, voided, errors };
  }
}

export default BalanceVerificationService;
