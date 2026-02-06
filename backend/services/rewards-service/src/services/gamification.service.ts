import { PrismaClient, TierLevel, EarnAction, AchievementCategory } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// ACHIEVEMENT DEFINITIONS
// ============================================

export const ACHIEVEMENTS = [
  // Purchase achievements
  {
    code: 'FIRST_PURCHASE',
    name: 'First Steps',
    description: 'Make your first purchase',
    category: AchievementCategory.PURCHASES,
    pointsReward: 100,
    criteria: { type: 'purchase_count', value: 1 },
  },
  {
    code: 'FIVE_PURCHASES',
    name: 'Regular Shopper',
    description: 'Complete 5 purchases',
    category: AchievementCategory.PURCHASES,
    pointsReward: 250,
    criteria: { type: 'purchase_count', value: 5 },
  },
  {
    code: 'TEN_PURCHASES',
    name: 'Frequent Buyer',
    description: 'Complete 10 purchases',
    category: AchievementCategory.PURCHASES,
    pointsReward: 500,
    criteria: { type: 'purchase_count', value: 10 },
  },
  {
    code: 'FIFTY_PURCHASES',
    name: 'Power Shopper',
    description: 'Complete 50 purchases',
    category: AchievementCategory.PURCHASES,
    pointsReward: 2000,
    criteria: { type: 'purchase_count', value: 50 },
  },
  
  // Points achievements
  {
    code: 'FIRST_1000_POINTS',
    name: 'Point Collector',
    description: 'Earn 1,000 lifetime points',
    category: AchievementCategory.MILESTONE,
    pointsReward: 100,
    criteria: { type: 'lifetime_points', value: 1000 },
  },
  {
    code: 'FIRST_10000_POINTS',
    name: 'Point Master',
    description: 'Earn 10,000 lifetime points',
    category: AchievementCategory.MILESTONE,
    pointsReward: 500,
    criteria: { type: 'lifetime_points', value: 10000 },
  },
  {
    code: 'FIRST_50000_POINTS',
    name: 'Point Legend',
    description: 'Earn 50,000 lifetime points',
    category: AchievementCategory.MILESTONE,
    pointsReward: 2000,
    criteria: { type: 'lifetime_points', value: 50000 },
  },
  
  // Review achievements
  {
    code: 'FIRST_REVIEW',
    name: 'Voice Your Opinion',
    description: 'Write your first review',
    category: AchievementCategory.ENGAGEMENT,
    pointsReward: 50,
    criteria: { type: 'review_count', value: 1 },
  },
  {
    code: 'FIVE_REVIEWS',
    name: 'Helpful Reviewer',
    description: 'Write 5 reviews',
    category: AchievementCategory.ENGAGEMENT,
    pointsReward: 200,
    criteria: { type: 'review_count', value: 5 },
  },
  {
    code: 'TEN_REVIEWS',
    name: 'Review Pro',
    description: 'Write 10 reviews',
    category: AchievementCategory.ENGAGEMENT,
    pointsReward: 400,
    criteria: { type: 'review_count', value: 10 },
  },
  
  // Referral achievements
  {
    code: 'FIRST_REFERRAL',
    name: 'Friend Maker',
    description: 'Refer your first friend',
    category: AchievementCategory.SOCIAL,
    pointsReward: 150,
    criteria: { type: 'referral_count', value: 1 },
  },
  {
    code: 'FIVE_REFERRALS',
    name: 'Networker',
    description: 'Refer 5 friends',
    category: AchievementCategory.SOCIAL,
    pointsReward: 750,
    criteria: { type: 'referral_count', value: 5 },
  },
  
  // Tier achievements
  {
    code: 'REACH_SILVER',
    name: 'Silver Status',
    description: 'Reach Silver tier',
    category: AchievementCategory.GAMIFICATION,
    tierRequirement: TierLevel.SILVER,
    pointsReward: 300,
    criteria: { type: 'tier', value: 'SILVER' },
  },
  {
    code: 'REACH_GOLD',
    name: 'Gold Status',
    description: 'Reach Gold tier',
    category: AchievementCategory.GAMIFICATION,
    tierRequirement: TierLevel.GOLD,
    pointsReward: 750,
    criteria: { type: 'tier', value: 'GOLD' },
  },
  {
    code: 'REACH_PLATINUM',
    name: 'Platinum Elite',
    description: 'Reach Platinum tier',
    category: AchievementCategory.GAMIFICATION,
    tierRequirement: TierLevel.PLATINUM,
    pointsReward: 2000,
    criteria: { type: 'tier', value: 'PLATINUM' },
  },
  
  // Redemption achievements
  {
    code: 'FIRST_REDEMPTION',
    name: 'First Reward',
    description: 'Redeem your first points',
    category: AchievementCategory.ENGAGEMENT,
    pointsReward: 100,
    criteria: { type: 'redemption_count', value: 1 },
  },
  {
    code: 'REDEMPTION_MASTER',
    name: 'Redemption Master',
    description: 'Redeem points 25 times',
    category: AchievementCategory.ENGAGEMENT,
    pointsReward: 500,
    criteria: { type: 'redemption_count', value: 25 },
  },
];

