/**
 * Overload Detection Service
 * 
 * Advanced system health monitoring:
 * - Event loop lag tracking
 * - Heap usage monitoring
 * - Active handles tracking
 * - Garbage collection monitoring
 * - Resource exhaustion detection
 * 
 * Emits tracing spans for overload conditions.
 */

import { 
  trace, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import { logger } from '../middleware/correlation-logger.middleware';
import { recordEventLoopLag } from './load-shedding.service';

// Metrics tracking
interface HeapMetrics {
  used: number;
  total: number;
  limit: number;
  percent: number;
}

interface SystemHealthSnapshot {
  timestamp: number;
  eventLoopLagMs: number;
  heap: HeapMetrics;
  activeHandles: number;
  activeRequests: number;
  cpuUsage: number;
  loadAverage: number[];
}

// Health history for trend analysis
const healthHistory: SystemHealthSnapshot[] = [];
const MAX_HISTORY_SIZE = 60; // Keep last 60 snapshots

// Overload thresholds
const OVERLOAD_CONFIG = {
  eventLoopCriticalMs: 200,
  eventLoopWarningMs: 50,
  heapCriticalPercent: 90,
  heapWarningPercent: 75,
  handlesCritical: 1000,
  handlesWarning: 500,
};

// Current state
let lastHealthCheck: SystemHealthSnapshot | null = null;
let overloadDetected = false;
let healthCheckInterval: NodeJS.Timeout | null = null;

// Tracer
const tracer = trace.getTracer('overload-detector');

// ============================================
// HEAP MONITORING
// ============================================

/**
 * Get current heap metrics
 */
export function getHeapMetrics(): HeapMetrics {
  const heapStats = process.memoryUsage();
  const v8HeapStats = (process as unknown as { memoryUsage: () => { heapTotal: number; heapUsed: number } }).memoryUsage();
  
  const used = heapStats.heapUsed || v8HeapStats.heapUsed;
  const total = heapStats.heapTotal || v8HeapStats.heapTotal;
  const limit = heapStats.heapTotal * 1.5; // Estimated limit
  
  return {
    used,
    total,
    limit,
    percent: (used / total) * 100,
  };
}

// ============================================
// EVENT LOOP MONITORING
// ============================================

/**
 * Measure event loop lag
 */
function measureEventLoopLag(): Promise<number> {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    
    setImmediate(() => {
      const end = process.hrtime.bigint();
      const lagMs = Number(end - start) / 1000000; // Convert to milliseconds
      resolve(lagMs);
    });
  });
}

// ============================================
// ACTIVE HANDLES & REQUESTS
// ============================================

/**
 * Get active handles and requests count
 */
function getActiveResources(): { handles: number; requests: number } {
  // Note: These are internal Node.js metrics
  // @ts-ignore - internal API
  const activeHandles = process._getActiveHandles?.() || [];
  // @ts-ignore - internal API
  const activeRequests = process._getActiveRequests?.() || [];
  
  return {
    handles: activeHandles.length,
    requests: activeRequests.length,
  };
}

// ============================================
// HEALTH SNAPSHOT
// ============================================

/**
 * Capture system health snapshot
 */
export async function captureHealthSnapshot(): Promise<SystemHealthSnapshot> {
  const span = tracer.startSpan('health.capture_snapshot', {
    kind: SpanKind.INTERNAL,
  });

  const [eventLoopLag, heap, resources] = await Promise.all([
    measureEventLoopLag(),
    Promise.resolve(getHeapMetrics()),
    Promise.resolve(getActiveResources()),
  ]);

  // Record event loop lag for load shedding
  recordEventLoopLag(eventLoopLag);

  const snapshot: SystemHealthSnapshot = {
    timestamp: Date.now(),
    eventLoopLagMs: eventLoopLag,
    heap,
    activeHandles: resources.handles,
    activeRequests: resources.requests,
    cpuUsage: process.cpuUsage().user / 1000, // microseconds to milliseconds
    loadAverage: require('os').loadavg(),
  };

  // Store in history
  healthHistory.push(snapshot);
  if (healthHistory.length > MAX_HISTORY_SIZE) {
    healthHistory.shift();
  }

  lastHealthCheck = snapshot;

  // Set span attributes
  span.setAttributes({
    'health.event_loop_lag_ms': snapshot.eventLoopLagMs,
    'health.heap_used_mb': Math.round(snapshot.heap.used / 1024 / 1024),
    'health.heap_percent': Math.round(snapshot.heap.percent),
    'health.active_handles': snapshot.activeHandles,
    'health.active_requests': snapshot.activeRequests,
  });

  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  return snapshot;
}

