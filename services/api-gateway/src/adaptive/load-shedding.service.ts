/**
 * Load Shedding Service
 * 
 * Implements adaptive load shedding based on:
 * - CPU usage (> 70% warning, > 85% critical)
 * - Memory usage (> 75% warning, > 90% critical)
 * - Event loop lag (> 50ms warning, > 200ms critical)
 * - Active connections (> 8000 warning)
 * 
 * Automatically rejects low-priority requests under overload.
 */

import { 
  trace, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import os from 'os';
import { logger } from '../middleware/correlation-logger.middleware';
import { 
  LOAD_SHEDDING_CONFIG, 
  OVERLOAD_THRESHOLDS,
  RequestPriority,
  PRIORITY_CONFIGS,
  OverloadState 
} from './adaptive-config';

// System metrics
interface SystemMetrics {
  cpuPercent: number;
  memoryPercent: number;
  memoryUsedMB: number;
  memoryTotalMB: number;
  eventLoopLagMs: number;
  activeConnections: number;
  timestamp: Date;
}

// Current state
let currentOverloadState: OverloadState = 'normal';
let lastMetrics: SystemMetrics | null = null;
let eventLoopLagHistogram: number[] = [];
let connectionCount = 0;

// Tracer
const tracer = trace.getTracer('load-shedding');

// ============================================
// SYSTEM METRICS COLLECTION
// ============================================

/**
 * Collect current system metrics
 */
export function collectSystemMetrics(): SystemMetrics {
  const span = tracer.startSpan('metrics.collect', {
    kind: SpanKind.INTERNAL,
  });

  // CPU usage (average over all cores)
  const cpuCount = os.cpus().length;
  const loadAvg = os.loadavg()[0]; // 1-minute load average
  const cpuPercent = Math.min((loadAvg / cpuCount) * 100, 100);

  // Memory usage
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryPercent = (usedMemory / totalMemory) * 100;

  // Event loop lag (calculated from histogram)
  const eventLoopLag = calculateEventLoopLag();

  const metrics: SystemMetrics = {
    cpuPercent: Math.round(cpuPercent),
    memoryPercent: Math.round(memoryPercent),
    memoryUsedMB: Math.round(usedMemory / 1024 / 1024),
    memoryTotalMB: Math.round(totalMemory / 1024 / 1024),
    eventLoopLagMs: eventLoopLag,
    activeConnections: connectionCount,
    timestamp: new Date(),
  };

  lastMetrics = metrics;

  span.setAttributes({
    'system.cpu_percent': metrics.cpuPercent,
    'system.memory_percent': metrics.memoryPercent,
    'system.event_loop_lag_ms': metrics.eventLoopLagMs,
    'system.active_connections': metrics.activeConnections,
  });
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  return metrics;
}

/**
 * Calculate event loop lag from histogram
 */
function calculateEventLoopLag(): number {
  if (eventLoopLagHistogram.length === 0) return 0;
  
  // Use P95 of recent samples
  const sorted = [...eventLoopLagHistogram].sort((a, b) => a - b);
  const p95Index = Math.floor(sorted.length * 0.95);
  return sorted[p95Index] || 0;
}

/**
 * Record event loop lag sample
 */
export function recordEventLoopLag(lagMs: number): void {
  eventLoopLagHistogram.push(lagMs);
  
  // Keep only last 100 samples
  if (eventLoopLagHistogram.length > 100) {
    eventLoopLagHistogram.shift();
  }
}

// ============================================
// OVERLOAD STATE DETECTION
// ============================================

/**
 * Determine overload state from metrics
 */
export function determineOverloadState(metrics: SystemMetrics): OverloadState {
  const degraded = OVERLOAD_THRESHOLDS.degraded;
  const critical = OVERLOAD_THRESHOLDS.critical;

  // Check critical thresholds
  if (metrics.cpuPercent >= critical.cpuPercent ||
      metrics.memoryPercent >= critical.memoryPercent ||
      metrics.eventLoopLagMs >= critical.eventLoopLagMs) {
    return 'critical';
  }

  // Check degraded thresholds
  if (metrics.cpuPercent >= degraded.cpuPercent ||
      metrics.memoryPercent >= degraded.memoryPercent ||
      metrics.eventLoopLagMs >= degraded.eventLoopLagMs ||
      metrics.activeConnections >= LOAD_SHEDDING_CONFIG.connectionWarningThreshold) {
    return 'degraded';
  }

  return 'normal';
}

/**
 * Update overload state and trigger actions
 */
export function updateOverloadState(): OverloadState {
  const metrics = collectSystemMetrics();
  const newState = determineOverloadState(metrics);

  if (newState !== currentOverloadState) {
    const oldState = currentOverloadState;
    currentOverloadState = newState;

    // Create state change span
    const span = tracer.startSpan('overload.state_change', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'overload.old_state': oldState,
        'overload.new_state': newState,
        'system.cpu_percent': metrics.cpuPercent,
        'system.memory_percent': metrics.memoryPercent,
        'system.event_loop_lag_ms': metrics.eventLoopLagMs,
      },
    });
    span.end();

    logger.warn(`[LoadShedding] Overload state changed: ${oldState} → ${newState}`, {
      oldState,
      newState,
      metrics,
    });

    // Trigger state-specific actions
    if (newState === 'critical') {
      onEnterCriticalState();
    } else if (newState === 'degraded') {
      onEnterDegradedState();
    } else if (newState === 'normal' && oldState !== 'normal') {
      onEnterRecoveryState();
    }
  }

  return currentOverloadState;
}

