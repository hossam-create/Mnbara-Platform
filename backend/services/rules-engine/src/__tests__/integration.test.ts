import { RulesEngine } from '../services/RulesEngine.service';
import { RulesIntegration } from '../services/RulesIntegration.service';
import { coreRules } from '../rules/core';
import { RuleResult } from '../types/Rule.types';

describe('Rules Integration Service', () => {
  let rulesEngine: RulesEngine;
  let integration: RulesIntegration;

  beforeEach(() => {
    rulesEngine = new RulesEngine();
    coreRules.forEach(rule => rulesEngine.registerRule(rule));
    integration = new RulesIntegration(rulesEngine);
  });

  describe('BID PLACEMENT Integration', () => {
    it('should allow bid within limits', async () => {
      const result = await integration.checkBidPlacement(
        'user-1',
        'auction-1',
        500,
        { ['activeBids']: 5 }
      );

      expect(result.decision).toBe('ALLOW');
      expect(result.shouldBlock).toBe(false);
      expect(result.shouldReview).toBe(false);
      expect(result.reason).toContain('Action allowed');
    });

    it('should flag bid exceeding active bid limit', async () => {
      const result = await integration.checkBidPlacement(
        'user-1',
        'auction-1',
        500,
        { ['activeBids']: 15 }
      );

      expect(result.decision).toBe('FLAG');
      expect(result.shouldBlock).toBe(false);
      expect(result.shouldReview).toBe(true);
      expect(result.reason).toContain('flagged for review');
    });

    it('should handle missing user metadata gracefully', async () => {
      const result = await integration.checkBidPlacement(
        'user-1',
        'auction-1',
        500
      );

      expect(result.decision).toBe('ALLOW');
      expect(result.shouldBlock).toBe(false);
      expect(result.shouldReview).toBe(false);
    });
  });

  describe('TRAVELER REQUEST ACCEPTANCE Integration', () => {
    it('should allow traveler request within limits', async () => {
      const result = await integration.checkTravelerRequest(
        'traveler-1',
        'request-1',
        'ACCOMMODATION',
        { ['pendingRequests']: 3 }
      );

      expect(result.decision).toBe('ALLOW');
      expect(result.shouldBlock).toBe(false);
      expect(result.shouldReview).toBe(false);
    });

    it('should deny traveler request exceeding pending request limit', async () => {
      const result = await integration.checkTravelerRequest(
        'traveler-1',
        'request-1',
        'ACCOMMODATION',
        { ['pendingRequests']: 7 }
      );

      expect(result.decision).toBe('DENY');
      expect(result.shouldBlock).toBe(true);
      expect(result.shouldReview).toBe(false);
      expect(result.reason).toContain('Action blocked');
    });

    it('should deny traveler request at exactly the limit', async () => {
      const result = await integration.checkTravelerRequest(
        'traveler-1',
        'request-1',
        'ACCOMMODATION',
        { ['pendingRequests']: 5 }
      );

      expect(result.decision).toBe('DENY');
      expect(result.shouldBlock).toBe(true);
      expect(result.shouldReview).toBe(false);
    });
  });

  describe('SELLER LISTING CREATION Integration', () => {
    it('should allow listing creation within limits', async () => {
      const result = await integration.checkSellerListing(
        'seller-1',
        {
          id: 'listing-1',
          category: 'electronics',
          price: 1000,
          title: 'Smartphone'
        },
        {
          ['listingsLastHour']: 2,
          ['listingsLastDay']: 20
        }
      );

      expect(result.decision).toBe('ALLOW');
      expect(result.shouldBlock).toBe(false);
      expect(result.shouldReview).toBe(false);
    });

    it('should flag listing exceeding hourly limit', async () => {
      const result = await integration.checkSellerListing(
        'seller-1',
        {
          id: 'listing-1',
          category: 'electronics',
          price: 1000,
          title: 'Smartphone'
        },
        {
          ['listingsLastHour']: 8,
          ['listingsLastDay']: 20
        }
      );

      expect(result.decision).toBe('FLAG');
      expect(result.shouldBlock).toBe(false);
      expect(result.shouldReview).toBe(true);
      expect(result.reason).toContain('flagged for review');
    });

    it('should flag listing exceeding daily limit', async () => {
      const result = await integration.checkSellerListing(
        'seller-1',
        {
          id: 'listing-1',
          category: 'electronics',
          price: 1000,
          title: 'Smartphone'
        },
        {
          ['listingsLastHour']: 2,
          ['listingsLastDay']: 60
        }
      );

      expect(result.decision).toBe('FLAG');
      expect(result.shouldBlock).toBe(false);
      expect(result.shouldReview).toBe(true);
      expect(result.reason).toContain('flagged for review');
    });
  });

  describe('PAYMENT RETRY ATTEMPT Integration', () => {
    it('should allow payment within retry limit', async () => {
      const result = await integration.checkPaymentRetry(
        'user-1',
        'payment-1',
        2
      );

      expect(result.decision).toBe('ALLOW');
      expect(result.shouldBlock).toBe(false);
      expect(result.shouldReview).toBe(false);
    });

    it('should deny payment exceeding retry limit', async () => {
      const result = await integration.checkPaymentRetry(
        'user-1',
        'payment-1',
        5
      );

      expect(result.decision).toBe('DENY');
      expect(result.shouldBlock).toBe(true);
      expect(result.shouldReview).toBe(false);
      expect(result.reason).toContain('Action blocked');
    });

    it('should reset retry count outside time window', async () => {
      const firstAttempt = new Date();
      firstAttempt.setHours(firstAttempt.getHours() - 2); // 2 hours ago

      const result = await integration.checkPaymentRetry(
        'user-1',
        'payment-1',
        5,
        firstAttempt.toISOString()
      );

      expect(result.decision).toBe('ALLOW');
      expect(result.shouldBlock).toBe(false);
      expect(result.shouldReview).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should default to ALLOW on rules engine error', async () => {
      // Create a mock rules engine that throws an error
      const faultyEngine = {
        evaluate: jest.fn().mockRejectedValue(new Error('Rules engine failed'))
      } as any;

      const faultyIntegration = new RulesIntegration(faultyEngine);

      const result = await faultyIntegration.checkBidPlacement('user-1', 'auction-1', 500);

      expect(result.decision).toBe('ALLOW');
      expect(result.shouldBlock).toBe(false);
      expect(result.shouldReview).toBe(false);
      expect(result.reason).toContain('allowing by default');
    });

    it('should handle malformed context gracefully', async () => {
      // Test with undefined/null values
      const result = await integration.checkBidPlacement(
        undefined as any,
        undefined as any,
        undefined as any,
        undefined as any
      );

      expect(result.decision).toBe('ALLOW');
      expect(result.shouldBlock).toBe(false);
      expect(result.shouldReview).toBe(false);
    });
  });

  describe('Integration Result Structure', () => {
    it('should return properly structured result', async () => {
      const result = await integration.checkBidPlacement('user-1', 'auction-1', 500);

      expect(result).toHaveProperty('decision');
      expect(result).toHaveProperty('shouldBlock');
      expect(result).toHaveProperty('shouldReview');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('reason');

      expect(typeof result.decision).toBe('string');
      expect(typeof result.shouldBlock).toBe('boolean');
      expect(typeof result.shouldReview).toBe('boolean');
      expect(typeof result.reason).toBe('string');

      expect(result.summary).toHaveProperty('context');
      expect(result.summary).toHaveProperty('results');
      expect(result.summary).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('finalDecision');
      expect(result.summary).toHaveProperty('evaluatedAt');
    });
  });

  describe('Logging Integration', () => {
    it('should log integration checks', async () => {
      const logSpy = jest.spyOn(require('../services/RuleLogger.service').ruleLogger, 'logIntegrationCheck');

      await integration.checkBidPlacement('user-1', 'auction-1', 500);

      expect(logSpy).toHaveBeenCalledWith(
        'BID_PLACEMENT',
        expect.any(Object),
        expect.any(Object),
        expect.any(String)
      );

      logSpy.mockRestore();
    });

    it('should provide log statistics', () => {
      const stats = integration.getLogStats();

      expect(stats).toHaveProperty('logFilePath');
      expect(stats).toHaveProperty('currentSize');
      expect(stats).toHaveProperty('maxSize');

      expect(typeof stats.logFilePath).toBe('string');
      expect(typeof stats.currentSize).toBe('number');
      expect(typeof stats.maxSize).toBe('number');
    });
  });

  describe('Decision Logic', () => {
    it('should block actions with DENY result', async () => {
      // Create a context that will trigger DENY
      const result = await integration.checkTravelerRequest(
        'traveler-1',
        'request-1',
        'ACCOMMODATION',
        { ['pendingRequests']: 10 }
      );

      expect(result.decision).toBe('DENY');
      expect(result.shouldBlock).toBe(true);
      expect(result.shouldReview).toBe(false);
    });

    it('should flag but allow actions with FLAG result', async () => {
      // Create a context that will trigger FLAG
      const result = await integration.checkBidPlacement(
        'user-1',
        'auction-1',
        500,
        { ['activeBids']: 15 }
      );

      expect(result.decision).toBe('FLAG');
      expect(result.shouldBlock).toBe(false);
      expect(result.shouldReview).toBe(true);
    });

    it('should allow actions with ALLOW result', async () => {
      // Create a context that will trigger ALLOW
      const result = await integration.checkBidPlacement(
        'user-1',
        'auction-1',
        500,
        { ['activeBids']: 3 }
      );

      expect(result.decision).toBe('ALLOW');
      expect(result.shouldBlock).toBe(false);
      expect(result.shouldReview).toBe(false);
    });
  });
});
