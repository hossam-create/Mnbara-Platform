/**
 * Predictive Bulkhead Service
 * 
 * Dynamically adjusts bulkhead (concurrency isolation) parameters based on
 * predicted load patterns. Pre-shapes resource allocation before load arrives.
 * 
 * Features:
 * - Dynamic concurrency limits based on predictions
 * - Queue size adjustment
 * - Load-aware request routing
 * - Gradual adjustments with safety bounds
 */

import { 
  trace, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import { logger } from '../middleware/correlation-logger.middleware';
import { 
  PREDICTIVE_BULKHEAD_CONFIG,
  PREDICTIVE_SERVICES,
  SERVICE_PRIORITIES,
} from './predictive-config';
import { predictServiceLoad, getLastMetricValue } from './predictive-load.service';

// ============================================
// TYPES
// ============================================

export interface BulkheadSettings {
  service: string;
  maxConcurrency: number;
  maxQueueSize: number;
  currentLoad: number;
  predictedLoad: number;
  lastAdjusted: number;
  adjustmentCount: number;
  isThrottled: boolean;
}

export interface BulkheadAdjustment {
  service: string;
  timestamp: number;
  previousConcurrency: number;
  newConcurrency: number;
  previousQueueSize: number;
  newQueueSize: number;
  reason: string;
  predictedLoad: number;
  confidence: number;
}

export interface RoutingDecision {
  service: string;
  canAccept: boolean;
  priorityBoost: number;
  estimatedWaitTime: number;
  alternativeServices?: string[];
}

// ============================================
// STATE
// ============================================

// Current bulkhead settings per service
const bulkheadSettings: Map<string, BulkheadSettings> = new Map();

// Adjustment history
const adjustmentHistory: BulkheadAdjustment[] = [];
const MAX_HISTORY_SIZE = 50;

// Tracer
const tracer = trace.getTracer('predictive-bulkhead');

// Monitoring
let adjustmentInterval: NodeJS.Timeout | null = null;

// ============================================
// INITIALIZATION
// ============================================

export function initializePredictiveBulkhead(): void {
  logger.info('[PredictiveBulkhead] Initializing predictive bulkhead service');

  const config = PREDICTIVE_BULKHEAD_CONFIG;

  for (const service of PREDICTIVE_SERVICES) {
    const priority = SERVICE_PRIORITIES[service] || 50;
    
    // Higher priority services get more initial capacity
    const baseConcurrency = Math.floor(
      config.maxConcurrencyRange.min + 
      (config.maxConcurrencyRange.max - config.maxConcurrencyRange.min) * (priority / 100)
    );
    
    const baseQueueSize = Math.floor(
      config.queueSizeRange.min + 
      (config.queueSizeRange.max - config.queueSizeRange.min) * (priority / 100)
    );

    bulkheadSettings.set(service, {
      service,
      maxConcurrency: baseConcurrency,
      maxQueueSize: baseQueueSize,
      currentLoad: 0,
      predictedLoad: 0,
      lastAdjusted: Date.now(),
      adjustmentCount: 0,
      isThrottled: false,
    });
  }

  logger.info('[PredictiveBulkhead] Initialized', {
    services: PREDICTIVE_SERVICES.length,
    concurrencyRange: `${config.maxConcurrencyRange.min}-${config.maxConcurrencyRange.max}`,
    queueRange: `${config.queueSizeRange.min}-${config.queueSizeRange.max}`,
  });
}

// ============================================
// PREDICTIVE ADJUSTMENTS
// ============================================

/**
 * Adjust bulkhead settings based on predicted load
 */
export function adjustBulkheadForService(service: string): BulkheadAdjustment | null {
  const span = tracer.startSpan('predictive_bulkhead.adjust', {
    kind: SpanKind.INTERNAL,
    attributes: { 'bulkhead.service': service },
  });

  const settings = bulkheadSettings.get(service);
  if (!settings) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: 'Service not found' });
    span.end();
    return null;
  }

  const config = PREDICTIVE_BULKHEAD_CONFIG;
  const now = Date.now();

  // Check adjustment interval
  if (now - settings.lastAdjusted < config.adjustmentIntervalMs) {
    span.setStatus({ code: SpanStatusCode.OK, message: 'Too soon since last adjustment' });
    span.end();
    return null;
  }

  // Get predictions
  const prediction = predictServiceLoad(service);
  const predictedLoad = prediction.predictedLoad;
  const currentLoad = prediction.currentLoad;
  const confidence = prediction.confidence;

  // Check confidence threshold
  if (confidence < 0.6) {
    span.setStatus({ code: SpanStatusCode.OK, message: 'Low confidence' });
    span.end();
    return null;
  }

  // Check if load change is significant
  const loadChange = Math.abs(predictedLoad - currentLoad);
  if (loadChange < config.adjustmentThreshold) {
    span.setStatus({ code: SpanStatusCode.OK, message: 'Load change below threshold' });
    span.end();
    return null;
  }

  // Calculate new settings
  const oldConcurrency = settings.maxConcurrency;
  const oldQueueSize = settings.maxQueueSize;

  // Adjust concurrency based on predicted load
  // Higher predicted load = higher concurrency allowed (prepare for spike)
  // But cap at maximum
  const loadFactor = predictedLoad / 100;
  const targetConcurrency = Math.floor(
    config.maxConcurrencyRange.min + 
    (config.maxConcurrencyRange.max - config.maxConcurrencyRange.min) * 
    Math.min(1, loadFactor * config.loadToConcurrencyRatio)
  );

  // Adjust queue size
  const targetQueueSize = Math.floor(
    config.queueSizeRange.min + 
    (config.queueSizeRange.max - config.queueSizeRange.min) * 
    Math.min(1, loadFactor * config.loadToQueueRatio)
  );

  // Apply gradual adjustment (max 20% change per adjustment)
  const maxConcurrencyChange = Math.floor(oldConcurrency * 0.2);
  const newConcurrency = Math.max(
    config.maxConcurrencyRange.min,
    Math.min(
      config.maxConcurrencyRange.max,
      targetConcurrency > oldConcurrency 
        ? Math.min(targetConcurrency, oldConcurrency + maxConcurrencyChange)
        : Math.max(targetConcurrency, oldConcurrency - maxConcurrencyChange)
    )
  );

  const maxQueueChange = Math.floor(oldQueueSize * 0.2);
  const newQueueSize = Math.max(
    config.queueSizeRange.min,
    Math.min(
      config.queueSizeRange.max,
      targetQueueSize > oldQueueSize
        ? Math.min(targetQueueSize, oldQueueSize + maxQueueChange)
        : Math.max(targetQueueSize, oldQueueSize - maxQueueChange)
    )
  );

  // Check if adjustment is needed
  if (newConcurrency === oldConcurrency && newQueueSize === oldQueueSize) {
    span.setStatus({ code: SpanStatusCode.OK, message: 'No adjustment needed' });
    span.end();
    return null;
  }

  // Update settings
  settings.maxConcurrency = newConcurrency;
  settings.maxQueueSize = newQueueSize;
  settings.currentLoad = currentLoad;
  settings.predictedLoad = predictedLoad;
  settings.lastAdjusted = now;
  settings.adjustmentCount++;
  settings.isThrottled = predictedLoad > 80;

  // Create adjustment record
  const adjustment: BulkheadAdjustment = {
    service,
    timestamp: now,
    previousConcurrency: oldConcurrency,
    newConcurrency,
    previousQueueSize: oldQueueSize,
    newQueueSize,
    reason: `Predicted load: ${predictedLoad.toFixed(1)}% (current: ${currentLoad.toFixed(1)}%)`,
    predictedLoad,
    confidence,
  };

  adjustmentHistory.unshift(adjustment);
  if (adjustmentHistory.length > MAX_HISTORY_SIZE) {
    adjustmentHistory.pop();
  }

  logger.info(`[PredictiveBulkhead] Adjusted ${service}`, {
    concurrency: `${oldConcurrency} → ${newConcurrency}`,
    queueSize: `${oldQueueSize} → ${newQueueSize}`,
    predictedLoad: `${predictedLoad.toFixed(1)}%`,
    confidence: confidence.toFixed(2),
  });

  // Trace
  const adjustSpan = tracer.startSpan('predictive_bulkhead.adjustment', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'bulkhead.service': service,
      'bulkhead.old_concurrency': oldConcurrency,
      'bulkhead.new_concurrency': newConcurrency,
      'bulkhead.old_queue': oldQueueSize,
      'bulkhead.new_queue': newQueueSize,
      'bulkhead.predicted_load': predictedLoad,
      'bulkhead.confidence': confidence,
    },
  });
  adjustSpan.end();

  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  return adjustment;
}

