/**
 * Adaptive Retry & Backoff Tuning Service
 * 
 * Dynamically adjusts retry intervals, backoff strategies, and jitter based on:
 * - Predicted latency trends
 * - Current system load
 * - Historical success/failure patterns
 * 
 * Features:
 * - ML-informed retry intervals
 * - Dynamic exponential backoff with trend adjustment
 * - Intelligent jitter to prevent thundering herds
 * - Circuit breaker integration
 */

import { 
  trace, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import { logger } from '../middleware/correlation-logger.middleware';
import { 
  ADAPTIVE_RETRY_CONFIG,
} from './predictive-config';
import { getMetricHistory, predictServiceLoad } from './predictive-load.service';

// ============================================
// TYPES
// ============================================

export interface RetryPolicy {
  service: string;
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  currentDelayMs: number;
  backoffMultiplier: number;
  jitterEnabled: boolean;
  jitterRange: { min: number; max: number };
  lastUpdated: number;
  successRate: number;
  averageLatency: number;
  trend: 'improving' | 'degrading' | 'stable';
}

export interface RetryAttempt {
  id: string;
  timestamp: number;
  service: string;
  attempt: number;
  delayMs: number;
  success: boolean;
  latencyMs: number;
  jitterApplied: number;
}

export interface RetryStats {
  totalAttempts: number;
  successfulRetries: number;
  failedRetries: number;
  averageLatency: number;
  currentPolicies: RetryPolicy[];
}

// ============================================
// STATE
// ============================================

const retryPolicies: Map<string, RetryPolicy> = new Map();
const retryHistory: RetryAttempt[] = [];
const MAX_HISTORY_SIZE = 500;

let tuningInterval: NodeJS.Timeout | null = null;

const tracer = trace.getTracer('adaptive-retry');

// Default services to monitor
const SERVICES = ['api-gateway', 'wallet-service', 'traveler-service', 'marketplace-service'];

// ============================================
// INITIALIZATION
// ============================================

export function initializeAdaptiveRetry(): void {
  logger.info('[AdaptiveRetry] Initializing adaptive retry service');

  const config = ADAPTIVE_RETRY_CONFIG;

  for (const service of SERVICES) {
    retryPolicies.set(service, {
      service,
      maxRetries: 3,
      baseDelayMs: config.baseDelayMs,
      maxDelayMs: config.maxDelayMs,
      currentDelayMs: config.baseDelayMs,
      backoffMultiplier: 2,
      jitterEnabled: config.jitterEnabled,
      jitterRange: config.jitterRange,
      lastUpdated: Date.now(),
      successRate: 1.0,
      averageLatency: 100,
      trend: 'stable',
    });
  }

  logger.info('[AdaptiveRetry] Initialized', {
    services: SERVICES.length,
    baseDelay: config.baseDelayMs,
    maxDelay: config.maxDelayMs,
  });
}

// ============================================
// DELAY CALCULATION
// ============================================

/**
 * Calculate retry delay with ML-informed adjustments
 */
export function calculateRetryDelay(
  service: string,
  attempt: number,
  previousLatency?: number
): { delayMs: number; jitter: number; totalDelayMs: number } {
  const span = tracer.startSpan('adaptive_retry.calculate_delay', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'retry.service': service,
      'retry.attempt': attempt,
    },
  });

  const policy = retryPolicies.get(service);
  if (!policy) {
    // Return default delay
    const baseDelay = Math.min(
      ADAPTIVE_RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt),
      ADAPTIVE_RETRY_CONFIG.maxDelayMs
    );
    
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
    
    return {
      delayMs: baseDelay,
      jitter: 0,
      totalDelayMs: baseDelay,
    };
  }

  // Base exponential backoff
  let baseDelay = policy.baseDelayMs * Math.pow(policy.backoffMultiplier, attempt - 1);
  
  // Cap at max delay
  baseDelay = Math.min(baseDelay, policy.maxDelayMs);

  // Apply trend adjustment
  if (ADAPTIVE_RETRY_CONFIG.dynamicBackoff) {
    switch (policy.trend) {
      case 'improving':
        // Reduce delay when things are getting better
        baseDelay *= 0.8;
        break;
      case 'degrading':
        // Increase delay when things are getting worse
        baseDelay *= 1.3;
        break;
      case 'stable':
        // Keep as is
        break;
    }
  }

  // Use predicted latency if available
  if (ADAPTIVE_RETRY_CONFIG.usePredictedLatency && attempt === 1) {
    const prediction = predictServiceLoad(service);
    if (prediction.confidence > 0.6) {
      // Adjust base delay based on predicted load
      const loadFactor = prediction.predictedLoad / 100;
      baseDelay = baseDelay * (1 + loadFactor * ADAPTIVE_RETRY_CONFIG.latencyMultiplier);
    }
  }

  // Apply previous latency if provided
  if (previousLatency && previousLatency > 500) {
    // If previous attempt was slow, add extra delay
    baseDelay += Math.min(5000, previousLatency * 0.2);
  }

  // Ensure we don't exceed max
  baseDelay = Math.min(baseDelay, policy.maxDelayMs);

  // Calculate jitter
  let jitter = 0;
  if (policy.jitterEnabled) {
    const jitterRange = policy.jitterRange.max - policy.jitterRange.min;
    const randomJitter = Math.random() * jitterRange;
    jitter = policy.jitterRange.min + randomJitter;
    
    // Add extra jitter during high load to prevent thundering herds
    if (policy.averageLatency > 300) {
      jitter *= 1.5;
    }
  }

  const totalDelay = Math.round(baseDelay * jitter);

  span.setAttributes({
    'retry.base_delay': baseDelay,
    'retry.jitter': jitter,
    'retry.total_delay': totalDelay,
    'retry.trend': policy.trend,
  });
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  return {
    delayMs: Math.round(baseDelay),
    jitter: Math.round(jitter * 100) / 100,
    totalDelayMs: totalDelay,
  };
}

