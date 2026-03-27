import { PrismaClient, TierLevel, EarnAction, TransactionType, RedemptionStatus } from '@prisma/client';
import { PartnerService } from './partner.service';
import { GamificationService } from './gamification.service';
import { SpecialOffersService } from './special-offers.service';

const prisma = new PrismaClient();

// ============================================
// POINTS CONFIGURATION
// ============================================

export const POINTS_CONFIG = {
  // Points earned per action
  EARN_RATES: {
    PURCHASE: 10,              // 10 points per $1 spent
    FIRST_ORDER: 500,          // Bonus for first order
    REVIEW: 50,                 // Points for writing a review
    REFERRAL_SIGNUP: 100,      // Points when referred user signs up
    REFERRAL_PURCHASE: 200,    // Points when referred makes first purchase
    DAILY_LOGIN: 5,            // Points for daily login
    PROFILE_COMPLETE: 50,      // Points for completing profile
    SOCIAL_SHARE: 25,          // Points for sharing on social media
    APP_DOWNLOAD: 100,         // Points for downloading app
    BIRTHDAY: 200,             // Birthday bonus points
    SURVEY_COMPLETE: 30,       // Points for completing survey
  } as Record<EarnAction, number>,

  // Expiration settings
  EXPIRATION: {
    DEFAULT_MONTHS: 12,        // Points expire after 12 months
    WARNING_DAYS: 30,          // Notify 30 days before expiration
  },

  // Tier thresholds (lifetime points required)
  TIER_THRESHOLDS: {
    BRONZE: 0,
    SILVER: 5000,
    GOLD: 20000,
    PLATINUM: 50000,
  } as Record<TierLevel, number>,

  // Tier multipliers
  TIER_MULTIPLIERS: {
    BRONZE: 1.0,
    SILVER: 1.25,
    GOLD: 1.5,
    PLATINUM: 2.0,
  } as Record<TierLevel, number>,

  // Redemption rate
  POINTS_PER_DOLLAR: 100,     // 100 points = $1
};

// ============================================
// TYPES
// ============================================

export interface PointsEarnParams {
  userId: string;
  action: EarnAction;
  amount?: number;           // Dollar amount for purchases
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, any>;
}

export interface PointsRedeemParams {
  userId: string;
  points: number;
  redemptionType: 'WALLET' | 'DISCOUNT' | 'PARTNER';
  partnerId?: string;
  referenceType?: string;
  referenceId?: string;
}

export interface BalanceInfo {
  availablePoints: number;
  lifetimePoints: number;
  redeemedPoints: number;
  expiredPoints: number;
  currentTier: TierLevel;
  tierProgress: TierProgress;
  expiringPoints: ExpiringPointInfo[];
}

export interface TierProgress {
  currentTier: TierLevel;
  nextTier: TierLevel | null;
  pointsToNextTier: number;
  progressPercent: number;
  tierMultiplier: number;
}

export interface ExpiringPointInfo {
  points: number;
  expiresAt: Date;
  daysRemaining: number;
}

// ============================================
// MAIN LOYALTY SERVICE
// ============================================

export class LoyaltyService {
  private partnerService: PartnerService;
  private gamificationService: GamificationService;
  private specialOffersService: SpecialOffersService;

  constructor() {
    this.partnerService = new PartnerService();
    this.gamificationService = new GamificationService();
    this.specialOffersService = new SpecialOffersService();
  }

  // ========================================
  // POINTS EARNING
  // ========================================