/**
 * Adjust all services
 */
export function adjustAllBulkheads(): BulkheadAdjustment[] {
  const span = tracer.startSpan('predictive_bulkhead.adjust_all', {
    kind: SpanKind.INTERNAL,
  });

  const adjustments: BulkheadAdjustment[] = [];

  for (const service of PREDICTIVE_SERVICES) {
    const adjustment = adjustBulkheadForService(service);
    if (adjustment) {
      adjustments.push(adjustment);
    }
  }

  span.setAttribute('bulkhead.adjustments_count', adjustments.length);
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  return adjustments;
}

// ============================================
// ROUTING DECISIONS
// ============================================

/**
 * Make routing decision for a request
 */
export function makeRoutingDecision(
  preferredService: string,
  priority: number = 50
): RoutingDecision {
  const span = tracer.startSpan('predictive_bulkhead.routing_decision', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'routing.preferred_service': preferredService,
      'routing.priority': priority,
    },
  });

  const settings = bulkheadSettings.get(preferredService);
  
  if (!settings) {
    const decision: RoutingDecision = {
      service: preferredService,
      canAccept: true,
      priorityBoost: 0,
      estimatedWaitTime: 0,
    };
    
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
    return decision;
  }

  // Check if service can accept based on current concurrency
  const currentConcurrency = Math.floor(settings.currentLoad / 10); // Simulated
  const canAccept = currentConcurrency < settings.maxConcurrency;

  // Calculate priority boost based on urgency
  const priorityBoost = settings.predictedLoad > 70 ? 10 : 0;

  // Estimate wait time
  const queueDepth = Math.max(0, currentConcurrency - settings.maxConcurrency);
  const estimatedWaitTime = queueDepth > 0 
    ? queueDepth * 100 // ~100ms per queued request
    : 0;

  // Find alternatives if preferred service is saturated
  let alternativeServices: string[] | undefined;
  
  if (!canAccept) {
    alternativeServices = PREDICTIVE_SERVICES
      .filter(s => {
        if (s === preferredService) return false;
        const altSettings = bulkheadSettings.get(s);
        if (!altSettings) return false;
        return altSettings.maxConcurrency > Math.floor(altSettings.currentLoad / 10);
      })
      .slice(0, 2);
  }

  const decision: RoutingDecision = {
    service: preferredService,
    canAccept,
    priorityBoost,
    estimatedWaitTime,
    alternativeServices: alternativeServices?.length ? alternativeServices : undefined,
  };

  span.setAttributes({
    'routing.can_accept': canAccept,
    'routing.priority_boost': priorityBoost,
    'routing.estimated_wait': estimatedWaitTime,
  });
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  return decision;
}