/**
 * Execute a retry with calculated delay
 */
export async function executeWithRetry<T>(
  service: string,
  operation: () => Promise<T>,
  options?: {
    maxRetries?: number;
    onRetry?: (attempt: number, delay: number, error: Error) => void;
  }
): Promise<T> {
  const policy = retryPolicies.get(service);
  const maxRetries = options?.maxRetries || policy?.maxRetries || 3;

  let lastError: Error | undefined;
  let previousLatency = 0;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const startTime = Date.now();

    try {
      const result = await operation();
      
      // Record successful attempt
      const latency = Date.now() - startTime;
      recordRetryAttempt(service, attempt, 0, true, latency, 0);
      
      return result;
    } catch (error) {
      lastError = error as Error;
      const latency = Date.now() - startTime;
      previousLatency = latency;

      if (attempt > maxRetries) {
        // Record final failed attempt
        recordRetryAttempt(service, attempt, 0, false, latency, 0);
        throw lastError;
      }

      // Calculate delay for next retry
      const { delayMs, jitter, totalDelayMs } = calculateRetryDelay(
        service,
        attempt,
        previousLatency
      );

      // Record failed attempt
      recordRetryAttempt(service, attempt, delayMs, false, latency, jitter);

      // Callback if provided
      if (options?.onRetry) {
        options.onRetry(attempt, totalDelayMs, lastError);
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, totalDelayMs));
    }
  }

  throw lastError;
}

/**
 * Record retry attempt for analytics
 */
