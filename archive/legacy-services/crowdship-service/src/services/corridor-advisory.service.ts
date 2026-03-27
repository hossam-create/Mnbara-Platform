/**
 * Corridor Advisory Service
 * Sprint 2: Trust-First Market Activation (US → MENA)
 * 
 * CONSTRAINTS:
 * - NO payments, NO escrow execution, NO auto-matching
 * - NO ranking suppression without explanation
 * - Advisory only, deterministic, feature-flagged
 * - Human confirmation required for all actions
 */

import { getFeatureFlags, FeatureFlags } from '../config/feature-flags';
import { getCorridorConfig, getValueBandMultiplier, getDeliveryWindowMultiplier, CorridorConfig, TrustRequirement } from '../config/market-corridors';
import { AICoreIntegrationService, TrustLevel, RiskLevel, RecommendedAction, TrustScoreResult, RiskAssessmentResult, DecisionRecommendationResult } from './ai-core-integration.service';

// Extended intent types for Sprint 2
export enum MarketIntent {
  BUY_FROM_ABROAD = 'BUY_FROM_ABROAD',
  TRAVEL_MATCH = 'TRAVEL_MATCH',
  PRICE_VERIFY = 'PRICE_VERIFY',
  BROWSE = 'BROWSE',
  UNKNOWN = 'UNKNOWN',
}

// Re-export for external use
export { TrustLevel, RiskLevel, RecommendedAction, TrustScoreResult, RiskAssessmentResult, DecisionRecommendationResult };

export interface CorridorAssessment {
  corridorId: string;
  corridorName: string;
  origin: string;
  destination: string;
  isSupported: boolean;
  riskMultiplier: number;
  valueBand: { label: string; multiplier: number };
  trustGating: TrustGatingResult;
  escrowRecommendation: EscrowRecommendation;
  restrictions: string[];
  warnings: string[];
  timestamp: string;
}

export interface TrustGatingResult {
  passed: boolean;
  buyerMeetsRequirement: boolean;
  travelerMeetsRequirement: boolean;
  requiredBuyerTrust: TrustRequirement;
  requiredTravelerTrust: TrustRequirement;
  actualBuyerTrust: TrustLevel;
  actualTravelerTrust: TrustLevel;
  downgradeReason?: string;
  isHighValue: boolean;
}

export interface EscrowRecommendation {
  recommended: boolean;
  required: boolean;  // Always false - never enforced
  reason: string;
  policy: string;
}


export interface MarketIntentResult {
  intent: MarketIntent;
  confidence: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  signals: Array<{ source: string; value: string; weight: number }>;
  reasoning: string;
  editable: boolean;  // UI can show editable chip
  timestamp: string;
}

export interface RecommendationLanes {
  recommended: LaneOption[];
  saferAlternatives: LaneOption[];
  higherRiskAllowed: LaneOption[];
  whyRecommended: string[];
}

export interface LaneOption {
  action: RecommendedAction;
  label: string;
  description: string;
  riskLevel: RiskLevel;
  conditions: string[];
  userChoiceAllowed: boolean;
}

export interface HumanConfirmationCheckpoint {
  checkpointId: string;
  type: 'CONTACT_TRAVELER' | 'SELECT_PAYMENT' | 'PROCEED_CROSS_BORDER';
  title: string;
  description: string;
  requiredConfirmation: boolean;
  confirmationText: string;
  warnings: string[];
}

export interface CorridorSnapshot {
  requestId: string;
  correlationId: string;
  timestamp: string;
  intentSnapshot: MarketIntentResult | null;
  trustSnapshot: { buyer: TrustScoreResult | null; traveler: TrustScoreResult | null };
  riskSnapshot: RiskAssessmentResult | null;
  recommendationSnapshot: RecommendationLanes | null;
  corridorAssessment: CorridorAssessment | null;
}

// In-memory snapshot store (production: use persistent storage)
const snapshotStore: Map<string, CorridorSnapshot> = new Map();

