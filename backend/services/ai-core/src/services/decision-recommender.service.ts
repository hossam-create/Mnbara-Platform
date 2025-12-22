/**
 * Decision Recommender Service
 * Produces explainable recommendations based on intent, trust, and risk
 * Advisory only - NO execution, NO auto-actions
 */

import {
  DecisionRecommendation,
  RecommendedAction,
  ReasoningStep,
  AlternativeAction,
  GetRecommendationRequest,
  IntentType,
  TrustLevel,
  RiskLevel,
} from '../types/ai-core.types';

// Decision matrix: [RiskLevel][MinTrustLevel] -> RecommendedAction
const DECISION_MATRIX: Record<RiskLevel, Record<TrustLevel, RecommendedAction>> = {
  [RiskLevel.MINIMAL]: {
    [TrustLevel.VERIFIED]: RecommendedAction.PROCEED,
    [TrustLevel.TRUSTED]: RecommendedAction.PROCEED,
    [TrustLevel.STANDARD]: RecommendedAction.PROCEED,
    [TrustLevel.NEW]: RecommendedAction.PROCEED_WITH_CAUTION,
    [TrustLevel.RESTRICTED]: RecommendedAction.REQUIRE_VERIFICATION,
  },
  [RiskLevel.LOW]: {
    [TrustLevel.VERIFIED]: RecommendedAction.PROCEED,
    [TrustLevel.TRUSTED]: RecommendedAction.PROCEED,
    [TrustLevel.STANDARD]: RecommendedAction.PROCEED_WITH_CAUTION,
    [TrustLevel.NEW]: RecommendedAction.PROCEED_WITH_CAUTION,
    [TrustLevel.RESTRICTED]: RecommendedAction.REQUIRE_VERIFICATION,
  },
  [RiskLevel.MEDIUM]: {
    [TrustLevel.VERIFIED]: RecommendedAction.PROCEED_WITH_CAUTION,
    [TrustLevel.TRUSTED]: RecommendedAction.PROCEED_WITH_CAUTION,
    [TrustLevel.STANDARD]: RecommendedAction.REQUIRE_VERIFICATION,
    [TrustLevel.NEW]: RecommendedAction.REQUIRE_VERIFICATION,
    [TrustLevel.RESTRICTED]: RecommendedAction.MANUAL_REVIEW,
  },
  [RiskLevel.HIGH]: {
    [TrustLevel.VERIFIED]: RecommendedAction.PROCEED_WITH_CAUTION,
    [TrustLevel.TRUSTED]: RecommendedAction.REQUIRE_VERIFICATION,
    [TrustLevel.STANDARD]: RecommendedAction.REQUIRE_VERIFICATION,
    [TrustLevel.NEW]: RecommendedAction.MANUAL_REVIEW,
    [TrustLevel.RESTRICTED]: RecommendedAction.DECLINE,
  },
  [RiskLevel.CRITICAL]: {
    [TrustLevel.VERIFIED]: RecommendedAction.REQUIRE_VERIFICATION,
    [TrustLevel.TRUSTED]: RecommendedAction.MANUAL_REVIEW,
    [TrustLevel.STANDARD]: RecommendedAction.MANUAL_REVIEW,
    [TrustLevel.NEW]: RecommendedAction.DECLINE,
    [TrustLevel.RESTRICTED]: RecommendedAction.DECLINE,
  },
};

// Confidence adjustments based on data quality
const CONFIDENCE_FACTORS = {
  fullData: 1.0,
  partialData: 0.8,
  minimalData: 0.6,
};

