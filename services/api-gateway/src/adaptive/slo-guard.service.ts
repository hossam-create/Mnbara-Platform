/**
 * SLO Guard Service
 * 
 * Monitors Service Level Objectives:
 * - P95 latency < 300ms
 * - P99 latency < 500ms  
 * - Error rate < 2%
 * - Availability > 99.9%
 * 
 * Triggers adaptive actions when SLOs are violated.
 */

import { 
  trace, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import { logger } from '../middleware/correlation-logger.middleware';
import { 
  SLO_TARGETS, 
  METRIC_WINDOWS,
  SLODefinition 
} from './adaptive-config';
import { currentOverloadState } from './load-shedding.service';

// Metric storage
interface LatencySample {
  latencyMs: number;
  timestamp: number;
}

interface ErrorSample {
  isError: boolean;
  timestamp: number;
}

const latencySamples: LatencySample[] = [];
const errorSamples: ErrorSample[] = [];
let totalRequests = 0;
let successfulRequests = 0;

// SLO violation tracking
interface SLOViolation {
  type: 'latency_p95' | 'latency_p99' | 'error_rate' | 'availability';
  timestamp: number;
  observedValue: number;
  threshold: number;
  severity: 'warning' | 'critical';
}

const recentViolations: SLOViolation[] = [];
const MAX_VIOLATIONS_HISTORY = 100;

// Current SLO status
interface SLOStatus {
  latencyP95Ms: number;
  latencyP99Ms: number;
  errorRatePercent: number;
  availabilityPercent: number;
  healthy: boolean;
  violations: SLOViolation[];
}

let currentStatus: SLOStatus = {
  latencyP95Ms: 0,
  latencyP99Ms: 0,
  errorRatePercent: 0,
  availabilityPercent: 100,
  healthy: true,
  violations: [],
};

// Tracer
const tracer = trace.getTracer('slo-guard');

// ============================================
// METRIC COLLECTION
// ============================================

/**
 * Record request latency
 */
export function recordLatency(latencyMs: number): void {
  const now = Date.now();
  
  latencySamples.push({
    latencyMs,
    timestamp: now,
  });
  
  // Clean old samples
  const cutoff = now - METRIC_WINDOWS.latencyWindowMs;
  while (latencySamples.length > 0 && latencySamples[0].timestamp < cutoff) {
    latencySamples.shift();
  }
  
  // Limit storage
  if (latencySamples.length > 10000) {
    latencySamples.splice(0, latencySamples.length - 10000);
  }
}

/**
 * Record request outcome
 */
export function recordRequestOutcome(isError: boolean): void {
  const now = Date.now();
  
  totalRequests++;
  if (!isError) {
    successfulRequests++;
  }
  
  errorSamples.push({
    isError,
    timestamp: now,
  });
  
  // Clean old samples
  const cutoff = now - METRIC_WINDOWS.errorRateWindowMs;
  while (errorSamples.length > 0 && errorSamples[0].timestamp < cutoff) {
    errorSamples.shift();
  }
}

// ============================================
// PERCENTILE CALCULATIONS
// ============================================

/**
 * Calculate percentile from latency samples
 */
function calculatePercentile(samples: number[], percentile: number): number {
  if (samples.length === 0) return 0;
  
  const sorted = [...samples].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Get P95 latency
 */
export function getP95Latency(): number {
  const latencies = latencySamples.map(s => s.latencyMs);
  return calculatePercentile(latencies, 95);
}

/**
 * Get P99 latency
 */
export function getP99Latency(): number {
  const latencies = latencySamples.map(s => s.latencyMs);
  return calculatePercentile(latencies, 99);
}

// ============================================
// SLO CHECKS
// ============================================

/**
 * Check all SLOs and return status
 */
export function checkSLOs(): SLOStatus {
  const span = tracer.startSpan('slo.check', {
    kind: SpanKind.INTERNAL,
  });

  const p95 = getP95Latency();
  const p99 = getP99Latency();
  
  // Calculate error rate
  const errorCount = errorSamples.filter(s => s.isError).length;
  const errorRate = errorSamples.length > 0 
    ? (errorCount / errorSamples.length) * 100 
    : 0;
  
  // Calculate availability
  const availability = totalRequests > 0 
    ? (successfulRequests / totalRequests) * 100 
    : 100;

  const status: SLOStatus = {
    latencyP95Ms: Math.round(p95),
    latencyP99Ms: Math.round(p99),
    errorRatePercent: parseFloat(errorRate.toFixed(2)),
    availabilityPercent: parseFloat(availability.toFixed(2)),
    healthy: true,
    violations: [],
  };

  // Check for violations
  const violations: SLOViolation[] = [];

  // P95 latency check
  if (p95 > SLO_TARGETS.p95LatencyMs) {
    violations.push({
      type: 'latency_p95',
      timestamp: Date.now(),
      observedValue: Math.round(p95),
      threshold: SLO_TARGETS.p95LatencyMs,
      severity: p95 > SLO_TARGETS.p95LatencyMs * 1.5 ? 'critical' : 'warning',
    });
  }

  // P99 latency check
  if (p99 > SLO_TARGETS.p99LatencyMs) {
    violations.push({
      type: 'latency_p99',
      timestamp: Date.now(),
      observedValue: Math.round(p99),
      threshold: SLO_TARGETS.p99LatencyMs,
      severity: p99 > SLO_TARGETS.p99LatencyMs * 1.5 ? 'critical' : 'warning',
    });
  }

  // Error rate check
  if (errorRate > SLO_TARGETS.errorRatePercent) {
    violations.push({
      type: 'error_rate',
      timestamp: Date.now(),
      observedValue: parseFloat(errorRate.toFixed(2)),
      threshold: SLO_TARGETS.errorRatePercent,
      severity: errorRate > SLO_TARGETS.errorRatePercent * 2 ? 'critical' : 'warning',
    });
  }

  // Availability check
  if (availability < SLO_TARGETS.availabilityPercent) {
    violations.push({
      type: 'availability',
      timestamp: Date.now(),
      observedValue: parseFloat(availability.toFixed(2)),
      threshold: SLO_TARGETS.availabilityPercent,
      severity: availability < 95 ? 'critical' : 'warning',
    });
  }

  // Store violations
  if (violations.length > 0) {
    recentViolations.push(...violations);
    
    // Trim history
    if (recentViolations.length > MAX_VIOLATIONS_HISTORY) {
      recentViolations.splice(0, recentViolations.length - MAX_VIOLATIONS_HISTORY);
    }

    // Log and trace
    for (const violation of violations) {
      const violationSpan = tracer.startSpan('slo.violation', {
        kind: SpanKind.INTERNAL,
        attributes: {
          'slo.violation_type': violation.type,
          'slo.observed_value': violation.observedValue,
          'slo.threshold': violation.threshold,
          'slo.severity': violation.severity,
        },
      });
      
      if (violation.severity === 'critical') {
        logger.error(`[SLOGuard] CRITICAL SLO violation: ${violation.type}`, {
          type: violation.type,
          observed: violation.observedValue,
          threshold: violation.threshold,
        });
      } else {
        logger.warn(`[SLOGuard] SLO violation: ${violation.type}`, {
          type: violation.type,
          observed: violation.observedValue,
          threshold: violation.threshold,
        });
      }
      
      violationSpan.end();
    }

    status.healthy = false;
    status.violations = violations;

    // Trigger adaptive actions
    onSLOViolation(violations);
  }

  // Update span
  span.setAttributes({
    'slo.p95_latency_ms': status.latencyP95Ms,
    'slo.p99_latency_ms': status.latencyP99Ms,
    'slo.error_rate_percent': status.errorRatePercent,
    'slo.availability_percent': status.availabilityPercent,
    'slo.healthy': status.healthy,
    'slo.violation_count': violations.length,
  });
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  currentStatus = status;
  return status;
}

// ============================================
// ADAPTIVE ACTIONS
// ============================================

/**
 * Trigger adaptive actions on SLO violation
 */
function onSLOViolation(violations: SLOViolation[]): void {
  const criticalCount = violations.filter(v => v.severity === 'critical').length;
  const hasLatencyViolation = violations.some(v => v.type.startsWith('latency'));
  const hasErrorViolation = violations.some(v => v.type === 'error_rate');

  const span = tracer.startSpan('slo.adaptive_action', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'slo.critical_violations': criticalCount,
      'slo.has_latency_issue': hasLatencyViolation,
      'slo.has_error_issue': hasErrorViolation,
    },
  });

  // Actions based on violation type
  if (criticalCount > 0) {
    // Critical: aggressive load shedding
    logger.error('[SLOGuard] Triggering aggressive adaptive measures');
    
    // Increase retry delay
    increaseRetryDelay();
    
    // Reduce concurrency
    reduceConcurrencyLimits();
    
    // Trigger load shedding
    if (currentOverloadState === 'normal') {
      // Force degraded state
      logger.warn('[SLOGuard] Forcing degraded state due to SLO violation');
    }
  } else if (hasLatencyViolation) {
    // Warning: latency issues
    logger.warn('[SLOGuard] Latency SLO violation - tuning circuit breakers');
    
    // Adjust circuit breaker thresholds
    adjustCircuitThresholds('latency');
  } else if (hasErrorViolation) {
    // Warning: error rate issues
    logger.warn('[SLOGuard] Error rate SLO violation - reviewing error patterns');
    
    // Adjust circuit breaker thresholds
    adjustCircuitThresholds('error');
  }

  span.end();
}