/**
 * Actions when entering critical state
 */
function onEnterCriticalState(): void {
  const span = tracer.startSpan('load_shed.critical', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'load_shed.severity': 'critical',
      'load_shed.action': 'aggressive_shedding',
    },
  });
  span.end();

  logger.error('[LoadShedding] Entering CRITICAL state - aggressive shedding enabled', {
    state: 'critical',
  });
}

/**
 * Actions when entering degraded state
 */
function onEnterDegradedState(): void {
  const span = tracer.startSpan('load_shed.degraded', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'load_shed.severity': 'degraded',
      'load_shed.action': 'moderate_shedding',
    },
  });
  span.end();

  logger.warn('[LoadShedding] Entering DEGRADED state - moderate shedding enabled');
}

/**
 * Actions when entering recovery state
 */
function onEnterRecoveryState(): void {
  const span = tracer.startSpan('load_shed.recovery', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'load_shed.severity': 'recovery',
      'load_shed.action': 'restoring_capacity',
    },
  });
  span.end();

  logger.info('[LoadShedding] Entering RECOVERY state - restoring full capacity');
}

// ============================================
// LOAD SHEDDING DECISIONS
// ============================================

export interface ShedDecision {
  shouldShed: boolean;
  reason?: string;
  priority: RequestPriority;
}

/**
 * Determine if request should be shed based on priority and state
 */
export function shouldShedRequest(
  priority: RequestPriority,
  customMetrics?: Partial<SystemMetrics>
): ShedDecision {
  const span = tracer.startSpan('load_shed.decision', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'request.priority': priority,
      'system.overload_state': currentOverloadState,
    },
  });

  const priorityConfig = PRIORITY_CONFIGS[priority];
  const metrics = customMetrics ? { ...lastMetrics, ...customMetrics } as SystemMetrics : lastMetrics;

  // Never shed critical or non-sheddable priorities
  if (!priorityConfig.canBeShed) {
    span.setAttribute('load_shed.decision', 'allow');
    span.setAttribute('load_shed.reason', 'priority_protected');
    span.end();
    return { shouldShed: false, priority };
  }

  // In critical state, shed normal and below
  if (currentOverloadState === 'critical') {
    if (priority === 'normal' || priority === 'low' || priority === 'background') {
      span.setAttribute('load_shed.decision', 'shed');
      span.setAttribute('load_shed.reason', 'critical_state');
      span.end();
      
      logger.debug(`[LoadShedding] Shedding ${priority} request due to critical state`);
      
      return {
        shouldShed: true,
        reason: `System in critical state (CPU: ${metrics?.cpuPercent}%, Memory: ${metrics?.memoryPercent}%)`,
        priority,
      };
    }
  }

  // In degraded state, shed low and background only
  if (currentOverloadState === 'degraded') {
    if (priority === 'low' || priority === 'background') {
      span.setAttribute('load_shed.decision', 'shed');
      span.setAttribute('load_shed.reason', 'degraded_state');
      span.end();
      
      logger.debug(`[LoadShedding] Shedding ${priority} request due to degraded state`);
      
      return {
        shouldShed: true,
        reason: `System degraded (CPU: ${metrics?.cpuPercent}%, Memory: ${metrics?.memoryPercent}%)`,
        priority,
      };
    }
  }

  span.setAttribute('load_shed.decision', 'allow');
  span.end();
  
  return { shouldShed: false, priority };
}

// ============================================
// CONNECTION MANAGEMENT
// ============================================

export function incrementConnection(): void {
  connectionCount++;
}

export function decrementConnection(): void {
  connectionCount = Math.max(0, connectionCount - 1);
}

export function getConnectionCount(): number {
  return connectionCount;
}

// ============================================
// PERIODIC CHECKS
// ============================================

let checkInterval: NodeJS.Timeout | null = null;

export function startLoadSheddingMonitor(checkIntervalMs: number = 5000): void {
  if (checkInterval) return;

  logger.info(`[LoadShedding] Starting monitor (interval: ${checkIntervalMs}ms)`);

  checkInterval = setInterval(() => {
    updateOverloadState();
  }, checkIntervalMs);
}

export function stopLoadSheddingMonitor(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    logger.info('[LoadShedding] Monitor stopped');
  }
}

// ============================================
// HEALTH & METRICS
// ============================================

export function getLoadSheddingHealth(): {
  state: OverloadState;
  metrics: SystemMetrics | null;
  sheddingActive: boolean;
} {
  return {
    state: currentOverloadState,
    metrics: lastMetrics,
    sheddingActive: currentOverloadState !== 'normal',
  };
}

export function getCurrentOverloadState(): OverloadState {
  return currentOverloadState;
}

// ============================================
// PRIORITY QUEUE INTEGRATION
// ============================================

/**
 * Get effective priority weight considering system state
 */
export function getEffectivePriorityWeight(priority: RequestPriority): number {
  const baseWeight = PRIORITY_CONFIGS[priority].weight;
  
  // Boost critical priorities under load
  if (currentOverloadState === 'critical' && priority === 'critical') {
    return baseWeight * 2;
  }
  
  // Reduce background priority under any load
  if (currentOverloadState !== 'normal' && priority === 'background') {
    return Math.max(1, baseWeight / 2);
  }
  
  return baseWeight;
}

export { currentOverloadState, lastMetrics };