export class DecisionRecommenderService {
  /**
   * Generate recommendation based on all available signals
   * Fully explainable - every decision has documented reasoning
   */
  recommend(request: GetRecommendationRequest): DecisionRecommendation {
    const reasoning: ReasoningStep[] = [];
    const warnings: string[] = [];
    let stepNumber = 1;

    // Step 1: Evaluate intent clarity
    const intentEval = this.evaluateIntent(request.intent);
    reasoning.push({
      step: stepNumber++,
      factor: 'Intent Classification',
      evaluation: intentEval.evaluation,
      impact: intentEval.impact,
    });
    if (intentEval.warning) warnings.push(intentEval.warning);

    // Step 2: Evaluate buyer trust
    const buyerTrustEval = this.evaluateTrust(request.trustScores.buyer, 'Buyer');
    reasoning.push({
      step: stepNumber++,
      factor: 'Buyer Trust Score',
      evaluation: buyerTrustEval.evaluation,
      impact: buyerTrustEval.impact,
    });
    if (buyerTrustEval.warning) warnings.push(buyerTrustEval.warning);

    // Step 3: Evaluate seller trust
    const sellerTrustEval = this.evaluateTrust(request.trustScores.seller, 'Seller');
    reasoning.push({
      step: stepNumber++,
      factor: 'Seller Trust Score',
      evaluation: sellerTrustEval.evaluation,
      impact: sellerTrustEval.impact,
    });
    if (sellerTrustEval.warning) warnings.push(sellerTrustEval.warning);

    // Step 4: Evaluate risk assessment
    const riskEval = this.evaluateRisk(request.riskAssessment.overallRisk);
    reasoning.push({
      step: stepNumber++,
      factor: 'Risk Assessment',
      evaluation: riskEval.evaluation,
      impact: riskEval.impact,
    });
    if (riskEval.warning) warnings.push(riskEval.warning);

    // Step 5: Evaluate transaction context
    const contextEval = this.evaluateContext(request.transactionContext);
    reasoning.push({
      step: stepNumber++,
      factor: 'Transaction Context',
      evaluation: contextEval.evaluation,
      impact: contextEval.impact,
    });
    if (contextEval.warning) warnings.push(contextEval.warning);

    // Determine primary recommendation
    const minTrustLevel = this.getMinTrustLevel(
      request.trustScores.buyer.level,
      request.trustScores.seller.level
    );
    const action = DECISION_MATRIX[request.riskAssessment.overallRisk][minTrustLevel];

    // Calculate confidence
    const confidence = this.calculateConfidence(request, reasoning);

    // Generate alternatives
    const alternatives = this.generateAlternatives(action, request);

    // Final reasoning step
    reasoning.push({
      step: stepNumber,
      factor: 'Final Decision',
      evaluation: `Based on ${reasoning.length - 1} factors, recommending: ${action}`,
      impact: 'NEUTRAL',
    });

    return {
      requestId: request.requestId,
      action,
      confidence,
      reasoning,
      alternatives,
      warnings,
      generatedAt: new Date().toISOString(),
    };
  }

  private evaluateIntent(intent: IntentType): {
    evaluation: string;
    impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    warning?: string;
  } {
    if (intent === IntentType.UNKNOWN) {
      return {
        evaluation: 'Intent could not be determined',
        impact: 'NEGATIVE',
        warning: 'Unclear user intent may indicate confusion or potential fraud',
      };
    }

    return {
      evaluation: `Clear ${intent} intent detected`,
      impact: 'POSITIVE',
    };
  }

  private evaluateTrust(
    trust: { score: number; level: TrustLevel },
    party: string
  ): {
    evaluation: string;
    impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    warning?: string;
  } {
    if (trust.level === TrustLevel.RESTRICTED) {
      return {
        evaluation: `${party} has restricted trust level (${trust.score})`,
        impact: 'NEGATIVE',
        warning: `${party} trust level requires additional verification`,
      };
    }

    if (trust.level === TrustLevel.NEW) {
      return {
        evaluation: `${party} is a new user (${trust.score})`,
        impact: 'NEUTRAL',
        warning: `${party} has limited transaction history`,
      };
    }

    if (trust.level === TrustLevel.VERIFIED) {
      return {
        evaluation: `${party} is fully verified (${trust.score})`,
        impact: 'POSITIVE',
      };
    }

    return {
      evaluation: `${party} trust level: ${trust.level} (${trust.score})`,
      impact: trust.score >= 60 ? 'POSITIVE' : 'NEUTRAL',
    };
  }

  private evaluateRisk(riskLevel: RiskLevel): {
    evaluation: string;
    impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    warning?: string;
  } {
    switch (riskLevel) {
      case RiskLevel.CRITICAL:
        return {
          evaluation: 'Critical risk level detected',
          impact: 'NEGATIVE',
          warning: 'Multiple high-risk factors present',
        };
      case RiskLevel.HIGH:
        return {
          evaluation: 'High risk level detected',
          impact: 'NEGATIVE',
          warning: 'Elevated risk requires additional safeguards',
        };
      case RiskLevel.MEDIUM:
        return {
          evaluation: 'Moderate risk level',
          impact: 'NEUTRAL',
        };
      case RiskLevel.LOW:
        return {
          evaluation: 'Low risk level',
          impact: 'POSITIVE',
        };
      case RiskLevel.MINIMAL:
        return {
          evaluation: 'Minimal risk detected',
          impact: 'POSITIVE',
        };
    }
  }

