/**
 * Risk Assessor Service
 * Deterministic risk assessment for transactions
 * Read-only advisory - NO blocking, NO auto-actions
 */

import {
  RiskAssessment,
  RiskLevel,
  RiskFactor,
  RiskFlag,
  AssessRiskRequest,
  TrustScore,
} from '../types/ai-core.types';

// Risk factor weights
const RISK_WEIGHTS: Record<string, number> = {
  trust_differential: 0.20,
  transaction_amount: 0.20,
  item_category: 0.15,
  velocity: 0.15,
  geographic: 0.10,
  time_pattern: 0.10,
  device_fingerprint: 0.10,
};

// High-risk categories
const HIGH_RISK_CATEGORIES = [
  'electronics',
  'luxury',
  'gift_cards',
  'cryptocurrency',
  'vehicles',
];

// Amount thresholds (in USD equivalent)
const AMOUNT_THRESHOLDS = {
  low: 100,
  medium: 500,
  high: 2000,
  veryHigh: 10000,
};

export interface RiskContext {
  buyerTrust: TrustScore;
  sellerTrust: TrustScore;
  buyerRecentTransactions: number;
  sellerRecentTransactions: number;
  buyerLocation?: { country: string; city: string };
  sellerLocation?: { country: string; city: string };
  transactionTime: Date;
  deviceId?: string;
  isNewDevice?: boolean;
}

export class RiskAssessorService {
  /**
   * Assess transaction risk
   * Deterministic evaluation - same inputs always produce same outputs
   */
  assessRisk(request: AssessRiskRequest, context: RiskContext): RiskAssessment {
    const factors: RiskFactor[] = [];
    const flags: RiskFlag[] = [];

    // Trust differential risk
    const trustRisk = this.assessTrustDifferential(context.buyerTrust, context.sellerTrust);
    factors.push(trustRisk.factor);
    if (trustRisk.flag) flags.push(trustRisk.flag);

    // Transaction amount risk
    const amountRisk = this.assessAmountRisk(request.amount, request.currency);
    factors.push(amountRisk.factor);
    if (amountRisk.flag) flags.push(amountRisk.flag);

    // Item category risk
    const categoryRisk = this.assessCategoryRisk(request.itemDetails.category);
    factors.push(categoryRisk.factor);
    if (categoryRisk.flag) flags.push(categoryRisk.flag);

    // Velocity risk (transaction frequency)
    const velocityRisk = this.assessVelocityRisk(
      context.buyerRecentTransactions,
      context.sellerRecentTransactions
    );
    factors.push(velocityRisk.factor);
    if (velocityRisk.flag) flags.push(velocityRisk.flag);

    // Geographic risk
    const geoRisk = this.assessGeographicRisk(context.buyerLocation, context.sellerLocation);
    factors.push(geoRisk.factor);
    if (geoRisk.flag) flags.push(geoRisk.flag);

    // Time pattern risk
    const timeRisk = this.assessTimePatternRisk(context.transactionTime);
    factors.push(timeRisk.factor);
    if (timeRisk.flag) flags.push(timeRisk.flag);

    // Device risk
    const deviceRisk = this.assessDeviceRisk(context.deviceId, context.isNewDevice);
    factors.push(deviceRisk.factor);
    if (deviceRisk.flag) flags.push(deviceRisk.flag);

    // Calculate overall risk score
    const riskScore = this.calculateOverallRisk(factors);
    const overallRisk = this.getRiskLevel(riskScore);

    return {
      transactionId: request.transactionId,
      overallRisk,
      riskScore,
      factors,
      flags,
      assessedAt: new Date().toISOString(),
    };
  }