// ============================================
// INTELLIGENT REQUEST HANDLING
// ============================================

/**
 * Get current bulkhead status for a service
 */
export function getBulkheadStatus(service: string): {
  maxConcurrency: number;
  currentConcurrency: number;
  availableSlots: number;
  queueUtilization: number;
  isThrottled: boolean;
  predictedLoad: number;
} {
  const settings = bulkheadSettings.get(service);
  
  if (!settings) {
    return {
      maxConcurrency: 50,
      currentConcurrency: 0,
      availableSlots: 50,
      queueUtilization: 0,
      isThrottled: false,
      predictedLoad: 0,
    };
  }

  const currentConcurrency = Math.floor(settings.currentLoad / 10);
  const queueDepth = Math.max(0, currentConcurrency - settings.maxConcurrency);
  const queueUtilization = Math.min(100, (queueDepth / settings.maxQueueSize) * 100);

  return {
    maxConcurrency: settings.maxConcurrency,
    currentConcurrency,
    availableSlots: Math.max(0, settings.maxConcurrency - currentConcurrency),
    queueUtilization,
    isThrottled: settings.isThrottled,
    predictedLoad: settings.predictedLoad,
  };
}

/**
 * Check if request can proceed through bulkhead
 */
export function canProceedThroughBulkhead(service: string, priority: number = 50): {
  allowed: boolean;
  queuePosition: number;
  estimatedWaitMs: number;
} {
  const status = getBulkheadStatus(service);
  
  // High priority bypass queue when predicted load is critical
  if (priority >= 80 && status.predictedLoad > 80) {
    return {
      allowed: true,
      queuePosition: 0,
      estimatedWaitMs: 0,
    };
  }

  if (status.availableSlots > 0) {
    return {
      allowed: true,
      queuePosition: 0,
      estimatedWaitMs: 0,
    };
  }

  // Calculate queue position
  const queueDepth = Math.floor(status.queueUtilization / 100 * 50); // Estimated
  const priorityQueuePosition = Math.max(0, queueDepth - Math.floor(priority / 10));

  return {
    allowed: status.queueUtilization < 80, // Allow queueing up to 80%
    queuePosition: priorityQueuePosition,
    estimatedWaitMs: priorityQueuePosition * 50, // 50ms per position
  };
}

