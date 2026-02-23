/**
 * Adaptive Intelligence Layer - Barrel Export
 * 
 * Central export point for all adaptive protection services.
 */

// Configuration
export {
  SLO_TARGETS,
  RATE_LIMIT_TIERS,
  LOAD_SHEDDING_CONFIG,
  PRIORITY_CONFIGS,
  BROWNOUT_FEATURES,
  CIRCUIT_ADAPTIVE_CONFIG,
  AUTO_RECOVERY_CONFIG,
  KAFKA_ADAPTIVE_CONFIG,
  OVERLOAD_THRESHOLDS,
  METRIC_WINDOWS,
  updateRuntimeConfig,
  getRuntimeConfig,
  resetToDefaults,
  type SLODefinition,
  type RateLimitTier,
  type LoadSheddingConfig,
  type PriorityConfig,
  type BrownoutFeature,
  type CircuitAdaptiveConfig,
  type AutoRecoveryConfig,
  type KafkaAdaptiveConfig,
  type OverloadThresholds,
  type MetricWindowConfig,
  type UserTier,
  type RequestPriority,
  type OverloadState,
} from './adaptive-config';

// Rate Limiter
export {
  checkTokenBucket,
  checkSlidingWindow,
  checkAllRateLimits,
  buildRateLimitHeaders,
  checkServiceRateLimit,
  determineUserTier,
  getTierConfig,
  recordRateLimitMetric,
  getRateLimitMetrics,
  resetRateLimitMetrics,
  shutdownRateLimiter,
  redis,
  type RateLimitResult,
} from './rate-limiter.service';

// Load Shedding
export {
  collectSystemMetrics,
  recordEventLoopLag,
  determineOverloadState,
  updateOverloadState,
  shouldShedRequest,
  incrementConnection,
  decrementConnection,
  getConnectionCount,
  startLoadSheddingMonitor,
  stopLoadSheddingMonitor,
  getLoadSheddingHealth,
  getCurrentOverloadState,
  getEffectivePriorityWeight,
  type ShedDecision,
} from './load-shedding.service';

// SLO Guard
export {
  recordLatency,
  recordRequestOutcome,
  getP95Latency,
  getP99Latency,
  checkSLOs,
  startSLOMonitor,
  stopSLOMonitor,
  getSLOHealth,
  getCurrentSLOStatus,
  isSLOHealthy,
  resetSLOMetrics,
} from './slo-guard.service';

// Overload Detector
export {
  getHeapMetrics,
  captureHealthSnapshot,
  detectOverload,
  analyzeHealthTrend,
  startOverloadMonitor,
  stopOverloadMonitor,
  getOverloadHealth,
  getLastHealthSnapshot,
  isCurrentlyOverloaded,
  resetOverloadMetrics,
  type OverloadIndicators,
  type HealthTrend,
} from './overload-detector.service';

// Brownout
export {
  initializeBrownoutFeatures,
  isFeatureEnabled,
  checkFeature,
  applyBrownout,
  manuallyDisableFeature,
  manuallyEnableFeature,
  registerFeature,
  getBrownoutHealth,
  getFeatureStates,
  shutdownBrownout,
} from './brownout.service';
