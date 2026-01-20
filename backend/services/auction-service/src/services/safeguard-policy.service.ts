// ============================================================
// PHASE 6.1 — Safeguard Policy Engine
//
// CRITICAL RULES:
// ❌ DO NOT:
// - Ban users automatically
// - Freeze wallets
// - Release or revoke escrow
// - Confiscate funds
// - Modify ledger entries
// - Invalidate bids automatically
// - Apply permanent restrictions
// - Bypass Phase 6.0 enforcement flow
//
// ✅ MUST:
// - Be reversible automatically
// - Be time-bound
// - Apply proportional limits
// - Be transparent to the user
// - Be logged immutably
// - Never block access completely
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum SafeguardType {
  BID_RATE_LIMIT = 'BID_RATE_LIMIT',
  BID_COOLDOWN = 'BID_COOLDOWN',
  MAX_BID_AMOUNT_CAP = 'MAX_BID_AMOUNT_CAP',
  DAILY_BID_COUNT_CAP = 'DAILY_BID_COUNT_CAP',
  AUCTION_JOIN_LIMIT = 'AUCTION_JOIN_LIMIT',
  TEMP_BID_DELAY = 'TEMP_BID_DELAY',
  MAX_CONCURRENT_BIDDERS_SOFT_CAP = 'MAX_CONCURRENT_BIDDERS_SOFT_CAP',
  EXTENSION_THROTTLE = 'EXTENSION_THROTTLE',
  LISTING_CREATION_RATE_LIMIT = 'LISTING_CREATION_RATE_LIMIT',
  MAX_ACTIVE_AUCTIONS_SOFT_CAP = 'MAX_ACTIVE_AUCTIONS_SOFT_CAP',
}

export enum SafeguardScope {
  USER = 'USER',
  AUCTION = 'AUCTION',
  SELLER = 'SELLER',
}

export enum SafeguardPolicyVersion {
  V1_INITIAL = 'V1_INITIAL',
  V2_REFINED = 'V2_REFINED',
}

export interface SafeguardPolicyRule {
  name: string;
  type: SafeguardType;
  scope: SafeguardScope;
  triggerCondition: (signals: any) => boolean;
  durationMinutes: number;
  parameters: Record<string, any>;
  escalateAfterRepeats?: number;
  confidence: number;
}

export interface SafeguardRecommendation {
  shouldActivate: boolean;
  safeguardType: SafeguardType;
  scope: SafeguardScope;
  durationMinutes: number;
  parameters: Record<string, any>;
  reason: string;
  confidence: number;
  policyVersion: SafeguardPolicyVersion;
  escalationRisk: boolean;
}

// ============================================================
// SAFEGUARD POLICY ENGINE
// ============================================================

export class SafeguardPolicyEngine {
  // ============================================================
  // EVALUATE SAFEGUARD POLICY
  // Signals → Policy → Recommendation (AUTO-EXECUTED)
  // ============================================================
  async evaluatePolicy(
    targetUserId?: number,
    targetAuctionId?: number,
    targetSellerId?: number,
    signals?: Record<string, any>,
    policyVersion: SafeguardPolicyVersion = SafeguardPolicyVersion.V1_INITIAL
  ): Promise<SafeguardRecommendation | null> {
    // Get policy rules for version
    const policy = await this.getPolicyRules(policyVersion);

    // Evaluate signals against policy
    const recommendation = this.evaluateSignals(
      signals || {},
      policy,
      policyVersion,
      targetUserId,
      targetAuctionId,
      targetSellerId
    );

    // Log policy evaluation (APPEND-ONLY)
    if (recommendation) {
      await prisma.safeguardPolicyEvaluationLog.create({
        data: {
          targetUserId,
          targetAuctionId,
          targetSellerId,
          policyVersion,
          signals: signals || {},
          recommendation: {
            safeguardType: recommendation.safeguardType,
            scope: recommendation.scope,
            durationMinutes: recommendation.durationMinutes,
            confidence: recommendation.confidence,
          },
          metadata: {
            evaluatedAt: new Date().toISOString(),
          },
        },
      });
    }

    return recommendation;
  }

