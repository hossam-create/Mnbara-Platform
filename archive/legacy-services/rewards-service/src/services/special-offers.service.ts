import { PrismaClient, CampaignType } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// SPECIAL OFFERS SERVICE
// ============================================

export class SpecialOffersService {

  /**
   * Create a special offer campaign
   */
  async createOffer(data: {
    code: string;
    title: string;
    description: string;
    type: CampaignType;
    bonusPoints?: number;
    multiplier?: number;
    minPurchase?: number;
    maxBonus?: number;
    startDate: Date;
    endDate: Date;
    targetTiers?: string[];
    usageLimit?: number;
  }) {
    return prisma.specialOffer.create({
      data: {
        ...data,
        type: data.type as any,
        targetTiers: data.targetTiers as any,
      }
    });
  }

  /**
   * Get offer by code
   */
  async getOfferByCode(code: string) {
    const now = new Date();
    return prisma.specialOffer.findUnique({
      where: { code },
    });
  }

  /**
   * Validate and get active offer
   */
  async validateOffer(code: string, userId: string) {
    const now = new Date();
    const offer = await prisma.specialOffer.findUnique({
      where: { code },
    });

    if (!offer) {
      return { valid: false, error: 'Offer not found' };
    }

    if (!offer.isActive) {
      return { valid: false, error: 'Offer is not active' };
    }

    if (now < offer.startDate) {
      return { valid: false, error: 'Offer has not started yet' };
    }

    if (now > offer.endDate) {
      return { valid: false, error: 'Offer has expired' };
    }

    // Check user usage limit
    if (offer.usageLimit) {
      const usageCount = await prisma.offerUsage.count({
        where: {
          offerId: offer.id,
          userId,
        }
      });

      if (usageCount >= offer.usageLimit) {
        return { valid: false, error: 'You have reached the usage limit for this offer' };
      }
    }

    return { valid: true, offer };
  }

  /**
   * Use a special offer
   */
  async useOffer(code: string, userId: string, orderId?: string): Promise<{
    pointsEarned: number;
    offer: any;
  }> {
    const validation = await this.validateOffer(code, userId);
    
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const offer = validation.offer!;
    let pointsEarned = offer.bonusPoints || 0;

    // Calculate multiplier bonus
    if (offer.multiplier && offer.multiplier > 1) {
      pointsEarned = Math.floor(pointsEarned * offer.multiplier);
    }

    // Cap at max bonus if specified
    if (offer.maxBonus && pointsEarned > offer.maxBonus) {
      pointsEarned = offer.maxBonus;
    }

    return prisma.$transaction(async (tx) => {
      // Record usage
      await tx.offerUsage.create({
        data: {
          offerId: offer.id,
          userId,
          pointsEarned,
          orderId,
        }
      });

      // Increment total uses
      await tx.specialOffer.update({
        where: { id: offer.id },
        data: { totalUses: { increment: 1 } }
      });

      return { pointsEarned, offer };
    });
  }

  /**
   * Get all active offers
   */
  async getActiveOffers(userId?: string) {
    const now = new Date();
    
    const offers = await prisma.specialOffer.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { endDate: 'asc' }
    });

    // If user provided, filter by tier and show eligibility
    if (userId) {
      const account = await prisma.loyaltyAccount.findUnique({
        where: { userId }
      });

      if (account) {
        return offers.map(offer => {
          const eligible = !offer.targetTiers || 
            offer.targetTiers.length === 0 ||
            offer.targetTiers.includes(account.currentTier);
          
          return {
            ...offer,
            eligible,
            userTier: account.currentTier,
          };
        });
      }
    }

    return offers;
  }

  /**
   * Get user's offer history
   */
  async getUserOfferHistory(userId: string, page = 1, limit = 20) {
    const usage = await prisma.offerUsage.findMany({
      where: { userId },
      include: {
        offer: true,
      },
      orderBy: { usedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.offerUsage.count({
      where: { userId }
    });

    return {
      usage,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  /**
   * Deactivate an offer
   */
  async deactivateOffer(id: string) {
    return prisma.specialOffer.update({
      where: { id },
      data: { isActive: false }
    });
  }

  /**
   * Update an offer
   */
  async updateOffer(id: string, data: Partial<{
    title: string;
    description: string;
    type: CampaignType;
    bonusPoints: number;
    multiplier: number;
    minPurchase: number;
    maxBonus: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    usageLimit: number;
  }>) {
    return prisma.specialOffer.update({
      where: { id },
      data: {
        ...data,
        type: data.type as any,
      }
    });
  }

  /**
   * Get offer statistics
   */
  async getOfferStats(offerId: string) {
    const offer = await prisma.specialOffer.findUnique({
      where: { id: offerId }
    });

    if (!offer) return null;

    const [usage, totalPoints] = await Promise.all([
      prisma.offerUsage.count({
        where: { offerId }
      }),
      prisma.offerUsage.aggregate({
        where: { offerId },
        _sum: { pointsEarned: true }
      }),
    ]);

    return {
      offer,
      totalUses: usage,
      totalPointsAwarded: totalPoints._sum.pointsEarned || 0,
      usageRate: offer.usageLimit ? (usage / offer.usageLimit) * 100 : null,
    };
  }
}
