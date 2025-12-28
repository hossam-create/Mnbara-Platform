import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Transaction Limits Service
 * خدمة حدود المعاملات - Configurable limits with country restrictions
 */

export enum LimitType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  PER_TRANSACTION = 'PER_TRANSACTION',
  ROLLING_24H = 'ROLLING_24H'
}

export enum LimitAction {
  BLOCK = 'BLOCK',
  REQUIRE_APPROVAL = 'REQUIRE_APPROVAL',
  REQUIRE_2FA = 'REQUIRE_2FA',
  NOTIFY = 'NOTIFY'
}

export interface TransactionLimit {
  id: string;
  userId?: string;       // null = global limit
  userTier?: string;     // 'basic' | 'verified' | 'premium' | 'enterprise'
  transactionType: string;
  currency: string;
  limitType: LimitType;
  amount: number;
  action: LimitAction;
  isActive: boolean;
  countryRestrictions?: CountryRestriction;
}

export interface CountryRestriction {
  mode: 'WHITELIST' | 'BLACKLIST';
  countries: string[];
  reason?: string;
}

export interface LimitCheckResult {
  isAllowed: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
  limitType: LimitType;
  action?: LimitAction;
  message: string;
  messageAr: string;
  expiresAt?: Date;
}

// Default limits configuration
const DEFAULT_LIMITS: Record<string, Record<LimitType, number>> = {
  basic: {
    [LimitType.DAILY]: 1000,
    [LimitType.WEEKLY]: 5000,
    [LimitType.MONTHLY]: 15000,
    [LimitType.PER_TRANSACTION]: 500,
    [LimitType.ROLLING_24H]: 1000
  },
  verified: {
    [LimitType.DAILY]: 5000,
    [LimitType.WEEKLY]: 25000,
    [LimitType.MONTHLY]: 75000,
    [LimitType.PER_TRANSACTION]: 2500,
    [LimitType.ROLLING_24H]: 5000
  },
  premium: {
    [LimitType.DAILY]: 25000,
    [LimitType.WEEKLY]: 100000,
    [LimitType.MONTHLY]: 300000,
    [LimitType.PER_TRANSACTION]: 10000,
    [LimitType.ROLLING_24H]: 25000
  },
  enterprise: {
    [LimitType.DAILY]: 100000,
    [LimitType.WEEKLY]: 500000,
    [LimitType.MONTHLY]: 1500000,
    [LimitType.PER_TRANSACTION]: 50000,
    [LimitType.ROLLING_24H]: 100000
  }
};

// Country restrictions (configurable)
const COUNTRY_RESTRICTIONS: CountryRestriction = {
  mode: 'BLACKLIST',
  countries: ['KP', 'IR', 'SY', 'CU', 'VE'], // OFAC sanctioned
  reason: 'Transaction not allowed from this country due to regulatory restrictions'
};

// In-memory usage tracking (use Redis in production)
const usageCache = new Map<string, { amount: number; expiresAt: Date }>();