  private assessTrustDifferential(
    buyerTrust: TrustScore,
    sellerTrust: TrustScore
  ): { factor: RiskFactor; flag?: RiskFlag } {
    const minTrust = Math.min(buyerTrust.score, sellerTrust.score);
    const trustGap = Math.abs(buyerTrust.score - sellerTrust.score);

    let score = 0;
    let flag: RiskFlag | undefined;

    if (minTrust < 20) {
      score = 90;
      flag = {
        code: 'LOW_TRUST_PARTY',
        severity: RiskLevel.HIGH,
        message: 'One party has restricted trust level',
        recommendation: 'Require additional verification before proceeding',
      };
    } else if (minTrust < 40) {
      score = 60;
    } else if (trustGap > 40) {
      score = 50;
      flag = {
        code: 'TRUST_GAP',
        severity: RiskLevel.MEDIUM,
        message: 'Significant trust gap between parties',
        recommendation: 'Consider escrow protection',
      };
    } else {
      score = Math.max(0, 30 - minTrust * 0.3);
    }

    return {
      factor: {
        category: 'trust_differential',
        score,
        weight: RISK_WEIGHTS.trust_differential,
        description: `Trust scores: Buyer ${buyerTrust.score}, Seller ${sellerTrust.score}`,
      },
      flag,
    };
  }

  private assessAmountRisk(
    amount: number,
    currency: string
  ): { factor: RiskFactor; flag?: RiskFlag } {
    // Normalize to USD (simplified)
    const usdAmount = this.normalizeToUSD(amount, currency);

    let score = 0;
    let flag: RiskFlag | undefined;

    if (usdAmount >= AMOUNT_THRESHOLDS.veryHigh) {
      score = 80;
      flag = {
        code: 'VERY_HIGH_VALUE',
        severity: RiskLevel.HIGH,
        message: `Transaction amount exceeds $${AMOUNT_THRESHOLDS.veryHigh}`,
        recommendation: 'Require enhanced verification and escrow',
      };
    } else if (usdAmount >= AMOUNT_THRESHOLDS.high) {
      score = 60;
      flag = {
        code: 'HIGH_VALUE',
        severity: RiskLevel.MEDIUM,
        message: `Transaction amount exceeds $${AMOUNT_THRESHOLDS.high}`,
        recommendation: 'Consider escrow protection',
      };
    } else if (usdAmount >= AMOUNT_THRESHOLDS.medium) {
      score = 40;
    } else if (usdAmount >= AMOUNT_THRESHOLDS.low) {
      score = 20;
    } else {
      score = 10;
    }

    return {
      factor: {
        category: 'transaction_amount',
        score,
        weight: RISK_WEIGHTS.transaction_amount,
        description: `Amount: ${amount} ${currency} (~$${usdAmount} USD)`,
      },
      flag,
    };
  }

  private assessCategoryRisk(category: string): { factor: RiskFactor; flag?: RiskFlag } {
    const normalizedCategory = category.toLowerCase();
    const isHighRisk = HIGH_RISK_CATEGORIES.some((c) => normalizedCategory.includes(c));

    const score = isHighRisk ? 70 : 20;
    let flag: RiskFlag | undefined;

    if (isHighRisk) {
      flag = {
        code: 'HIGH_RISK_CATEGORY',
        severity: RiskLevel.MEDIUM,
        message: `Item category "${category}" is flagged as high-risk`,
        recommendation: 'Apply enhanced fraud checks',
      };
    }

    return {
      factor: {
        category: 'item_category',
        score,
        weight: RISK_WEIGHTS.item_category,
        description: `Category: ${category}`,
      },
      flag,
    };
  }

  private assessVelocityRisk(
    buyerRecent: number,
    sellerRecent: number
  ): { factor: RiskFactor; flag?: RiskFlag } {
    const maxRecent = Math.max(buyerRecent, sellerRecent);

    let score = 0;
    let flag: RiskFlag | undefined;

    if (maxRecent > 20) {
      score = 80;
      flag = {
        code: 'HIGH_VELOCITY',
        severity: RiskLevel.HIGH,
        message: 'Unusually high transaction frequency detected',
        recommendation: 'Review for potential fraud or money laundering',
      };
    } else if (maxRecent > 10) {
      score = 50;
      flag = {
        code: 'ELEVATED_VELOCITY',
        severity: RiskLevel.MEDIUM,
        message: 'Elevated transaction frequency',
        recommendation: 'Monitor for patterns',
      };
    } else if (maxRecent > 5) {
      score = 30;
    } else {
      score = 10;
    }

    return {
      factor: {
        category: 'velocity',
        score,
        weight: RISK_WEIGHTS.velocity,
        description: `Recent transactions: Buyer ${buyerRecent}, Seller ${sellerRecent}`,
      },
      flag,
    };
  }