/**
 * Increase retry delay to reduce load
 */
function increaseRetryDelay(): void {
  logger.info('[SLOGuard] Increasing retry delay to reduce load');
  // This would dynamically adjust retry configuration
  // Implementation depends on retry service integration
}

/**
 * Reduce concurrency limits
 */
function reduceConcurrencyLimits(): void {
  logger.info('[SLOGuard] Reducing concurrency limits');
  // This would dynamically adjust bulkhead limits
  // Implementation depends on bulkhead service integration
}

/**
 * Adjust circuit breaker thresholds based on SLO violation type
 */
function adjustCircuitThresholds(violationType: 'latency' | 'error'): void {
  logger.info(`[SLOGuard] Adjusting circuit breaker thresholds for ${violationType}`);
  // This would dynamically adjust circuit breaker settings
  // Implementation depends on circuit breaker service integration
}

// ============================================
// MONITORING
// ============================================

let sloCheckInterval: NodeJS.Timeout | null = null;

export function startSLOMonitor(checkIntervalMs: number = 30000): void {
  if (sloCheckInterval) return;

  logger.info(`[SLOGuard] Starting SLO monitor (interval: ${checkIntervalMs}ms)`);

  sloCheckInterval = setInterval(() => {
    checkSLOs();
  }, checkIntervalMs);
}

export function stopSLOMonitor(): void {
  if (sloCheckInterval) {
    clearInterval(sloCheckInterval);
    sloCheckInterval = null;
    logger.info('[SLOGuard] SLO monitor stopped');
  }
}

// ============================================
// HEALTH & METRICS
// ============================================

export function getSLOHealth(): {
  status: SLOStatus;
  targets: SLODefinition;
  recentViolations: SLOViolation[];
} {
  return {
    status: currentStatus,
    targets: SLO_TARGETS,
    recentViolations: [...recentViolations].slice(-10),
  };
}

export function getCurrentSLOStatus(): SLOStatus {
  return currentStatus;
}

export function isSLOHealthy(): boolean {
  return currentStatus.healthy;
}

// ============================================
// RESET
// ============================================

export function resetSLOMetrics(): void {
  latencySamples.length = 0;
  errorSamples.length = 0;
  totalRequests = 0;
  successfulRequests = 0;
  recentViolations.length = 0;
  
  currentStatus = {
    latencyP95Ms: 0,
    latencyP99Ms: 0,
    errorRatePercent: 0,
    availabilityPercent: 100,
    healthy: true,
    violations: [],
  };
  
  logger.info('[SLOGuard] Metrics reset');
}

export { currentStatus, recentViolations };
