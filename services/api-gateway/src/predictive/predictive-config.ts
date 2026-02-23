/**
 * Predictive Configuration
 * 
 * Configuration for ML-based prediction, auto-scaling, and self-driving behavior.
 * 
 * Components:
 * - Time series forecasting configuration (ARIMA/Prophet/LSTM)
 * - Auto-scaling thresholds and policies
 * - Anomaly detection parameters
 * - Self-optimization settings
 */

// ============================================
// ML PREDICTION CONFIGURATION
// ============================================

export type MLAlgorithm = 'arima' | 'prophet' | 'simple-ema' | 'holt-winters';

export interface MLPredictionConfig {
  algorithm: MLAlgorithm;
  historyWindowMs: number;          // How much history to use for prediction
  predictionHorizonMs: number;      // How far ahead to predict (30-120s)
  updateIntervalMs: number;         // How often to update predictions
  confidenceThreshold: number;        // Minimum confidence for acting on prediction
  seasonalityPeriods?: number[];      // For algorithms that support seasonality
}

export const ML_PREDICTION_CONFIG: MLPredictionConfig = {
  algorithm: 'simple-ema',           // Default to simple EMA for performance
  historyWindowMs: 5 * 60 * 1000,    // 5 minutes of history
  predictionHorizonMs: 60 * 1000,    // 60 seconds ahead (configurable: 30-120s)
  updateIntervalMs: 5000,            // Update every 5 seconds
  confidenceThreshold: 0.75,         // 75% confidence required
  seasonalityPeriods: [],           // Custom seasonality for business patterns
};

// ============================================
// METRICS COLLECTION CONFIG
// ============================================

export interface MetricsCollectionConfig {
  retentionPeriodMs: number;        // How long to keep metrics history
  sampleIntervalMs: number;           // How often to sample metrics
  metrics: string[];                  // Which metrics to collect
  perService: boolean;                // Collect per-service metrics
  aggregationWindowMs: number;        // Aggregation window for metric windows
}

export const METRICS_COLLECTION_CONFIG: MetricsCollectionConfig = {
  retentionPeriodMs: 10 * 60 * 1000,  // 10 minutes retention
  sampleIntervalMs: 1000,             // Sample every second
  metrics: [
    'cpu',
    'memory',
    'request_rate',
    'error_rate',
    'latency_p95',
    'latency_p99',
    'concurrent_requests',
    'queue_depth',
    'circuit_breaker_state',
  ],
  perService: true,
  aggregationWindowMs: 5000,          // 5-second aggregation windows
};

// ============================================
// AUTO-SCALING CONFIGURATION
// ============================================

export type ScalingStrategy = 'reactive' | 'predictive' | 'hybrid';

export interface AutoScalingConfig {
  enabled: boolean;
  strategy: ScalingStrategy;
  minReplicas: number;
  maxReplicas: number;
  scaleUpThreshold: number;           // CPU/Memory threshold for scaling up
  scaleDownThreshold: number;         // CPU/Memory threshold for scaling down
  scaleUpCooldownMs: number;          // Minimum time between scale-ups
  scaleDownCooldownMs: number;        // Minimum time between scale-downs
  scaleUpStep: number;                // How many replicas to add
  scaleDownStep: number;              // How many replicas to remove
  predictiveLeadTimeMs: number;       // How early to predict before scaling
  targetUtilization: number;          // Target CPU/Memory utilization (0-100)
  stabilizationWindowMs: number;      // Time to wait before confirming scaling
}

export const AUTO_SCALING_CONFIG: AutoScalingConfig = {
  enabled: true,
  strategy: 'hybrid',                 // Use both reactive and predictive
  minReplicas: 2,
  maxReplicas: 20,
  scaleUpThreshold: 70,               // Scale up at 70% utilization
  scaleDownThreshold: 30,             // Scale down at 30% utilization
  scaleUpCooldownMs: 60 * 1000,       // 1 minute between scale-ups
  scaleDownCooldownMs: 5 * 60 * 1000, // 5 minutes between scale-downs
  scaleUpStep: 2,                     // Add 2 replicas at a time
  scaleDownStep: 1,                   // Remove 1 replica at a time
  predictiveLeadTimeMs: 60 * 1000,    // Predict 60s before scaling
  targetUtilization: 60,              // Target 60% utilization
  stabilizationWindowMs: 30 * 1000,   // 30s stabilization
};

// ============================================
// ANOMALY DETECTION CONFIGURATION
// ============================================

