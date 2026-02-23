/**
 * Resilience Layer - Barrel Export
 * 
 * Central export point for all resilience services.
 */

// Circuit Breaker
export {
  getCircuitBreaker,
  executeWithCircuitBreaker,
  getCircuitBreakerHealth,
  getCircuitState,
  forceOpen,
  forceClose,
  shutdownAllCircuitBreakers,
  type CircuitBreakerConfig,
  type CircuitState,
} from './circuit-breaker.service';

// Retry
export {
  withRetry,
  wrapWithRetry,
  getRetryStats,
  clearRetryStats,
  type RetryConfig,
  type RetryStats,
} from './retry.service';

// Bulkhead
export {
  withBulkhead,
  wrapWithBulkhead,
  getBulkheadHealth,
  BulkheadError,
  type BulkheadConfig,
} from './bulkhead.service';

// Timeout
export {
  withTimeout,
  httpRequestWithTimeout,
  createAxiosTimeoutConfig,
  getServiceTimeout,
  setServiceTimeout,
  wrapWithTimeout,
  TimeoutError,
  type TimeoutConfig,
} from './timeout.service';

// Resilient Client
export {
  resilientRequest,
  resilientClient,
  registerService,
  getServiceConfig,
  getResilienceHealth,
  isServiceAvailable,
  getServiceFallback,
  type TimeoutError as ClientTimeoutError,
} from './resilient-client.service';

// Kafka Backpressure
export {
  initializeBackpressure,
  updateWebSocketQueueSize,
  getBackpressureHealth,
  isPaused,
  manualPause,
  manualResume,
  shutdownBackpressure,
  shutdownAllBackpressure,
} from './kafka-backpressure.service';

// Graceful Degradation
export {
  withGracefulDegradation,
  createDegradedResponse,
  shouldDegrade,
  getDomainFallback,
  registerFallback,
  DEFAULT_FALLBACKS,
  type DegradedResult,
  type ServiceDomain,
  type FallbackGenerators,
} from './graceful-degradation.service';
