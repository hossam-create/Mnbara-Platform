/**
 * Brownout Service
 * 
 * Implements brownout mode - gracefully degrades non-essential features
 * when system is under load to maintain core functionality.
 * 
 * Features:
 * - Feature flag management
 * - Automatic disabling based on system state
 * - Gradual restoration after recovery
 * - Feature dependency tracking
 */

import { 
  trace, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import { logger } from '../middleware/correlation-logger.middleware';
import { 
  BROWNOUT_FEATURES, 
  BrownoutFeature,
  OverloadState,
  AUTO_RECOVERY_CONFIG 
} from './adaptive-config';
import { getCurrentOverloadState } from './load-shedding.service';

// Feature state
interface FeatureState extends BrownoutFeature {
  currentlyEnabled: boolean;
  disabledAt?: Date;
  disabledBy?: OverloadState;
  restorationStep: number;
}

// Track feature states
const featureStates: Map<string, FeatureState> = new Map();

// Recovery tracking
let recoveryInterval: NodeJS.Timeout | null = null;
let lastStableTimestamp: number | null = null;

// Tracer
const tracer = trace.getTracer('brownout-service');

// ============================================
// INITIALIZATION
// ============================================

export function initializeBrownoutFeatures(): void {
  for (const feature of BROWNOUT_FEATURES) {
    featureStates.set(feature.name, {
      ...feature,
      currentlyEnabled: feature.enabled,
      restorationStep: 0,
    });
  }

  logger.info('[Brownout] Initialized', {
    features: BROWNOUT_FEATURES.length,
    essential: BROWNOUT_FEATURES.filter(f => f.priority === 'essential').length,
    important: BROWNOUT_FEATURES.filter(f => f.priority === 'important').length,
    niceToHave: BROWNOUT_FEATURES.filter(f => f.priority === 'nice-to-have').length,
  });
}

// ============================================
// FEATURE CHECK
// ============================================

/**
 * Check if a feature is currently enabled
 */
export function isFeatureEnabled(featureName: string): boolean {
  const feature = featureStates.get(featureName);
  
  if (!feature) {
    // Unknown features default to enabled
    return true;
  }

  return feature.currentlyEnabled;
}

/**
 * Check feature with tracing
 */
export function checkFeature(featureName: string): boolean {
  const span = tracer.startSpan('brownout.feature_check', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'brownout.feature_name': featureName,
    },
  });

  const enabled = isFeatureEnabled(featureName);
  
  span.setAttribute('brownout.feature_enabled', enabled);
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  return enabled;
}

// ============================================
// ADAPTIVE BROWNOUT
// ============================================

/**
 * Apply brownout based on current system state
 */
export function applyBrownout(state: OverloadState): void {
  const span = tracer.startSpan('brownout.apply', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'brownout.state': state,
    },
  });

  let disabledCount = 0;
  let enabledCount = 0;

  for (const [name, feature] of featureStates) {
    const shouldDisable = shouldDisableFeature(feature, state);
    
    if (shouldDisable && feature.currentlyEnabled) {
      // Disable feature
      feature.currentlyEnabled = false;
      feature.disabledAt = new Date();
      feature.disabledBy = state;
      feature.restorationStep = 0;
      
      disabledCount++;
      
      logger.warn(`[Brownout] Disabled feature: ${name}`, {
        feature: name,
        priority: feature.priority,
        state,
      });

      // Trace feature disable
      const disableSpan = tracer.startSpan('brownout.feature_disabled', {
        kind: SpanKind.INTERNAL,
        attributes: {
          'brownout.feature_name': name,
          'brownout.feature_priority': feature.priority,
          'brownout.trigger_state': state,
        },
      });
      disableSpan.end();

    } else if (!shouldDisable && !feature.currentlyEnabled && feature.disabledBy === state) {
      // This feature was disabled by this state, and state is improving
      // Don't re-enable yet - wait for recovery process
      enabledCount++;
    }
  }

  span.setAttributes({
    'brownout.features_disabled': disabledCount,
    'brownout.features_waiting_recovery': enabledCount,
  });
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  // If we disabled features, start monitoring for recovery
  if (disabledCount > 0 && !recoveryInterval) {
    startRecoveryMonitor();
  }
}

/**
 * Determine if a feature should be disabled
 */
function shouldDisableFeature(feature: FeatureState, state: OverloadState): boolean {
  // Essential features never disabled
  if (feature.priority === 'essential') {
    return false;
  }

  // Check disable conditions
  if (state === 'critical') {
    // In critical state, disable important and nice-to-have
    return feature.priority === 'important' || feature.priority === 'nice-to-have';
  }

  if (state === 'degraded' || state === 'recovery') {
    // In degraded/recovery state, only disable nice-to-have
    return feature.priority === 'nice-to-have';
  }

  // Normal state - don't disable
  return false;
}

// ============================================
// RECOVERY PROCESS
// ============================================

/**
 * Start monitoring for recovery
 */
function startRecoveryMonitor(): void {
  if (recoveryInterval) return;

  logger.info('[Brownout] Starting recovery monitor');

  recoveryInterval = setInterval(async () => {
    await attemptRecovery();
  }, AUTO_RECOVERY_CONFIG.stepIntervalMs);
}

/**
 * Stop recovery monitor
 */
function stopRecoveryMonitor(): void {
  if (recoveryInterval) {
    clearInterval(recoveryInterval);
    recoveryInterval = null;
    logger.info('[Brownout] Recovery monitor stopped');
  }
}