// ============================================
// OVERLOAD DETECTION
// ============================================

export interface OverloadIndicators {
  eventLoopOverloaded: boolean;
  heapOverloaded: boolean;
  handlesOverloaded: boolean;
  severity: 'normal' | 'warning' | 'critical';
  snapshot: SystemHealthSnapshot;
}

/**
 * Check for overload conditions
 */
export async function detectOverload(): Promise<OverloadIndicators> {
  const snapshot = await captureHealthSnapshot();

  const span = tracer.startSpan('overload.detect', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'health.event_loop_lag_ms': snapshot.eventLoopLagMs,
      'health.heap_percent': snapshot.heap.percent,
      'health.active_handles': snapshot.activeHandles,
    },
  });

  // Check event loop
  const eventLoopCritical = snapshot.eventLoopLagMs > OVERLOAD_CONFIG.eventLoopCriticalMs;
  const eventLoopWarning = snapshot.eventLoopLagMs > OVERLOAD_CONFIG.eventLoopWarningMs;
  
  // Check heap
  const heapCritical = snapshot.heap.percent > OVERLOAD_CONFIG.heapCriticalPercent;
  const heapWarning = snapshot.heap.percent > OVERLOAD_CONFIG.heapWarningPercent;
  
  // Check handles
  const handlesCritical = snapshot.activeHandles > OVERLOAD_CONFIG.handlesCritical;
  const handlesWarning = snapshot.activeHandles > OVERLOAD_CONFIG.handlesWarning;

  // Determine severity
  let severity: 'normal' | 'warning' | 'critical' = 'normal';
  
  if (eventLoopCritical || heapCritical || handlesCritical) {
    severity = 'critical';
  } else if (eventLoopWarning || heapWarning || handlesWarning) {
    severity = 'warning';
  }

  const indicators: OverloadIndicators = {
    eventLoopOverloaded: eventLoopWarning || eventLoopCritical,
    heapOverloaded: heapWarning || heapCritical,
    handlesOverloaded: handlesWarning || handlesCritical,
    severity,
    snapshot,
  };

  span.setAttributes({
    'overload.event_loop': indicators.eventLoopOverloaded,
    'overload.heap': indicators.heapOverloaded,
    'overload.handles': indicators.handlesOverloaded,
    'overload.severity': severity,
  });

  // Log and trace overload conditions
  if (severity !== 'normal') {
    const wasOverloaded = overloadDetected;
    overloadDetected = true;

    if (!wasOverloaded) {
      // Transition to overloaded state
      const overloadSpan = tracer.startSpan('overload.detected', {
        kind: SpanKind.INTERNAL,
        attributes: {
          'overload.severity': severity,
          'overload.event_loop_lag_ms': snapshot.eventLoopLagMs,
          'overload.heap_percent': snapshot.heap.percent,
          'overload.active_handles': snapshot.activeHandles,
        },
      });

      if (severity === 'critical') {
        logger.error('[OverloadDetector] CRITICAL overload detected', {
          severity,
          eventLoopLagMs: snapshot.eventLoopLagMs,
          heapPercent: snapshot.heap.percent,
          activeHandles: snapshot.activeHandles,
        });
      } else {
        logger.warn('[OverloadDetector] Warning: system under load', {
          severity,
          eventLoopLagMs: snapshot.eventLoopLagMs,
          heapPercent: snapshot.heap.percent,
          activeHandles: snapshot.activeHandles,
        });
      }

      overloadSpan.end();
    }
  } else {
    if (overloadDetected) {
      // Recovery
      overloadDetected = false;
      
      const recoverySpan = tracer.startSpan('overload.recovery', {
        kind: SpanKind.INTERNAL,
      });
      
      logger.info('[OverloadDetector] System recovered from overload');
      
      recoverySpan.end();
    }
  }

  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  return indicators;
}

