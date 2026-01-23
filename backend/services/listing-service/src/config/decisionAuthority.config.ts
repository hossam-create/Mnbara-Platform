/**
 * Decision Authority Configuration
 * 
 * Feature-flag driven integration with Decision Authority Service
 */

export interface DecisionAuthorityConfig {
  enabled: boolean;
  baseUrl: string;
  timeout: number;
}

export function getDecisionAuthorityConfig(): DecisionAuthorityConfig {
  const enabled = process.env.DECISION_AUTHORITY_ENABLED === 'true';
  const baseUrl = process.env.DECISION_AUTHORITY_URL || 'http://localhost:3010';
  const timeout = parseInt(process.env.DECISION_AUTHORITY_TIMEOUT || '30000', 10);

  return {
    enabled,
    baseUrl,
    timeout
  };
}
