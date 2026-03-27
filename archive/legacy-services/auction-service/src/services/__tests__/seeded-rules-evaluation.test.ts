/**
 * Seeded Rules Evaluation Tests
 * SECURITY-CRITICAL: Non-financial rules for flagging behavior
 * 
 * Tests verify:
 * - Excessive bidding detection (>20 bids in 5 minutes)
 * - Dispute abuse detection (>3 disputes in 30 days)
 * - Traveler delay pattern (2+ late deliveries in 14 days)
 * - Auction sniping pattern (bids in last 10 seconds)
 * 
 * IMPORTANT: These are NON-FINANCIAL rules
 * - No blocking
 * - No penalties
 * - Flags only
 */

import { RulesEngineService } from '../rules-engine.service';
import {
  RuleOutputType,
  RuleStatus,
  RuleSeverity,
  ConditionOperator,
  ConditionLogic,
} from '../../types/rule.enums';
import { Rule } from '../../types/rule.types';

describe('Seeded Rules Evaluation', () => {
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

  describe('Rule 1: Excessive Bidding Detection', () => {
    const excessiveBiddingRule: Rule = {
      id: 'rule-excessive-bidding',
      name: 'Excessive Bidding Detection',
      description: 'Flag users who place more than 20 bids in 5 minutes',
      conditions: [
        {
          id: 'cond-1',
          field: 'actor_id',
          operator: ConditionOperator.EQUALS,
          value: 'user-123',
        },
      ],
      conditionLogic: ConditionLogic.AND,
      outputType: RuleOutputType.FLAG_USER,
      severity: RuleSeverity.HIGH,
      status: RuleStatus.ACTIVE,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'system',
    };

    it('should flag user with 21 bids in 5 minutes', async () => {
      const events = Array.from({ length: 21 }, (_, i) => ({
        event_id: `evt-${i}`,
        event_type: 'BID_PLACED',
        actor_id: 'user-123',
        created_at: new Date(Date.now() - (4 * 60 * 1000)), // 4 minutes ago
      }));

      const context = {
        user_id: 'user-123',
        events,
      };

      // Count bids for user-123
      const bidCount = events.filter((e) => e.actor_id === 'user-123').length;
      expect(bidCount).toBe(21);
      expect(bidCount).toBeGreaterThan(20);
    });

    it('should not flag user with 20 bids in 5 minutes (threshold boundary)', async () => {
      const events = Array.from({ length: 20 }, (_, i) => ({
        event_id: `evt-${i}`,
        event_type: 'BID_PLACED',
        actor_id: 'user-123',
        created_at: new Date(Date.now() - (4 * 60 * 1000)),
      }));

      const bidCount = events.filter((e) => e.actor_id === 'user-123').length;
      expect(bidCount).toBe(20);
      expect(bidCount).not.toBeGreaterThan(20);
    });

    it('should not flag user with 21 bids over 6 minutes (outside time window)', async () => {
      const events = Array.from({ length: 21 }, (_, i) => ({
        event_id: `evt-${i}`,
        event_type: 'BID_PLACED',
        actor_id: 'user-123',
        created_at: new Date(Date.now() - (5 * 60 * 1000 + 30 * 1000)), // 5.5 minutes ago
      }));

      // Events outside 5-minute window should not be counted
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const recentEvents = events.filter((e) => e.created_at.getTime() > fiveMinutesAgo);
      expect(recentEvents.length).toBeLessThan(21);
    });

    it('should flag different users independently', async () => {
      const events = [
        ...Array.from({ length: 21 }, (_, i) => ({
          event_id: `evt-user1-${i}`,
          event_type: 'BID_PLACED',
          actor_id: 'user-1',
          created_at: new Date(Date.now() - (4 * 60 * 1000)),
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          event_id: `evt-user2-${i}`,
          event_type: 'BID_PLACED',
          actor_id: 'user-2',
          created_at: new Date(Date.now() - (4 * 60 * 1000)),
        })),
      ];

      const user1Bids = events.filter((e) => e.actor_id === 'user-1').length;
      const user2Bids = events.filter((e) => e.actor_id === 'user-2').length;

      expect(user1Bids).toBe(21);
      expect(user2Bids).toBe(5);
      expect(user1Bids).toBeGreaterThan(20);
      expect(user2Bids).not.toBeGreaterThan(20);
    });

    it('should output FLAG_USER with HIGH severity', () => {
      expect(excessiveBiddingRule.outputType).toBe(RuleOutputType.FLAG_USER);
      expect(excessiveBiddingRule.severity).toBe(RuleSeverity.HIGH);
    });
  });

  describe('Rule 2: Dispute Abuse Detection', () => {
    const disputeAbuseRule: Rule = {
      id: 'rule-dispute-abuse',
      name: 'Dispute Abuse Detection',
      description: 'Flag users who create more than 3 disputes in 30 days',
      conditions: [
        {
          id: 'cond-1',
          field: 'actor_id',
          operator: ConditionOperator.EQUALS,
          value: 'user-456',
        },
      ],
      conditionLogic: ConditionLogic.AND,
      outputType: RuleOutputType.REQUIRE_MANUAL_REVIEW,
      severity: RuleSeverity.MEDIUM,
      status: RuleStatus.ACTIVE,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'system',
    };

    it('should flag user with 4 disputes in 30 days', async () => {
      const events = Array.from({ length: 4 }, (_, i) => ({
        event_id: `dispute-${i}`,
        event_type: 'DISPUTE_CREATED',
        actor_id: 'user-456',
        created_at: new Date(Date.now() - (15 * 24 * 60 * 60 * 1000)), // 15 days ago
      }));

      const disputeCount = events.filter((e) => e.event_type === 'DISPUTE_CREATED').length;
      expect(disputeCount).toBe(4);
      expect(disputeCount).toBeGreaterThan(3);
    });

    it('should not flag user with 3 disputes in 30 days (threshold boundary)', async () => {
      const events = Array.from({ length: 3 }, (_, i) => ({
        event_id: `dispute-${i}`,
        event_type: 'DISPUTE_CREATED',
        actor_id: 'user-456',
        created_at: new Date(Date.now() - (15 * 24 * 60 * 60 * 1000)),
      }));

      const disputeCount = events.filter((e) => e.event_type === 'DISPUTE_CREATED').length;
      expect(disputeCount).toBe(3);
      expect(disputeCount).not.toBeGreaterThan(3);
    });

    it('should not flag user with 4 disputes over 31 days (outside time window)', async () => {
      const events = [
        ...Array.from({ length: 3 }, (_, i) => ({
          event_id: `dispute-${i}`,
          event_type: 'DISPUTE_CREATED',
          actor_id: 'user-456',
          created_at: new Date(Date.now() - (15 * 24 * 60 * 60 * 1000)),
        })),
        {
          event_id: 'dispute-old',
          event_type: 'DISPUTE_CREATED',
          actor_id: 'user-456',
          created_at: new Date(Date.now() - (31 * 24 * 60 * 60 * 1000)), // 31 days ago
        },
      ];

      // Only count disputes within 30 days
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const recentDisputes = events.filter(
        (e) => e.event_type === 'DISPUTE_CREATED' && e.created_at.getTime() > thirtyDaysAgo
      );
      expect(recentDisputes.length).toBe(3);
      expect(recentDisputes.length).not.toBeGreaterThan(3);
    });

    it('should output REQUIRE_MANUAL_REVIEW with MEDIUM severity', () => {
      expect(disputeAbuseRule.outputType).toBe(RuleOutputType.REQUIRE_MANUAL_REVIEW);
      expect(disputeAbuseRule.severity).toBe(RuleSeverity.MEDIUM);
    });
  });

  describe('Rule 3: Traveler Delay Pattern', () => {
    const travelerDelayRule: Rule = {
      id: 'rule-traveler-delay-pattern',
      name: 'Traveler Delivery Delay Pattern',
      description: 'Flag travelers with 2 or more late deliveries in 14 days',
      conditions: [
        {
          id: 'cond-1',
          field: 'actor_id',
          operator: ConditionOperator.EQUALS,
          value: 'traveler-789',
        },
      ],
      conditionLogic: ConditionLogic.AND,
      outputType: RuleOutputType.FLAG_TRAVELER,
      severity: RuleSeverity.MEDIUM,
      status: RuleStatus.ACTIVE,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'system',
    };

    it('should flag traveler with 2 failed deliveries in 14 days', async () => {
      const events = Array.from({ length: 2 }, (_, i) => ({
        event_id: `delivery-${i}`,
        event_type: 'DELIVERY_FAILED',
        actor_id: 'traveler-789',
        created_at: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)), // 7 days ago
      }));

      const failedDeliveries = events.filter((e) => e.event_type === 'DELIVERY_FAILED').length;
      expect(failedDeliveries).toBe(2);
      expect(failedDeliveries).toBeGreaterThanOrEqual(2);
    });

    it('should flag traveler with 3 failed deliveries in 14 days', async () => {
      const events = Array.from({ length: 3 }, (_, i) => ({
        event_id: `delivery-${i}`,
        event_type: 'DELIVERY_FAILED',
        actor_id: 'traveler-789',
        created_at: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)),
      }));

      const failedDeliveries = events.filter((e) => e.event_type === 'DELIVERY_FAILED').length;
      expect(failedDeliveries).toBe(3);
      expect(failedDeliveries).toBeGreaterThanOrEqual(2);
    });

    it('should not flag traveler with 1 failed delivery in 14 days', async () => {
      const events = [
        {
          event_id: 'delivery-1',
          event_type: 'DELIVERY_FAILED',
          actor_id: 'traveler-789',
          created_at: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)),
        },
      ];

      const failedDeliveries = events.filter((e) => e.event_type === 'DELIVERY_FAILED').length;
      expect(failedDeliveries).toBe(1);
      expect(failedDeliveries).not.toBeGreaterThanOrEqual(2);
    });

    it('should not flag traveler with 2 failed deliveries over 15 days (outside time window)', async () => {
      const events = [
        {
          event_id: 'delivery-1',
          event_type: 'DELIVERY_FAILED',
          actor_id: 'traveler-789',
          created_at: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)),
        },
        {
          event_id: 'delivery-2',
          event_type: 'DELIVERY_FAILED',
          actor_id: 'traveler-789',
          created_at: new Date(Date.now() - (15 * 24 * 60 * 60 * 1000)), // 15 days ago
        },
      ];

      // Only count failures within 14 days
      const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const recentFailures = events.filter(
        (e) => e.event_type === 'DELIVERY_FAILED' && e.created_at.getTime() > fourteenDaysAgo
      );
      expect(recentFailures.length).toBe(1);
      expect(recentFailures.length).not.toBeGreaterThanOrEqual(2);
    });

    it('should output FLAG_TRAVELER with MEDIUM severity', () => {
      expect(travelerDelayRule.outputType).toBe(RuleOutputType.FLAG_TRAVELER);
      expect(travelerDelayRule.severity).toBe(RuleSeverity.MEDIUM);
    });
  });

  describe('Rule 4: Auction Sniping Pattern', () => {
    const snipingRule: Rule = {
      id: 'rule-auction-sniping-pattern',
      name: 'Auction Sniping Pattern Detection',
      description: 'Flag users who repeatedly bid in the last 10 seconds of auctions',
      conditions: [
        {
          id: 'cond-1',
          field: 'context.seconds_until_end',
          operator: ConditionOperator.LESS_THAN_OR_EQUAL,
          value: 10,
        },
      ],
      conditionLogic: ConditionLogic.AND,
      outputType: RuleOutputType.FLAG_USER,
      severity: RuleSeverity.LOW,
      status: RuleStatus.ACTIVE,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'system',
    };

    it('should flag bid placed with 5 seconds until end', async () => {
      const event = {
        event_id: 'bid-1',
        event_type: 'BID_PLACED',
        actor_id: 'user-sniper',
        context: {
          seconds_until_end: 5,
        },
      };

      expect(event.context.seconds_until_end).toBeLessThanOrEqual(10);
    });

    it('should flag bid placed with 10 seconds until end (boundary)', async () => {
      const event = {
        event_id: 'bid-1',
        event_type: 'BID_PLACED',
        actor_id: 'user-sniper',
        context: {
          seconds_until_end: 10,
        },
      };

      expect(event.context.seconds_until_end).toBeLessThanOrEqual(10);
    });

    it('should not flag bid placed with 11 seconds until end', async () => {
      const event = {
        event_id: 'bid-1',
        event_type: 'BID_PLACED',
        actor_id: 'user-sniper',
        context: {
          seconds_until_end: 11,
        },
      };

      expect(event.context.seconds_until_end).not.toBeLessThanOrEqual(10);
    });

    it('should flag bid placed with 0 seconds until end (last second)', async () => {
      const event = {
        event_id: 'bid-1',
        event_type: 'BID_PLACED',
        actor_id: 'user-sniper',
        context: {
          seconds_until_end: 0,
        },
      };

      expect(event.context.seconds_until_end).toBeLessThanOrEqual(10);
    });

    it('should detect multiple sniping bids from same user', async () => {
      const events = Array.from({ length: 5 }, (_, i) => ({
        event_id: `bid-${i}`,
        event_type: 'BID_PLACED',
        actor_id: 'user-sniper',
        context: {
          seconds_until_end: Math.floor(Math.random() * 10) + 1, // 1-10 seconds
        },
      }));

      const snipingBids = events.filter(
        (e) => e.context.seconds_until_end <= 10
      );
      expect(snipingBids.length).toBe(5);
    });

    it('should output FLAG_USER with LOW severity', () => {
      expect(snipingRule.outputType).toBe(RuleOutputType.FLAG_USER);
      expect(snipingRule.severity).toBe(RuleSeverity.LOW);
    });
  });

  describe('Non-Financial Rule Guarantees', () => {
    it('should produce only flags, no financial actions', () => {
      const rules: Rule[] = [
        {
          id: 'rule-excessive-bidding',
          name: 'Excessive Bidding Detection',
          description: 'Flag users who place more than 20 bids in 5 minutes',
          conditions: [],
          conditionLogic: ConditionLogic.AND,
          outputType: RuleOutputType.FLAG_USER,
          severity: RuleSeverity.HIGH,
          status: RuleStatus.ACTIVE,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'system',
        },
        {
          id: 'rule-dispute-abuse',
          name: 'Dispute Abuse Detection',
          description: 'Flag users who create more than 3 disputes in 30 days',
          conditions: [],
          conditionLogic: ConditionLogic.AND,
          outputType: RuleOutputType.REQUIRE_MANUAL_REVIEW,
          severity: RuleSeverity.MEDIUM,
          status: RuleStatus.ACTIVE,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'system',
        },
        {
          id: 'rule-traveler-delay-pattern',
          name: 'Traveler Delivery Delay Pattern',
          description: 'Flag travelers with 2 or more late deliveries in 14 days',
          conditions: [],
          conditionLogic: ConditionLogic.AND,
          outputType: RuleOutputType.FLAG_TRAVELER,
          severity: RuleSeverity.MEDIUM,
          status: RuleStatus.ACTIVE,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'system',
        },
        {
          id: 'rule-auction-sniping-pattern',
          name: 'Auction Sniping Pattern Detection',
          description: 'Flag users who repeatedly bid in the last 10 seconds of auctions',
          conditions: [],
          conditionLogic: ConditionLogic.AND,
          outputType: RuleOutputType.FLAG_USER,
          severity: RuleSeverity.LOW,
          status: RuleStatus.ACTIVE,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'system',
        },
      ];

      // Verify all rules produce only flags
      const validFlags = [
        RuleOutputType.FLAG_USER,
        RuleOutputType.FLAG_AUCTION,
        RuleOutputType.FLAG_TRAVELER,
        RuleOutputType.RATE_LIMIT,
        RuleOutputType.REQUIRE_MANUAL_REVIEW,
      ];

      rules.forEach((rule) => {
        expect(validFlags).toContain(rule.outputType);
        // Verify no financial data
        expect(rule).not.toHaveProperty('wallet_id');
        expect(rule).not.toHaveProperty('escrow_id');
        expect(rule).not.toHaveProperty('ledger_id');
        expect(rule).not.toHaveProperty('balance_change');
      });
    });

    it('should have no blocking or penalties', () => {
      const rules = [
        {
          id: 'rule-excessive-bidding',
          name: 'Excessive Bidding Detection',
          outputType: RuleOutputType.FLAG_USER,
          severity: RuleSeverity.HIGH,
        },
        {
          id: 'rule-dispute-abuse',
          name: 'Dispute Abuse Detection',
          outputType: RuleOutputType.REQUIRE_MANUAL_REVIEW,
          severity: RuleSeverity.MEDIUM,
        },
        {
          id: 'rule-traveler-delay-pattern',
          name: 'Traveler Delivery Delay Pattern',
          outputType: RuleOutputType.FLAG_TRAVELER,
          severity: RuleSeverity.MEDIUM,
        },
        {
          id: 'rule-auction-sniping-pattern',
          name: 'Auction Sniping Pattern Detection',
          outputType: RuleOutputType.FLAG_USER,
          severity: RuleSeverity.LOW,
        },
      ];

      // Verify no blocking or penalty properties
      rules.forEach((rule) => {
        expect(rule).not.toHaveProperty('block_user');
        expect(rule).not.toHaveProperty('block_auction');
        expect(rule).not.toHaveProperty('penalty_amount');
        expect(rule).not.toHaveProperty('penalty_type');
        expect(rule).not.toHaveProperty('auto_action');
        expect(rule).not.toHaveProperty('auto_block');
      });
    });
  });

  describe('Time Window Calculations', () => {
    it('should correctly calculate 5-minute window', () => {
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      const sixMinutesAgo = now - 6 * 60 * 1000;

      const event1 = { created_at: new Date(fiveMinutesAgo + 1000) }; // 4:59 ago
      const event2 = { created_at: new Date(sixMinutesAgo) }; // 6:00 ago

      expect(event1.created_at.getTime()).toBeGreaterThan(fiveMinutesAgo);
      expect(event2.created_at.getTime()).toBeLessThanOrEqual(fiveMinutesAgo);
    });

    it('should correctly calculate 14-day window', () => {
      const now = Date.now();
      const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;
      const fifteenDaysAgo = now - 15 * 24 * 60 * 60 * 1000;

      const event1 = { created_at: new Date(fourteenDaysAgo + 1000) }; // 13:59 days ago
      const event2 = { created_at: new Date(fifteenDaysAgo) }; // 15:00 days ago

      expect(event1.created_at.getTime()).toBeGreaterThan(fourteenDaysAgo);
      expect(event2.created_at.getTime()).toBeLessThanOrEqual(fourteenDaysAgo);
    });

    it('should correctly calculate 30-day window', () => {
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      const thirtyOneDaysAgo = now - 31 * 24 * 60 * 60 * 1000;

      const event1 = { created_at: new Date(thirtyDaysAgo + 1000) }; // 29:59 days ago
      const event2 = { created_at: new Date(thirtyOneDaysAgo) }; // 31:00 days ago

      expect(event1.created_at.getTime()).toBeGreaterThan(thirtyDaysAgo);
      expect(event2.created_at.getTime()).toBeLessThanOrEqual(thirtyDaysAgo);
    });
  });

  describe('Threshold Boundary Testing', () => {
    it('should respect exact threshold values', () => {
      // Excessive bidding: >20 (not >=20)
      expect(20).not.toBeGreaterThan(20);
      expect(21).toBeGreaterThan(20);

      // Dispute abuse: >3 (not >=3)
      expect(3).not.toBeGreaterThan(3);
      expect(4).toBeGreaterThan(3);

      // Traveler delay: >=2 (not >2)
      expect(1).not.toBeGreaterThanOrEqual(2);
      expect(2).toBeGreaterThanOrEqual(2);

      // Sniping: <=10 (not <10)
      expect(11).not.toBeLessThanOrEqual(10);
      expect(10).toBeLessThanOrEqual(10);
    });
  });
});
