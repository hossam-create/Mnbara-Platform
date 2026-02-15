// ============================================================
// PHASE 5.7 — Auction Analytics & Trust Signals Service
//
// CRITICAL RULES:
// ❌ DO NOT:
// - Modify bids, auctions, escrow, or settlement
// - Create or update ledger entries
// - Influence auction outcomes
// - Auto-flag users without evidence
// - Trust frontend calculations
// - Expose private financial data
// - Leak reserve prices or internal thresholds
//
// ✅ MUST:
// - Be 100% read-only
// - Derive metrics from immutable data
// - Be reproducible and auditable
// - Separate ANALYTICS from ENFORCEMENT
// - Never block actions automatically
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Enums
export enum TrustTier {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum SellerBadge {
  NEW = 'NEW',
  VERIFIED = 'VERIFIED',
  WATCHLISTED = 'WATCHLISTED',
}

// ============================================================
// INTERFACES
// ============================================================

export interface AuctionAnalytics {
  auctionId: number;
  totalBidsCount: number;
  uniqueBiddersCount: number;
  bidVelocity: number; // bids per minute
  priceProgression: {
    startingBid: number;
    highestBid: number;
    priceIncrease: number;
    priceIncreasePercent: number;
  };
  competitivenessScore: number; // 0-100
  reserveMet: boolean;
  auctionDurationMinutes: number;
  metadata?: Record<string, any>;
}

export interface BidderTrustSignals {
  bidderId: number;
  participationCount: number;
  winCount: number;
  lossCount: number;
  winLossRatio: number;
  bidRetractionRate: number; // 0-100
  invalidatedBidsCount: number;
  paymentCompletionRate: number; // 0-100
  disputeInvolvementRate: number; // 0-100
  trustTier: TrustTier;
  confidenceScore: number; // 0-100
  metadata?: Record<string, any>;
}

export interface SellerTrustSignals {
  sellerId: number;
  auctionsCompleted: number;
  successfulSettlementsPercent: number; // 0-100
  autoRelistFrequency: number; // 0-100
  disputeRate: number; // 0-100
  avgTimeToPaymentCompletionMinutes: number;
  reliabilityScore: number; // 0-100
  badgeEligibility: SellerBadge;
  metadata?: Record<string, any>;
}

export interface MarketHealthMetrics {
  totalAuctions: number;
  avgBidsPerAuction: number;
  noSaleRate: number; // 0-100
  reserveFailureRate: number; // 0-100
  appealFrequency: number; // 0-100
  fraudSignalDensity: number; // 0-100 (signal-only)
  avgTimeToSettlementMinutes: number;
  metadata?: Record<string, any>;
}

export interface RiskSignal {
  signalType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  affectedEntities: {
    type: 'BIDDER' | 'SELLER' | 'AUCTION';
    id: number;
  }[];
  evidence: Record<string, any>;
  createdAt: Date;
}

// ============================================================
// ANALYTICS SERVICE (READ-ONLY)
// ============================================================

export class AnalyticsService {
  // ============================================================
  // AUCTION ANALYTICS
  // Derive metrics from immutable auction data
  // ============================================================
  async getAuctionAnalytics(auctionId: number): Promise<AuctionAnalytics> {
    // 1. Get auction with bids (READ-ONLY)
    const auction = await prisma.listing.findUnique({
      where: { id: auctionId },
      include: {
        bids: {
          where: { status: { notIn: ['CANCELLED', 'INVALIDATED'] } },
          select: {
            id: true,
            amount: true,
            bidderId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!auction) {
      throw new Error('Auction not found');
    }

    // 2. Calculate metrics (READ-ONLY, no modifications)
    const totalBidsCount = auction.bids.length;
    const uniqueBiddersCount = new Set(auction.bids.map((b) => b.bidderId)).size;

    // 3. Calculate bid velocity
    let bidVelocity = 0;
    if (auction.bids.length > 1 && auction.auctionStartsAt && auction.auctionEndsAt) {
      const durationMs = auction.auctionEndsAt.getTime() - auction.auctionStartsAt.getTime();
      const durationMinutes = durationMs / (1000 * 60);
      bidVelocity = durationMinutes > 0 ? totalBidsCount / durationMinutes : 0;
    }

    // 4. Calculate price progression
    const startingBid = Number(auction.startingBid || 0);
    const highestBid = Number(auction.currentBid || startingBid);
    const priceIncrease = highestBid - startingBid;
    const priceIncreasePercent = startingBid > 0 ? (priceIncrease / startingBid) * 100 : 0;

    // 5. Calculate competitiveness score (0-100)
    // Based on: unique bidders, bid velocity, price increase
    let competitivenessScore = 0;
    if (uniqueBiddersCount >= 5) competitivenessScore += 30;
    else if (uniqueBiddersCount >= 3) competitivenessScore += 20;
    else if (uniqueBiddersCount >= 1) competitivenessScore += 10;

    if (bidVelocity >= 1) competitivenessScore += 30;
    else if (bidVelocity >= 0.5) competitivenessScore += 20;
    else if (bidVelocity > 0) competitivenessScore += 10;

    if (priceIncreasePercent >= 50) competitivenessScore += 40;
    else if (priceIncreasePercent >= 20) competitivenessScore += 25;
    else if (priceIncreasePercent > 0) competitivenessScore += 10;

    competitivenessScore = Math.min(100, competitivenessScore);

    // 6. Calculate auction duration
    let auctionDurationMinutes = 0;
    if (auction.auctionStartsAt && auction.auctionEndsAt) {
      const durationMs = auction.auctionEndsAt.getTime() - auction.auctionStartsAt.getTime();
      auctionDurationMinutes = durationMs / (1000 * 60);
    }

    return {
      auctionId,
      totalBidsCount,
      uniqueBiddersCount,
      bidVelocity: Math.round(bidVelocity * 100) / 100,
      priceProgression: {
        startingBid,
        highestBid,
        priceIncrease,
        priceIncreasePercent: Math.round(priceIncreasePercent * 100) / 100,
      },
      competitivenessScore,
      reserveMet: auction.reserveMet ?? false,
      auctionDurationMinutes: Math.round(auctionDurationMinutes),
      metadata: {
        auctionStatus: auction.status,
        winnerId: auction.winnerId,
        finalPrice: auction.finalPrice?.toString(),
      },
    };
  }

  // ============================================================
  // BIDDER TRUST SIGNALS
  // Derive trust metrics from bidder history (READ-ONLY)
  // ============================================================
  async getBidderTrustSignals(bidderId: number): Promise<BidderTrustSignals> {
    // 1. Get bidder's bids (READ-ONLY)
    const bids = await prisma.bid.findMany({
      where: { bidderId },
      select: {
        id: true,
        status: true,
        listing: {
          select: {
            winnerId: true,
            status: true,
          },
        },
      },
    });

    // 2. Get bidder's disputes (READ-ONLY)
    const disputes = await prisma.auctionDispute.findMany({
      where: {
        OR: [
          { bid: { bidderId } },
          { auction: { winnerId: bidderId } },
        ],
      },
      select: { id: true },
    });

    // 3. Get bidder's invalidated bids (READ-ONLY)
    const invalidatedBidsCount = bids.filter((b) => b.status === 'INVALIDATED').length;

    // 4. Calculate win/loss ratio
    const winCount = bids.filter((b) => b.listing.winnerId === bidderId).length;
    const lossCount = bids.filter((b) => b.listing.winnerId !== bidderId && b.status !== 'INVALIDATED').length;
    const winLossRatio = lossCount > 0 ? winCount / lossCount : winCount > 0 ? 1 : 0;

    // 5. Calculate bid retraction rate (bids that were outbid)
    const outbidCount = bids.filter((b) => b.status === 'OUTBID').length;
    const bidRetractionRate = bids.length > 0 ? (outbidCount / bids.length) * 100 : 0;

    // 6. Calculate payment completion rate (won auctions that settled)
    const wonAuctions = bids.filter((b) => b.listing.winnerId === bidderId);
    const settledWonAuctions = wonAuctions.filter((b) => b.listing.status === 'SETTLED').length;
    const paymentCompletionRate = wonAuctions.length > 0 ? (settledWonAuctions / wonAuctions.length) * 100 : 0;

    // 7. Calculate dispute involvement rate
    const disputeInvolvementRate = bids.length > 0 ? (disputes.length / bids.length) * 100 : 0;

    // 8. Calculate trust tier (0-100 confidence score)
    let confidenceScore = 50; // Base score

    // Participation bonus
    if (bids.length >= 50) confidenceScore += 20;
    else if (bids.length >= 20) confidenceScore += 15;
    else if (bids.length >= 5) confidenceScore += 10;

    // Win ratio bonus
    if (winLossRatio >= 0.5) confidenceScore += 15;
    else if (winLossRatio >= 0.2) confidenceScore += 10;

    // Payment completion bonus
    if (paymentCompletionRate >= 95) confidenceScore += 15;
    else if (paymentCompletionRate >= 80) confidenceScore += 10;

    // Penalty for invalidated bids
    if (invalidatedBidsCount > 0) confidenceScore -= Math.min(20, invalidatedBidsCount * 5);

    // Penalty for disputes
    if (disputeInvolvementRate > 10) confidenceScore -= 15;
    else if (disputeInvolvementRate > 5) confidenceScore -= 10;

    confidenceScore = Math.max(0, Math.min(100, confidenceScore));

    // 9. Determine trust tier
    let trustTier: TrustTier;
    if (confidenceScore >= 75) {
      trustTier = TrustTier.HIGH;
    } else if (confidenceScore >= 50) {
      trustTier = TrustTier.MEDIUM;
    } else {
      trustTier = TrustTier.LOW;
    }

    return {
      bidderId,
      participationCount: bids.length,
      winCount,
      lossCount,
      winLossRatio: Math.round(winLossRatio * 100) / 100,
      bidRetractionRate: Math.round(bidRetractionRate * 100) / 100,
      invalidatedBidsCount,
      paymentCompletionRate: Math.round(paymentCompletionRate * 100) / 100,
      disputeInvolvementRate: Math.round(disputeInvolvementRate * 100) / 100,
      trustTier,
      confidenceScore,
      metadata: {
        calculatedAt: new Date().toISOString(),
      },
    };
  }

  // ============================================================
  // SELLER TRUST SIGNALS
  // Derive trust metrics from seller history (READ-ONLY)
  // ============================================================
  async getSellerTrustSignals(sellerId: number): Promise<SellerTrustSignals> {
    // 1. Get seller's auctions (READ-ONLY)
    const auctions = await prisma.listing.findMany({
      where: { sellerId, isAuction: true },
      select: {
        id: true,
        status: true,
        winnerId: true,
        finalPrice: true,
        auctionEndsAt: true,
        createdAt: true,
      },
    });

    // 2. Get seller's disputes (READ-ONLY)
    const disputes = await prisma.auctionDispute.findMany({
      where: { auction: { sellerId } },
      select: { id: true },
    });

    // 3. Get seller's relist history (READ-ONLY)
    const relists = await prisma.relistAuditLog.findMany({
      where: { sellerId },
      select: { id: true },
    });

    // 4. Calculate metrics
    const auctionsCompleted = auctions.length;
    const settledAuctions = auctions.filter((a) => a.status === 'SETTLED').length;
    const successfulSettlementsPercent = auctionsCompleted > 0 ? (settledAuctions / auctionsCompleted) * 100 : 0;

    // 5. Calculate auto-relist frequency
    const autoRelistFrequency = auctionsCompleted > 0 ? (relists.length / auctionsCompleted) * 100 : 0;

    // 6. Calculate dispute rate
    const disputeRate = auctionsCompleted > 0 ? (disputes.length / auctionsCompleted) * 100 : 0;

    // 7. Calculate average time to payment completion
    let avgTimeToPaymentCompletionMinutes = 0;
    const settledAuctionsWithWinner = auctions.filter((a) => a.winnerId && a.status === 'SETTLED');
    if (settledAuctionsWithWinner.length > 0) {
      const totalMinutes = settledAuctionsWithWinner.reduce((sum, a) => {
        if (a.auctionEndsAt) {
          const durationMs = a.auctionEndsAt.getTime() - a.createdAt.getTime();
          return sum + durationMs / (1000 * 60);
        }
        return sum;
      }, 0);
      avgTimeToPaymentCompletionMinutes = totalMinutes / settledAuctionsWithWinner.length;
    }

    // 8. Calculate reliability score (0-100)
    let reliabilityScore = 50; // Base score

    // Completion bonus
    if (successfulSettlementsPercent >= 95) reliabilityScore += 25;
    else if (successfulSettlementsPercent >= 80) reliabilityScore += 15;
    else if (successfulSettlementsPercent >= 60) reliabilityScore += 10;

    // Volume bonus
    if (auctionsCompleted >= 100) reliabilityScore += 15;
    else if (auctionsCompleted >= 50) reliabilityScore += 10;
    else if (auctionsCompleted >= 10) reliabilityScore += 5;

    // Penalty for relists
    if (autoRelistFrequency > 30) reliabilityScore -= 15;
    else if (autoRelistFrequency > 10) reliabilityScore -= 10;

    // Penalty for disputes
    if (disputeRate > 10) reliabilityScore -= 15;
    else if (disputeRate > 5) reliabilityScore -= 10;

    reliabilityScore = Math.max(0, Math.min(100, reliabilityScore));

    // 9. Determine badge eligibility
    let badgeEligibility: SellerBadge;
    if (auctionsCompleted < 5) {
      badgeEligibility = SellerBadge.NEW;
    } else if (reliabilityScore >= 80 && disputeRate < 5) {
      badgeEligibility = SellerBadge.VERIFIED;
    } else if (reliabilityScore < 40 || disputeRate > 15) {
      badgeEligibility = SellerBadge.WATCHLISTED;
    } else {
      badgeEligibility = SellerBadge.NEW;
    }

    return {
      sellerId,
      auctionsCompleted,
      successfulSettlementsPercent: Math.round(successfulSettlementsPercent * 100) / 100,
      autoRelistFrequency: Math.round(autoRelistFrequency * 100) / 100,
      disputeRate: Math.round(disputeRate * 100) / 100,
      avgTimeToPaymentCompletionMinutes: Math.round(avgTimeToPaymentCompletionMinutes),
      reliabilityScore,
      badgeEligibility,
      metadata: {
        calculatedAt: new Date().toISOString(),
      },
    };
  }

  // ============================================================
  // MARKET HEALTH METRICS
  // Aggregate market-wide analytics (READ-ONLY)
  // ============================================================
  async getMarketHealthMetrics(): Promise<MarketHealthMetrics> {
    // 1. Get all auctions (READ-ONLY)
    const auctions = await prisma.listing.findMany({
      where: { isAuction: true },
      select: {
        id: true,
        status: true,
        reserveMet: true,
        auctionEndsAt: true,
        createdAt: true,
        _count: {
          select: { bids: true },
        },
      },
    });

    // 2. Get all appeals (READ-ONLY)
    const appeals = await prisma.auctionAppeal.findMany({
      select: { id: true },
    });

    // 3. Calculate metrics
    const totalAuctions = auctions.length;
    const totalBids = auctions.reduce((sum, a) => sum + a._count.bids, 0);
    const avgBidsPerAuction = totalAuctions > 0 ? totalBids / totalAuctions : 0;

    // 4. Calculate no-sale rate
    const noSaleAuctions = auctions.filter(
      (a) => a.status === 'ENDED_UNMET_RESERVE' || a.status === 'ENDED_AWAITING_SETTLEMENT'
    ).length;
    const noSaleRate = totalAuctions > 0 ? (noSaleAuctions / totalAuctions) * 100 : 0;

    // 5. Calculate reserve failure rate
    const reserveFailedAuctions = auctions.filter((a) => a.reserveMet === false).length;
    const reserveFailureRate = totalAuctions > 0 ? (reserveFailedAuctions / totalAuctions) * 100 : 0;

    // 6. Calculate appeal frequency
    const appealFrequency = totalAuctions > 0 ? (appeals.length / totalAuctions) * 100 : 0;

    // 7. Calculate fraud signal density (signal-only, no enforcement)
    // This is a placeholder for fraud detection signals
    let fraudSignalDensity = 0;
    const throttledBids = await prisma.bidThrottleLog.count({
      where: { decision: 'HARD_BLOCK' },
    });
    const invalidatedBids = await prisma.bid.count({
      where: { status: 'INVALIDATED' },
    });
    if (totalBids > 0) {
      fraudSignalDensity = ((throttledBids + invalidatedBids) / totalBids) * 100;
    }

    // 8. Calculate average time to settlement
    let avgTimeToSettlementMinutes = 0;
    const settledAuctions = auctions.filter((a) => a.status === 'SETTLED');
    if (settledAuctions.length > 0) {
      const totalMinutes = settledAuctions.reduce((sum, a) => {
        if (a.auctionEndsAt) {
          const durationMs = a.auctionEndsAt.getTime() - a.createdAt.getTime();
          return sum + durationMs / (1000 * 60);
        }
        return sum;
      }, 0);
      avgTimeToSettlementMinutes = totalMinutes / settledAuctions.length;
    }

    return {
      totalAuctions,
      avgBidsPerAuction: Math.round(avgBidsPerAuction * 100) / 100,
      noSaleRate: Math.round(noSaleRate * 100) / 100,
      reserveFailureRate: Math.round(reserveFailureRate * 100) / 100,
      appealFrequency: Math.round(appealFrequency * 100) / 100,
      fraudSignalDensity: Math.round(fraudSignalDensity * 100) / 100,
      avgTimeToSettlementMinutes: Math.round(avgTimeToSettlementMinutes),
      metadata: {
        calculatedAt: new Date().toISOString(),
        totalBids,
        totalAppeals: appeals.length,
      },
    };
  }

  // ============================================================
  // RISK SIGNALS (SIGNAL-ONLY, NO ENFORCEMENT)
  // Detect suspicious patterns for admin review
  // ============================================================
  async getRiskSignals(): Promise<RiskSignal[]> {
    const signals: RiskSignal[] = [];

    // 1. High bid retraction rate (signal-only)
    const bidders = await prisma.bid.findMany({
      select: { bidderId: true },
      distinct: ['bidderId'],
    });

    for (const { bidderId } of bidders) {
      const trustSignals = await this.getBidderTrustSignals(bidderId);
      if (trustSignals.bidRetractionRate > 70) {
        signals.push({
          signalType: 'HIGH_BID_RETRACTION_RATE',
          severity: 'MEDIUM',
          description: `Bidder ${bidderId} has high bid retraction rate: ${trustSignals.bidRetractionRate}%`,
          affectedEntities: [{ type: 'BIDDER', id: bidderId }],
          evidence: {
            bidRetractionRate: trustSignals.bidRetractionRate,
            participationCount: trustSignals.participationCount,
          },
          createdAt: new Date(),
        });
      }
    }

    // 2. High dispute rate (signal-only)
    const sellers = await prisma.listing.findMany({
      select: { sellerId: true },
      distinct: ['sellerId'],
      where: { isAuction: true },
    });

    for (const { sellerId } of sellers) {
      const trustSignals = await this.getSellerTrustSignals(sellerId);
      if (trustSignals.disputeRate > 15) {
        signals.push({
          signalType: 'HIGH_DISPUTE_RATE',
          severity: 'HIGH',
          description: `Seller ${sellerId} has high dispute rate: ${trustSignals.disputeRate}%`,
          affectedEntities: [{ type: 'SELLER', id: sellerId }],
          evidence: {
            disputeRate: trustSignals.disputeRate,
            auctionsCompleted: trustSignals.auctionsCompleted,
          },
          createdAt: new Date(),
        });
      }
    }

    // 3. Unusually high bid velocity (signal-only)
    const auctions = await prisma.listing.findMany({
      where: { isAuction: true },
      include: {
        bids: {
          where: { status: { notIn: ['CANCELLED', 'INVALIDATED'] } },
        },
      },
    });

    for (const auction of auctions) {
      const analytics = await this.getAuctionAnalytics(auction.id);
      if (analytics.bidVelocity > 5) {
        signals.push({
          signalType: 'UNUSUALLY_HIGH_BID_VELOCITY',
          severity: 'LOW',
          description: `Auction ${auction.id} has unusually high bid velocity: ${analytics.bidVelocity} bids/min`,
          affectedEntities: [{ type: 'AUCTION', id: auction.id }],
          evidence: {
            bidVelocity: analytics.bidVelocity,
            totalBidsCount: analytics.totalBidsCount,
          },
          createdAt: new Date(),
        });
      }
    }

    return signals;
  }

  // ============================================================
  // SNAPSHOT CREATION (APPEND-ONLY)
  // Create immutable snapshots for audit trail
  // ============================================================
  async createAuctionAnalyticsSnapshot(auctionId: number): Promise<any> {
    const analytics = await this.getAuctionAnalytics(auctionId);

    return prisma.auctionAnalyticsSnapshot.create({
      data: {
        auctionId,
        totalBidsCount: analytics.totalBidsCount,
        uniqueBiddersCount: analytics.uniqueBiddersCount,
        bidVelocity: analytics.bidVelocity,
        priceProgression: analytics.priceProgression,
        competitivenessScore: analytics.competitivenessScore,
        reserveMet: analytics.reserveMet,
        auctionDurationMinutes: analytics.auctionDurationMinutes,
        metadata: analytics.metadata,
      },
    });
  }

  async createBidderTrustSnapshot(bidderId: number): Promise<any> {
    const trustSignals = await this.getBidderTrustSignals(bidderId);

    return prisma.bidderTrustSnapshot.create({
      data: {
        bidderId,
        participationCount: trustSignals.participationCount,
        winCount: trustSignals.winCount,
        lossCount: trustSignals.lossCount,
        winLossRatio: trustSignals.winLossRatio,
        bidRetractionRate: trustSignals.bidRetractionRate,
        invalidatedBidsCount: trustSignals.invalidatedBidsCount,
        paymentCompletionRate: trustSignals.paymentCompletionRate,
        disputeInvolvementRate: trustSignals.disputeInvolvementRate,
        trustTier: trustSignals.trustTier,
        confidenceScore: trustSignals.confidenceScore,
        metadata: trustSignals.metadata,
      },
    });
  }

  async createSellerTrustSnapshot(sellerId: number): Promise<any> {
    const trustSignals = await this.getSellerTrustSignals(sellerId);

    return prisma.sellerTrustSnapshot.create({
      data: {
        sellerId,
        auctionsCompleted: trustSignals.auctionsCompleted,
        successfulSettlementsPercent: trustSignals.successfulSettlementsPercent,
        autoRelistFrequency: trustSignals.autoRelistFrequency,
        disputeRate: trustSignals.disputeRate,
        avgTimeToPaymentCompletionMinutes: trustSignals.avgTimeToPaymentCompletionMinutes,
        reliabilityScore: trustSignals.reliabilityScore,
        badgeEligibility: trustSignals.badgeEligibility,
        metadata: trustSignals.metadata,
      },
    });
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