// ============================================
// GAMIFICATION SERVICE
// ============================================

export class GamificationService {

  /**
   * Initialize achievements in database
   */
  async initializeAchievements() {
    for (const achievement of ACHIEVEMENTS) {
      await prisma.achievement.upsert({
        where: { code: achievement.code },
        create: achievement,
        update: achievement,
      });
    }
    return { created: ACHIEVEMENTS.length };
  }

  /**
   * Initialize tier progress for a user
   */
  async initializeTierProgress(userId: string) {
    const tiers = await prisma.tier.findMany({
      orderBy: { minPoints: 'asc' }
    });

    if (tiers.length === 0) {
      await this.initializeTiers();
    }

    const account = await prisma.loyaltyAccount.findUnique({
      where: { userId }
    });

    if (account) {
      await prisma.tierProgress.upsert({
        where: {
          loyaltyAccountId_tier: {
            loyaltyAccountId: account.id,
            tier: account.currentTier,
          }
        },
        create: {
          loyaltyAccountId: account.id,
          userId,
          tier: account.currentTier,
          pointsAtTier: account.lifetimePoints,
          nextTierPoints: 5000, // Silver threshold
          progressPercent: 0,
        },
        update: {
          pointsAtTier: account.lifetimePoints,
          progressPercent: 0,
        }
      });
    }
  }

  /**
   * Initialize default tiers
   */
  async initializeTiers() {
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

    return { tiersCreated: tiers.length };
  }

  /**
   * Check and unlock achievements based on action
   */
  async checkAchievements(userId: string, action: EarnAction) {
    const achievements = await prisma.achievement.findMany({
      where: { isActive: true }
    });

    const unlockedAchievements = [];

    for (const achievement of achievements) {
      // Skip if already unlocked
      const existing = await prisma.userAchievement.findUnique({
        where: {
          loyaltyAccountId_achievementId: {
            loyaltyAccountId: (await prisma.loyaltyAccount.findUnique({ where: { userId } }))?.id || '',
            achievementId: achievement.id,
          }
        }
      });

      if (existing) continue;

      // Check criteria
      const unlocked = await this.checkCriteria(userId, achievement.criteria);
      
      if (unlocked) {
        await this.unlockAchievement(userId, achievement.id);
        unlockedAchievements.push(achievement);
      }
    }

    return unlockedAchievements;
  }

  /**
   * Check tier-specific achievements
   */
  async checkTierAchievements(userId: string, newTier: TierLevel) {
    const tierAchievement = await prisma.achievement.findFirst({
      where: {
        code: `REACH_${newTier}`,
        isActive: true,
      }
    });

    if (tierAchievement) {
      await this.unlockAchievement(userId, tierAchievement.id);
      return tierAchievement;
    }

    return null;
  }

