/**
 * RulesEngineService - Read-Only Rules Engine
 * SECURITY-CRITICAL: Bank-facing infrastructure
 * 
 * ABSOLUTE RULES:
 * - Engine reads ONLY from Event table
 * - Engine produces ONLY flags (no actions)
 * - Engine NEVER writes to Wallet / Escrow / Ledger
 * - Engine has NO financial side effects
 * - No side effects, no mutations, no state changes
 */

import { PrismaService } from '../prisma/prisma.service';
import {
  Rule,
  EvaluationResult,
  RuleEvaluationContext,
  ConditionEvaluationResult,
  RuleBatchEvaluationResult,
  RuleValidationError,
  RuleEvaluationError,
} from '../types/rule.types';
import {
  RuleOutputType,
  RuleStatus,
  ConditionOperator,
  ConditionLogic,
} from '../types/rule.enums';

/**
 * Simple logger for Express environment
 */
class Logger {
  constructor(private context: string) {}

  debug(message: string) {
    console.debug(`[${this.context}] ${message}`);
  }

  error(message: string) {
    console.error(`[${this.context}] ${message}`);
  }
}

/**
 * RulesEngineService - Evaluates rules against events
 * READ-ONLY: No writes to any financial tables
 */
export class RulesEngineService {
  private readonly logger = new Logger(RulesEngineService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Evaluate all active rules for a given context
   * Returns only flags (no actions)
   * 
   * @param context - Evaluation context (user_id, auction_id, etc.)
   * @returns Array of evaluation results (flags)
   */
  async evaluateRules(context: RuleEvaluationContext): Promise<EvaluationResult[]> {
    const startTime = Date.now();

    try {
      // Validate context
      this.validateContext(context);

      // Get all active rules
      const rules = await this.getActiveRules();

      if (rules.length === 0) {
        this.logger.debug('No active rules to evaluate');
        return [];
      }

      // Load events for context if not provided
      if (!context.events) {
        context.events = await this.queryEvents(context);
      }

      // Evaluate each rule
      const results: EvaluationResult[] = [];
      for (const rule of rules) {
        try {
          const result = await this.evaluateRule(rule, context);
          if (result) {
            results.push(result);
          }
        } catch (error) {
          this.logger.error(
            `Error evaluating rule ${rule.id}: ${error.message}`
          );
          // Continue evaluating other rules
        }
      }

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Evaluated ${rules.length} rules, produced ${results.length} flags in ${duration}ms`
      );

      return results;
    } catch (error) {
      throw new RuleEvaluationError(
        `Failed to evaluate rules: ${error.message}`
      );
    }
  }

  /**
   * Evaluate a single rule against context
   * Returns a flag if rule matches, null otherwise
   * 
   * @param rule - Rule to evaluate
   * @param context - Evaluation context
   * @returns EvaluationResult if rule matches, null otherwise
   */
  async evaluateRule(
    rule: Rule,
    context: RuleEvaluationContext
  ): Promise<EvaluationResult | null> {
    try {
      // Validate rule
      this.validateRule(rule);

      // Evaluate conditions
      const conditionResults = await this.evaluateConditions(
        rule.conditions,
        rule.conditionLogic,
        context
      );

      // Check if rule matched
      const ruleMatched = this.checkRuleMatch(
        conditionResults,
        rule.conditionLogic
      );

      if (!ruleMatched) {
        return null;
      }

      // Build evaluation result
      const result: EvaluationResult = {
        rule_id: rule.id,
        rule_name: rule.name,
        output_type: rule.outputType,
        severity: rule.severity,
        reason: `Rule "${rule.name}" matched: ${rule.description}`,
        matched_conditions: conditionResults
          .filter((r) => r.matched)
          .map((r) => r.condition_id),
        evaluated_at: new Date(),
        evaluation_context: context,
      };

      this.logger.debug(
        `Rule ${rule.id} matched, producing flag: ${rule.outputType}`
      );

      return result;
    } catch (error) {
      throw new RuleEvaluationError(
        `Failed to evaluate rule ${rule.id}: ${error.message}`
      );
    }
  }

  /**
   * Evaluate all conditions for a rule
   * 
   * @param conditions - Conditions to evaluate
   * @param logic - How to combine conditions (AND/OR)
   * @param context - Evaluation context
   * @returns Array of condition evaluation results
   */
  private async evaluateConditions(
    conditions: any[],
    logic: ConditionLogic,
    context: RuleEvaluationContext
  ): Promise<ConditionEvaluationResult[]> {
    const results: ConditionEvaluationResult[] = [];

    for (const condition of conditions) {
      try {
        const result = await this.evaluateCondition(condition, context);
        results.push(result);
      } catch (error) {
        this.logger.error(
          `Error evaluating condition ${condition.id}: ${error.message}`
        );
        // Mark condition as not matched on error
        results.push({
          condition_id: condition.id,
          field: condition.field,
          operator: condition.operator,
          value: condition.value,
          matched: false,
        });
      }
    }

    return results;
  }

  /**
   * Evaluate a single condition against events
   * 
   * @param condition - Condition to evaluate
   * @param context - Evaluation context
   * @returns Condition evaluation result
   */
  private async evaluateCondition(
    condition: any,
    context: RuleEvaluationContext
  ): Promise<ConditionEvaluationResult> {
    // Validate condition
    this.validateCondition(condition);

    // Get events to evaluate against
    const events = context.events || [];

    // Evaluate condition against events
    const matchedEvents = events.filter((event) =>
      this.matchesCondition(event, condition)
    );

    const matched = matchedEvents.length > 0;

    return {
      condition_id: condition.id,
      field: condition.field,
      operator: condition.operator,
      value: condition.value,
      matched,
      matched_events: matched ? matchedEvents : undefined,
    };
  }

  /**
   * Check if an event matches a condition
   * 
   * @param event - Event to check
   * @param condition - Condition to match
   * @returns True if event matches condition
   */
  private matchesCondition(event: any, condition: any): boolean {
    const eventValue = this.getNestedValue(event, condition.field);

    switch (condition.operator) {
      case ConditionOperator.EQUALS:
        return eventValue === condition.value;

      case ConditionOperator.NOT_EQUALS:
        return eventValue !== condition.value;

      case ConditionOperator.GREATER_THAN:
        return eventValue > condition.value;

      case ConditionOperator.LESS_THAN:
        return eventValue < condition.value;

      case ConditionOperator.GREATER_THAN_OR_EQUAL:
        return eventValue >= condition.value;

      case ConditionOperator.LESS_THAN_OR_EQUAL:
        return eventValue <= condition.value;

      case ConditionOperator.IN:
        return Array.isArray(condition.value) &&
          condition.value.includes(eventValue);

      case ConditionOperator.NOT_IN:
        return Array.isArray(condition.value) &&
          !condition.value.includes(eventValue);

      case ConditionOperator.CONTAINS:
        return (
          typeof eventValue === 'string' &&
          eventValue.includes(condition.value)
        );

      case ConditionOperator.NOT_CONTAINS:
        return (
          typeof eventValue === 'string' &&
          !eventValue.includes(condition.value)
        );

      case ConditionOperator.STARTS_WITH:
        return (
          typeof eventValue === 'string' &&
          eventValue.startsWith(condition.value)
        );

      case ConditionOperator.ENDS_WITH:
        return (
          typeof eventValue === 'string' &&
          eventValue.endsWith(condition.value)
        );

      default:
        throw new RuleEvaluationError(
          `Unknown operator: ${condition.operator}`
        );
    }
  }

  /**
   * Get nested value from object using dot notation
   * e.g., 'context.amount' -> event.context.amount
   * 
   * @param obj - Object to get value from
   * @param path - Path to value (dot notation)
   * @returns Value at path
   */
  private getNestedValue(obj: any, path: string): any {
    const parts = path.split('.');
    let value = obj;

    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }

  /**
   * Check if rule matched based on condition results and logic
   * 
   * @param results - Condition evaluation results
   * @param logic - How to combine conditions (AND/OR)
   * @returns True if rule matched
   */
  private checkRuleMatch(
    results: ConditionEvaluationResult[],
    logic: ConditionLogic
  ): boolean {
    if (results.length === 0) {
      return false;
    }

    if (logic === ConditionLogic.AND) {
      return results.every((r) => r.matched);
    } else if (logic === ConditionLogic.OR) {
      return results.some((r) => r.matched);
    } else {
      throw new RuleEvaluationError(`Unknown logic: ${logic}`);
    }
  }

  /**
   * Query events for a given context
   * READ-ONLY: Only reads from Event table
   * 
   * @param context - Evaluation context
   * @returns Array of events
   */
  private async queryEvents(context: RuleEvaluationContext): Promise<any[]> {
    try {
      const timeWindow = context.time_window_minutes || 60;
      const since = new Date(Date.now() - timeWindow * 60 * 1000);

      // Build query filters
      const filters: any = {
        created_at: {
          gte: since,
        },
      };

      if (context.user_id) {
        filters.actor_id = context.user_id;
      }

      if (context.auction_id) {
        filters.target_id = context.auction_id;
      }

      // Query events (READ-ONLY)
      const events = await this.prisma.event.findMany({
        where: filters,
        orderBy: {
          created_at: 'desc',
        },
        take: 1000, // Limit to prevent memory issues
      });

      this.logger.debug(
        `Queried ${events.length} events for context: user_id=${context.user_id}, auction_id=${context.auction_id}`
      );

      return events;
    } catch (error) {
      throw new RuleEvaluationError(
        `Failed to query events: ${error.message}`
      );
    }
  }

  /**
   * Get all active rules
   * READ-ONLY: Only reads from Rule table
   * 
   * @returns Array of active rules
   */
  private async getActiveRules(): Promise<Rule[]> {
    try {
      // Query active rules (READ-ONLY)
      const rules = await this.prisma.rule.findMany({
        where: {
          status: RuleStatus.ACTIVE,
        },
        orderBy: {
          created_at: 'asc',
        },
      });

      this.logger.debug(`Loaded ${rules.length} active rules`);

      return rules;
    } catch (error) {
      throw new RuleEvaluationError(
        `Failed to load active rules: ${error.message}`
      );
    }
  }

  /**
   * Validate evaluation context
   * 
   * @param context - Context to validate
   * @throws RuleValidationError if context is invalid
   */
  private validateContext(context: RuleEvaluationContext): void {
    if (!context) {
      throw new RuleValidationError('Evaluation context is required');
    }

    // At least one context field must be provided
    if (
      !context.user_id &&
      !context.auction_id &&
      !context.traveler_id &&
      !context.events
    ) {
      throw new RuleValidationError(
        'At least one of user_id, auction_id, traveler_id, or events must be provided'
      );
    }
  }

  /**
   * Validate rule
   * 
   * @param rule - Rule to validate
   * @throws RuleValidationError if rule is invalid
   */
  private validateRule(rule: Rule): void {
    if (!rule) {
      throw new RuleValidationError('Rule is required');
    }

    if (!rule.id) {
      throw new RuleValidationError('Rule ID is required');
    }

    if (!rule.conditions || rule.conditions.length === 0) {
      throw new RuleValidationError('Rule must have at least one condition');
    }

    if (!rule.outputType || !Object.values(RuleOutputType).includes(rule.outputType)) {
      throw new RuleValidationError(
        `Invalid output type: ${rule.outputType}`
      );
    }

    if (!rule.conditionLogic || !Object.values(ConditionLogic).includes(rule.conditionLogic)) {
      throw new RuleValidationError(
        `Invalid condition logic: ${rule.conditionLogic}`
      );
    }
  }

  /**
   * Validate condition
   * 
   * @param condition - Condition to validate
   * @throws RuleValidationError if condition is invalid
   */
  private validateCondition(condition: any): void {
    if (!condition) {
      throw new RuleValidationError('Condition is required');
    }

    if (!condition.id) {
      throw new RuleValidationError('Condition ID is required');
    }

    if (!condition.field) {
      throw new RuleValidationError('Condition field is required');
    }

    if (!condition.operator || !Object.values(ConditionOperator).includes(condition.operator)) {
      throw new RuleValidationError(
        `Invalid operator: ${condition.operator}`
      );
    }

    if (condition.value === undefined || condition.value === null) {
      throw new RuleValidationError('Condition value is required');
    }
  }
}