export interface AnomalyDetectionConfig {
  enabled: boolean;
  algorithms: string[];               // zscore, iqr, isolation_forest (simulated)
  sensitivity: number;                // 0-1, higher = more sensitive
  detectionWindowMs: number;          // Window for anomaly detection
  minDataPoints: number;              // Minimum data points required
  autoHealEnabled: boolean;           // Automatically trigger healing
  autoHealActions: AutoHealAction[];
  anomalyScoreThreshold: number;      // Score above which triggers action
}

export type AutoHealAction = 
  | 'retry'
  | 'circuit_breaker'
  | 'bulkhead_isolate'
  | 'brownout_activate'
  | 'scale_up'
  | 'restart_service';

export const ANOMALY_DETECTION_CONFIG: AnomalyDetectionConfig = {
  enabled: true,
  algorithms: ['zscore', 'iqr'],
  sensitivity: 0.8,                   // High sensitivity
  detectionWindowMs: 30 * 1000,       // 30 second window
  minDataPoints: 10,
  autoHealEnabled: true,
  autoHealActions: [
    'retry',
    'circuit_breaker',
    'brownout_activate',
    'scale_up',
  ],
  anomalyScoreThreshold: 0.85,      // Trigger at 85% anomaly confidence
};

// ============================================
// PREDICTIVE BULKHEAD CONFIGURATION
// ============================================

export interface PredictiveBulkheadConfig {
  enabled: boolean;
  adjustmentIntervalMs: number;
  adjustmentThreshold: number;        // Minimum predicted load change to act
  maxConcurrencyRange: { min: number; max: number };
  queueSizeRange: { min: number; max: number };
  loadToConcurrencyRatio: number;     // How much load affects concurrency
  loadToQueueRatio: number;         // How much load affects queue size
}

export const PREDICTIVE_BULKHEAD_CONFIG: PredictiveBulkheadConfig = {
  enabled: true,
  adjustmentIntervalMs: 10 * 1000,    // Adjust every 10 seconds
  adjustmentThreshold: 20,            // 20% load change threshold
  maxConcurrencyRange: { min: 5, max: 100 },
  queueSizeRange: { min: 10, max: 500 },
  loadToConcurrencyRatio: 0.5,        // 50% of load affects concurrency
  loadToQueueRatio: 0.3,              // 30% of load affects queue
};

// ============================================
// PREDICTIVE BROWNOUT CONFIGURATION
// ============================================

export interface PredictiveBrownoutConfig {
  enabled: boolean;
  activationThreshold: number;        // Predicted load that triggers brownout
  leadTimeMs: number;                 // How early to activate brownout
  deactivationThreshold: number;      // When to deactivate
  featuresToDisable: string[];        // Features to disable in order
  gradualActivation: boolean;         // Enable features gradually
  activationStepDelayMs: number;      // Delay between activation steps
}

export const PREDICTIVE_BROWNOUT_CONFIG: PredictiveBrownoutConfig = {
  enabled: true,
  activationThreshold: 80,            // Activate at 80% predicted load
  leadTimeMs: 30 * 1000,              // 30 seconds before expected load
  deactivationThreshold: 50,          // Deactivate below 50%
  featuresToDisable: [
    'recommendations',
    'analytics',
    'insights',
    'search_advanced',
    'image_processing',
  ],
  gradualActivation: true,
  activationStepDelayMs: 5000,        // 5 seconds between feature disables
};

// ============================================
// ADAPTIVE RETRY CONFIGURATION
// ============================================

export interface AdaptiveRetryConfig {
  enabled: boolean;
  baseDelayMs: number;
  maxDelayMs: number;
  usePredictedLatency: boolean;       // Use ML prediction for delays
  latencyMultiplier: number;          // Delay = latency * multiplier
  jitterEnabled: boolean;
  jitterRange: { min: number; max: number };
  dynamicBackoff: boolean;          // Adjust backoff based on trends
  trendAnalysisWindowMs: number;
}

export const ADAPTIVE_RETRY_CONFIG: AdaptiveRetryConfig = {
  enabled: true,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  usePredictedLatency: true,
  latencyMultiplier: 1.5,
  jitterEnabled: true,
  jitterRange: { min: 0.8, max: 1.2 },
  dynamicBackoff: true,
  trendAnalysisWindowMs: 60 * 1000,   // 1 minute trend window
};

// ============================================
// PREDICTIVE KAFKA CONFIGURATION
// ============================================

export interface PredictiveKafkaConfig {
  enabled: boolean;
  lagThreshold: number;               // Messages behind before throttling
  producerRateLimitRange: { min: number; max: number };
  pauseOnPrediction: boolean;         // Pause consumers on predicted spike
  pauseLeadTimeMs: number;
  resumeAfterMs: number;
  autoThrottle: boolean;
  throttleOnLagTrend: boolean;        // Throttle if lag increasing
}

