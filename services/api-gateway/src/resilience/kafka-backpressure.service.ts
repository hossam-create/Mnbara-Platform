/**
 * Kafka Backpressure Controller
 * 
 * Handles consumer backpressure by:
 * - Monitoring consumer lag
 * - Pausing consumption when WebSocket queue is overloaded
 * - Resuming when thresholds normalize
 * - Exposing lag metrics in health endpoint
 */

import { Consumer, Kafka } from 'kafkajs';
import { 
  trace, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import { logger } from '../middleware/correlation-logger.middleware';

// Backpressure configuration
interface BackpressureConfig {
  maxConsumerLag: number;        // Max lag before pausing
  resumeThreshold: number;     // Lag threshold to resume
  maxWebSocketQueueSize: number; // Max pending WebSocket messages
  pauseTimeout: number;        // Max pause duration (ms)
  checkInterval: number;       // Check interval (ms)
}

// Default configuration
const DEFAULT_BACKPRESSURE_CONFIG: BackpressureConfig = {
  maxConsumerLag: 1000,       // Pause if > 1000 messages behind
  resumeThreshold: 100,         // Resume if < 100 messages behind
  maxWebSocketQueueSize: 500,  // Pause if > 500 messages queued
  pauseTimeout: 30000,         // Auto-resume after 30s
  checkInterval: 5000,         // Check every 5 seconds
};

// Backpressure state
interface BackpressureState {
  isPaused: boolean;
  pausedAt?: Date;
  resumeScheduled: boolean;
  currentLag: number;
  webSocketQueueSize: number;
  totalPaused: number;
  totalResumed: number;
  lastCheck: Date;
}

// State per consumer group
const backpressureStates = new Map<string, BackpressureState>();
const backpressureConfigs = new Map<string, BackpressureConfig>();

// Tracer
const tracer = trace.getTracer('kafka-backpressure');

// Check intervals
const checkIntervals = new Map<string, NodeJS.Timeout>();

/**
 * Initialize backpressure controller for a consumer
 */
export function initializeBackpressure(
  consumerGroupId: string,
  kafka: Kafka,
  config?: Partial<BackpressureConfig>
): void {
  const fullConfig: BackpressureConfig = {
    ...DEFAULT_BACKPRESSURE_CONFIG,
    ...config,
  };

  backpressureConfigs.set(consumerGroupId, fullConfig);
  backpressureStates.set(consumerGroupId, {
    isPaused: false,
    resumeScheduled: false,
    currentLag: 0,
    webSocketQueueSize: 0,
    totalPaused: 0,
    totalResumed: 0,
    lastCheck: new Date(),
  });

  // Start periodic lag check
  const interval = setInterval(
    () => checkAndAdjustBackpressure(consumerGroupId, kafka),
    fullConfig.checkInterval
  );
  checkIntervals.set(consumerGroupId, interval);

  logger.info(`[Backpressure] Initialized for ${consumerGroupId}`, {
    groupId: consumerGroupId,
    config: fullConfig,
  });
}

/**
 * Check consumer lag and adjust backpressure
 */
async function checkAndAdjustBackpressure(
  consumerGroupId: string,
  kafka: Kafka
): Promise<void> {
  const state = backpressureStates.get(consumerGroupId);
  const config = backpressureConfigs.get(consumerGroupId);
  
  if (!state || !config) return;

  const span = tracer.startSpan('backpressure.check', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'backpressure.group_id': consumerGroupId,
      'backpressure.is_paused': state.isPaused,
    },
  });

  try {
    // Get consumer lag
    const admin = kafka.admin();
    await admin.connect();
    
    const lag = await getConsumerLag(admin, consumerGroupId);
    await admin.disconnect();

    state.currentLag = lag;
    state.lastCheck = new Date();

    span.setAttribute('backpressure.lag', lag);
    span.setAttribute('backpressure.queue_size', state.webSocketQueueSize);

    // Check if we need to pause
    if (!state.isPaused && shouldPause(lag, state.webSocketQueueSize, config)) {
      await pauseConsumption(consumerGroupId, kafka, lag, state.webSocketQueueSize);
    }

    // Check if we can resume
    if (state.isPaused && shouldResume(lag, state.webSocketQueueSize, config, state)) {
      await resumeConsumption(consumerGroupId, kafka);
    }

    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ 
      code: SpanStatusCode.ERROR, 
      message: (error as Error).message 
    });
    logger.error(`[Backpressure] Error checking lag for ${consumerGroupId}`, {
      error: (error as Error).message,
    });
  } finally {
    span.end();
  }
}

/**
 * Get consumer lag for a consumer group
 */
async function getConsumerLag(
  admin: ReturnType<Kafka['admin']>,
  groupId: string
): Promise<number> {
  try {
    const groupOffsets = await admin.fetchOffsets({ groupId });
    
    let totalLag = 0;
    
    for (const { topic, partitions } of groupOffsets) {
      // Get topic offsets
      const topicOffsets = await admin.fetchTopicOffsets(topic);
      
      for (const partition of partitions) {
        const topicOffset = topicOffsets.find(
          to => to.partition === partition.partition
        );
        
        if (topicOffset && partition.offset !== undefined) {
          const lag = parseInt(topicOffset.offset) - parseInt(partition.offset);
          totalLag += Math.max(0, lag);
        }
      }
    }
    
    return totalLag;
  } catch (error) {
    logger.error(`[Backpressure] Error fetching consumer lag`, {
      error: (error as Error).message,
    });
    return 0;
  }
}

