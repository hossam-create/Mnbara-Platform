/**
 * Rules Engine
 * 
 * Evaluates configurable rules against user features and events.
 * Supports rule chaining, priority, and real-time execution.
 */

import { getFeatureStore } from './feature-store';
import { prisma } from './prisma';

// ============================================================
// RULE TYPES
// ============================================================

export enum RuleOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
}

export enum RuleAction {
  ALERT = 'ALERT',
  HOLD_ESCROW = 'HOLD_ESCROW',
  RATE_LIMIT = 'RATE_LIMIT',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
  SUSPEND = 'SUSPEND',
  BAN = 'BAN',
}

export enum RulePriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
}

export interface RuleCondition {
  feature: string;
  operator: RuleOperator;
  value: unknown;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  conditions: RuleCondition[];
  action: RuleAction;
  priority: RulePriority;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleExecutionResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  action: RuleAction | null;
  priority: RulePriority | null;
  reason: string;
  executedAt: Date;
}

// ============================================================
// RULES ENGINE
// ============================================================

export class RulesEngine {
  private rules: Map<string, Rule> = new Map();
  private executionLog: RuleExecutionResult[] = [];

  /**
   * Register a rule
   */
  registerRule(rule: Rule): void {
    if (!rule.enabled) {
      return;
    }

    this.rules.set(rule.id, rule);
    console.log(`[RULES_ENGINE] Registered rule: ${rule.name}`);
  }

  /**
   * Unregister a rule
   */
  unregisterRule(ruleId: string): void {
    this.rules.delete(ruleId);
    console.log(`[RULES_ENGINE] Unregistered rule: ${ruleId}`);
  }

  /**
   * Evaluate all rules for a user
   */
  async evaluateRulesForUser(userId: number): Promise<RuleExecutionResult[]> {
    const featureStore = getFeatureStore();
    const userFeatures = await featureStore.getUserFeatures(userId);

    const results: RuleExecutionResult[] = [];

    for (const [, rule] of this.rules) {
      const result = await this.evaluateRule(rule, userFeatures.features);
      results.push(result);

      // Log execution
      this.executionLog.push(result);
    }

    // Sort by priority (highest first)
    results.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return results;
  }

  /**
   * Evaluate a single rule
   */
  private async evaluateRule(
    rule: Rule,
    features: Record<string, { value: number }>
  ): Promise<RuleExecutionResult> {
    try {
      // Evaluate all conditions
      const allConditionsMet = rule.conditions.every(condition =>
        this.evaluateCondition(condition, features)
      );

      if (allConditionsMet) {
        console.log(`[RULES_ENGINE] Rule matched: ${rule.name}`);
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          matched: true,
          action: rule.action,
          priority: rule.priority,
          reason: `All conditions met for rule: ${rule.name}`,
          executedAt: new Date(),
        };
      }

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        matched: false,
        action: null,
        priority: null,
        reason: `Conditions not met for rule: ${rule.name}`,
        executedAt: new Date(),
      };
    } catch (error) {
      console.error(`[RULES_ENGINE] Error evaluating rule ${rule.name}:`, error);
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        matched: false,
        action: null,
        priority: null,
        reason: `Error evaluating rule: ${error}`,
        executedAt: new Date(),
      };
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: RuleCondition,
    features: Record<string, { value: number }>
  ): boolean {
    const feature = features[condition.feature];

    if (!feature) {
      console.warn(`[RULES_ENGINE] Feature not found: ${condition.feature}`);
      return false;
    }

    const featureValue = feature.value;

    switch (condition.operator) {
      case RuleOperator.EQUALS:
        return featureValue === condition.value;

      case RuleOperator.NOT_EQUALS:
        return featureValue !== condition.value;

      case RuleOperator.GREATER_THAN:
        return featureValue > (condition.value as number);

      case RuleOperator.LESS_THAN:
        return featureValue < (condition.value as number);

      case RuleOperator.GREATER_THAN_OR_EQUAL:
        return featureValue >= (condition.value as number);

      case RuleOperator.LESS_THAN_OR_EQUAL:
        return featureValue <= (condition.value as number);

      case RuleOperator.IN:
        return (condition.value as unknown[]).includes(featureValue);

      case RuleOperator.NOT_IN:
        return !(condition.value as unknown[]).includes(featureValue);

      case RuleOperator.CONTAINS:
        return String(featureValue).includes(String(condition.value));

      case RuleOperator.NOT_CONTAINS:
        return !String(featureValue).includes(String(condition.value));

      default:
        return false;
    }
  }

  /**
   * Get execution log
   */
  getExecutionLog(limit: number = 100): RuleExecutionResult[] {
    return this.executionLog.slice(-limit);
  }

  /**
   * Clear execution log
   */
  clearExecutionLog(): void {
    this.executionLog = [];
  }

  /**
   * Get all registered rules
   */
  getRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): Rule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Get rules by action
   */
  getRulesByAction(action: RuleAction): Rule[] {
    return Array.from(this.rules.values()).filter(rule => rule.action === action);
  }

  /**
   * Get rules by priority
   */
  getRulesByPriority(priority: RulePriority): Rule[] {
    return Array.from(this.rules.values()).filter(rule => rule.priority === priority);
  }
}

