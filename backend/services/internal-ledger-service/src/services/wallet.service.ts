// ============================================================
// Wallet Service - Core wallet operations
// ============================================================

import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  Wallet,
  CreateWalletInput,
  UpdateWalletBalanceInput,
  WalletBalance,
  TransactionType,
  TransactionStatus,
} from '../types/wallet.types';

const prisma = new PrismaClient();

export class WalletService {
  /**
   * Create a new wallet for a user
   */
  async createWallet(input: CreateWalletInput): Promise<Wallet> {
    const wallet = await prisma.wallet.create({
      data: {
        userId: input.userId,
        currency: input.currency || 'USD',
        availableBalance: new Decimal(0),
        lockedBalance: new Decimal(0),
      },
    });

    return wallet;
  }

  /**
   * Get wallet by ID
   */
  async getWalletById(walletId: number): Promise<Wallet | null> {
    return await prisma.wallet.findUnique({
      where: { id: walletId },
    });
  }

  /**
   * Get wallet by user ID and currency
   */
  async getWalletByUserAndCurrency(
    userId: number,
    currency: string = 'USD'
  ): Promise<Wallet | null> {
    return await prisma.wallet.findUnique({
      where: {
        userId_currency: {
          userId,
          currency,
        },
      },
    });
  }

  /**
   * Get or create wallet for user
   */
  async getOrCreateWallet(
    userId: number,
    currency: string = 'USD'
  ): Promise<Wallet> {
    let wallet = await this.getWalletByUserAndCurrency(userId, currency);

    if (!wallet) {
      wallet = await this.createWallet({ userId, currency });
    }

    return wallet;
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(walletId: number): Promise<WalletBalance | null> {
    const wallet = await this.getWalletById(walletId);

    if (!wallet) {
      return null;
    }

    const totalBalance = new Decimal(wallet.availableBalance).plus(
      wallet.lockedBalance
    );

    return {
      availableBalance: wallet.availableBalance,
      lockedBalance: wallet.lockedBalance,
      totalBalance,
    };
  }

  /**
   * Update wallet balance
   */
  async updateWalletBalance(
    input: UpdateWalletBalanceInput
  ): Promise<Wallet> {
    const updateData: Prisma.WalletUpdateInput = {};

    if (input.availableBalance !== undefined) {
      updateData.availableBalance = input.availableBalance;
    }

    if (input.lockedBalance !== undefined) {
      updateData.lockedBalance = input.lockedBalance;
    }

    return await prisma.wallet.update({
      where: { id: input.walletId },
      data: updateData,
    });
  }

  /**
   * Add funds to available balance
   */
  async addFunds(
    walletId: number,
    amount: Decimal,
    referenceType?: string,
    referenceId?: number
  ): Promise<Wallet> {
    return await prisma.$transaction(async (tx) => {
      // Get current wallet
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Update balance
      const newBalance = new Decimal(wallet.availableBalance).plus(amount);

      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: {
          availableBalance: newBalance,
        },
      });

      // Record transaction
      await tx.walletTransaction.create({
        data: {
          walletId,
          transactionType: TransactionType.DEPOSIT,
          amount,
          referenceType,
          referenceId,
          status: TransactionStatus.COMPLETED,
        },
      });

      return updatedWallet;
    });
  }

  /**
   * Deduct funds from available balance
   */
  async deductFunds(
    walletId: number,
    amount: Decimal,
    referenceType?: string,
    referenceId?: number
  ): Promise<Wallet> {
    return await prisma.$transaction(async (tx) => {
      // Get current wallet
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check sufficient balance
      if (new Decimal(wallet.availableBalance).lessThan(amount)) {
        throw new Error('Insufficient balance');
      }

      // Update balance
      const newBalance = new Decimal(wallet.availableBalance).minus(amount);

      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: {
          availableBalance: newBalance,
        },
      });

      // Record transaction
      await tx.walletTransaction.create({
        data: {
          walletId,
          transactionType: TransactionType.WITHDRAWAL,
          amount,
          referenceType,
          referenceId,
          status: TransactionStatus.COMPLETED,
        },
      });

      return updatedWallet;
    });
  }

  /**
   * Lock funds (move from available to locked)
   */
  async lockFunds(
    walletId: number,
    amount: Decimal,
    referenceType?: string,
    referenceId?: number
  ): Promise<Wallet> {
    return await prisma.$transaction(async (tx) => {
      // Get current wallet
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check sufficient available balance
      if (new Decimal(wallet.availableBalance).lessThan(amount)) {
        throw new Error('Insufficient available balance');
      }

      // Update balances
      const newAvailable = new Decimal(wallet.availableBalance).minus(amount);
      const newLocked = new Decimal(wallet.lockedBalance).plus(amount);

      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: {
          availableBalance: newAvailable,
          lockedBalance: newLocked,
        },
      });

      // Record transaction
      await tx.walletTransaction.create({
        data: {
          walletId,
          transactionType: TransactionType.ESCROW_LOCK,
          amount,
          referenceType,
          referenceId,
          status: TransactionStatus.COMPLETED,
        },
      });

      return updatedWallet;
    });
  }

  /**
   * Unlock funds (move from locked to available)
   */
  async unlockFunds(
    walletId: number,
    amount: Decimal,
    referenceType?: string,
    referenceId?: number
  ): Promise<Wallet> {
    return await prisma.$transaction(async (tx) => {
      // Get current wallet
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check sufficient locked balance
      if (new Decimal(wallet.lockedBalance).lessThan(amount)) {
        throw new Error('Insufficient locked balance');
      }

      // Update balances
      const newLocked = new Decimal(wallet.lockedBalance).minus(amount);
      const newAvailable = new Decimal(wallet.availableBalance).plus(amount);

      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: {
          availableBalance: newAvailable,
          lockedBalance: newLocked,
        },
      });

      // Record transaction
      await tx.walletTransaction.create({
        data: {
          walletId,
          transactionType: TransactionType.ESCROW_RELEASE,
          amount,
          referenceType,
          referenceId,
          status: TransactionStatus.COMPLETED,
        },
      });

      return updatedWallet;
    });
  }

  /**
   * Get all wallets for a user
   */
  async getUserWallets(userId: number): Promise<Wallet[]> {
    return await prisma.wallet.findMany({
      where: { userId },
      orderBy: { currency: 'asc' },
    });
  }
}

export const walletService = new WalletService();
