/**
 * Auto-Scaling Service
 * 
 * Intelligent auto-scaling based on predictive load and reactive metrics.
 * 
 * Features:
 * - Predictive scaling (scale before load hits)
 * - Reactive scaling (respond to current metrics)
 * - Hybrid approach (combine both for optimal scaling)
 * - Scaling policies with cooldowns
 * - Integration with Kubernetes HPA or custom scaling
 * - Full traceability and observability
 */

import { 
  trace, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import { logger } from '../middleware/correlation-logger.middleware';
import { 
  AUTO_SCALING_CONFIG,
  PREDICTIVE_SERVICES,
  SERVICE_PRIORITIES,
  type ScalingStrategy,
} from './predictive-config';
import { predictServiceLoad, type ServicePrediction, type ScalingRecommendation } from './predictive-load.service';

// ============================================
// TYPES
// ============================================

export interface ScalingEvent {
  id: string;
  timestamp: number;
  service: string;
  action: 'scale_up' | 'scale_down' | 'maintain';
  previousReplicas: number;
  targetReplicas: number;
  reason: string;
  trigger: 'predictive' | 'reactive' | 'manual' | 'auto_heal';
  confidence?: number;
  predictedLoad?: number;
  currentLoad?: number;
  spanId?: string;
}

export interface ServiceScalingState {
  service: string;
  currentReplicas: number;
  targetReplicas: number;
  lastScaleUp: number;
  lastScaleDown: number;
  scalingHistory: ScalingEvent[];
  isScaling: boolean;
  predictedLoad: number;
  currentLoad: number;
  cpuUtilization: number;
  memoryUtilization: number;
}

export interface ScalingDecision {
  service: string;
  shouldScale: boolean;
  action: 'scale_up' | 'scale_down' | 'maintain';
  targetReplicas: number;
  reason: string;
  confidence: number;
  urgency: 'immediate' | 'soon' | 'normal';
}

// ============================================
// STATE MANAGEMENT
// ============================================

// Service scaling states
const serviceStates: Map<string, ServiceScalingState> = new Map();

// Scaling event history (last 100 events)
const scalingEventHistory: ScalingEvent[] = [];
const MAX_HISTORY_SIZE = 100;

// Tracer
const tracer = trace.getTracer('auto-scaling');

// Monitoring interval
let scalingMonitorInterval: NodeJS.Timeout | null = null;

// ============================================
// INITIALIZATION
// ============================================

export function initializeAutoScaling(): void {
  logger.info('[AutoScaling] Initializing auto-scaling service');

  // Initialize state for all services
  for (const service of PREDICTIVE_SERVICES) {
    serviceStates.set(service, {
      service,
      currentReplicas: AUTO_SCALING_CONFIG.minReplicas,
      targetReplicas: AUTO_SCALING_CONFIG.minReplicas,
      lastScaleUp: 0,
      lastScaleDown: 0,
      scalingHistory: [],
      isScaling: false,
      predictedLoad: 0,
      currentLoad: 0,
      cpuUtilization: 0,
      memoryUtilization: 0,
    });
  }

  logger.info('[AutoScaling] Initialized', {
    services: PREDICTIVE_SERVICES.length,
    minReplicas: AUTO_SCALING_CONFIG.minReplicas,
    maxReplicas: AUTO_SCALING_CONFIG.maxReplicas,
    strategy: AUTO_SCALING_CONFIG.strategy,
  });
}

// ============================================
// SCALING DECISION LOGIC
// ============================================

/**
 * Make scaling decision for a service
 */
export function makeScalingDecision(service: string): ScalingDecision {
  const span = tracer.startSpan('autoscaling.decide', {
    kind: SpanKind.INTERNAL,
    attributes: { 'autoscaling.service': service },
  });

  const state = serviceStates.get(service);
  if (!state) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: 'Service not found' });
    span.end();
    throw new Error(`Service ${service} not initialized`);
  }

  const now = Date.now();
  const config = AUTO_SCALING_CONFIG;

  // Get predictive load
  const prediction = predictServiceLoad(service);
  const predictedLoad = prediction.predictedLoad;
  const currentLoad = prediction.currentLoad;
  const confidence = prediction.confidence;

  // Update state
  state.predictedLoad = predictedLoad;
  state.currentLoad = currentLoad;

  // Check cooldowns
  const scaleUpCooldownRemaining = state.lastScaleUp + config.scaleUpCooldownMs - now;
  const scaleDownCooldownRemaining = state.lastScaleDown + config.scaleDownCooldownMs - now;

  let decision: ScalingDecision = {
    service,
    shouldScale: false,
    action: 'maintain',
    targetReplicas: state.currentReplicas,
    reason: 'Within normal parameters',
    confidence,
    urgency: 'normal',
  };

  // Check if we can scale
  if (state.isScaling) {
    decision.reason = 'Scaling already in progress';
    span.setAttributes({
      'autoscaling.decision': 'maintain',
      'autoscaling.reason': decision.reason,
    });
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
    return decision;
  }

  // PREDICTIVE SCALING (if enabled)
  if ((config.strategy === 'predictive' || config.strategy === 'hybrid') && confidence > 0.7) {
    // Predictive scale up
    if (predictedLoad > config.scaleUpThreshold && scaleUpCooldownRemaining <= 0) {
      if (state.currentReplicas < config.maxReplicas) {
        const step = Math.min(config.scaleUpStep, config.maxReplicas - state.currentReplicas);
        decision = {
          service,
          shouldScale: true,
          action: 'scale_up',
          targetReplicas: state.currentReplicas + step,
          reason: `Predictive: load will reach ${predictedLoad.toFixed(1)}% in ${AUTO_SCALING_CONFIG.predictiveLeadTimeMs / 1000}s`,
          confidence,
          urgency: predictedLoad > 85 ? 'immediate' : 'soon',
        };
      }
    }
    
    // Predictive scale down
    else if (predictedLoad < config.scaleDownThreshold && 
             currentLoad < config.scaleDownThreshold && 
             scaleDownCooldownRemaining <= 0) {
      if (state.currentReplicas > config.minReplicas) {
        const step = Math.min(config.scaleDownStep, state.currentReplicas - config.minReplicas);
        decision = {
          service,
          shouldScale: true,
          action: 'scale_down',
          targetReplicas: state.currentReplicas - step,
          reason: `Predictive: load will drop to ${predictedLoad.toFixed(1)}%`,
          confidence,
          urgency: 'normal',
        };
      }
    }
  }

  // REACTIVE SCALING (if enabled and no predictive action)
  if ((config.strategy === 'reactive' || config.strategy === 'hybrid') && !decision.shouldScale) {
    // Reactive scale up
    if (currentLoad > config.scaleUpThreshold && scaleUpCooldownRemaining <= 0) {
      if (state.currentReplicas < config.maxReplicas) {
        const step = Math.min(config.scaleUpStep, config.maxReplicas - state.currentReplicas);
        decision = {
          service,
          shouldScale: true,
          action: 'scale_up',
          targetReplicas: state.currentReplicas + step,
          reason: `Reactive: current load at ${currentLoad.toFixed(1)}%`,
          confidence: 1.0, // Reactive is certain
          urgency: currentLoad > 85 ? 'immediate' : 'soon',
        };
      }
    }
    
    // Reactive scale down
    else if (currentLoad < config.scaleDownThreshold && scaleDownCooldownRemaining <= 0) {
      if (state.currentReplicas > config.minReplicas) {
        const step = Math.min(config.scaleDownStep, state.currentReplicas - config.minReplicas);
        decision = {
          service,
          shouldScale: true,
          action: 'scale_down',
          targetReplicas: state.currentReplicas - step,
          reason: `Reactive: current load at ${currentLoad.toFixed(1)}%`,
          confidence: 1.0,
          urgency: 'normal',
        };
      }
    }
  }

  // Override based on urgency
  if (currentLoad > 90 && decision.action !== 'scale_up') {
    // Emergency override - scale up immediately regardless of cooldown
    if (state.currentReplicas < config.maxReplicas) {
      decision = {
        service,
        shouldScale: true,
        action: 'scale_up',
        targetReplicas: Math.min(state.currentReplicas + config.scaleUpStep * 2, config.maxReplicas),
        reason: `EMERGENCY: Critical load at ${currentLoad.toFixed(1)}%`,
        confidence: 1.0,
        urgency: 'immediate',
      };
    }
  }

  span.setAttributes({
    'autoscaling.decision': decision.action,
    'autoscaling.should_scale': decision.shouldScale,
    'autoscaling.target_replicas': decision.targetReplicas,
    'autoscaling.confidence': decision.confidence,
    'autoscaling.urgency': decision.urgency,
  });
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  return decision;
}

