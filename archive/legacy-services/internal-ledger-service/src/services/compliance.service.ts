// ============================================================
// Compliance Service - AML/KYC Integration
// Implements compliance checks, limits, and risk assessment
// ============================================================

import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import {
  ComplianceCheck,
  ComplianceCheckType,
  ComplianceStatus,
  RiskLevel,
  TransactionLimit,
  LimitType,
  LimitPeriod,
  LimitCheckResult,
} from '../types/ledger.types';
import { auditService } from './audit.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Default limits
const DEFAULT_LIMITS: Record<LimitType, { amount: number; period: LimitPeriod }> = {
  [LimitType.DAILY_DEPOSIT]: { amount: 10000, period: LimitPeriod.DAILY },
  [LimitType.DAILY_WITHDRAWAL]: { amount: 5000, period: LimitPeriod.DAILY },
  [LimitType.DAILY_TRANSACTION]: { amount: 25000, period: LimitPeriod.DAILY },
  [LimitType.WEEKLY_TRANSACTION]: { amount: 100000, period: LimitPeriod.WEEKLY },
  [LimitType.MONTHLY_TRANSACTION]: { amount: 500000, period: LimitPeriod.MONTHLY },
  [LimitType.SINGLE_TRANSACTION]: { amount: 50000, period: LimitPeriod.LIFETIME },
  [LimitType.ESCROW_HOLD]: { amount: 100000, period: LimitPeriod.LIFETIME },
};

