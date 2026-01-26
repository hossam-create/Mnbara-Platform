// ============================================================
// Security Deposit Service (Layer 1: Anti-Scam)
// ============================================================

import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import {
  SecurityDeposit,
  CreateSecurityDepositInput,
  UpdateSecurityDepositInput,
  FreezeDepositInput,
  DeductDepositInput,
} from '../types/security.types';
import { DepositSource, DepositStatus } from '../types/enums';
import {
  SecurityDepositNotFoundError,
  InsufficientSecurityDepositError,
  SecurityDepositFrozenError,
} from '../errors/ExchangeErrors';

export class SecurityDepositService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get user's security deposit
   */
  async getDeposit(userId: number, currency: string): Promise<SecurityDeposit> {
    const deposit = await this.prisma.securityDeposit.findUnique({
      where: {
        userId_currency: {
          userId,
          currency,
        },
      },
    });

    if (!deposit) {
      throw new SecurityDepositNotFoundError(userId, currency);
    }

    return this.mapToSecurityDeposit(deposit);
  }

  /**
   * Create initial deposit
   */
  async createDeposit(
    userId: number,
    amount: Decimal,
    source: DepositSource
  ): Promise<SecurityDeposit> {
    const currency = 'USD'; // Default currency

    // Check if deposit already exists
    const existing = await this.prisma.securityDeposit.findUnique({
      where: {
        userId_currency: {
          userId,
          currency,
        },
      },
    });

    if (existing) {
      // Add to existing deposit
      return this.addToDeposit(userId, amount, source);
    }

    // Create new deposit
    const deposit = await this.prisma.securityDeposit.create({
      data: {
        userId,
        amount,
        currency,
        source,
        status: DepositStatus.ACTIVE,
        frozenAmount: new Decimal(0),
      },
    });

    return this.mapToSecurityDeposit(deposit);
  }

  /**
   * Add to deposit
   */
  async addToDeposit(
    userId: number,
    amount: Decimal,
    source: DepositSource
  ): Promise<void> {
    const currency = 'USD';

    await this.prisma.securityDeposit.update({
      where: {
        userId_currency: {
          userId,
          currency,
        },
      },
      data: {
        amount: {
          increment: amount,
        },
        source, // Update source to latest
      },
    });
  }

  /**
   * Freeze deposit
   */
  async freezeDeposit(userId: number, amount: Decimal, reason: string): Promise<void> {
    const currency = 'USD';
    const deposit = await this.getDeposit(userId, currency);

    // Check if sufficient unfrozen amount
    const availableAmount = deposit.amount.sub(deposit.frozenAmount);
    if (availableAmount.lt(amount)) {
      throw new InsufficientSecurityDepositError(
        userId,
        currency,
        amount.toString(),
        availableAmount.toString()
      );
    }

    // Freeze amount
    await this.prisma.securityDeposit.update({
      where: {
        userId_currency: {
          userId,
          currency,
        },
      },
      data: {
        frozenAmount: {
          increment: amount,
        },
        frozenReason: reason,
        frozenAt: new Date(),
        status: DepositStatus.FROZEN,
      },
    });
  }

  /**
   * Unfreeze deposit
   */
  async unfreezeDeposit(userId: number, amount: Decimal): Promise<void> {
    const currency = 'USD';
    const deposit = await this.getDeposit(userId, currency);

    // Check if sufficient frozen amount
    if (deposit.frozenAmount.lt(amount)) {
      throw new Error('Cannot unfreeze more than frozen amount');
    }

    // Unfreeze amount
    const newFrozenAmount = deposit.frozenAmount.sub(amount);
    await this.prisma.securityDeposit.update({
      where: {
        userId_currency: {
          userId,
          currency,
        },
      },
      data: {
        frozenAmount: newFrozenAmount,
        status: newFrozenAmount.eq(0) ? DepositStatus.ACTIVE : DepositStatus.FROZEN,
        frozenReason: newFrozenAmount.eq(0) ? null : undefined,
        frozenAt: newFrozenAmount.eq(0) ? null : undefined,
      },
    });
  }

  /**
   * Deduct from deposit (for compensation)
   */
  async deductDeposit(userId: number, amount: Decimal, reason: string): Promise<void> {
    const currency = 'USD';
    const deposit = await this.getDeposit(userId, currency);

    // Check if sufficient amount (including frozen)
    if (deposit.amount.lt(amount)) {
      throw new InsufficientSecurityDepositError(
        userId,
        currency,
        amount.toString(),
        deposit.amount.toString()
      );
    }

    // Deduct amount
    await this.prisma.securityDeposit.update({
      where: {
        userId_currency: {
          userId,
          currency,
        },
      },
      data: {
        amount: {
          decrement: amount,
        },
        frozenAmount: deposit.frozenAmount.gt(0)
          ? {
              decrement: Decimal.min(amount, deposit.frozenAmount),
            }
          : undefined,
        status: DepositStatus.DEDUCTED,
      },
    });

    // TODO: Record deduction transaction
    // TODO: Notify user
  }

  /**
   * Check sufficient deposit
   */
  async hasSufficientDeposit(userId: number, requiredAmount: Decimal): Promise<boolean> {
    const currency = 'USD';

    try {
      const deposit = await this.getDeposit(userId, currency);

      // Check if deposit is frozen
      if (deposit.status === DepositStatus.FROZEN) {
        return false;
      }

      // Check available amount (total - frozen)
      const availableAmount = deposit.amount.sub(deposit.frozenAmount);
      return availableAmount.gte(requiredAmount);
    } catch (error) {
      if (error instanceof SecurityDepositNotFoundError) {
        return false;
      }
      throw error;
    }
  }

  // ============================================================
  // Private Helper Methods
  // ============================================================

  private mapToSecurityDeposit(data: any): SecurityDeposit {
    return {
      id: data.id,
      userId: data.userId,
      amount: new Decimal(data.amount),
      currency: data.currency,
      source: data.source,
      status: data.status,
      frozenAmount: new Decimal(data.frozenAmount),
      frozenReason: data.frozenReason,
      frozenAt: data.frozenAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