/**
 * Execute scaling action
 */
export async function executeScaling(decision: ScalingDecision): Promise<ScalingEvent | null> {
  if (!decision.shouldScale) return null;

  const span = tracer.startSpan('autoscaling.execute', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'autoscaling.service': decision.service,
      'autoscaling.action': decision.action,
      'autoscaling.target_replicas': decision.targetReplicas,
    },
  });

  const state = serviceStates.get(decision.service);
  if (!state) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: 'Service not found' });
    span.end();
    return null;
  }

  const now = Date.now();

  // Mark as scaling
  state.isScaling = true;
  state.targetReplicas = decision.targetReplicas;

  // Create scaling event
  const event: ScalingEvent = {
    id: `scale-${now}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: now,
    service: decision.service,
    action: decision.action,
    previousReplicas: state.currentReplicas,
    targetReplicas: decision.targetReplicas,
    reason: decision.reason,
    trigger: decision.confidence < 1.0 ? 'predictive' : 'reactive',
    confidence: decision.confidence,
    predictedLoad: state.predictedLoad,
    currentLoad: state.currentLoad,
    spanId: span.spanContext().spanId,
  };

  logger.warn(`[AutoScaling] ${decision.action.toUpperCase()} ${decision.service}`, {
    from: state.currentReplicas,
    to: decision.targetReplicas,
    reason: decision.reason,
    urgency: decision.urgency,
    trigger: event.trigger,
  });

  try {
    // Perform actual scaling (simulated - integrate with K8s HPA or Docker Swarm)
    await performActualScaling(decision.service, decision.targetReplicas);

    // Update state
    state.currentReplicas = decision.targetReplicas;
    state.isScaling = false;
    
    if (decision.action === 'scale_up') {
      state.lastScaleUp = now;
    } else {
      state.lastScaleDown = now;
    }

    // Add to history
    state.scalingHistory.unshift(event);
    if (state.scalingHistory.length > 10) {
      state.scalingHistory.pop();
    }

    scalingEventHistory.unshift(event);
    if (scalingEventHistory.length > MAX_HISTORY_SIZE) {
      scalingEventHistory.pop();
    }

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    return event;
  } catch (error) {
    state.isScaling = false;
    
    logger.error(`[AutoScaling] Scaling failed for ${decision.service}:`, error);
    
    span.recordException(error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: 'Scaling failed' });
    span.end();

    return null;
  }
}

/**
 * Perform actual scaling (integration point for K8s/Docker)
 */
async function performActualScaling(service: string, targetReplicas: number): Promise<void> {
  const span = tracer.startSpan('autoscaling.perform_scaling', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'autoscaling.service': service,
      'autoscaling.target_replicas': targetReplicas,
    },
  });

  // Simulate scaling delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // TODO: Integrate with actual orchestration
  // Kubernetes HPA API:
  // - kubectl scale deployment ${service} --replicas=${targetReplicas}
  // - Or use Kubernetes client library
  
  // Docker Swarm:
  // - docker service scale ${service}=${targetReplicas}
  
  // AWS ECS:
  // - Update service with new desired count
  
  // Custom cloud provider APIs...

  logger.info(`[AutoScaling] Scaled ${service} to ${targetReplicas} replicas`);

  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
}

// ============================================
// MANUAL SCALING
// ============================================

/**
 * Manually scale a service
 */
export async function manualScale(service: string, targetReplicas: number): Promise<ScalingEvent | null> {
  const state = serviceStates.get(service);
  if (!state) {
    throw new Error(`Service ${service} not found`);
  }

  if (targetReplicas < AUTO_SCALING_CONFIG.minReplicas || 
      targetReplicas > AUTO_SCALING_CONFIG.maxReplicas) {
    throw new Error(`Target replicas must be between ${AUTO_SCALING_CONFIG.minReplicas} and ${AUTO_SCALING_CONFIG.maxReplicas}`);
  }

  const decision: ScalingDecision = {
    service,
    shouldScale: true,
    action: targetReplicas > state.currentReplicas ? 'scale_up' : 'scale_down',
    targetReplicas,
    reason: 'Manual scaling requested',
    confidence: 1.0,
    urgency: 'normal',
  };

  const event = await executeScaling(decision);
  if (event) {
    event.trigger = 'manual';
  }

  return event;
}

/**
 * Emergency scale up (immediate)
 */
export async function emergencyScaleUp(service: string, additionalReplicas: number = 4): Promise<ScalingEvent | null> {
  const state = serviceStates.get(service);
  if (!state) {
    throw new Error(`Service ${service} not found`);
  }

  const targetReplicas = Math.min(
    state.currentReplicas + additionalReplicas,
    AUTO_SCALING_CONFIG.maxReplicas
  );

  const decision: ScalingDecision = {
    service,
    shouldScale: true,
    action: 'scale_up',
    targetReplicas,
    reason: 'EMERGENCY: Critical system overload',
    confidence: 1.0,
    urgency: 'immediate',
  };

  // Bypass cooldown
  state.lastScaleUp = 0;

  return executeScaling(decision);
}

// ============================================
// MONITORING LOOP
// ============================================

export function startAutoScalingMonitor(): void {
  if (scalingMonitorInterval) {
    logger.warn('[AutoScaling] Monitor already running');
    return;
  }

  if (!AUTO_SCALING_CONFIG.enabled) {
    logger.info('[AutoScaling] Auto-scaling disabled in config');
    return;
  }

  logger.info('[AutoScaling] Starting auto-scaling monitor');

  // Check every 10 seconds
  scalingMonitorInterval = setInterval(async () => {
    for (const service of PREDICTIVE_SERVICES) {
      try {
        const decision = makeScalingDecision(service);
        
        if (decision.shouldScale) {
          await executeScaling(decision);
        }
      } catch (error) {
        logger.error(`[AutoScaling] Error processing ${service}:`, error);
      }
    }
  }, 10000);
}

export function stopAutoScalingMonitor(): void {
  if (scalingMonitorInterval) {
    clearInterval(scalingMonitorInterval);
    scalingMonitorInterval = null;
    logger.info('[AutoScaling] Monitor stopped');
  }
}

// ============================================
// HEALTH & METRICS
// ============================================

export function getAutoScalingHealth(): {
  enabled: boolean;
  isRunning: boolean;
  strategy: ScalingStrategy;
  services: ServiceScalingState[];
  recentEvents: ScalingEvent[];
  totalScaleUps24h: number;
  totalScaleDowns24h: number;
} {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;

  const recentEvents = scalingEventHistory.filter(e => e.timestamp > dayAgo);
  const scaleUps = recentEvents.filter(e => e.action === 'scale_up').length;
  const scaleDowns = recentEvents.filter(e => e.action === 'scale_down').length;

  return {
    enabled: AUTO_SCALING_CONFIG.enabled,
    isRunning: scalingMonitorInterval !== null,
    strategy: AUTO_SCALING_CONFIG.strategy,
    services: Array.from(serviceStates.values()),
    recentEvents: scalingEventHistory.slice(0, 10),
    totalScaleUps24h: scaleUps,
    totalScaleDowns24h: scaleDowns,
  };
}

export function getServiceScalingState(service: string): ServiceScalingState | undefined {
  return serviceStates.get(service);
}

export function getScalingHistory(limit: number = 100): ScalingEvent[] {
  return scalingEventHistory.slice(0, limit);
}

// ============================================
// RESET
// ============================================

export function resetAutoScaling(): void {
  stopAutoScalingMonitor();
  scalingEventHistory.length = 0;
  
  for (const [service, state] of serviceStates) {
    state.currentReplicas = AUTO_SCALING_CONFIG.minReplicas;
    state.targetReplicas = AUTO_SCALING_CONFIG.minReplicas;
    state.lastScaleUp = 0;
    state.lastScaleDown = 0;
    state.scalingHistory = [];
    state.isScaling = false;
  }

  logger.info('[AutoScaling] Reset complete');
}

export { serviceStates, scalingEventHistory };
