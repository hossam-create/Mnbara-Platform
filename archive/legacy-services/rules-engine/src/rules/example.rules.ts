import { Rule, RuleContext, RuleResult, RuleSeverity, RuleEvaluationResult } from '../types/Rule.types';

/**
 * Example Rule: User Registration Limit
 * Prevents users from registering if they already have an account
 */
export const UserRegistrationLimitRule: Rule = {
  id: 'user-registration-limit',
  description: 'Prevents duplicate user registrations',
  appliesTo: [
    { actionType: 'REGISTER' }
  ],
  severity: RuleSeverity.HIGH,
  async evaluate(context: RuleContext): Promise<RuleEvaluationResult> {
    // In a real implementation, this would check if user already exists
    const hasExistingAccount = context.actor.metadata?.hasExistingAccount ?? false;
    
    if (hasExistingAccount) {
      return {
        ruleId: this.id,
        result: RuleResult.DENY,
        reason: 'User already has an existing account',
        severity: RuleSeverity.HIGH,
        evaluatedAt: new Date()
      };
    }

    return {
      ruleId: this.id,
      result: RuleResult.ALLOW,
      reason: 'New user registration allowed',
      evaluatedAt: new Date()
    };
  }
};

/**
 * Example Rule: Suspicious Bidding Pattern
 * Flags users who place too many bids in a short time period
 */
export const SuspiciousBiddingPatternRule: Rule = {
  id: 'suspicious-bidding-pattern',
  description: 'Flags users with unusual bidding patterns',
  appliesTo: [
    { actorType: 'USER' },
    { actionType: 'BID' }
  ],
  severity: RuleSeverity.MEDIUM,
  async evaluate(context: RuleContext): Promise<RuleEvaluationResult> {
    const bidCount = context.action.metadata?.bidCount ?? 1;
    const timeWindow = context.action.metadata?.timeWindowMinutes ?? 1;
    
    // Flag if more than 10 bids in 5 minutes
    if (bidCount > 10 && timeWindow <= 5) {
      return {
        ruleId: this.id,
        result: RuleResult.FLAG,
        reason: `User placed ${bidCount} bids in ${timeWindow} minutes`,
        severity: RuleSeverity.MEDIUM,
        metadata: {
          bidCount,
          timeWindow,
          threshold: 10
        },
        evaluatedAt: new Date()
      };
    }

    return {
      ruleId: this.id,
      result: RuleResult.ALLOW,
      reason: 'Normal bidding pattern detected',
      evaluatedAt: new Date()
    };
  }
};

/**
 * Example Rule: Minimum Account Age for High Value Transactions
 * Denies high-value transactions from new accounts
 */
export const MinimumAccountAgeRule: Rule = {
  id: 'minimum-account-age',
  description: 'Requires minimum account age for high-value transactions',
  appliesTo: [
    { actorType: 'USER' },
    { actionType: 'PAY' }
  ],
  severity: RuleSeverity.HIGH,
  async evaluate(context: RuleContext): Promise<RuleEvaluationResult> {
    const accountAgeDays = context.actor.metadata?.accountAgeDays ?? 0;
    const transactionAmount = context.action.metadata?.amount ?? 0;
    const highValueThreshold = 1000; // $1000
    
    if (transactionAmount > highValueThreshold && accountAgeDays < 30) {
      return {
        ruleId: this.id,
        result: RuleResult.DENY,
        reason: `Account age ${accountAgeDays} days is insufficient for $${transactionAmount} transaction`,
        severity: RuleSeverity.HIGH,
        metadata: {
          accountAgeDays,
          transactionAmount,
          requiredAgeDays: 30
        },
        evaluatedAt: new Date()
      };
    }

    return {
      ruleId: this.id,
      result: RuleResult.ALLOW,
      reason: 'Account age sufficient for transaction amount',
      evaluatedAt: new Date()
    };
  }
};

/**
 * Example Rule: Daily Withdrawal Limit
 * Flags users approaching daily withdrawal limits
 */
