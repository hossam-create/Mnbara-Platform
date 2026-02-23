/**
 * Predictive Brownout Service
 * 
 * Preemptively degrades non-critical features before load spikes occur.
 * Activates brownout mode based on ML predictions rather than reactive thresholds.
 * 
 * Features:
 * - Predictive feature disabling (30-60s before predicted spike)
 * - Gradual activation/deactivation
 * - SLO-aware degradation
 * - Auto-recovery when predictions improve
 */

import { 
  trace, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import { logger } from '../middleware/correlation-logger.middleware';
import { 
  PREDICTIVE_BROWNOUT_CONFIG,
} from './predictive-config';
// Define BrownoutFeature locally since it's not exported from predictive-config
interface BrownoutFeature {
  name: string;
  priority: string;
  enabled: boolean;
}
import { predictServiceLoad, getLastMetricValue, type ServicePrediction } from './predictive-load.service';

// ============================================
// TYPES
// ============================================

export interface PredictiveFeatureState extends BrownoutFeature {
  currentlyEnabled: boolean;
  predictedDisableAt?: number;
  disabledAt?: number;
  enabledAt?: number;
  disableReason?: 'predictive' | 'reactive' | 'manual';
  predictedRecoveryAt?: number;
  priority: 'essential' | 'important' | 'nice-to-have';
}

export interface BrownoutActivation {
  id: string;
  timestamp: number;
  predictedTimestamp: number;
  featuresDisabled: string[];
  predictedLoad: number;
  actualLoad: number;
  confidence: number;
  preventedSLOViolation: boolean;
}

export interface BrownoutPrediction {
  willActivate: boolean;
  predictedActivationTime: number;
  predictedLoadAtActivation: number;
  confidence: number;
  featuresToDisable: string[];
  timeUntilActivation: number;
}

// ============================================
// STATE
// ============================================

// Feature states
const featureStates: Map<string, PredictiveFeatureState> = new Map();

// Activation history
const activationHistory: BrownoutActivation[] = [];
const MAX_HISTORY_SIZE = 50;

// Monitoring
let predictionMonitorInterval: NodeJS.Timeout | null = null;
let activationMonitorInterval: NodeJS.Timeout | null = null;

// Tracer
const tracer = trace.getTracer('predictive-brownout');

// ============================================
// INITIALIZATION
// ============================================

const DEFAULT_FEATURES: Array<{ name: string; priority: string; enabled: boolean }> = [
  { name: 'recommendations', priority: 'nice-to-have', enabled: true },
  { name: 'analytics', priority: 'nice-to-have', enabled: true },
  { name: 'insights', priority: 'nice-to-have', enabled: true },
  { name: 'search_advanced', priority: 'important', enabled: true },
  { name: 'image_processing', priority: 'nice-to-have', enabled: true },
  { name: 'detailed_logging', priority: 'nice-to-have', enabled: true },
  { name: 'background_sync', priority: 'important', enabled: true },
  { name: 'cache_warming', priority: 'nice-to-have', enabled: true },
];

export function initializePredictiveBrownout(): void {
  logger.info('[PredictiveBrownout] Initializing predictive brownout service');

  for (const feature of DEFAULT_FEATURES) {
    featureStates.set(feature.name, {
      ...feature,
      currentlyEnabled: feature.enabled,
      priority: feature.priority as 'essential' | 'important' | 'nice-to-have',
    });
  }

  logger.info('[PredictiveBrownout] Initialized', {
    features: DEFAULT_FEATURES.length,
    niceToHave: DEFAULT_FEATURES.filter(f => f.priority === 'nice-to-have').length,
    important: DEFAULT_FEATURES.filter(f => f.priority === 'important').length,
  });
}

// ============================================
// PREDICTION & ACTIVATION
// ============================================

/**
 * Predict if brownout will be needed
 */
export function predictBrownoutNeed(): BrownoutPrediction {
  const span = tracer.startSpan('predictive_brownout.predict', {
    kind: SpanKind.INTERNAL,
  });

  const config = PREDICTIVE_BROWNOUT_CONFIG;
  
  // Get predictions for all services
  const predictions = PREDICTIVE_BROWNOUT_CONFIG.featuresToDisable
    .map(() => predictServiceLoad('api-gateway')); // Use gateway as primary indicator
  
  // Find highest predicted load
  const maxPrediction = predictions.reduce((max: ServicePrediction, p: ServicePrediction) => 
    p.predictedLoad > max.predictedLoad ? p : max, predictions[0]);

  if (!maxPrediction) {
    const result: BrownoutPrediction = {
      willActivate: false,
      predictedActivationTime: 0,
      predictedLoadAtActivation: 0,
      confidence: 0,
      featuresToDisable: [],
      timeUntilActivation: 0,
    };
    
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
    return result;
  }

  const predictedLoad = maxPrediction.predictedLoad;
  const confidence = maxPrediction.confidence;
  const now = Date.now();

  // Determine if activation is needed
  const willActivate = predictedLoad > config.activationThreshold && confidence > 0.7;

  // Determine features to disable based on severity
  let featuresToDisable: string[] = [];
  
  if (willActivate) {
    const loadSeverity = predictedLoad > 90 ? 'critical' : 'degraded';
    
    for (const [name, feature] of featureStates) {
      if (feature.priority === 'essential') continue; // Never disable essential
      
      if (loadSeverity === 'critical') {
        // Critical: disable nice-to-have and important (not essential)
        if (feature.priority === 'nice-to-have' || feature.priority === 'important') {
          featuresToDisable.push(name);
        }
      } else {
        // Degraded: only disable nice-to-have
        if (feature.priority === 'nice-to-have') {
          featuresToDisable.push(name);
        }
      }
    }
  }

  const result: BrownoutPrediction = {
    willActivate,
    predictedActivationTime: willActivate ? now + config.leadTimeMs : 0,
    predictedLoadAtActivation: predictedLoad,
    confidence,
    featuresToDisable,
    timeUntilActivation: willActivate ? config.leadTimeMs : 0,
  };

  span.setAttributes({
    'brownout.will_activate': willActivate,
    'brownout.predicted_load': predictedLoad,
    'brownout.confidence': confidence,
    'brownout.features_count': featuresToDisable.length,
  });
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  return result;
}

/**
 * Activate predictive brownout
 */
export function activatePredictiveBrownout(
  prediction: BrownoutPrediction,
  trigger: 'predictive' | 'reactive' | 'manual' = 'predictive'
): BrownoutActivation | null {
  if (!prediction.willActivate) return null;

  const span = tracer.startSpan('predictive_brownout.activate', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'brownout.trigger': trigger,
      'brownout.predicted_load': prediction.predictedLoadAtActivation,
    },
  });

  const now = Date.now();
  const config = PREDICTIVE_BROWNOUT_CONFIG;

  const disabledFeatures: string[] = [];

  // Disable features gradually if configured
  if (config.gradualActivation) {
    for (let i = 0; i < prediction.featuresToDisable.length; i++) {
      const featureName = prediction.featuresToDisable[i];
      const feature = featureStates.get(featureName);
      
      if (feature && feature.currentlyEnabled) {
        setTimeout(() => {
          disableFeature(featureName, trigger, prediction.predictedActivationTime);
        }, i * config.activationStepDelayMs);
        
        disabledFeatures.push(featureName);
      }
    }
  } else {
    // Disable all at once
    for (const featureName of prediction.featuresToDisable) {
      const feature = featureStates.get(featureName);
      
      if (feature && feature.currentlyEnabled) {
        disableFeature(featureName, trigger, prediction.predictedActivationTime);
        disabledFeatures.push(featureName);
      }
    }
  }

  if (disabledFeatures.length === 0) {
    span.setStatus({ code: SpanStatusCode.OK, message: 'No features to disable' });
    span.end();
    return null;
  }

  // Record activation
  const activation: BrownoutActivation = {
    id: `brownout-${now}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: now,
    predictedTimestamp: prediction.predictedActivationTime,
    featuresDisabled: disabledFeatures,
    predictedLoad: prediction.predictedLoadAtActivation,
    actualLoad: getLastMetricValue('api-gateway', 'cpu') || 0,
    confidence: prediction.confidence,
    preventedSLOViolation: false, // Will be updated later
  };

  activationHistory.unshift(activation);
  if (activationHistory.length > MAX_HISTORY_SIZE) {
    activationHistory.pop();
  }

  logger.warn(`[PredictiveBrownout] Activated - ${disabledFeatures.length} features disabled`, {
    trigger,
    predictedLoad: prediction.predictedLoadAtActivation.toFixed(1),
    features: disabledFeatures.join(', '),
    confidence: prediction.confidence.toFixed(2),
  });

  span.setAttributes({
    'brownout.disabled_count': disabledFeatures.length,
    'brownout.features': disabledFeatures.join(','),
  });
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  return activation;
}

/**
 * Disable a feature
 */
function disableFeature(
  featureName: string, 
  reason: 'predictive' | 'reactive' | 'manual',
  predictedRecoveryAt?: number
): void {
  const feature = featureStates.get(featureName);
  if (!feature || !feature.currentlyEnabled) return;

  feature.currentlyEnabled = false;
  feature.disabledAt = Date.now();
  feature.disableReason = reason;
  feature.predictedRecoveryAt = predictedRecoveryAt;

  const disableSpan = tracer.startSpan('predictive_brownout.feature_disabled', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'brownout.feature': featureName,
      'brownout.reason': reason,
    },
  });
  disableSpan.end();

  logger.info(`[PredictiveBrownout] Disabled feature: ${featureName}`, { reason });
}

/**
 * Enable a feature
 */
export function enableFeature(featureName: string, reason: string): void {
  const feature = featureStates.get(featureName);
  if (!feature || feature.currentlyEnabled) return;

  feature.currentlyEnabled = true;
  feature.enabledAt = Date.now();
  feature.disabledAt = undefined;
  feature.disableReason = undefined;
  feature.predictedRecoveryAt = undefined;

  const enableSpan = tracer.startSpan('predictive_brownout.feature_enabled', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'brownout.feature': featureName,
      'brownout.reason': reason,
    },
  });
  enableSpan.end();

  logger.info(`[PredictiveBrownout] Enabled feature: ${featureName}`, { reason });
}

// ============================================
// RECOVERY
// ============================================

/**
 * Check and perform recovery
 */
export function checkAndRecover(): void {
  const span = tracer.startSpan('predictive_brownout.check_recovery', {
    kind: SpanKind.INTERNAL,
  });

  const prediction = predictBrownoutNeed();
  const now = Date.now();

  // If load has dropped below deactivation threshold
  if (!prediction.willActivate) {
    const disabledFeatures = Array.from(featureStates.values())
      .filter(f => !f.currentlyEnabled && f.priority !== 'essential');

    if (disabledFeatures.length > 0) {
      logger.info(`[PredictiveBrownout] Recovery conditions met - re-enabling features`);

      // Re-enable gradually (reverse order of disabling)
      const important = disabledFeatures.filter(f => f.priority === 'important');
      const niceToHave = disabledFeatures.filter(f => f.priority === 'nice-to-have');

      // Re-enable important first
      for (const feature of important) {
        enableFeature(feature.name, 'Predicted load decreased');
      }

      // Then nice-to-have after delay
      setTimeout(() => {
        for (const feature of niceToHave) {
          enableFeature(feature.name, 'Predicted load decreased');
        }
      }, 5000);
    }
  }

  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
}

// ============================================
// MONITORING LOOPS
// ============================================

export function startPredictiveBrownoutMonitor(): void {
  if (predictionMonitorInterval || activationMonitorInterval) {
    logger.warn('[PredictiveBrownout] Monitor already running');
    return;
  }

  if (!PREDICTIVE_BROWNOUT_CONFIG.enabled) {
    logger.info('[PredictiveBrownout] Predictive brownout disabled');
    return;
  }

  logger.info('[PredictiveBrownout] Starting predictive brownout monitor');

  // Prediction loop - check every 5 seconds
  predictionMonitorInterval = setInterval(() => {
    const prediction = predictBrownoutNeed();
    
    if (prediction.willActivate && prediction.timeUntilActivation <= 30000) {
      // Within 30 seconds of predicted activation
      logger.warn(`[PredictiveBrownout] Predicted activation in ${prediction.timeUntilActivation / 1000}s`);
    }
  }, 5000);

  // Activation loop - check every 10 seconds
  activationMonitorInterval = setInterval(() => {
    const prediction = predictBrownoutNeed();
    
    if (prediction.willActivate) {
      const activeNow = Array.from(featureStates.values()).some(f => !f.currentlyEnabled);
      
      if (!activeNow) {
        // Activate brownout
        activatePredictiveBrownout(prediction, 'predictive');
      }
    } else {
      // Check for recovery
      checkAndRecover();
    }
  }, 10000);
}

export function stopPredictiveBrownoutMonitor(): void {
  if (predictionMonitorInterval) {
    clearInterval(predictionMonitorInterval);
    predictionMonitorInterval = null;
  }
  
  if (activationMonitorInterval) {
    clearInterval(activationMonitorInterval);
    activationMonitorInterval = null;
  }

  logger.info('[PredictiveBrownout] Monitor stopped');
}

// ============================================
// MANUAL CONTROL
// ============================================

/**
 * Manually activate brownout
 */
export function manualActivateBrownout(featureNames?: string[]): BrownoutActivation | null {
  const featuresToDisable = featureNames || PREDICTIVE_BROWNOUT_CONFIG.featuresToDisable;
  
  const prediction: BrownoutPrediction = {
    willActivate: true,
    predictedActivationTime: Date.now(),
    predictedLoadAtActivation: 100,
    confidence: 1.0,
    featuresToDisable,
    timeUntilActivation: 0,
  };

  return activatePredictiveBrownout(prediction, 'manual');
}

/**
 * Manually deactivate brownout
 */
export function manualDeactivateBrownout(): void {
  for (const [name, feature] of featureStates) {
    if (!feature.currentlyEnabled && feature.priority !== 'essential') {
      enableFeature(name, 'Manual deactivation');
    }
  }
  
  logger.info('[PredictiveBrownout] Manually deactivated all brownout features');
}

// ============================================
// QUERY FUNCTIONS
// ============================================

export function isFeatureEnabled(featureName: string): boolean {
  const feature = featureStates.get(featureName);
  return feature?.currentlyEnabled ?? true;
}

export function getFeatureStatus(featureName: string): PredictiveFeatureState | undefined {
  return featureStates.get(featureName);
}

export function getActiveBrownoutFeatures(): PredictiveFeatureState[] {
  return Array.from(featureStates.values()).filter(f => !f.currentlyEnabled);
}

export function isBrownoutActive(): boolean {
  return Array.from(featureStates.values()).some(f => !f.currentlyEnabled);
}

// ============================================
// HEALTH & METRICS
// ============================================

export function getPredictiveBrownoutHealth(): {
  enabled: boolean;
  isRunning: boolean;
  isActive: boolean;
  activeFeatures: PredictiveFeatureState[];
  allFeatures: PredictiveFeatureState[];
  recentActivations: BrownoutActivation[];
  totalActivations24h: number;
  preventedViolations: number;
} {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;

  const recentActivations = activationHistory.filter(a => a.timestamp > dayAgo);
  const prevented = activationHistory.filter(a => a.preventedSLOViolation).length;

  return {
    enabled: PREDICTIVE_BROWNOUT_CONFIG.enabled,
    isRunning: predictionMonitorInterval !== null,
    isActive: isBrownoutActive(),
    activeFeatures: getActiveBrownoutFeatures(),
    allFeatures: Array.from(featureStates.values()),
    recentActivations: activationHistory.slice(0, 10),
    totalActivations24h: recentActivations.length,
    preventedViolations: prevented,
  };
}

// ============================================
// RESET
// ============================================

export function resetPredictiveBrownout(): void {
  stopPredictiveBrownoutMonitor();
  activationHistory.length = 0;
  
  // Re-enable all features
  for (const [name, feature] of featureStates) {
    feature.currentlyEnabled = true;
    feature.disabledAt = undefined;
    feature.disableReason = undefined;
  }
  
  logger.info('[PredictiveBrownout] Reset complete');
}

export { featureStates, activationHistory, DEFAULT_FEATURES };