export const PREDICTIVE_KAFKA_CONFIG: PredictiveKafkaConfig = {
  enabled: true,
  lagThreshold: 10000,                // 10k messages behind
  producerRateLimitRange: { min: 100, max: 10000 },
  pauseOnPrediction: true,
  pauseLeadTimeMs: 20 * 1000,         // Pause 20s before predicted spike
  resumeAfterMs: 60 * 1000,           // Resume after 60s
  autoThrottle: true,
  throttleOnLagTrend: true,
};

// ============================================
// SLO SELF-OPTIMIZATION CONFIGURATION
// ============================================

export interface SLOSelfOptimizationConfig {
  enabled: boolean;
  optimizationIntervalMs: number;
  adjustmentStep: number;             // How much to adjust per optimization
  maxAdjustment: number;                // Maximum total adjustment
  metrics: string[];                  // SLOs to auto-optimize
  learningRate: number;               // How fast to adapt (0-1)
  optimizationStrategy: 'gradient' | 'threshold' | 'heuristic';
}

export const SLO_SELF_OPTIMIZATION_CONFIG: SLOSelfOptimizationConfig = {
  enabled: true,
  optimizationIntervalMs: 5 * 60 * 1000, // 5 minutes
  adjustmentStep: 10,                   // 10% adjustment per step
  maxAdjustment: 50,                    // Max 50% adjustment
  metrics: [
    'latency_p95',
    'latency_p99',
    'error_rate',
    'circuit_breaker_threshold',
    'bulkhead_concurrency',
    'brownout_threshold',
  ],
  learningRate: 0.1,                    // Conservative learning
  optimizationStrategy: 'heuristic',    // Use heuristic approach
};

// ============================================
// RUNTIME CONFIGURATION UPDATES
// ============================================

let runtimeConfig = {
  ml: { ...ML_PREDICTION_CONFIG },
  metrics: { ...METRICS_COLLECTION_CONFIG },
  autoScaling: { ...AUTO_SCALING_CONFIG },
  anomalyDetection: { ...ANOMALY_DETECTION_CONFIG },
  bulkhead: { ...PREDICTIVE_BULKHEAD_CONFIG },
  brownout: { ...PREDICTIVE_BROWNOUT_CONFIG },
  retry: { ...ADAPTIVE_RETRY_CONFIG },
  kafka: { ...PREDICTIVE_KAFKA_CONFIG },
  slo: { ...SLO_SELF_OPTIMIZATION_CONFIG },
};

export function updatePredictiveConfig(updates: Partial<typeof runtimeConfig>): void {
  runtimeConfig = {
    ...runtimeConfig,
    ...updates,
    ml: { ...runtimeConfig.ml, ...(updates.ml || {}) },
    metrics: { ...runtimeConfig.metrics, ...(updates.metrics || {}) },
    autoScaling: { ...runtimeConfig.autoScaling, ...(updates.autoScaling || {}) },
    anomalyDetection: { ...runtimeConfig.anomalyDetection, ...(updates.anomalyDetection || {}) },
    bulkhead: { ...runtimeConfig.bulkhead, ...(updates.bulkhead || {}) },
    brownout: { ...runtimeConfig.brownout, ...(updates.brownout || {}) },
    retry: { ...runtimeConfig.retry, ...(updates.retry || {}) },
    kafka: { ...runtimeConfig.kafka, ...(updates.kafka || {}) },
    slo: { ...runtimeConfig.slo, ...(updates.slo || {}) },
  };
}

export function getPredictiveConfig(): typeof runtimeConfig {
  return { ...runtimeConfig };
}

export function resetPredictiveConfig(): void {
  runtimeConfig = {
    ml: { ...ML_PREDICTION_CONFIG },
    metrics: { ...METRICS_COLLECTION_CONFIG },
    autoScaling: { ...AUTO_SCALING_CONFIG },
    anomalyDetection: { ...ANOMALY_DETECTION_CONFIG },
    bulkhead: { ...PREDICTIVE_BULKHEAD_CONFIG },
    brownout: { ...PREDICTIVE_BROWNOUT_CONFIG },
    retry: { ...ADAPTIVE_RETRY_CONFIG },
    kafka: { ...PREDICTIVE_KAFKA_CONFIG },
    slo: { ...SLO_SELF_OPTIMIZATION_CONFIG },
  };
}

// ============================================
// SERVICE REGISTRY
// ============================================

export const PREDICTIVE_SERVICES = [
  'api-gateway',
  'wallet-service',
  'traveler-service',
  'marketplace-service',
  'notification-service',
];

export const SERVICE_PRIORITIES: Record<string, number> = {
  'api-gateway': 100,
  'wallet-service': 95,
  'traveler-service': 80,
  'marketplace-service': 75,
  'notification-service': 60,
};
