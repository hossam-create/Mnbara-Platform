import { Rule, RuleContext, RuleResult, RuleSeverity, RuleEvaluationResult } from '../../types/Rule.types';
import { getRuleThreshold } from '../../config/rule.config';

/**
 * TRAVELER_MAX_PENDING_REQUESTS Rule
 * 
 * Denies travelers who have more than the configured maximum number of pending requests
 * 
 * Configuration:
 * - maxPendingRequests: Maximum allowed pending requests (default: 5)
 * - severity: Severity level for denies (default: HIGH)
 * 
 * Environment Variables:
 * - RULE_TRAVELER_MAX_PENDING_REQUESTS: Override max pending requests
 * - RULE_TRAVELER_MAX_PENDING_REQUESTS_SEVERITY: Override severity level
 */
export const TRAVELER_MAX_PENDING_REQUESTS_Rule: Rule = {
  id: 'TRAVELER_MAX_PENDING_REQUESTS',
  description: 'Denies travelers who exceed the maximum number of pending requests',
  appliesTo: [
    { actorType: 'USER' },
    { actionType: 'REGISTER' } // Assuming REGISTER covers new requests
  ],
  
  async evaluate(context: RuleContext): Promise<RuleEvaluationResult> {
    const config = getRuleThreshold('TRAVELER_MAX_PENDING_REQUESTS');
    const currentPendingRequests = context.actor.metadata?.['pendingRequests'] ?? 0;
    
    // Check if traveler exceeds maximum pending requests
    if (currentPendingRequests >= config.maxPendingRequests) {
      return {
        ruleId: this.id,
        result: RuleResult.DENY,
        reason: `Traveler has ${currentPendingRequests} pending requests, exceeding the maximum allowed of ${config.maxPendingRequests}`,
        severity: config.severity as RuleSeverity,
        metadata: {
          currentPendingRequests,
          maxPendingRequests: config.maxPendingRequests,
          excessRequests: currentPendingRequests - config.maxPendingRequests,
          userId: context.actor.id
        },
        evaluatedAt: new Date()
      };
    }
    
    // Traveler is within limits
    return {
      ruleId: this.id,
      result: RuleResult.ALLOW,
      reason: `Traveler has ${currentPendingRequests} pending requests, within the maximum allowed of ${config.maxPendingRequests}`,
      metadata: {
        currentPendingRequests,
        maxPendingRequests: config.maxPendingRequests,
        remainingRequests: config.maxPendingRequests - currentPendingRequests,
        userId: context.actor.id
      },
      evaluatedAt: new Date()
    };
  }
};
