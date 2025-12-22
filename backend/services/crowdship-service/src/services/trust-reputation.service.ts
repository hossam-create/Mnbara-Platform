/**
 * Trust & Reputation Service
 * ADVISORY ONLY - No Score Mutation
 *
 * HARD RULES:
 * - No enforcement
 * - No auto-ranking
 * - No hidden penalties
 * - Deterministic only
 * - Read-only snapshots
 */

import { createHash, randomUUID } from 'crypto';
import { getFeatureFlags } from '../config/feature-flags';
import {
  TrustLevel,
  TrustSignalType,
  ReputationSnapshot,
  TrustSignal,
  MarketTrustScore,
  TrustDecayIndicator,
  CrossMarketPortability,
  MarketPortabilityStatus,
  TrustHistoryResult,
  TrustHistoryEntry,
  TrustTrend,
  TrustExplanation,
  TrustDisclaimer,
  TrustAuditEntry,
  TrustReputationHealth,
} from '../types/trust-reputation.types';

// ===========================================
// Constants
// ===========================================

const MAX_AUDIT_LOG = 500;
const TRUST_LEVELS: TrustLevel[] = ['NEW', 'BASIC', 'VERIFIED', 'TRUSTED', 'ELITE'];
const TRUST_THRESHOLDS = { NEW: 0, BASIC: 20, VERIFIED: 40, TRUSTED: 60, ELITE: 80 };

// ===========================================
// In-Memory Stores (Simulated Data)
// ===========================================

const auditLog: TrustAuditEntry[] = [];

// Simulated user trust data (in production, this would come from DB)
const simulatedUserData: Map<string, { score: number; signals: TrustSignal[] }> = new Map();

// ===========================================
// Disclaimer Generator
// ===========================================

function generateDisclaimer(): TrustDisclaimer {
  return {
    type: 'TRUST_ADVISORY',
    text: 'This is advisory information only. Trust scores are read-only snapshots. No enforcement, auto-ranking, or hidden penalties are applied. All signals are visible.',
    isAdvisoryOnly: true,
    noEnforcement: true,
    noAutoRanking: true,
    noHiddenPenalties: true,
    allSignalsVisible: true,
    timestamp: new Date().toISOString(),
  };
}

// ===========================================
// Trust Reputation Service
// ===========================================

export class TrustReputationService {
  /**
   * Get reputation snapshot for a user
   * READ-ONLY - No score mutation
   */
  getReputationSnapshot(userId: string, requestId?: string): ReputationSnapshot | null {
    const flags = getFeatureFlags();
    const reqId = requestId || `trust_${randomUUID()}`;

    if (flags.EMERGENCY_DISABLE_ALL || !flags.TRUST_REPUTATION_ENABLED) {
      return null;
    }

    // Get or generate simulated user data
    const userData = this.getOrCreateUserData(userId);
    const trustLevel = this.calculateTrustLevel(userData.score);

    const snapshot: ReputationSnapshot = {
      snapshotId: `snap_${randomUUID().slice(0, 8)}`,
      userId,
      timestamp: new Date().toISOString(),
      trustLevel,
      trustScore: userData.score,
      signals: userData.signals,
      marketScores: this.generateMarketScores(userId, userData.score),
      decayIndicators: this.generateDecayIndicators(userData),
      portabilityStatus: this.calculatePortability(userId, userData.score),
      explanation: this.generateExplanation(userData, trustLevel),
      disclaimer: generateDisclaimer(),
    };

    // Audit log
    this.logAudit({
      id: `audit_${Date.now()}`,
      snapshotId: snapshot.snapshotId,
      userId,
      action: 'SNAPSHOT_CREATED',
      timestamp: new Date().toISOString(),
    });

    return snapshot;
  }

