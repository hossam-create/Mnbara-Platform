/**
 * Predictive Load Service
 * 
 * Time series forecasting for load prediction using multiple algorithms:
 * - Simple Exponential Moving Average (EMA) - Fast, low CPU
 * - Holt-Winters - Trend + seasonality
 * - ARIMA simulation - Pattern recognition
 * - Prophet simulation - Business seasonality
 * 
 * Predicts load 30-120 seconds in advance based on historical metrics.
 */

import { 
  trace, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import { logger } from '../middleware/correlation-logger.middleware';
import { 
  ML_PREDICTION_CONFIG, 
  METRICS_COLLECTION_CONFIG,
  PREDICTIVE_SERVICES,
  type MLAlgorithm,
} from './predictive-config';

// ============================================
// TYPES
// ============================================

export interface MetricDataPoint {
  timestamp: number;
  value: number;
  service: string;
  metricType: string;
}

export interface PredictionResult {
  timestamp: number;                  // When prediction is for
  predictedValue: number;             // Predicted load/metric value
  confidence: number;                 // 0-1 confidence score
  algorithm: MLAlgorithm;
  trend: 'increasing' | 'decreasing' | 'stable';
  volatility: number;                 // Predicted volatility
  upperBound: number;                 // Upper confidence bound
  lowerBound: number;                 // Lower confidence bound
}

export interface ServicePrediction {
  service: string;
  predictions: PredictionResult[];
  currentLoad: number;
  predictedLoad: number;
  confidence: number;
  recommendation: ScalingRecommendation;
}

export type ScalingRecommendation = 
  | 'scale_up_immediately'
  | 'scale_up_soon'
  | 'scale_down'
  | 'maintain'
  | 'activate_brownout'
  | 'unknown';

// ============================================
// METRICS STORAGE
// ============================================

// In-memory time series storage (production: use Redis/TimescaleDB)
const metricsHistory: Map<string, MetricDataPoint[]> = new Map();
const predictionsCache: Map<string, PredictionResult> = new Map();

// Tracer
const tracer = trace.getTracer('predictive-load');

// Update intervals
let predictionInterval: NodeJS.Timeout | null = null;
let metricsInterval: NodeJS.Timeout | null = null;

// ============================================
// METRICS COLLECTION
// ============================================

/**
 * Collect current system metrics
 */
export async function collectMetrics(): Promise<void> {
  const span = tracer.startSpan('predictive.collect_metrics', {
    kind: SpanKind.INTERNAL,
  });

  const now = Date.now();
  const services = PREDICTIVE_SERVICES;

  // Collect system metrics (simulate real collection)
  for (const service of services) {
    // CPU usage (0-100)
    const cpuUsage = getSimulatedMetric(service, 'cpu', now);
    storeMetric(service, 'cpu', cpuUsage, now);

    // Memory usage (0-100)
    const memoryUsage = getSimulatedMetric(service, 'memory', now);
    storeMetric(service, 'memory', memoryUsage, now);

    // Request rate (requests/sec)
    const requestRate = getSimulatedMetric(service, 'request_rate', now);
    storeMetric(service, 'request_rate', requestRate, now);

    // Error rate (0-100%)
    const errorRate = getSimulatedMetric(service, 'error_rate', now);
    storeMetric(service, 'error_rate', errorRate, now);

    // Latency P95 (ms)
    const latencyP95 = getSimulatedMetric(service, 'latency_p95', now);
    storeMetric(service, 'latency_p95', latencyP95, now);

    // Latency P99 (ms)
    const latencyP99 = getSimulatedMetric(service, 'latency_p99', now);
    storeMetric(service, 'latency_p99', latencyP99, now);
  }

  // Clean old data
  cleanupOldMetrics();

  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
}

/**
 * Store metric in history
 */
function storeMetric(service: string, metricType: string, value: number, timestamp: number): void {
  const key = `${service}:${metricType}`;
  
  if (!metricsHistory.has(key)) {
    metricsHistory.set(key, []);
  }

  const history = metricsHistory.get(key)!;
  history.push({ timestamp, value, service, metricType });

  // Keep within retention limit
  const retentionMs = METRICS_COLLECTION_CONFIG.retentionPeriodMs;
  const cutoff = timestamp - retentionMs;
  
  while (history.length > 0 && history[0].timestamp < cutoff) {
    history.shift();
  }
}

/**
 * Get metric history for a service
 */
export function getMetricHistory(
  service: string, 
  metricType: string, 
  windowMs?: number
): MetricDataPoint[] {
  const key = `${service}:${metricType}`;
  const history = metricsHistory.get(key) || [];
  
  if (!windowMs) return [...history];
  
  const cutoff = Date.now() - windowMs;
  return history.filter(p => p.timestamp >= cutoff);
}

/**
 * Cleanup old metrics beyond retention period
 */
function cleanupOldMetrics(): void {
  const now = Date.now();
  const retentionMs = METRICS_COLLECTION_CONFIG.retentionPeriodMs;
  const cutoff = now - retentionMs;

  for (const [key, history] of metricsHistory) {
    const filtered = history.filter(p => p.timestamp >= cutoff);
    if (filtered.length !== history.length) {
      metricsHistory.set(key, filtered);
    }
  }
}

// ============================================
// SIMULATED METRICS (Replace with real metrics in production)
// ============================================

function getSimulatedMetric(service: string, metricType: string, timestamp: number): number {
  // Base values per service
  const baseValues: Record<string, Record<string, number>> = {
    'api-gateway': { cpu: 45, memory: 60, request_rate: 150, error_rate: 1, latency_p95: 120, latency_p99: 200 },
    'wallet-service': { cpu: 40, memory: 55, request_rate: 80, error_rate: 0.5, latency_p95: 80, latency_p99: 150 },
    'traveler-service': { cpu: 35, memory: 50, request_rate: 60, error_rate: 1.5, latency_p95: 100, latency_p99: 180 },
    'marketplace-service': { cpu: 50, memory: 65, request_rate: 100, error_rate: 2, latency_p95: 150, latency_p99: 250 },
    'notification-service': { cpu: 30, memory: 40, request_rate: 200, error_rate: 0.2, latency_p95: 50, latency_p99: 100 },
  };

  const base = baseValues[service]?.[metricType] || 50;
  
  // Add time-based patterns (business hours simulation)
  const hour = new Date(timestamp).getHours();
  const isBusinessHours = hour >= 9 && hour <= 18;
  const businessMultiplier = isBusinessHours ? 1.3 : 0.6;
  
  // Add noise and trends
  const noise = (Math.random() - 0.5) * 0.2; // ±10% noise
  const trend = Math.sin(timestamp / 100000) * 0.1; // Slow oscillation
  
  let value = base * businessMultiplier * (1 + noise + trend);
  
  // Apply metric-specific limits
  switch (metricType) {
    case 'cpu':
    case 'memory':
    case 'error_rate':
      value = Math.min(100, Math.max(0, value));
      break;
    case 'request_rate':
      value = Math.max(0, value);
      break;
    case 'latency_p95':
    case 'latency_p99':
      value = Math.max(10, value);
      break;
  }
  
  return Math.round(value * 100) / 100;
}

// ============================================
// PREDICTION ALGORITHMS
// ============================================

/**
 * Simple Exponential Moving Average (EMA) - Fast and effective
 */
function predictEMA(
  data: MetricDataPoint[], 
  horizonMs: number
): PredictionResult | null {
  if (data.length < 5) return null;

  const alpha = 0.3; // Smoothing factor
  const values = data.map(d => d.value);
  
  // Calculate EMA
  let ema = values[0];
  for (let i = 1; i < values.length; i++) {
    ema = alpha * values[i] + (1 - alpha) * ema;
  }

  // Calculate trend
  const recent = values.slice(-5);
  const older = values.slice(-10, -5);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  const trendChange = (recentAvg - olderAvg) / olderAvg;
  
  if (trendChange > 0.1) trend = 'increasing';
  else if (trendChange < -0.1) trend = 'decreasing';

  // Predict forward
  const prediction = ema * (1 + trendChange * (horizonMs / 60000));
  
  // Calculate volatility (standard deviation)
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const volatility = Math.sqrt(variance);
  
  // Confidence based on data quality and volatility
  const confidence = Math.min(0.95, 0.5 + (data.length / 100) - (volatility / mean) * 0.3);
  
  // Confidence bounds
  const margin = volatility * 2;

  return {
    timestamp: Date.now() + horizonMs,
    predictedValue: Math.round(prediction * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    algorithm: 'simple-ema',
    trend,
    volatility: Math.round(volatility * 100) / 100,
    upperBound: Math.round((prediction + margin) * 100) / 100,
    lowerBound: Math.round(Math.max(0, prediction - margin) * 100) / 100,
  };
}

/**
 * Holt-Winters simulation (trend + seasonality)
 */
function predictHoltWinters(
  data: MetricDataPoint[], 
  horizonMs: number
): PredictionResult | null {
  if (data.length < 20) return null;

  const values = data.map(d => d.value);
  const alpha = 0.3; // Level smoothing
  const beta = 0.1;  // Trend smoothing
  
  // Initialize
  let level = values[0];
  let trend = values[1] - values[0];
  
  // Apply Holt's method
  for (let i = 1; i < values.length; i++) {
    const prevLevel = level;
    level = alpha * values[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  // Forecast
  const periodsAhead = Math.ceil(horizonMs / METRICS_COLLECTION_CONFIG.sampleIntervalMs);
  const prediction = level + trend * periodsAhead;

  // Calculate volatility
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const volatility = Math.sqrt(variance);
  
  // Determine trend direction
  let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (trend > mean * 0.05) trendDirection = 'increasing';
  else if (trend < -mean * 0.05) trendDirection = 'decreasing';

  const confidence = Math.min(0.9, 0.6 + (data.length / 200));
  const margin = volatility * 2.5;

  return {
    timestamp: Date.now() + horizonMs,
    predictedValue: Math.round(prediction * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    algorithm: 'holt-winters',
    trend: trendDirection,
    volatility: Math.round(volatility * 100) / 100,
    upperBound: Math.round((prediction + margin) * 100) / 100,
    lowerBound: Math.round(Math.max(0, prediction - margin) * 100) / 100,
  };
}

/**
 * ARIMA-like simulation (pattern recognition)
 */
function predictARIMA(
  data: MetricDataPoint[], 
  horizonMs: number
): PredictionResult | null {
  // Simplified ARIMA(1,1,1) simulation
  if (data.length < 30) return null;

  const values = data.map(d => d.value);
  const n = values.length;
  
  // Calculate differences (I=1)
  const diffs = [];
  for (let i = 1; i < values.length; i++) {
    diffs.push(values[i] - values[i-1]);
  }
  
  // AR(1) coefficient estimation
  let arCoeff = 0;
  if (diffs.length > 1) {
    let numerator = 0;
    let denominator = 0;
    for (let i = 1; i < diffs.length; i++) {
      numerator += diffs[i] * diffs[i-1];
      denominator += diffs[i-1] * diffs[i-1];
    }
    arCoeff = denominator > 0 ? numerator / denominator : 0;
  }
  arCoeff = Math.max(-0.9, Math.min(0.9, arCoeff)); // Bound AR coefficient

  // MA(1) coefficient (simplified)
  const maCoeff = 0.3;
  
  // Forecast
  const lastValue = values[values.length - 1];
  const lastDiff = diffs[diffs.length - 1];
  const forecastDiff = arCoeff * lastDiff + maCoeff * lastDiff;
  const prediction = lastValue + forecastDiff;

  // Calculate volatility
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = diffs.reduce((sum, d) => sum + d * d, 0) / diffs.length;
  const volatility = Math.sqrt(variance);
  
  // Determine trend
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  const recentAvg = values.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const olderAvg = values.slice(-15, -10).reduce((a, b) => a + b, 0) / 5;
  
  if (recentAvg > olderAvg * 1.1) trend = 'increasing';
  else if (recentAvg < olderAvg * 0.9) trend = 'decreasing';

  const confidence = Math.min(0.85, 0.55 + (data.length / 300));
  const margin = volatility * 3;

  return {
    timestamp: Date.now() + horizonMs,
    predictedValue: Math.round(prediction * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    algorithm: 'arima',
    trend,
    volatility: Math.round(volatility * 100) / 100,
    upperBound: Math.round((prediction + margin) * 100) / 100,
    lowerBound: Math.round(Math.max(0, prediction - margin) * 100) / 100,
  };
}

// ============================================
// MAIN PREDICTION FUNCTION
// ============================================

/**
 * Predict load for a specific service and metric
 */
export function predictLoad(
  service: string,
  metricType: string,
  algorithm: MLAlgorithm = ML_PREDICTION_CONFIG.algorithm,
  horizonMs: number = ML_PREDICTION_CONFIG.predictionHorizonMs
): PredictionResult | null {
  const span = tracer.startSpan('predictive.predict_load', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'predictive.service': service,
      'predictive.metric_type': metricType,
      'predictive.algorithm': algorithm,
      'predictive.horizon_ms': horizonMs,
    },
  });

  // Get historical data
  const historyWindowMs = ML_PREDICTION_CONFIG.historyWindowMs;
  const data = getMetricHistory(service, metricType, historyWindowMs);
  
  if (data.length < 5) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: 'Insufficient data' });
    span.end();
    return null;
  }

  // Select and run algorithm
  let result: PredictionResult | null = null;
  
  switch (algorithm) {
    case 'simple-ema':
      result = predictEMA(data, horizonMs);
      break;
    case 'holt-winters':
      result = predictHoltWinters(data, horizonMs);
      break;
    case 'arima':
      result = predictARIMA(data, horizonMs);
      break;
    case 'prophet':
      // Prophet simulation - use Holt-Winters with business seasonality
      result = predictHoltWinters(data, horizonMs);
      break;
    default:
      result = predictEMA(data, horizonMs);
  }

  if (result) {
    // Cache prediction
    const cacheKey = `${service}:${metricType}:${algorithm}`;
    predictionsCache.set(cacheKey, result);
    
    span.setAttributes({
      'predictive.result.confidence': result.confidence,
      'predictive.result.predicted_value': result.predictedValue,
      'predictive.result.trend': result.trend,
    });
  }

  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  return result;
}

/**
 * Predict all metrics for a service
 */
export function predictServiceLoad(service: string): ServicePrediction {
  const span = tracer.startSpan('predictive.predict_service', {
    kind: SpanKind.INTERNAL,
    attributes: { 'predictive.service': service },
  });

  const metricTypes = ['cpu', 'memory', 'request_rate', 'error_rate', 'latency_p95'];
  const predictions: PredictionResult[] = [];

  for (const metricType of metricTypes) {
    const prediction = predictLoad(service, metricType);
    if (prediction) {
      predictions.push(prediction);
    }
  }

  // Calculate overall load (weighted average)
  const currentLoad = calculateCompositeLoad(service);
  
  // Get predicted load for key metrics
  const cpuPrediction = predictions.find(p => p.algorithm === ML_PREDICTION_CONFIG.algorithm) || predictions[0];
  const predictedLoad = cpuPrediction?.predictedValue || currentLoad;
  const confidence = cpuPrediction?.confidence || 0.5;

  // Generate recommendation
  const recommendation = generateScalingRecommendation(predictedLoad, currentLoad, confidence);

  const result: ServicePrediction = {
    service,
    predictions,
    currentLoad,
    predictedLoad,
    confidence,
    recommendation,
  };

  span.setAttributes({
    'predictive.current_load': currentLoad,
    'predictive.predicted_load': predictedLoad,
    'predictive.confidence': confidence,
    'predictive.recommendation': recommendation,
  });
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  return result;
}

/**
 * Predict load for all services
 */
export function predictAllServices(): ServicePrediction[] {
  const span = tracer.startSpan('predictive.predict_all', {
    kind: SpanKind.INTERNAL,
  });

  const results = PREDICTIVE_SERVICES.map(service => predictServiceLoad(service));

  span.setAttribute('predictive.services_count', results.length);
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  return results;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate composite load score (0-100)
 */
function calculateCompositeLoad(service: string): number {
  const cpu = getLastMetricValue(service, 'cpu') || 50;
  const memory = getLastMetricValue(service, 'memory') || 50;
  const requestRate = getLastMetricValue(service, 'request_rate') || 100;
  const errorRate = getLastMetricValue(service, 'error_rate') || 1;
  
  // Normalize request rate (assume max 500 req/s)
  const normalizedRequestRate = Math.min(100, (requestRate / 500) * 100);
  
  // Error rate penalty
  const errorPenalty = errorRate * 5; // 1% error = 5 points penalty
  
  // Weighted composite
  const load = (
    cpu * 0.35 +
    memory * 0.25 +
    normalizedRequestRate * 0.25 +
    errorPenalty * 0.15
  );
  
  return Math.min(100, Math.max(0, load));
}

/**
 * Get last metric value
 */
export function getLastMetricValue(service: string, metricType: string): number | null {
  const history = getMetricHistory(service, metricType);
  if (history.length === 0) return null;
  return history[history.length - 1].value;
}

/**
 * Generate scaling recommendation
 */
function generateScalingRecommendation(
  predictedLoad: number,
  currentLoad: number,
  confidence: number
): ScalingRecommendation {
  if (confidence < 0.6) return 'unknown';
  
  const loadChange = predictedLoad - currentLoad;
  const changePercent = (loadChange / currentLoad) * 100;
  
  if (predictedLoad > 90) return 'scale_up_immediately';
  if (predictedLoad > 75 && changePercent > 20) return 'scale_up_soon';
  if (predictedLoad > 80) return 'activate_brownout';
  if (predictedLoad < 30 && currentLoad < 40) return 'scale_down';
  
  return 'maintain';
}

// ============================================
// SERVICE MONITORING
// ============================================

/**
 * Start predictive monitoring
 */
export function startPredictiveMonitoring(): void {
  if (predictionInterval || metricsInterval) {
    logger.warn('[PredictiveLoad] Monitoring already running');
    return;
  }

  logger.info('[PredictiveLoad] Starting predictive monitoring');

  // Collect metrics periodically
  metricsInterval = setInterval(() => {
    collectMetrics().catch(err => {
      logger.error('[PredictiveLoad] Metrics collection error:', err);
    });
  }, METRICS_COLLECTION_CONFIG.sampleIntervalMs);

  // Generate predictions periodically
  predictionInterval = setInterval(() => {
    predictAllServices();
  }, ML_PREDICTION_CONFIG.updateIntervalMs);

  // Initial collection
  collectMetrics().catch(err => {
    logger.error('[PredictiveLoad] Initial metrics collection error:', err);
  });
}

/**
 * Stop predictive monitoring
 */
export function stopPredictiveMonitoring(): void {
  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
  }
  
  if (predictionInterval) {
    clearInterval(predictionInterval);
    predictionInterval = null;
  }

  logger.info('[PredictiveLoad] Monitoring stopped');
}

// ============================================
// HEALTH & METRICS
// ============================================

export function getPredictiveLoadHealth(): {
  isRunning: boolean;
  servicesMonitored: number;
  metricsHistorySize: number;
  predictionsCached: number;
  latestPredictions: ServicePrediction[];
} {
  return {
    isRunning: predictionInterval !== null,
    servicesMonitored: PREDICTIVE_SERVICES.length,
    metricsHistorySize: Array.from(metricsHistory.values()).reduce((sum, h) => sum + h.length, 0),
    predictionsCached: predictionsCache.size,
    latestPredictions: PREDICTIVE_SERVICES.map(s => predictServiceLoad(s)),
  };
}

export function getPredictionsForService(service: string): PredictionResult[] {
  const predictions: PredictionResult[] = [];
  const metricTypes = ['cpu', 'memory', 'request_rate', 'error_rate', 'latency_p95'];
  
  for (const metricType of metricTypes) {
    const cacheKey = `${service}:${metricType}:${ML_PREDICTION_CONFIG.algorithm}`;
    const cached = predictionsCache.get(cacheKey);
    if (cached) {
      predictions.push(cached);
    }
  }
  
  return predictions;
}

// ============================================
// RESET
// ============================================

export function resetPredictiveLoadMetrics(): void {
  metricsHistory.clear();
  predictionsCache.clear();
  logger.info('[PredictiveLoad] Metrics and predictions reset');
}

export { metricsHistory, predictionsCache };
