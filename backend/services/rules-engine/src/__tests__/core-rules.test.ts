import { RulesEngine } from '../services/RulesEngine.service';
import { RuleContext, RuleResult, RuleSeverity } from '../types/Rule.types';
import { coreRules } from '../rules/core';
import { ruleThresholds, reloadRuleThresholds } from '../config/rule.config';

describe('Core Rules', () => {
  let rulesEngine: RulesEngine;

  beforeEach(() => {
    rulesEngine = new RulesEngine();
    // Register all core rules
    coreRules.forEach(rule => rulesEngine.registerRule(rule));
  });

  afterEach(() => {
    // Reset configuration to defaults
    reloadRuleThresholds();
  });

  describe('USER_MAX_ACTIVE_BIDS Rule', () => {
    it('should allow user within active bid limit', async () => {
      const context: RuleContext = {
        actor: {
          id: 'user-1',
          type: 'USER',
          metadata: { ['activeBids']: 5 }
        },
        target: { id: 'auction-1', type: 'AUCTION' },
        action: { type: 'BID' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      const bidRule = result.results.find(r => r.ruleId === 'USER_MAX_ACTIVE_BIDS');

      expect(bidRule?.result).toBe(RuleResult.ALLOW);
      expect(bidRule?.reason).toContain('within the maximum allowed');
      expect(bidRule?.metadata?.currentActiveBids).toBe(5);
    });

    it('should flag user exceeding active bid limit', async () => {
      const context: RuleContext = {
        actor: {
          id: 'user-1',
          type: 'USER',
          metadata: { ['activeBids']: 15 }
        },
        target: { id: 'auction-1', type: 'AUCTION' },
        action: { type: 'BID' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      const bidRule = result.results.find(r => r.ruleId === 'USER_MAX_ACTIVE_BIDS');

      expect(bidRule?.result).toBe(RuleResult.FLAG);
      expect(bidRule?.reason).toContain('exceeding the maximum allowed');
      expect(bidRule?.metadata?.excessBids).toBe(5);
      expect(bidRule?.severity).toBe(ruleThresholds.USER_MAX_ACTIVE_BIDS.severity);
    });

    it('should use default values when metadata is missing', async () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'auction-1', type: 'AUCTION' },
        action: { type: 'BID' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      const bidRule = result.results.find(r => r.ruleId === 'USER_MAX_ACTIVE_BIDS');

      expect(bidRule?.result).toBe(RuleResult.ALLOW);
      expect(bidRule?.metadata?.currentActiveBids).toBe(0);
    });
  });

  describe('TRAVELER_MAX_PENDING_REQUESTS Rule', () => {
    it('should allow traveler within pending request limit', async () => {
      const context: RuleContext = {
        actor: {
          id: 'traveler-1',
          type: 'USER',
          metadata: { ['pendingRequests']: 3 }
        },
        target: { id: 'request-1', type: 'USER' },
        action: { type: 'REGISTER' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      const requestRule = result.results.find(r => r.ruleId === 'TRAVELER_MAX_PENDING_REQUESTS');

      expect(requestRule?.result).toBe(RuleResult.ALLOW);
      expect(requestRule?.reason).toContain('within the maximum allowed');
      expect(requestRule?.metadata?.currentPendingRequests).toBe(3);
    });

    it('should deny traveler exceeding pending request limit', async () => {
      const context: RuleContext = {
        actor: {
          id: 'traveler-1',
          type: 'USER',
          metadata: { ['pendingRequests']: 7 }
        },
        target: { id: 'request-1', type: 'USER' },
        action: { type: 'REGISTER' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      const requestRule = result.results.find(r => r.ruleId === 'TRAVELER_MAX_PENDING_REQUESTS');

      expect(requestRule?.result).toBe(RuleResult.DENY);
      expect(requestRule?.reason).toContain('exceeding the maximum allowed');
      expect(requestRule?.metadata?.excessRequests).toBe(2);
      expect(requestRule?.severity).toBe(ruleThresholds.TRAVELER_MAX_PENDING_REQUESTS.severity);
    });

    it('should deny traveler at exactly the limit', async () => {
      const context: RuleContext = {
        actor: {
          id: 'traveler-1',
          type: 'USER',
          metadata: { ['pendingRequests']: 5 }
        },
        target: { id: 'request-1', type: 'USER' },
        action: { type: 'REGISTER' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      const requestRule = result.results.find(r => r.ruleId === 'TRAVELER_MAX_PENDING_REQUESTS');

      expect(requestRule?.result).toBe(RuleResult.DENY);
      expect(requestRule?.reason).toContain('exceeding the maximum allowed');
    });
  });

  describe('SELLER_LISTING_RATE_LIMIT Rule', () => {
    it('should allow seller within hourly and daily limits', async () => {
      const context: RuleContext = {
        actor: {
          id: 'seller-1',
          type: 'USER',
          metadata: {
            ['listingsLastHour']: 3,
            ['listingsLastDay']: 20
          }
        },
        target: { id: 'listing-1', type: 'LISTING' },
        action: { type: 'LIST' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      const listingRule = result.results.find(r => r.ruleId === 'SELLER_LISTING_RATE_LIMIT');

      expect(listingRule?.result).toBe(RuleResult.ALLOW);
      expect(listingRule?.reason).toContain('within limits');
      expect(listingRule?.metadata?.remainingHourly).toBe(2);
      expect(listingRule?.metadata?.remainingDaily).toBe(30);
    });

    it('should flag seller exceeding hourly limit', async () => {
      const context: RuleContext = {
        actor: {
          id: 'seller-1',
          type: 'USER',
          metadata: {
            ['listingsLastHour']: 8,
            ['listingsLastDay']: 20
          }
        },
        target: { id: 'listing-1', type: 'LISTING' },
        action: { type: 'LIST' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      const listingRule = result.results.find(r => r.ruleId === 'SELLER_LISTING_RATE_LIMIT');

      expect(listingRule?.result).toBe(RuleResult.FLAG);
      expect(listingRule?.reason).toContain('in the last hour, exceeding');
      expect(listingRule?.metadata?.violationType).toBe('HOURLY');
      expect(listingRule?.metadata?.excessHourly).toBe(3);
    });

    it('should flag seller exceeding daily limit', async () => {
      const context: RuleContext = {
        actor: {
          id: 'seller-1',
          type: 'USER',
          metadata: {
            ['listingsLastHour']: 3,
            ['listingsLastDay']: 60
          }
        },
        target: { id: 'listing-1', type: 'LISTING' },
        action: { type: 'LIST' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      const listingRule = result.results.find(r => r.ruleId === 'SELLER_LISTING_RATE_LIMIT');

      expect(listingRule?.result).toBe(RuleResult.FLAG);
      expect(listingRule?.reason).toContain('in the last day, exceeding');
      expect(listingRule?.metadata?.violationType).toBe('DAILY');
      expect(listingRule?.metadata?.excessDaily).toBe(10);
    });

    it('should prioritize hourly violation over daily violation', async () => {
      const context: RuleContext = {
        actor: {
          id: 'seller-1',
          type: 'USER',
          metadata: {
            ['listingsLastHour']: 8,
            ['listingsLastDay']: 60
          }
        },
        target: { id: 'listing-1', type: 'LISTING' },
        action: { type: 'LIST' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      const listingRule = result.results.find(r => r.ruleId === 'SELLER_LISTING_RATE_LIMIT');

      expect(listingRule?.result).toBe(RuleResult.FLAG);
      expect(listingRule?.metadata?.violationType).toBe('HOURLY');
    });
  });

  describe('PAYMENT_RETRY_LIMIT Rule', () => {
    it('should allow payment within retry limit', async () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'payment-1', type: 'PAYMENT' },
        action: {
          type: 'PAY',
          metadata: { ['retryCount']: 2 }
        },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      const paymentRule = result.results.find(r => r.ruleId === 'PAYMENT_RETRY_LIMIT');

      expect(paymentRule?.result).toBe(RuleResult.ALLOW);
      expect(paymentRule?.reason).toContain('within the maximum allowed');
      expect(paymentRule?.metadata?.remainingRetries).toBe(1);
    });

    it('should deny payment exceeding retry limit', async () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'payment-1', type: 'PAYMENT' },
        action: {
          type: 'PAY',
          metadata: { ['retryCount']: 5 }
        },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      const paymentRule = result.results.find(r => r.ruleId === 'PAYMENT_RETRY_LIMIT');

      expect(paymentRule?.result).toBe(RuleResult.DENY);
      expect(paymentRule?.reason).toContain('exceeding the maximum allowed');
      expect(paymentRule?.metadata?.excessRetries).toBe(2);
      expect(paymentRule?.severity).toBe(ruleThresholds.PAYMENT_RETRY_LIMIT.severity);
    });

    it('should reset retry count outside time window', async () => {
      const firstAttempt = new Date();
      firstAttempt.setHours(firstAttempt.getHours() - 2); // 2 hours ago

      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'payment-1', type: 'PAYMENT' },
        action: {
          type: 'PAY',
          metadata: {
            ['retryCount']: 5,
            ['firstAttemptTime']: firstAttempt.toISOString()
          }
        },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      const paymentRule = result.results.find(r => r.ruleId === 'PAYMENT_RETRY_LIMIT');

      expect(paymentRule?.result).toBe(RuleResult.ALLOW);
      expect(paymentRule?.metadata?.retriesWithinWindow).toBe(0);
    });

    it('should use default values when metadata is missing', async () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'payment-1', type: 'PAYMENT' },
        action: { type: 'PAY' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      const paymentRule = result.results.find(r => r.ruleId === 'PAYMENT_RETRY_LIMIT');

      expect(paymentRule?.result).toBe(RuleResult.ALLOW);
      expect(paymentRule?.metadata?.currentRetries).toBe(0);
    });
  });

  describe('Configuration Integration', () => {
    it('should use configured thresholds', async () => {
      // Test that rules use the configured thresholds
      const context: RuleContext = {
        actor: {
          id: 'user-1',
          type: 'USER',
          metadata: {
            ['activeBids']: 11,
            ['pendingRequests']: 6
          }
        },
        target: { id: 'target-1', type: 'USER' },
        action: { type: 'BID' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      
      const bidRule = result.results.find(r => r.ruleId === 'USER_MAX_ACTIVE_BIDS');
      const requestRule = result.results.find(r => r.ruleId === 'TRAVELER_MAX_PENDING_REQUESTS');

      expect(bidRule?.result).toBe(RuleResult.FLAG);
      expect(requestRule?.result).toBe(RuleResult.DENY);
    });

    it('should handle missing metadata gracefully', async () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'target-1', type: 'USER' },
        action: { type: 'BID' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      
      // All rules should handle missing metadata gracefully
      result.results.forEach(ruleResult => {
        expect(ruleResult.result).toBeDefined();
        expect(ruleResult.reason).toBeDefined();
        expect(ruleResult.evaluatedAt).toBeInstanceOf(Date);
      });
    });
  });
});
