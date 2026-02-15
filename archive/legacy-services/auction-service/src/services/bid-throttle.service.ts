// ============================================================
// PHASE 5.4 — Anti-Fraud Bid Throttling Service
// 
// CRITICAL RULES:
// ❌ DO NOT:
// - Auto-insert fake/system bids
// - Modify or delete existing bids
// - Change bid ordering
// - Reject valid bids silently
// - Affect reserve price logic
// - Touch ledger or escrow
// - Trust frontend signals
// 
// ✅ MUST:
// - Treat all bids as immutable once accepted
// - Apply throttling BEFORE bid acceptance
// - Log every throttling decision (append-only)
// - Allow legitimate competitive bidding
// ============================================================

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Enums
export enum ThrottleDecision {
  ALLOW = 'ALLOW',
  SOFT_BLOCK = 'SOFT_BLOCK',
  HARD_BLOCK = 'HARD_BLOCK',
}

export enum ThrottleReason {
  RATE_LIMIT = 'RATE_LIMIT',
  VELOCITY = 'VELOCITY',
  SELF_OUTBID = 'SELF_OUTBID',
  PATTERN = 'PATTERN',
  NONE = 'NONE',
}

// Type for Prisma transaction client
type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

// ============================================================
// INTERFACES
// ============================================================

export interface ThrottleConfig {
  // Rate limiting: max bids per time window
  maxBidsPerWindow: number;
  windowSizeMs: number;

  // Velocity: max bids per minute on auction
  maxAuctionVelocity: number; // bids per minute

  // Cooldown: progressive delays
  softBlockDurationMs: number; // First violation
  hardBlockDurationMs: number; // Repeated violations

  // Self-outbidding: detect when user outbids themselves
  allowSelfOutbid: boolean; // Allow user to outbid their own bid
}

export interface ThrottleCheckParams {
  auctionId: number;
  bidderId: number;
  bidAmount: number;
  ipAddress?: string;
}

export interface ThrottleResult {
  decision: ThrottleDecision;
  reason: ThrottleReason;
  message: string;
  blockUntil?: Date;
  metadata: {
    timeSinceLastBid?: number;
    bidCountInWindow?: number;
    auctionVelocity?: number;
  };
}

// ============================================================
// BID THROTTLE SERVICE
// ============================================================

export class BidThrottleService {
  private config: ThrottleConfig;

  constructor(config?: Partial<ThrottleConfig>) {
    this.config = {
      maxBidsPerWindow: config?.maxBidsPerWindow ?? 5,
      windowSizeMs: config?.windowSizeMs ?? 60 * 1000, // 1 minute
      maxAuctionVelocity: config?.maxAuctionVelocity ?? 20, // 20 bids/min
      softBlockDurationMs: config?.softBlockDurationMs ?? 5 * 1000, // 5 seconds
      hardBlockDurationMs: config?.hardBlockDurationMs ?? 30 * 1000, // 30 seconds
      allowSelfOutbid: config?.allowSelfOutbid ?? true,
    };
  }

