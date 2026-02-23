/**
 * Retry Utility with Exponential Backoff
 * 
 * Implements retry pattern with:
 * - Exponential backoff
 * - Jitter to prevent thundering herd
 * - Configurable max retries
 * - Selective retry based on error type
 * - Tracing integration
 */

import { 
  trace, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import { logger } from '../middleware/correlation-logger.middleware';

// Retry configuration
export interface RetryConfig {
  maxRetries: number;        // Maximum number of retry attempts
  baseDelay: number;         // Base delay in milliseconds
  maxDelay: number;          // Maximum delay cap
  jitter: boolean;           // Add random jitter
  backoffMultiplier: number; // Exponential multiplier
  // Retryable status codes (5xx server errors, network errors)
  retryableStatusCodes: number[];
  // Non-retryable status codes (4xx client errors)
  nonRetryableStatusCodes: number[];
}

// Default configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 100,
  maxDelay: 5000,
  jitter: true,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  nonRetryableStatusCodes: [400, 401, 403, 404, 405, 422],
};

// Service-specific retry configs
const SERVICE_RETRY_CONFIGS: Record<string, Partial<RetryConfig>> = {
  'wallet-service': {
    maxRetries: 3,
    baseDelay: 100,
  },
  'traveler-service': {
    maxRetries: 2,
    baseDelay: 100,
  },
  'marketplace-service': {
    maxRetries: 2,
    baseDelay: 100,
  },
};

// Tracer for retry spans
const tracer = trace.getTracer('retry-utility');

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffMultiplier: number,
  jitter: boolean
): number {
  // Exponential backoff: baseDelay * (multiplier ^ attempt)
  let delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
  
  // Cap at max delay
  delay = Math.min(delay, maxDelay);
  
  // Add jitter (±25% random variation)
  if (jitter) {
    const jitterFactor = 0.75 + Math.random() * 0.5; // 0.75 to 1.25
    delay = delay * jitterFactor;
  }
  
  return Math.floor(delay);
}

/**
 * Check if error is retryable based on status code or error type
 */
function isRetryableError(error: Error, config: RetryConfig): boolean {
  // Check for status code in error
  const statusCode = (error as Error & { statusCode?: number; response?: { status?: number } }).statusCode ||
                     (error as Error & { response?: { status?: number } }).response?.status;
  
  // Explicitly non-retryable (4xx client errors)
  if (statusCode && config.nonRetryableStatusCodes.includes(statusCode)) {
    return false;
  }
  
  // Explicitly retryable (5xx server errors, 408 timeout, 429 rate limit)
  if (statusCode && config.retryableStatusCodes.includes(statusCode)) {
    return true;
  }
  
  // Network errors (no status code) are retryable
  if (!statusCode) {
    const errorMessage = error.message.toLowerCase();
    const networkErrors = [
      'timeout',
      'network error',
      'connection refused',
      'econnrefused',
      'enetunreach',
      'etimedout',
      'socket hang up',
      'dns lookup failed',
    ];
    return networkErrors.some(e => errorMessage.includes(e));
  }
  
  // Default: don't retry unknown errors
  return false;
}

/**
 * Execute function with retry logic
 */