  // ============================================================
  // GET POLICY RULES
  // Returns immutable policy rules for a version
  // ============================================================
  private async getPolicyRules(version: SafeguardPolicyVersion): Promise<SafeguardPolicyRule[]> {
    if (version === SafeguardPolicyVersion.V1_INITIAL) {
      return [
        {
          name: 'HIGH_BID_VELOCITY',
          type: SafeguardType.BID_RATE_LIMIT,
          scope: SafeguardScope.USER,
          triggerCondition: (signals: any) => signals.bidVelocity > 10,
          durationMinutes: 15,
          parameters: {
            maxBidsPerMinute: 2,
            reason: 'High bid velocity detected',
          },
          escalateAfterRepeats: 3,
          confidence: 0.7,
        },
        {
          name: 'EXTREME_BID_VELOCITY',
          type: SafeguardType.BID_COOLDOWN,
          scope: SafeguardScope.USER,
          triggerCondition: (signals: any) => signals.bidVelocity > 20,
          durationMinutes: 30,
          parameters: {
            cooldownSeconds: 10,
            reason: 'Extreme bid velocity detected',
          },
          escalateAfterRepeats: 2,
          confidence: 0.85,
        },
        {
          name: 'RAPID_AUCTION_JOINING',
          type: SafeguardType.AUCTION_JOIN_LIMIT,
          scope: SafeguardScope.USER,
          triggerCondition: (signals: any) => signals.auctionJoinVelocity > 5,
          durationMinutes: 20,
          parameters: {
            maxAuctionsPerHour: 10,
            reason: 'Rapid auction joining detected',
          },
          escalateAfterRepeats: 2,
          confidence: 0.65,
        },
        {
          name: 'AUCTION_STRESS_DETECTED',
          type: SafeguardType.TEMP_BID_DELAY,
          scope: SafeguardScope.AUCTION,
          triggerCondition: (signals: any) =>
            signals.bidCountInWindow > 50 && signals.auctionDurationMinutes < 5,
          durationMinutes: 10,
          parameters: {
            delayMs: 500,
            reason: 'Auction stress detected',
          },
          escalateAfterRepeats: 1,
          confidence: 0.75,
        },
        {
          name: 'SELLER_LISTING_SPAM',
          type: SafeguardType.LISTING_CREATION_RATE_LIMIT,
          scope: SafeguardScope.SELLER,
          triggerCondition: (signals: any) => signals.listingCreationVelocity > 5,
          durationMinutes: 60,
          parameters: {
            maxListingsPerHour: 3,
            reason: 'Rapid listing creation detected',
          },
          escalateAfterRepeats: 2,
          confidence: 0.7,
        },
        {
          name: 'SUSPICIOUS_BID_PATTERN',
          type: SafeguardType.MAX_BID_AMOUNT_CAP,
          scope: SafeguardScope.USER,
          triggerCondition: (signals: any) =>
            signals.fraudSignalCount > 2 && signals.trustScore < 50,
          durationMinutes: 45,
          parameters: {
            maxBidAmount: 1000,
            reason: 'Suspicious bid pattern detected',
          },
          escalateAfterRepeats: 1,
          confidence: 0.8,
        },
      ];
    }

    throw new Error(`Unknown policy version: ${version}`);
  }

  // ============================================================
  // EVALUATE SIGNALS
  // Apply policy rules to signals
  // ============================================================
  private evaluateSignals(
    signals: Record<string, any>,
    policy: SafeguardPolicyRule[],
    version: SafeguardPolicyVersion,
    targetUserId?: number,
    targetAuctionId?: number,
    targetSellerId?: number
  ): SafeguardRecommendation | null {
    // Find matching rules
    const matchedRules = policy.filter((rule) => rule.triggerCondition(signals));

    if (matchedRules.length === 0) {
      return null;
    }

    // Select highest confidence rule
    const selectedRule = matchedRules.reduce((prev, curr) =>
      curr.confidence > prev.confidence ? curr : prev
    );

    // Check escalation risk
    const escalationRisk =
      matchedRules.length > 1 || (selectedRule.escalateAfterRepeats && selectedRule.escalateAfterRepeats <= 2);

    return {
      shouldActivate: true,
      safeguardType: selectedRule.type,
      scope: selectedRule.scope,
      durationMinutes: selectedRule.durationMinutes,
      parameters: selectedRule.parameters,
      reason: selectedRule.parameters.reason || selectedRule.name,
      confidence: selectedRule.confidence,
      policyVersion: version,
      escalationRisk,
    };
  }

  // ============================================================
  // CREATE POLICY VERSION
  // Store new immutable policy version
  // ============================================================
  async createPolicyVersion(
    version: SafeguardPolicyVersion,
    rules: any,
    description: string
  ): Promise<any> {
    return await prisma.safeguardPolicyVersion.create({
      data: {
        version,
        rules,
        description,
        isActive: true,
        metadata: {
          createdAt: new Date().toISOString(),
        },
      },
    });
  }

  // ============================================================
  // GET ACTIVE POLICY VERSION
  // ============================================================
  async getActivePolicyVersion(): Promise<any> {
    return await prisma.safeguardPolicyVersion.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================================
  // GET POLICY EVALUATION HISTORY
  // ============================================================
  async getPolicyEvaluationHistory(
    targetUserId?: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<any> {
    const where: any = {};
    if (targetUserId) where.targetUserId = targetUserId;

    const [evaluations, total] = await Promise.all([
      prisma.safeguardPolicyEvaluationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.safeguardPolicyEvaluationLog.count({ where }),
    ]);

    return {
      evaluations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + evaluations.length < total,
      },
    };
  }
}

// Export singleton instance
export const safeguardPolicyEngine = new SafeguardPolicyEngine();