  // ============================================================
  // CHECK THROTTLE
  // Evaluate if bid should be throttled
  // ============================================================
  async checkThrottle(params: ThrottleCheckParams): Promise<ThrottleResult> {
    const { auctionId, bidderId, bidAmount } = params;

    // 1. Get or create throttle state
    let state = await prisma.bidThrottleState.findUnique({
      where: {
        auctionId_bidderId: { auctionId, bidderId },
      },
    });

    if (!state) {
      state = await prisma.bidThrottleState.create({
        data: {
          auctionId,
          bidderId,
          bidCountInWindow: 0,
        },
      });
    }

    // 2. Check hard block (most restrictive)
    if (state.hardBlockUntil && state.hardBlockUntil > new Date()) {
      const result: ThrottleResult = {
        decision: ThrottleDecision.HARD_BLOCK,
        reason: ThrottleReason.RATE_LIMIT,
        message: 'Bid rejected: Hard throttle active. Please wait before bidding again.',
        blockUntil: state.hardBlockUntil,
        metadata: {},
      };

      // Log the decision
      await this.logThrottleDecision(auctionId, bidderId, result);

      return result;
    }

    // 3. Check soft block
    if (state.softBlockUntil && state.softBlockUntil > new Date()) {
      const result: ThrottleResult = {
        decision: ThrottleDecision.SOFT_BLOCK,
        reason: ThrottleReason.RATE_LIMIT,
        message: 'Bid accepted but throttled. Please wait before next bid.',
        blockUntil: state.softBlockUntil,
        metadata: {},
      };

      // Log the decision
      await this.logThrottleDecision(auctionId, bidderId, result);

      return result;
    }

    // 4. Check rate limit (bids per window)
    const rateCheckResult = await this.checkRateLimit(auctionId, bidderId, state);
    if (rateCheckResult.decision !== ThrottleDecision.ALLOW) {
      await this.logThrottleDecision(auctionId, bidderId, rateCheckResult);
      return rateCheckResult;
    }

    // 5. Check auction velocity
    const velocityCheckResult = await this.checkAuctionVelocity(auctionId, bidderId);
    if (velocityCheckResult.decision !== ThrottleDecision.ALLOW) {
      await this.logThrottleDecision(auctionId, bidderId, velocityCheckResult);
      return velocityCheckResult;
    }

    // 6. Check self-outbidding pattern
    const selfOutbidResult = await this.checkSelfOutbidding(auctionId, bidderId, bidAmount);
    if (selfOutbidResult.decision !== ThrottleDecision.ALLOW) {
      await this.logThrottleDecision(auctionId, bidderId, selfOutbidResult);
      return selfOutbidResult;
    }

    // 7. All checks passed - ALLOW
    const result: ThrottleResult = {
      decision: ThrottleDecision.ALLOW,
      reason: ThrottleReason.NONE,
      message: 'Bid accepted',
      metadata: {
        timeSinceLastBid: state.lastBidAt ? Date.now() - state.lastBidAt.getTime() : undefined,
        bidCountInWindow: state.bidCountInWindow,
      },
    };

    await this.logThrottleDecision(auctionId, bidderId, result);

    return result;
  }

