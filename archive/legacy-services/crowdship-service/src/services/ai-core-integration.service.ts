/**
 * AI Core Integration Service for Crowdship
 * Sprint 1: Wire AI Core Nucleus into crowdship-service
 * 
 * CONSTRAINTS:
 * - NO payments
 * - NO escrow execution
 * - NO auto-approval
 * - NO user blocking
 * - NO background data collection
 * - Deterministic logic only
 * - Advisory outputs only (read-only)
 */

import { getFeatureFlags, isAIFeatureEnabled } from '../config/feature-flags';

// Import AI Core types (re-exported for crowdship use)
export enum IntentType {
  BUY = 'BUY',
  SELL = 'SELL',
  EXCHANGE = 'EXCHANGE',
  TRANSFER = 'TRANSFER',
  REQUEST = 'REQUEST',   // Crowdship: Buyer wants product delivered
  TRAVEL = 'TRAVEL',     // Crowdship: Traveler offers delivery
  BROWSE = 'BROWSE',
  UNKNOWN = 'UNKNOWN',
}

export enum TrustLevel {
  VERIFIED = 'VERIFIED',
  TRUSTED = 'TRUSTED',
  STANDARD = 'STANDARD',
  NEW = 'NEW',
  RESTRICTED = 'RESTRICTED',
}

export enum RiskLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  MINIMAL = 'MINIMAL',
}

export enum RecommendedAction {
  PROCEED = 'PROCEED',
  PROCEED_WITH_ESCROW = 'PROCEED_WITH_ESCROW',
  REQUIRE_VERIFICATION = 'REQUIRE_VERIFICATION',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
  DECLINE = 'DECLINE',
}


// Signal weights for crowdship intent classification
const CROWDSHIP_SIGNAL_WEIGHTS: Record<string, number> = {
  page_context: 0.40,
  action: 0.35,
  user_role: 0.15,
  item_interaction: 0.20,
};

// Page context to intent mapping
const PAGE_INTENT_MAP: Record<string, IntentType> = {
  '/request/create': IntentType.REQUEST,
  '/trip/create': IntentType.TRAVEL,
  '/matches': IntentType.BUY,
  '/offers': IntentType.BUY,
  '/my-requests': IntentType.REQUEST,
  '/my-trips': IntentType.TRAVEL,
};

// Action to intent mapping
const ACTION_INTENT_MAP: Record<string, IntentType> = {
  submit_request: IntentType.REQUEST,
  post_trip: IntentType.TRAVEL,
  accept_offer: IntentType.BUY,
  make_offer: IntentType.TRAVEL,
  view_only: IntentType.BROWSE,
};

export interface IntentClassificationResult {
  intent: IntentType;
  confidence: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  signals: Array<{ source: string; value: string; weight: number; contribution: number }>;
  reasoning: string;
  timestamp: string;
}

export interface TrustScoreResult {
  userId: string;
  role: 'BUYER' | 'TRAVELER';
  score: number;
  level: TrustLevel;
  factors: Array<{ name: string; weight: number; value: number; contribution: number; explanation: string }>;
  computedAt: string;
}

export interface RiskAssessmentResult {
  requestId: string;
  overallRisk: RiskLevel;
  riskScore: number;
  factors: Array<{ category: string; score: number; weight: number; description: string }>;
  flags: Array<{ code: string; severity: RiskLevel; message: string; recommendation: string }>;
  recommendations: string[];
  assessedAt: string;
}


export interface DecisionRecommendationResult {
  requestId: string;
  travelerId: string;
  action: RecommendedAction;
  confidence: number;
  reasoning: Array<{ step: number; factor: string; evaluation: string; impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' }>;
  warnings: string[];
  alternatives: Array<{ action: RecommendedAction; conditions: string[]; tradeoffs: string[] }>;
  disclaimer: string;
  generatedAt: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  operation: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  processingTimeMs: number;
  version: string;
  correlationId: string;
}

// In-memory audit log (production: use persistent storage)
const auditLog: AuditEntry[] = [];
const AI_CORE_VERSION = '1.0.0';

/**
 * AI Core Integration Service
 * Deterministic, read-only advisory service
 */
export class AICoreIntegrationService {
  private correlationId: string;

