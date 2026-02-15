import { PrismaClient, PartnerStatus, RedemptionStatus, PartnerTransactionType, TransactionStatus, OfferType } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// PARTNER SERVICE
// ============================================

export class PartnerService {
  
  // ========================================
  // PARTNER MANAGEMENT
  // ========================================

  /**
   * Create a new partner
   */
  async createPartner(data: {
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    websiteUrl?: string;
    category: string;
    pointsPerDollar?: number;
    redemptionRate?: number;
    apiKey?: string;
    apiEndpoint?: string;
  }) {
    return prisma.partner.create({
      data: {
        ...data,
        category: data.category as any,
      }
    });
  }

  /**
   * Get partner by slug
   */
  async getPartnerBySlug(slug: string) {
    return prisma.partner.findUnique({
      where: { slug },
      include: {
        offers: {
          where: {
            isActive: true,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          }
        }
      }
    });
  }

  /**
   * Get partner by ID
   */
  async getPartnerById(id: string) {
    return prisma.partner.findUnique({
      where: { id },
      include: {
        offers: true,
        _count: {
          select: {
            redemptions: true,
            transactions: true,
          }
        }
      }
    });
  }

  /**
   * List all active partners
   */
  async listPartners(category?: string, status = PartnerStatus.ACTIVE) {
    return prisma.partner.findMany({
      where: {
        status,
        ...(category ? { category: category as any } : {}),
      },
      include: {
        _count: {
          select: {
            offers: true,
            redemptions: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Update partner
   */
  async updatePartner(id: string, data: Partial<{
    name: string;
    description: string;
    logoUrl: string;
    websiteUrl: string;
    status: PartnerStatus;
    pointsPerDollar: number;
    redemptionRate: number;
    apiKey: string;
    apiEndpoint: string;
  }>) {
    return prisma.partner.update({
      where: { id },
      data
    });
  }

  /**
   * Get partner offers
   */
  async getPartnerOffers(partnerId: string, activeOnly = true) {
    const now = new Date();
    return prisma.partnerOffer.findMany({
      where: {
        partnerId,
        ...(activeOnly ? {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        } : {}),
      },
      orderBy: { endDate: 'asc' }
    });
  }

  // ========================================
  // OFFER MANAGEMENT
  // ========================================

  /**
   * Create partner offer
   */
  async createOffer(data: {
    partnerId: string;
    title: string;
    description?: string;
    type: OfferType;
    pointsCost?: number;
    discountPercent?: number;
    discountAmount?: number;
    maxUses?: number;
    startDate: Date;
    endDate: Date;
    terms?: string;
  }) {
    return prisma.partnerOffer.create({
      data: {
        ...data,
        type: data.type as any,
      }
    });
  }

  /**
   * Redeem partner offer
   */
  async redeemOffer(params: {
    offerId: string;
    partnerId: string;
    userId: string;
    code?: string;
  }) {
    const offer = await prisma.partnerOffer.findUnique({
      where: { id: params.offerId }
    });

    if (!offer) {
      throw new Error('Offer not found');
    }

    if (!offer.isActive) {
      throw new Error('Offer is not active');
    }

    if (offer.maxUses && offer.usedCount >= offer.maxUses) {
      throw new Error('Offer has reached maximum uses');
    }

    if (new Date() < offer.startDate || new Date() > offer.endDate) {
      throw new Error('Offer is not currently available');
    }

    return prisma.$transaction(async (tx) => {
      // Increment usage count
      await tx.partnerOffer.update({
        where: { id: params.offerId },
        data: { usedCount: { increment: 1 } }
      });

      // Create redemption record
      const redemption = await tx.offerRedemption.create({
        data: {
          offerId: params.offerId,
          code: params.code,
        }
      });

      return { redemption, offer };
    });
  }

  // ========================================
  // REDEMPTION TRACKING
  // ========================================

  /**
   * Record partner redemption
   */
  async recordRedemption(tx: any, data: {
    partnerId: string;
    userId: string;
    pointsSpent: number;
    valueReceived: number;
    status: RedemptionStatus;
    referenceId?: string;
  }) {
    return tx.partnerRedemption.create({
      data: {
        ...data,
        completedAt: data.status === RedemptionStatus.COMPLETED ? new Date() : null,
      }
    });
  }

  /**
   * Get user redemptions at a partner
   */
  async getUserPartnerRedemptions(userId: string, partnerId?: string) {
    return prisma.partnerRedemption.findMany({
      where: {
        userId,
        ...(partnerId ? { partnerId } : {}),
      },
      include: {
        partner: true,
        offerRedemptions: {
          include: {
            offer: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Complete a redemption
   */
  async completeRedemption(redemptionId: string, referenceId?: string) {
    return prisma.partnerRedemption.update({
      where: { id: redemptionId },
      data: {
        status: RedemptionStatus.COMPLETED,
        completedAt: new Date(),
        referenceId,
      }
    });
  }

  // ========================================
  // EARN POINTS FROM PARTNER
  // ========================================

  /**
   * Earn points from partner purchase
   */
  async earnFromPartner(params: {
    partnerId: string;
    userId: string;
    amount: number;
    currency?: string;
    referenceId?: string;
    description?: string;
  }) {
    const partner = await prisma.partner.findUnique({
      where: { id: params.partnerId }
    });

    if (!partner || partner.status !== PartnerStatus.ACTIVE) {
      throw new Error('Partner not found or inactive');
    }

    // Calculate points earned
    const pointsEarned = Math.floor(params.amount * partner.pointsPerDollar);

    return prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.partnerTransaction.create({
        data: {
          partnerId: params.partnerId,
          userId: params.userId,
          type: PartnerTransactionType.EARN,
          points: pointsEarned,
          amount: params.amount,
          currency: params.currency || 'USD',
          status: TransactionStatus.COMPLETED,
          referenceId: params.referenceId,
          description: params.description || `Earned ${pointsEarned} points from ${partner.name}`,
        }
      });

      // Update loyalty account
      await tx.loyaltyAccount.update({
        where: { userId: params.userId },
        data: {
          availablePoints: { increment: pointsEarned },
          lifetimePoints: { increment: pointsEarned },
        }
      });

      return { transaction, pointsEarned };
    });
  }

  // ========================================
  // PARTNER API SIMULATION
  // ========================================

  /**
   * Verify partner API key
   */
  async verifyPartnerApiKey(apiKey: string) {
    const partner = await prisma.partner.findFirst({
      where: { apiKey, status: PartnerStatus.ACTIVE }
    });

    return partner;
  }

  /**
   * Process partner webhook
   */
  async processWebhook(partnerId: string, payload: any, signature: string) {
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId }
    });

    if (!partner || !partner.webhookSecret) {
      throw new Error('Invalid partner');
    }

    // In production, verify signature here
    // const expectedSignature = crypto.createHmac('sha256', partner.webhookSecret)
    //   .update(JSON.stringify(payload)).digest('hex');

    // Process based on event type
    switch (payload.event) {
      case 'purchase.completed':
        await this.earnFromPartner({
          partnerId,
          userId: payload.userId,
          amount: payload.amount,
          referenceId: payload.referenceId,
        });
        break;

      case 'redemption.completed':
        // Handle external redemption
        break;

      default:
        console.log(`Unknown webhook event: ${payload.event}`);
    }

    return { received: true };
  }

  // ========================================
  // ANALYTICS
  // ========================================

  /**
   * Get partner statistics
   */
  async getPartnerStats(partnerId: string, startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    const end = endDate || new Date();

    const [redemptions, transactions, offers] = await Promise.all([
      prisma.partnerRedemption.aggregate({
        where: {
          partnerId,
          createdAt: { gte: start, lte: end },
        },
        _sum: { pointsSpent: true, valueReceived: true },
        _count: true,
      }),
      prisma.partnerTransaction.aggregate({
        where: {
          partnerId,
          createdAt: { gte: start, lte: end },
        },
        _sum: { points: true, amount: true },
        _count: true,
      }),
      prisma.partnerOffer.count({
        where: {
          partnerId,
          isActive: true,
        }
      }),
    ]);

    return {
      period: { start, end },
      redemptions: {
        total: redemptions._count,
        pointsSpent: redemptions._sum.pointsSpent || 0,
        valueReceived: redemptions._sum.valueReceived || 0,
      },
      earnings: {
        total: transactions._count,
        pointsEarned: transactions._sum.points || 0,
        totalAmount: transactions._sum.amount || 0,
      },
      activeOffers: offers,
    };
  }
}
