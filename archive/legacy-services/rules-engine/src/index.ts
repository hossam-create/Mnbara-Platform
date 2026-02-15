// Export all types and interfaces
export * from './types/Rule.types';

// Export admin types
export * from './types/Admin.types';

// Export the main RulesEngine service
export { RulesEngine, rulesEngine } from './services/RulesEngine.service';

// Export logging service
export { RuleLogger, ruleLogger } from './services/RuleLogger.service';

// Export integration service
export { RulesIntegration, createRulesIntegration, rulesIntegration } from './services/RulesIntegration.service';

// Export admin statistics service
export { AdminStatistics, adminStatistics } from './services/AdminStatistics.service';

// Export configuration system
export * from './config/rule.config';

// Export example rules for testing and demonstration
export { exampleRules } from './rules/example.rules';

// Export core rules
export * from './rules/core';

// Export individual example rules
export {
  UserRegistrationLimitRule,
  SuspiciousBiddingPatternRule,
  MinimumAccountAgeRule,
  DailyWithdrawalLimitRule,
  BlacklistedIPRule,
  UnusualLocationRule
} from './rules/example.rules';

// Export admin routes
export { default as adminRoutes } from './routes/admin.routes';
