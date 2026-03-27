/**
 * Adaptive Configuration
 * 
 * Central configuration for the Adaptive Intelligence Layer.
 * Defines SLOs, thresholds, tiers, and adaptive parameters.
 */

import { logger } from '../middleware/correlation-logger.middleware';

// ============================================
// SLO DEFINITIONS (Service Level Objectives)
// ============================================

export interface SLODefinition {
  p95LatencyMs: number;      // 95th percentile latency target
  p99LatencyMs: number;      // 99th percentile latency target
  errorRatePercent: number;  // Maximum acceptable error rate
  availabilityPercent: number; // Target availability
}

export const SLO_TARGETS: SLODefinition = {
  p95LatencyMs: 300,        // 95% of requests under 300ms
  p99LatencyMs: 500,        // 99% of requests under 500ms
  errorRatePercent: 2,      // Less than 2% errors
  availabilityPercent: 99.9, // 99.9% uptime
};

// ============================================
// RATE LIMITING TIERS
// ============================================

export type UserTier = 'free' | 'premium' | 'enterprise' | 'admin' | 'internal';

export interface RateLimitTier {
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;       // Token bucket capacity
  refillRate: number;       // Tokens per second
}

export const RATE_LIMIT_TIERS: Record<UserTier, RateLimitTier> = {
  free: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    burstLimit: 10,
    refillRate: 1,          // 1 req/sec sustained
  },
  premium: {
    requestsPerMinute: 300,
    requestsPerHour: 10000,
    burstLimit: 50,
    refillRate: 5,          // 5 req/sec sustained
  },
  enterprise: {
    requestsPerMinute: 1000,
    requestsPerHour: 50000,
    burstLimit: 200,
    refillRate: 16,         // 16 req/sec sustained
  },
  admin: {
    requestsPerMinute: 2000,
    requestsPerHour: 100000,
    burstLimit: 500,
    refillRate: 33,         // 33 req/sec sustained
  },
  internal: {
    requestsPerMinute: 5000,
    requestsPerHour: 200000,
    burstLimit: 1000,
    refillRate: 83,         // 83 req/sec sustained
  },
};

// ============================================
// LOAD SHEDDING CONFIGURATION
// ============================================

export interface LoadSheddingConfig {
  // CPU thresholds
  cpuWarningPercent: number;
  cpuCriticalPercent: number;
  
  // Memory thresholds
  memoryWarningPercent: number;
  memoryCriticalPercent: number;
  
  // Event loop lag (ms)
  eventLoopWarningMs: number;
  eventLoopCriticalMs: number;
  
  // Active connections
  maxConnections: number;
  connectionWarningThreshold: number;
}

export const LOAD_SHEDDING_CONFIG: LoadSheddingConfig = {
  cpuWarningPercent: 70,
  cpuCriticalPercent: 85,
  memoryWarningPercent: 75,
  memoryCriticalPercent: 90,
  eventLoopWarningMs: 50,
  eventLoopCriticalMs: 200,
  maxConnections: 10000,
  connectionWarningThreshold: 8000,
};

// ============================================
// PRIORITY LEVELS
// ============================================

export type RequestPriority = 'critical' | 'high' | 'normal' | 'low' | 'background';

export interface PriorityConfig {
  weight: number;           // Queue weight (higher = served first)
  maxWaitTimeMs: number;  // Maximum time in queue before rejection
  canBeShed: boolean;     // Can this priority be shed under load?
  bulkheadBypass: boolean; // Can bypass bulkhead queue?
}

