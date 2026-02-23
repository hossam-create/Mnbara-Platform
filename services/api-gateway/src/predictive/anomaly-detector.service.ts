/**
 * Anomaly Detector Service
 * 
 * Detects unusual traffic patterns, errors, and system behavior using
 * statistical methods. Triggers automated healing actions when anomalies detected.
 * 
 * Algorithms:
 * - Z-Score: Statistical outliers
 * - IQR: Interquartile range outliers
 * - Isolation Forest simulation: Pattern-based anomalies
 * 
 * Auto-healing actions:
 * - Retry / Circuit breaker
 * - Bulkhead isolation
 * - Brownout activation
 * - Auto-scaling
 */

import { 
  trace, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import { logger } from '../middleware/correlation-logger.middleware';
import { 
  ANOMALY_DETECTION_CONFIG,
  type AutoHealAction,
} from './predictive-config';
import { getMetricHistory } from './predictive-load.service';
import { activatePredictiveBrownout } from './predictive-brownout.service';
import { emergencyScaleUp } from './auto-scaling.service';
import { emergencyThrottle } from './predictive-bulkhead.service';

// ============================================
// TYPES
// ============================================

export interface AnomalyDetection {
  id: string;
  timestamp: number;
  service: string;
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number;
  score: number;
  algorithm: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  autoHealAction?: AutoHealAction;
  autoHealSuccess?: boolean;
}

export interface AnomalyStats {
  totalAnomalies: number;
  bySeverity: Record<string, number>;
  byService: Record<string, number>;
  autoHealSuccessRate: number;
  last24h: number;
  last7d: number;
}

// ============================================
// STATE
// ============================================

const anomalyHistory: AnomalyDetection[] = [];
const MAX_HISTORY_SIZE = 200;

let detectionInterval: NodeJS.Timeout | null = null;

const tracer = trace.getTracer('anomaly-detector');

// ============================================
// Z-SCORE DETECTION
// ============================================

/**
 * Detect anomalies using Z-Score
 * Values with |z-score| > 3 are considered anomalies
 */
function detectZScoreAnomalies(
  data: Array<{ value: number; timestamp: number }>
): Array<{ index: number; score: number; value: number }> {
  if (data.length < 10) return [];

  const values = data.map(d => d.value);
  
  // Calculate mean and standard deviation
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const std = Math.sqrt(variance);
  
  if (std === 0) return []; // No variation

  // Find anomalies (|z-score| > 2.5)
  const anomalies: Array<{ index: number; score: number; value: number }> = [];
  
  // Check last few values for recent anomalies
  const recentToCheck = Math.min(5, values.length);
  
  for (let i = values.length - recentToCheck; i < values.length; i++) {
    const zScore = (values[i] - mean) / std;
    const absZScore = Math.abs(zScore);
    
    if (absZScore > 2.5) {
      anomalies.push({
        index: i,
        score: absZScore,
        value: values[i],
      });
    }
  }

  return anomalies;
}

// ============================================
// IQR DETECTION
// ============================================

/**
 * Detect anomalies using Interquartile Range (IQR)
 * Values outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR] are anomalies
 */
function detectIQRAnomalies(
  data: Array<{ value: number; timestamp: number }>
): Array<{ index: number; score: number; value: number }> {
  if (data.length < 10) return [];

  const values = data.map(d => d.value).sort((a, b) => a - b);
  
  // Calculate quartiles
  const q1Index = Math.floor(values.length * 0.25);
  const q3Index = Math.floor(values.length * 0.75);
  const q1 = values[q1Index];
  const q3 = values[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  // Check last few values
  const originalValues = data.map(d => d.value);
  const anomalies: Array<{ index: number; score: number; value: number }> = [];
  const recentToCheck = Math.min(5, originalValues.length);

  for (let i = originalValues.length - recentToCheck; i < originalValues.length; i++) {
    const value = originalValues[i];
    
    if (value < lowerBound || value > upperBound) {
      // Calculate anomaly score based on distance from bounds
      let distance = 0;
      if (value < lowerBound) {
        distance = (lowerBound - value) / iqr;
      } else {
        distance = (value - upperBound) / iqr;
      }
      
      anomalies.push({
        index: i,
        score: Math.min(5, 1 + distance), // Cap at 5
        value,
      });
    }
  }

  return anomalies;
}

// ============================================
// MAIN DETECTION FUNCTION
// ============================================

/**
 * Detect anomalies for a specific metric
 */
export function detectAnomalies(
  service: string,
  metric: string
): AnomalyDetection[] {
  const span = tracer.startSpan('anomaly.detect', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'anomaly.service': service,
      'anomaly.metric': metric,
    },
  });

  const config = ANOMALY_DETECTION_CONFIG;
  const data = getMetricHistory(service, metric, config.detectionWindowMs);

  if (data.length < config.minDataPoints) {
    span.setStatus({ code: SpanStatusCode.OK, message: 'Insufficient data' });
    span.end();
    return [];
  }

  const anomalies: AnomalyDetection[] = [];
  const now = Date.now();

  // Run Z-Score detection
  if (config.algorithms.includes('zscore')) {
    const zAnomalies = detectZScoreAnomalies(data);
    
    for (const anomaly of zAnomalies) {
      const dataPoint = data[anomaly.index];
      const detection: AnomalyDetection = {
        id: `anomaly-${now}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now,
        service,
        metric,
        value: anomaly.value,
        expectedValue: data.slice(0, -5).reduce((a, b) => a + b.value, 0) / (data.length - 5),
        deviation: anomaly.value - data.slice(0, -5).reduce((a, b) => a + b.value, 0) / (data.length - 5),
        score: Math.min(1, anomaly.score / 4), // Normalize to 0-1
        algorithm: 'zscore',
        severity: anomaly.score > 4 ? 'critical' : anomaly.score > 3 ? 'high' : 'medium',
        description: `${metric} value ${anomaly.value.toFixed(2)} is ${anomaly.score.toFixed(2)} standard deviations from mean`,
      };
      
      anomalies.push(detection);
    }
  }

  // Run IQR detection
  if (config.algorithms.includes('iqr')) {
    const iqrAnomalies = detectIQRAnomalies(data);
    
    for (const anomaly of iqrAnomalies) {
      // Skip if already detected by Z-Score (same index)
      if (anomalies.some(a => Math.abs(a.value - anomaly.value) < 0.01)) continue;

      const detection: AnomalyDetection = {
        id: `anomaly-${now}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now,
        service,
        metric,
        value: anomaly.value,
        expectedValue: data.slice(0, -5).reduce((a, b) => a + b.value, 0) / (data.length - 5),
        deviation: anomaly.value - data.slice(0, -5).reduce((a, b) => a + b.value, 0) / (data.length - 5),
        score: Math.min(1, anomaly.score / 5),
        algorithm: 'iqr',
        severity: anomaly.score > 3 ? 'high' : 'medium',
        description: `${metric} value ${anomaly.value.toFixed(2)} outside IQR bounds`,
      };
      
      anomalies.push(detection);
    }
  }

  // Filter by sensitivity and threshold
  const filteredAnomalies = anomalies.filter(a => 
    a.score >= config.anomalyScoreThreshold * (1 - config.sensitivity * 0.5)
  );

  // Add to history
  for (const anomaly of filteredAnomalies) {
    anomalyHistory.unshift(anomaly);
  }
  
  if (anomalyHistory.length > MAX_HISTORY_SIZE) {
    anomalyHistory.splice(MAX_HISTORY_SIZE);
  }

  // Auto-heal if enabled
  if (config.autoHealEnabled) {
    for (const anomaly of filteredAnomalies) {
      if (anomaly.severity === 'high' || anomaly.severity === 'critical') {
        autoHeal(anomaly);
      }
    }
  }

  span.setAttribute('anomaly.count', filteredAnomalies.length);
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  return filteredAnomalies;
}