function recordRetryAttempt(
  service: string,
  attempt: number,
  delayMs: number,
  success: boolean,
  latencyMs: number,
  jitter: number
): void {
  const attemptRecord: RetryAttempt = {
    id: `retry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    service,
    attempt,
    delayMs,
    success,
    latencyMs,
    jitterApplied: jitter,
  };

  retryHistory.unshift(attemptRecord);
  if (retryHistory.length > MAX_HISTORY_SIZE) {
    retryHistory.pop();
  }
}

// ============================================
// POLICY TUNING
// ============================================

/**
 * Tune retry policies based on historical performance
 */
export function tuneRetryPolicies(): void {
  const span = tracer.startSpan('adaptive_retry.tune_policies', {
    kind: SpanKind.INTERNAL,
  });

  const config = ADAPTIVE_RETRY_CONFIG;
  const now = Date.now();
  const trendWindowMs = config.trendAnalysisWindowMs;

  for (const [service, policy] of retryPolicies) {
    // Get recent retry history for this service
    const recentAttempts = retryHistory.filter(
      r => r.service === service && r.timestamp > now - trendWindowMs
    );

    if (recentAttempts.length < 5) continue;

    // Calculate success rate
    const successful = recentAttempts.filter(r => r.success).length;
    const successRate = successful / recentAttempts.length;

    // Calculate average latency
    const avgLatency = recentAttempts.reduce((sum, r) => sum + r.latencyMs, 0) / recentAttempts.length;

    // Determine trend
    const halfPoint = Math.floor(recentAttempts.length / 2);
    const firstHalf = recentAttempts.slice(-recentAttempts.length, -halfPoint);
    const secondHalf = recentAttempts.slice(-halfPoint);

    const firstHalfLatency = firstHalf.reduce((sum, r) => sum + r.latencyMs, 0) / firstHalf.length;
    const secondHalfLatency = secondHalf.reduce((sum, r) => sum + r.latencyMs, 0) / secondHalf.length;

    let trend: 'improving' | 'degrading' | 'stable' = 'stable';
    if (secondHalfLatency < firstHalfLatency * 0.9) {
      trend = 'improving';
    } else if (secondHalfLatency > firstHalfLatency * 1.1) {
      trend = 'degrading';
    }

    // Adjust policy based on metrics
    let newBaseDelay = policy.baseDelayMs;
    let newBackoffMultiplier = policy.backoffMultiplier;

    if (successRate < 0.5) {
      // Low success rate - increase delays
      newBaseDelay = Math.min(policy.maxDelayMs, policy.baseDelayMs * 1.2);
      newBackoffMultiplier = Math.min(3, policy.backoffMultiplier * 1.1);
    } else if (successRate > 0.9 && trend === 'improving') {
      // High success rate and improving - can reduce delays slightly
      newBaseDelay = Math.max(100, policy.baseDelayMs * 0.95);
      newBackoffMultiplier = Math.max(1.5, policy.backoffMultiplier * 0.95);
    }

    // Update policy
    policy.baseDelayMs = Math.round(newBaseDelay);
    policy.backoffMultiplier = Math.round(newBackoffMultiplier * 100) / 100;
    policy.successRate = successRate;
    policy.averageLatency = avgLatency;
    policy.trend = trend;
    policy.lastUpdated = now;

    logger.debug(`[AdaptiveRetry] Tuned ${service}:`, {
      successRate: successRate.toFixed(2),
      trend,
      baseDelay: policy.baseDelayMs,
      backoff: policy.backoffMultiplier,
    });
  }

  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
}

// ============================================
// MONITORING
// ============================================

export function startAdaptiveRetryMonitor(): void {
  if (tuningInterval) {
    logger.warn('[AdaptiveRetry] Already running');
    return;
  }

  if (!ADAPTIVE_RETRY_CONFIG.enabled) {
    logger.info('[AdaptiveRetry] Adaptive retry disabled');
    return;
  }

  logger.info('[AdaptiveRetry] Starting adaptive retry monitor');

  // Tune policies every minute
  tuningInterval = setInterval(() => {
    tuneRetryPolicies();
  }, 60000);
}

export function stopAdaptiveRetryMonitor(): void {
  if (tuningInterval) {
    clearInterval(tuningInterval);
    tuningInterval = null;
    logger.info('[AdaptiveRetry] Stopped');
  }
}

// ============================================
// QUERY FUNCTIONS
// ============================================

export function getRetryPolicy(service: string): RetryPolicy | undefined {
  return retryPolicies.get(service);
}

export function getAllRetryPolicies(): RetryPolicy[] {
  return Array.from(retryPolicies.values());
}

export function getRetryStats(service?: string): RetryStats {
  const attempts = service 
    ? retryHistory.filter(r => r.service === service)
    : retryHistory;

  const successful = attempts.filter(r => r.success).length;
  const failed = attempts.length - successful;
  
  const avgLatency = attempts.length > 0
    ? attempts.reduce((sum, r) => sum + r.latencyMs, 0) / attempts.length
    : 0;

  return {
    totalAttempts: attempts.length,
    successfulRetries: successful,
    failedRetries: failed,
    averageLatency: Math.round(avgLatency),
    currentPolicies: getAllRetryPolicies(),
  };
}

// ============================================
// HEALTH
// ============================================

export function getAdaptiveRetryHealth(): {
  enabled: boolean;
  isRunning: boolean;
  policies: RetryPolicy[];
  recentStats: RetryStats;
} {
  return {
    enabled: ADAPTIVE_RETRY_CONFIG.enabled,
    isRunning: tuningInterval !== null,
    policies: getAllRetryPolicies(),
    recentStats: getRetryStats(),
  };
}

// ============================================
// RESET
// ============================================

export function resetAdaptiveRetry(): void {
  stopAdaptiveRetryMonitor();
  retryHistory.length = 0;
  initializeAdaptiveRetry();
  logger.info('[AdaptiveRetry] Reset complete');
}

export { retryPolicies, retryHistory };
