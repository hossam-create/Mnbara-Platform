/**
 * Predictive Kafka Throttling Service
 * 
 * Monitors Kafka producer/consumer lag and preemptively adjusts rates
 * based on predicted load patterns.
 * 
 * Features:
 * - Monitor consumer lag
 * - Preemptive pause/resume of consumers
 * - Producer rate limiting based on predictions
 * - Backpressure detection and mitigation
 */

import { 
  trace, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import { logger } from '../middleware/correlation-logger.middleware';
import { 
  PREDICTIVE_KAFKA_CONFIG,
} from './predictive-config';
import { predictServiceLoad } from './predictive-load.service';

// ============================================
// TYPES
// ============================================

export interface KafkaTopicMetrics {
  topic: string;
  consumerGroup: string;
  partition: number;
  currentOffset: number;
  logEndOffset: number;
  lag: number;
  consumeRate: number;      // msgs/sec
  produceRate: number;        // msgs/sec
  lastUpdated: number;
}

export interface ProducerThrottlingState {
  topic: string;
  currentRateLimit: number;   // msgs/sec
  targetRateLimit: number;
  isThrottled: boolean;
  throttleReason?: string;
  lastAdjustment: number;
}

export interface ConsumerPauseState {
  consumerGroup: string;
  isPaused: boolean;
  pausedAt?: number;
  resumeAt?: number;
  pauseReason?: string;
  predictedResumeAt?: number;
}

// ============================================
// STATE
// ============================================

const topicMetrics: Map<string, KafkaTopicMetrics[]> = new Map();
const producerStates: Map<string, ProducerThrottlingState> = new Map();
const consumerStates: Map<string, ConsumerPauseState> = new Map();

let monitoringInterval: NodeJS.Timeout | null = null;
let throttlingInterval: NodeJS.Timeout | null = null;

const tracer = trace.getTracer('predictive-kafka');

// Topics to monitor
const MONITORED_TOPICS = [
  'activity-events',
  'wallet-transactions',
  'traveler-updates',
  'marketplace-events',
  'notifications',
];

// ============================================
// INITIALIZATION
// ============================================

export function initializePredictiveKafka(): void {
  logger.info('[PredictiveKafka] Initializing predictive Kafka throttling');

  const config = PREDICTIVE_KAFKA_CONFIG;

  // Initialize producer states for each topic
  for (const topic of MONITORED_TOPICS) {
    producerStates.set(topic, {
      topic,
      currentRateLimit: config.producerRateLimitRange.max,
      targetRateLimit: config.producerRateLimitRange.max,
      isThrottled: false,
      lastAdjustment: Date.now(),
    });
  }

  logger.info('[PredictiveKafka] Initialized', {
    topics: MONITORED_TOPICS.length,
    lagThreshold: config.lagThreshold,
    rateLimitRange: `${config.producerRateLimitRange.min}-${config.producerRateLimitRange.max}`,
  });
}

// ============================================
// METRICS COLLECTION (Simulated - integrate with real Kafka client)
// ============================================

/**
 * Collect current Kafka metrics (simulated)
 */
export function collectKafkaMetrics(): void {
  const span = tracer.startSpan('predictive_kafka.collect_metrics', {
    kind: SpanKind.INTERNAL,
  });

  const now = Date.now();

  for (const topic of MONITORED_TOPICS) {
    // Simulate metrics collection
    // In production, integrate with Kafka AdminClient or metrics endpoint
    const metrics = simulateKafkaMetrics(topic, now);
    
    if (!topicMetrics.has(topic)) {
      topicMetrics.set(topic, []);
    }
    
    const history = topicMetrics.get(topic)!;
    history.push(...metrics);
    
    // Keep only last 5 minutes
    const cutoff = now - 5 * 60 * 1000;
    while (history.length > 0 && history[0].lastUpdated < cutoff) {
      history.shift();
    }
  }

  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
}

function simulateKafkaMetrics(topic: string, now: number): KafkaTopicMetrics[] {
  // Simulate different metrics for different topics
  const baseMetrics: Record<string, { lag: number; consume: number; produce: number }> = {
    'activity-events': { lag: 500, consume: 100, produce: 120 },
    'wallet-transactions': { lag: 100, consume: 50, produce: 45 },
    'traveler-updates': { lag: 200, consume: 80, produce: 85 },
    'marketplace-events': { lag: 1000, consume: 200, produce: 250 },
    'notifications': { lag: 50, consume: 300, produce: 320 },
  };

  const base = baseMetrics[topic] || { lag: 100, consume: 100, produce: 100 };
  
  // Add randomness
  const noise = () => (Math.random() - 0.5) * 0.2;

  // Simulate 3 partitions per topic
  return [0, 1, 2].map(partition => ({
    topic,
    consumerGroup: `${topic}-consumers`,
    partition,
    currentOffset: 1000000 + partition * 100000,
    logEndOffset: 1000000 + partition * 100000 + Math.floor(base.lag * (1 + noise())),
    lag: Math.floor(base.lag * (1 + noise())),
    consumeRate: Math.max(10, Math.floor(base.consume * (1 + noise()))),
    produceRate: Math.max(10, Math.floor(base.produce * (1 + noise()))),
    lastUpdated: now,
  }));
}

// ============================================
// PREDICTIVE THROTTLING
// ============================================

/**
 * Check and apply predictive throttling
 */
export function checkAndApplyThrottling(): void {
  const span = tracer.startSpan('predictive_kafka.check_throttling', {
    kind: SpanKind.INTERNAL,
  });

  const config = PREDICTIVE_KAFKA_CONFIG;
  const now = Date.now();

  for (const [topic, state] of producerStates) {
    const metrics = topicMetrics.get(topic) || [];
    const latestMetrics = metrics.slice(-3); // Last 3 partitions
    
    if (latestMetrics.length === 0) continue;

    // Calculate total lag
    const totalLag = latestMetrics.reduce((sum, m) => sum + m.lag, 0);
    const avgConsumeRate = latestMetrics.reduce((sum, m) => sum + m.consumeRate, 0) / latestMetrics.length;
    const avgProduceRate = latestMetrics.reduce((sum, m) => sum + m.produceRate, 0) / latestMetrics.length;

    // Get prediction for api-gateway (indicates overall system load)
    const prediction = predictServiceLoad('api-gateway');
    const predictedLoad = prediction.predictedLoad;
    
    let targetRate = state.currentRateLimit;
    let shouldThrottle = false;
    let throttleReason = '';

    // Check 1: Lag-based throttling
    if (totalLag > config.lagThreshold) {
      shouldThrottle = true;
      throttleReason = `High lag: ${totalLag} messages`;
      
      // Reduce rate proportionally to lag
      const lagFactor = Math.min(1, config.lagThreshold / totalLag);
      targetRate = Math.max(
        config.producerRateLimitRange.min,
        Math.floor(state.currentRateLimit * lagFactor * 0.8)
      );
    }

    // Check 2: Produce > Consume (increasing lag trend)
    if (config.throttleOnLagTrend && avgProduceRate > avgConsumeRate * 1.2) {
      shouldThrottle = true;
      throttleReason = throttleReason || `Produce (${avgProduceRate}) > Consume (${avgConsumeRate})`;
      
      // Reduce to match consume rate
      targetRate = Math.floor(avgConsumeRate * 0.9);
    }

    // Check 3: Predictive throttling based on system load
    if (config.pauseOnPrediction && predictedLoad > 80 && prediction.confidence > 0.7) {
      shouldThrottle = true;
      throttleReason = throttleReason || `Predicted high load: ${predictedLoad.toFixed(1)}%`;
      
      // Reduce rate preemptively
      targetRate = Math.max(
        config.producerRateLimitRange.min,
        Math.floor(targetRate * 0.7)
      );
    }

    // Apply throttling decision
    if (shouldThrottle && !state.isThrottled) {
      // Start throttling
      state.isThrottled = true;
      state.targetRateLimit = targetRate;
      state.throttleReason = throttleReason;
      state.lastAdjustment = now;

      logger.warn(`[PredictiveKafka] Throttling ${topic}`, {
        from: state.currentRateLimit,
        to: targetRate,
        reason: throttleReason,
        lag: totalLag,
        predictedLoad: predictedLoad.toFixed(1),
      });

      const throttleSpan = tracer.startSpan('predictive_kafka.throttle_applied', {
        kind: SpanKind.INTERNAL,
        attributes: {
          'kafka.topic': topic,
          'kafka.old_rate': state.currentRateLimit,
          'kafka.new_rate': targetRate,
          'kafka.reason': throttleReason,
        },
      });
      throttleSpan.end();

    } else if (!shouldThrottle && state.isThrottled) {
      // Stop throttling
      state.isThrottled = false;
      state.targetRateLimit = config.producerRateLimitRange.max;
      state.throttleReason = undefined;
      state.lastAdjustment = now;

      logger.info(`[PredictiveKafka] Resuming normal rate for ${topic}`, {
        rate: config.producerRateLimitRange.max,
        lag: totalLag,
      });
    }

    // Gradually adjust current rate toward target
    if (state.currentRateLimit !== state.targetRateLimit) {
      const diff = state.targetRateLimit - state.currentRateLimit;
      const step = Math.ceil(diff * 0.3); // 30% adjustment per cycle
      state.currentRateLimit += step;
    }
  }

  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
}

// ============================================
// CONSUMER PAUSE/RESUME
// ============================================

/**
 * Check and apply consumer pausing based on predictions
 */
export function checkConsumerPausing(): void {
  const span = tracer.startSpan('predictive_kafka.check_pauses', {
    kind: SpanKind.INTERNAL,
  });

  const config = PREDICTIVE_KAFKA_CONFIG;
  const now = Date.now();

  for (const topic of MONITORED_TOPICS) {
    const consumerGroup = `${topic}-consumers`;
    let state = consumerStates.get(consumerGroup);

    if (!state) {
      state = {
        consumerGroup,
        isPaused: false,
      };
      consumerStates.set(consumerGroup, state);
    }

    // Get prediction
    const prediction = predictServiceLoad('api-gateway');

    // Should pause?
    if (config.pauseOnPrediction && 
        prediction.predictedLoad > 85 && 
        prediction.confidence > 0.75) {
      
      if (!state.isPaused) {
        // Pause consumer
        state.isPaused = true;
        state.pausedAt = now;
        state.pauseReason = `Predicted load spike: ${prediction.predictedLoad.toFixed(1)}%`;
        state.predictedResumeAt = now + config.resumeAfterMs;

        logger.warn(`[PredictiveKafka] Pausing consumer ${consumerGroup}`, {
          predictedLoad: prediction.predictedLoad.toFixed(1),
          resumeIn: config.resumeAfterMs / 1000,
        });

        // Schedule resume
        setTimeout(() => {
          resumeConsumer(consumerGroup);
        }, config.resumeAfterMs);
      }
    }
  }

  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
}

/**
 * Resume a paused consumer
 */
export function resumeConsumer(consumerGroup: string): void {
  const state = consumerStates.get(consumerGroup);
  if (!state || !state.isPaused) return;

  state.isPaused = false;
  state.resumeAt = Date.now();

  logger.info(`[PredictiveKafka] Resumed consumer ${consumerGroup}`);

  const resumeSpan = tracer.startSpan('predictive_kafka.consumer_resumed', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'kafka.consumer_group': consumerGroup,
    },
  });
  resumeSpan.end();
}