export class ComplianceService {
  /**
   * Perform a compliance check for a transaction
   */
  async performTransactionCheck(
    userId: number,
    amount: Decimal
  ): Promise<{ passed: boolean; reason?: string; checkIds?: string[] }> {
    logger.info('Performing compliance check', { userId, amount: amount.toString() });

    try {
      // 1. Check KYC status
      const kycStatus = await this.checkKycStatus(userId);
      if (!kycStatus.verified) {
        return { passed: false, reason: `KYC not verified: ${kycStatus.reason}` };
      }

      // 2. Check transaction limits
      const limitCheck = await this.checkTransactionLimits(userId, amount, LimitType.SINGLE_TRANSACTION);
      if (!limitCheck.allowed) {
        return { passed: false, reason: limitCheck.failureReason };
      }

      // 3. Check watchlist screening
      const watchlistCheck = await this.performWatchlistScreening(userId);
      if (watchlistCheck.status === ComplianceStatus.FAILED) {
        return { passed: false, reason: 'User is on watchlist' };
      }

      // 4. Perform risk assessment
      const riskAssessment = await this.performRiskAssessment(userId, amount);
      if (riskAssessment.riskLevel === RiskLevel.CRITICAL) {
        return { passed: false, reason: 'Transaction flagged as high risk' };
      }

      logger.info('Compliance check passed', { userId });
      return { passed: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Compliance check error', { error: errorMessage });
      return { passed: false, reason: errorMessage };
    }
  }

  /**
   * Check KYC status for a user
   */
  async checkKycStatus(userId: number): Promise<{ verified: boolean; reason?: string }> {
    // Check if user has completed KYC
    // This would typically integrate with the KYC service
    const kycCheck = await prisma.complianceCheck.findFirst({
      where: {
        userId,
        checkType: ComplianceCheckType.IDENTITY_VERIFICATION,
        status: ComplianceStatus.PASSED,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!kycCheck) {
      return { verified: false, reason: 'Identity verification not completed' };
    }

    // Check if KYC has expired (1 year validity)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (kycCheck.createdAt < oneYearAgo) {
      return { verified: false, reason: 'Identity verification expired' };
    }

    return { verified: true };
  }

  /**
   * Perform watchlist screening
   */
  async performWatchlistScreening(userId: number): Promise<ComplianceCheck> {
    // Check if there's a recent screening
    const existingCheck = await prisma.complianceCheck.findFirst({
      where: {
        userId,
        checkType: ComplianceCheckType.WATCHLIST_SCREENING,
        status: { in: [ComplianceStatus.PASSED, ComplianceStatus.FAILED] },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If recent check exists (within 30 days), use it
    if (existingCheck) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (existingCheck.createdAt > thirtyDaysAgo) {
        return this.mapToComplianceCheck(existingCheck);
      }
    }

    // Perform new screening
    // In production, this would integrate with a watchlist provider
    const check = await prisma.complianceCheck.create({
      data: {
        checkType: ComplianceCheckType.WATCHLIST_SCREENING,
        userId,
        status: ComplianceStatus.PASSED, // Simulated - would be API result
        riskLevel: RiskLevel.LOW,
        riskScore: 5,
        passedAt: new Date(),
      },
    });

    await auditService.log({
      action: 'WATCHLIST_SCREENING',
      entityType: 'ComplianceCheck',
      entityId: check.id,
      userId,
    });

    return this.mapToComplianceCheck(check);
  }

  /**
   * Perform risk assessment
   */
  async performRiskAssessment(
    userId: number,
    amount: Decimal
  ): Promise<{ riskLevel: RiskLevel; riskScore: number }> {
    let riskScore = 0;

    // Check transaction amount
    if (amount.greaterThan(10000)) riskScore += 20;
    if (amount.greaterThan(25000)) riskScore += 30;
    if (amount.greaterThan(50000)) riskScore += 40;

    // Check if user is new (less than 30 days)
    const userCheck = await prisma.complianceCheck.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    if (userCheck) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (userCheck.createdAt > thirtyDaysAgo) {
        riskScore += 15;
      }
    }

    // Determine risk level
    let riskLevel: RiskLevel;
    if (riskScore < 30) {
      riskLevel = RiskLevel.LOW;
    } else if (riskScore < 60) {
      riskLevel = RiskLevel.MEDIUM;
    } else if (riskScore < 80) {
      riskLevel = RiskLevel.HIGH;
    } else {
      riskLevel = RiskLevel.CRITICAL;
    }

    return { riskLevel, riskScore };
  }

  /**
   * Check transaction limits
   */
  async checkTransactionLimits(
    userId: number,
    amount: Decimal,
    limitType: LimitType
  ): Promise<LimitCheckResult> {
    // Get or create limit
    let limit = await prisma.transactionLimit.findFirst({
      where: {
        userId,
        limitType,
        isActive: true,
      },
    });

    if (!limit) {
      // Create default limit
      const defaultLimit = DEFAULT_LIMITS[limitType];
      limit = await prisma.transactionLimit.create({
        data: {
          userId,
          limitType,
          maxAmount: new Decimal(defaultLimit.amount),
          period: defaultLimit.period,
          usedAmount: new Decimal(0),
        },
      });
    }

    const remainingAmount = new Decimal(limit.maxAmount.toString()).minus(
      new Decimal(limit.usedAmount.toString())
    );

    if (remainingAmount.lessThan(amount)) {
      return {
        allowed: false,
        limitType,
        requestedAmount: amount,
        currentUsage: new Decimal(limit.usedAmount.toString()),
        remainingAmount,
        failureReason: `Exceeds ${limitType} limit. Available: ${remainingAmount.toString()}`,
      };
    }

    return {
      allowed: true,
      limitType,
      requestedAmount: amount,
      currentUsage: new Decimal(limit.usedAmount.toString()),
      remainingAmount,
    };
  }

  /**
   * Update limit usage after transaction
   */
  async updateLimitUsage(
    userId: number,
    limitType: LimitType,
    amount: Decimal
  ): Promise<void> {
    const limit = await prisma.transactionLimit.findFirst({
      where: {
        userId,
        limitType,
        isActive: true,
      },
    });

    if (limit) {
      const newUsedAmount = new Decimal(limit.usedAmount.toString()).plus(amount);
      await prisma.transactionLimit.update({
        where: { id: limit.id },
        data: { usedAmount: newUsedAmount },
      });
    }
  }

  /**
   * Reset limit usage (for periodic limits)
   */
  async resetLimitUsage(limitType: LimitType, period: LimitPeriod): Promise<void> {
    const resetDate = new Date();

    switch (period) {
      case LimitPeriod.DAILY:
        resetDate.setDate(resetDate.getDate() - 1);
        break;
      case LimitPeriod.WEEKLY:
        resetDate.setDate(resetDate.getDate() - 7);
        break;
      case LimitPeriod.MONTHLY:
        resetDate.setMonth(resetDate.getMonth() - 1);
        break;
      default:
        return;
    }

    await prisma.transactionLimit.updateMany({
      where: {
        limitType,
        period,
        updatedAt: { lt: resetDate },
      },
      data: { usedAmount: new Decimal(0) },
    });
  }

  /**
   * Get compliance status for a user
   */
  async getComplianceStatus(userId: number): Promise<{
    kycVerified: boolean;
    watchlistStatus: ComplianceStatus;
    riskLevel: RiskLevel;
    activeLimits: TransactionLimit[];
  }> {
    const kycCheck = await this.checkKycStatus(userId);
    const watchlistCheck = await prisma.complianceCheck.findFirst({
      where: {
        userId,
        checkType: ComplianceCheckType.WATCHLIST_SCREENING,
        status: { in: [ComplianceStatus.PASSED, ComplianceStatus.FAILED] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const riskCheck = await prisma.complianceCheck.findFirst({
      where: {
        userId,
        checkType: ComplianceCheckType.RISK_ASSESSMENT,
      },
      orderBy: { createdAt: 'desc' },
    });

    const limits = await prisma.transactionLimit.findMany({
      where: { userId, isActive: true },
    });

    return {
      kycVerified: kycCheck.verified,
      watchlistStatus: (watchlistCheck?.status as ComplianceStatus) || ComplianceStatus.PENDING,
      riskLevel: (riskCheck?.riskLevel as RiskLevel) || RiskLevel.LOW,
      activeLimits: limits.map((l) => ({
        id: l.id,
        userId: l.userId,
        limitType: l.limitType as LimitType,
        maxAmount: new Decimal(l.maxAmount.toString()),
        period: l.period as LimitPeriod,
        usedAmount: new Decimal(l.usedAmount.toString()),
        remainingAmount: new Decimal(l.maxAmount.toString()).minus(
          new Decimal(l.usedAmount.toString())
        ),
        isActive: l.isActive,
        resetAt: l.resetAt || undefined,
      })),
    };
  }

  /**
   * Map Prisma model to ComplianceCheck interface
   */
  private mapToComplianceCheck(check: any): ComplianceCheck {
    return {
      id: check.id,
      checkType: check.checkType as ComplianceCheckType,
      userId: check.userId || undefined,
      transactionId: check.transactionId || undefined,
      settlementId: check.settlementId || undefined,
      status: check.status as ComplianceStatus,
      riskLevel: (check.riskLevel as RiskLevel) || undefined,
      riskScore: check.riskScore || undefined,
      passedAt: check.passedAt || undefined,
      failedAt: check.failedAt || undefined,
      failureReason: check.failureReason || undefined,
      checkData: check.checkData || undefined,
      createdAt: check.createdAt,
      expiresAt: check.expiresAt || undefined,
    };
  }
}

export const complianceService = new ComplianceService();
