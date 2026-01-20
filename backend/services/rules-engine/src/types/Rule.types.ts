/**
 * Rule Result Enum
 * Defines the possible outcomes of rule evaluation
 */
export enum RuleResult {
  ALLOW = 'ALLOW',
  DENY = 'DENY',
  FLAG = 'FLAG'
}

/**
 * Rule Severity Enum
 * Defines the severity level for flagged rules
 */
export enum RuleSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Generic Context Interface
 * Provides a flexible structure for rule evaluation context
 */
export interface RuleContext {
  actor: {
    id: string;
    type: 'USER' | 'SYSTEM' | 'ADMIN' | 'SERVICE';
    metadata?: Record<string, any>;
  };
  target: {
    id: string;
    type: 'USER' | 'AUCTION' | 'TRANSACTION' | 'LISTING' | 'PAYMENT' | 'WALLET';
    metadata?: Record<string, any>;
  };
  action: {
    type: 'BID' | 'PAY' | 'LIST' | 'WITHDRAW' | 'TRANSFER' | 'REGISTER' | 'LOGIN';
    metadata?: Record<string, any>;
  };
  environment: {
    timestamp: Date;
    ip?: string;
    userAgent?: string;
    sessionId?: string;
    metadata?: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

/**
 * Rule Interface
 * Defines the structure for all rules in the system
 */
export interface Rule {
  id: string;
  description: string;
  appliesTo: Array<{
    actorType?: string;
    targetType?: string;
    actionType?: string;
  }>;
  severity?: RuleSeverity;
  evaluate(context: RuleContext): Promise<RuleEvaluationResult>;
}

/**
 * Rule Evaluation Result
 * Contains the result of rule evaluation along with metadata
 */
export interface RuleEvaluationResult {
  ruleId: string;
  result: RuleResult;
  reason?: string | undefined;
  severity?: RuleSeverity | undefined;
  metadata?: Record<string, any> | undefined;
  evaluatedAt: Date;
}

/**
 * Rule Engine Evaluation Summary
 * Contains aggregated results from multiple rule evaluations
 */
export interface RuleEngineEvaluationSummary {
  context: RuleContext;
  results: RuleEvaluationResult[];
  summary: {
    total: number;
    allow: number;
    deny: number;
    flag: number;
  };
  finalDecision: RuleResult;
  evaluatedAt: Date;
}

/**
 * Rule Registration Options
 * Options for registering rules in the engine
 */
export interface RuleRegistrationOptions {
  enabled?: boolean;
  priority?: number;
  tags?: string[];
}