  private assessGeographicRisk(
    buyerLocation?: { country: string; city: string },
    sellerLocation?: { country: string; city: string }
  ): { factor: RiskFactor; flag?: RiskFlag } {
    if (!buyerLocation || !sellerLocation) {
      return {
        factor: {
          category: 'geographic',
          score: 30,
          weight: RISK_WEIGHTS.geographic,
          description: 'Location data unavailable',
        },
      };
    }

    const sameCountry = buyerLocation.country === sellerLocation.country;
    let score = sameCountry ? 10 : 40;
    let flag: RiskFlag | undefined;

    // High-risk countries (simplified list)
    const highRiskCountries = ['XX', 'YY', 'ZZ']; // Placeholder
    if (
      highRiskCountries.includes(buyerLocation.country) ||
      highRiskCountries.includes(sellerLocation.country)
    ) {
      score = 70;
      flag = {
        code: 'HIGH_RISK_GEOGRAPHY',
        severity: RiskLevel.MEDIUM,
        message: 'Transaction involves high-risk geography',
        recommendation: 'Apply enhanced due diligence',
      };
    }

    return {
      factor: {
        category: 'geographic',
        score,
        weight: RISK_WEIGHTS.geographic,
        description: `Buyer: ${buyerLocation.country}, Seller: ${sellerLocation.country}`,
      },
      flag,
    };
  }

  private assessTimePatternRisk(transactionTime: Date): { factor: RiskFactor; flag?: RiskFlag } {
    const hour = transactionTime.getUTCHours();
    const isOffHours = hour < 6 || hour > 22;

    const score = isOffHours ? 40 : 10;
    let flag: RiskFlag | undefined;

    if (isOffHours) {
      flag = {
        code: 'OFF_HOURS_TRANSACTION',
        severity: RiskLevel.LOW,
        message: 'Transaction initiated during off-peak hours',
        recommendation: 'No action required, informational only',
      };
    }

    return {
      factor: {
        category: 'time_pattern',
        score,
        weight: RISK_WEIGHTS.time_pattern,
        description: `Transaction time: ${transactionTime.toISOString()}`,
      },
      flag,
    };
  }

  private assessDeviceRisk(
    deviceId?: string,
    isNewDevice?: boolean
  ): { factor: RiskFactor; flag?: RiskFlag } {
    if (!deviceId) {
      return {
        factor: {
          category: 'device_fingerprint',
          score: 50,
          weight: RISK_WEIGHTS.device_fingerprint,
          description: 'Device fingerprint unavailable',
        },
        flag: {
          code: 'NO_DEVICE_ID',
          severity: RiskLevel.LOW,
          message: 'Device identification unavailable',
          recommendation: 'Consider requiring device verification',
        },
      };
    }

    const score = isNewDevice ? 50 : 10;
    let flag: RiskFlag | undefined;

    if (isNewDevice) {
      flag = {
        code: 'NEW_DEVICE',
        severity: RiskLevel.LOW,
        message: 'Transaction from new/unrecognized device',
        recommendation: 'Consider additional authentication',
      };
    }

    return {
      factor: {
        category: 'device_fingerprint',
        score,
        weight: RISK_WEIGHTS.device_fingerprint,
        description: `Device: ${deviceId?.substring(0, 8)}..., New: ${isNewDevice}`,
      },
      flag,
    };
  }

  private calculateOverallRisk(factors: RiskFactor[]): number {
    const weightedSum = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
    return Math.round(Math.min(100, Math.max(0, weightedSum)));
  }

  private getRiskLevel(score: number): RiskLevel {
    if (score >= 80) return RiskLevel.CRITICAL;
    if (score >= 60) return RiskLevel.HIGH;
    if (score >= 40) return RiskLevel.MEDIUM;
    if (score >= 20) return RiskLevel.LOW;
    return RiskLevel.MINIMAL;
  }

  private normalizeToUSD(amount: number, currency: string): number {
    // Simplified conversion rates (in production, use real-time rates)
    const rates: Record<string, number> = {
      USD: 1,
      EUR: 1.1,
      GBP: 1.27,
      EGP: 0.032,
      SAR: 0.27,
      AED: 0.27,
    };
    return Math.round(amount * (rates[currency] ?? 1));
  }
}

export const riskAssessorService = new RiskAssessorService();