// ============================================================
// SAMPLE RULES
// ============================================================

export const SAMPLE_RULES: Rule[] = [
  {
    id: 'rule-high-bid-velocity',
    name: 'High Bid Velocity Alert',
    description: 'Alert when user places more than 10 bids per hour',
    conditions: [
      {
        feature: 'bid_velocity',
        operator: RuleOperator.GREATER_THAN,
        value: 10,
      },
    ],
    action: RuleAction.ALERT,
    priority: RulePriority.MEDIUM,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  {
    id: 'rule-high-dispute-rate',
    name: 'High Dispute Rate Hold',
    description: 'Hold escrow when dispute rate exceeds 20%',
    conditions: [
      {
        feature: 'dispute_rate',
        operator: RuleOperator.GREATER_THAN,
        value: 0.2,
      },
    ],
    action: RuleAction.HOLD_ESCROW,
    priority: RulePriority.HIGH,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  {
    id: 'rule-delivery-delay-warning',
    name: 'Delivery Delay Warning',
    description: 'Manual review when average delivery delay exceeds 7 days',
    conditions: [
      {
        feature: 'avg_delivery_delay',
        operator: RuleOperator.GREATER_THAN,
        value: 7,
      },
    ],
    action: RuleAction.MANUAL_REVIEW,
    priority: RulePriority.MEDIUM,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  {
    id: 'rule-low-win-rate',
    name: 'Low Win Rate Alert',
    description: 'Alert when win rate drops below 10%',
    conditions: [
      {
        feature: 'win_rate',
        operator: RuleOperator.LESS_THAN,
        value: 0.1,
      },
    ],
    action: RuleAction.ALERT,
    priority: RulePriority.LOW,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  {
    id: 'rule-chained-high-risk',
    name: 'Chained High-Risk User',
    description: 'Rate limit when both high bid velocity AND high dispute rate',
    conditions: [
      {
        feature: 'bid_velocity',
        operator: RuleOperator.GREATER_THAN,
        value: 15,
      },
      {
        feature: 'dispute_rate',
        operator: RuleOperator.GREATER_THAN,
        value: 0.15,
      },
    ],
    action: RuleAction.RATE_LIMIT,
    priority: RulePriority.CRITICAL,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// ============================================================
// SINGLETON INSTANCE
// ============================================================

let rulesEngineInstance: RulesEngine | null = null;

export function getRulesEngine(): RulesEngine {
  if (!rulesEngineInstance) {
    rulesEngineInstance = new RulesEngine();

    // Register sample rules
    SAMPLE_RULES.forEach(rule => rulesEngineInstance!.registerRule(rule));
  }

  return rulesEngineInstance;
}
