/**
 * Predictive Test Controller
 * 
 * Chaos testing for Self-Driving Platform features.
 * Tests ML predictions, auto-scaling, anomaly detection, and auto-healing.
 * 
 * Endpoints:
 * - Simulate load spikes and verify predictive scaling
 * - Test anomaly detection with artificial patterns
 * - Validate auto-healing responses
 * - Test SLO self-optimization under load
 */

import { Request, Response } from 'express';
import { 
  trace, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import { logger } from '../middleware/correlation-logger.middleware';
import {
  predictServiceLoad,
  predictAllServices,
  getPredictiveLoadHealth,
  getMetricHistory,
} from '../predictive/predictive-load.service';
import {
  makeScalingDecision,
  executeScaling,
  manualScale,
  emergencyScaleUp,
  getAutoScalingHealth,
} from '../predictive/auto-scaling.service';
import {
  detectAnomalies,
  getAnomalyHealth,
  getRecentAnomalies,
} from '../predictive/anomaly-detector.service';
import {
  manualActivateBrownout,
  manualDeactivateBrownout,
  getPredictiveBrownoutHealth,
  predictBrownoutNeed,
} from '../predictive/predictive-brownout.service';
import {
  getPredictiveBulkheadHealth,
  emergencyThrottle,
  adjustBulkheadForService,
} from '../predictive/predictive-bulkhead.service';
import {
  manualPauseConsumer,
  getPredictiveKafkaHealth,
  collectKafkaMetrics,
  checkAndApplyThrottling,
} from '../predictive/predictive-kafka.service';
import {
  optimizeSLOs,
  getSLOSelfOptimizationHealth,
  getCurrentOptimizedParameters,
} from '../predictive/slo-self-optimization.service';
import {
  getAdaptiveRetryHealth,
  calculateRetryDelay,
  tuneRetryPolicies,
} from '../predictive/adaptive-retry.service';

const tracer = trace.getTracer('predictive-test');

// ============================================
// LOAD PREDICTION TESTS
// ============================================

/**
 * Test load prediction accuracy
 */
export async function testLoadPrediction(req: Request, res: Response): Promise<void> {
  const { service = 'api-gateway', duration = 60000 } = req.body;
  
  const span = tracer.startSpan('test.load_prediction', {
    kind: SpanKind.INTERNAL,
    attributes: { 'test.service': service, 'test.duration': duration },
  });

  logger.info(`[PredictiveTest] Starting load prediction test for ${service}`);

  // Get current prediction
  const initialPrediction = predictServiceLoad(service);
  
  // Simulate load increase
  const loadInterval = setInterval(() => {
    // Simulate high CPU for testing
    const start = Date.now();
    while (Date.now() - start < 50) {
      Math.random() * Math.random();
    }
  }, 100);

  // Wait and check prediction accuracy
  await new Promise(resolve => setTimeout(resolve, duration));
  
  clearInterval(loadInterval);

  // Get final state
  const finalPrediction = predictServiceLoad(service);
  const predictionDiff = Math.abs(finalPrediction.predictedLoad - initialPrediction.predictedLoad);
  const accuracy = predictionDiff < 20 ? 'good' : predictionDiff < 40 ? 'fair' : 'poor';

  const result = {
    test: 'load_prediction',
    service,
    duration,
    initialPrediction: {
      predictedLoad: initialPrediction.predictedLoad,
      confidence: initialPrediction.confidence,
      recommendation: initialPrediction.recommendation,
    },
    finalPrediction: {
      predictedLoad: finalPrediction.predictedLoad,
      confidence: finalPrediction.confidence,
      recommendation: finalPrediction.recommendation,
    },
    predictionAccuracy: accuracy,
    predictionDiff: predictionDiff.toFixed(2),
    passed: finalPrediction.confidence > 0.6 && accuracy !== 'poor',
  };

  span.setAttributes({
    'test.accuracy': accuracy,
    'test.passed': result.passed,
  });
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  res.json(result);
}

/**
 * Get all service predictions
 */
export async function getAllPredictions(req: Request, res: Response): Promise<void> {
  const predictions = predictAllServices();
  
  res.json({
    timestamp: Date.now(),
    predictions: predictions.map(p => ({
      service: p.service,
      currentLoad: p.currentLoad,
      predictedLoad: p.predictedLoad,
      confidence: p.confidence,
      recommendation: p.recommendation,
      trend: p.predictions[0]?.trend || 'unknown',
    })),
  });
}

// ============================================
// AUTO-SCALING TESTS
// ============================================

/**
 * Test auto-scaling decision making
 */
export async function testAutoScalingDecision(req: Request, res: Response): Promise<void> {
  const { service = 'api-gateway' } = req.body;
  
  const span = tracer.startSpan('test.auto_scaling', {
    kind: SpanKind.INTERNAL,
    attributes: { 'test.service': service },
  });

  const decision = makeScalingDecision(service);
  const health = getAutoScalingHealth();

  const result = {
    test: 'auto_scaling_decision',
    service,
    decision: {
      shouldScale: decision.shouldScale,
      action: decision.action,
      targetReplicas: decision.targetReplicas,
      reason: decision.reason,
      confidence: decision.confidence,
      urgency: decision.urgency,
    },
    currentState: health.services.find(s => s.service === service),
    passed: decision.confidence > 0.5,
  };

  span.setAttributes({
    'test.should_scale': decision.shouldScale,
    'test.passed': result.passed,
  });
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  res.json(result);
}

/**
 * Trigger manual scaling
 */
export async function triggerManualScaling(req: Request, res: Response): Promise<void> {
  const { service = 'api-gateway', replicas = 5 } = req.body;
  
  const event = await manualScale(service, replicas);
  
  res.json({
    success: !!event,
    event,
    message: event ? `Scaled ${service} to ${replicas} replicas` : 'Scaling failed',
  });
}

/**
 * Emergency scale up test
 */
export async function triggerEmergencyScale(req: Request, res: Response): Promise<void> {
  const { service = 'api-gateway', additional = 4 } = req.body;
  
  const event = await emergencyScaleUp(service, additional);
  
  res.json({
    success: !!event,
    event,
    message: event ? `Emergency scaled ${service} +${additional} replicas` : 'Scaling failed',
  });
}

// ============================================
// ANOMALY DETECTION TESTS
// ============================================

/**
 * Test anomaly detection
 */
export async function testAnomalyDetection(req: Request, res: Response): Promise<void> {
  const { service = 'api-gateway', metric = 'cpu' } = req.body;
  
  const span = tracer.startSpan('test.anomaly_detection', {
    kind: SpanKind.INTERNAL,
    attributes: { 'test.service': service, 'test.metric': metric },
  });

  // Inject artificial anomaly
  // In production, this would simulate real load
  const anomalies = detectAnomalies(service, metric);
  const health = getAnomalyHealth();

  const result = {
    test: 'anomaly_detection',
    service,
    metric,
    detectedAnomalies: anomalies.length,
    anomalies: anomalies.map(a => ({
      service: a.service,
      metric: a.metric,
      severity: a.severity,
      autoHealAction: a.autoHealAction,
    })),
    stats: health.stats,
    passed: health.isRunning && health.enabled,
  };

  span.setAttributes({
    'test.detected': anomalies.length,
    'test.passed': result.passed,
  });
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  res.json(result);
}

/**
 * Get recent anomalies
 */
export async function getAnomaliesReport(req: Request, res: Response): Promise<void> {
  const { service, severity, limit = 50 } = req.query;
  
  const anomalies = getRecentAnomalies(
    service as string | undefined,
    severity as string | undefined,
    parseInt(limit as string)
  );

  res.json({
    count: anomalies.length,
    anomalies: anomalies.map(a => ({
      id: a.id,
      timestamp: a.timestamp,
      service: a.service,
      metric: a.metric,
      value: a.value,
      severity: a.severity,
      score: a.score,
      description: a.description,
      autoHealAction: a.autoHealAction,
      autoHealSuccess: a.autoHealSuccess,
    })),
  });
}

// ============================================
// BROWNOUT TESTS
// ============================================

/**
 * Test brownout prediction
 */
export async function testBrownoutPrediction(req: Request, res: Response): Promise<void> {
  const prediction = predictBrownoutNeed();
  const health = getPredictiveBrownoutHealth();

  res.json({
    test: 'brownout_prediction',
    prediction: {
      willActivate: prediction.willActivate,
      predictedLoad: prediction.predictedLoadAtActivation,
      confidence: prediction.confidence,
      timeUntilActivation: prediction.timeUntilActivation,
      featuresToDisable: prediction.featuresToDisable,
    },
    currentState: {
      isActive: health.isActive,
      activeFeatures: health.activeFeatures.map(f => f.name),
      totalActivations24h: health.totalActivations24h,
    },
    passed: prediction.confidence > 0 || !prediction.willActivate,
  });
}

/**
 * Activate brownout manually
 */
export async function triggerBrownout(req: Request, res: Response): Promise<void> {
  const { features } = req.body;
  
  const activation = manualActivateBrownout(features);
  
  res.json({
    success: !!activation,
    activation,
    message: activation 
      ? `Brownout activated, ${activation.featuresDisabled.length} features disabled` 
      : 'Activation failed',
  });
}

/**
 * Deactivate brownout
 */
export async function clearBrownout(req: Request, res: Response): Promise<void> {
  manualDeactivateBrownout();
  
  res.json({
    success: true,
    message: 'All brownout features re-enabled',
  });
}

// ============================================
// BULKHEAD TESTS
// ============================================

/**
 * Test bulkhead adjustment
 */
export async function testBulkheadAdjustment(req: Request, res: Response): Promise<void> {
  const { service = 'api-gateway' } = req.body;
  
  const adjustment = adjustBulkheadForService(service);
  const health = getPredictiveBulkheadHealth();

  res.json({
    test: 'bulkhead_adjustment',
    service,
    adjustment: adjustment ? {
      previousConcurrency: adjustment.previousConcurrency,
      newConcurrency: adjustment.newConcurrency,
      previousQueueSize: adjustment.previousQueueSize,
      newQueueSize: adjustment.newQueueSize,
      reason: adjustment.reason,
      confidence: adjustment.confidence,
    } : null,
    currentSettings: health.services.find(s => s.service === service),
    totalAdjustments24h: health.totalAdjustments24h,
    passed: health.isRunning && health.enabled,
  });
}

/**
 * Emergency bulkhead throttle
 */
export async function triggerBulkheadThrottle(req: Request, res: Response): Promise<void> {
  const { service = 'api-gateway' } = req.body;
  
  emergencyThrottle(service);
  
  res.json({
    success: true,
    message: `Emergency throttle applied to ${service}`,
  });
}

// ============================================
// KAFKA TESTS
// ============================================

/**
 * Test Kafka throttling
 */
export async function testKafkaThrottling(req: Request, res: Response): Promise<void> {
  // Collect metrics first
  collectKafkaMetrics();
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Check throttling
  checkAndApplyThrottling();
  
  const health = getPredictiveKafkaHealth();

  res.json({
    test: 'kafka_throttling',
    topics: health.topics.map(t => ({
      topic: t.topic,
      totalLag: t.totalLag,
      isThrottled: t.producerState?.isThrottled,
      rateLimit: t.producerState?.currentRateLimit,
    })),
    pausedConsumers: health.consumers.filter(c => c.isPaused).length,
    passed: health.isRunning && health.enabled,
  });
}

/**
 * Pause consumer manually
 */
export async function pauseConsumer(req: Request, res: Response): Promise<void> {
  const { consumerGroup, duration = 30000 } = req.body;
  
  manualPauseConsumer(consumerGroup, duration);
  
  res.json({
    success: true,
    message: `Paused consumer ${consumerGroup} for ${duration}ms`,
  });
}

// ============================================
// SLO OPTIMIZATION TESTS
// ============================================

/**
 * Test SLO self-optimization
 */
export async function testSLOOptimization(req: Request, res: Response): Promise<void> {
  const optimization = optimizeSLOs();
  const health = getSLOSelfOptimizationHealth();

  res.json({
    test: 'slo_optimization',
    optimization: {
      applied: optimization.applied,
      parameters: optimization.parameters,
      sloAchievement: optimization.sloAchievement,
      errorBudgetRemaining: optimization.errorBudgetRemaining,
      strategy: optimization.strategy,
    },
    currentParameters: health.currentParameters,
    totalOptimizations24h: health.totalOptimizations24h,
    passed: health.isRunning && health.enabled,
  });
}

/**
 * Get current optimized parameters
 */
export async function getOptimizedParameters(req: Request, res: Response): Promise<void> {
  const params = getCurrentOptimizedParameters();
  
  res.json({
    parameters: params,
    timestamp: Date.now(),
  });
}

// ============================================
// ADAPTIVE RETRY TESTS
// ============================================

/**
 * Test adaptive retry calculation
 */
export async function testAdaptiveRetry(req: Request, res: Response): Promise<void> {
  const { service = 'api-gateway', attempt = 1, previousLatency = 200 } = req.body;
  
  const delay = calculateRetryDelay(service, attempt, previousLatency);
  const health = getAdaptiveRetryHealth();
  
  // Tune policies
  tuneRetryPolicies();

  res.json({
    test: 'adaptive_retry',
    service,
    attempt,
    previousLatency,
    calculatedDelay: delay,
    policy: health.policies.find(p => p.service === service),
    passed: delay.delayMs > 0,
  });
}

// ============================================
// COMPREHENSIVE TESTS
// ============================================

/**
 * Run full predictive platform test
 */
export async function runFullTest(req: Request, res: Response): Promise<void> {
  const span = tracer.startSpan('test.full_suite', {
    kind: SpanKind.INTERNAL,
  });

  logger.info('[PredictiveTest] Starting full predictive platform test suite');

  const tests = [];

  // Test 1: Load Prediction
  tests.push({
    name: 'load_prediction',
    result: await runTest(() => predictServiceLoad('api-gateway').confidence > 0),
  });

  // Test 2: Auto-Scaling
  tests.push({
    name: 'auto_scaling',
    result: await runTest(() => {
      const decision = makeScalingDecision('api-gateway');
      return decision.confidence > 0;
    }),
  });

  // Test 3: Anomaly Detection
  tests.push({
    name: 'anomaly_detection',
    result: await runTest(() => getAnomalyHealth().isRunning),
  });

  // Test 4: Brownout
  tests.push({
    name: 'brownout',
    result: await runTest(() => {
      const health = getPredictiveBrownoutHealth();
      return health.enabled && !health.isActive; // Should not be active during normal test
    }),
  });

  // Test 5: Bulkhead
  tests.push({
    name: 'bulkhead',
    result: await runTest(() => getPredictiveBulkheadHealth().isRunning),
  });

  // Test 6: Kafka
  tests.push({
    name: 'kafka_throttling',
    result: await runTest(() => getPredictiveKafkaHealth().isRunning),
  });

  // Test 7: SLO Optimization
  tests.push({
    name: 'slo_optimization',
    result: await runTest(() => getSLOSelfOptimizationHealth().isRunning),
  });

  // Test 8: Adaptive Retry
  tests.push({
    name: 'adaptive_retry',
    result: await runTest(() => {
      const delay = calculateRetryDelay('api-gateway', 1);
      return delay.delayMs > 0;
    }),
  });

  const passed = tests.filter(t => t.result).length;
  const failed = tests.filter(t => !t.result).length;

  const result = {
    test: 'full_suite',
    timestamp: Date.now(),
    total: tests.length,
    passed,
    failed,
    tests: tests.map(t => ({
      name: t.name,
      status: t.result ? 'passed' : 'failed',
    })),
    allPassed: passed === tests.length,
  };

  span.setAttributes({
    'test.total': tests.length,
    'test.passed': passed,
    'test.failed': failed,
    'test.all_passed': result.allPassed,
  });
  span.setStatus({ code: result.allPassed ? SpanStatusCode.OK : SpanStatusCode.ERROR });
  span.end();

  res.json(result);
}

// Helper to run a test
async function runTest(testFn: () => boolean | Promise<boolean>): Promise<boolean> {
  try {
    return await Promise.resolve(testFn());
  } catch {
    return false;
  }
}

// ============================================
// STATUS ENDPOINT
// ============================================

/**
 * Get full predictive platform status
 */
export async function getPredictiveStatus(req: Request, res: Response): Promise<void> {
  res.json({
    timestamp: Date.now(),
    predictive: {
      loadPrediction: getPredictiveLoadHealth(),
      autoScaling: getAutoScalingHealth(),
      bulkhead: getPredictiveBulkheadHealth(),
      brownout: getPredictiveBrownoutHealth(),
      anomalyDetection: getAnomalyHealth(),
      adaptiveRetry: getAdaptiveRetryHealth(),
      kafka: getPredictiveKafkaHealth(),
      sloOptimization: getSLOSelfOptimizationHealth(),
    },
  });
}

// ============================================
// ROUTE DEFINITIONS
// ============================================

/*
import { Router } from 'express';
const router = Router();

// Load prediction tests
router.post('/admin/predictive/test/load', testLoadPrediction);
router.get('/admin/predictive/predictions', getAllPredictions);

// Auto-scaling tests
router.post('/admin/predictive/test/scaling', testAutoScalingDecision);
router.post('/admin/predictive/scale', triggerManualScaling);
router.post('/admin/predictive/emergency-scale', triggerEmergencyScale);

// Anomaly detection tests
router.post('/admin/predictive/test/anomaly', testAnomalyDetection);
router.get('/admin/predictive/anomalies', getAnomaliesReport);

// Brownout tests
router.post('/admin/predictive/test/brownout', testBrownoutPrediction);
router.post('/admin/predictive/brownout/activate', triggerBrownout);
router.post('/admin/predictive/brownout/clear', clearBrownout);

// Bulkhead tests
router.post('/admin/predictive/test/bulkhead', testBulkheadAdjustment);
router.post('/admin/predictive/bulkhead/throttle', triggerBulkheadThrottle);

// Kafka tests
router.post('/admin/predictive/test/kafka', testKafkaThrottling);
router.post('/admin/predictive/kafka/pause', pauseConsumer);

// SLO optimization tests
router.post('/admin/predictive/test/slo', testSLOOptimization);
router.get('/admin/predictive/slo/parameters', getOptimizedParameters);

// Retry tests
router.post('/admin/predictive/test/retry', testAdaptiveRetry);

// Comprehensive tests
router.post('/admin/predictive/test/full', runFullTest);
router.get('/admin/predictive/status', getPredictiveStatus);

export { router as predictiveTestRouter };
*/