  /**
   * Award points to a user for a specific action
   */
  async earnPoints(params: PointsEarnParams) {
    const { userId, action, amount, referenceType, referenceId, metadata } = params;
    
    // Calculate base points
    let basePoints = POINTS_CONFIG.EARN_RATES[action] || 0;
    
    // For purchases, calculate based on amount
    if (action === 'PURCHASE' && amount) {
      basePoints = Math.floor(amount * POINTS_CONFIG.EARN_RATES.PURCHASE);
    }

    // Get user's tier for multiplier
    const account = await this.getOrCreateAccount(userId);
    const multiplier = POINTS_CONFIG.TIER_MULTIPLIERS[account.currentTier];
    const finalPoints = Math.floor(basePoints * multiplier);

    // Calculate expiration date (12 months from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + POINTS_CONFIG.EXPIRATION.DEFAULT_MONTHS);

    return prisma.$transaction(async (tx) => {
      // Update account balance
      const updatedAccount = await tx.loyaltyAccount.update({
        where: { userId },
        data: {
          availablePoints: { increment: finalPoints },
          lifetimePoints: { increment: finalPoints },
        }
      });

      // Create expiration record for tracking
      const expiringPoints = await tx.expiringPoints.create({
        data: {
          loyaltyAccountId: updatedAccount.id,
          userId,
          points: finalPoints,
          earnedAt: new Date(),
          expiresAt,
        }
      });

      // Create transaction record
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: updatedAccount.id,
          userId,
          points: finalPoints,
          type: TransactionType.EARNED,
          action,
          description: `Earned ${finalPoints} points for ${action}`,
          referenceType,
          referenceId,
          expiresAt,
          metadata: metadata ? JSON.stringify(metadata) : undefined,
        }
      });

      // Check for achievements
      await this.gamificationService.checkAchievements(userId, action);

      // Update tier if needed
      await this.updateTier(tx, userId);

