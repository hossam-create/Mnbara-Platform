import { Rule, RuleContext, RuleResult, RuleSeverity, RuleEvaluationResult } from '../../types/Rule.types';
import { getRuleThreshold } from '../../config/rule.config';

/**
 * SELLER_LISTING_RATE_LIMIT Rule
 * 
 * Flags sellers who create listings too frequently
 * Checks both hourly and daily limits
 * 
 * Configuration:
 * - maxListingsPerHour: Maximum allowed listings per hour (default: 5)
 * - maxListingsPerDay: Maximum allowed listings per day (default: 50)
 * - severity: Severity level for flags (default: MEDIUM)
 * 
 * Environment Variables:
 * - RULE_SELLER_MAX_LISTINGS_PER_HOUR: Override hourly limit
 * - RULE_SELLER_MAX_LISTINGS_PER_DAY: Override daily limit
 * - RULE_SELLER_LISTING_RATE_LIMIT_SEVERITY: Override severity level
 */
export const SELLER_LISTING_RATE_LIMIT_Rule: Rule = {
  id: 'SELLER_LISTING_RATE_LIMIT',
  description: 'Flags sellers who create listings too frequently',
  appliesTo: [
    { actorType: 'USER' },
    { actionType: 'LIST' }
  ],
  
  async evaluate(context: RuleContext): Promise<RuleEvaluationResult> {
    const config = getRuleThreshold('SELLER_LISTING_RATE_LIMIT');
    
    // Get current listing counts from metadata
    const listingsLastHour = context.actor.metadata?.['listingsLastHour'] ?? 0;
    const listingsLastDay = context.actor.metadata?.['listingsLastDay'] ?? 0;
    
    // Check hourly limit
    if (listingsLastHour > config.maxListingsPerHour) {
      return {
        ruleId: this.id,
        result: RuleResult.FLAG,
        reason: `Seller has created ${listingsLastHour} listings in the last hour, exceeding the maximum allowed of ${config.maxListingsPerHour}`,
        severity: config.severity as RuleSeverity,
        metadata: {
          listingsLastHour,
          listingsLastDay,
          maxListingsPerHour: config.maxListingsPerHour,
          maxListingsPerDay: config.maxListingsPerDay,
          excessHourly: listingsLastHour - config.maxListingsPerHour,
          violationType: 'HOURLY',
          userId: context.actor.id
        },
        evaluatedAt: new Date()
      };
    }
    
    // Check daily limit
    if (listingsLastDay > config.maxListingsPerDay) {
      return {
        ruleId: this.id,
        result: RuleResult.FLAG,
        reason: `Seller has created ${listingsLastDay} listings in the last day, exceeding the maximum allowed of ${config.maxListingsPerDay}`,
        severity: config.severity as RuleSeverity,
        metadata: {
          listingsLastHour,
          listingsLastDay,
          maxListingsPerHour: config.maxListingsPerHour,
          maxListingsPerDay: config.maxListingsPerDay,
          excessDaily: listingsLastDay - config.maxListingsPerDay,
          violationType: 'DAILY',
          userId: context.actor.id
        },
        evaluatedAt: new Date()
      };
    }
    
    // Seller is within limits
    return {
      ruleId: this.id,
      result: RuleResult.ALLOW,
      reason: `Seller has created ${listingsLastHour} listings in the last hour and ${listingsLastDay} in the last day, within limits`,
      metadata: {
        listingsLastHour,
        listingsLastDay,
        maxListingsPerHour: config.maxListingsPerHour,
        maxListingsPerDay: config.maxListingsPerDay,
        remainingHourly: config.maxListingsPerHour - listingsLastHour,
        remainingDaily: config.maxListingsPerDay - listingsLastDay,
        userId: context.actor.id
      },
      evaluatedAt: new Date()
    };
  }
};
