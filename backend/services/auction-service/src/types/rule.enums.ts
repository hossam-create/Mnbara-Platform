/**
 * Rules Engine - ENUMS
 * SECURITY-CRITICAL: Bank-facing infrastructure
 * 
 * ABSOLUTE RULES:
 * - Engine reads ONLY from Event table
 * - Engine produces ONLY flags (no actions)
 * - Engine NEVER writes to Wallet / Escrow / Ledger
 * - Engine has NO financial side effects
 */

/**
 * Rule Output Type - Type of flag produced by rule
 * STRICT: Only these 5 output types allowed
 */
export enum RuleOutputType {
  FLAG_USER = 'FLAG_USER',           // Flag user for review
  FLAG_AUCTION = 'FLAG_AUCTION',     // Flag auction for review
  FLAG_TRAVELER = 'FLAG_TRAVELER',   // Flag traveler for review
  RATE_LIMIT = 'RATE_LIMIT',         // Rate limit user
  REQUIRE_MANUAL_REVIEW = 'REQUIRE_MANUAL_REVIEW', // Require manual review
}

/**
 * Rule Status - Status of rule evaluation
 */
export enum RuleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISABLED = 'DISABLED',
}

/**
 * Rule Severity - Severity level of flag
 */
export enum RuleSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Condition Operator - Operator for condition evaluation
 */
export enum ConditionOperator {
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
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
}

/**
 * Condition Logic - Logic for combining conditions
 */
export enum ConditionLogic {
  AND = 'AND',
  OR = 'OR',
}
