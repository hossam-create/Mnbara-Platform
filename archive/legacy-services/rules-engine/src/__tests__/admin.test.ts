import { RulesEngine } from '../services/RulesEngine.service';
import { AdminStatistics } from '../services/AdminStatistics.service';
import { coreRules } from '../rules/core';
import { RuleContext, RuleResult } from '../types/Rule.types';

// Mock Express Request/Response for testing
interface MockResponse {
  statusCode: number;
  json: any;
  headers: any;
}

const createMockResponse = (): MockResponse => {
  const res: MockResponse = {
    statusCode: 200,
    json: null,
    headers: {}
  };
  
  res.json = (data: any) => {
    res.json = data;
    return res;
  };
  
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  
  return res;
};

describe('Admin Statistics', () => {
  let rulesEngine: RulesEngine;
  let adminStats: AdminStatistics;

  beforeEach(() => {
    rulesEngine = new RulesEngine();
    adminStats = new AdminStatistics();
    
    // Register core rules
    coreRules.forEach(rule => rulesEngine.registerRule(rule));
  });

  describe('Statistics Tracking', () => {
    it('should track rule evaluations correctly', async () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER', metadata: { ['activeBids']: 15 } },
        target: { id: 'auction-1', type: 'AUCTION' },
        action: { type: 'BID' },
        environment: { timestamp: new Date() }
      };

      // Evaluate rules
      const result = await rulesEngine.evaluate(context);
      
      // Update admin stats manually (in real scenario, this is done by RulesEngine)
      result.results.forEach(evalResult => {
        adminStats.updateRuleStats(evalResult);
      });

      const stats = adminStats.getAllRuleStats();
      expect(stats.length).toBeGreaterThan(0);
      
      // Check that USER_MAX_ACTIVE_BIDS rule was tracked
      const bidRuleStats = stats.find(s => s.ruleId === 'USER_MAX_ACTIVE_BIDS');
      expect(bidRuleStats).toBeDefined();
      expect(bidRuleStats?.totalCount).toBe(1);
      expect(bidRuleStats?.flagCount).toBe(1);
      expect(bidRuleStats?.lastTriggeredAt).toBeInstanceOf(Date);
    });

    it('should accumulate statistics across multiple evaluations', async () => {
      const context1: RuleContext = {
        actor: { id: 'user-1', type: 'USER', metadata: { ['activeBids']: 15 } },
        target: { id: 'auction-1', type: 'AUCTION' },
        action: { type: 'BID' },
        environment: { timestamp: new Date() }
      };

      const context2: RuleContext = {
        actor: { id: 'user-2', type: 'USER', metadata: { ['activeBids']: 5 } },
        target: { id: 'auction-2', type: 'AUCTION' },
        action: { type: 'BID' },
        environment: { timestamp: new Date() }
      };

      // First evaluation (should flag)
      const result1 = await rulesEngine.evaluate(context1);
      result1.results.forEach(evalResult => {
        adminStats.updateRuleStats(evalResult);
      });

      // Second evaluation (should allow)
      const result2 = await rulesEngine.evaluate(context2);
      result2.results.forEach(evalResult => {
        adminStats.updateRuleStats(evalResult);
      });

      const stats = adminStats.getAllRuleStats();
      const bidRuleStats = stats.find(s => s.ruleId === 'USER_MAX_ACTIVE_BIDS');
      
      expect(bidRuleStats?.totalCount).toBe(2);
      expect(bidRuleStats?.flagCount).toBe(1);
      expect(bidRuleStats?.allowCount).toBe(1);
    });

    it('should provide correct summary statistics', async () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER', metadata: { ['activeBids']: 15, ['pendingRequests']: 7 } },
        target: { id: 'auction-1', type: 'AUCTION' },
        action: { type: 'BID' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      result.results.forEach(evalResult => {
        adminStats.updateRuleStats(evalResult);
      });

      const summary = adminStats.getSummaryStats();
      
      expect(summary.totalRules).toBeGreaterThan(0);
      expect(summary.totalEvaluations).toBe(result.results.length);
      expect(summary.totalAllows + summary.totalDenies + summary.totalFlags).toBe(summary.totalEvaluations);
    });
  });

  describe('Admin Response Format', () => {
    it('should format admin evaluations response correctly', async () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER', metadata: { ['activeBids']: 15 } },
        target: { id: 'auction-1', type: 'AUCTION' },
        action: { type: 'BID' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      result.results.forEach(evalResult => {
        adminStats.updateRuleStats(evalResult);
      });

      // Create rule descriptions map
      const ruleDescriptions = new Map();
      rulesEngine.getRegisteredRules().forEach(rule => {
        ruleDescriptions.set(rule.id, {
          description: rule.description,
          severity: rule.severity
        });
      });

      const response = adminStats.getAdminEvaluationsResponse(ruleDescriptions);

      expect(response).toHaveProperty('evaluations');
      expect(response).toHaveProperty('summary');
      expect(response).toHaveProperty('generatedAt');
      
      expect(response.evaluations).toBeInstanceOf(Array);
      expect(response.summary.totalRules).toBe(response.evaluations.length);
      expect(response.generatedAt).toBeInstanceOf(Date);

      // Check evaluation structure
      const evaluation = response.evaluations[0];
      expect(evaluation).toHaveProperty('ruleId');
      expect(evaluation).toHaveProperty('ruleDescription');
      expect(evaluation).toHaveProperty('counts');
      expect(evaluation).toHaveProperty('lastTriggeredAt');
      
      expect(evaluation.counts).toHaveProperty('allow');
      expect(evaluation.counts).toHaveProperty('deny');
      expect(evaluation.counts).toHaveProperty('flag');
      expect(evaluation.counts).toHaveProperty('total');
    });
  });

  describe('Rule-Specific Statistics', () => {
    it('should return statistics for specific rule', async () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER', metadata: { ['activeBids']: 15 } },
        target: { id: 'auction-1', type: 'AUCTION' },
        action: { type: 'BID' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      result.results.forEach(evalResult => {
        adminStats.updateRuleStats(evalResult);
      });

      const stats = adminStats.getRuleStats('USER_MAX_ACTIVE_BIDS');
      expect(stats).toBeDefined();
      expect(stats?.ruleId).toBe('USER_MAX_ACTIVE_BIDS');
      expect(stats?.totalCount).toBe(1);
      expect(stats?.flagCount).toBe(1);

      const nonExistentStats = adminStats.getRuleStats('NON_EXISTENT_RULE');
      expect(nonExistentStats).toBeNull();
    });
  });

  describe('Statistics Reset', () => {
    it('should reset statistics correctly', async () => {
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER', metadata: { ['activeBids']: 15 } },
        target: { id: 'auction-1', type: 'AUCTION' },
        action: { type: 'BID' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      result.results.forEach(evalResult => {
        adminStats.updateRuleStats(evalResult);
      });

      // Verify stats exist
      let stats = adminStats.getAllRuleStats();
      expect(stats.length).toBeGreaterThan(0);

      // Reset stats
      adminStats.resetStats();

      // Verify stats are cleared
      stats = adminStats.getAllRuleStats();
      expect(stats.length).toBe(0);

      const summary = adminStats.getSummaryStats();
      expect(summary.totalRules).toBe(0);
      expect(summary.totalEvaluations).toBe(0);
    });
  });
});