  /**
   * Get trust history for a user
   * READ-ONLY - Time-based snapshots
   */
  getTrustHistory(
    userId: string,
    days: number = 30,
    requestId?: string
  ): TrustHistoryResult | null {
    const flags = getFeatureFlags();
    const reqId = requestId || `hist_${randomUUID()}`;

    if (flags.EMERGENCY_DISABLE_ALL || !flags.TRUST_REPUTATION_ENABLED) {
      return null;
    }

    const userData = this.getOrCreateUserData(userId);
    const history = this.generateHistoricalSnapshots(userId, userData, days);
    const trend = this.calculateTrend(history);

    // Audit log
    this.logAudit({
      id: `audit_${Date.now()}`,
      snapshotId: reqId,
      userId,
      action: 'HISTORY_QUERIED',
      timestamp: new Date().toISOString(),
      metadata: { days },
    });

    return {
      userId,
      requestId: reqId,
      timestamp: new Date().toISOString(),
      history,
      trend,
      disclaimer: generateDisclaimer(),
    };
  }

  /**
   * Check cross-market trust portability
   * READ-ONLY - No enforcement
   */
  checkPortability(
    userId: string,
    sourceMarket: string,
    targetMarkets: string[],
    requestId?: string
  ): CrossMarketPortability | null {
    const flags = getFeatureFlags();

    if (flags.EMERGENCY_DISABLE_ALL || !flags.TRUST_REPUTATION_ENABLED) {
      return null;
    }

    const userData = this.getOrCreateUserData(userId);

    const targetStatuses: MarketPortabilityStatus[] = targetMarkets.map((market) => {
      const isPortable = userData.score >= 40; // Minimum VERIFIED level
      const portabilityPercent = this.calculatePortabilityPercent(
        sourceMarket,
        market,
        userData.score
      );

      return {
        market,
        isPortable,
        portabilityPercent,
        requirements: this.getPortabilityRequirements(market),
        blockers: isPortable ? [] : ['Trust level below VERIFIED'],
      };
    });

    const overallPortable = targetStatuses.some((s) => s.isPortable);
    const avgPortability =
      targetStatuses.reduce((sum, s) => sum + s.portabilityPercent, 0) / targetStatuses.length;

    // Audit log
    this.logAudit({
      id: `audit_${Date.now()}`,
      snapshotId: requestId || `port_${randomUUID()}`,
      userId,
      action: 'PORTABILITY_CHECKED',
      timestamp: new Date().toISOString(),
      metadata: { sourceMarket, targetMarkets },
    });

    return {
      sourceMarket,
      targetMarkets: targetStatuses,
      overallPortable,
      portabilityScore: Math.round(avgPortability),
      explanation: overallPortable
        ? `Trust from ${sourceMarket} can be partially transferred to ${targetStatuses.filter((s) => s.isPortable).length} market(s).`
        : 'Trust level must be VERIFIED or higher for cross-market portability.',
    };
  }

  /**
   * Get service health
   */
  getHealth(): TrustReputationHealth {
    const flags = getFeatureFlags();

    return {
      status: flags.EMERGENCY_DISABLE_ALL
        ? 'disabled'
        : flags.TRUST_REPUTATION_ENABLED
          ? 'healthy'
          : 'degraded',
      timestamp: new Date().toISOString(),
      featureFlags: {
        trustReputationEnabled: flags.TRUST_REPUTATION_ENABLED,
        emergencyDisabled: flags.EMERGENCY_DISABLE_ALL,
      },
      snapshotCount: auditLog.filter((a) => a.action === 'SNAPSHOT_CREATED').length,
      version: '1.0.0',
    };
  }

  /**
   * Get audit log
   */
  getAuditLog(userId?: string): TrustAuditEntry[] {
    if (userId) {
      return auditLog.filter((e) => e.userId === userId);
    }
    return [...auditLog];
  }

  // ===========================================
  // Private Helper Methods
  // ===========================================

