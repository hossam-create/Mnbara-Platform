export enum DecisionAuthorityMode {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL'
}

interface Config {
  decisionAuthorityMode: DecisionAuthorityMode;
  custodiiApiUrl: string;
  custodiiApiKey: string;
  custodiiWebhookSecret: string;
  decisionTimeoutMs: number;
  decisionPollIntervalMs: number;
  jwtSecret: string;
  databaseUrl: string;
  port: number;
  nodeEnv: string;
  circuitBreaker: {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
    rollingWindowMs: number;
  };
  retry: {
    maxRetries: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
  };
  sla: {
    maxFailureRate: number;
    maxTimeoutRate: number;
    windowMs: number;
  };
}

const config: Config = {
  decisionAuthorityMode: (process.env.DECISION_AUTHORITY_MODE as DecisionAuthorityMode) || DecisionAuthorityMode.INTERNAL,
  custodiiApiUrl: process.env.CUSTODII_API_URL || '',
  custodiiApiKey: process.env.CUSTODII_API_KEY || '',
  custodiiWebhookSecret: process.env.CUSTODII_WEBHOOK_SECRET || '',
  decisionTimeoutMs: parseInt(process.env.DECISION_TIMEOUT_MS || '30000'),
  decisionPollIntervalMs: parseInt(process.env.DECISION_POLL_INTERVAL_MS || '5000'),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  databaseUrl: process.env.DATABASE_URL || '',
  port: parseInt(process.env.PORT || '3010'),
  nodeEnv: process.env.NODE_ENV || 'development',
  circuitBreaker: {
    failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD || '5'),
    successThreshold: parseInt(process.env.CIRCUIT_BREAKER_SUCCESS_THRESHOLD || '2'),
    timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT_MS || '60000'),
    rollingWindowMs: parseInt(process.env.CIRCUIT_BREAKER_WINDOW_MS || '60000')
  },
  retry: {
    maxRetries: parseInt(process.env.RETRY_MAX_ATTEMPTS || '3'),
    initialDelayMs: parseInt(process.env.RETRY_INITIAL_DELAY_MS || '1000'),
    maxDelayMs: parseInt(process.env.RETRY_MAX_DELAY_MS || '10000'),
    backoffMultiplier: parseFloat(process.env.RETRY_BACKOFF_MULTIPLIER || '2')
  },
  sla: {
    maxFailureRate: parseFloat(process.env.SLA_MAX_FAILURE_RATE || '0.5'),
    maxTimeoutRate: parseFloat(process.env.SLA_MAX_TIMEOUT_RATE || '0.3'),
    windowMs: parseInt(process.env.SLA_WINDOW_MS || '300000')
  }
};

// Validation
if (config.decisionAuthorityMode === DecisionAuthorityMode.EXTERNAL) {
  if (!config.custodiiApiUrl) {
    throw new Error('CUSTODII_API_URL is required when DECISION_AUTHORITY_MODE=EXTERNAL');
  }
  if (!config.custodiiApiKey) {
    throw new Error('CUSTODII_API_KEY is required when DECISION_AUTHORITY_MODE=EXTERNAL');
  }
}

export default config;