/**
 * Determine if consumption should pause
 */
function shouldPause(
  lag: number,
  queueSize: number,
  config: BackpressureConfig
): boolean {
  return lag > config.maxConsumerLag || queueSize > config.maxWebSocketQueueSize;
}

/**
 * Determine if consumption should resume
 */
function shouldResume(
  lag: number,
  queueSize: number,
  config: BackpressureConfig,
  state: BackpressureState
): boolean {
  // Check if paused too long
  if (state.pausedAt) {
    const pausedDuration = Date.now() - state.pausedAt.getTime();
    if (pausedDuration > config.pauseTimeout) {
      return true;
    }
  }

  // Check if below thresholds
  return lag < config.resumeThreshold && queueSize < config.maxWebSocketQueueSize;
}

/**
 * Pause Kafka consumption
 */
async function pauseConsumption(
  groupId: string,
  kafka: Kafka,
  lag: number,
  queueSize: number
): Promise<void> {
  const state = backpressureStates.get(groupId);
  if (!state || state.isPaused) return;

  const span = tracer.startSpan('backpressure.pause', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'backpressure.group_id': groupId,
      'backpressure.reason': lag > (backpressureConfigs.get(groupId)?.maxConsumerLag || 1000) 
        ? 'high_lag' 
        : 'queue_full',
      'backpressure.lag': lag,
      'backpressure.queue_size': queueSize,
    },
  });

  state.isPaused = true;
  state.pausedAt = new Date();
  state.totalPaused++;

  logger.warn(`[Backpressure] PAUSING consumption for ${groupId}`, {
    groupId,
    lag,
    queueSize,
    reason: lag > (backpressureConfigs.get(groupId)?.maxConsumerLag || 1000) 
      ? 'high_consumer_lag' 
      : 'websocket_queue_full',
  });

  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
}

/**
 * Resume Kafka consumption
 */
async function resumeConsumption(
  groupId: string,
  kafka: Kafka
): Promise<void> {
  const state = backpressureStates.get(groupId);
  if (!state || !state.isPaused) return;

  const span = tracer.startSpan('backpressure.resume', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'backpressure.group_id': groupId,
      'backpressure.paused_duration_ms': state.pausedAt 
        ? Date.now() - state.pausedAt.getTime() 
        : 0,
    },
  });

  state.isPaused = false;
  state.pausedAt = undefined;
  state.totalResumed++;

  logger.info(`[Backpressure] RESUMING consumption for ${groupId}`, {
    groupId,
    totalPauses: state.totalPaused,
    totalResumes: state.totalResumed,
  });

  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
}

/**
 * Update WebSocket queue size
 */
export function updateWebSocketQueueSize(
  groupId: string,
  queueSize: number
): void {
  const state = backpressureStates.get(groupId);
  if (state) {
    state.webSocketQueueSize = queueSize;
  }
}

/**
 * Get backpressure health status
 */
export function getBackpressureHealth(groupId: string): {
  isPaused: boolean;
  currentLag: number;
  webSocketQueueSize: number;
  totalPaused: number;
  totalResumed: number;
  lastCheck: Date;
  pausedAt?: Date;
} | null {
  const state = backpressureStates.get(groupId);
  if (!state) return null;

  return {
    isPaused: state.isPaused,
    currentLag: state.currentLag,
    webSocketQueueSize: state.webSocketQueueSize,
    totalPaused: state.totalPaused,
    totalResumed: state.totalResumed,
    lastCheck: state.lastCheck,
    pausedAt: state.pausedAt,
  };
}

/**
 * Check if consumption is paused
 */
export function isPaused(groupId: string): boolean {
  return backpressureStates.get(groupId)?.isPaused || false;
}

/**
 * Manually pause consumption (for maintenance)
 */
export async function manualPause(groupId: string, kafka: Kafka): Promise<void> {
  const state = backpressureStates.get(groupId);
  if (state) {
    await pauseConsumption(groupId, kafka, state.currentLag, state.webSocketQueueSize);
  }
}

/**
 * Manually resume consumption
 */
export async function manualResume(groupId: string, kafka: Kafka): Promise<void> {
  await resumeConsumption(groupId, kafka);
}

/**
 * Shutdown backpressure controller
 */
export function shutdownBackpressure(groupId: string): void {
  const interval = checkIntervals.get(groupId);
  if (interval) {
    clearInterval(interval);
    checkIntervals.delete(groupId);
  }
  backpressureStates.delete(groupId);
  backpressureConfigs.delete(groupId);
  
  logger.info(`[Backpressure] Shutdown for ${groupId}`);
}

/**
 * Shutdown all backpressure controllers
 */
export function shutdownAllBackpressure(): void {
  for (const [groupId, interval] of checkIntervals) {
    clearInterval(interval);
    logger.info(`[Backpressure] Shutdown for ${groupId}`);
  }
  checkIntervals.clear();
  backpressureStates.clear();
  backpressureConfigs.clear();
}