      return {
        account: updatedAccount,
        transaction,
        expiringPoints,
        pointsEarned: finalPoints,
        tierMultiplier: multiplier,
      };
    });
  }

  /**
   * Redeem points for wallet balance or discount
   */
  async redeemPoints(params: PointsRedeemParams) {
    const { userId, points, redemptionType, partnerId, referenceType, referenceId } = params;

    if (points <= 0) {
      throw new Error('Points must be greater than 0');
    }

    // Check available points
    const account = await prisma.loyaltyAccount.findUnique({
      where: { userId }
    });

    if (!account || account.availablePoints < points) {
      throw new Error('Insufficient points');
    }

    // Calculate cash value
    const cashValue = points / POINTS_CONFIG.POINTS_PER_DOLLAR;

    return prisma.$transaction(async (tx) => {
      // Deduct points
      const updatedAccount = await tx.loyaltyAccount.update({
        where: { userId },
        data: {
          availablePoints: { decrement: points },
          redeemedPoints: { increment: points },
        }
      });

      // Create transaction record
      const transaction = await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          userId,
          points: -points,
          type: TransactionType.REDEEMED,
          action: redemptionType as EarnAction,
          description: `Redeemed ${points} points for ${cashValue.toFixed(2)} USD`,
          referenceType,
          referenceId,
        }
      });

      // If partner redemption, record it
      if (redemptionType === 'PARTNER' && partnerId) {
        await this.partnerService.recordRedemption(tx, {
          partnerId,
          userId,
          pointsSpent: points,
          valueReceived: cashValue,
          status: RedemptionStatus.COMPLETED,
          referenceId,
        });
      }

      // Check achievements
      await this.gamificationService.checkAchievements(userId, 'PURCHASE' as EarnAction);

      return {
        account: updatedAccount,
        transaction,
        pointsRedeemed: points,
        cashValue,
      };
    });
  }

  // ========================================
  // POINTS EXPIRATION
  // ========================================

  /**
   * Process points expiration (should be run daily via scheduler)
   */
  async processExpirations() {
    const now = new Date();
    
    // Find all expiring points that have expired
    const expiredRecords = await prisma.expiringPoints.findMany({
      where: {
        expiresAt: { lte: now },
        status: ExpiryStatus.PENDING,
      },
      include: {
        loyaltyAccount: true,
      }
    });

    const results = [];

    for (const record of expiredRecords) {
      await prisma.$transaction(async (tx) => {
        // Update expiration status
        await tx.expiringPoints.update({
          where: { id: record.id },
          data: { status: ExpiryStatus.EXPIRED },
        });

        // Deduct from available points
        await tx.loyaltyAccount.update({
          where: { id: record.loyaltyAccountId },
          data: {
            availablePoints: { decrement: record.points },
            expiredPoints: { increment: record.points },
          }
        });

        // Create expiration transaction
        await tx.loyaltyTransaction.create({
          data: {
            loyaltyAccountId: record.loyaltyAccountId,
            userId: record.userId,
            points: -record.points,
            type: TransactionType.EXPIRED,
            action: 'PURCHASE' as EarnAction,
            description: `${record.points} points expired`,
          }
        });

        results.push({
          userId: record.userId,
          pointsExpired: record.points,
        });
      });
    }

    return {
      processed: results.length,
      expirations: results,
    };
  }

  /**
   * Get expiring points for a user
   */
  async getExpiringPoints(userId: string): Promise<ExpiringPointInfo[]> {
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + POINTS_CONFIG.EXPIRATION.WARNING_DAYS);

    const expiring = await prisma.expiringPoints.findMany({
      where: {
        userId,
        status: ExpiryStatus.PENDING,
        expiresAt: {
          lte: warningDate,
          gte: now,
        },
      },
      orderBy: { expiresAt: 'asc' },
    });

    return expiring.map(record => {
      const daysRemaining = Math.ceil(
        (record.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        points: record.points,
        expiresAt: record.expiresAt,
        daysRemaining,
      };
    });
  }

  // ========================================
  // ACCOUNT MANAGEMENT
  // ========================================

  /**
   * Get or create a loyalty account
   */
  async getOrCreateAccount(userId: string) {
    let account = await prisma.loyaltyAccount.findUnique({
      where: { userId }
    });

    if (!account) {
      // Ensure tier exists
      await this.ensureTiersExist();

      account = await prisma.loyaltyAccount.create({
        data: {
          userId,
          availablePoints: 0,
          lifetimePoints: 0,
          redeemedPoints: 0,
          expiredPoints: 0,
          currentTier: TierLevel.BRONZE,
        }
      });

      // Initialize tier progress
      await this.gamificationService.initializeTierProgress(userId);
    }

    return account;
  }

  /**
   * Get complete balance information
   */
  async getBalance(userId: string): Promise<BalanceInfo> {
    const account = await this.getOrCreateAccount(userId);
    const tierProgress = await this.getTierProgress(userId);
    const expiringPoints = await this.getExpiringPoints(userId);

    return {
      availablePoints: account.availablePoints,
      lifetimePoints: account.lifetimePoints,
      redeemedPoints: account.redeemedPoints,
      expiredPoints: account.expiredPoints,
      currentTier: account.currentTier,
      tierProgress,
      expiringPoints,
    };
  }

  /**
   * Get tier progress information
   */
  async getTierProgress(userId: string): Promise<TierProgress> {
    const account = await this.getOrCreateAccount(userId);
    const currentTier = account.currentTier;

    // Find next tier
    const tiers = [TierLevel.BRONZE, TierLevel.SILVER, TierLevel.GOLD, TierLevel.PLATINUM];
    const currentIndex = tiers.indexOf(currentTier);
    const nextTier = currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;

    if (!nextTier) {
      return {
        currentTier,
        nextTier: null,
        pointsToNextTier: 0,
        progressPercent: 100,
        tierMultiplier: POINTS_CONFIG.TIER_MULTIPLIERS[currentTier],
      };
    }

    const currentThreshold = POINTS_CONFIG.TIER_THRESHOLDS[currentTier];
    const nextThreshold = POINTS_CONFIG.TIER_THRESHOLDS[nextTier];
    const pointsInTier = account.lifetimePoints - currentThreshold;
    const pointsNeeded = nextThreshold - currentThreshold;
    const progressPercent = Math.min(100, (pointsInTier / pointsNeeded) * 100);

    return {
      currentTier,
      nextTier,
      pointsToNextTier: nextThreshold - account.lifetimePoints,
      progressPercent: Math.round(progressPercent * 100) / 100,
      tierMultiplier: POINTS_CONFIG.TIER_MULTIPLIERS[currentTier],
    };
  }

  // ========================================
  // PRIVATE HELPERS
  // ========================================

  /**
   * Update user's tier based on lifetime points
   */
  private async updateTier(tx: any, userId: string) {
    const account = await tx.loyaltyAccount.findUnique({
      where: { userId }
    });

    const thresholds = POINTS_CONFIG.TIER_THRESHOLDS;
    let newTier = TierLevel.BRONZE;

    if (account.lifetimePoints >= thresholds.PLATINUM) {
      newTier = TierLevel.PLATINUM;
    } else if (account.lifetimePoints >= thresholds.GOLD) {
      newTier = TierLevel.GOLD;
    } else if (account.lifetimePoints >= thresholds.SILVER) {
      newTier = TierLevel.SILVER;
    }

    if (newTier !== account.currentTier) {
      await tx.loyaltyAccount.update({
        where: { userId },
        data: {
          currentTier: newTier,
          tierStartDate: new Date(),
        }
      });

      // Record tier change
      await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          userId,
          points: 0,
          type: TransactionType.ADJUSTED,
          action: 'PURCHASE' as EarnAction,
          description: `Upgraded to ${newTier} tier`,
        }
      });

      // Check for tier achievements
      await this.gamificationService.checkTierAchievements(userId, newTier);
    }
  }

  /**
   * Ensure all tier records exist
   */
  private async ensureTiersExist() {
    const tiers = [
      { name: TierLevel.BRONZE, minPoints: 0, multiplier: 1.0 },
      { name: TierLevel.SILVER, minPoints: 5000, multiplier: 1.25 },
      { name: TierLevel.GOLD, minPoints: 20000, multiplier: 1.5 },
      { name: TierLevel.PLATINUM, minPoints: 50000, multiplier: 2.0 },
    ];

    for (const tier of tiers) {
      await prisma.tier.upsert({
        where: { name: tier.name },
        create: tier,
        update: tier,
      });
    }
  }

  // ========================================
  // TRANSFER METHODS
  // ========================================

  /**
   * Transfer points between users
   */
  async transferPoints(fromUserId: string, toUserId: string, points: number) {
    if (points <= 0) {
      throw new Error('Points must be greater than 0');
    }

    const fromAccount = await prisma.loyaltyAccount.findUnique({
      where: { userId: fromUserId }
    });

    if (!fromAccount || fromAccount.availablePoints < points) {
      throw new Error('Insufficient points');
    }

    const toAccount = await this.getOrCreateAccount(toUserId);

    return prisma.$transaction(async (tx) => {
      // Deduct from sender
      await tx.loyaltyAccount.update({
        where: { userId: fromUserId },
        data: {
          availablePoints: { decrement: points },
          redeemedPoints: { increment: points },
        }
      });

      // Add to receiver
      await tx.loyaltyAccount.update({
        where: { userId: toUserId },
        data: {
          availablePoints: { increment: points },
          lifetimePoints: { increment: points },
        }
      });

      // Create transfer records
      await tx.loyaltyTransaction.createMany({
        data: [
          {
            loyaltyAccountId: fromAccount.id,
            userId: fromUserId,
            points: -points,
            type: TransactionType.TRANSFER_OUT,
            action: 'PURCHASE' as EarnAction,
            description: `Transferred ${points} points to ${toUserId}`,
          },
          {
            loyaltyAccountId: toAccount.id,
            userId: toUserId,
            points: points,
            type: TransactionType.TRANSFER_IN,
            action: 'PURCHASE' as EarnAction,
            description: `Received ${points} points from ${fromUserId}`,
          },
        ]
      });

      return { transferred: points, from: fromUserId, to: toUserId };
    });
  }

  // ========================================
  // HISTORY
  // ========================================

  /**
   * Get transaction history for a user
   */
  async getHistory(userId: string, page = 1, limit = 20) {
    const transactions = await prisma.loyaltyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.loyaltyTransaction.count({
      where: { userId }
    });

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }
}
