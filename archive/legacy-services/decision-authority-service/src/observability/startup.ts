import config, { DecisionAuthorityMode } from '../config/config';
import { logger } from './logger';

export function logStartupConfiguration(): void {
  logger.info('Decision Authority Service Starting', {
    operation: 'startup',
    mode: config.decisionAuthorityMode,
    node_env: config.nodeEnv,
    port: config.port
  });

  logger.info('Feature Flags Configuration', {
    operation: 'startup_config',
    decision_authority_mode: config.decisionAuthorityMode,
    decision_timeout_ms: config.decisionTimeoutMs,
    decision_poll_interval_ms: config.decisionPollIntervalMs
  });

  logger.info('Resilience Configuration', {
    operation: 'startup_config',
    circuit_breaker_failure_threshold: config.circuitBreaker.failureThreshold,
    circuit_breaker_success_threshold: config.circuitBreaker.successThreshold,
    circuit_breaker_timeout_ms: config.circuitBreaker.timeout,
    retry_max_attempts: config.retry.maxRetries,
    retry_initial_delay_ms: config.retry.initialDelayMs,
    sla_max_failure_rate: config.sla.maxFailureRate,
    sla_max_timeout_rate: config.sla.maxTimeoutRate
  });

  validateConfiguration();
}

function validateConfiguration(): void {
  const warnings: string[] = [];

  if (config.decisionAuthorityMode === DecisionAuthorityMode.EXTERNAL) {
    if (!config.custodiiApiUrl) {
      warnings.push('CUSTODII_API_URL not configured for EXTERNAL mode');
    }
    if (!config.custodiiApiKey) {
      warnings.push('CUSTODII_API_KEY not configured for EXTERNAL mode');
    }
    if (!config.custodiiWebhookSecret) {
      warnings.push('CUSTODII_WEBHOOK_SECRET not configured - webhook validation disabled');
    }
  }

  if (config.decisionTimeoutMs < 5000) {
    warnings.push(`Decision timeout (${config.decisionTimeoutMs}ms) is very low - may cause premature timeouts`);
  }

  if (config.decisionTimeoutMs > 60000) {
    warnings.push(`Decision timeout (${config.decisionTimeoutMs}ms) is very high - may impact user experience`);
  }

  if (config.circuitBreaker.failureThreshold < 3) {
    warnings.push(`Circuit breaker failure threshold (${config.circuitBreaker.failureThreshold}) is very low - may trip frequently`);
  }

  if (config.retry.maxRetries > 5) {
    warnings.push(`Retry max attempts (${config.retry.maxRetries}) is very high - may cause long delays`);
  }

  if (config.sla.maxFailureRate > 0.7) {
    warnings.push(`SLA max failure rate (${config.sla.maxFailureRate}) is very high - may not detect issues quickly`);
  }

  if (warnings.length > 0) {
    logger.warn('Configuration Warnings Detected', {
      operation: 'startup_validation',
      warnings: warnings.join('; ')
    });
  } else {
    logger.info('Configuration Validation Passed', {
      operation: 'startup_validation',
      outcome: 'pass'
    });
  }
}