  private getOrCreateUserData(userId: string): { score: number; signals: TrustSignal[] } {
    if (!simulatedUserData.has(userId)) {
      // Generate deterministic data based on userId hash
      const hash = this.hashString(userId);
      const score = (hash % 80) + 10; // 10-90 range
      const signals = this.generateSignals(userId, score);
      simulatedUserData.set(userId, { score, signals });
    }
    return simulatedUserData.get(userId)!;
  }

  private calculateTrustLevel(score: number): TrustLevel {
    if (score >= TRUST_THRESHOLDS.ELITE) return 'ELITE';
    if (score >= TRUST_THRESHOLDS.TRUSTED) return 'TRUSTED';
    if (score >= TRUST_THRESHOLDS.VERIFIED) return 'VERIFIED';
    if (score >= TRUST_THRESHOLDS.BASIC) return 'BASIC';
    return 'NEW';
  }

  private generateSignals(userId: string, score: number): TrustSignal[] {
    const signals: TrustSignal[] = [];
    const hash = this.hashString(userId);
    const now = new Date();

    // Transaction signals
    const txCount = Math.floor(score / 10);
    for (let i = 0; i < txCount; i++) {
      signals.push({
        id: `sig_tx_${i}`,
        type: 'TRANSACTION_COMPLETED',
        timestamp: new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
        market: i % 2 === 0 ? 'MARKET_0' : 'MARKET_1',
        impact: 'POSITIVE',
        weight: 5,
        description: 'Successfully completed transaction',
        isVisible: true,
      });
    }

    // Review signals
    const reviewCount = Math.floor(score / 15);
    for (let i = 0; i < reviewCount; i++) {
      const isPositive = (hash + i) % 5 !== 0;
      signals.push({
        id: `sig_rev_${i}`,
        type: isPositive ? 'POSITIVE_REVIEW' : 'NEGATIVE_REVIEW',
        timestamp: new Date(now.getTime() - i * 5 * 24 * 60 * 60 * 1000).toISOString(),
        market: 'MARKET_0',
        impact: isPositive ? 'POSITIVE' : 'NEGATIVE',
        weight: isPositive ? 3 : -5,
        description: isPositive ? 'Received positive review' : 'Received negative review',
        isVisible: true,
      });
    }

    // Verification signal
    if (score >= 40) {
      signals.push({
        id: 'sig_verify',
        type: 'VERIFICATION_COMPLETED',
        timestamp: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        market: 'GLOBAL',
        impact: 'POSITIVE',
        weight: 10,
        description: 'Identity verification completed',
        isVisible: true,
      });
    }

    return signals;
  }

  private generateMarketScores(userId: string, baseScore: number): MarketTrustScore[] {
    const hash = this.hashString(userId);
    const now = new Date();

    return [
      {
        market: 'MARKET_0',
        trustLevel: this.calculateTrustLevel(baseScore),
        trustScore: baseScore,
        transactionCount: Math.floor(baseScore / 10),
        positiveRate: 0.85 + (hash % 15) / 100,
        lastActivity: new Date(now.getTime() - (hash % 7) * 24 * 60 * 60 * 1000).toISOString(),
        isPortable: baseScore >= 40,
        portabilityReason: baseScore >= 40 ? undefined : 'Trust level below VERIFIED',
      },
      {
        market: 'MARKET_1',
        trustLevel: this.calculateTrustLevel(Math.max(0, baseScore - 10)),
        trustScore: Math.max(0, baseScore - 10),
        transactionCount: Math.floor((baseScore - 10) / 15),
        positiveRate: 0.80 + (hash % 20) / 100,
        lastActivity: new Date(now.getTime() - (hash % 14) * 24 * 60 * 60 * 1000).toISOString(),
        isPortable: baseScore >= 50,
        portabilityReason: baseScore >= 50 ? undefined : 'Insufficient activity in market',
      },
    ];
  }

