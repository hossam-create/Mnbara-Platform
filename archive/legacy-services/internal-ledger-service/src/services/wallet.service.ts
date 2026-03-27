// ============================================================
// Wallet Service - Core wallet operations
// Enhanced with comprehensive validation, error handling, and logging
// ============================================================

import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import {
  Wallet,
  CreateWalletInput,
  UpdateWalletBalanceInput,
  WalletBalance,
  TransactionType,
  TransactionStatus,
  WalletTransaction,
} from '../types/wallet.types';
import {
  InsufficientFundsError,
  WalletNotFoundError,
  InvalidAmountError,
  EscrowAlreadyExistsError,
  EscrowNotFoundError,
} from '../errors/WalletErrors';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class WalletService {
  /**
   * Validate amount is positive
   */
  private validateAmount(amount: Decimal): void {
    if (new Decimal(amount).lessThanOrEqualTo(0)) {
      logger.error('Invalid amount validation failed', undefined, {
        amount: amount.toString(),
      });
      throw new InvalidAmountError(amount.toString());
    }
  }

  /**
   * 1. Get wallet by userId and currency
   */
  async getWallet(userId: number, currency: string = 'USD'): Promise<Wallet> {
    logger.info('Getting wallet', { userId, currency });

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId_currency: {
          userId,
          currency,
        },
      },
    });

    if (!wallet) {
      logger.warn('Wallet not found', { userId, currency });
      throw new WalletNotFoundError(userId, currency);
    }

    logger.debug('Wallet retrieved successfully', {
      walletId: wallet.id,
      userId,
      currency,
    });

    return wallet;
  }

  /**
   * 2. Create a new wallet for a user
   */
  async createWallet(input: CreateWalletInput): Promise<Wallet> {
    logger.info('Creating new wallet', {
      userId: input.userId,
      currency: input.currency || 'USD',
    });

    try {
      const wallet = await prisma.wallet.create({
        data: {
          userId: input.userId,
          currency: input.currency || 'USD',
          availableBalance: new Decimal(0),
          lockedBalance: new Decimal(0),
        },
      });

      logger.info('Wallet created successfully', {
        walletId: wallet.id,
        userId: input.userId,
        currency: wallet.currency,
      });

      return wallet;
    } catch (error) {
      logger.error('Failed to create wallet', error as Error, {
        userId: input.userId,
        currency: input.currency,
      });
      throw error;
    }
  }

  /**
   * 3. Get available balance for user
   */
  async getAvailableBalance(
    userId: number,
    currency: string = 'USD'
  ): Promise<Decimal> {
    logger.debug('Getting available balance', { userId, currency });

    const wallet = await this.getWallet(userId, currency);

    logger.debug('Available balance retrieved', {
      userId,
      currency,
      balance: wallet.availableBalance.toString(),
    });

    return wallet.availableBalance;
  }

  /**
   * 4. Lock funds in escrow
   */
  async lockFunds(
    userId: number,
    amount: Decimal,
    requestId: number,
    currency: string = 'USD'
  ): Promise<Wallet> {
    logger.info('Locking funds for escrow', {
      userId,
      amount: amount.toString(),
      requestId,
      currency,
    });

    // Validate amount
    this.validateAmount(amount);

    // Check if escrow already exists
    const existingEscrow = await prisma.escrowHold.findUnique({
      where: { requestId },
    });

    if (existingEscrow) {
      logger.error('Escrow already exists', undefined, { requestId });
      throw new EscrowAlreadyExistsError(requestId);
    }

    return await prisma.$transaction(async (tx: any) => {
      // Get current wallet
      const wallet = await tx.wallet.findUnique({
        where: {
          userId_currency: {
            userId,
            currency,
          },
        },
      });

      if (!wallet) {
        logger.error('Wallet not found during lock', undefined, {
          userId,
          currency,
        });
        throw new WalletNotFoundError(userId, currency);
      }

      // Check sufficient available balance
      if (new Decimal(wallet.availableBalance).lessThan(amount)) {
        logger.error('Insufficient funds for lock', undefined, {
          userId,
          currency,
          required: amount.toString(),
          available: wallet.availableBalance.toString(),
        });
        throw new InsufficientFundsError(
          userId,
          currency,
          amount.toString(),
          wallet.availableBalance.toString()
        );
      }

      // Update balances (move from available to locked)
      const newAvailable = new Decimal(wallet.availableBalance).minus(amount);
      const newLocked = new Decimal(wallet.lockedBalance).plus(amount);

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: newAvailable,
          lockedBalance: newLocked,
        },
      });

      // Record transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          transactionType: TransactionType.ESCROW_LOCK,
          amount,
          referenceType: 'Request',
          referenceId: requestId,
          status: TransactionStatus.COMPLETED,
        },
      });

      logger.info('Funds locked successfully', {
        walletId: wallet.id,
        userId,
        amount: amount.toString(),
        requestId,
        newAvailable: newAvailable.toString(),
        newLocked: newLocked.toString(),
      });

      return updatedWallet;
    });
  }

  /**
   * 5. Release funds to seller/traveler
   */
  async releaseFunds(requestId: number, toUserId: number): Promise<void> {
    logger.info('Releasing funds from escrow', { requestId, toUserId });

    return await prisma.$transaction(async (tx: any) => {
      // Get escrow hold
      const escrow = await tx.escrowHold.findUnique({
        where: { requestId },
      });

      if (!escrow) {
        logger.error('Escrow not found for release', undefined, { requestId });
        throw new EscrowNotFoundError(requestId);
      }

      if (escrow.status !== 'HELD') {
        logger.error('Invalid escrow status for release', undefined, {
          requestId,
          status: escrow.status,
        });
        throw new Error(`Escrow already processed: ${escrow.status}`);
      }

      // Get buyer wallet
      const buyerWallet = await tx.wallet.findUnique({
        where: { id: escrow.buyerWalletId },
      });

      if (!buyerWallet) {
        throw new Error('Buyer wallet not found');
      }

      // Get seller wallet
      const sellerWallet = await tx.wallet.findUnique({
        where: { id: escrow.sellerWalletId },
      });

      if (!sellerWallet) {
        throw new Error('Seller wallet not found');
      }

      const totalAmount = new Decimal(escrow.amount).plus(escrow.platformFee);

      // Unlock from buyer (reduce locked balance)
      const buyerNewLocked = new Decimal(buyerWallet.lockedBalance).minus(
        totalAmount
      );

      await tx.wallet.update({
        where: { id: escrow.buyerWalletId },
        data: {
          lockedBalance: buyerNewLocked,
        },
      });

      // Add to seller available balance (minus platform fee)
      const sellerNewAvailable = new Decimal(
        sellerWallet.availableBalance
      ).plus(escrow.amount);

      await tx.wallet.update({
        where: { id: escrow.sellerWalletId },
        data: {
          availableBalance: sellerNewAvailable,
        },
      });

      // Record transactions
      await tx.walletTransaction.create({
        data: {
          walletId: escrow.buyerWalletId,
          transactionType: TransactionType.ESCROW_RELEASE,
          amount: totalAmount,
          referenceType: 'Request',
          referenceId: requestId,
          status: TransactionStatus.COMPLETED,
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: escrow.sellerWalletId,
          transactionType: TransactionType.ESCROW_RELEASE,
          amount: escrow.amount,
          referenceType: 'Request',
          referenceId: requestId,
          status: TransactionStatus.COMPLETED,
        },
      });

      // Platform fee transaction
      await tx.walletTransaction.create({
        data: {
          walletId: escrow.buyerWalletId,
          transactionType: TransactionType.FEE_DEDUCTION,
          amount: escrow.platformFee,
          referenceType: 'Request',
          referenceId: requestId,
          status: TransactionStatus.COMPLETED,
        },
      });

      // Update escrow status
      await tx.escrowHold.update({
        where: { id: escrow.id },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
        },
      });

      logger.info('Funds released successfully', {
        requestId,
        buyerWalletId: escrow.buyerWalletId,
        sellerWalletId: escrow.sellerWalletId,
        amount: escrow.amount.toString(),
        platformFee: escrow.platformFee.toString(),
      });
    });
  }

  /**
   * 6. Refund funds to buyer
   */
  async refundFunds(requestId: number): Promise<void> {
    logger.info('Refunding funds from escrow', { requestId });

    return await prisma.$transaction(async (tx: any) => {
      // Get escrow hold
      const escrow = await tx.escrowHold.findUnique({
        where: { requestId },
      });

      if (!escrow) {
        logger.error('Escrow not found for refund', undefined, { requestId });
        throw new EscrowNotFoundError(requestId);
      }

      if (escrow.status !== 'HELD') {
        logger.error('Invalid escrow status for refund', undefined, {
          requestId,
          status: escrow.status,
        });
        throw new Error(`Escrow already processed: ${escrow.status}`);
      }

      // Get buyer wallet
      const buyerWallet = await tx.wallet.findUnique({
        where: { id: escrow.buyerWalletId },
      });

      if (!buyerWallet) {
        throw new Error('Buyer wallet not found');
      }

      const totalAmount = new Decimal(escrow.amount).plus(escrow.platformFee);

      // Unlock and return to buyer available balance
      const buyerNewLocked = new Decimal(buyerWallet.lockedBalance).minus(
        totalAmount
      );
      const buyerNewAvailable = new Decimal(
        buyerWallet.availableBalance
      ).plus(totalAmount);

      await tx.wallet.update({
        where: { id: escrow.buyerWalletId },
        data: {
          availableBalance: buyerNewAvailable,
          lockedBalance: buyerNewLocked,
        },
      });

      // Record transaction
      await tx.walletTransaction.create({
        data: {
          walletId: escrow.buyerWalletId,
          transactionType: TransactionType.ESCROW_REFUND,
          amount: totalAmount,
          referenceType: 'Request',
          referenceId: requestId,
          status: TransactionStatus.COMPLETED,
        },
      });

      // Update escrow status
      await tx.escrowHold.update({
        where: { id: escrow.id },
        data: {
          status: 'REFUNDED',
          releasedAt: new Date(),
        },
      });

      logger.info('Funds refunded successfully', {
        requestId,
        buyerWalletId: escrow.buyerWalletId,
        amount: totalAmount.toString(),
      });
    });
  }

  /**
   * 7. Deduct platform fee
   */
  async deductFee(
    userId: number,
    amount: Decimal,
    requestId: number,
    currency: string = 'USD'
  ): Promise<Wallet> {
    logger.info('Deducting platform fee', {
      userId,
      amount: amount.toString(),
      requestId,
      currency,
    });

    // Validate amount
    this.validateAmount(amount);

    return await prisma.$transaction(async (tx: any) => {
      // Get current wallet
      const wallet = await tx.wallet.findUnique({
        where: {
          userId_currency: {
            userId,
            currency,
          },
        },
      });

      if (!wallet) {
        logger.error('Wallet not found during fee deduction', undefined, {
          userId,
          currency,
        });
        throw new WalletNotFoundError(userId, currency);
      }

      // Check sufficient balance
      if (new Decimal(wallet.availableBalance).lessThan(amount)) {
        logger.error('Insufficient funds for fee deduction', undefined, {
          userId,
          currency,
          required: amount.toString(),
          available: wallet.availableBalance.toString(),
        });
        throw new InsufficientFundsError(
          userId,
          currency,
          amount.toString(),
          wallet.availableBalance.toString()
        );
      }

      // Update balance
      const newBalance = new Decimal(wallet.availableBalance).minus(amount);

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: newBalance,
        },
      });

      // Record transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          transactionType: TransactionType.FEE_DEDUCTION,
          amount,
          referenceType: 'Request',
          referenceId: requestId,
          status: TransactionStatus.COMPLETED,
        },
      });

      logger.info('Fee deducted successfully', {
        walletId: wallet.id,
        userId,
        amount: amount.toString(),
        requestId,
        newBalance: newBalance.toString(),
      });

      return updatedWallet;
    });
  }

  /**
   * 8. Record transaction
   */
  async recordTransaction(
    walletId: number,
    type: TransactionType,
    amount: Decimal,
    reference?: { type: string; id: number }
  ): Promise<any> {
    logger.info('Recording transaction', {
      walletId,
      type,
      amount: amount.toString(),
      reference,
    });

    // Validate amount
    this.validateAmount(amount);

    try {
      const transaction = await prisma.walletTransaction.create({
        data: {
          walletId,
          transactionType: type,
          amount,
          referenceType: reference?.type,
          referenceId: reference?.id ? String(reference.id) : null,
          status: TransactionStatus.PENDING,
        },
      });

      logger.info('Transaction recorded successfully', {
        transactionId: transaction.id,
        walletId,
        type,
        amount: amount.toString(),
      });

      return transaction;
    } catch (error) {
      logger.error('Failed to record transaction', error as Error, {
        walletId,
        type,
        amount: amount.toString(),
      });
      throw error;
    }
  }
}

export const walletService = new WalletService();
