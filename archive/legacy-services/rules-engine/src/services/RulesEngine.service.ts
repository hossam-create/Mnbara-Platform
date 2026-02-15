import { 
  Rule, 
  RuleContext, 
  RuleResult, 
  RuleSeverity,
  RuleEvaluationResult, 
  RuleEngineEvaluationSummary,
  RuleRegistrationOptions 
} from '../types/Rule.types';
import { adminStatistics } from './AdminStatistics.service';

/**
 * Basic Rules Engine Service
 * 
 * This service provides a deterministic rules engine that evaluates system decisions
 * without executing money movement or side effects.
 * 
 * Key Principles:
 * - Frontend has ZERO authority
 * - Rules NEVER move money
 * - Rules only RETURN decisions (ALLOW / DENY / FLAG)
 * - Every rule evaluation MUST be logged as an event
 * - Rules are deterministic (no ML, no randomness)
 */
export class RulesEngine {
  private rules: Map<string, Rule> = new Map();
  private ruleOptions: Map<string, RuleRegistrationOptions> = new Map();
  private evaluationLog: RuleEvaluationResult[] = [];

  /**
   * Register a new rule in the engine
   * 
   * @param rule The rule to register
   * @param options Optional registration options
   */
  registerRule(rule: Rule, options: RuleRegistrationOptions = {}): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`Rule with id '${rule.id}' is already registered`);
    }

    this.rules.set(rule.id, rule);
    this.ruleOptions.set(rule.id, {
      enabled: options.enabled ?? true,
      priority: options.priority ?? 0,
      tags: options.tags ?? []
    });

    console.log(`[RulesEngine] Registered rule: ${rule.id} - ${rule.description}`);
  }

  /**
   * Unregister a rule from the engine
   * 
   * @param ruleId The ID of the rule to unregister
   */
  unregisterRule(ruleId: string): void {
    if (!this.rules.has(ruleId)) {
      throw new Error(`Rule with id '${ruleId}' is not registered`);
    }

    this.rules.delete(ruleId);
    this.ruleOptions.delete(ruleId);
    console.log(`[RulesEngine] Unregistered rule: ${ruleId}`);
  }

  /**
   * Get all registered rules
   * 
   * @returns Array of all registered rules
   */
  getRegisteredRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rules that apply to a specific context
   * 
   * @param context The evaluation context
   * @returns Array of applicable rules
   */
  getApplicableRules(context: RuleContext): Rule[] {
    return Array.from(this.rules.values()).filter(rule => {
      const options = this.ruleOptions.get(rule.id);
      if (!options?.enabled) {
        return false;
      }

      return rule.appliesTo.some(condition => {
        if (condition.actorType && condition.actorType !== context.actor.type) {
          return false;
        }
        if (condition.targetType && condition.targetType !== context.target.type) {
          return false;
        }
        if (condition.actionType && condition.actionType !== context.action.type) {
          return false;
        }
        return true;
      });
    });
  }

  /**
   * Evaluate a single rule against a context
   * 
   * @param rule The rule to evaluate
   * @param context The evaluation context
   * @returns Promise resolving to the evaluation result
   */
  async evaluateRule(rule: Rule, context: RuleContext): Promise<RuleEvaluationResult> {
    try {
      const result = await rule.evaluate(context);
      const evaluationResult: RuleEvaluationResult = {
        ruleId: rule.id,
        result: result.result,
        reason: result.reason ?? '',
        severity: result.severity ?? rule.severity,
        metadata: result.metadata,
        evaluatedAt: new Date()
      };

      // Log every rule evaluation
      this.logEvaluation(evaluationResult);
      
      // Update admin statistics
      adminStatistics.updateRuleStats(evaluationResult);

      return evaluationResult;
    } catch (error) {
      const errorResult: RuleEvaluationResult = {
        ruleId: rule.id,
        result: RuleResult.DENY,
        reason: `Rule evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: RuleSeverity.HIGH,
        metadata: { error: error instanceof Error ? error.stack : String(error) },
        evaluatedAt: new Date()
      };

      this.logEvaluation(errorResult);
      
      // Update admin statistics
      adminStatistics.updateRuleStats(errorResult);
      return errorResult;
    }
  }

  /**
   * Evaluate all applicable rules against a context
   * 
   * @param context The evaluation context
   * @returns Promise resolving to evaluation summary
   */
  async evaluate(context: RuleContext): Promise<RuleEngineEvaluationSummary> {
    const applicableRules = this.getApplicableRules(context);
    
    if (applicableRules.length === 0) {
      const summary: RuleEngineEvaluationSummary = {
        context,
        results: [],
        summary: {
          total: 0,
          allow: 0,
          deny: 0,
          flag: 0
        },
        finalDecision: RuleResult.ALLOW,
        evaluatedAt: new Date()
      };

      console.log(`[RulesEngine] No applicable rules found for context: ${context.action.type} by ${context.actor.type}`);
      return summary;
    }

    console.log(`[RulesEngine] Evaluating ${applicableRules.length} rules for context: ${context.action.type} by ${context.actor.type}`);

    // Evaluate all rules in parallel (deterministic order by priority)
    const sortedRules = applicableRules.sort((a, b) => {
      const priorityA = this.ruleOptions.get(a.id)?.priority ?? 0;
      const priorityB = this.ruleOptions.get(b.id)?.priority ?? 0;
      return priorityB - priorityA; // Higher priority first
    });

    const results = await Promise.all(
      sortedRules.map(rule => this.evaluateRule(rule, context))
    );

    // Calculate summary
    const summary = {
      total: results.length,
      allow: results.filter(r => r.result === RuleResult.ALLOW).length,
      deny: results.filter(r => r.result === RuleResult.DENY).length,
      flag: results.filter(r => r.result === RuleResult.FLAG).length
    };

    // Determine final decision (DENY overrides everything, FLAG overrides ALLOW)
    let finalDecision = RuleResult.ALLOW;
    if (summary.deny > 0) {
      finalDecision = RuleResult.DENY;
    } else if (summary.flag > 0) {
      finalDecision = RuleResult.FLAG;
    }

    const evaluationSummary: RuleEngineEvaluationSummary = {
      context,
      results,
      summary,
      finalDecision,
      evaluatedAt: new Date()
    };

    console.log(`[RulesEngine] Evaluation complete: ${finalDecision} (${summary.deny} deny, ${summary.flag} flag, ${summary.allow} allow)`);
    return evaluationSummary;
  }

  /**
   * Get evaluation log
   * 
   * @param limit Optional limit for number of results
   * @returns Array of evaluation results
   */
  getEvaluationLog(limit?: number): RuleEvaluationResult[] {
    if (limit) {
      return this.evaluationLog.slice(-limit);
    }
    return [...this.evaluationLog];
  }

  /**
   * Clear evaluation log
   */
  clearEvaluationLog(): void {
    this.evaluationLog = [];
    console.log('[RulesEngine] Evaluation log cleared');
  }

  /**
   * Get statistics about rule evaluations
   * 
   * @returns Statistics object
   */
  getStatistics(): {
    totalRules: number;
    enabledRules: number;
    totalEvaluations: number;
    recentEvaluations: {
      allow: number;
      deny: number;
      flag: number;
    };
  } {
    const totalRules = this.rules.size;
    const enabledRules = Array.from(this.ruleOptions.values()).filter(opts => opts.enabled).length;
    const totalEvaluations = this.evaluationLog.length;

    const recentEvaluations = this.evaluationLog.slice(-100).reduce(
      (acc, evaluation) => {
        const resultKey = evaluation.result.toLowerCase() as keyof typeof acc;
        acc[resultKey]++;
        return acc;
      },
      { allow: 0, deny: 0, flag: 0 }
    );

    return {
      totalRules,
      enabledRules,
      totalEvaluations,
      recentEvaluations
    };
  }

  /**
   * Log evaluation result
   * 
   * @param result The evaluation result to log
   */
  private logEvaluation(result: RuleEvaluationResult): void {
    this.evaluationLog.push(result);
    
    // Keep log size manageable (keep last 10000 evaluations)
    if (this.evaluationLog.length > 10000) {
      this.evaluationLog = this.evaluationLog.slice(-10000);
    }

    console.log(`[RulesEngine] Rule ${result.ruleId} evaluated: ${result.result} - ${result.reason || 'No reason provided'}`);
  }
}

// Singleton instance
export const rulesEngine = new RulesEngine();
