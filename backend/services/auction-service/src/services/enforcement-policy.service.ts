// ============================================================
// PHASE 6.0 — Enforcement Policy Service
//
// CRITICAL RULES:
// - Policies are VERSIONED and IMMUTABLE
// - Policies RECOMMEND actions, do NOT execute
// - Evidence aggregation from analytics signals
// - Policy evaluation is deterministic and auditable
// - Policies are stored as append-only records
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export enum PolicyVersion {
  V1_INITIAL = 'V1_INITIAL',
  V2_REFINED = 'V2_REFINED',
}

export interface PolicyEvaluationRequest {
  targetUserId?: number;
  targetAuctionId?: number;
  targetSellerId?: number;
  signals: Record<string, any>;
  policyVersion?: PolicyVersion;
}

export interface PolicyRecommendation {
  recommendedAction: string;
  tier: string;
  confidence: number;
  reasoning: string;
  evidence: Record<string, any>;
  policyVersion: PolicyVersion;
}

// ============================================================
// ENFORCEMENT POLICY SERVICE
// ============================================================

export class EnforcementPolicyService {
  // ============================================================
  // EVALUATE POLICY
  // Signals → Policy → Recommendation (NOT execution)
  // ============================================================
  async evaluatePolicy(
    params: PolicyEvaluationRequest
  ): Promise<PolicyRecommendation> {
    const policyVersion = params.policyVersion || PolicyVersion.V1_INITIAL;

    // Get policy rules for version
    const policy = await this.getPolicyRules(policyVersion);

    // Evaluate signals against policy
    const recommendation = this.evaluateSignals(
      params.signals,
      policy,
      policyVersion
    );

    // Log policy evaluation (APPEND-ONLY)
    await prisma.enforcementPolicyEvaluationLog.create({
      data: {
        targetUserId: params.targetUserId,
        targetAuctionId: params.targetAuctionId,
        targetSellerId: params.targetSellerId,
        policyVersion,
        signals: params.signals,
        recommendation: {
          recommendedAction: recommendation.recommendedAction,
          tier: recommendation.tier,
          confidence: recommendation.confidence,
        },
        metadata: {
          evaluatedAt: new Date().toISOString(),
        },
      },
    });

    return recommendation;
  }

  // ============================================================
  // GET POLICY RULES
  // Returns immutable policy rules for a version
  // ============================================================
  private async getPolicyRules(version: PolicyVersion): Promise<any> {
    // In production, these would be stored in database as immutable records
    // For now, return hardcoded rules

    if (version === PolicyVersion.V1_INITIAL) {
      return {
        version: PolicyVersion.V1_INITIAL,
        rules: [
          {
            name: 'HIGH_BID_VELOCITY',
            condition: (signals: any) => signals.bidVelocity > 10,
            action: 'BID_THROTTLE',
            tier: 'TIER_1_SOFT',
            confidence: 0.7,
          },
          {
            name: 'EXTREME_BID_VELOCITY',
            condition: (signals: any) => signals.bidVelocity > 20,
            action: 'TEMP_SUSPENSION',
            tier: 'TIER_2_TEMPORARY',
            confidence: 0.85,
          },
          {
            name: 'REPEATED_FRAUD_SIGNALS',
            condition: (signals: any) =>
              signals.fraudSignalCount > 3 && signals.trustScore < 30,
            action: 'TEMP_SUSPENSION',
            tier: 'TIER_2_TEMPORARY',
            confidence: 0.8,
          },
          {
            name: 'CRITICAL_FRAUD_PATTERN',
            condition: (signals: any) =>
              signals.fraudSignalCount > 5 && signals.trustScore < 20,
            action: 'AUCTION_PARTICIPATION_BLOCK',
            tier: 'TIER_3_SEVERE',
            confidence: 0.9,
          },
          {
            name: 'SELLER_ABUSE_PATTERN',
            condition: (signals: any) =>
              signals.sellerDisputeRate > 0.5 && signals.auctionsCompleted > 10,
            action: 'SELLER_REVIEW_FLAG',
            tier: 'TIER_2_TEMPORARY',
            confidence: 0.75,
          },
          {
            name: 'CRITICAL_SELLER_ABUSE',
            condition: (signals: any) =>
              signals.sellerDisputeRate > 0.7 && signals.auctionsCompleted > 20,
            action: 'AUTO_RELIST_DISABLE',
            tier: 'TIER_3_SEVERE',
            confidence: 0.85,
          },
        ],
      };
    }

    throw new Error(`Unknown policy version: ${version}`);
  }

  // ============================================================
  // EVALUATE SIGNALS
  // Apply policy rules to signals
  // ============================================================
  private evaluateSignals(
    signals: Record<string, any>,
    policy: any,
    version: PolicyVersion
  ): PolicyRecommendation {
    // Find matching rules
    const matchedRules = policy.rules.filter((rule: any) =>
      rule.condition(signals)
    );

    if (matchedRules.length === 0) {
      return {
        recommendedAction: 'NO_ACTION',
        tier: 'NONE',
        confidence: 1.0,
        reasoning: 'No policy rules matched the provided signals',
        evidence: signals,
        policyVersion: version,
      };
    }

    // Select highest confidence rule
    const selectedRule = matchedRules.reduce((prev: any, curr: any) =>
      curr.confidence > prev.confidence ? curr : prev
    );

    return {
      recommendedAction: selectedRule.action,
      tier: selectedRule.tier,
      confidence: selectedRule.confidence,
      reasoning: `Policy rule "${selectedRule.name}" matched with confidence ${selectedRule.confidence}`,
      evidence: signals,
      policyVersion: version,
    };
  }

  // ============================================================
  // CREATE POLICY VERSION
  // Store new immutable policy version
  // ============================================================
  async createPolicyVersion(
    version: PolicyVersion,
    rules: any,
    description: string
  ): Promise<any> {
    return await prisma.enforcementPolicyVersion.create({
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
    return await prisma.enforcementPolicyVersion.findFirst({
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
      prisma.enforcementPolicyEvaluationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.enforcementPolicyEvaluationLog.count({ where }),
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
export const enforcementPolicyService = new EnforcementPolicyService();