  private generateDecayIndicators(userData: { score: number; signals: TrustSignal[] }): TrustDecayIndicator[] {
    const indicators: TrustDecayIndicator[] = [];
    const lastSignal = userData.signals[0];
    const daysSinceActivity = lastSignal
      ? Math.floor((Date.now() - new Date(lastSignal.timestamp).getTime()) / (24 * 60 * 60 * 1000))
      : 30;

    // Inactivity decay
    if (daysSinceActivity > 7) {
      indicators.push({
        id: 'decay_inactivity',
        type: 'INACTIVITY',
        currentValue: daysSinceActivity,
        thresholdValue: 30,
        decayRate: 0.5,
        daysUntilDecay: Math.max(0, 30 - daysSinceActivity),
        explanation: `No activity for ${daysSinceActivity} days. Trust may decay after 30 days of inactivity.`,
        preventionTip: 'Complete a transaction or respond to messages to maintain trust.',
      });
    }

    // Cancellation rate
    const cancellations = userData.signals.filter((s) => s.type === 'CANCELLATION').length;
    const totalTx = userData.signals.filter((s) => s.type === 'TRANSACTION_COMPLETED').length;
    const cancellationRate = totalTx > 0 ? (cancellations / totalTx) * 100 : 0;

    if (cancellationRate > 5) {
      indicators.push({
        id: 'decay_cancellation',
        type: 'CANCELLATION_RATE_INCREASE',
        currentValue: cancellationRate,
        thresholdValue: 10,
        decayRate: 1,
        daysUntilDecay: cancellationRate >= 10 ? 0 : 14,
        explanation: `Cancellation rate is ${cancellationRate.toFixed(1)}%. Trust decays at 10%.`,
        preventionTip: 'Complete transactions you commit to.',
      });
    }

    return indicators;
  }

  private calculatePortability(userId: string, score: number): CrossMarketPortability {
    const targetMarkets = ['MARKET_1', 'MARKET_2'];
    const statuses: MarketPortabilityStatus[] = targetMarkets.map((market) => ({
      market,
      isPortable: score >= 40,
      portabilityPercent: this.calculatePortabilityPercent('MARKET_0', market, score),
      requirements: this.getPortabilityRequirements(market),
      blockers: score >= 40 ? [] : ['Trust level below VERIFIED'],
    }));

    return {
      sourceMarket: 'MARKET_0',
      targetMarkets: statuses,
      overallPortable: score >= 40,
      portabilityScore: Math.round(score * 0.7),
      explanation: score >= 40
        ? 'Your trust is portable to other markets at a reduced rate.'
        : 'Reach VERIFIED level to enable cross-market trust portability.',
    };
  }

  private calculatePortabilityPercent(source: string, target: string, score: number): number {
    if (score < 40) return 0;
    // Same region = 80%, different region = 50%
    const sameRegion = source.includes('0') === target.includes('0');
    const basePercent = sameRegion ? 80 : 50;
    return Math.min(100, basePercent + Math.floor(score / 10));
  }

  private getPortabilityRequirements(market: string): string[] {
    return [
      'Minimum VERIFIED trust level',
      'At least 5 completed transactions',
      'No active disputes',
      'Account age > 30 days',
    ];
  }