// ============================================
// MONITORING LOOP
// ============================================

export function startBulkheadMonitor(): void {
  if (adjustmentInterval) {
    logger.warn('[PredictiveBulkhead] Monitor already running');
    return;
  }

  if (!PREDICTIVE_BULKHEAD_CONFIG.enabled) {
    logger.info('[PredictiveBulkhead] Predictive bulkhead disabled');
    return;
  }

  logger.info('[PredictiveBulkhead] Starting bulkhead monitor');

  adjustmentInterval = setInterval(() => {
    adjustAllBulkheads();
  }, PREDICTIVE_BULKHEAD_CONFIG.adjustmentIntervalMs);
}

export function stopBulkheadMonitor(): void {
  if (adjustmentInterval) {
    clearInterval(adjustmentInterval);
    adjustmentInterval = null;
    logger.info('[PredictiveBulkhead] Monitor stopped');
  }
}

// ============================================
// MANUAL OVERRIDE
// ============================================

/**
 * Manually set bulkhead parameters
 */
export function manualSetBulkhead(
  service: string, 
  maxConcurrency: number, 
  maxQueueSize: number
): void {
  const config = PREDICTIVE_BULKHEAD_CONFIG;
  const settings = bulkheadSettings.get(service);
  
  if (!settings) {
    throw new Error(`Service ${service} not found`);
  }

  // Validate bounds
  const validatedConcurrency = Math.max(
    config.maxConcurrencyRange.min,
    Math.min(config.maxConcurrencyRange.max, maxConcurrency)
  );
  
  const validatedQueueSize = Math.max(
    config.queueSizeRange.min,
    Math.min(config.queueSizeRange.max, maxQueueSize)
  );

  settings.maxConcurrency = validatedConcurrency;
  settings.maxQueueSize = validatedQueueSize;
  settings.lastAdjusted = Date.now();

  logger.info(`[PredictiveBulkhead] Manual override for ${service}`, {
    concurrency: validatedConcurrency,
    queueSize: validatedQueueSize,
  });
}

/**
 * Emergency throttle - immediately reduce capacity
 */
export function emergencyThrottle(service: string): void {
  const settings = bulkheadSettings.get(service);
  if (!settings) return;

  // Reduce to minimum
  const config = PREDICTIVE_BULKHEAD_CONFIG;
  settings.maxConcurrency = Math.max(
    5,
    Math.floor(settings.maxConcurrency * 0.5)
  );
  settings.maxQueueSize = Math.floor(settings.maxQueueSize * 0.7);
  settings.isThrottled = true;
  settings.lastAdjusted = Date.now();

  logger.warn(`[PredictiveBulkhead] Emergency throttle for ${service}`, {
    newConcurrency: settings.maxConcurrency,
    newQueueSize: settings.maxQueueSize,
  });
}

// ============================================
// HEALTH & METRICS
// ============================================

export function getPredictiveBulkheadHealth(): {
  enabled: boolean;
  isRunning: boolean;
  services: BulkheadSettings[];
  recentAdjustments: BulkheadAdjustment[];
  totalAdjustments24h: number;
} {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;

  const recentAdjustments = adjustmentHistory.filter(a => a.timestamp > dayAgo);

  return {
    enabled: PREDICTIVE_BULKHEAD_CONFIG.enabled,
    isRunning: adjustmentInterval !== null,
    services: Array.from(bulkheadSettings.values()),
    recentAdjustments: adjustmentHistory.slice(0, 10),
    totalAdjustments24h: recentAdjustments.length,
  };
}

export function getServiceBulkheadSettings(service: string): BulkheadSettings | undefined {
  return bulkheadSettings.get(service);
}

export function getAdjustmentHistory(limit: number = 50): BulkheadAdjustment[] {
  return adjustmentHistory.slice(0, limit);
}

// ============================================
// RESET
// ============================================

export function resetPredictiveBulkhead(): void {
  stopBulkheadMonitor();
  adjustmentHistory.length = 0;
  initializePredictiveBulkhead();
  
  logger.info('[PredictiveBulkhead] Reset complete');
}

export { bulkheadSettings, adjustmentHistory };
