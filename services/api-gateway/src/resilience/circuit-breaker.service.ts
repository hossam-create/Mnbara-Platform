/**
 * Circuit Breaker Service
 * 
 * Implements circuit breaker pattern for downstream HTTP calls using opossum.
 * Automatically tracks failures, opens circuit when threshold exceeded,
 * and provides half-open testing for recovery.
 * 
 * Features:
 * - Per-service circuit breakers
 * - Automatic tracing span creation
 * - Health status reporting
 * - Configurable thresholds
 */

import CircuitBreaker from 'opossum';
import { 
  trace, 
  SpanStatusCode, 
  SpanKind,
  context as otelContext,
} from '@opentelemetry/api';
import { logger } from '../middleware/correlation-logger.middleware';

// Circuit breaker states
export type CircuitState = 'closed' | 'open' | 'half-open';

// Configuration interface
export interface CircuitBreakerConfig {
  name: string;
  timeout: number;           // milliseconds
  errorThresholdPercentage: number;  // percentage (0-100)
  resetTimeout: number;       // milliseconds
  rollingCountTimeout: number; // milliseconds
  rollingCountBuckets: number;
  volumeThreshold: number;    // minimum calls before opening
}

// Default configuration per service
const DEFAULT_CONFIG: CircuitBreakerConfig = {
  name: 'default',
  timeout: 4000,
  errorThresholdPercentage: 50,
  resetTimeout: 15000,
  rollingCountTimeout: 10000,
  rollingCountBuckets: 10,
  volumeThreshold: 5,
};

// Service-specific configurations
const SERVICE_CONFIGS: Record<string, Partial<CircuitBreakerConfig>> = {
  'wallet-service': {
    name: 'wallet-service',
    timeout: 4000,
    errorThresholdPercentage: 50,
    resetTimeout: 15000,
    volumeThreshold: 5,
  },
  'traveler-service': {
    name: 'traveler-service',
    timeout: 4000,
    errorThresholdPercentage: 60,
    resetTimeout: 10000,
    volumeThreshold: 3,
  },
  'marketplace-service': {
    name: 'marketplace-service',
    timeout: 4000,
    errorThresholdPercentage: 60,
    resetTimeout: 10000,
    volumeThreshold: 3,
  },
};

// Circuit breaker registry
const circuitBreakers = new Map<string, CircuitBreaker>();

// Tracer for resilience spans
const tracer = trace.getTracer('circuit-breaker');

/**
 * Create or get existing circuit breaker for a service
 */
export function getCircuitBreaker(
  serviceName: string,
  asyncFunction: (...args: unknown[]) => Promise<unknown>,
  customConfig?: Partial<CircuitBreakerConfig>
): CircuitBreaker {
  if (circuitBreakers.has(serviceName)) {
    return circuitBreakers.get(serviceName)!;
  }

  const config = {
    ...DEFAULT_CONFIG,
    ...SERVICE_CONFIGS[serviceName],
    ...customConfig,
    name: serviceName,
  };

  const breaker = new CircuitBreaker(asyncFunction, {
    timeout: config.timeout,
    errorThresholdPercentage: config.errorThresholdPercentage,
    resetTimeout: config.resetTimeout,
    rollingCountTimeout: config.rollingCountTimeout,
    rollingCountBuckets: config.rollingCountBuckets,
    volumeThreshold: config.volumeThreshold,
    name: config.name,
    // Custom error filter - don't count 4xx errors as failures
    errorFilter: (error: Error) => {
      const statusCode = (error as Error & { statusCode?: number }).statusCode;
      // Don't open circuit for client errors (4xx)
      if (statusCode && statusCode >= 400 && statusCode < 500) {
        return true; // Filter out (don't count as failure)
      }
      return false; // Count as failure
    },
  });

  // Setup event handlers with tracing
  setupEventHandlers(breaker, serviceName);

  circuitBreakers.set(serviceName, breaker);
  
  logger.info(`[CircuitBreaker] Initialized for ${serviceName}`, {
    service: serviceName,
    state: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
    config,
  });

  return breaker;
}

/**
 * Setup event handlers for circuit breaker with tracing
 */
