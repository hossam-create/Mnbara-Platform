/**
 * Resilient Downstream Service Client
 * 
 * Combines all resilience patterns into a single wrapper:
 * - Circuit Breaker
 * - Retry with Exponential Backoff
 * - Timeout Protection
 * - Bulkhead Isolation
 * - Tracing integration
 * 
 * This is the main interface for making resilient HTTP calls to downstream services.
 */

import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { trace, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import { injectContextIntoHeaders } from '../tracing';
import { logger } from '../middleware/correlation-logger.middleware';
import { 
  executeWithCircuitBreaker, 
  getCircuitBreakerHealth,
  CircuitBreakerConfig 
} from './circuit-breaker.service';
import { withRetry, RetryConfig } from './retry.service';
import { withBulkhead, BulkheadConfig } from './bulkhead.service';
import { withTimeout, TimeoutError, getServiceTimeout } from './timeout.service';

// Service configuration
interface ServiceConfig {
  baseURL: string;
  timeout?: number;
  circuitBreaker?: Partial<CircuitBreakerConfig>;
  retry?: Partial<RetryConfig>;
  bulkhead?: Partial<BulkheadConfig>;
}

// Service registry
const serviceConfigs: Record<string, ServiceConfig> = {
  'wallet-service': {
    baseURL: process.env.WALLET_SERVICE_URL || 'http://localhost:3006',
    timeout: 4000,
  },
  'traveler-service': {
    baseURL: process.env.TRAVELER_SERVICE_URL || 'http://localhost:3007',
    timeout: 4000,
  },
  'marketplace-service': {
    baseURL: process.env.MARKETPLACE_SERVICE_URL || 'http://localhost:3008',
    timeout: 4000,
  },
};

// Tracer
const tracer = trace.getTracer('resilient-service-client');

/**
 * HTTP request options
 */
interface ResilientRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  data?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  skipRetry?: boolean;
  skipCircuitBreaker?: boolean;
  skipBulkhead?: boolean;
}

/**
 * Execute resilient HTTP request to downstream service
 */