export const DailyWithdrawalLimitRule: Rule = {
  id: 'daily-withdrawal-limit',
  description: 'Flags users approaching daily withdrawal limits',
  appliesTo: [
    { actorType: 'USER' },
    { actionType: 'WITHDRAW' }
  ],
  severity: RuleSeverity.MEDIUM,
  async evaluate(context: RuleContext): Promise<RuleEvaluationResult> {
    const dailyTotal = context.action.metadata?.dailyWithdrawnTotal ?? 0;
    const currentAmount = context.action.metadata?.amount ?? 0;
    const newTotal = dailyTotal + currentAmount;
    const dailyLimit = 5000; // $5000 per day
    
    if (newTotal > dailyLimit) {
      return {
        ruleId: this.id,
        result: RuleResult.DENY,
        reason: `Withdrawal would exceed daily limit of $${dailyLimit}`,
        severity: RuleSeverity.HIGH,
        metadata: {
          dailyTotal,
          currentAmount,
          newTotal,
          dailyLimit
        },
        evaluatedAt: new Date()
      };
    }
    
    if (newTotal > dailyLimit * 0.8) { // Flag at 80% of limit
      return {
        ruleId: this.id,
        result: RuleResult.FLAG,
        reason: `Withdrawal approaching daily limit: $${newTotal} of $${dailyLimit}`,
        severity: RuleSeverity.MEDIUM,
        metadata: {
          dailyTotal,
          currentAmount,
          newTotal,
          dailyLimit,
          percentageUsed: (newTotal / dailyLimit) * 100
        },
        evaluatedAt: new Date()
      };
    }

    return {
      ruleId: this.id,
      result: RuleResult.ALLOW,
      reason: 'Withdrawal within daily limits',
      evaluatedAt: new Date()
    };
  }
};

/**
 * Example Rule: Blacklisted IP Address
 * Denies actions from blacklisted IP addresses
 */
export const BlacklistedIPRule: Rule = {
  id: 'blacklisted-ip',
  description: 'Blocks actions from blacklisted IP addresses',
  appliesTo: [], // Applies to all actions
  severity: RuleSeverity.CRITICAL,
  async evaluate(context: RuleContext): Promise<RuleEvaluationResult> {
    const clientIP = context.environment.ip;
    
    // In a real implementation, this would check against a blacklist
    const blacklistedIPs = ['192.168.1.100', '10.0.0.50']; // Example blacklist
    
    if (clientIP && blacklistedIPs.includes(clientIP)) {
      return {
        ruleId: this.id,
        result: RuleResult.DENY,
        reason: `Action from blacklisted IP address: ${clientIP}`,
        severity: RuleSeverity.CRITICAL,
        metadata: {
          clientIP,
          blacklistedIPs
        },
        evaluatedAt: new Date()
      };
    }

    return {
      ruleId: this.id,
      result: RuleResult.ALLOW,
      reason: 'IP address not blacklisted',
      evaluatedAt: new Date()
    };
  }
};

/**
 * Example Rule: Unusual Login Location
 * Flags logins from unusual geographic locations
 */
export const UnusualLocationRule: Rule = {
  id: 'unusual-location',
  description: 'Flags logins from unusual geographic locations',
  appliesTo: [
    { actionType: 'LOGIN' }
  ],
  severity: RuleSeverity.LOW,
  async evaluate(context: RuleContext): Promise<RuleEvaluationResult> {
    const currentLocation = context.environment.metadata?.location;
    const usualLocations = context.actor.metadata?.usualLocations ?? [];
    
    if (currentLocation && !usualLocations.includes(currentLocation)) {
      return {
        ruleId: this.id,
        result: RuleResult.FLAG,
        reason: `Login from unusual location: ${currentLocation}`,
        severity: RuleSeverity.LOW,
        metadata: {
          currentLocation,
          usualLocations
        },
        evaluatedAt: new Date()
      };
    }

    return {
      ruleId: this.id,
      result: RuleResult.ALLOW,
      reason: 'Login from usual location',
      evaluatedAt: new Date()
    };
  }
};

/**
 * Export all example rules for easy registration
 */
export const exampleRules = [
  UserRegistrationLimitRule,
  SuspiciousBiddingPatternRule,
  MinimumAccountAgeRule,
  DailyWithdrawalLimitRule,
  BlacklistedIPRule,
  UnusualLocationRule
];
