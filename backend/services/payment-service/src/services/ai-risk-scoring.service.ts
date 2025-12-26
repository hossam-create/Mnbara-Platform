import { RiskInput, RiskLevel } from '../types/ai-trust-risk.types';

export interface FraudSignal {
  type: string;
  severity: number;
  description: string;
}

export class AIRiskScoringService {
  /**
   * Analyze transaction for fraud indicators
   */
  static analyzeTransaction(input: {
    amount: number;
    userId: string;
    cardBin?: string;
    ipAddress?: string;
    shippingAddress: string;
    billingAddress: string;
    history: {
      totalOrders: number;
      refundRate: number;
      failedAttempts: number;
    }
  }) {
    const signals: FraudSignal[] = [];
    let score = 0;

    // 1. Check Address Mismatch
    if (input.shippingAddress !== input.billingAddress) {
      signals.push({
        type: 'ADDRESS_MISMATCH',
        severity: 0.3,
        description: 'Shipping and billing addresses do not match.'
      });
      score += 0.3;
    }

    // 2. Velocity Check (Simplified for now)
    if (input.history.failedAttempts > 3) {
      signals.push({
        type: 'HIGH_FAILURE_RATE',
        severity: 0.6,
        description: 'Multiple failed payment attempts detected recently.'
      });
      score += 0.6;
    }

    // 3. New Account High Value
    if (input.history.totalOrders === 0 && input.amount > 500) {
      signals.push({
        type: 'NEW_USER_HIGH_VALUE',
        severity: 0.5,
        description: 'First-time user attempting a high-value purchase.'
      });
      score += 0.5;
    }

    // 4. Refund Rate Check
    if (input.history.refundRate > 0.2) {
      signals.push({
        type: 'HIGH_REFUND_HISTORY',
        severity: 0.4,
        description: 'User has a history of high refund rates (>20%).'
      });
      score += 0.4;
    }

    const level = this.mapScoreToLevel(score);

    return {
      score: Math.min(1, score),
      level,
      signals,
      isApproved: score < 0.7,
      recommendation: score >= 0.7 ? 'MANUAL_REVIEW' : 'APPROVE'
    };
  }

  private static mapScoreToLevel(score: number): RiskLevel {
    if (score < 0.3) return RiskLevel.LOW;
    if (score < 0.6) return RiskLevel.MEDIUM;
    if (score < 0.9) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }
}
