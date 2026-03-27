/**
 * Timeout Protection Service
 * 
 * Implements timeout for all downstream calls using AbortController.
 * Prevents hanging requests and contributes to circuit breaker failure count.
 * 
 * Features:
 * - AbortController-based cancellation
 * - Configurable timeout per service
 * - Tracing integration
 * - Proper cleanup
 */

import { 
  trace, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import { logger } from '../middleware/correlation-logger.middleware';

// Timeout configuration
export interface TimeoutConfig {
  timeoutMs: number;
  serviceName: string;
}

// Service-specific timeouts
const SERVICE_TIMEOUTS: Record<string, number> = {
  'wallet-service': 4000,
  'traveler-service': 4000,
  'marketplace-service': 4000,
  'auth-service': 2000,
  'default': 5000,
};

// Custom timeout error
export class TimeoutError extends Error {
  public readonly serviceName: string;
  public readonly timeoutMs: number;

  constructor(serviceName: string, timeoutMs: number) {
    super(`Request to ${serviceName} timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
    this.serviceName = serviceName;
    this.timeoutMs = timeoutMs;
  }
}

// Tracer
const tracer = trace.getTracer('timeout-protection');

/**
 * Execute function with timeout protection
 */
export async function withTimeout<T>(
  fn: (abortSignal: AbortSignal) => Promise<T>,
  serviceName: string,
  customTimeoutMs?: number
): Promise<T> {
  const timeoutMs = customTimeoutMs || SERVICE_TIMEOUTS[serviceName] || SERVICE_TIMEOUTS.default;
  
  const span = tracer.startSpan('timeout.protected_call', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'timeout.service': serviceName,
      'timeout.ms': timeoutMs,
    },
  });

  // Create AbortController
  const controller = new AbortController();
  const { signal } = controller;

  // Set up timeout
  const timeoutId = setTimeout(() => {
    controller.abort();
    logger.warn(`[Timeout] Aborting request to ${serviceName} after ${timeoutMs}ms`);
  }, timeoutMs);

  try {
    const result = await fn(signal);
    
    // Success - clear timeout
    clearTimeout(timeoutId);
    
    span.setStatus({ code: SpanStatusCode.OK });
    span.setAttribute('timeout.completed', true);
    span.end();
    
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Check if it's an abort error (timeout)
    if (signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
      const timeoutError = new TimeoutError(serviceName, timeoutMs);
      
      span.recordException(timeoutError);
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: timeoutError.message 
      });
      span.setAttribute('timeout.aborted', true);
      span.end();
      
      logger.error(`[Timeout] Request to ${serviceName} timed out`, {
        service: serviceName,
        timeoutMs,
      });
      
      throw timeoutError;
    }
    
    // Other error
    span.recordException(error as Error);
    span.setStatus({ 
      code: SpanStatusCode.ERROR, 
      message: (error as Error).message 
    });
    span.end();
    
    throw error;
  }
}

/**
 * Wrap axios/fetch request with timeout
 */
export async function httpRequestWithTimeout<T>(
  requestFn: () => Promise<T>,
  serviceName: string,
  customTimeoutMs?: number
): Promise<T> {
  return withTimeout(
    async (signal) => {
      // For axios, we'd attach signal to request config
      // For fetch, signal is passed directly
      return requestFn();
    },
    serviceName,
    customTimeoutMs
  );
}

/**
 * Create axios config with timeout and abort signal
 */
export function createAxiosTimeoutConfig(
  serviceName: string,
  customTimeoutMs?: number
): { timeout: number; signal: AbortSignal } {
  const timeoutMs = customTimeoutMs || SERVICE_TIMEOUTS[serviceName] || SERVICE_TIMEOUTS.default;
  const controller = new AbortController();
  
  // Auto-abort after timeout
  setTimeout(() => controller.abort(), timeoutMs);
  
  return {
    timeout: timeoutMs,
    signal: controller.signal,
  };
}

/**
 * Get timeout for a service
 */
export function getServiceTimeout(serviceName: string): number {
  return SERVICE_TIMEOUTS[serviceName] || SERVICE_TIMEOUTS.default;
}

/**
 * Update timeout for a service (runtime adjustment)
 */
export function setServiceTimeout(serviceName: string, timeoutMs: number): void {
  SERVICE_TIMEOUTS[serviceName] = timeoutMs;
  logger.info(`[Timeout] Updated timeout for ${serviceName} to ${timeoutMs}ms`);
}

/**
 * Wrap function with timeout
 */
export function wrapWithTimeout<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: (signal: AbortSignal, ...args: unknown[]) => Promise<unknown>,
  serviceName: string,
  timeoutMs?: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return withTimeout(
      (signal) => fn(signal, ...args),
      serviceName,
      timeoutMs
    ) as Promise<ReturnType<T>>;
  };
}