  private evaluateContext(context: {
    amount?: number;
    currency?: string;
    itemCategory?: string;
  }): {
    evaluation: string;
    impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    warning?: string;
  } {
    const issues: string[] = [];

    if (!context.amount) {
      issues.push('amount missing');
    } else if (context.amount > 10000) {
      issues.push('high value transaction');
    }

    if (!context.itemCategory) {
      issues.push('category unknown');
    }

    if (issues.length === 0) {
      return {
        evaluation: 'Transaction context is complete and standard',
        impact: 'POSITIVE',
      };
    }

    if (issues.length >= 2) {
      return {
        evaluation: `Context issues: ${issues.join(', ')}`,
        impact: 'NEGATIVE',
        warning: 'Incomplete or unusual transaction context',
      };
    }

    return {
      evaluation: `Minor context note: ${issues.join(', ')}`,
      impact: 'NEUTRAL',
    };
  }

  private getMinTrustLevel(level1: TrustLevel, level2: TrustLevel): TrustLevel {
    const order = [
      TrustLevel.RESTRICTED,
      TrustLevel.NEW,
      TrustLevel.STANDARD,
      TrustLevel.TRUSTED,
      TrustLevel.VERIFIED,
    ];
    const idx1 = order.indexOf(level1);
    const idx2 = order.indexOf(level2);
    return order[Math.min(idx1, idx2)];
  }

  private calculateConfidence(
    request: GetRecommendationRequest,
    reasoning: ReasoningStep[]
  ): number {
    let baseConfidence = 0.9;

    // Reduce confidence for negative factors
    const negativeCount = reasoning.filter((r) => r.impact === 'NEGATIVE').length;
    baseConfidence -= negativeCount * 0.1;

    // Reduce confidence for missing data
    if (!request.transactionContext.amount) baseConfidence -= 0.1;
    if (!request.transactionContext.itemCategory) baseConfidence -= 0.05;

    // Boost confidence for positive factors
    const positiveCount = reasoning.filter((r) => r.impact === 'POSITIVE').length;
    baseConfidence += positiveCount * 0.02;

    return Math.min(0.99, Math.max(0.3, baseConfidence));
  }

  private generateAlternatives(
    primaryAction: RecommendedAction,
    request: GetRecommendationRequest
  ): AlternativeAction[] {
    const alternatives: AlternativeAction[] = [];

    switch (primaryAction) {
      case RecommendedAction.DECLINE:
        alternatives.push({
          action: RecommendedAction.MANUAL_REVIEW,
          conditions: ['If buyer provides additional verification', 'If seller vouches for buyer'],
          tradeoffs: ['Increased operational cost', 'Delayed transaction'],
        });
        break;

      case RecommendedAction.MANUAL_REVIEW:
        alternatives.push({
          action: RecommendedAction.REQUIRE_VERIFICATION,
          conditions: ['If automated verification passes', 'If risk score improves'],
          tradeoffs: ['May miss edge cases', 'Relies on verification accuracy'],
        });
        alternatives.push({
          action: RecommendedAction.DECLINE,
          conditions: ['If verification fails', 'If additional red flags emerge'],
          tradeoffs: ['Lost transaction', 'Potential false positive'],
        });
        break;

      case RecommendedAction.REQUIRE_VERIFICATION:
        alternatives.push({
          action: RecommendedAction.PROCEED_WITH_CAUTION,
          conditions: ['If user has verified phone', 'If transaction amount is reduced'],
          tradeoffs: ['Slightly higher risk', 'Better user experience'],
        });
        break;

      case RecommendedAction.PROCEED_WITH_CAUTION:
        alternatives.push({
          action: RecommendedAction.PROCEED,
          conditions: ['If escrow is used', 'If buyer protection is enabled'],
          tradeoffs: ['Minimal additional risk', 'Faster completion'],
        });
        break;

      case RecommendedAction.PROCEED:
        // No alternatives needed for proceed
        break;
    }

    return alternatives;
  }
}

export const decisionRecommenderService = new DecisionRecommenderService();