  // ============================================================
  // CHECK RATE LIMIT
  // Max bids per time window
  // ============================================================
  private async checkRateLimit(
    auctionId: number,
    bidderId: number,
    state: any
  ): Promise<ThrottleResult> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - this.config.windowSizeMs);

    // Count bids in window
    const bidCount = await prisma.bid.count({
      where: {
        listingId: auctionId,
        bidderId,
        createdAt: { gte: windowStart },
      },
    });

    // Check if exceeds limit
    if (bidCount >= this.config.maxBidsPerWindow) {
      // Apply soft block
      const softBlockUntil = new Date(now.getTime() + this.config.softBlockDurationMs);

      await prisma.bidThrottleState.update({
        where: { auctionId_bidderId: { auctionId, bidderId } },
        data: { softBlockUntil },
      });

      return {
        decision: ThrottleDecision.SOFT_BLOCK,
        reason: ThrottleReason.RATE_LIMIT,
        message: `Rate limit exceeded: ${bidCount} bids in ${this.config.windowSizeMs / 1000}s window`,
        blockUntil: softBlockUntil,
        metadata: {
          bidCountInWindow: bidCount,
        },
      };
    }

    return {
      decision: ThrottleDecision.ALLOW,
      reason: ThrottleReason.NONE,
      message: 'Rate limit check passed',
      metadata: { bidCountInWindow: bidCount },
    };
  }

  // ============================================================
  // CHECK AUCTION VELOCITY
  // Detect rapid-fire bidding across auction
  // ============================================================
  private async checkAuctionVelocity(auctionId: number, bidderId: number): Promise<ThrottleResult> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    // Count bids in last minute
    const bidCount = await prisma.bid.count({
      where: {
        listingId: auctionId,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    const velocity = bidCount; // bids per minute

    if (velocity > this.config.maxAuctionVelocity) {
      // Auction has too many bids - apply hard block
      const hardBlockUntil = new Date(now.getTime() + this.config.hardBlockDurationMs);

      await prisma.bidThrottleState.update({
        where: { auctionId_bidderId: { auctionId, bidderId } },
        data: { hardBlockUntil },
      });

      return {
        decision: ThrottleDecision.HARD_BLOCK,
        reason: ThrottleReason.VELOCITY,
        message: `Auction velocity too high: ${velocity} bids/min (limit: ${this.config.maxAuctionVelocity})`,
        blockUntil: hardBlockUntil,
        metadata: {
          auctionVelocity: velocity,
        },
      };
    }

    return {
      decision: ThrottleDecision.ALLOW,
      reason: ThrottleReason.NONE,
      message: 'Auction velocity check passed',
      metadata: { auctionVelocity: velocity },
    };
  }

  // ============================================================
  // CHECK SELF-OUTBIDDING
  // Detect user outbidding their own bids
  // ============================================================
  private async checkSelfOutbidding(auctionId: number, bidderId: number, bidAmount: number): Promise<ThrottleResult> {
    if (this.config.allowSelfOutbid) {
      return {
        decision: ThrottleDecision.ALLOW,
        reason: ThrottleReason.NONE,
        message: 'Self-outbidding allowed',
        metadata: {},
      };
    }

    // Get user's previous bids
    const previousBids = await prisma.bid.findMany({
      where: {
        listingId: auctionId,
        bidderId,
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    if (previousBids.length === 0) {
      return {
        decision: ThrottleDecision.ALLOW,
        reason: ThrottleReason.NONE,
        message: 'No previous bids',
        metadata: {},
      };
    }

    const lastBid = previousBids[0];
    const lastBidAmount = Number(lastBid.amount);

    // Check if new bid is higher than last bid (self-outbidding)
    if (bidAmount > lastBidAmount) {
      // Apply soft block for self-outbidding pattern
      const now = new Date();
      const softBlockUntil = new Date(now.getTime() + this.config.softBlockDurationMs);

      await prisma.bidThrottleState.update({
        where: { auctionId_bidderId: { auctionId, bidderId } },
        data: { softBlockUntil },
      });

      return {
        decision: ThrottleDecision.SOFT_BLOCK,
        reason: ThrottleReason.SELF_OUTBID,
        message: 'Self-outbidding detected. Please wait before bidding again.',
        blockUntil: softBlockUntil,
        metadata: {
          lastBidAmount,
          newBidAmount: bidAmount,
        },
      };
    }

    return {
      decision: ThrottleDecision.ALLOW,
      reason: ThrottleReason.NONE,
      message: 'Self-outbidding check passed',
      metadata: {},
    };
  }

  // ============================================================
  // LOG THROTTLE DECISION
  // APPEND-ONLY audit trail
  // ============================================================
  private async logThrottleDecision(auctionId: number, bidderId: number, result: ThrottleResult): Promise<void> {
    await prisma.bidThrottleLog.create({
      data: {
        auctionId,
        bidderId,
        decision: result.decision,
        reason: result.reason,
        timeSinceLastBid: result.metadata.timeSinceLastBid,
        bidCountInWindow: result.metadata.bidCountInWindow,
        auctionVelocity: result.metadata.auctionVelocity,
        metadata: {
          message: result.message,
          blockUntil: result.blockUntil?.toISOString(),
        },
      },
    });
  }

  // ============================================================
  // UPDATE THROTTLE STATE
  // Called after successful bid acceptance
  // ============================================================
  async updateThrottleState(auctionId: number, bidderId: number): Promise<void> {
    const now = new Date();

    await prisma.bidThrottleState.upsert({
      where: {
        auctionId_bidderId: { auctionId, bidderId },
      },
      create: {
        auctionId,
        bidderId,
        lastBidAt: now,
        bidCountInWindow: 1,
      },
      update: {
        lastBidAt: now,
        bidCountInWindow: { increment: 1 },
        updatedAt: now,
      },
    });
  }

  // ============================================================
  // GET THROTTLE LOGS
  // For audit and monitoring
  // ============================================================
  async getThrottleLogs(auctionId: number, limit: number = 100) {
    return prisma.bidThrottleLog.findMany({
      where: { auctionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ============================================================
  // GET THROTTLE STATS
  // For monitoring and analytics
  // ============================================================
  async getThrottleStats(auctionId: number) {
    const logs = await prisma.bidThrottleLog.findMany({
      where: { auctionId },
    });

    const stats = {
      totalChecks: logs.length,
      allowed: logs.filter((l) => l.decision === ThrottleDecision.ALLOW).length,
      softBlocked: logs.filter((l) => l.decision === ThrottleDecision.SOFT_BLOCK).length,
      hardBlocked: logs.filter((l) => l.decision === ThrottleDecision.HARD_BLOCK).length,
      byReason: {
        rateLimit: logs.filter((l) => l.reason === ThrottleReason.RATE_LIMIT).length,
        velocity: logs.filter((l) => l.reason === ThrottleReason.VELOCITY).length,
        selfOutbid: logs.filter((l) => l.reason === ThrottleReason.SELF_OUTBID).length,
        pattern: logs.filter((l) => l.reason === ThrottleReason.PATTERN).length,
      },
    };

    return stats;
  }

  // ============================================================
  // RESET THROTTLE STATE
  // For testing or manual override
  // ============================================================
  async resetThrottleState(auctionId: number, bidderId: number): Promise<void> {
    await prisma.bidThrottleState.deleteMany({
      where: {
        auctionId,
        bidderId,
      },
    });
  }
}

// Export singleton instance
export const bidThrottleService = new BidThrottleService();
