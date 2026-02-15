import { Rule, RuleContext, RuleResult, RuleSeverity, RuleEvaluationResult } from '../../types/Rule.types';
import { getRuleThreshold } from '../../config/rule.config';

/**
 * PAYMENT_RETRY_LIMIT Rule
 * 
 * Denies payments that have exceeded the maximum number of retry attempts
 * within the configured time window
 * 
 * Configuration:
 * - maxRetries: Maximum allowed retry attempts (default: 3)
 * - retryWindowMinutes: Time window to consider retries (default: 60 minutes)
 * - severity: Severity level for denies (default: HIGH)
 * 
 * Environment Variables:
 * - RULE_PAYMENT_MAX_RETRIES: Override max retries
 * - RULE_PAYMENT_RETRY_WINDOW_MINUTES: Override retry window
 * - RULE_PAYMENT_RETRY_LIMIT_SEVERITY: Override severity level
 */
export const PAYMENT_RETRY_LIMIT_Rule: Rule = {
  id: 'PAYMENT_RETRY_LIMIT',
  description: 'Denies payments that exceed the maximum number of retry attempts',
  appliesTo: [
    { actionType: 'PAY' }
  ],
  
  async evaluate(context: RuleContext): Promise<RuleEvaluationResult> {
    const config = getRuleThreshold('PAYMENT_RETRY_LIMIT');
    
    // Get retry information from action metadata
    const currentRetries = context.action.metadata?.['retryCount'] ?? 0;
    const firstAttemptTime = context.action.metadata?.['firstAttemptTime'];
    const currentTime = context.environment.timestamp;
    
    // Calculate time window if first attempt time is provided
    let retriesWithinWindow = currentRetries;
    if (firstAttemptTime) {
      const firstAttempt = new Date(firstAttemptTime);
      const timeDiffMinutes = (currentTime.getTime() - firstAttempt.getTime()) / (1000 * 60);
      
      // If outside the retry window, reset count
      if (timeDiffMinutes > config.retryWindowMinutes) {
        retriesWithinWindow = 0;
      }
    }
    
    // Check if retries exceed limit within window
    if (retriesWithinWindow >= config.maxRetries) {
      return {
        ruleId: this.id,
        result: RuleResult.DENY,
        reason: `Payment has been retried ${retriesWithinWindow} times, exceeding the maximum allowed of ${config.maxRetries} within ${config.retryWindowMinutes} minutes`,
        severity: config.severity as RuleSeverity,
        metadata: {
          currentRetries,
          retriesWithinWindow,
          maxRetries: config.maxRetries,
          retryWindowMinutes: config.retryWindowMinutes,
          firstAttemptTime,
          currentTime: currentTime.toISOString(),
          excessRetries: retriesWithinWindow - config.maxRetries,
          paymentId: context.target.id
        },
        evaluatedAt: new Date()
      };
    }
    
    // Payment is within retry limits
    return {
      ruleId: this.id,
      result: RuleResult.ALLOW,
      reason: `Payment has been retried ${retriesWithinWindow} times, within the maximum allowed of ${config.maxRetries} within ${config.retryWindowMinutes} minutes`,
      metadata: {
        currentRetries,
        retriesWithinWindow,
        maxRetries: config.maxRetries,
        retryWindowMinutes: config.retryWindowMinutes,
        remainingRetries: config.maxRetries - retriesWithinWindow,
        paymentId: context.target.id
      },
      evaluatedAt: new Date()
    };
  }
};
