/**
 * Decision Authority Configuration Loader
 * Loads configuration from environment variables
 */

export interface DecisionAuthorityConfig {
  enabled: boolean;
  url: string;
}

export function getDecisionAuthorityConfig(): DecisionAuthorityConfig {
  return {
    enabled: process.env.DECISION_AUTHORITY_ENABLED === 'true',
    url: process.env.DECISION_AUTHORITY_URL || 'http://localhost:3010',
  };
}
