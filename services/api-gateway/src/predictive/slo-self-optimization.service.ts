/**
 * SLO Self-Optimization Service
 * 
 * Automatically adjusts SLO thresholds and resilience parameters based on:
 * - Historical SLO achievement rates
 * - System performance trends
 * - Error budget consumption
 * 
 * Self-optimizing parameters:
 * - Latency thresholds (P95, P99)
 * - Error rate thresholds
 * - Circuit breaker sensitivity
 * - Bulkhead concurrency limits
 * - Brownout activation thresholds
 */

import { 
  trace, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import { logger } from '../middleware/correlation-logger.middleware';
import { 
  SLO_SELF_OPTIMIZATION_CONFIG,
} from './predictive-config';
import { getSLOHealth } from '../adaptive/slo-guard.service';
import { predictServiceLoad } from './predictive-load.service';

interface SLOStatus {
  latencyP95Ms: number;
  latencyP99Ms: number;
  errorRatePercent: number;
  availabilityPercent: number;
  healthy: boolean;
  violations: Array<{ type: string }>;
}

export interface OptimizedParameter {
  name: string;
  currentValue: number;
  previousValue: number;
  targetValue: number;
  adjustment: number;
  reason: string;
  confidence: number;
}

export interface OptimizationResult {
  timestamp: number;
  parameters: OptimizedParameter[];
  sloAchievement: number;
  errorBudgetRemaining: number;
  strategy: string;
  applied: boolean;
}

export interface SLOLearningState {
  parameter: string;
  values: Array<{ value: number; timestamp: number; sloAchievement: number }>;
  learningRate: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastOptimized: number;
}

// ============================================
// STATE
// ============================================

const learningStates: Map<string, SLOLearningState> = new Map();
const optimizationHistory: OptimizationResult[] = [];
const MAX_HISTORY_SIZE = 50;

let optimizationInterval: NodeJS.Timeout | null = null;

const tracer = trace.getTracer('slo-optimization');

// Current optimized parameters
let currentParameters: Record<string, number> = {
  latency_p95_threshold: 300,
  latency_p99_threshold: 500,
  error_rate_threshold: 2,
  circuit_breaker_threshold: 5,
  bulkhead_concurrency: 50,
  brownout_activation_load: 80,
};

// ============================================
// INITIALIZATION
// ============================================

export function initializeSLOSelfOptimization(): void {
  logger.info('[SLOOptimization] Initializing SLO self-optimization');

  const config = SLO_SELF_OPTIMIZATION_CONFIG;

  // Initialize learning states
  for (const metric of config.metrics) {
    learningStates.set(metric, {
      parameter: metric,
      values: [],
      learningRate: config.learningRate,
      trend: 'stable',
      lastOptimized: Date.now(),
    });
  }

  logger.info('[SLOOptimization] Initialized', {
    parameters: config.metrics.length,
    strategy: config.optimizationStrategy,
    learningRate: config.learningRate,
  });
}

// ============================================
// OPTIMIZATION LOGIC
// ============================================

/**
 * Perform SLO self-optimization
 */
export function optimizeSLOs(): OptimizationResult {
  const span = tracer.startSpan('slo.optimize', {
    kind: SpanKind.INTERNAL,
  });

  const config = SLO_SELF_OPTIMIZATION_CONFIG;
  const now = Date.now();

  // Get current SLO status
  const sloHealth = getSLOHealth();
  const status = sloHealth.status as SLOStatus;
  
  // Calculate SLO achievement rate (0-1)
  const sloAchievement = calculateSLOAchievement(status);
  
  // Calculate error budget remaining
  const errorBudgetRemaining = 1 - (sloHealth.recentViolations.length / 100);

  const optimizedParams: OptimizedParameter[] = [];

  // Optimize each parameter
  for (const [paramName, currentValue] of Object.entries(currentParameters)) {
    const learningState = learningStates.get(paramName);
    if (!learningState) continue;

    // Check if enough time has passed since last optimization
    if (now - learningState.lastOptimized < config.optimizationIntervalMs) {
      continue;
    }

    const optimization = optimizeParameter(
      paramName,
      currentValue,
      learningState,
      status,
      sloAchievement,
      errorBudgetRemaining
    );

    if (optimization) {
      optimizedParams.push(optimization);
      learningState.lastOptimized = now;
      currentParameters[paramName] = optimization.targetValue;
    }
  }

  // Create result
  const result: OptimizationResult = {
    timestamp: now,
    parameters: optimizedParams,
    sloAchievement,
    errorBudgetRemaining,
    strategy: config.optimizationStrategy,
    applied: optimizedParams.length > 0,
  };

  // Add to history
  if (result.applied) {
    optimizationHistory.unshift(result);
    if (optimizationHistory.length > MAX_HISTORY_SIZE) {
      optimizationHistory.pop();
    }

    logger.info('[SLOOptimization] Optimization applied', {
      parameters: optimizedParams.length,
      sloAchievement: sloAchievement.toFixed(2),
      errorBudget: errorBudgetRemaining.toFixed(2),
    });
  }

  span.setAttributes({
    'slo.optimized_params': optimizedParams.length,
    'slo.achievement': sloAchievement,
    'slo.error_budget': errorBudgetRemaining,
  });
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  return result;
}

/**
 * Optimize a single parameter
 */
function optimizeParameter(
  name: string,
  currentValue: number,
  learningState: SLOLearningState,
  status: SLOStatus,
  sloAchievement: number,
  errorBudgetRemaining: number
): OptimizedParameter | null {
  
  const config = SLO_SELF_OPTIMIZATION_CONFIG;
  let adjustment = 0;
  let reason = '';
  let confidence = 0.5;

  // Heuristic-based optimization
  switch (config.optimizationStrategy) {
    case 'heuristic':
      ({ adjustment, reason, confidence } = heuristicOptimization(
        name,
        currentValue,
        status,
        sloAchievement,
        errorBudgetRemaining
      ));
      break;
      
    case 'gradient':
      ({ adjustment, reason, confidence } = gradientOptimization(
        name,
        currentValue,
        learningState,
        status
      ));
      break;
      
    case 'threshold':
      ({ adjustment, reason, confidence } = thresholdOptimization(
        name,
        currentValue,
        status,
        sloAchievement
      ));
      break;
  }

  // Apply learning rate
  adjustment *= config.learningRate;

  // Limit adjustment size
  const maxAdjustment = currentValue * (config.maxAdjustment / 100);
  adjustment = Math.max(-maxAdjustment, Math.min(maxAdjustment, adjustment));

  // Check if adjustment is significant
  const adjustmentPercent = Math.abs(adjustment / currentValue);
  if (adjustmentPercent < 0.02) { // Less than 2% change
    return null;
  }

  const targetValue = Math.round(currentValue + adjustment);

  return {
    name,
    currentValue,
    previousValue: currentValue,
    targetValue,
    adjustment,
    reason,
    confidence,
  };
}

// ============================================
// OPTIMIZATION STRATEGIES
// ============================================

/**
 * Heuristic-based optimization
 */
function heuristicOptimization(
  name: string,
  currentValue: number,
  status: SLOStatus,
  sloAchievement: number,
  errorBudgetRemaining: number
): { adjustment: number; reason: string; confidence: number } {
  let adjustment = 0;
  let reason = '';
  let confidence = 0.5;

  // If SLO achievement is high (>95%) and error budget is healthy, can tighten thresholds
  if (sloAchievement > 0.95 && errorBudgetRemaining > 0.5) {
    switch (name) {
      case 'latency_p95_threshold':
      case 'latency_p99_threshold':
        // Lower latency thresholds (tighten SLO)
        adjustment = -currentValue * 0.1;
        reason = 'High SLO achievement, tightening latency target';
        confidence = sloAchievement;
        break;
        
      case 'error_rate_threshold':
        // Lower error rate threshold
        adjustment = -currentValue * 0.05;
        reason = 'High SLO achievement, tightening error rate target';
        confidence = sloAchievement;
        break;
        
      case 'circuit_breaker_threshold':
        // Make circuit breaker more sensitive
        adjustment = -currentValue * 0.1;
        reason = 'Improving error detection sensitivity';
        confidence = sloAchievement * 0.8;
        break;
        
      case 'brownout_activation_load':
        // Activate brownout earlier (more conservative)
        adjustment = -currentValue * 0.05;
        reason = 'Proactive degradation for better SLO protection';
        confidence = sloAchievement * 0.7;
        break;
    }
  }
  
  // If SLO achievement is low or error budget exhausted, relax thresholds
  else if (sloAchievement < 0.8 || errorBudgetRemaining < 0.2) {
    switch (name) {
      case 'latency_p95_threshold':
      case 'latency_p99_threshold':
        // Increase latency thresholds (relax SLO)
        adjustment = currentValue * 0.15;
        reason = 'Low SLO achievement, relaxing latency target';
        confidence = 1 - sloAchievement;
        break;
        
      case 'error_rate_threshold':
        // Increase error rate threshold
        adjustment = currentValue * 0.1;
        reason = 'Low SLO achievement, relaxing error rate target';
        confidence = 1 - sloAchievement;
        break;
        
      case 'circuit_breaker_threshold':
        // Make circuit breaker less sensitive
        adjustment = currentValue * 0.2;
        reason = 'Reducing false positive circuit breaks';
        confidence = 1 - sloAchievement;
        break;
        
      case 'bulkhead_concurrency':
        // Increase concurrency to reduce queueing
        adjustment = currentValue * 0.1;
        reason = 'Improving throughput to meet latency targets';
        confidence = 1 - sloAchievement;
        break;
    }
  }

  // If currently violating SLO, make immediate adjustments
  if (!status.healthy) {
    const violations = status.violations;
    
    if (violations.some(v => v.type === 'latency_p95') && name === 'latency_p95_threshold') {
      adjustment = currentValue * 0.2;
      reason = 'Active P95 violation, relaxing threshold';
      confidence = 0.9;
    }
    
    if (violations.some(v => v.type === 'error_rate') && name === 'error_rate_threshold') {
      adjustment = currentValue * 0.15;
      reason = 'Active error rate violation, relaxing threshold';
      confidence = 0.9;
    }
  }

  return { adjustment, reason, confidence };
}

/**
 * Gradient-based optimization (simulated)
 */
function gradientOptimization(
  name: string,
  currentValue: number,
  learningState: SLOLearningState,
  status: SLOStatus
): { adjustment: number; reason: string; confidence: number } {
  const values = learningState.values.slice(-10);
  
  if (values.length < 5) {
    return { adjustment: 0, reason: 'Insufficient learning data', confidence: 0 };
  }

  // Calculate gradient (direction of improvement)
  const recent = values.slice(-5);
  const older = values.slice(-10, -5);
  
  const recentSLO = recent.reduce((sum, v) => sum + v.sloAchievement, 0) / recent.length;
  const olderSLO = older.reduce((sum, v) => sum + v.sloAchievement, 0) / older.length;
  
  const gradient = recentSLO - olderSLO;
  
  // Adjust based on gradient
  let adjustment = 0;
  if (gradient > 0) {
    // Improving - continue in same direction
    const lastChange = values[values.length - 1].value - values[values.length - 2]?.value || 0;
    adjustment = lastChange * 0.5;
  } else if (gradient < 0) {
    // Degrading - reverse direction
    const lastChange = values[values.length - 1].value - values[values.length - 2]?.value || 0;
    adjustment = -lastChange * 0.5;
  }

  return {
    adjustment,
    reason: `Gradient: ${gradient.toFixed(3)}`,
    confidence: Math.abs(gradient) * 2,
  };
}

/**
 * Threshold-based optimization
 */
function thresholdOptimization(
  name: string,
  currentValue: number,
  status: SLOStatus,
  sloAchievement: number
): { adjustment: number; reason: string; confidence: number } {
  let adjustment = 0;
  let reason = '';
  let confidence = 0.5;

  // Simple threshold rules
  if (sloAchievement > 0.99) {
    adjustment = -currentValue * 0.05; // Tighten
    reason = 'Exceptional SLO achievement (>99%)';
    confidence = 0.8;
  } else if (sloAchievement > 0.95) {
    adjustment = -currentValue * 0.02; // Slight tighten
    reason = 'Good SLO achievement (>95%)';
    confidence = 0.6;
  } else if (sloAchievement < 0.8) {
    adjustment = currentValue * 0.1; // Relax
    reason = 'Poor SLO achievement (<80%)';
    confidence = 0.7;
  }

  return { adjustment, reason, confidence };
}

// ============================================
// HELPERS
// ============================================

/**
 * Calculate overall SLO achievement (0-1)
 */
function calculateSLOAchievement(status: SLOStatus): number {
  // Simple calculation based on current violations
  if (status.healthy) return 1.0;
  
  const weights: Record<string, number> = {
    latency_p95: 0.3,
    latency_p99: 0.2,
    error_rate: 0.3,
    availability: 0.2,
  };

  let penalty = 0;
  for (const violation of status.violations) {
    penalty += weights[violation.type] || 0.1;
  }

  return Math.max(0, 1 - penalty);
}

/**
 * Record parameter performance for learning
 */
export function recordParameterPerformance(
  parameter: string,
  value: number,
  sloAchievement: number
): void {
  const state = learningStates.get(parameter);
  if (!state) return;

  state.values.push({
    value,
    timestamp: Date.now(),
    sloAchievement,
  });

  // Keep only last 50 values
  if (state.values.length > 50) {
    state.values.shift();
  }

  // Update trend
  if (state.values.length >= 10) {
    const recent = state.values.slice(-5);
    const older = state.values.slice(-10, -5);
    
    const recentAvg = recent.reduce((s, v) => s + v.value, 0) / recent.length;
    const olderAvg = older.reduce((s, v) => s + v.value, 0) / older.length;
    
    if (recentAvg > olderAvg * 1.05) {
      state.trend = 'increasing';
    } else if (recentAvg < olderAvg * 0.95) {
      state.trend = 'decreasing';
    } else {
      state.trend = 'stable';
    }
  }
}

// ============================================
// MONITORING
// ============================================

export function startSLOSelfOptimizationMonitor(): void {
  if (optimizationInterval) {
    logger.warn('[SLOOptimization] Already running');
    return;
  }

  if (!SLO_SELF_OPTIMIZATION_CONFIG.enabled) {
    logger.info('[SLOOptimization] SLO self-optimization disabled');
    return;
  }

  logger.info('[SLOOptimization] Starting optimization monitor');

  // Optimize every 5 minutes
  optimizationInterval = setInterval(() => {
    optimizeSLOs();
  }, SLO_SELF_OPTIMIZATION_CONFIG.optimizationIntervalMs);
}

export function stopSLOSelfOptimizationMonitor(): void {
  if (optimizationInterval) {
    clearInterval(optimizationInterval);
    optimizationInterval = null;
    logger.info('[SLOOptimization] Stopped');
  }
}

// ============================================
// QUERY FUNCTIONS
// ============================================

export function getCurrentOptimizedParameters(): Record<string, number> {
  return { ...currentParameters };
}

export function getOptimizationHistory(limit: number = 50): OptimizationResult[] {
  return optimizationHistory.slice(0, limit);
}

export function getLearningState(parameter: string): SLOLearningState | undefined {
  return learningStates.get(parameter);
}

// ============================================
// HEALTH
// ============================================

export function getSLOSelfOptimizationHealth(): {
  enabled: boolean;
  isRunning: boolean;
  currentParameters: Record<string, number>;
  learningStates: SLOLearningState[];
  recentOptimizations: OptimizationResult[];
  totalOptimizations24h: number;
} {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;

  const recentOptimizations = optimizationHistory.filter(o => o.timestamp > dayAgo);

  return {
    enabled: SLO_SELF_OPTIMIZATION_CONFIG.enabled,
    isRunning: optimizationInterval !== null,
    currentParameters: getCurrentOptimizedParameters(),
    learningStates: Array.from(learningStates.values()),
    recentOptimizations: optimizationHistory.slice(0, 10),
    totalOptimizations24h: recentOptimizations.length,
  };
}

// ============================================
// RESET
// ============================================

export function resetSLOSelfOptimization(): void {
  stopSLOSelfOptimizationMonitor();
  optimizationHistory.length = 0;
  
  // Reset to defaults
  currentParameters = {
    latency_p95_threshold: 300,
    latency_p99_threshold: 500,
    error_rate_threshold: 2,
    circuit_breaker_threshold: 5,
    bulkhead_concurrency: 50,
    brownout_activation_load: 80,
  };

  for (const state of learningStates.values()) {
    state.values = [];
    state.trend = 'stable';
    state.lastOptimized = Date.now();
  }

  logger.info('[SLOOptimization] Reset complete');
}

export { learningStates, optimizationHistory, currentParameters };