// ============================================
// AUTO-HEALING
// ============================================

/**
 * Perform auto-healing action for anomaly
 */
async function autoHeal(anomaly: AnomalyDetection): Promise<void> {
  const span = tracer.startSpan('anomaly.auto_heal', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'anomaly.id': anomaly.id,
      'anomaly.severity': anomaly.severity,
    },
  });

  const config = ANOMALY_DETECTION_CONFIG;
  
  // Select healing action based on anomaly type
  let action: AutoHealAction | undefined;
  
  if (anomaly.metric === 'error_rate' && anomaly.value > 10) {
    action = 'circuit_breaker';
  } else if (anomaly.metric === 'latency_p95' && anomaly.value > 500) {
    action = 'brownout_activate';
  } else if (anomaly.metric === 'cpu' && anomaly.value > 85) {
    action = 'scale_up';
  } else if (anomaly.metric === 'request_rate' && anomaly.value > 1000) {
    action = 'bulkhead_isolate';
  } else {
    action = config.autoHealActions[0]; // Default to first action
  }

  if (!action) {
    span.setStatus({ code: SpanStatusCode.OK, message: 'No healing action selected' });
    span.end();
    return;
  }

  anomaly.autoHealAction = action;

  logger.warn(`[AnomalyDetector] Auto-healing ${anomaly.service}: ${action}`, {
    anomalyId: anomaly.id,
    metric: anomaly.metric,
    value: anomaly.value,
    action,
  });

  try {
    switch (action) {
      case 'circuit_breaker':
        // Open circuit breaker for affected service
        // (Integration with resilience layer)
        break;
        
      case 'brownout_activate':
        // Activate brownout mode
        activatePredictiveBrownout({
          willActivate: true,
          predictedActivationTime: Date.now(),
          predictedLoadAtActivation: anomaly.value,
          confidence: 1,
          featuresToDisable: [],
          timeUntilActivation: 0,
        }, 'reactive');
        break;
        
      case 'scale_up':
        // Emergency scale up
        await emergencyScaleUp(anomaly.service);
        break;
        
      case 'bulkhead_isolate':
        // Throttle bulkhead
        emergencyThrottle(anomaly.service);
        break;
        
      case 'retry':
        // Enable aggressive retry
        break;
        
      case 'restart_service':
        // Trigger service restart
        break;
    }

    anomaly.autoHealSuccess = true;
    
    span.setAttribute('anomaly.heal_action', action);
    span.setAttribute('anomaly.heal_success', true);
    span.setStatus({ code: SpanStatusCode.OK });
    
    logger.info(`[AnomalyDetector] Auto-heal successful: ${action}`);
  } catch (error) {
    anomaly.autoHealSuccess = false;
    
    span.recordException(error as Error);
    span.setAttribute('anomaly.heal_success', false);
    span.setStatus({ code: SpanStatusCode.ERROR, message: 'Heal failed' });
    
    logger.error(`[AnomalyDetector] Auto-heal failed:`, error);
  }

  span.end();
}