/**
 * Corridor Advisory Service
 * Deterministic, advisory-only service for US → MENA corridor
 */
export class CorridorAdvisoryService {
  private aiCore: AICoreIntegrationService;
  private correlationId: string;

  constructor(correlationId?: string) {
    this.correlationId = correlationId || `corridor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.aiCore = new AICoreIntegrationService(this.correlationId);
  }


  /**
   * Classify market intent (extended for Sprint 2)
   * BUY_FROM_ABROAD, TRAVEL_MATCH, PRICE_VERIFY
   */
  classifyMarketIntent(signals: {
    pageContext?: string;
    action?: string;
    userRole?: 'buyer' | 'traveler';
    productUrl?: string;
    hasPrice?: boolean;
    isCrossBorder?: boolean;
  }): MarketIntentResult | null {
    const flags = getFeatureFlags();
    if (!flags.CORRIDOR_AI_ADVISORY || !flags.AI_CORE_ENABLED) {
      return null;
    }

    const signalResults: MarketIntentResult['signals'] = [];
    const intentScores: Record<MarketIntent, number> = {
      [MarketIntent.BUY_FROM_ABROAD]: 0,
      [MarketIntent.TRAVEL_MATCH]: 0,
      [MarketIntent.PRICE_VERIFY]: 0,
      [MarketIntent.BROWSE]: 0,
      [MarketIntent.UNKNOWN]: 0,
    };

    // Cross-border signal
    if (signals.isCrossBorder) {
      intentScores[MarketIntent.BUY_FROM_ABROAD] += 0.3;
      signalResults.push({ source: 'cross_border', value: 'true', weight: 0.3 });
    }

    // Product URL signal
    if (signals.productUrl) {
      intentScores[MarketIntent.BUY_FROM_ABROAD] += 0.25;
      signalResults.push({ source: 'product_url', value: 'present', weight: 0.25 });
    }

    // Price verification signal
    if (signals.hasPrice === false && signals.productUrl) {
      intentScores[MarketIntent.PRICE_VERIFY] += 0.4;
      signalResults.push({ source: 'price_missing', value: 'true', weight: 0.4 });
    }

    // User role signal
    if (signals.userRole === 'buyer') {
      intentScores[MarketIntent.BUY_FROM_ABROAD] += 0.2;
      signalResults.push({ source: 'user_role', value: 'buyer', weight: 0.2 });
    } else if (signals.userRole === 'traveler') {
      intentScores[MarketIntent.TRAVEL_MATCH] += 0.35;
      signalResults.push({ source: 'user_role', value: 'traveler', weight: 0.35 });
    }

    // Action signal
    if (signals.action === 'view_matches' || signals.action === 'browse_requests') {
      intentScores[MarketIntent.TRAVEL_MATCH] += 0.3;
      signalResults.push({ source: 'action', value: signals.action, weight: 0.3 });
    }

    // Determine winning intent
    let maxScore = 0;
    let winningIntent = MarketIntent.UNKNOWN;
    for (const [intent, score] of Object.entries(intentScores)) {
      if (score > maxScore) {
        maxScore = score;
        winningIntent = intent as MarketIntent;
      }
    }

    const totalScore = Object.values(intentScores).reduce((a, b) => a + b, 0);
    const confidence = totalScore > 0 ? maxScore / Math.max(totalScore, 1) : 0;
    const confidenceLevel = confidence >= 0.7 ? 'HIGH' : confidence >= 0.4 ? 'MEDIUM' : 'LOW';

    if (confidence < 0.2) winningIntent = MarketIntent.UNKNOWN;

    return {
      intent: winningIntent,
      confidence: Math.round(confidence * 100) / 100,
      confidenceLevel,
      signals: signalResults,
      reasoning: `Classified as ${winningIntent} based on ${signalResults.length} signals`,
      editable: flags.INTENT_CHIP_UI,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Assess corridor for cross-border transaction
   * Returns risk multipliers, trust gating, and escrow recommendation
   */
  assessCorridor(input: {
    origin: string;
    destination: string;
    itemValueUSD: number;
    deliveryDays: number;
    buyerTrust: TrustScoreResult;
    travelerTrust: TrustScoreResult;
  }): CorridorAssessment | null {
    const flags = getFeatureFlags();
    if (!flags.CORRIDOR_AI_ADVISORY || !flags.AI_CORE_ENABLED) {
      return null;
    }

    const corridor = getCorridorConfig(input.origin, input.destination);
    const warnings: string[] = [];

    if (!corridor) {
      return {
        corridorId: `${input.origin}_${input.destination}`,
        corridorName: `${input.origin} → ${input.destination}`,
        origin: input.origin,
        destination: input.destination,
        isSupported: false,
        riskMultiplier: 1.0,
        valueBand: { label: 'Unknown', multiplier: 1.0 },
        trustGating: {
          passed: false,
          buyerMeetsRequirement: false,
          travelerMeetsRequirement: false,
          requiredBuyerTrust: 'ANY',
          requiredTravelerTrust: 'ANY',
          actualBuyerTrust: input.buyerTrust.level,
          actualTravelerTrust: input.travelerTrust.level,
          downgradeReason: 'Corridor not supported',
          isHighValue: false,
        },
        escrowRecommendation: { recommended: true, required: false, reason: 'Unsupported corridor', policy: 'ALWAYS_RECOMMENDED' },
        restrictions: [],
        warnings: ['This corridor is not currently supported'],
        timestamp: new Date().toISOString(),
      };
    }

    // Calculate risk multipliers
    const valueBand = getValueBandMultiplier(corridor, input.itemValueUSD);
    const deliveryMultiplier = getDeliveryWindowMultiplier(corridor, input.deliveryDays);
    const riskMultiplier = Math.round((corridor.riskMultipliers.customs * valueBand.multiplier * deliveryMultiplier.multiplier) * 100) / 100;

    // Trust gating (NON-BYPASSABLE for high-value)
    const isHighValue = input.itemValueUSD > corridor.trustRequirements.highValueThreshold;
    const trustGating = this.evaluateTrustGating(corridor, input.buyerTrust, input.travelerTrust, isHighValue, flags);

    // Escrow recommendation (never enforced)
    const escrowRecommendation = this.getEscrowRecommendation(corridor, isHighValue, trustGating.passed);

    // Add warnings
    if (isHighValue) warnings.push(`High-value item (>${corridor.trustRequirements.highValueThreshold} USD) - enhanced trust required`);
    if (!trustGating.passed) warnings.push(trustGating.downgradeReason || 'Trust requirements not met');
    if (corridor.restrictions.length > 0) warnings.push(`Restricted items: ${corridor.restrictions.join(', ')}`);

    return {
      corridorId: corridor.id,
      corridorName: corridor.name,
      origin: corridor.origin,
      destination: input.destination,
      isSupported: true,
      riskMultiplier,
      valueBand: { label: valueBand.label, multiplier: valueBand.multiplier },
      trustGating,
      escrowRecommendation,
      restrictions: corridor.restrictions,
      warnings,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Evaluate trust gating rules (NON-BYPASSABLE for high-value)
   */
  private evaluateTrustGating(
    corridor: CorridorConfig,
    buyerTrust: TrustScoreResult,
    travelerTrust: TrustScoreResult,
    isHighValue: boolean,
    flags: FeatureFlags
  ): TrustGatingResult {
    if (!flags.TRUST_GATING) {
      return {
        passed: true,
        buyerMeetsRequirement: true,
        travelerMeetsRequirement: true,
        requiredBuyerTrust: 'ANY',
        requiredTravelerTrust: 'ANY',
        actualBuyerTrust: buyerTrust.level,
        actualTravelerTrust: travelerTrust.level,
        isHighValue,
      };
    }

    const trustOrder: TrustLevel[] = [TrustLevel.RESTRICTED, TrustLevel.NEW, TrustLevel.STANDARD, TrustLevel.TRUSTED, TrustLevel.VERIFIED];
    const requirementToLevel: Record<TrustRequirement, TrustLevel> = {
      'VERIFIED': TrustLevel.VERIFIED,
      'TRUSTED': TrustLevel.TRUSTED,
      'STANDARD': TrustLevel.STANDARD,
      'NEW': TrustLevel.NEW,
      'ANY': TrustLevel.RESTRICTED,
    };

    const requiredBuyerLevel = isHighValue ? TrustLevel.TRUSTED : requirementToLevel[corridor.trustRequirements.minBuyerTrust];
    const requiredTravelerLevel = isHighValue ? TrustLevel.TRUSTED : requirementToLevel[corridor.trustRequirements.minTravelerTrust];

    const buyerMeets = trustOrder.indexOf(buyerTrust.level) >= trustOrder.indexOf(requiredBuyerLevel);
    const travelerMeets = trustOrder.indexOf(travelerTrust.level) >= trustOrder.indexOf(requiredTravelerLevel);
    const passed = buyerMeets && travelerMeets;

    let downgradeReason: string | undefined;
    if (!passed) {
      if (!buyerMeets && !travelerMeets) {
        downgradeReason = `Both buyer (${buyerTrust.level}) and traveler (${travelerTrust.level}) below required trust level`;
      } else if (!buyerMeets) {
        downgradeReason = `Buyer trust (${buyerTrust.level}) below required level (${requiredBuyerLevel})`;
      } else {
        downgradeReason = `Traveler trust (${travelerTrust.level}) below required level (${requiredTravelerLevel})`;
      }
    }

    return {
      passed,
      buyerMeetsRequirement: buyerMeets,
      travelerMeetsRequirement: travelerMeets,
      requiredBuyerTrust: isHighValue ? 'TRUSTED' : corridor.trustRequirements.minBuyerTrust,
      requiredTravelerTrust: isHighValue ? 'TRUSTED' : corridor.trustRequirements.minTravelerTrust,
      actualBuyerTrust: buyerTrust.level,
      actualTravelerTrust: travelerTrust.level,
      downgradeReason,
      isHighValue,
    };
  }

  /**
   * Get escrow recommendation (NEVER enforced)
   */
  private getEscrowRecommendation(corridor: CorridorConfig, isHighValue: boolean, trustPassed: boolean): EscrowRecommendation {
    let recommended = false;
    let reason = '';

    switch (corridor.escrowPolicy) {
      case 'ALWAYS_RECOMMENDED':
        recommended = true;
        reason = 'Cross-border transactions benefit from escrow protection';
        break;
      case 'HIGH_VALUE_ONLY':
        recommended = isHighValue;
        reason = isHighValue ? 'High-value item - escrow recommended' : 'Standard value - escrow optional';
        break;
      case 'OPTIONAL':
        recommended = !trustPassed;
        reason = trustPassed ? 'Both parties trusted - escrow optional' : 'Trust requirements not met - escrow recommended';
        break;
    }

    return {
      recommended,
      required: false, // NEVER enforced
      reason,
      policy: corridor.escrowPolicy,
    };
  }

  /**
   * Generate recommendation lanes for UI display
   * "Why this is recommended", "Safer alternatives", "Higher risk – allowed if you choose"
   */
  generateRecommendationLanes(input: {
    corridorAssessment: CorridorAssessment;
    riskAssessment: RiskAssessmentResult;
    recommendation: DecisionRecommendationResult;
  }): RecommendationLanes {
    const flags = getFeatureFlags();
    if (!flags.CORRIDOR_AI_ADVISORY) {
      return { recommended: [], saferAlternatives: [], higherRiskAllowed: [], whyRecommended: [] };
    }

    const { corridorAssessment, riskAssessment, recommendation } = input;
    const lanes: RecommendationLanes = {
      recommended: [],
      saferAlternatives: [],
      higherRiskAllowed: [],
      whyRecommended: [],
    };

    // Build "Why this is recommended" explanations
    lanes.whyRecommended = this.buildWhyRecommended(corridorAssessment, riskAssessment, recommendation);

    // Primary recommendation
    lanes.recommended.push({
      action: recommendation.action,
      label: this.getActionLabel(recommendation.action),
      description: this.getActionDescription(recommendation.action, corridorAssessment),
      riskLevel: riskAssessment.overallRisk,
      conditions: recommendation.reasoning.map(r => r.evaluation),
      userChoiceAllowed: true,
    });

    // Safer alternatives
    if (recommendation.action !== RecommendedAction.PROCEED_WITH_ESCROW && recommendation.action !== RecommendedAction.DECLINE) {
      lanes.saferAlternatives.push({
        action: RecommendedAction.PROCEED_WITH_ESCROW,
        label: 'Use Escrow Protection',
        description: 'Funds held securely until delivery confirmed',
        riskLevel: RiskLevel.LOW,
        conditions: ['Payment protected', 'Delivery verification required'],
        userChoiceAllowed: true,
      });
    }

    if (recommendation.action === RecommendedAction.PROCEED) {
      lanes.saferAlternatives.push({
        action: RecommendedAction.REQUIRE_VERIFICATION,
        label: 'Request Additional Verification',
        description: 'Ask traveler for identity or delivery proof',
        riskLevel: RiskLevel.MINIMAL,
        conditions: ['Extra verification step', 'Higher confidence'],
        userChoiceAllowed: true,
      });
    }

    // Higher risk options (allowed if user chooses)
    if (recommendation.action !== RecommendedAction.PROCEED && recommendation.action !== RecommendedAction.DECLINE) {
      lanes.higherRiskAllowed.push({
        action: RecommendedAction.PROCEED,
        label: 'Proceed Without Protection',
        description: 'Continue without escrow or additional verification',
        riskLevel: RiskLevel.HIGH,
        conditions: ['User accepts full risk', 'No protection'],
        userChoiceAllowed: true,
      });
    }

    return lanes;
  }

  private buildWhyRecommended(
    corridor: CorridorAssessment,
    risk: RiskAssessmentResult,
    rec: DecisionRecommendationResult
  ): string[] {
    const reasons: string[] = [];

    // Trust-based reasons
    if (corridor.trustGating.passed) {
      reasons.push(`Both parties meet trust requirements (Buyer: ${corridor.trustGating.actualBuyerTrust}, Traveler: ${corridor.trustGating.actualTravelerTrust})`);
    } else {
      reasons.push(`Trust requirements not fully met: ${corridor.trustGating.downgradeReason}`);
    }

    // Risk-based reasons
    reasons.push(`Overall risk assessed as ${risk.overallRisk} (score: ${risk.riskScore}/100)`);

    // Corridor-specific reasons
    if (corridor.isSupported) {
      reasons.push(`${corridor.corridorName} is a supported corridor with ${corridor.valueBand.label} value band`);
    }

    // Escrow recommendation reason
    if (corridor.escrowRecommendation.recommended) {
      reasons.push(`Escrow recommended: ${corridor.escrowRecommendation.reason}`);
    }

    // Add risk flags as reasons
    risk.flags.forEach(flag => {
      reasons.push(`${flag.code}: ${flag.message}`);
    });

    return reasons;
  }

  private getActionLabel(action: RecommendedAction): string {
    const labels: Record<RecommendedAction, string> = {
      [RecommendedAction.PROCEED]: 'Proceed',
      [RecommendedAction.PROCEED_WITH_ESCROW]: 'Proceed with Escrow',
      [RecommendedAction.REQUIRE_VERIFICATION]: 'Verify First',
      [RecommendedAction.MANUAL_REVIEW]: 'Request Review',
      [RecommendedAction.DECLINE]: 'Not Recommended',
    };
    return labels[action];
  }

  private getActionDescription(action: RecommendedAction, corridor: CorridorAssessment): string {
    const descriptions: Record<RecommendedAction, string> = {
      [RecommendedAction.PROCEED]: 'Transaction can proceed with standard flow',
      [RecommendedAction.PROCEED_WITH_ESCROW]: `Escrow protection recommended for ${corridor.corridorName}`,
      [RecommendedAction.REQUIRE_VERIFICATION]: 'Additional verification needed before proceeding',
      [RecommendedAction.MANUAL_REVIEW]: 'This transaction requires manual review',
      [RecommendedAction.DECLINE]: 'This transaction is not recommended at this time',
    };
    return descriptions[action];
  }

  /**
   * Get human confirmation checkpoints
   * NO background actions - explicit user confirmation required
   */
  getConfirmationCheckpoints(input: {
    isCrossBorder: boolean;
    isContactingTraveler: boolean;
    isSelectingPayment: boolean;
  }): HumanConfirmationCheckpoint[] {
    const flags = getFeatureFlags();
    if (!flags.HUMAN_CONFIRMATION_CHECKPOINTS) {
      return [];
    }

    const checkpoints: HumanConfirmationCheckpoint[] = [];

    if (input.isContactingTraveler) {
      checkpoints.push({
        checkpointId: `confirm-contact-${Date.now()}`,
        type: 'CONTACT_TRAVELER',
        title: 'Contact Traveler',
        description: 'You are about to initiate contact with this traveler',
        requiredConfirmation: true,
        confirmationText: 'I understand I am contacting this traveler and sharing my request details',
        warnings: ['Your request details will be shared', 'Traveler will see your profile'],
      });
    }

    if (input.isSelectingPayment) {
      checkpoints.push({
        checkpointId: `confirm-payment-${Date.now()}`,
        type: 'SELECT_PAYMENT',
        title: 'Select Payment Method',
        description: 'Choose how you want to pay for this delivery',
        requiredConfirmation: true,
        confirmationText: 'I confirm my payment method selection',
        warnings: ['Review payment terms carefully', 'Escrow is recommended for cross-border'],
      });
    }

    if (input.isCrossBorder) {
      checkpoints.push({
        checkpointId: `confirm-crossborder-${Date.now()}`,
        type: 'PROCEED_CROSS_BORDER',
        title: 'Cross-Border Transaction',
        description: 'This is an international delivery with additional considerations',
        requiredConfirmation: true,
        confirmationText: 'I understand this is a cross-border transaction and accept the associated terms',
        warnings: [
          'Customs duties may apply',
          'Delivery times may vary',
          'Item restrictions may apply',
          'Escrow protection is recommended',
        ],
      });
    }

    return checkpoints;
  }

  /**
   * Create and store corridor snapshot for audit
   */
  createSnapshot(input: {
    requestId: string;
    intent: MarketIntentResult | null;
    buyerTrust: TrustScoreResult | null;
    travelerTrust: TrustScoreResult | null;
    risk: RiskAssessmentResult | null;
    recommendation: RecommendationLanes | null;
    corridor: CorridorAssessment | null;
  }): CorridorSnapshot {
    const snapshot: CorridorSnapshot = {
      requestId: input.requestId,
      correlationId: this.correlationId,
      timestamp: new Date().toISOString(),
      intentSnapshot: input.intent,
      trustSnapshot: { buyer: input.buyerTrust, traveler: input.travelerTrust },
      riskSnapshot: input.risk,
      recommendationSnapshot: input.recommendation,
      corridorAssessment: input.corridor,
    };

    snapshotStore.set(input.requestId, snapshot);

    // Keep only last 1000 snapshots
    if (snapshotStore.size > 1000) {
      const oldestKey = snapshotStore.keys().next().value;
      if (oldestKey) snapshotStore.delete(oldestKey);
    }

    return snapshot;
  }

  /**
   * Get snapshot by request ID
   */
  static getSnapshot(requestId: string): CorridorSnapshot | null {
    return snapshotStore.get(requestId) || null;
  }

  /**
   * Get all snapshots (for audit)
   */
  static getAllSnapshots(limit = 100): CorridorSnapshot[] {
    return Array.from(snapshotStore.values()).slice(-limit);
  }