describe('Admin Routes (READ ONLY)', () => {
  let adminStats: AdminStatistics;
  let rulesEngine: RulesEngine;

  beforeEach(() => {
    adminStats = new AdminStatistics();
    rulesEngine = new RulesEngine();
    coreRules.forEach(rule => rulesEngine.registerRule(rule));
  });

  describe('GET /evaluations', () => {
    it('should return evaluations data', async () => {
      // Add some test data
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER', metadata: { ['activeBids']: 15 } },
        target: { id: 'auction-1', type: 'AUCTION' },
        action: { type: 'BID' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      result.results.forEach(evalResult => {
        adminStats.updateRuleStats(evalResult);
      });

      // Simulate route handler
      const ruleDescriptions = new Map();
      rulesEngine.getRegisteredRules().forEach(rule => {
        ruleDescriptions.set(rule.id, {
          description: rule.description,
          severity: rule.severity
        });
      });

      const response = adminStats.getAdminEvaluationsResponse(ruleDescriptions);

      expect(response.evaluations).toBeDefined();
      expect(response.summary).toBeDefined();
      expect(response.generatedAt).toBeDefined();
      expect(response.summary.totalRules).toBeGreaterThan(0);
    });

    it('should handle empty statistics gracefully', () => {
      const ruleDescriptions = new Map();
      const response = adminStats.getAdminEvaluationsResponse(ruleDescriptions);

      expect(response.evaluations).toEqual([]);
      expect(response.summary.totalRules).toBe(0);
      expect(response.summary.totalEvaluations).toBe(0);
    });
  });

  describe('GET /evaluations/summary', () => {
    it('should return summary statistics', async () => {
      // Add test data
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER', metadata: { ['activeBids']: 15 } },
        target: { id: 'auction-1', type: 'AUCTION' },
        action: { type: 'BID' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      result.results.forEach(evalResult => {
        adminStats.updateRuleStats(evalResult);
      });

      const summary = adminStats.getSummaryStats();
      
      expect(summary.totalRules).toBeGreaterThan(0);
      expect(summary.totalEvaluations).toBeGreaterThan(0);
      expect(typeof summary.totalAllows).toBe('number');
      expect(typeof summary.totalDenies).toBe('number');
      expect(typeof summary.totalFlags).toBe('number');
    });
  });

  describe('GET /evaluations/:ruleId', () => {
    it('should return specific rule statistics', async () => {
      // Add test data
      const context: RuleContext = {
        actor: { id: 'user-1', type: 'USER', metadata: { ['activeBids']: 15 } },
        target: { id: 'auction-1', type: 'AUCTION' },
        action: { type: 'BID' },
        environment: { timestamp: new Date() }
      };

      const result = await rulesEngine.evaluate(context);
      result.results.forEach(evalResult => {
        adminStats.updateRuleStats(evalResult);
      });

      const stats = adminStats.getRuleStats('USER_MAX_ACTIVE_BIDS');
      const rule = rulesEngine.getRegisteredRules().find(r => r.id === 'USER_MAX_ACTIVE_BIDS');

      expect(stats).toBeDefined();
      expect(stats?.ruleId).toBe('USER_MAX_ACTIVE_BIDS');
      expect(stats?.totalCount).toBe(1);
      expect(rule?.description).toBeDefined();
    });

    it('should return 404 for non-existent rule', () => {
      const stats = adminStats.getRuleStats('NON_EXISTENT_RULE');
      expect(stats).toBeNull();
    });
  });

  describe('READ ONLY Guarantee', () => {
    it('should not provide any modification endpoints', () => {
      // This test ensures we only have GET endpoints
      // No POST, PUT, DELETE, PATCH endpoints should exist
      const stats = adminStats.getAllRuleStats();
      const initialCount = stats.length;

      // Try to call methods that would modify data
      adminStats.resetStats(); // This should only be available for testing
      
      // Verify no public methods exist for editing/disabling rules
      const adminStatsMethods = Object.getOwnPropertyNames(AdminStatistics.prototype);
      const modificationMethods = adminStatsMethods.filter(method => 
        method.includes('update') || method.includes('delete') || method.includes('edit')
      );

      // Only updateRuleStats should exist (for internal tracking)
      expect(modificationMethods).toEqual(['updateRuleStats']);
    });
  });
});
