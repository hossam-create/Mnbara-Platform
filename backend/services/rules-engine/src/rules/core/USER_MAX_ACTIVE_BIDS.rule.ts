import { Rule, RuleContext, RuleResult, RuleSeverity, RuleEvaluationResult } from '../../types/Rule.types';
import { getRuleThreshold } from '../../config/rule.config';

/**
 * USER_MAX_ACTIVE_BIDS Rule
 * 
 * Flags users who have more than the configured maximum number of active bids
 * 
 * Configuration:
 * - maxActiveBids: Maximum allowed active bids (default: 10)
 * - severity: Severity level for flags (default: MEDIUM)
 * 
 * Environment Variables:
 * - RULE_USER_MAX_ACTIVE_BIDS: Override max active bids
 * - RULE_USER_MAX_ACTIVE_BIDS_SEVERITY: Override severity level
 */
export const USER_MAX_ACTIVE_BIDS_Rule: Rule = {
  id: 'USER_MAX_ACTIVE_BIDS',
  description: 'Flags users who exceed the maximum number of active bids',
  appliesTo: [
    { actorType: 'USER' },
    { actionType: 'BID' }
  ],
  
  async evaluate(context: RuleContext): Promise<RuleEvaluationResult> {
    const config = getRuleThreshold('USER_MAX_ACTIVE_BIDS');
    const currentActiveBids = context.actor.metadata?.['activeBids'] ?? 0;
    
    // Check if user exceeds maximum active bids
    if (currentActiveBids > config.maxActiveBids) {
      return {
        ruleId: this.id,
        result: RuleResult.FLAG,
        reason: `User has ${currentActiveBids} active bids, exceeding the maximum allowed of ${config.maxActiveBids}`,
        severity: config.severity as RuleSeverity,
        metadata: {
          currentActiveBids,
          maxActiveBids: config.maxActiveBids,
          excessBids: currentActiveBids - config.maxActiveBids,
          userId: context.actor.id
        },
        evaluatedAt: new Date()
      };
    }
    
    // User is within limits
    return {
      ruleId: this.id,
      result: RuleResult.ALLOW,
      reason: `User has ${currentActiveBids} active bids, within the maximum allowed of ${config.maxActiveBids}`,
      metadata: {
        currentActiveBids,
        maxActiveBids: config.maxActiveBids,
        remainingBids: config.maxActiveBids - currentActiveBids,
        userId: context.actor.id
      },
      evaluatedAt: new Date()
    };
  }
};