function setupEventHandlers(breaker: CircuitBreaker, serviceName: string): void {
  // Circuit opened
  breaker.on('open', () => {
    const span = tracer.startSpan('circuit.open', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'circuit_breaker.service': serviceName,
        'circuit_breaker.state': 'open',
        'circuit_breaker.failures': breaker.stats.failures,
        'circuit_breaker.successes': breaker.stats.successes,
      },
    });
    span.end();

    logger.warn(`[CircuitBreaker] OPENED for ${serviceName}`, {
      service: serviceName,
      failures: breaker.stats.failures,
      successes: breaker.stats.successes,
      errorRate: calculateErrorRate(breaker.stats),
    });
  });

  // Circuit half-open (testing)
  breaker.on('halfOpen', () => {
    const span = tracer.startSpan('circuit.half_open', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'circuit_breaker.service': serviceName,
        'circuit_breaker.state': 'half-open',
      },
    });
    span.end();

    logger.info(`[CircuitBreaker] HALF-OPEN for ${serviceName} (testing recovery)`, {
      service: serviceName,
    });
  });

  // Circuit closed
  breaker.on('close', () => {
    const span = tracer.startSpan('circuit.close', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'circuit_breaker.service': serviceName,
        'circuit_breaker.state': 'closed',
      },
    });
    span.end();

    logger.info(`[CircuitBreaker] CLOSED for ${serviceName} (recovered)`, {
      service: serviceName,
    });
  });

  // Fallback executed
  breaker.on('fallback', (result) => {
    const span = tracer.startSpan('circuit.fallback', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'circuit_breaker.service': serviceName,
        'circuit_breaker.fallback_executed': true,
      },
    });
    span.end();

    logger.info(`[CircuitBreaker] Fallback executed for ${serviceName}`, {
      service: serviceName,
      result: result ? 'custom' : 'default',
    });
  });

  // Success after failure (recovery indicator)
  breaker.on('success', () => {
    if (breaker.halfOpen) {
      logger.info(`[CircuitBreaker] Success in half-open state for ${serviceName}`, {
        service: serviceName,
      });
    }
  });

  // Failure (but not counting toward threshold due to filter)
  breaker.on('reject', (error) => {
    logger.debug(`[CircuitBreaker] Request rejected for ${serviceName}`, {
      service: serviceName,
      reason: 'filtered_error',
      error: (error as Error).message,
    });
  });
}

/**
 * Calculate error rate from stats
 */
function calculateErrorRate(stats: CircuitBreaker['stats']): number {
  const total = stats.failures + stats.successes;
  if (total === 0) return 0;
  return (stats.failures / total) * 100;
}

/**
 * Execute function with circuit breaker protection
 */
export async function executeWithCircuitBreaker<T>(
  serviceName: string,
  fn: () => Promise<T>,
  fallbackFn?: () => T | Promise<T>,
  customConfig?: Partial<CircuitBreakerConfig>
): Promise<T> {
  const breaker = getCircuitBreaker(serviceName, fn, customConfig);

  // Create execution span
  const span = tracer.startSpan('circuit.execute', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'circuit_breaker.service': serviceName,
      'circuit_breaker.state': getCircuitState(breaker),
    },
  });

  try {
    let result: T;

    if (fallbackFn) {
      result = await breaker.fire(fallbackFn);
    } else {
      result = await breaker.fire();
    }

    span.setStatus({ code: SpanStatusCode.OK });
    span.setAttribute('circuit_breaker.result', 'success');
    
    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ 
      code: SpanStatusCode.ERROR, 
      message: (error as Error).message 
    });
    span.setAttribute('circuit_breaker.result', 'failure');
    span.setAttribute('circuit_breaker.opened', breaker.opened);
    
    throw error;
  } finally {
    span.end();
  }
}

/**
 * Get circuit breaker state as string
 */
export function getCircuitState(breaker: CircuitBreaker): CircuitState {
  if (breaker.opened) return 'open';
  if (breaker.halfOpen) return 'half-open';
  return 'closed';
}

/**
 * Get health status for all circuit breakers
 */
export function getCircuitBreakerHealth(): Record<string, {
  state: CircuitState;
  failures: number;
  successes: number;
  rejects: number;
  errorRate: number;
  openTime?: string;
}> {
  const health: Record<string, {
    state: CircuitState;
    failures: number;
    successes: number;
    rejects: number;
    errorRate: number;
    openTime?: string;
  }> = {};

  for (const [serviceName, breaker] of circuitBreakers) {
    health[serviceName] = {
      state: getCircuitState(breaker),
      failures: breaker.stats.failures,
      successes: breaker.stats.successes,
      rejects: breaker.stats.rejects,
      errorRate: calculateErrorRate(breaker.stats),
    };
  }

  return health;
}

/**
 * Manually force open a circuit (for testing or emergency)
 */
export function forceOpen(serviceName: string): void {
  const breaker = circuitBreakers.get(serviceName);
  if (breaker) {
    (breaker as CircuitBreaker & { open(): void }).open();
    logger.warn(`[CircuitBreaker] Manually forced OPEN for ${serviceName}`);
  }
}

/**
 * Manually force close a circuit
 */
export function forceClose(serviceName: string): void {
  const breaker = circuitBreakers.get(serviceName);
  if (breaker) {
    (breaker as CircuitBreaker & { close(): void }).close();
    logger.info(`[CircuitBreaker] Manually forced CLOSE for ${serviceName}`);
  }
}

/**
 * Get all registered circuit breakers
 */
export function getAllCircuitBreakers(): Map<string, CircuitBreaker> {
  return new Map(circuitBreakers);
}

/**
 * Shutdown all circuit breakers (cleanup)
 */
export function shutdownAllCircuitBreakers(): void {
  for (const [serviceName, breaker] of circuitBreakers) {
    breaker.shutdown();
    logger.info(`[CircuitBreaker] Shutdown ${serviceName}`);
  }
  circuitBreakers.clear();
}