  constructor(correlationId?: string) {
    this.correlationId = correlationId || this.generateCorrelationId();
  }

  private generateCorrelationId(): string {
    return `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Classify intent for shopper request creation or URL-based product intake
   * Output: intent label + constraints (read-only)
   */
  classifyIntent(signals: {
    pageContext?: string;
    action?: string;
    userRole?: 'buyer' | 'traveler';
    itemInteraction?: string;
  }): IntentClassificationResult | null {
    const flags = getFeatureFlags();
    if (!isAIFeatureEnabled(flags, 'AI_INTENT_CLASSIFICATION')) {
      return null;
    }

    const startTime = Date.now();
    const signalResults: IntentClassificationResult['signals'] = [];
    const intentScores: Record<IntentType, number> = {
      [IntentType.BUY]: 0, [IntentType.SELL]: 0, [IntentType.EXCHANGE]: 0,
      [IntentType.TRANSFER]: 0, [IntentType.REQUEST]: 0, [IntentType.TRAVEL]: 0,
      [IntentType.BROWSE]: 0, [IntentType.UNKNOWN]: 0,
    };


    // Process page context
    if (signals.pageContext) {
      const intent = PAGE_INTENT_MAP[signals.pageContext] || IntentType.BROWSE;
      const weight = CROWDSHIP_SIGNAL_WEIGHTS.page_context;
      intentScores[intent] += weight;
      signalResults.push({ source: 'page_context', value: signals.pageContext, weight, contribution: weight });
    }

    // Process action
    if (signals.action) {
      const intent = ACTION_INTENT_MAP[signals.action] || IntentType.UNKNOWN;
      const weight = CROWDSHIP_SIGNAL_WEIGHTS.action;
      intentScores[intent] += weight;
      signalResults.push({ source: 'action', value: signals.action, weight, contribution: weight });
    }

    // Process user role
    if (signals.userRole) {
      const intent = signals.userRole === 'buyer' ? IntentType.REQUEST : IntentType.TRAVEL;
      const weight = CROWDSHIP_SIGNAL_WEIGHTS.user_role;
      intentScores[intent] += weight;
      signalResults.push({ source: 'user_role', value: signals.userRole, weight, contribution: weight });
    }

    // Determine winning intent
    let maxScore = 0;
    let winningIntent = IntentType.UNKNOWN;
    for (const [intent, score] of Object.entries(intentScores)) {
      if (score > maxScore) {
        maxScore = score;
        winningIntent = intent as IntentType;
      }
    }

    const totalScore = Object.values(intentScores).reduce((a, b) => a + b, 0);
    const confidence = totalScore > 0 ? maxScore / Math.max(totalScore, 1) : 0;
    const confidenceLevel = confidence >= 0.8 ? 'HIGH' : confidence >= 0.5 ? 'MEDIUM' : 'LOW';

    if (confidence < 0.25) {
      winningIntent = IntentType.UNKNOWN;
    }

    const result: IntentClassificationResult = {
      intent: winningIntent,
      confidence: Math.round(confidence * 100) / 100,
      confidenceLevel,
      signals: signalResults,
      reasoning: `Classified as ${winningIntent} based on ${signalResults.length} signals with ${confidenceLevel} confidence`,
      timestamp: new Date().toISOString(),
    };

    this.logAudit('CLASSIFY_INTENT', signals, result, startTime);
    return result;
  }


  /**
   * Compute trust score for buyer or traveler
   * Used in: Traveler offer review pipeline, Pre-negotiation visibility layer
   */
  computeTrustScore(input: {
    userId: string;
    role: 'BUYER' | 'TRAVELER';
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    is2FAEnabled: boolean;
    totalTransactions: number;
    successfulTransactions: number;
    accountCreatedAt: Date;
    averageRating: number;
    totalRatings: number;
    disputesRaised: number;
    disputesLost: number;
    responseRate: number;
    kycLevel: 'none' | 'basic' | 'enhanced' | 'full';
    // Traveler-specific
    passportVerified?: boolean;
    totalDeliveries?: number;
    successfulDeliveries?: number;
    onTimeDeliveries?: number;
  }): TrustScoreResult | null {
    const flags = getFeatureFlags();
    if (!isAIFeatureEnabled(flags, 'AI_TRUST_SCORING')) {
      return null;
    }

    const startTime = Date.now();
    const factors: TrustScoreResult['factors'] = [];

    // Factor weights based on role
    const weights = input.role === 'BUYER' 
      ? { identity: 0.25, payment: 0.20, completion: 0.20, age: 0.10, dispute: 0.10, response: 0.10, kyc: 0.05 }
      : { identity: 0.20, delivery: 0.25, onTime: 0.15, age: 0.10, rating: 0.15, dispute: 0.10, kyc: 0.05 };

    // Identity verification
    let identityScore = 0;
    if (input.isEmailVerified) identityScore += input.role === 'BUYER' ? 30 : 20;
    if (input.isPhoneVerified) identityScore += input.role === 'BUYER' ? 40 : 30;
    if (input.is2FAEnabled) identityScore += input.role === 'BUYER' ? 30 : 20;
    if (input.role === 'TRAVELER' && input.passportVerified) identityScore += 30;
    factors.push({
      name: 'identity_verification', weight: weights.identity, value: identityScore,
      contribution: identityScore * weights.identity,
      explanation: `Email: ${input.isEmailVerified}, Phone: ${input.isPhoneVerified}, 2FA: ${input.is2FAEnabled}`,
    });


    // Transaction/Delivery history
    if (input.role === 'BUYER') {
      const txScore = input.totalTransactions === 0 ? 0 
        : Math.round((input.successfulTransactions / input.totalTransactions) * 70 + Math.min(30, input.totalTransactions * 0.5));
      factors.push({
        name: 'payment_history', weight: weights.payment, value: txScore,
        contribution: txScore * weights.payment,
        explanation: `${input.successfulTransactions}/${input.totalTransactions} successful transactions`,
      });
    } else {
      const deliveryScore = (input.totalDeliveries || 0) === 0 ? 0
        : Math.round(((input.successfulDeliveries || 0) / (input.totalDeliveries || 1)) * 100);
      factors.push({
        name: 'delivery_success', weight: weights.delivery, value: deliveryScore,
        contribution: deliveryScore * weights.delivery,
        explanation: `${input.successfulDeliveries || 0}/${input.totalDeliveries || 0} successful deliveries`,
      });

      const onTimeScore = (input.totalDeliveries || 0) === 0 ? 0
        : Math.round(((input.onTimeDeliveries || 0) / (input.totalDeliveries || 1)) * 100);
      factors.push({
        name: 'on_time_rate', weight: weights.onTime, value: onTimeScore,
        contribution: onTimeScore * weights.onTime,
        explanation: `${input.onTimeDeliveries || 0}/${input.totalDeliveries || 0} on-time deliveries`,
      });
    }

    // Account age
    const ageInDays = Math.floor((Date.now() - input.accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
    const ageScore = ageInDays < 7 ? 10 : ageInDays < 30 ? 30 : ageInDays < 90 ? 50 : ageInDays < 180 ? 70 : ageInDays < 365 ? 85 : 100;
    factors.push({
      name: 'account_age', weight: weights.age, value: ageScore,
      contribution: ageScore * weights.age,
      explanation: `Account is ${ageInDays} days old`,
    });

    // Rating score (for travelers)
    if (input.role === 'TRAVELER') {
      const ratingScore = input.totalRatings === 0 ? 50 : Math.round(((input.averageRating - 1) / 4) * 100);
      factors.push({
        name: 'buyer_ratings', weight: weights.rating, value: ratingScore,
        contribution: ratingScore * weights.rating,
        explanation: `Average rating: ${input.averageRating}/5 from ${input.totalRatings} ratings`,
      });
    }


    // Dispute ratio
    const disputeScore = input.totalTransactions === 0 ? 100
      : Math.round(Math.max(0, 100 - (input.disputesRaised / input.totalTransactions) * 200 - (input.disputesLost / Math.max(1, input.disputesRaised)) * 30));
    factors.push({
      name: 'dispute_ratio', weight: weights.dispute, value: disputeScore,
      contribution: disputeScore * weights.dispute,
      explanation: `${input.disputesRaised} disputes raised, ${input.disputesLost} lost`,
    });

    // Response rate
    const responseScore = Math.round(input.responseRate * 100);
    factors.push({
      name: 'response_rate', weight: weights.response, value: responseScore,
      contribution: responseScore * weights.response,
      explanation: `${Math.round(input.responseRate * 100)}% response rate`,
    });

    // KYC level
    const kycScores: Record<string, number> = { none: 0, basic: 40, enhanced: 70, full: 100 };
    const kycScore = kycScores[input.kycLevel] || 0;
    factors.push({
      name: 'kyc_level', weight: weights.kyc, value: kycScore,
      contribution: kycScore * weights.kyc,
      explanation: `KYC level: ${input.kycLevel}`,
    });

    // Calculate total score
    const totalScore = Math.round(Math.min(100, Math.max(0, factors.reduce((sum, f) => sum + f.contribution, 0))));
    const level = totalScore >= 80 ? TrustLevel.VERIFIED : totalScore >= 60 ? TrustLevel.TRUSTED 
      : totalScore >= 40 ? TrustLevel.STANDARD : totalScore >= 20 ? TrustLevel.NEW : TrustLevel.RESTRICTED;

    const result: TrustScoreResult = {
      userId: input.userId,
      role: input.role,
      score: totalScore,
      level,
      factors,
      computedAt: new Date().toISOString(),
    };

    this.logAudit('COMPUTE_TRUST', { userId: input.userId, role: input.role }, result, startTime);
    return result;
  }


  /**
   * Assess risk for a delivery request/offer match
   * Used in: Traveler offer review pipeline, Pre-negotiation visibility
   */
  assessRisk(input: {
    requestId: string;
    itemValue: number;
    currency: string;
    buyerTrust: TrustScoreResult;
    travelerTrust: TrustScoreResult;
    originCountry: string;
    destinationCountry: string;
    itemCategory?: string;
    buyerAccountAgeDays: number;
    travelerAccountAgeDays: number;
  }): RiskAssessmentResult | null {
    const flags = getFeatureFlags();
    if (!isAIFeatureEnabled(flags, 'AI_RISK_ASSESSMENT')) {
      return null;
    }

    const startTime = Date.now();
    const factors: RiskAssessmentResult['factors'] = [];
    const riskFlags: RiskAssessmentResult['flags'] = [];

    // High-value item risk
    const usdValue = this.normalizeToUSD(input.itemValue, input.currency);
    let valueScore = 5;
    if (usdValue >= 5000) {
      valueScore = 40;
      riskFlags.push({ code: 'VERY_HIGH_VALUE', severity: RiskLevel.HIGH, message: `Item value $${usdValue} exceeds $5000`, recommendation: 'Require escrow + enhanced verification' });
    } else if (usdValue >= 2000) {
      valueScore = 30;
      riskFlags.push({ code: 'HIGH_VALUE', severity: RiskLevel.MEDIUM, message: `Item value $${usdValue} exceeds $2000`, recommendation: 'Require escrow' });
    } else if (usdValue >= 500) {
      valueScore = 20;
      riskFlags.push({ code: 'ELEVATED_VALUE', severity: RiskLevel.LOW, message: `Item value $${usdValue} exceeds $500`, recommendation: 'Recommend escrow' });
    } else if (usdValue >= 100) {
      valueScore = 10;
    }
    factors.push({ category: 'item_value', score: valueScore, weight: 0.25, description: `Item value: $${usdValue} USD` });


    // New user risk
    let newUserScore = 0;
    if (input.buyerAccountAgeDays < 7) {
      newUserScore += 35;
      riskFlags.push({ code: 'VERY_NEW_BUYER', severity: RiskLevel.MEDIUM, message: 'Buyer account less than 7 days old', recommendation: 'Require phone verification' });
    } else if (input.buyerAccountAgeDays < 30) {
      newUserScore += 25;
    }
    if (input.travelerAccountAgeDays < 7) {
      newUserScore += 35;
      riskFlags.push({ code: 'VERY_NEW_TRAVELER', severity: RiskLevel.MEDIUM, message: 'Traveler account less than 7 days old', recommendation: 'Require phone verification' });
    } else if (input.travelerAccountAgeDays < 30) {
      newUserScore += 25;
    }
    factors.push({ category: 'new_user', score: Math.min(70, newUserScore), weight: 0.20, description: `Buyer: ${input.buyerAccountAgeDays}d, Traveler: ${input.travelerAccountAgeDays}d` });

    // Cross-border risk
    let crossBorderScore = 0;
    const isCrossBorder = input.originCountry !== input.destinationCountry;
    if (isCrossBorder) {
      crossBorderScore = 15;
      riskFlags.push({ code: 'CROSS_BORDER', severity: RiskLevel.LOW, message: `Cross-border delivery: ${input.originCountry} → ${input.destinationCountry}`, recommendation: 'Standard cross-border flow' });
    }
    // High-risk countries (simplified)
    const highRiskCountries = ['XX', 'YY', 'ZZ'];
    if (highRiskCountries.includes(input.originCountry) || highRiskCountries.includes(input.destinationCountry)) {
      crossBorderScore += 35;
      riskFlags.push({ code: 'HIGH_RISK_GEOGRAPHY', severity: RiskLevel.HIGH, message: 'High-risk country involved', recommendation: 'Enhanced due diligence required' });
    }
    factors.push({ category: 'cross_border', score: crossBorderScore, weight: 0.20, description: `${input.originCountry} → ${input.destinationCountry}` });

    // Trust differential
    const trustGap = Math.abs(input.buyerTrust.score - input.travelerTrust.score);
    const minTrust = Math.min(input.buyerTrust.score, input.travelerTrust.score);
    let trustScore = 0;
    if (minTrust < 20) {
      trustScore = 50;
      riskFlags.push({ code: 'LOW_TRUST_PARTY', severity: RiskLevel.HIGH, message: 'One party has restricted trust level', recommendation: 'Manual review required' });
    } else if (trustGap > 40) {
      trustScore = 30;
      riskFlags.push({ code: 'TRUST_GAP', severity: RiskLevel.MEDIUM, message: `Trust gap of ${trustGap} points`, recommendation: 'Consider escrow protection' });
    } else {
      trustScore = Math.max(0, 20 - minTrust * 0.2);
    }
    factors.push({ category: 'trust_differential', score: trustScore, weight: 0.20, description: `Buyer: ${input.buyerTrust.score}, Traveler: ${input.travelerTrust.score}` });


    // Item category risk
    const highRiskCategories = ['electronics', 'luxury', 'jewelry', 'gift_cards', 'cryptocurrency'];
    const categoryScore = input.itemCategory && highRiskCategories.some(c => input.itemCategory!.toLowerCase().includes(c)) ? 40 : 10;
    if (categoryScore > 20) {
      riskFlags.push({ code: 'HIGH_RISK_CATEGORY', severity: RiskLevel.MEDIUM, message: `Category "${input.itemCategory}" is high-risk`, recommendation: 'Apply enhanced fraud checks' });
    }
    factors.push({ category: 'item_category', score: categoryScore, weight: 0.15, description: `Category: ${input.itemCategory || 'unknown'}` });

    // Calculate overall risk
    const riskScore = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0));
    const overallRisk = riskScore >= 80 ? RiskLevel.CRITICAL : riskScore >= 60 ? RiskLevel.HIGH
      : riskScore >= 40 ? RiskLevel.MEDIUM : riskScore >= 20 ? RiskLevel.LOW : RiskLevel.MINIMAL;

    const recommendations = riskFlags.map(f => f.recommendation);

    const result: RiskAssessmentResult = {
      requestId: input.requestId,
      overallRisk,
      riskScore,
      factors,
      flags: riskFlags,
      recommendations,
      assessedAt: new Date().toISOString(),
    };

    this.logAudit('ASSESS_RISK', { requestId: input.requestId }, result, startTime);
    return result;
  }

  private normalizeToUSD(amount: number, currency: string): number {
    const rates: Record<string, number> = { USD: 1, EUR: 1.1, GBP: 1.27, EGP: 0.032, SAR: 0.27, AED: 0.27 };
    return Math.round(amount * (rates[currency] || 1));
  }


  /**
   * Generate decision recommendation for offer comparison
   * Used in: Offer comparison screen, Buyer-facing recommendations (advisory only)
   */
  generateRecommendation(input: {
    requestId: string;
    travelerId: string;
    buyerTrust: TrustScoreResult;
    travelerTrust: TrustScoreResult;
    riskAssessment: RiskAssessmentResult;
    matchScore?: number;
  }): DecisionRecommendationResult | null {
    const flags = getFeatureFlags();
    if (!isAIFeatureEnabled(flags, 'AI_DECISION_RECOMMENDATIONS')) {
      return null;
    }

    const startTime = Date.now();
    const reasoning: DecisionRecommendationResult['reasoning'] = [];
    const warnings: string[] = [];
    let stepNumber = 1;

    // Evaluate buyer trust
    const buyerImpact = input.buyerTrust.level === TrustLevel.RESTRICTED ? 'NEGATIVE' 
      : input.buyerTrust.level === TrustLevel.NEW ? 'NEUTRAL' : 'POSITIVE';
    reasoning.push({
      step: stepNumber++,
      factor: 'Buyer Trust',
      evaluation: `Buyer trust level: ${input.buyerTrust.level} (${input.buyerTrust.score}/100)`,
      impact: buyerImpact,
    });
    if (buyerImpact === 'NEGATIVE') warnings.push('Buyer has restricted trust level');

    // Evaluate traveler trust
    const travelerImpact = input.travelerTrust.level === TrustLevel.RESTRICTED ? 'NEGATIVE'
      : input.travelerTrust.level === TrustLevel.NEW ? 'NEUTRAL' : 'POSITIVE';
    reasoning.push({
      step: stepNumber++,
      factor: 'Traveler Trust',
      evaluation: `Traveler trust level: ${input.travelerTrust.level} (${input.travelerTrust.score}/100)`,
      impact: travelerImpact,
    });
    if (travelerImpact === 'NEGATIVE') warnings.push('Traveler has restricted trust level');

    // Evaluate risk
    const riskImpact = input.riskAssessment.overallRisk === RiskLevel.CRITICAL || input.riskAssessment.overallRisk === RiskLevel.HIGH ? 'NEGATIVE'
      : input.riskAssessment.overallRisk === RiskLevel.MEDIUM ? 'NEUTRAL' : 'POSITIVE';
    reasoning.push({
      step: stepNumber++,
      factor: 'Risk Assessment',
      evaluation: `Overall risk: ${input.riskAssessment.overallRisk} (${input.riskAssessment.riskScore}/100)`,
      impact: riskImpact,
    });
    input.riskAssessment.flags.forEach(f => warnings.push(f.message));


    // Decision matrix lookup
    const minTrustLevel = this.getMinTrustLevel(input.buyerTrust.level, input.travelerTrust.level);
    const action = this.lookupDecisionMatrix(input.riskAssessment.overallRisk, minTrustLevel);

    reasoning.push({
      step: stepNumber++,
      factor: 'Decision Matrix',
      evaluation: `Risk: ${input.riskAssessment.overallRisk}, Min Trust: ${minTrustLevel} → ${action}`,
      impact: action === RecommendedAction.PROCEED ? 'POSITIVE' : action === RecommendedAction.DECLINE ? 'NEGATIVE' : 'NEUTRAL',
    });

    // Calculate confidence
    const negativeCount = reasoning.filter(r => r.impact === 'NEGATIVE').length;
    const positiveCount = reasoning.filter(r => r.impact === 'POSITIVE').length;
    let confidence = 0.85 - negativeCount * 0.15 + positiveCount * 0.03;
    confidence = Math.min(0.99, Math.max(0.3, confidence));

    // Generate alternatives
    const alternatives = this.generateAlternatives(action);

    const result: DecisionRecommendationResult = {
      requestId: input.requestId,
      travelerId: input.travelerId,
      action,
      confidence: Math.round(confidence * 100) / 100,
      reasoning,
      warnings,
      alternatives,
      disclaimer: 'This is an advisory recommendation only. No actions have been executed.',
      generatedAt: new Date().toISOString(),
    };

    this.logAudit('GENERATE_RECOMMENDATION', { requestId: input.requestId, travelerId: input.travelerId }, result, startTime);
    return result;
  }

  private getMinTrustLevel(level1: TrustLevel, level2: TrustLevel): TrustLevel {
    const order = [TrustLevel.RESTRICTED, TrustLevel.NEW, TrustLevel.STANDARD, TrustLevel.TRUSTED, TrustLevel.VERIFIED];
    return order[Math.min(order.indexOf(level1), order.indexOf(level2))];
  }

  private lookupDecisionMatrix(risk: RiskLevel, trust: TrustLevel): RecommendedAction {
    const matrix: Record<RiskLevel, Record<TrustLevel, RecommendedAction>> = {
      [RiskLevel.MINIMAL]: {
        [TrustLevel.VERIFIED]: RecommendedAction.PROCEED, [TrustLevel.TRUSTED]: RecommendedAction.PROCEED,
        [TrustLevel.STANDARD]: RecommendedAction.PROCEED_WITH_ESCROW, [TrustLevel.NEW]: RecommendedAction.PROCEED_WITH_ESCROW,
        [TrustLevel.RESTRICTED]: RecommendedAction.REQUIRE_VERIFICATION,
      },
      [RiskLevel.LOW]: {
        [TrustLevel.VERIFIED]: RecommendedAction.PROCEED, [TrustLevel.TRUSTED]: RecommendedAction.PROCEED_WITH_ESCROW,
        [TrustLevel.STANDARD]: RecommendedAction.PROCEED_WITH_ESCROW, [TrustLevel.NEW]: RecommendedAction.REQUIRE_VERIFICATION,
        [TrustLevel.RESTRICTED]: RecommendedAction.REQUIRE_VERIFICATION,
      },
      [RiskLevel.MEDIUM]: {
        [TrustLevel.VERIFIED]: RecommendedAction.PROCEED_WITH_ESCROW, [TrustLevel.TRUSTED]: RecommendedAction.PROCEED_WITH_ESCROW,
        [TrustLevel.STANDARD]: RecommendedAction.REQUIRE_VERIFICATION, [TrustLevel.NEW]: RecommendedAction.REQUIRE_VERIFICATION,
        [TrustLevel.RESTRICTED]: RecommendedAction.MANUAL_REVIEW,
      },
      [RiskLevel.HIGH]: {
        [TrustLevel.VERIFIED]: RecommendedAction.REQUIRE_VERIFICATION, [TrustLevel.TRUSTED]: RecommendedAction.REQUIRE_VERIFICATION,
        [TrustLevel.STANDARD]: RecommendedAction.MANUAL_REVIEW, [TrustLevel.NEW]: RecommendedAction.MANUAL_REVIEW,
        [TrustLevel.RESTRICTED]: RecommendedAction.DECLINE,
      },
      [RiskLevel.CRITICAL]: {
        [TrustLevel.VERIFIED]: RecommendedAction.MANUAL_REVIEW, [TrustLevel.TRUSTED]: RecommendedAction.MANUAL_REVIEW,
        [TrustLevel.STANDARD]: RecommendedAction.DECLINE, [TrustLevel.NEW]: RecommendedAction.DECLINE,
        [TrustLevel.RESTRICTED]: RecommendedAction.DECLINE,
      },
    };
    return matrix[risk][trust];
  }


  private generateAlternatives(action: RecommendedAction): DecisionRecommendationResult['alternatives'] {
    const alternatives: DecisionRecommendationResult['alternatives'] = [];
    switch (action) {
      case RecommendedAction.DECLINE:
        alternatives.push({ action: RecommendedAction.MANUAL_REVIEW, conditions: ['If buyer provides additional verification'], tradeoffs: ['Increased operational cost'] });
        break;
      case RecommendedAction.MANUAL_REVIEW:
        alternatives.push({ action: RecommendedAction.REQUIRE_VERIFICATION, conditions: ['If automated verification passes'], tradeoffs: ['May miss edge cases'] });
        break;
      case RecommendedAction.REQUIRE_VERIFICATION:
        alternatives.push({ action: RecommendedAction.PROCEED_WITH_ESCROW, conditions: ['If user has verified phone'], tradeoffs: ['Slightly higher risk'] });
        break;
      case RecommendedAction.PROCEED_WITH_ESCROW:
        alternatives.push({ action: RecommendedAction.PROCEED, conditions: ['If both parties are VERIFIED'], tradeoffs: ['Minimal additional risk'] });
        break;
    }
    return alternatives;
  }

  /**
   * Log audit entry for all AI operations
   */
  private logAudit(operation: string, input: Record<string, unknown>, output: Record<string, unknown>, startTime: number): void {
    const flags = getFeatureFlags();
    if (!isAIFeatureEnabled(flags, 'AI_AUDIT_LOGGING')) {
      return;
    }

    const entry: AuditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      operation,
      input: this.sanitizeInput(input),
      output: this.sanitizeOutput(output),
      processingTimeMs: Date.now() - startTime,
      version: AI_CORE_VERSION,
      correlationId: this.correlationId,
    };
    auditLog.push(entry);

    // Keep only last 10000 entries
    if (auditLog.length > 10000) {
      auditLog.splice(0, auditLog.length - 10000);
    }
  }

  private sanitizeInput(input: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...input };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    for (const field of sensitiveFields) {
      if (field in sanitized) sanitized[field] = '[REDACTED]';
    }
    return sanitized;
  }

  private sanitizeOutput(output: Record<string, unknown>): Record<string, unknown> {
    try { return JSON.parse(JSON.stringify(output)); } catch { return { error: 'Output not serializable' }; }
  }

  /**
   * Get audit logs (for debugging/compliance)
   */
  static getAuditLogs(options?: { operation?: string; limit?: number }): AuditEntry[] {
    let logs = [...auditLog];
    if (options?.operation) logs = logs.filter(l => l.operation === options.operation);
    return logs.slice(-(options?.limit || 100));
  }
}

export const aiCoreIntegrationService = new AICoreIntegrationService();