export const PRIORITY_CONFIGS: Record<RequestPriority, PriorityConfig> = {
  critical: {
    weight: 100,
    maxWaitTimeMs: 5000,
    canBeShed: false,
    bulkheadBypass: true,
  },
  high: {
    weight: 75,
    maxWaitTimeMs: 10000,
    canBeShed: false,
    bulkheadBypass: false,
  },
  normal: {
    weight: 50,
    maxWaitTimeMs: 15000,
    canBeShed: true,
    bulkheadBypass: false,
  },
  low: {
    weight: 25,
    maxWaitTimeMs: 20000,
    canBeShed: true,
    bulkheadBypass: false,
  },
  background: {
    weight: 10,
    maxWaitTimeMs: 60000,
    canBeShed: true,
    bulkheadBypass: false,
  },
};

// ============================================
// BROWNOUT MODE CONFIGURATION
// ============================================

export interface BrownoutFeature {
  name: string;
  enabled: boolean;
  priority: 'essential' | 'important' | 'nice-to-have';
  disableWhen: 'warning' | 'critical' | 'never';
}

export const BROWNOUT_FEATURES: BrownoutFeature[] = [
  // Essential - never disabled
  { name: 'auth', enabled: true, priority: 'essential', disableWhen: 'never' },
  { name: 'wallet_core', enabled: true, priority: 'essential', disableWhen: 'never' },
  
  // Important - disabled only in critical
  { name: 'marketplace_recommendations', enabled: true, priority: 'important', disableWhen: 'critical' },
  { name: 'traveler_insights', enabled: true, priority: 'important', disableWhen: 'critical' },
  { name: 'real_time_notifications', enabled: true, priority: 'important', disableWhen: 'critical' },
  
  // Nice-to-have - disabled in warning state
  { name: 'analytics_tracking', enabled: true, priority: 'nice-to-have', disableWhen: 'warning' },
  { name: 'detailed_logging', enabled: true, priority: 'nice-to-have', disableWhen: 'warning' },
  { name: 'marketing_pixels', enabled: true, priority: 'nice-to-have', disableWhen: 'warning' },
  { name: 'performance_metrics', enabled: true, priority: 'nice-to-have', disableWhen: 'warning' },
  { name: 'search_suggestions', enabled: true, priority: 'nice-to-have', disableWhen: 'warning' },
  { name: 'social_sharing', enabled: true, priority: 'nice-to-have', disableWhen: 'warning' },
];

// ============================================
// CIRCUIT BREAKER ADAPTIVE TUNING
// ============================================

export interface CircuitAdaptiveConfig {
  // Auto-adjust thresholds based on P95 latency
  latencyThresholdMs: number;
  
  // Error rate trend window
  errorTrendWindowSeconds: number;
  
  // Dynamic threshold adjustment
  increaseThresholdOnSpike: boolean;
  decreaseThresholdOnRecovery: boolean;
  
  // Minimum error threshold to prevent flapping
  minErrorThresholdPercent: number;
  maxErrorThresholdPercent: number;
}

export const CIRCUIT_ADAPTIVE_CONFIG: CircuitAdaptiveConfig = {
  latencyThresholdMs: 500,          // Tune if P95 > 500ms
  errorTrendWindowSeconds: 60,      // Look at 1-minute error trend
  increaseThresholdOnSpike: true,
  decreaseThresholdOnRecovery: true,
  minErrorThresholdPercent: 30,
  maxErrorThresholdPercent: 80,
};

// ============================================
// AUTO-RECOVERY CONFIGURATION
// ============================================

export interface AutoRecoveryConfig {
  // Stability window before restoring features
  stabilityWindowMs: number;
  
  // Gradual restoration steps
  restorationSteps: number;
  
  // Step interval
  stepIntervalMs: number;
  
  // Verification success rate needed
  verificationSuccessRate: number;
}

export const AUTO_RECOVERY_CONFIG: AutoRecoveryConfig = {
  stabilityWindowMs: 60000,         // 60 seconds of stability
  restorationSteps: 5,              // 5 gradual steps
  stepIntervalMs: 10000,            // 10 seconds between steps
  verificationSuccessRate: 95,    // 95% success rate required
};

// ============================================
// KAFKA ADAPTIVE THROTTLING
// ============================================

