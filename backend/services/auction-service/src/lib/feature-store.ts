/**
 * Feature Store
 * 
 * Calculates and stores features for machine learning and rules engine.
 * Provides real-time feature access with caching.
 */

import { prisma } from './prisma';

// ============================================================
// FEATURE TYPES
// ============================================================

export interface Feature {
  name: string;
  value: number;
  calculatedAt: Date;
  expiresAt: Date;
  version: string;
}

export interface UserFeatures {
  userId: number;
  features: Record<string, Feature>;
  calculatedAt: Date;
}

// ============================================================
// FEATURE DEFINITIONS
// ============================================================

export const FEATURE_DEFINITIONS = {
  // Dispute-related features
  dispute_rate: {
    description: 'Disputes opened / total auctions won (30-day window)',
    window: 30 * 24 * 60 * 60 * 1000, // 30 days
    ttl: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Delivery-related features
  avg_delivery_delay: {
    description: 'Average days between auction end and delivery',
    window: 90 * 24 * 60 * 60 * 1000, // 90 days
    ttl: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Bidding-related features
  bid_velocity: {
    description: 'Bids per hour (24-hour window)',
    window: 24 * 60 * 60 * 1000, // 24 hours
    ttl: 60 * 60 * 1000, // 1 hour
  },

  // Trust-related features
  trust_score: {
    description: 'Current trust score (0-100)',
    window: 0, // Real-time
    ttl: 60 * 60 * 1000, // 1 hour
  },

  // Activity-related features
  auction_participation_rate: {
    description: 'Auctions participated in / total auctions (30-day window)',
    window: 30 * 24 * 60 * 60 * 1000, // 30 days
    ttl: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Success-related features
  win_rate: {
    description: 'Auctions won / auctions participated in (30-day window)',
    window: 30 * 24 * 60 * 60 * 1000, // 30 days
    ttl: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// ============================================================
// FEATURE STORE
// ============================================================

export class FeatureStore {
  private cache: Map<string, UserFeatures> = new Map();

  /**
   * Calculate dispute rate for user
   */
  async calculateDisputeRate(userId: number): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Count disputes opened
    const disputesOpened = await prisma.auctionDispute.count({
      where: {
        bid: {
          bidderId: userId,
        },
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Count total auctions won
    const auctionsWon = await prisma.bid.count({
      where: {
        bidderId: userId,
        status: 'WON',
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    if (auctionsWon === 0) {
      return 0;
    }

    return disputesOpened / auctionsWon;
  }

  /**
   * Calculate average delivery delay for user
   */
  async calculateAvgDeliveryDelay(userId: number): Promise<number> {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Get settled auctions with delivery info
    const settlements = await prisma.bid.findMany({
      where: {
        bidderId: userId,
        status: 'SETTLED',
        createdAt: {
          gte: ninetyDaysAgo,
        },
      },
      select: {
        createdAt: true,
        listing: {
          select: {
            auctionEndsAt: true,
          },
        },
      },
    });

    if (settlements.length === 0) {
      return 0;
    }

    const totalDelay = settlements.reduce((sum: number, settlement: any) => {
      if (!settlement.listing.auctionEndsAt) {
        return sum;
      }

      const delayMs = settlement.createdAt.getTime() - settlement.listing.auctionEndsAt.getTime();
      const delayDays = delayMs / (24 * 60 * 60 * 1000);
      return sum + delayDays;
    }, 0);

    return totalDelay / settlements.length;
  }

  /**
   * Calculate bid velocity for user
   */
  async calculateBidVelocity(userId: number): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Count bids in last 24 hours
    const bidCount = await prisma.bid.count({
      where: {
        bidderId: userId,
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });

    // Return bids per hour
    return bidCount / 24;
  }

  /**
   * Calculate auction participation rate
   */
  async calculateAuctionParticipationRate(userId: number): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Count auctions participated in
    const auctionsParticipated = await prisma.bid.findMany({
      where: {
        bidderId: userId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      distinct: ['listingId'],
    });

    // Count total auctions
    const totalAuctions = await prisma.listing.count({
      where: {
        isAuction: true,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    if (totalAuctions === 0) {
      return 0;
    }

    return auctionsParticipated.length / totalAuctions;
  }

  /**
   * Calculate win rate
   */
  async calculateWinRate(userId: number): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Count auctions won
    const auctionsWon = await prisma.bid.count({
      where: {
        bidderId: userId,
        status: 'WON',
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Count auctions participated in
    const auctionsParticipated = await prisma.bid.findMany({
      where: {
        bidderId: userId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      distinct: ['listingId'],
    });

    if (auctionsParticipated.length === 0) {
      return 0;
    }

    return auctionsWon / auctionsParticipated.length;
  }

  /**
   * Get all features for a user
   */
  async getUserFeatures(userId: number): Promise<UserFeatures> {
    // Check cache first
    const cached = this.cache.get(`user:${userId}`);
    if (cached && cached.calculatedAt.getTime() > Date.now() - 60 * 60 * 1000) {
      return cached;
    }

    // Calculate all features
    const [disputeRate, avgDeliveryDelay, bidVelocity, participationRate, winRate] =
      await Promise.all([
        this.calculateDisputeRate(userId),
        this.calculateAvgDeliveryDelay(userId),
        this.calculateBidVelocity(userId),
        this.calculateAuctionParticipationRate(userId),
        this.calculateWinRate(userId),
      ]);

    const now = new Date();
    const features: UserFeatures = {
      userId,
      features: {
        dispute_rate: {
          name: 'dispute_rate',
          value: disputeRate,
          calculatedAt: now,
          expiresAt: new Date(now.getTime() + FEATURE_DEFINITIONS.dispute_rate.ttl),
          version: '1.0.0',
        },
        avg_delivery_delay: {
          name: 'avg_delivery_delay',
          value: avgDeliveryDelay,
          calculatedAt: now,
          expiresAt: new Date(now.getTime() + FEATURE_DEFINITIONS.avg_delivery_delay.ttl),
          version: '1.0.0',
        },
        bid_velocity: {
          name: 'bid_velocity',
          value: bidVelocity,
          calculatedAt: now,
          expiresAt: new Date(now.getTime() + FEATURE_DEFINITIONS.bid_velocity.ttl),
          version: '1.0.0',
        },
        auction_participation_rate: {
          name: 'auction_participation_rate',
          value: participationRate,
          calculatedAt: now,
          expiresAt: new Date(now.getTime() + FEATURE_DEFINITIONS.auction_participation_rate.ttl),
          version: '1.0.0',
        },
        win_rate: {
          name: 'win_rate',
          value: winRate,
          calculatedAt: now,
          expiresAt: new Date(now.getTime() + FEATURE_DEFINITIONS.win_rate.ttl),
          version: '1.0.0',
        },
      },
      calculatedAt: now,
    };

    // Cache features
    this.cache.set(`user:${userId}`, features);

    return features;
  }

  /**
   * Get a specific feature for a user
   */
  async getUserFeature(userId: number, featureName: string): Promise<Feature | null> {
    const features = await this.getUserFeatures(userId);
    return features.features[featureName] || null;
  }

  /**
   * Invalidate cache for user
   */
  invalidateUserCache(userId: number): void {
    this.cache.delete(`user:${userId}`);
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

let featureStoreInstance: FeatureStore | null = null;

export function getFeatureStore(): FeatureStore {
  if (!featureStoreInstance) {
    featureStoreInstance = new FeatureStore();
  }
  return featureStoreInstance;
}