  private generateExplanation(
    userData: { score: number; signals: TrustSignal[] },
    trustLevel: TrustLevel
  ): TrustExplanation {
    const positiveSignals = userData.signals.filter((s) => s.impact === 'POSITIVE');
    const negativeSignals = userData.signals.filter((s) => s.impact === 'NEGATIVE');

    const positiveFactors = [
      { factor: 'Completed transactions', impact: `${positiveSignals.filter((s) => s.type === 'TRANSACTION_COMPLETED').length} successful`, weight: 5 },
      { factor: 'Positive reviews', impact: `${positiveSignals.filter((s) => s.type === 'POSITIVE_REVIEW').length} received`, weight: 3 },
    ];

    const negativeFactors = negativeSignals.length > 0
      ? [{ factor: 'Negative reviews', impact: `${negativeSignals.length} received`, weight: -5 }]
      : [];

    const nextLevel = TRUST_LEVELS[TRUST_LEVELS.indexOf(trustLevel) + 1];
    const nextThreshold = nextLevel ? TRUST_THRESHOLDS[nextLevel] : 100;

    return {
      summary: `Your trust level is ${trustLevel} with a score of ${userData.score}/100. ${positiveSignals.length} positive signals, ${negativeSignals.length} negative signals.`,
      positiveFactors,
      negativeFactors,
      improvementTips: [
        'Complete more transactions successfully',
        'Respond to messages promptly',
        'Resolve any disputes amicably',
        'Keep your profile information up to date',
      ],
      nextLevelRequirements: nextLevel
        ? [
            {
              requirement: `Reach ${nextThreshold} trust score`,
              currentProgress: userData.score,
              targetValue: nextThreshold,
              progressPercent: Math.round((userData.score / nextThreshold) * 100),
            },
          ]
        : undefined,
    };
  }

  private generateHistoricalSnapshots(
    userId: string,
    userData: { score: number; signals: TrustSignal[] },
    days: number
  ): TrustHistoryEntry[] {
    const history: TrustHistoryEntry[] = [];
    const now = new Date();
    const hash = this.hashString(userId);

    // Generate daily snapshots with slight variations
    for (let i = 0; i < Math.min(days, 30); i++) {
      const dayOffset = i * 24 * 60 * 60 * 1000;
      const variation = ((hash + i) % 5) - 2; // -2 to +2
      const score = Math.max(0, Math.min(100, userData.score - i * 0.5 + variation));
      const prevScore = i > 0 ? history[i - 1].trustScore : score;

      history.push({
        snapshotId: `hist_${i}`,
        timestamp: new Date(now.getTime() - dayOffset).toISOString(),
        trustLevel: this.calculateTrustLevel(score),
        trustScore: Math.round(score),
        changeFromPrevious: Math.round(score - prevScore),
        changeReason: score > prevScore ? 'Positive activity' : score < prevScore ? 'Inactivity decay' : 'No change',
        signals: userData.signals.filter(
          (s) => new Date(s.timestamp).getTime() >= now.getTime() - dayOffset - 24 * 60 * 60 * 1000
        ),
      });
    }

    return history.reverse(); // Oldest first
  }

  private calculateTrend(history: TrustHistoryEntry[]): TrustTrend {
    if (history.length < 2) {
      return {
        direction: 'STABLE',
        changePercent: 0,
        periodDays: history.length,
        explanation: 'Insufficient history for trend analysis.',
      };
    }

    const oldest = history[0].trustScore;
    const newest = history[history.length - 1].trustScore;
    const change = newest - oldest;
    const changePercent = oldest > 0 ? (change / oldest) * 100 : 0;

    let direction: 'IMPROVING' | 'STABLE' | 'DECLINING';
    if (changePercent > 5) direction = 'IMPROVING';
    else if (changePercent < -5) direction = 'DECLINING';
    else direction = 'STABLE';

    return {
      direction,
      changePercent: Math.round(changePercent * 10) / 10,
      periodDays: history.length,
      explanation: `Trust score ${direction === 'IMPROVING' ? 'increased' : direction === 'DECLINING' ? 'decreased' : 'remained stable'} by ${Math.abs(changePercent).toFixed(1)}% over ${history.length} days.`,
    };
  }

  private hashString(input: string): number {
    const hash = createHash('sha256').update(input).digest('hex');
    return parseInt(hash.slice(0, 8), 16);
  }

  private logAudit(entry: TrustAuditEntry): void {
    auditLog.push(entry);
    if (auditLog.length > MAX_AUDIT_LOG) {
      auditLog.shift();
    }
  }

  /**
   * Reset for testing
   */
  static reset(): void {
    auditLog.length = 0;
    simulatedUserData.clear();
  }
}

export const trustReputationService = new TrustReputationService();