export async function resilientRequest<T = unknown>(
  serviceName: string,
  options: ResilientRequestOptions
): Promise<AxiosResponse<T>> {
  const config = serviceConfigs[serviceName];
  if (!config) {
    throw new Error(`Unknown service: ${serviceName}`);
  }

  const span = tracer.startSpan(`http.${options.method.toLowerCase()}`, {
    kind: SpanKind.CLIENT,
    attributes: {
      'http.method': options.method,
      'http.url': `${config.baseURL}${options.path}`,
      'peer.service': serviceName,
      'resilience.enabled': true,
    },
  });

  // Build request config
  const url = `${config.baseURL}${options.path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Inject tracing context
  injectContextIntoHeaders(headers);

  const axiosConfig: AxiosRequestConfig = {
    method: options.method,
    url,
    data: options.data,
    headers,
    timeout: options.timeout || config.timeout || getServiceTimeout(serviceName),
  };

  try {
    // Execute with all resilience patterns
    const result = await executeResiliently(
      serviceName,
      async () => axios(axiosConfig),
      {
        retry: !options.skipRetry,
        circuitBreaker: !options.skipCircuitBreaker,
        bulkhead: !options.skipBulkhead,
        timeout: true,
      },
      config
    );

    span.setStatus({ code: SpanStatusCode.OK });
    span.setAttribute('http.status_code', result.status);
    span.end();

    logger.debug(`[ResilientClient] Success ${options.method} ${options.path} from ${serviceName}`, {
      service: serviceName,
      method: options.method,
      path: options.path,
      status: result.status,
    });

    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ 
      code: SpanStatusCode.ERROR, 
      message: (error as Error).message 
    });
    
    const axiosError = error as AxiosError;
    if (axiosError.response?.status) {
      span.setAttribute('http.status_code', axiosError.response.status);
    }
    
    span.end();

    logger.error(`[ResilientClient] Failed ${options.method} ${options.path} from ${serviceName}`, {
      service: serviceName,
      method: options.method,
      path: options.path,
      error: (error as Error).message,
    });

    throw error;
  }
}

/**
 * Execute function with all resilience patterns
 */
async function executeResiliently<T>(
  serviceName: string,
  fn: () => Promise<T>,
  options: {
    retry: boolean;
    circuitBreaker: boolean;
    bulkhead: boolean;
    timeout: boolean;
  },
  config: ServiceConfig
): Promise<T> {
  let wrappedFn = fn;

  // Apply timeout (innermost)
  if (options.timeout) {
    const originalFn = wrappedFn;
    wrappedFn = async () => {
      return withTimeout(
        async () => originalFn(),
        serviceName,
        config.timeout
      );
    };
  }

  // Apply retry
  if (options.retry) {
    const originalFn = wrappedFn;
    wrappedFn = async () => {
      return withRetry(
        'http-request',
        originalFn,
        serviceName,
        config.retry
      );
    };
  }

  // Apply circuit breaker
  if (options.circuitBreaker) {
    const originalFn = wrappedFn;
    wrappedFn = async () => {
      return executeWithCircuitBreaker(
        serviceName,
        originalFn,
        undefined,
        config.circuitBreaker
      );
    };
  }

  // Apply bulkhead (outermost - first to reject if overloaded)
  if (options.bulkhead) {
    const originalFn = wrappedFn;
    wrappedFn = async () => {
      return withBulkhead(
        serviceName,
        originalFn,
        config.bulkhead
      );
    };
  }

  return wrappedFn();
}

/**
 * Convenience methods for HTTP verbs
 */
export const resilientClient = {
  get<T>(serviceName: string, path: string, headers?: Record<string, string>) {
    return resilientRequest<T>(serviceName, { method: 'GET', path, headers });
  },

  post<T>(serviceName: string, path: string, data: unknown, headers?: Record<string, string>) {
    return resilientRequest<T>(serviceName, { method: 'POST', path, data, headers });
  },

  put<T>(serviceName: string, path: string, data: unknown, headers?: Record<string, string>) {
    return resilientRequest<T>(serviceName, { method: 'PUT', path, data, headers });
  },

  delete<T>(serviceName: string, path: string, headers?: Record<string, string>) {
    return resilientRequest<T>(serviceName, { method: 'DELETE', path, headers });
  },

  patch<T>(serviceName: string, path: string, data: unknown, headers?: Record<string, string>) {
    return resilientRequest<T>(serviceName, { method: 'PATCH', path, data, headers });
  },
};

/**
 * Register/update service configuration
 */
export function registerService(
  serviceName: string,
  config: ServiceConfig
): void {
  serviceConfigs[serviceName] = config;
  logger.info(`[ResilientClient] Registered service ${serviceName}`, config);
}

/**
 * Get service configuration
 */
export function getServiceConfig(serviceName: string): ServiceConfig | undefined {
  return serviceConfigs[serviceName];
}

/**
 * Get resilience health for all services
 */
export function getResilienceHealth(): {
  circuitBreakers: ReturnType<typeof getCircuitBreakerHealth>;
  services: Record<string, ServiceConfig>;
} {
  return {
    circuitBreakers: getCircuitBreakerHealth(),
    services: { ...serviceConfigs },
  };
}

/**
 * Check if service is available (circuit closed and not overloaded)
 */
export function isServiceAvailable(serviceName: string): boolean {
  const circuitHealth = getCircuitBreakerHealth()[serviceName];
  if (circuitHealth && circuitHealth.state === 'open') {
    return false;
  }
  return true;
}

/**
 * Get fallback response for a service
 */
export function getServiceFallback<T>(
  serviceName: string,
  defaultValue: T
): { data: T; partial: true; failedDomain: string } {
  return {
    data: defaultValue,
    partial: true,
    failedDomain: serviceName.replace('-service', ''),
  };
}

export { TimeoutError };
export { getCircuitBreakerHealth };