export async function withRetry<T>(
  operationName: string,
  fn: () => Promise<T>,
  serviceName: string,
  customConfig?: Partial<RetryConfig>
): Promise<T> {
  const config: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...SERVICE_RETRY_CONFIGS[serviceName],
    ...customConfig,
  };

  // Create parent span for retry operation
  const parentSpan = tracer.startSpan(`retry.${operationName}`, {
    kind: SpanKind.INTERNAL,
    attributes: {
      'retry.service': serviceName,
      'retry.max_retries': config.maxRetries,
      'retry.base_delay_ms': config.baseDelay,
    },
  });

  let lastError: Error | undefined;

  try {
    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      // Create span for each attempt
      const attemptSpan = tracer.startSpan(
        `retry.attempt.${attempt}`,
        {
          kind: SpanKind.INTERNAL,
          attributes: {
            'retry.attempt_number': attempt,
            'retry.max_attempts': config.maxRetries + 1,
          },
        }
        // parentSpan is implicitly parent through context
      );

      try {
        logger.debug(`[Retry] Attempt ${attempt}/${config.maxRetries + 1} for ${operationName}`, {
          service: serviceName,
          operation: operationName,
          attempt,
        });

        const result = await fn();

        // Success on this attempt
        attemptSpan.setStatus({ code: SpanStatusCode.OK });
        attemptSpan.setAttribute('retry.success', true);
        attemptSpan.end();

        // Record final success in parent span
        if (attempt > 1) {
          parentSpan.setAttribute('retry.succeeded_on_attempt', attempt);
          parentSpan.setAttribute('retry.total_attempts', attempt);
          logger.info(`[Retry] Succeeded on attempt ${attempt} for ${operationName}`, {
            service: serviceName,
            operation: operationName,
            attempts: attempt,
          });
        }

        parentSpan.setStatus({ code: SpanStatusCode.OK });
        parentSpan.end();

        return result;

      } catch (error) {
        lastError = error as Error;
        
        const isRetryable = isRetryableError(lastError, config);
        const statusCode = (lastError as Error & { statusCode?: number }).statusCode;

        // Record attempt failure
        attemptSpan.recordException(lastError);
        attemptSpan.setStatus({ 
          code: SpanStatusCode.ERROR, 
          message: lastError.message 
        });
        attemptSpan.setAttribute('retry.error_retryable', isRetryable);
        attemptSpan.setAttribute('retry.error_status_code', statusCode || 0);
        attemptSpan.end();

        // Don't retry if not retryable
        if (!isRetryable) {
          logger.info(`[Retry] Not retrying ${operationName} - non-retryable error`, {
            service: serviceName,
            operation: operationName,
            error: lastError.message,
            statusCode,
            attempt,
          });
          
          parentSpan.setAttribute('retry.gave_up_reason', 'non_retryable_error');
          parentSpan.setAttribute('retry.final_status_code', statusCode || 0);
          parentSpan.end();
          
          throw lastError;
        }

        // Check if we should retry
        if (attempt > config.maxRetries) {
          logger.warn(`[Retry] Max retries exceeded for ${operationName}`, {
            service: serviceName,
            operation: operationName,
            maxRetries: config.maxRetries,
            lastError: lastError.message,
          });
          
          parentSpan.setAttribute('retry.gave_up_reason', 'max_retries_exceeded');
          parentSpan.setAttribute('retry.total_attempts', attempt);
          parentSpan.end();
          
          throw lastError;
        }

        // Calculate and apply backoff delay
        const delay = calculateDelay(
          attempt,
          config.baseDelay,
          config.maxDelay,
          config.backoffMultiplier,
          config.jitter
        );

        logger.info(`[Retry] Waiting ${delay}ms before attempt ${attempt + 1} for ${operationName}`, {
          service: serviceName,
          operation: operationName,
          nextAttempt: attempt + 1,
          delayMs: delay,
          error: lastError.message,
        });

        parentSpan.setAttribute(`retry.attempt_${attempt}_delay_ms`, delay);

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Should never reach here, but just in case
    throw lastError || new Error('Retry loop exhausted');

  } catch (error) {
    parentSpan.recordException(error as Error);
    parentSpan.setStatus({ 
      code: SpanStatusCode.ERROR, 
      message: (error as Error).message 
    });
    parentSpan.end();
    throw error;
  }
}

/**
 * Wrap an async function with retry logic permanently
 */
export function wrapWithRetry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  operationName: string,
  serviceName: string,
  config?: Partial<RetryConfig>
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return withRetry(
      operationName,
      () => fn(...args),
      serviceName,
      config
    ) as Promise<ReturnType<T>>;
  };
}

/**
 * Get retry statistics (for monitoring)
 */
export interface RetryStats {
  operation: string;
  service: string;
  totalAttempts: number;
  successCount: number;
  failureCount: number;
  averageRetries: number;
}

// In-memory stats storage (replace with Redis for distributed systems)
const retryStatsMap = new Map<string, RetryStats>();

export function recordRetryStats(
  operationName: string,
  serviceName: string,
  attempts: number,
  success: boolean
): void {
  const key = `${serviceName}:${operationName}`;
  const existing = retryStatsMap.get(key);
  
  if (existing) {
    existing.totalAttempts++;
    if (success) existing.successCount++;
    else existing.failureCount++;
    existing.averageRetries = 
      (existing.averageRetries * (existing.totalAttempts - 1) + attempts) / 
      existing.totalAttempts;
  } else {
    retryStatsMap.set(key, {
      operation: operationName,
      service: serviceName,
      totalAttempts: 1,
      successCount: success ? 1 : 0,
      failureCount: success ? 0 : 1,
      averageRetries: attempts,
    });
  }
}

export function getRetryStats(): RetryStats[] {
  return Array.from(retryStatsMap.values());
}

export function clearRetryStats(): void {
  retryStatsMap.clear();
}
