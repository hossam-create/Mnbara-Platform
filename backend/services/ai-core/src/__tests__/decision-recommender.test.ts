/**
 * Decision Recommender Service Tests
 * Verifies explainable recommendations
 */

import { decisionRecommenderService } from '../services/decision-recommender.service';
import {
  GetRecommendationRequest,
  IntentType,
  TrustLevel,
  RiskLevel,
  RecommendedAction,
} from '../types/ai-core.types';

describe('DecisionRecommenderService', () => {
  const baseRequest: GetRecommendationRequest = {
    requestId: 'req-123',
    userId: 'user-1',
    intent: IntentType.BUY,
    transactionContext: {
      itemId: 'item-1',
      itemCategory: 'clothing',
      amount: 500,
      currency: 'USD',
    },
    trustScores: {
      buyer: {
        userId: 'buyer-1',
        score: 75,
        level: TrustLevel.TRUSTED,
        factors: [],
        computedAt: new Date().toISOString(),
      },
      seller: {
        userId: 'seller-1',
        score: 80,
        level: TrustLevel.VERIFIED,
        factors: [],
        computedAt: new Date().toISOString(),
      },
    },
    riskAssessment: {
      transactionId: 'txn-123',
      overallRisk: RiskLevel.LOW,
      riskScore: 25,
      factors: [],
      flags: [],
      assessedAt: new Date().toISOString(),
    },
  };

  describe('recommend', () => {
    it('should recommend PROCEED for low risk, high trust', () => {
      const result = decisionRecommenderService.recommend(baseRequest);

      expect(result.action).toBe(RecommendedAction.PROCEED);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should recommend DECLINE for critical risk, restricted trust', () => {
      const highRiskRequest: GetRecommendationRequest = {
        ...baseRequest,
        trustScores: {
          buyer: {
            ...baseRequest.trustScores.buyer,
            score: 15,
            level: TrustLevel.RESTRICTED,
          },
          seller: baseRequest.trustScores.seller,
        },
        riskAssessment: {
          ...baseRequest.riskAssessment,
          overallRisk: RiskLevel.CRITICAL,
          riskScore: 85,
        },
      };

      const result = decisionRecommenderService.recommend(highRiskRequest);

      expect(result.action).toBe(RecommendedAction.DECLINE);
    });

    it('should recommend MANUAL_REVIEW for high risk, new user', () => {
      const reviewRequest: GetRecommendationRequest = {
        ...baseRequest,
        trustScores: {
          buyer: {
            ...baseRequest.trustScores.buyer,
            score: 25,
            level: TrustLevel.NEW,
          },
          seller: baseRequest.trustScores.seller,
        },
        riskAssessment: {
          ...baseRequest.riskAssessment,
          overallRisk: RiskLevel.HIGH,
          riskScore: 65,
        },
      };

      const result = decisionRecommenderService.recommend(reviewRequest);

      expect(result.action).toBe(RecommendedAction.MANUAL_REVIEW);
    });

    it('should include reasoning steps', () => {
      const result = decisionRecommenderService.recommend(baseRequest);

      expect(result.reasoning.length).toBeGreaterThan(0);
      expect(result.reasoning[0].step).toBe(1);

      for (const step of result.reasoning) {
        expect(step.factor).toBeDefined();
        expect(step.evaluation).toBeDefined();
        expect(['POSITIVE', 'NEUTRAL', 'NEGATIVE']).toContain(step.impact);
      }
    });

    it('should include alternatives for non-PROCEED actions', () => {
      const reviewRequest: GetRecommendationRequest = {
        ...baseRequest,
        riskAssessment: {
          ...baseRequest.riskAssessment,
          overallRisk: RiskLevel.MEDIUM,
          riskScore: 45,
        },
      };

      const result = decisionRecommenderService.recommend(reviewRequest);

      if (result.action !== RecommendedAction.PROCEED) {
        expect(result.alternatives.length).toBeGreaterThan(0);
        for (const alt of result.alternatives) {
          expect(alt.conditions.length).toBeGreaterThan(0);
          expect(alt.tradeoffs.length).toBeGreaterThan(0);
        }
      }
    });

    it('should include warnings for negative factors', () => {
      const warningRequest: GetRecommendationRequest = {
        ...baseRequest,
        intent: IntentType.UNKNOWN,
        trustScores: {
          buyer: {
            ...baseRequest.trustScores.buyer,
            score: 15,
            level: TrustLevel.RESTRICTED,
          },
          seller: baseRequest.trustScores.seller,
        },
      };

      const result = decisionRecommenderService.recommend(warningRequest);

      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should be deterministic', () => {
      const result1 = decisionRecommenderService.recommend(baseRequest);
      const result2 = decisionRecommenderService.recommend(baseRequest);

      expect(result1.action).toBe(result2.action);
      expect(result1.confidence).toBe(result2.confidence);
      expect(result1.reasoning).toEqual(result2.reasoning);
    });

    it('should include advisory disclaimer in meta', () => {
      const result = decisionRecommenderService.recommend(baseRequest);

      expect(result.requestId).toBe('req-123');
      expect(result.generatedAt).toBeDefined();
    });

    it('should reduce confidence for missing data', () => {
      const incompleteRequest: GetRecommendationRequest = {
        ...baseRequest,
        transactionContext: {
          itemId: 'item-1',
          // Missing amount and category
        },
      };

      const completeResult = decisionRecommenderService.recommend(baseRequest);
      const incompleteResult = decisionRecommenderService.recommend(incompleteRequest);

      expect(incompleteResult.confidence).toBeLessThan(completeResult.confidence);
    });

    it('should evaluate all trust levels correctly', () => {
      const trustLevels = [
        TrustLevel.VERIFIED,
        TrustLevel.TRUSTED,
        TrustLevel.STANDARD,
        TrustLevel.NEW,
        TrustLevel.RESTRICTED,
      ];

      for (const level of trustLevels) {
        const request: GetRecommendationRequest = {
          ...baseRequest,
          trustScores: {
            buyer: {
              ...baseRequest.trustScores.buyer,
              level,
              score: level === TrustLevel.VERIFIED ? 85 : level === TrustLevel.RESTRICTED ? 10 : 50,
            },
            seller: baseRequest.trustScores.seller,
          },
        };

        const result = decisionRecommenderService.recommend(request);

        expect(result.action).toBeDefined();
        expect(result.reasoning.length).toBeGreaterThan(0);
      }
    });
  });
});