/**
 * Manually pause a consumer
 */
export function manualPauseConsumer(consumerGroup: string, durationMs: number): void {
  let state = consumerStates.get(consumerGroup);
  
  if (!state) {
    state = {
      consumerGroup,
      isPaused: false,
    };
    consumerStates.set(consumerGroup, state);
  }

  state.isPaused = true;
  state.pausedAt = Date.now();
  state.pauseReason = 'Manual pause';
  state.predictedResumeAt = Date.now() + durationMs;

  logger.info(`[PredictiveKafka] Manually pausing consumer ${consumerGroup} for ${durationMs}ms`);

  setTimeout(() => {
    resumeConsumer(consumerGroup);
  }, durationMs);
}

// ============================================
// MONITORING LOOPS
// ============================================

export function startPredictiveKafkaMonitor(): void {
  if (monitoringInterval || throttlingInterval) {
    logger.warn('[PredictiveKafka] Already running');
    return;
  }

  if (!PREDICTIVE_KAFKA_CONFIG.enabled) {
    logger.info('[PredictiveKafka] Predictive Kafka disabled');
    return;
  }

  logger.info('[PredictiveKafka] Starting monitoring');

  // Collect metrics every 5 seconds
  monitoringInterval = setInterval(() => {
    collectKafkaMetrics();
  }, 5000);

  // Check throttling every 10 seconds
  throttlingInterval = setInterval(() => {
    checkAndApplyThrottling();
    checkConsumerPausing();
  }, 10000);

  // Initial collection
  collectKafkaMetrics();
}

