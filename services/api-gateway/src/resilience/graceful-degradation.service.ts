/**
 * Graceful Degradation Service
 * 
 * Handles partial responses when downstream services fail.
 * Returns available data with flags indicating partial results.
 * 
 * Features:
 * - Partial response aggregation
 * - Fallback data for failed domains
 * - Failed domain tracking
 * - Tracing integration
 */

import { 
  trace, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import { logger } from '../middleware/correlation-logger.middleware';
import { isServiceAvailable, getServiceFallback } from './resilient-client.service';

// Domain types
export type ServiceDomain = 'wallet' | 'traveler' | 'marketplace' | 'auth' | 'order';

// Fallback data generators per domain
interface FallbackGenerators {
  wallet: () => WalletFallbackData;
  traveler: () => TravelerFallbackData;
  marketplace: () => MarketplaceFallbackData;
  auth: () => AuthFallbackData;
  order: () => OrderFallbackData;
}

// Fallback data types
type WalletFallbackData = {
  balance: null;
  transactions: [];
  error: 'wallet-service unavailable';
};

type TravelerFallbackData = {
  trips: [];
  bookings: [];
  error: 'traveler-service unavailable';
};

type MarketplaceFallbackData = {
  listings: [];
  orders: [];
  error: 'marketplace-service unavailable';
};

type AuthFallbackData = {
  authenticated: false;
  error: 'auth-service unavailable';
};

type OrderFallbackData = {
  orders: [];
  error: 'order-service unavailable';
};

// Default fallback generators
const DEFAULT_FALLBACKS: FallbackGenerators = {
  wallet: () => ({
    balance: null,
    transactions: [],
    error: 'wallet-service unavailable',
  }),
  
  traveler: () => ({
    trips: [],
    bookings: [],
    error: 'traveler-service unavailable',
  }),
  
  marketplace: () => ({
    listings: [],
    orders: [],
    error: 'marketplace-service unavailable',
  }),
  
  auth: () => ({
    authenticated: false,
    error: 'auth-service unavailable',
  }),
  
  order: () => ({
    orders: [],
    error: 'order-service unavailable',
  }),
};

// Tracer
const tracer = trace.getTracer('graceful-degradation');

/**
 * Result from degraded operation
 */
export interface DegradedResult<T> {
  data: T;
  partial: boolean;
  failedDomains: ServiceDomain[];
  successDomains: ServiceDomain[];
  timestamp: string;
  responseTime: number;
}

/**
 * Execute multiple service calls with graceful degradation
 */
export async function withGracefulDegradation<T extends Record<string, unknown>>(
  operations: {
    [K in keyof T]: {
      domain: ServiceDomain;
      operation: () => Promise<T[K]>;
      fallback?: () => T[K];
    }
  }
): Promise<DegradedResult<T>> {
  const startTime = Date.now();
  
  const span = tracer.startSpan('graceful_degradation.execute', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'degradation.domains_count': Object.keys(operations).length,
    },
  });

  const results = {} as T;
  const failedDomains: ServiceDomain[] = [];
  const successDomains: ServiceDomain[] = [];

  // Execute all operations in parallel
  const entries = Object.entries(operations) as [
    keyof T, 
    { domain: ServiceDomain; operation: () => Promise<T[keyof T]>; fallback?: () => T[keyof T] }
  ][];

  const promises = entries.map(async ([key, config]) => {
    const opSpan = tracer.startSpan(`degradation.call.${config.domain}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'degradation.domain': config.domain,
        'degradation.key': String(key),
      },
    });

    try {
      // Check if service is available (circuit not open)
      const serviceName = `${config.domain}-service`;
      const available = isServiceAvailable(serviceName);
      
      opSpan.setAttribute('degradation.service_available', available);

      if (!available) {
        // Circuit is open, use fallback immediately
        const fallback = config.fallback || DEFAULT_FALLBACKS[config.domain];
        const fallbackData = fallback() as T[keyof T];
        
        opSpan.setAttribute('degradation.used_fallback', true);
        opSpan.setAttribute('degradation.reason', 'circuit_open');
        opSpan.end();

        return { key, success: false, data: fallbackData, domain: config.domain };
      }

      // Try to execute
      const data = await config.operation();
      
      opSpan.setStatus({ code: SpanStatusCode.OK });
      opSpan.setAttribute('degradation.success', true);
      opSpan.end();

      return { key, success: true, data, domain: config.domain };

    } catch (error) {
      // Execution failed, use fallback
      const fallback = config.fallback || DEFAULT_FALLBACKS[config.domain];
      const fallbackData = fallback() as T[keyof T];
      
      opSpan.recordException(error as Error);
      opSpan.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: (error as Error).message 
      });
      opSpan.setAttribute('degradation.used_fallback', true);
      opSpan.setAttribute('degradation.reason', 'execution_error');
      opSpan.setAttribute('degradation.error', (error as Error).message);
      opSpan.end();

      logger.warn(`[GracefulDegradation] Failed to fetch ${config.domain}, using fallback`, {
        domain: config.domain,
        key: String(key),
        error: (error as Error).message,
      });

      return { key, success: false, data: fallbackData, domain: config.domain };
    }
  });

  // Wait for all operations
  const outcomes = await Promise.all(promises);

  // Process outcomes
  for (const outcome of outcomes) {
    results[outcome.key] = outcome.data;
    
    if (outcome.success) {
      successDomains.push(outcome.domain);
    } else {
      failedDomains.push(outcome.domain);
    }
  }

  const responseTime = Date.now() - startTime;
  const isPartial = failedDomains.length > 0;

  // Log degradation
  if (isPartial) {
    logger.info(`[GracefulDegradation] Partial response`, {
      successDomains,
      failedDomains,
      responseTime,
    });
  }

  // Record in span
  span.setAttribute('degradation.partial', isPartial);
  span.setAttribute('degradation.failed_count', failedDomains.length);
  span.setAttribute('degradation.success_count', successDomains.length);
  span.setAttribute('degradation.response_time_ms', responseTime);
  
  if (failedDomains.length > 0) {
    span.setAttribute('degradation.failed_domains', failedDomains.join(','));
  }
  if (successDomains.length > 0) {
    span.setAttribute('degradation.success_domains', successDomains.join(','));
  }

  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  return {
    data: results,
    partial: isPartial,
    failedDomains,
    successDomains,
    timestamp: new Date().toISOString(),
    responseTime,
  };
}

/**
 * Create degraded response wrapper
 */
export function createDegradedResponse<T>(
  data: T,
  failedDomains: ServiceDomain[]
): {
  success: true;
  data: T;
  meta: {
    partial: boolean;
    failedDomains: ServiceDomain[];
    timestamp: string;
  }
} {
  return {
    success: true,
    data,
    meta: {
      partial: failedDomains.length > 0,
      failedDomains,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Check if degraded response should be served
 */
export function shouldDegrade(
  failedDomains: ServiceDomain[],
  criticalDomains: ServiceDomain[]
): boolean {
  // If any critical domain failed, we might want to fail entirely
  const criticalFailed = criticalDomains.some(d => failedDomains.includes(d));
  return !criticalFailed; // Continue if no critical domains failed
}

/**
 * Get fallback for specific domain
 */
export function getDomainFallback<T>(domain: ServiceDomain): T {
  const fallback = DEFAULT_FALLBACKS[domain];
  return fallback() as T;
}

/**
 * Register custom fallback generator
 */
export function registerFallback<D extends ServiceDomain>(
  domain: D,
  generator: () => ReturnType<FallbackGenerators[D]>
): void {
  DEFAULT_FALLBACKS[domain] = generator as FallbackGenerators[D];
}

export { DEFAULT_FALLBACKS };
export type { FallbackGenerators };
