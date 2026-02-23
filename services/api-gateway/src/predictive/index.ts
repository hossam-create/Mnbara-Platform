/**
 * Predictive Layer - Barrel Export
 * 
 * Central export point for all predictive/self-driving services.
 */

// Configuration
export {
  ML_PREDICTION_CONFIG,
  METRICS_COLLECTION_CONFIG,
  AUTO_SCALING_CONFIG,
  ANOMALY_DETECTION_CONFIG,
  PREDICTIVE_BULKHEAD_CONFIG,
  PREDICTIVE_BROWNOUT_CONFIG,
  ADAPTIVE_RETRY_CONFIG,
  PREDICTIVE_KAFKA_CONFIG,
  SLO_SELF_OPTIMIZATION_CONFIG,
  PREDICTIVE_SERVICES,
  SERVICE_PRIORITIES,
  updatePredictiveConfig,
  getPredictiveConfig,
  resetPredictiveConfig,
  type MLAlgorithm,
  type MLPredictionConfig,
  type AutoScalingConfig,
  type AnomalyDetectionConfig,
  type AutoHealAction,
  type PredictiveBulkheadConfig,
  type PredictiveBrownoutConfig,
  type AdaptiveRetryConfig,
  type PredictiveKafkaConfig,
  type SLOSelfOptimizationConfig,
  type ScalingStrategy,
} from './predictive-config';

// Predictive Load Service
export {
  collectMetrics,
  predictLoad,
  predictServiceLoad,
  predictAllServices,
  startPredictiveMonitoring,
  stopPredictiveMonitoring,
  getPredictiveLoadHealth,
  getMetricHistory,
  getPredictionsForService,
  resetPredictiveLoadMetrics,
  type MetricDataPoint,
  type PredictionResult,
  type ServicePrediction,
  type ScalingRecommendation,
} from './predictive-load.service';

// Auto-Scaling Service
export {
  initializeAutoScaling,
  makeScalingDecision,
  executeScaling,
  manualScale,
  emergencyScaleUp,
  startAutoScalingMonitor,
  stopAutoScalingMonitor,
  getAutoScalingHealth,
  getServiceScalingState,
  getScalingHistory,
  resetAutoScaling,
  type ScalingEvent,
  type ServiceScalingState,
  type ScalingDecision,
} from './auto-scaling.service';

// Predictive Bulkhead Service
export {
  initializePredictiveBulkhead,
  adjustBulkheadForService,
  adjustAllBulkheads,
  makeRoutingDecision,
  getBulkheadStatus,
  canProceedThroughBulkhead,
  startBulkheadMonitor,
  stopBulkheadMonitor,
  manualSetBulkhead,
  emergencyThrottle,
  getPredictiveBulkheadHealth,
  getServiceBulkheadSettings,
  getAdjustmentHistory,
  resetPredictiveBulkhead,
  type BulkheadSettings,
  type BulkheadAdjustment,
  type RoutingDecision,
} from './predictive-bulkhead.service';

// Predictive Brownout Service
export {
  initializePredictiveBrownout,
  predictBrownoutNeed,
  activatePredictiveBrownout,
  enableFeature,
  checkAndRecover,
  startPredictiveBrownoutMonitor,
  stopPredictiveBrownoutMonitor,
  manualActivateBrownout,
  manualDeactivateBrownout,
  isFeatureEnabled,
  getFeatureStatus,
  getActiveBrownoutFeatures,
  isBrownoutActive,
  getPredictiveBrownoutHealth,
  resetPredictiveBrownout,
  type PredictiveFeatureState,
  type BrownoutActivation,
  type BrownoutPrediction,
} from './predictive-brownout.service';

// Anomaly Detector Service
export {
  detectAnomalies,
  startAnomalyDetection,
  stopAnomalyDetection,
  getRecentAnomalies,
  getAnomalyStats,
  getAnomalyHealth,
  resetAnomalyDetection,
  type AnomalyDetection,
  type AnomalyStats,
} from './anomaly-detector.service';

// Adaptive Retry Service
export {
  initializeAdaptiveRetry,
  calculateRetryDelay,
  executeWithRetry,
  tuneRetryPolicies,
  startAdaptiveRetryMonitor,
  stopAdaptiveRetryMonitor,
  getRetryPolicy,
  getAllRetryPolicies,
  getRetryStats,
  getAdaptiveRetryHealth,
  resetAdaptiveRetry,
  type RetryPolicy,
  type RetryAttempt,
  type RetryStats,
} from './adaptive-retry.service';

// Predictive Kafka Service
export {
  initializePredictiveKafka,
  collectKafkaMetrics,
  checkAndApplyThrottling,
  checkConsumerPausing,
  resumeConsumer,
  manualPauseConsumer,
  startPredictiveKafkaMonitor,
  stopPredictiveKafkaMonitor,
  getKafkaTopicStatus,
  getConsumerStatus,
  isConsumerPaused,
  getProducerRateLimit,
  getPredictiveKafkaHealth,
  resetPredictiveKafka,
  type KafkaTopicMetrics,
  type ProducerThrottlingState,
  type ConsumerPauseState,
} from './predictive-kafka.service';

// SLO Self-Optimization Service
export {
  initializeSLOSelfOptimization,
  optimizeSLOs,
  recordParameterPerformance,
  startSLOSelfOptimizationMonitor,
  stopSLOSelfOptimizationMonitor,
  getCurrentOptimizedParameters,
  getOptimizationHistory,
  getLearningState,
  getSLOSelfOptimizationHealth,
  resetSLOSelfOptimization,
  type OptimizedParameter,
  type OptimizationResult,
  type SLOLearningState,
} from './slo-self-optimization.service';