export function stopPredictiveKafkaMonitor(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
  
  if (throttlingInterval) {
    clearInterval(throttlingInterval);
    throttlingInterval = null;
  }

  logger.info('[PredictiveKafka] Stopped');
}

// ============================================
// QUERY FUNCTIONS
// ============================================

export function getKafkaTopicStatus(topic: string): {
  metrics: KafkaTopicMetrics[];
  producerState: ProducerThrottlingState | undefined;
  totalLag: number;
} {
  const metrics = topicMetrics.get(topic) || [];
  const latest = metrics.slice(-3);
  const totalLag = latest.reduce((sum, m) => sum + m.lag, 0);

  return {
    metrics: latest,
    producerState: producerStates.get(topic),
    totalLag,
  };
}

export function getConsumerStatus(consumerGroup: string): ConsumerPauseState | undefined {
  return consumerStates.get(consumerGroup);
}

export function isConsumerPaused(consumerGroup: string): boolean {
  return consumerStates.get(consumerGroup)?.isPaused || false;
}

export function getProducerRateLimit(topic: string): number {
  return producerStates.get(topic)?.currentRateLimit || PREDICTIVE_KAFKA_CONFIG.producerRateLimitRange.max;
}

// ============================================
// HEALTH
// ============================================

export function getPredictiveKafkaHealth(): {
  enabled: boolean;
  isRunning: boolean;
  topics: Array<{
    topic: string;
    metrics: KafkaTopicMetrics[];
    producerState: ProducerThrottlingState | undefined;
    totalLag: number;
  }>;
  consumers: ConsumerPauseState[];
} {
  const topics = MONITORED_TOPICS.map(topic => ({
    topic,
    ...getKafkaTopicStatus(topic),
  }));

  return {
    enabled: PREDICTIVE_KAFKA_CONFIG.enabled,
    isRunning: monitoringInterval !== null,
    topics,
    consumers: Array.from(consumerStates.values()),
  };
}

// ============================================
// RESET
// ============================================

export function resetPredictiveKafka(): void {
  stopPredictiveKafkaMonitor();
  topicMetrics.clear();
  producerStates.clear();
  consumerStates.clear();
  initializePredictiveKafka();
  logger.info('[PredictiveKafka] Reset complete');
}

export { topicMetrics, producerStates, consumerStates };
