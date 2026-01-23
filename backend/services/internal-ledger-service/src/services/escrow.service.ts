// ============================================================
// Escrow Service - Escrow hold operations
// ============================================================

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  EscrowHold,
  CreateEscrowHoldInput,
  ReleaseEscrowInput,
  EscrowStatus,
  TransactionType,
  TransactionStatus,
} from '../types/wallet.types';
import { walletService } from './wallet.service';

const prisma = new PrismaClient();

export class EscrowService {
  /**
   * Create escrow hold - locks funds from buyer
   */
  async createEscrowHold(input: CreateEscrowHoldInput): Promise<EscrowHold> {
    return await prisma.$transaction(async (tx) => {
      // Lock funds from buyer wallet
      const buyerWallet = await tx.wallet.findUnique({
        where: { id: input.buyerWalletId },
      });

      if (!buyerWallet) {
        throw new Error('Buyer wallet not found');
      }

      // Check sufficient balance
      const totalAmount = new Decimal(input.amount).plus(input.platformFee);
      if (new Decimal(buyerWallet.availableBalance).lessThan(totalAmount)) {
        throw new Error('Insufficient balance for escrow');
      }

      // Lock funds
      const newAvailable = new Decimal(buyerWallet.availableBalance).minus(
        totalAmount
      );
      const newLocked = new Decimal(buyerWallet.lockedBalance).plus(
        totalAmount
      );

      await tx.wallet.update({
        where: { id: input.buyerWalletId },
        data: {
          availableBalance: newAvailable,
          lockedBalance: newLocked,
        },
      });

      // Record transaction
      await tx.walletTransaction.create({
        data: {
          walletId: input.buyerWalletId,
          transactionType: TransactionType.ESCROW_LOCK,
          amount: totalAmount,
          referenceType: 'Request',
          referenceId: input.requestId,
          status: TransactionStatus.COMPLETED,
        },
      });

      // Create escrow hold
      const escrowHold = await tx.escrowHold.create({
        data: {
          requestId: input.requestId,
          buyerWalletId: input.buyerWalletId,
          sellerWalletId: input.sellerWalletId,
          amount: input.amount,
          platformFee: input.platformFee,
          status: EscrowStatus.HELD,
          expiresAt: input.expiresAt,
          releaseConditions: input.releaseConditions,
        },
      });

      return escrowHold;
    });
  }

  /**
   * Release escrow to seller
   */
  async releaseEscrow(escrowHoldId: number): Promise<EscrowHold> {
    return await prisma.$transaction(async (tx) => {
      // Get escrow hold
      const escrow = await tx.escrowHold.findUnique({
        where: { id: escrowHoldId },
      });

      if (!escrow) {
        throw new Error('Escrow hold not found');
      }

      if (escrow.status !== EscrowStatus.HELD) {
        throw new Error('Escrow already processed');
      }

      // Get buyer and seller wallets
      const buyerWallet = await tx.wallet.findUnique({
        where: { id: escrow.buyerWalletId },
      });

      const sellerWallet = await tx.wallet.findUnique({
        where: { id: escrow.sellerWalletId },
      });

      if (!buyerWallet || !sellerWallet) {
        throw new Error('Wallet not found');
      }

      const totalAmount = new Decimal(escrow.amount).plus(escrow.platformFee);

      // Unlock from buyer
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
          referenceId: escrow.requestId,
          status: TransactionStatus.COMPLETED,
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: escrow.sellerWalletId,
          transactionType: TransactionType.ESCROW_RELEASE,
          amount: escrow.amount,
          referenceType: 'Request',
          referenceId: escrow.requestId,
          status: TransactionStatus.COMPLETED,
        },
      });

      // Platform fee transaction (deducted from escrow)
      await tx.walletTransaction.create({
        data: {
          walletId: escrow.buyerWalletId,
          transactionType: TransactionType.FEE_DEDUCTION,
          amount: escrow.platformFee,
          referenceType: 'Request',
          referenceId: escrow.requestId,
          status: TransactionStatus.COMPLETED,
        },
      });

      // Update escrow status
      const updatedEscrow = await tx.escrowHold.update({
        where: { id: escrowHoldId },
        data: {
          status: EscrowStatus.RELEASED,
          releasedAt: new Date(),
        },
      });

      return updatedEscrow;
    });
  }

  /**
   * Refund escrow to buyer
   */
  async refundEscrow(escrowHoldId: number): Promise<EscrowHold> {
    return await prisma.$transaction(async (tx) => {
      // Get escrow hold
      const escrow = await tx.escrowHold.findUnique({
        where: { id: escrowHoldId },
      });

      if (!escrow) {
        throw new Error('Escrow hold not found');
      }

      if (escrow.status !== EscrowStatus.HELD) {
        throw new Error('Escrow already processed');
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
          referenceId: escrow.requestId,
          status: TransactionStatus.COMPLETED,
        },
      });

      // Update escrow status
      const updatedEscrow = await tx.escrowHold.update({
        where: { id: escrowHoldId },
        data: {
          status: EscrowStatus.REFUNDED,
          releasedAt: new Date(),
        },
      });

      return updatedEscrow;
    });
  }

  /**
   * Get escrow hold by ID
   */
  async getEscrowById(escrowHoldId: number): Promise<EscrowHold | null> {
    return await prisma.escrowHold.findUnique({
      where: { id: escrowHoldId },
    });
  }

  /**
   * Get escrow hold by request ID
   */
  async getEscrowByRequestId(requestId: number): Promise<EscrowHold | null> {
    return await prisma.escrowHold.findUnique({
      where: { requestId },
    });
  }

  /**
   * Get all escrows for a wallet
   */
  async getWalletEscrows(walletId: number): Promise<EscrowHold[]> {
    return await prisma.escrowHold.findMany({
      where: {
        OR: [{ buyerWalletId: walletId }, { sellerWalletId: walletId }],
      },
      orderBy: { heldAt: 'desc' },
    });
  }

  /**
   * Get expired escrows
   */
  async getExpiredEscrows(): Promise<EscrowHold[]> {
    return await prisma.escrowHold.findMany({
      where: {
        status: EscrowStatus.HELD,
        expiresAt: {
          lte: new Date(),
        },
      },
    });
  }
}

export const escrowService = new EscrowService();
