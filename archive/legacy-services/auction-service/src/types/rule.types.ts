/**
 * Rules Engine - TYPE DEFINITIONS
 * SECURITY-CRITICAL: Bank-facing infrastructure
 * 
 * ABSOLUTE RULES:
 * - Engine reads ONLY from Event table
 * - Engine produces ONLY flags (no actions)
 * - Engine NEVER writes to Wallet / Escrow / Ledger
 * - Engine has NO financial side effects
 */

import {
  RuleOutputType,
  RuleStatus,
  RuleSeverity,
  ConditionOperator,
  ConditionLogic,
} from './rule.enums';
import { EventType, EventCategory, ActorType, TargetType } from './event.enums';

/**
 * Condition - Single condition to evaluate against events
 * Conditions are evaluated against event data
 */
export interface Condition {
  id: string;
  field: string; // Event field to evaluate (e.g., 'event_type', 'actor_id', 'context.amount')
  operator: ConditionOperator; // Comparison operator
  value: any; // Value to compare against
  logic?: ConditionLogic; // Logic for combining with other conditions (AND/OR)
}

/**
 * Rule - Complete rule definition
 * Rules are read-only and produce only flags
 */
export interface Rule {
  id: string;
  name: string;
  description: string;
  
  // Rule configuration
  conditions: Condition[]; // Conditions to evaluate
  conditionLogic: ConditionLogic; // How to combine conditions (AND/OR)
  
  // Output configuration
  outputType: RuleOutputType; // Type of flag to produce
  severity: RuleSeverity; // Severity level of flag
  
  // Status
  status: RuleStatus; // ACTIVE, INACTIVE, DISABLED
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  created_by: string; // User ID who created the rule
}

/**
 * Rule Evaluation Result - Output of rule evaluation
 * Represents a flag produced by the rules engine
 */
export interface EvaluationResult {
  rule_id: string;
  rule_name: string;
  
  // Flag information
  output_type: RuleOutputType;
  severity: RuleSeverity;
  
  // Context
  reason: string; // Human-readable reason for the flag
  matched_conditions: string[]; // Which conditions matched
  
  // Metadata
  evaluated_at: Date;
  evaluation_context: RuleEvaluationContext;
}

/**
 * Rule Evaluation Context - Context for evaluating rules
 * Contains all data needed to evaluate a rule
 */
export interface RuleEvaluationContext {
  // User context
  user_id?: string;
  actor_type?: ActorType;
  
  // Auction context
  auction_id?: string;
  
  // Traveler context
  traveler_id?: string;
  
  // Time window for event queries
  time_window_minutes?: number; // How far back to look for events (default: 60)
  
  // Events to evaluate against
  events?: any[]; // Pre-loaded events (optional, will be queried if not provided)
}

/**
 * Rule Query Filters - Filters for querying rules
 */
export interface RuleQueryFilters {
  status?: RuleStatus | RuleStatus[];
  output_type?: RuleOutputType | RuleOutputType[];
  severity?: RuleSeverity | RuleSeverity[];
  created_after?: Date;
  created_before?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Rule Creation Input - Input for creating a new rule
 */
export interface CreateRuleInput {
  name: string;
  description: string;
  conditions: Condition[];
  conditionLogic: ConditionLogic;
  outputType: RuleOutputType;
  severity: RuleSeverity;
  status: RuleStatus;
  created_by: string;
}

/**
 * Rule Update Input - Input for updating a rule
 */
export interface UpdateRuleInput {
  name?: string;
  description?: string;
  conditions?: Condition[];
  conditionLogic?: ConditionLogic;
  outputType?: RuleOutputType;
  severity?: RuleSeverity;
  status?: RuleStatus;
}

/**
 * Condition Evaluation Result - Result of evaluating a single condition
 */
export interface ConditionEvaluationResult {
  condition_id: string;
  field: string;
  operator: ConditionOperator;
  value: any;
  matched: boolean;
  matched_events?: any[]; // Events that matched this condition
}

/**
 * Rule Batch Evaluation Result - Result of evaluating multiple rules
 */
export interface RuleBatchEvaluationResult {
  context: RuleEvaluationContext;
  results: EvaluationResult[];
  total_rules_evaluated: number;
  total_flags_produced: number;
  evaluation_duration_ms: number;
  evaluated_at: Date;
}

/**
 * Rule Statistics - Statistics about rule evaluations
 */
export interface RuleStatistics {
  total_rules: number;
  active_rules: number;
  inactive_rules: number;
  disabled_rules: number;
  
  rules_by_output_type: Record<RuleOutputType, number>;
  rules_by_severity: Record<RuleSeverity, number>;
  
  total_evaluations: number;
  total_flags_produced: number;
  flags_by_output_type: Record<RuleOutputType, number>;
  flags_by_severity: Record<RuleSeverity, number>;
  
  time_range: {
    start: Date;
    end: Date;
  };
}

/**
 * Rule Validation Error - Error thrown during rule validation
 */
export class RuleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuleValidationError';
  }
}

/**
 * Rule Evaluation Error - Error thrown during rule evaluation
 */
export class RuleEvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuleEvaluationError';
  }
}