// ============================================
// TREND ANALYSIS
// ============================================

export interface HealthTrend {
  eventLoopTrend: 'improving' | 'stable' | 'degrading';
  heapTrend: 'improving' | 'stable' | 'degrading';
  overallTrend: 'improving' | 'stable' | 'degrading';
}

/**
 * Analyze health trends over time
 */
export function analyzeHealthTrend(): HealthTrend | null {
  if (healthHistory.length < 10) return null;

  const recent = healthHistory.slice(-10);
  const older = healthHistory.slice(-20, -10);

  if (older.length === 0) return null;

  // Calculate averages
  const recentEventLoopAvg = recent.reduce((sum, h) => sum + h.eventLoopLagMs, 0) / recent.length;
  const olderEventLoopAvg = older.reduce((sum, h) => sum + h.eventLoopLagMs, 0) / older.length;

  const recentHeapAvg = recent.reduce((sum, h) => sum + h.heap.percent, 0) / recent.length;
  const olderHeapAvg = older.reduce((sum, h) => sum + h.heap.percent, 0) / older.length;

  // Determine trends
  const eventLoopTrend: 'improving' | 'stable' | 'degrading' = 
    recentEventLoopAvg < olderEventLoopAvg * 0.9 ? 'improving' :
    recentEventLoopAvg > olderEventLoopAvg * 1.1 ? 'degrading' : 'stable';

  const heapTrend: 'improving' | 'stable' | 'degrading' = 
    recentHeapAvg < olderHeapAvg * 0.95 ? 'improving' :
    recentHeapAvg > olderHeapAvg * 1.05 ? 'degrading' : 'stable';

  const overallTrend: 'improving' | 'stable' | 'degrading' = 
    (eventLoopTrend === 'improving' && heapTrend === 'improving') ? 'improving' :
    (eventLoopTrend === 'degrading' || heapTrend === 'degrading') ? 'degrading' : 'stable';

  return {
    eventLoopTrend,
    heapTrend,
    overallTrend,
  };
}

// ============================================
// MONITORING LOOP
// ============================================

export function startOverloadMonitor(intervalMs: number = 2000): void {
  if (healthCheckInterval) return;

  logger.info(`[OverloadDetector] Starting monitor (interval: ${intervalMs}ms)`);

  healthCheckInterval = setInterval(async () => {
    await detectOverload();
  }, intervalMs);
}

export function stopOverloadMonitor(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    logger.info('[OverloadDetector] Monitor stopped');
  }
}

// ============================================
// HEALTH & METRICS
// ============================================

export function getOverloadHealth(): {
  lastSnapshot: SystemHealthSnapshot | null;
  isOverloaded: boolean;
  historySize: number;
  trend: HealthTrend | null;
} {
  return {
    lastSnapshot: lastHealthCheck,
    isOverloaded: overloadDetected,
    historySize: healthHistory.length,
    trend: analyzeHealthTrend(),
  };
}

export function getLastHealthSnapshot(): SystemHealthSnapshot | null {
  return lastHealthCheck;
}

export function isCurrentlyOverloaded(): boolean {
  return overloadDetected;
}

// ============================================
// RESET
// ============================================

export function resetOverloadMetrics(): void {
  healthHistory.length = 0;
  lastHealthCheck = null;
  overloadDetected = false;
  
  logger.info('[OverloadDetector] Metrics reset');
}

export { lastHealthCheck, overloadDetected, healthHistory };
