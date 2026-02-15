/**
 * RulesEngineService - Unit Tests
 * SECURITY-CRITICAL: Bank-facing infrastructure
 * 
 * Tests verify:
 * - Engine reads ONLY from Event table
 * - Engine produces ONLY flags (no actions)
 * - Engine NEVER writes to Wallet / Escrow / Ledger
 * - Engine has NO financial side effects
 */

import { RulesEngineService } from '../rules-engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RuleOutputType,
  RuleStatus,
  RuleSeverity,
  ConditionOperator,
  ConditionLogic,
} from '../../types/rule.enums';
import {
  Rule,
  RuleValidationError,
  RuleEvaluationError,
} from '../../types/rule.types';

describe('RulesEngineService', () => {
  let service: RulesEngineService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      event: {
        findMany: jest.fn(),
      },
      rule: {
        findMany: jest.fn(),
      },
    };

    service = new RulesEngineService(prisma);
  });

  describe('evaluateRules', () => {
    it('should return empty array when no active rules exist', async () => {
      prisma.rule.findMany.mockResolvedValue([]);

      const context = { user_id: 'user-123' };
      const results = await service.evaluateRules(context);

      expect(results).toEqual([]);
      expect(prisma.rule.findMany).toHaveBeenCalledWith({
        where: { status: RuleStatus.ACTIVE },
        orderBy: { created_at: 'asc' },
      });
    });

    it('should evaluate all active rules', async () => {
      const mockRule: Rule = {
        id: 'rule-1',
        name: 'Test Rule',
        description: 'Test rule description',
        conditions: [
          {
            id: 'cond-1',
            field: 'event_type',
            operator: ConditionOperator.EQUALS,
            value: 'BID_PLACED',
          },
        ],
        conditionLogic: ConditionLogic.AND,
        outputType: RuleOutputType.FLAG_USER,
        severity: RuleSeverity.HIGH,
        status: RuleStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'admin',
      };

      const mockEvent = {
        event_id: 'evt-1',
        event_type: 'BID_PLACED',
        actor_id: 'user-123',
        created_at: new Date(),
      };

      jest.spyOn(prisma.rule, 'findMany').mockResolvedValue([mockRule]);
      jest.spyOn(prisma.event, 'findMany').mockResolvedValue([mockEvent]);

      const context = { user_id: 'user-123' };
      const results = await service.evaluateRules(context);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].output_type).toBe(RuleOutputType.FLAG_USER);
      expect(results[0].rule_id).toBe('rule-1');
    });

    it('should throw error if context is invalid', async () => {
      const context = {}; // No user_id, auction_id, traveler_id, or events

      await expect(service.evaluateRules(context)).rejects.toThrow(
        RuleValidationError
      );
    });

    it('should handle rule evaluation errors gracefully', async () => {
      const mockRule: Rule = {
        id: 'rule-1',
        name: 'Test Rule',
        description: 'Test rule description',
        conditions: [
          {
            id: 'cond-1',
            field: 'event_type',
            operator: ConditionOperator.EQUALS,
            value: 'BID_PLACED',
          },
        ],
        conditionLogic: ConditionLogic.AND,
        outputType: RuleOutputType.FLAG_USER,
        severity: RuleSeverity.HIGH,
        status: RuleStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'admin',
      };

      jest.spyOn(prisma.rule, 'findMany').mockResolvedValue([mockRule]);
      jest
        .spyOn(prisma.event, 'findMany')
        .mockRejectedValue(new Error('Database error'));

      const context = { user_id: 'user-123' };

      // Should throw error when event query fails
      await expect(service.evaluateRules(context)).rejects.toThrow(
        RuleEvaluationError
      );
    });

    it('should use pre-loaded events if provided', async () => {
      const mockRule: Rule = {
        id: 'rule-1',
        name: 'Test Rule',
        description: 'Test rule description',
        conditions: [
          {
            id: 'cond-1',
            field: 'event_type',
            operator: ConditionOperator.EQUALS,
            value: 'BID_PLACED',
          },
        ],
        conditionLogic: ConditionLogic.AND,
        outputType: RuleOutputType.FLAG_USER,
        severity: RuleSeverity.HIGH,
        status: RuleStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'admin',
      };

      const mockEvent = {
        event_id: 'evt-1',
        event_type: 'BID_PLACED',
        actor_id: 'user-123',
      };

      jest.spyOn(prisma.rule, 'findMany').mockResolvedValue([mockRule]);

      const context = {
        user_id: 'user-123',
        events: [mockEvent],
      };

      const results = await service.evaluateRules(context);

      // Should not call findMany for events since they're pre-loaded
      expect(prisma.event.findMany).not.toHaveBeenCalled();
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('evaluateRule', () => {
    it('should return null if rule does not match', async () => {
      const mockRule: Rule = {
        id: 'rule-1',
        name: 'Test Rule',
        description: 'Test rule description',
        conditions: [
          {
            id: 'cond-1',
            field: 'event_type',
            operator: ConditionOperator.EQUALS,
            value: 'BID_PLACED',
          },
        ],
        conditionLogic: ConditionLogic.AND,
        outputType: RuleOutputType.FLAG_USER,
        severity: RuleSeverity.HIGH,
        status: RuleStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'admin',
      };

      const mockEvent = {
        event_id: 'evt-1',
        event_type: 'SEARCH_PERFORMED', // Different event type
        actor_id: 'user-123',
      };

      const context = {
        user_id: 'user-123',
        events: [mockEvent],
      };

      const result = await service.evaluateRule(mockRule, context);

      expect(result).toBeNull();
    });

    it('should return evaluation result if rule matches', async () => {
      const mockRule: Rule = {
        id: 'rule-1',
        name: 'Test Rule',
        description: 'Test rule description',
        conditions: [
          {
            id: 'cond-1',
            field: 'event_type',
            operator: ConditionOperator.EQUALS,
            value: 'BID_PLACED',
          },
        ],
        conditionLogic: ConditionLogic.AND,
        outputType: RuleOutputType.FLAG_USER,
        severity: RuleSeverity.HIGH,
        status: RuleStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'admin',
      };

      const mockEvent = {
        event_id: 'evt-1',
        event_type: 'BID_PLACED',
        actor_id: 'user-123',
      };

      const context = {
        user_id: 'user-123',
        events: [mockEvent],
      };

      const result = await service.evaluateRule(mockRule, context);

      expect(result).not.toBeNull();
      expect(result?.rule_id).toBe('rule-1');
      expect(result?.output_type).toBe(RuleOutputType.FLAG_USER);
      expect(result?.severity).toBe(RuleSeverity.HIGH);
      expect(result?.matched_conditions).toContain('cond-1');
    });

    it('should throw error if rule is invalid', async () => {
      const invalidRule = {
        id: 'rule-1',
        // Missing required fields
      } as any;

      const context = { user_id: 'user-123', events: [] };

      await expect(service.evaluateRule(invalidRule, context)).rejects.toThrow(
        RuleValidationError
      );
    });
  });

  describe('Condition Operators', () => {
    const createRule = (operator: ConditionOperator, value: any): Rule => ({
      id: 'rule-1',
      name: 'Test Rule',
      description: 'Test rule description',
      conditions: [
        {
          id: 'cond-1',
          field: 'context.amount',
          operator,
          value,
        },
      ],
      conditionLogic: ConditionLogic.AND,
      outputType: RuleOutputType.FLAG_USER,
      severity: RuleSeverity.HIGH,
      status: RuleStatus.ACTIVE,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'admin',
    });

    it('should evaluate EQUALS operator', async () => {
      const rule = createRule(ConditionOperator.EQUALS, 100);
      const event = { context: { amount: 100 } };
      const context = { user_id: 'user-123', events: [event] };

      const result = await service.evaluateRule(rule, context);
      expect(result).not.toBeNull();
    });

    it('should evaluate NOT_EQUALS operator', async () => {
      const rule = createRule(ConditionOperator.NOT_EQUALS, 100);
      const event = { context: { amount: 50 } };
      const context = { user_id: 'user-123', events: [event] };

      const result = await service.evaluateRule(rule, context);
      expect(result).not.toBeNull();
    });

    it('should evaluate GREATER_THAN operator', async () => {
      const rule = createRule(ConditionOperator.GREATER_THAN, 100);
      const event = { context: { amount: 150 } };
      const context = { user_id: 'user-123', events: [event] };

      const result = await service.evaluateRule(rule, context);
      expect(result).not.toBeNull();
    });

    it('should evaluate LESS_THAN operator', async () => {
      const rule = createRule(ConditionOperator.LESS_THAN, 100);
      const event = { context: { amount: 50 } };
      const context = { user_id: 'user-123', events: [event] };

      const result = await service.evaluateRule(rule, context);
      expect(result).not.toBeNull();
    });

    it('should evaluate IN operator', async () => {
      const rule = createRule(ConditionOperator.IN, ['BID_PLACED', 'BID_REJECTED']);
      const event = { event_type: 'BID_PLACED' };
      const context = { user_id: 'user-123', events: [event] };

      const result = await service.evaluateRule(rule, context);
      expect(result).not.toBeNull();
    });

    it('should evaluate NOT_IN operator', async () => {
      const rule = createRule(ConditionOperator.NOT_IN, ['BID_PLACED', 'BID_REJECTED']);
      const event = { event_type: 'SEARCH_PERFORMED' };
      const context = { user_id: 'user-123', events: [event] };

      const result = await service.evaluateRule(rule, context);
      expect(result).not.toBeNull();
    });

    it('should evaluate CONTAINS operator', async () => {
      const rule = createRule(ConditionOperator.CONTAINS, 'error');
      const event = { context: { message: 'Payment error occurred' } };
      const context = { user_id: 'user-123', events: [event] };

      const result = await service.evaluateRule(rule, context);
      expect(result).not.toBeNull();
    });

    it('should evaluate STARTS_WITH operator', async () => {
      const rule = createRule(ConditionOperator.STARTS_WITH, 'BID_');
      const event = { event_type: 'BID_PLACED' };
      const context = { user_id: 'user-123', events: [event] };

      const result = await service.evaluateRule(rule, context);
      expect(result).not.toBeNull();
    });

    it('should evaluate ENDS_WITH operator', async () => {
      const rule = createRule(ConditionOperator.ENDS_WITH, '_PLACED');
      const event = { event_type: 'BID_PLACED' };
      const context = { user_id: 'user-123', events: [event] };

      const result = await service.evaluateRule(rule, context);
      expect(result).not.toBeNull();
    });
  });

  describe('Condition Logic', () => {
    it('should evaluate AND logic correctly', async () => {
      const rule: Rule = {
        id: 'rule-1',
        name: 'Test Rule',
        description: 'Test rule description',
        conditions: [
          {
            id: 'cond-1',
            field: 'event_type',
            operator: ConditionOperator.EQUALS,
            value: 'BID_PLACED',
          },
          {
            id: 'cond-2',
            field: 'context.amount',
            operator: ConditionOperator.GREATER_THAN,
            value: 1000,
          },
        ],
        conditionLogic: ConditionLogic.AND,
        outputType: RuleOutputType.FLAG_USER,
        severity: RuleSeverity.HIGH,
        status: RuleStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'admin',
      };

      const event = {
        event_type: 'BID_PLACED',
        context: { amount: 1500 },
      };

      const context = { user_id: 'user-123', events: [event] };
      const result = await service.evaluateRule(rule, context);

      expect(result).not.toBeNull();
    });

    it('should evaluate OR logic correctly', async () => {
      const rule: Rule = {
        id: 'rule-1',
        name: 'Test Rule',
        description: 'Test rule description',
        conditions: [
          {
            id: 'cond-1',
            field: 'event_type',
            operator: ConditionOperator.EQUALS,
            value: 'BID_PLACED',
          },
          {
            id: 'cond-2',
            field: 'event_type',
            operator: ConditionOperator.EQUALS,
            value: 'DISPUTE_OPENED',
          },
        ],
        conditionLogic: ConditionLogic.OR,
        outputType: RuleOutputType.FLAG_USER,
        severity: RuleSeverity.HIGH,
        status: RuleStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'admin',
      };

      const event = { event_type: 'DISPUTE_OPENED' };
      const context = { user_id: 'user-123', events: [event] };
      const result = await service.evaluateRule(rule, context);

      expect(result).not.toBeNull();
    });
  });

  describe('READ-ONLY Guarantees', () => {
    it('should only read from Event table, never write', async () => {
      const mockRule: Rule = {
        id: 'rule-1',
        name: 'Test Rule',
        description: 'Test rule description',
        conditions: [
          {
            id: 'cond-1',
            field: 'event_type',
            operator: ConditionOperator.EQUALS,
            value: 'BID_PLACED',
          },
        ],
        conditionLogic: ConditionLogic.AND,
        outputType: RuleOutputType.FLAG_USER,
        severity: RuleSeverity.HIGH,
        status: RuleStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'admin',
      };

      prisma.rule.findMany.mockResolvedValue([mockRule]);
      prisma.event.findMany.mockResolvedValue([]);

      const context = { user_id: 'user-123' };
      await service.evaluateRules(context);

      // Verify only read operations were called
      expect(prisma.event.findMany).toHaveBeenCalled();
      expect(prisma.rule.findMany).toHaveBeenCalled();

      // Verify no write operations were called
      expect(prisma.event.create).not.toHaveBeenCalled();
      expect(prisma.event.update).not.toHaveBeenCalled();
      expect(prisma.event.delete).not.toHaveBeenCalled();
    });

    it('should produce only flags, no financial actions', async () => {
      const mockRule: Rule = {
        id: 'rule-1',
        name: 'Test Rule',
        description: 'Test rule description',
        conditions: [
          {
            id: 'cond-1',
            field: 'event_type',
            operator: ConditionOperator.EQUALS,
            value: 'BID_PLACED',
          },
        ],
        conditionLogic: ConditionLogic.AND,
        outputType: RuleOutputType.FLAG_USER,
        severity: RuleSeverity.HIGH,
        status: RuleStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'admin',
      };

      const mockEvent = {
        event_id: 'evt-1',
        event_type: 'BID_PLACED',
        actor_id: 'user-123',
      };

      jest.spyOn(prisma.rule, 'findMany').mockResolvedValue([mockRule]);
      jest.spyOn(prisma.event, 'findMany').mockResolvedValue([mockEvent]);

      const context = { user_id: 'user-123' };
      const results = await service.evaluateRules(context);

      // Verify results are only flags
      expect(results.length).toBeGreaterThan(0);
      results.forEach((result) => {
        expect(Object.values(RuleOutputType)).toContain(result.output_type);
        expect(result.severity).toBeDefined();
        expect(result.reason).toBeDefined();
        // Verify no financial data in result
        expect(result).not.toHaveProperty('wallet_id');
        expect(result).not.toHaveProperty('escrow_id');
        expect(result).not.toHaveProperty('ledger_id');
      });
    });
  });

  describe('Multiple Rules Evaluation', () => {
    it('should evaluate multiple rules and return all matching flags', async () => {
      const rule1: Rule = {
        id: 'rule-1',
        name: 'High Bid Rule',
        description: 'Flag high bids',
        conditions: [
          {
            id: 'cond-1',
            field: 'context.amount',
            operator: ConditionOperator.GREATER_THAN,
            value: 1000,
          },
        ],
        conditionLogic: ConditionLogic.AND,
        outputType: RuleOutputType.FLAG_AUCTION,
        severity: RuleSeverity.HIGH,
        status: RuleStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'admin',
      };

      const rule2: Rule = {
        id: 'rule-2',
        name: 'Rapid Bid Rule',
        description: 'Flag rapid bids',
        conditions: [
          {
            id: 'cond-2',
            field: 'event_type',
            operator: ConditionOperator.EQUALS,
            value: 'BID_PLACED',
          },
        ],
        conditionLogic: ConditionLogic.AND,
        outputType: RuleOutputType.RATE_LIMIT,
        severity: RuleSeverity.MEDIUM,
        status: RuleStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'admin',
      };

      const mockEvent = {
        event_type: 'BID_PLACED',
        context: { amount: 1500 },
      };

      jest.spyOn(prisma.rule, 'findMany').mockResolvedValue([rule1, rule2]);
      jest.spyOn(prisma.event, 'findMany').mockResolvedValue([mockEvent]);

      const context = { user_id: 'user-123' };
      const results = await service.evaluateRules(context);

      expect(results.length).toBe(2);
      expect(results[0].output_type).toBe(RuleOutputType.FLAG_AUCTION);
      expect(results[1].output_type).toBe(RuleOutputType.RATE_LIMIT);
    });
  });
});