export class TransactionLimitsService {
  /**
   * Check if a transaction is within limits
   * التحقق من حدود المعاملة
   */
  async checkLimits(
    userId: string,
    amount: number,
    currency: string,
    transactionType: string,
    country?: string
  ): Promise<LimitCheckResult[]> {
    const results: LimitCheckResult[] = [];

    // 1. Check country restriction first
    if (country) {
      const countryCheck = this.checkCountryRestriction(country);
      if (!countryCheck.isAllowed) {
        return [countryCheck];
      }
    }

    // 2. Get user tier (mock - in production, fetch from database)
    const userTier = await this.getUserTier(userId);
    const limits = DEFAULT_LIMITS[userTier] || DEFAULT_LIMITS.basic;

    // 3. Check per-transaction limit
    if (amount > limits[LimitType.PER_TRANSACTION]) {
      results.push({
        isAllowed: false,
        currentUsage: amount,
        limit: limits[LimitType.PER_TRANSACTION],
        remaining: 0,
        limitType: LimitType.PER_TRANSACTION,
        action: LimitAction.BLOCK,
        message: `Transaction amount exceeds maximum of ${limits[LimitType.PER_TRANSACTION]} ${currency}`,
        messageAr: `مبلغ المعاملة يتجاوز الحد الأقصى ${limits[LimitType.PER_TRANSACTION]} ${currency}`
      });
    }

    // 4. Check rolling 24h limit
    const rolling24hUsage = await this.getUsage(userId, LimitType.ROLLING_24H, transactionType);
    const rolling24hRemaining = limits[LimitType.ROLLING_24H] - rolling24hUsage;

    if (rolling24hUsage + amount > limits[LimitType.ROLLING_24H]) {
      results.push({
        isAllowed: false,
        currentUsage: rolling24hUsage,
        limit: limits[LimitType.ROLLING_24H],
        remaining: Math.max(0, rolling24hRemaining),
        limitType: LimitType.ROLLING_24H,
        action: LimitAction.BLOCK,
        message: `24-hour rolling limit exceeded. Available: ${rolling24hRemaining.toFixed(2)} ${currency}`,
        messageAr: `تم تجاوز الحد المتداول 24 ساعة. المتاح: ${rolling24hRemaining.toFixed(2)} ${currency}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    }

    // 5. Check daily limit
    const dailyUsage = await this.getUsage(userId, LimitType.DAILY, transactionType);
    const dailyRemaining = limits[LimitType.DAILY] - dailyUsage;

    if (dailyUsage + amount > limits[LimitType.DAILY]) {
      results.push({
        isAllowed: false,
        currentUsage: dailyUsage,
        limit: limits[LimitType.DAILY],
        remaining: Math.max(0, dailyRemaining),
        limitType: LimitType.DAILY,
        action: LimitAction.BLOCK,
        message: `Daily limit exceeded. Available: ${dailyRemaining.toFixed(2)} ${currency}`,
        messageAr: `تم تجاوز الحد اليومي. المتاح: ${dailyRemaining.toFixed(2)} ${currency}`,
        expiresAt: this.getEndOfDay()
      });
    }

    // 6. Check weekly limit
    const weeklyUsage = await this.getUsage(userId, LimitType.WEEKLY, transactionType);
    const weeklyRemaining = limits[LimitType.WEEKLY] - weeklyUsage;

    if (weeklyUsage + amount > limits[LimitType.WEEKLY]) {
      results.push({
        isAllowed: false,
        currentUsage: weeklyUsage,
        limit: limits[LimitType.WEEKLY],
        remaining: Math.max(0, weeklyRemaining),
        limitType: LimitType.WEEKLY,
        action: LimitAction.BLOCK,
        message: `Weekly limit exceeded. Available: ${weeklyRemaining.toFixed(2)} ${currency}`,
        messageAr: `تم تجاوز الحد الأسبوعي. المتاح: ${weeklyRemaining.toFixed(2)} ${currency}`,
        expiresAt: this.getEndOfWeek()
      });
    }

    // 7. Check monthly limit
    const monthlyUsage = await this.getUsage(userId, LimitType.MONTHLY, transactionType);
    const monthlyRemaining = limits[LimitType.MONTHLY] - monthlyUsage;

    if (monthlyUsage + amount > limits[LimitType.MONTHLY]) {
      results.push({
        isAllowed: false,
        currentUsage: monthlyUsage,
        limit: limits[LimitType.MONTHLY],
        remaining: Math.max(0, monthlyRemaining),
        limitType: LimitType.MONTHLY,
        action: LimitAction.BLOCK,
        message: `Monthly limit exceeded. Available: ${monthlyRemaining.toFixed(2)} ${currency}`,
        messageAr: `تم تجاوز الحد الشهري. المتاح: ${monthlyRemaining.toFixed(2)} ${currency}`,
        expiresAt: this.getEndOfMonth()
      });
    }

    // If no violations, return success
    if (results.length === 0) {
      results.push({
        isAllowed: true,
        currentUsage: dailyUsage,
        limit: limits[LimitType.DAILY],
        remaining: dailyRemaining - amount,
        limitType: LimitType.DAILY,
        message: 'Transaction within limits',
        messageAr: 'المعاملة ضمن الحدود'
      });
    }

    return results;
  }

  /**
   * Check country restriction
   */
  private checkCountryRestriction(country: string): LimitCheckResult {
    const isBlacklisted = COUNTRY_RESTRICTIONS.mode === 'BLACKLIST' 
      && COUNTRY_RESTRICTIONS.countries.includes(country);
    
    const isNotWhitelisted = COUNTRY_RESTRICTIONS.mode === 'WHITELIST' 
      && !COUNTRY_RESTRICTIONS.countries.includes(country);

    if (isBlacklisted || isNotWhitelisted) {
      return {
        isAllowed: false,
        currentUsage: 0,
        limit: 0,
        remaining: 0,
        limitType: LimitType.PER_TRANSACTION,
        action: LimitAction.BLOCK,
        message: COUNTRY_RESTRICTIONS.reason || 'Transactions not allowed from your country',
        messageAr: 'المعاملات غير مسموح بها من بلدك'
      };
    }

    return {
      isAllowed: true,
      currentUsage: 0,
      limit: 0,
      remaining: 0,
      limitType: LimitType.PER_TRANSACTION,
      message: 'Country allowed',
      messageAr: 'البلد مسموح'
    };
  }

  /**
   * Get current usage for a limit type
   */
  private async getUsage(userId: string, limitType: LimitType, transactionType: string): Promise<number> {
    const cacheKey = `${userId}:${limitType}:${transactionType}`;
    const cached = usageCache.get(cacheKey);

    if (cached && cached.expiresAt > new Date()) {
      return cached.amount;
    }

    // In production, query database
    // const startDate = this.getLimitStartDate(limitType);
    // const usage = await prisma.walletTransaction.aggregate({
    //   where: { userId, createdAt: { gte: startDate }, type: transactionType },
    //   _sum: { amount: true }
    // });

    // Mock usage for now
    const mockUsage = Math.random() * 500;
    
    usageCache.set(cacheKey, {
      amount: mockUsage,
      expiresAt: this.getLimitExpiry(limitType)
    });

    return mockUsage;
  }

  /**
   * Record usage after successful transaction
   */
  async recordUsage(
    userId: string,
    amount: number,
    transactionType: string
  ): Promise<void> {
    const limitTypes = [LimitType.DAILY, LimitType.WEEKLY, LimitType.MONTHLY, LimitType.ROLLING_24H];

    for (const limitType of limitTypes) {
      const cacheKey = `${userId}:${limitType}:${transactionType}`;
      const cached = usageCache.get(cacheKey);

      if (cached && cached.expiresAt > new Date()) {
        cached.amount += amount;
      } else {
        usageCache.set(cacheKey, {
          amount,
          expiresAt: this.getLimitExpiry(limitType)
        });
      }
    }

    console.log(`[Limits] Recorded usage: ${amount} for user ${userId}`);
  }

  /**
   * Get user tier
   */
  private async getUserTier(userId: string): Promise<string> {
    // Mock implementation - in production, fetch from user profile
    return 'verified';
  }

  /**
   * Get remaining limits summary for a user
   */
  async getRemainingLimits(userId: string, transactionType: string = 'WITHDRAWAL'): Promise<{
    tier: string;
    limits: {
      type: LimitType;
      limit: number;
      used: number;
      remaining: number;
      resetsAt: Date;
    }[];
  }> {
    const userTier = await this.getUserTier(userId);
    const tierLimits = DEFAULT_LIMITS[userTier] || DEFAULT_LIMITS.basic;

    const limits = await Promise.all(
      Object.entries(tierLimits).map(async ([type, limit]) => {
        const used = await this.getUsage(userId, type as LimitType, transactionType);
        return {
          type: type as LimitType,
          limit,
          used,
          remaining: Math.max(0, limit - used),
          resetsAt: this.getLimitExpiry(type as LimitType)
        };
      })
    );

    return { tier: userTier, limits };
  }

  /**
   * Update user tier limits (admin)
   */
  async updateUserLimits(
    userId: string,
    customLimits: Partial<Record<LimitType, number>>
  ): Promise<{ success: boolean; message: string }> {
    // In production, store in database
    console.log(`[Limits] Updated custom limits for user ${userId}:`, customLimits);
    return { success: true, message: 'Limits updated successfully' };
  }

  // Helper methods for date calculations

  private getLimitExpiry(limitType: LimitType): Date {
    switch (limitType) {
      case LimitType.ROLLING_24H:
        return new Date(Date.now() + 24 * 60 * 60 * 1000);
      case LimitType.DAILY:
        return this.getEndOfDay();
      case LimitType.WEEKLY:
        return this.getEndOfWeek();
      case LimitType.MONTHLY:
        return this.getEndOfMonth();
      default:
        return new Date(Date.now() + 60 * 60 * 1000);
    }
  }

  private getEndOfDay(): Date {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return end;
  }

  private getEndOfWeek(): Date {
    const end = new Date();
    const daysUntilSunday = 7 - end.getDay();
    end.setDate(end.getDate() + daysUntilSunday);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  private getEndOfMonth(): Date {
    const end = new Date();
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return end;
  }
}

// Singleton instance
export const transactionLimitsService = new TransactionLimitsService();