export interface KafkaAdaptiveConfig {
  // Producer throttling thresholds
  brokerLatencyThresholdMs: number;
  producerBufferThreshold: number;
  
  // Throttling levels
  mildThrottleDelayMs: number;
  aggressiveThrottleDelayMs: number;
  
  // Recovery
  recoveryLatencyThresholdMs: number;
}

export const KAFKA_ADAPTIVE_CONFIG: KafkaAdaptiveConfig = {
  brokerLatencyThresholdMs: 100,   // Throttle if broker latency > 100ms
  producerBufferThreshold: 1000,     // Throttle if buffer > 1000 messages
  mildThrottleDelayMs: 10,          // Add 10ms delay
  aggressiveThrottleDelayMs: 100,   // Add 100ms delay
  recoveryLatencyThresholdMs: 50,    // Resume normal if latency < 50ms
};

// ============================================
// OVERLOAD STATE DEFINITIONS
// ============================================

export type OverloadState = 'normal' | 'degraded' | 'critical' | 'recovery';

export interface OverloadThresholds {
  degraded: {
    cpuPercent: number;
    memoryPercent: number;
    eventLoopLagMs: number;
  };
  critical: {
    cpuPercent: number;
    memoryPercent: number;
    eventLoopLagMs: number;
  };
}

export const OVERLOAD_THRESHOLDS: OverloadThresholds = {
  degraded: {
    cpuPercent: 70,
    memoryPercent: 75,
    eventLoopLagMs: 50,
  },
  critical: {
    cpuPercent: 85,
    memoryPercent: 90,
    eventLoopLagMs: 200,
  },
};

// ============================================
// METRIC WINDOWS (for SLO calculation)
// ============================================

export interface MetricWindowConfig {
  latencyWindowMs: number;
  errorRateWindowMs: number;
  throughputWindowMs: number;
}

export const METRIC_WINDOWS: MetricWindowConfig = {
  latencyWindowMs: 60000,      // 1 minute for latency percentiles
  errorRateWindowMs: 300000,   // 5 minutes for error rate
  throughputWindowMs: 60000,   // 1 minute for throughput
};

// ============================================
// DYNAMIC CONFIGURATION UPDATES
// ============================================

let runtimeConfig = {
  sloTargets: { ...SLO_TARGETS },
  loadShedding: { ...LOAD_SHEDDING_CONFIG },
  rateLimitTiers: { ...RATE_LIMIT_TIERS },
  brownoutFeatures: [...BROWNOUT_FEATURES],
  circuitAdaptive: { ...CIRCUIT_ADAPTIVE_CONFIG },
  autoRecovery: { ...AUTO_RECOVERY_CONFIG },
  kafkaAdaptive: { ...KAFKA_ADAPTIVE_CONFIG },
  overloadThresholds: { ...OVERLOAD_THRESHOLDS },
};

export function updateRuntimeConfig(updates: Partial<typeof runtimeConfig>): void {
  runtimeConfig = { ...runtimeConfig, ...updates };
  logger.info('[AdaptiveConfig] Runtime configuration updated', updates);
}

export function getRuntimeConfig(): typeof runtimeConfig {
  return { ...runtimeConfig };
}

export function resetToDefaults(): void {
  runtimeConfig = {
    sloTargets: { ...SLO_TARGETS },
    loadShedding: { ...LOAD_SHEDDING_CONFIG },
    rateLimitTiers: { ...RATE_LIMIT_TIERS },
    brownoutFeatures: [...BROWNOUT_FEATURES],
    circuitAdaptive: { ...CIRCUIT_ADAPTIVE_CONFIG },
    autoRecovery: { ...AUTO_RECOVERY_CONFIG },
    kafkaAdaptive: { ...KAFKA_ADAPTIVE_CONFIG },
    overloadThresholds: { ...OVERLOAD_THRESHOLDS },
  };
  logger.info('[AdaptiveConfig] Configuration reset to defaults');
}