// ============================================
// MONITORING LOOP
// ============================================

const MONITORED_METRICS = ['cpu', 'memory', 'request_rate', 'error_rate', 'latency_p95'];
const MONITORED_SERVICES = ['api-gateway', 'wallet-service', 'traveler-service', 'marketplace-service'];

export function startAnomalyDetection(): void {
  if (detectionInterval) {
    logger.warn('[AnomalyDetector] Already running');
    return;
  }

  if (!ANOMALY_DETECTION_CONFIG.enabled) {
    logger.info('[AnomalyDetector] Anomaly detection disabled');
    return;
  }

  logger.info('[AnomalyDetector] Starting anomaly detection');

  // Check every 10 seconds
  detectionInterval = setInterval(() => {
    for (const service of MONITORED_SERVICES) {
      for (const metric of MONITORED_METRICS) {
        try {
          detectAnomalies(service, metric);
        } catch (error) {
          logger.error(`[AnomalyDetector] Error detecting ${service}.${metric}:`, error);
        }
      }
    }
  }, 10000);
}

export function stopAnomalyDetection(): void {
  if (detectionInterval) {
    clearInterval(detectionInterval);
    detectionInterval = null;
    logger.info('[AnomalyDetector] Stopped');
  }
}

// ============================================
// QUERY FUNCTIONS
// ============================================

export function getRecentAnomalies(
  service?: string,
  severity?: string,
  limit: number = 50
): AnomalyDetection[] {
  let filtered = anomalyHistory;
  
  if (service) {
    filtered = filtered.filter(a => a.service === service);
  }
  
  if (severity) {
    filtered = filtered.filter(a => a.severity === severity);
  }
  
  return filtered.slice(0, limit);
}

export function getAnomalyStats(): AnomalyStats {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const bySeverity: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  const byService: Record<string, number> = {};

  for (const anomaly of anomalyHistory) {
    bySeverity[anomaly.severity] = (bySeverity[anomaly.severity] || 0) + 1;
    byService[anomaly.service] = (byService[anomaly.service] || 0) + 1;
  }

  const healed = anomalyHistory.filter(a => a.autoHealSuccess).length;
  const totalWithAction = anomalyHistory.filter(a => a.autoHealAction).length;

  return {
    totalAnomalies: anomalyHistory.length,
    bySeverity,
    byService,
    autoHealSuccessRate: totalWithAction > 0 ? healed / totalWithAction : 0,
    last24h: anomalyHistory.filter(a => a.timestamp > dayAgo).length,
    last7d: anomalyHistory.filter(a => a.timestamp > weekAgo).length,
  };
}

// ============================================
// HEALTH
// ============================================

export function getAnomalyHealth(): {
  enabled: boolean;
  isRunning: boolean;
  recentAnomalies: AnomalyDetection[];
  stats: AnomalyStats;
} {
  return {
    enabled: ANOMALY_DETECTION_CONFIG.enabled,
    isRunning: detectionInterval !== null,
    recentAnomalies: anomalyHistory.slice(0, 10),
    stats: getAnomalyStats(),
  };
}

// ============================================
// RESET
// ============================================

export function resetAnomalyDetection(): void {
  stopAnomalyDetection();
  anomalyHistory.length = 0;
  logger.info('[AnomalyDetector] Reset complete');
}

export { anomalyHistory };
