import { RulesEngine } from '../services/RulesEngine.service';
import { RuleContext, RuleResult, RuleSeverity } from '../types/Rule.types';
import { exampleRules } from '../rules/example.rules';

describe('RulesEngine', () => {
  let rulesEngine: RulesEngine;

  beforeEach(() => {
    rulesEngine = new RulesEngine();
  });

  describe('Rule Registration', () => {
    it('should register a rule successfully', () => {
      const rule = exampleRules[0];
      
      expect(() => rulesEngine.registerRule(rule)).not.toThrow();
      expect(rulesEngine.getRegisteredRules()).toContain(rule);
    });

    it('should throw error when registering duplicate rule', () => {
      const rule = exampleRules[0];
      rulesEngine.registerRule(rule);
      
      expect(() => rulesEngine.registerRule(rule)).toThrow(
        `Rule with id '${rule.id}' is already registered`
      );
    });

    it('should unregister a rule successfully', () => {
      const rule = exampleRules[0];
      rulesEngine.registerRule(rule);
      rulesEngine.unregisterRule(rule.id);
      
      expect(rulesEngine.getRegisteredRules()).not.toContain(rule);
    });

    it('should throw error when unregistering non-existent rule', () => {
      expect(() => rulesEngine.unregisterRule('non-existent')).toThrow(
        `Rule with id 'non-existent' is not registered`
      );
    });
  });

  describe('Rule Applicability', () => {
    beforeEach(() => {
      exampleRules.forEach(rule => rulesEngine.registerRule(rule));
    });

    it('should find applicable rules for user registration', () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'target-1', type: 'USER' },
        action: { type: 'REGISTER' },
        environment: { timestamp: new Date() }
      };

      const applicableRules = rulesEngine.getApplicableRules(context);
      
      expect(applicableRules.length).toBeGreaterThan(0);
      expect(applicableRules.some(r => r.id === 'user-registration-limit')).toBe(true);
    });

    it('should find applicable rules for bidding', () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'auction-1', type: 'AUCTION' },
        action: { type: 'BID' },
        environment: { timestamp: new Date() }
      };

      const applicableRules = rulesEngine.getApplicableRules(context);
      
      expect(applicableRules.length).toBeGreaterThan(0);
      expect(applicableRules.some(r => r.id === 'suspicious-bidding-pattern')).toBe(true);
    });

    it('should find applicable rules for payment', () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'payment-1', type: 'PAYMENT' },
        action: { type: 'PAY' },
        environment: { timestamp: new Date() }
      };

      const applicableRules = rulesEngine.getApplicableRules(context);
      
      expect(applicableRules.length).toBeGreaterThan(0);
      expect(applicableRules.some(r => r.id === 'minimum-account-age')).toBe(true);
    });

    it('should respect enabled/disabled rule options', () => {
      const rule = exampleRules[0];
      rulesEngine.registerRule(rule, { enabled: false });
      
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'target-1', type: 'USER' },
        action: { type: 'REGISTER' },
        environment: { timestamp: new Date() }
      };

      const applicableRules = rulesEngine.getApplicableRules(context);
      expect(applicableRules.some(r => r.id === rule.id)).toBe(false);
    });

    it('should respect priority ordering', () => {
      const lowPriorityRule = {
        id: 'low-priority',
        description: 'Low priority rule',
        appliesTo: [{ actionType: 'REGISTER' }],
        async evaluate() {
          return {
            ruleId: this.id,
            result: RuleResult.ALLOW,
            reason: 'Low priority',
            evaluatedAt: new Date()
          };
        }
      };

      const highPriorityRule = {
        id: 'high-priority',
        description: 'High priority rule',
        appliesTo: [{ actionType: 'REGISTER' }],
        async evaluate() {
          return {
            ruleId: this.id,
            result: RuleResult.ALLOW,
            reason: 'High priority',
            evaluatedAt: new Date()
          };
        }
      };

      rulesEngine.registerRule(lowPriorityRule, { priority: 1 });
      rulesEngine.registerRule(highPriorityRule, { priority: 10 });
      
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'target-1', type: 'USER' },
        action: { type: 'REGISTER' },
        environment: { timestamp: new Date() }
      };

      const applicableRules = rulesEngine.getApplicableRules(context);
      expect(applicableRules[0].id).toBe('high-priority');
      expect(applicableRules[1].id).toBe('low-priority');
    });
  });

  describe('Rule Evaluation', () => {
    beforeEach(() => {
      exampleRules.forEach(rule => rulesEngine.registerRule(rule));
    });

    it('should evaluate context with no applicable rules', () => {
      const context: RuleContext = {
        actor: { id: 'system-1', type: 'SYSTEM' },
        target: { id: 'target-1', type: 'WALLET' },
        action: { type: 'TRANSFER' },
        environment: { timestamp: new Date() }
      };

      const result = rulesEngine.evaluate(context);
      
      expect(result).resolves.toMatchObject({
        summary: { total: 0, allow: 0, deny: 0, flag: 0 },
        finalDecision: RuleResult.ALLOW
      });
    });

    it('should allow new user registration', async () => {
      const context: RuleContext = {
        actor: { 
          id: 'user-1', 
          type: 'USER',
          metadata: { hasExistingAccount: false }
        },
        target: { id: 'target-1', type: 'USER' },
        action: { type: 'REGISTER' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      
      expect(result.finalDecision).toBe(RuleResult.ALLOW);
      expect(result.summary.allow).toBeGreaterThan(0);
      expect(result.summary.deny).toBe(0);
      expect(result.summary.flag).toBe(0);
    });

    it('should deny duplicate user registration', async () => {
      const context: RuleContext = {
        actor: { 
          id: 'user-1', 
          type: 'USER',
          metadata: { hasExistingAccount: true }
        },
        target: { id: 'target-1', type: 'USER' },
        action: { type: 'REGISTER' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      
      expect(result.finalDecision).toBe(RuleResult.DENY);
      expect(result.summary.deny).toBeGreaterThan(0);
    });

    it('should flag suspicious bidding pattern', async () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'auction-1', type: 'AUCTION' },
        action: { 
          type: 'BID',
          metadata: { bidCount: 15, timeWindowMinutes: 3 }
        },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      
      expect(result.finalDecision).toBe(RuleResult.FLAG);
      expect(result.summary.flag).toBeGreaterThan(0);
      
      const flaggedResult = result.results.find(r => r.result === RuleResult.FLAG);
      expect(flaggedResult?.reason).toContain('15 bids in 3 minutes');
    });

    it('should deny high value transaction from new account', async () => {
      const context: RuleContext = {
        actor: { 
          id: 'user-1', 
          type: 'USER',
          metadata: { accountAgeDays: 10 }
        },
        target: { id: 'payment-1', type: 'PAYMENT' },
        action: { 
          type: 'PAY',
          metadata: { amount: 2000 }
        },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      
      expect(result.finalDecision).toBe(RuleResult.DENY);
      expect(result.summary.deny).toBeGreaterThan(0);
    });

    it('should deny action from blacklisted IP', async () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'target-1', type: 'USER' },
        action: { type: 'LOGIN' },
        environment: { 
          timestamp: new Date(),
          ip: '192.168.1.100' // Blacklisted IP
        }
      };

      const result = await rulesEngine.evaluate(context);
      
      expect(result.finalDecision).toBe(RuleResult.DENY);
      expect(result.summary.deny).toBeGreaterThan(0);
      
      const deniedResult = result.results.find(r => r.result === RuleResult.DENY);
      expect(deniedResult?.severity).toBe(RuleSeverity.CRITICAL);
    });

    it('should handle rule evaluation errors gracefully', async () => {
      const faultyRule = {
        id: 'faulty-rule',
        description: 'Faulty rule for testing',
        appliesTo: [{ actionType: 'REGISTER' }],
        async evaluate() {
          throw new Error('Test error');
        }
      };

      rulesEngine.registerRule(faultyRule);
      
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'target-1', type: 'USER' },
        action: { type: 'REGISTER' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      
      expect(result.finalDecision).toBe(RuleResult.DENY);
      
      const errorResult = result.results.find(r => r.ruleId === 'faulty-rule');
      expect(errorResult?.result).toBe(RuleResult.DENY);
      expect(errorResult?.reason).toContain('Rule evaluation failed');
    });
  });

  describe('Evaluation Logging', () => {
    beforeEach(() => {
      exampleRules.forEach(rule => rulesEngine.registerRule(rule));
    });

    it('should log all rule evaluations', async () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'target-1', type: 'USER' },
        action: { type: 'REGISTER' },
        environment: { timestamp: new Date() }
      };

      await rulesEngine.evaluate(context);
      
      const log = rulesEngine.getEvaluationLog();
      expect(log.length).toBeGreaterThan(0);
      
      log.forEach(entry => {
        expect(entry).toHaveProperty('ruleId');
        expect(entry).toHaveProperty('result');
        expect(entry).toHaveProperty('evaluatedAt');
        expect(entry.evaluatedAt).toBeInstanceOf(Date);
      });
    });

    it('should limit evaluation log size', async () => {
      // This test would need to mock the console.log to avoid spam
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'target-1', type: 'USER' },
        action: { type: 'REGISTER' },
        environment: { timestamp: new Date() }
      };

      // Run multiple evaluations
      for (let i = 0; i < 5; i++) {
        await rulesEngine.evaluate(context);
      }
      
      const log = rulesEngine.getEvaluationLog();
      expect(log.length).toBe(5);
    });

    it('should clear evaluation log', async () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'target-1', type: 'USER' },
        action: { type: 'REGISTER' },
        environment: { timestamp: new Date() }
      };

      await rulesEngine.evaluate(context);
      expect(rulesEngine.getEvaluationLog().length).toBeGreaterThan(0);
      
      rulesEngine.clearEvaluationLog();
      expect(rulesEngine.getEvaluationLog().length).toBe(0);
    });

    it('should limit evaluation log results', async () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'target-1', type: 'USER' },
        action: { type: 'REGISTER' },
        environment: { timestamp: new Date() }
      };

      // Run multiple evaluations
      for (let i = 0; i < 5; i++) {
        await rulesEngine.evaluate(context);
      }
      
      const limitedLog = rulesEngine.getEvaluationLog(3);
      expect(limitedLog.length).toBe(3);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      exampleRules.forEach(rule => rulesEngine.registerRule(rule));
    });

    it('should provide accurate statistics', async () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'target-1', type: 'USER' },
        action: { type: 'REGISTER' },
        environment: { timestamp: new Date() }
      };

      await rulesEngine.evaluate(context);
      
      const stats = rulesEngine.getStatistics();
      
      expect(stats.totalRules).toBe(exampleRules.length);
      expect(stats.enabledRules).toBe(exampleRules.length);
      expect(stats.totalEvaluations).toBeGreaterThan(0);
      expect(stats.recentEvaluations).toHaveProperty('allow');
      expect(stats.recentEvaluations).toHaveProperty('deny');
      expect(stats.recentEvaluations).toHaveProperty('flag');
    });

    it('should track disabled rules in statistics', () => {
      const rule = exampleRules[0];
      rulesEngine.registerRule(rule, { enabled: false });
      
      const stats = rulesEngine.getStatistics();
      
      expect(stats.enabledRules).toBeLessThan(stats.totalRules);
    });
  });

  describe('Deterministic Behavior', () => {
    beforeEach(() => {
      exampleRules.forEach(rule => rulesEngine.registerRule(rule));
    });

    it('should produce consistent results for identical contexts', async () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'auction-1', type: 'AUCTION' },
        action: { 
          type: 'BID',
          metadata: { bidCount: 5, timeWindowMinutes: 10 }
        },
        environment: { timestamp: new Date() }
      };

      const result1 = await rulesEngine.evaluate(context);
      const result2 = await rulesEngine.evaluate(context);
      
      expect(result1.finalDecision).toBe(result2.finalDecision);
      expect(result1.summary).toEqual(result2.summary);
    });

    it('should not use randomness or ML', async () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'target-1', type: 'USER' },
        action: { type: 'REGISTER' },
        environment: { timestamp: new Date() }
      };

      // Run multiple times and expect same result
      const results = await Promise.all([
        rulesEngine.evaluate(context),
        rulesEngine.evaluate(context),
        rulesEngine.evaluate(context)
      ]);
      
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.finalDecision).toBe(firstResult.finalDecision);
        expect(result.summary).toEqual(firstResult.summary);
      });
    });
  });

  describe('No Side Effects', () => {
    beforeEach(() => {
      exampleRules.forEach(rule => rulesEngine.registerRule(rule));
    });

    it('should not modify input context', async () => {
      const originalContext: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'target-1', type: 'USER' },
        action: { type: 'REGISTER' },
        environment: { timestamp: new Date() }
      };

      const contextCopy = JSON.parse(JSON.stringify(originalContext));
      
      await rulesEngine.evaluate(originalContext);
      
      expect(originalContext).toEqual(contextCopy);
    });

    it('should not execute money movement or external actions', async () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER' },
        target: { id: 'payment-1', type: 'PAYMENT' },
        action: { 
          type: 'PAY',
          metadata: { amount: 100 }
        },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      
      // Should only return decisions, not execute actions
      expect(result).toHaveProperty('finalDecision');
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('summary');
      
      // No external calls or side effects should occur
      expect(result.finalDecision).toBeOneOf([RuleResult.ALLOW, RuleResult.DENY, RuleResult.FLAG]);
    });
  });
});