/**
 * Attempt gradual recovery of features
 */
async function attemptRecovery(): Promise<void> {
  const currentState = getCurrentOverloadState();
  const span = tracer.startSpan('brownout.recovery_attempt', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'brownout.current_state': currentState,
    },
  });

  // Only recover if system is stable
  if (currentState !== 'normal') {
    lastStableTimestamp = null;
    span.setAttribute('brownout.recovery_skipped', 'system_not_stable');
    span.end();
    return;
  }

  // Check stability window
  const now = Date.now();
  if (!lastStableTimestamp) {
    lastStableTimestamp = now;
    span.setAttribute('brownout.stability_start', now);
    span.end();
    return;
  }

  const stableDuration = now - lastStableTimestamp;
  
  if (stableDuration < AUTO_RECOVERY_CONFIG.stabilityWindowMs) {
    span.setAttribute('brownout.stable_duration_ms', stableDuration);
    span.setAttribute('brownout.stability_needed_ms', AUTO_RECOVERY_CONFIG.stabilityWindowMs);
    span.end();
    return;
  }

  // Find features to restore
  const disabledFeatures = Array.from(featureStates.values())
    .filter(f => !f.currentlyEnabled && f.priority !== 'essential');

  if (disabledFeatures.length === 0) {
    // All features restored
    stopRecoveryMonitor();
    lastStableTimestamp = null;
    
    span.setAttribute('brownout.recovery_complete', true);
    span.end();
    
    logger.info('[Brownout] All features restored');
    return;
  }

  // Restore one feature at a time
  const featureToRestore = disabledFeatures
    .sort((a, b) => {
      // Restore nice-to-have first, then important
      if (a.priority === 'nice-to-have' && b.priority !== 'nice-to-have') return -1;
      if (a.priority !== 'nice-to-have' && b.priority === 'nice-to-have') return 1;
      // Then by disabled time (oldest first)
      return (a.disabledAt?.getTime() || 0) - (b.disabledAt?.getTime() || 0);
    })[0];

  if (featureToRestore) {
    featureToRestore.currentlyEnabled = true;
    featureToRestore.restorationStep = 0;
    featureToRestore.disabledAt = undefined;
    featureToRestore.disabledBy = undefined;

    logger.info(`[Brownout] Restored feature: ${featureToRestore.name}`, {
      feature: featureToRestore.name,
      priority: featureToRestore.priority,
    });

    const restoreSpan = tracer.startSpan('brownout.feature_restored', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'brownout.feature_name': featureToRestore.name,
        'brownout.feature_priority': featureToRestore.priority,
        'brownout.stable_duration_ms': stableDuration,
      },
    });
    restoreSpan.end();
  }

  span.end();
}

// ============================================
// MANUAL FEATURE CONTROL
// ============================================

/**
 * Manually disable a feature
 */
export function manuallyDisableFeature(featureName: string, reason: string): void {
  const feature = featureStates.get(featureName);
  if (!feature) {
    throw new Error(`Unknown feature: ${featureName}`);
  }

  feature.currentlyEnabled = false;
  feature.disabledAt = new Date();
  feature.disabledBy = 'manual' as OverloadState;

  logger.info(`[Brownout] Manually disabled feature: ${featureName}`, {
    feature: featureName,
    reason,
  });
}

/**
 * Manually enable a feature
 */
export function manuallyEnableFeature(featureName: string): void {
  const feature = featureStates.get(featureName);
  if (!feature) {
    throw new Error(`Unknown feature: ${featureName}`);
  }

  feature.currentlyEnabled = true;
  feature.disabledAt = undefined;
  feature.disabledBy = undefined;
  feature.restorationStep = 0;

  logger.info(`[Brownout] Manually enabled feature: ${featureName}`);
}

/**
 * Register a new feature dynamically
 */
export function registerFeature(feature: BrownoutFeature): void {
  featureStates.set(feature.name, {
    ...feature,
    currentlyEnabled: feature.enabled,
    restorationStep: 0,
  });

  logger.info(`[Brownout] Registered feature: ${feature.name}`, {
    priority: feature.priority,
    enabled: feature.enabled,
  });
}

// ============================================
// HEALTH & METRICS
// ============================================

export function getBrownoutHealth(): {
  brownoutActive: boolean;
  currentState: OverloadState;
  features: FeatureState[];
  disabledCount: number;
  inRecovery: boolean;
  stableDuration: number | null;
} {
  const features = Array.from(featureStates.values());
  const disabledCount = features.filter(f => !f.currentlyEnabled).length;
  const inRecovery = recoveryInterval !== null;
  
  const stableDuration = lastStableTimestamp 
    ? Date.now() - lastStableTimestamp 
    : null;

  return {
    brownoutActive: disabledCount > 0,
    currentState: getCurrentOverloadState(),
    features,
    disabledCount,
    inRecovery,
    stableDuration,
  };
}

export function getFeatureStates(): Map<string, FeatureState> {
  return new Map(featureStates);
}

// ============================================
// SHUTDOWN
// ============================================

export function shutdownBrownout(): void {
  stopRecoveryMonitor();
  
  // Re-enable all non-essential features
  for (const [name, feature] of featureStates) {
    if (feature.priority !== 'essential') {
      feature.currentlyEnabled = true;
    }
  }

  logger.info('[Brownout] Shutdown complete - all features restored');
}

export { featureStates, lastStableTimestamp, recoveryInterval };