  /**
   * Unlock an achievement
   */
  async unlockAchievement(userId: string, achievementId: string) {
    const account = await prisma.loyaltyAccount.findUnique({
      where: { userId }
    });

    if (!account) return null;

    // Check if already unlocked
    const existing = await prisma.userAchievement.findUnique({
      where: {
        loyaltyAccountId_achievementId: {
          loyaltyAccountId: account.id,
          achievementId,
        }
      }
    });

    if (existing) return null;

    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId }
    });

    // Create user achievement
    const userAchievement = await prisma.userAchievement.create({
      data: {
        loyaltyAccountId: account.id,
        userId,
        achievementId,
        progress: 100,
      }
    });

    // Award bonus points
    if (achievement && achievement.pointsReward > 0) {
      await prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          availablePoints: { increment: achievement.pointsReward },
          lifetimePoints: { increment: achievement.pointsReward },
        }
      });

      await prisma.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          userId,
          points: achievement.pointsReward,
          type: 'BONUS' as any,
          action: 'PURCHASE' as EarnAction,
          description: `Achievement unlocked: ${achievement.name}`,
        }
      });
    }

    return { userAchievement, achievement };
  }

  /**
   * Get user's achievements
   */
  async getUserAchievements(userId: string) {
    const account = await prisma.loyaltyAccount.findUnique({
      where: { userId }
    });

    if (!account) return { unlocked: [], locked: [] };

    const unlockedIds = await prisma.userAchievement.findMany({
      where: { loyaltyAccountId: account.id },
      select: { achievementId: true }
    }).then(uas => uas.map(ua => ua.achievementId));

    const allAchievements = await prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: { pointsReward: 'desc' }
    });

    return {
      unlocked: allAchievements.filter(a => unlockedIds.includes(a.id)),
      locked: allAchievements.filter(a => !unlockedIds.includes(a.id)),
      totalUnlocked: unlockedIds.length,
      totalAchievements: allAchievements.length,
    };
  }

  /**
   * Get achievement progress
   */
  async getAchievementProgress(userId: string, achievementCode: string) {
    const achievement = await prisma.achievement.findUnique({
      where: { code: achievementCode }
    });

    if (!achievement) return null;

    const currentProgress = await this.calculateProgress(userId, achievement.criteria);
    const isUnlocked = currentProgress >= (achievement.criteria as any).value;

    return {
      achievement,
      currentProgress,
      targetValue: (achievement.criteria as any).value,
      progressPercent: Math.min(100, (currentProgress / (achievement.criteria as any).value) * 100),
      isUnlocked,
    };
  }

  // ========================================
  // LEADERBOARDS
  // ========================================

  /**
   * Get leaderboard
   */
  async getLeaderboard(type: 'LIFETIME_POINTS' | 'MONTHLY_POINTS' | 'WEEKLY_POINTS', limit = 10, offset = 0) {
    const now = new Date();
    let startDate: Date;

    switch (type) {
      case 'WEEKLY_POINTS':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'MONTHLY_POINTS':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    const transactions = await prisma.loyaltyTransaction.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startDate },
        type: 'EARNED' as any,
      },
      _sum: {
        points: true,
      },
      orderBy: {
        _sum: {
          points: 'desc',
        }
      },
      take: limit,
      skip: offset,
    });

    return transactions.map((t, index) => ({
      rank: offset + index + 1,
      userId: t.userId,
      points: t._sum.points || 0,
    }));
  }

  /**
   * Get user's rank
   */
  async getUserRank(userId: string, type: 'LIFETIME_POINTS' | 'MONTHLY_POINTS' | 'WEEKLY_POINTS') {
    const leaderboard = await this.getLeaderboard(type, 1000);
    const userEntry = leaderboard.find(e => e.userId === userId);
    
    return {
      rank: userEntry?.rank || null,
      points: userEntry?.points || 0,
    };
  }

  // ========================================
  // PRIVATE HELPERS
  // ========================================

  /**
   * Check if criteria is met
   */
  private async checkCriteria(userId: string, criteria: any): Promise<boolean> {
    const account = await prisma.loyaltyAccount.findUnique({
      where: { userId }
    });

    if (!account) return false;

    const criteriaType = criteria.type;
    const targetValue = criteria.value;

    switch (criteriaType) {
      case 'purchase_count':
        const purchaseCount = await prisma.loyaltyTransaction.count({
          where: {
            userId,
            action: 'PURCHASE' as EarnAction,
            type: 'EARNED' as any,
          }
        });
        return purchaseCount >= targetValue;

      case 'lifetime_points':
        return account.lifetimePoints >= targetValue;

      case 'review_count':
        const reviewCount = await prisma.loyaltyTransaction.count({
          where: {
            userId,
            action: 'REVIEW' as EarnAction,
            type: 'EARNED' as any,
          }
        });
        return reviewCount >= targetValue;

      case 'referral_count':
        const referralCount = await prisma.loyaltyTransaction.count({
          where: {
            userId,
            action: 'REFERRAL_SIGNUP' as EarnAction,
            type: 'EARNED' as any,
          }
        });
        return referralCount >= targetValue;

      case 'redemption_count':
        const redemptionCount = await prisma.loyaltyTransaction.count({
          where: {
            userId,
            type: 'REDEEMED' as any,
          }
        });
        return redemptionCount >= targetValue;

      case 'tier':
        const tierLevels = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
        const currentIndex = tierLevels.indexOf(account.currentTier);
        const targetIndex = tierLevels.indexOf(targetValue);
        return currentIndex >= targetIndex;

      default:
        return false;
    }
  }

  /**
   * Calculate current progress toward criteria
   */
  private async calculateProgress(userId: string, criteria: any): Promise<number> {
    const account = await prisma.loyaltyAccount.findUnique({
      where: { userId }
    });

    if (!account) return 0;

    const criteriaType = criteria.type;
    const targetValue = criteria.value;

    switch (criteriaType) {
      case 'purchase_count':
        return await prisma.loyaltyTransaction.count({
          where: {
            userId,
            action: 'PURCHASE' as EarnAction,
            type: 'EARNED' as any,
          }
        });

      case 'lifetime_points':
        return account.lifetimePoints;

      case 'review_count':
        return await prisma.loyaltyTransaction.count({
          where: {
            userId,
            action: 'REVIEW' as EarnAction,
            type: 'EARNED' as any,
          }
        });

      case 'referral_count':
        return await prisma.loyaltyTransaction.count({
          where: {
            userId,
            action: 'REFERRAL_SIGNUP' as EarnAction,
            type: 'EARNED' as any,
          }
        });

      case 'redemption_count':
        return await prisma.loyaltyTransaction.count({
          where: {
            userId,
            type: 'REDEEMED' as any,
          }
        });

      case 'tier':
        const tierLevels = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
        return tierLevels.indexOf(account.currentTier);

      default:
        return 0;
    }
  }
}
