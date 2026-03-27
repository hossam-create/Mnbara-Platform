/**
 * Bulkhead Isolation Pattern
 * 
 * Limits concurrent execution per service to prevent resource exhaustion.
 * If limit exceeded, rejects immediately with 503 Service Unavailable.
 * 
 * Features:
 * - Per-service concurrency limits
 * - Queue with timeout
 * - Tracing integration
 * - Metrics collection
 */

import { 
  trace, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import { logger } from '../middleware/correlation-logger.middleware';

// Bulkhead configuration
export interface BulkheadConfig {
  maxConcurrent: number;      // Maximum concurrent executions
  maxQueue: number;          // Maximum waiting in queue
  queueTimeout: number;      // Max time to wait in queue (ms)
}

// Service-specific limits
const SERVICE_BULKHEAD_CONFIGS: Record<string, BulkheadConfig> = {
  'wallet-service': {
    maxConcurrent: 50,
    maxQueue: 100,
    queueTimeout: 5000,
  },
  'traveler-service': {
    maxConcurrent: 30,
    maxQueue: 60,
    queueTimeout: 5000,
  },
  'marketplace-service': {
    maxConcurrent: 30,
    maxQueue: 60,
    queueTimeout: 5000,
  },
};

// Bulkhead state for each service
interface BulkheadState {
  running: number;
  waiting: number;
  totalRejected: number;
  totalExecuted: number;
}

const bulkheadStates = new Map<string, BulkheadState>();
const bulkheadQueues = new Map<string, Array<{
  resolve: (value: boolean) => void;
  reject: (reason: Error) => void;
  timer: NodeJS.Timeout;
}>>();

// Tracer
const tracer = trace.getTracer('bulkhead-isolation');

/**
 * Get or create bulkhead state
 */
function getBulkheadState(serviceName: string): BulkheadState {
  if (!bulkheadStates.has(serviceName)) {
    bulkheadStates.set(serviceName, {
      running: 0,
      waiting: 0,
      totalRejected: 0,
      totalExecuted: 0,
    });
    bulkheadQueues.set(serviceName, []);
  }
  return bulkheadStates.get(serviceName)!;
}

/**
 * Acquire execution slot with bulkhead protection
 */
async function acquireSlot(
  serviceName: string,
  config: BulkheadConfig
): Promise<boolean> {
  const state = getBulkheadState(serviceName);
  const queue = bulkheadQueues.get(serviceName)!;

  // If under limit, execute immediately
  if (state.running < config.maxConcurrent) {
    state.running++;
    state.totalExecuted++;
    return true;
  }

  // Check if queue is full
  if (state.waiting >= config.maxQueue) {
    state.totalRejected++;
    throw new BulkheadError(
      `Bulkhead full for ${serviceName}: ${state.running} running, ${state.waiting} waiting`,
      serviceName,
      state.running,
      state.waiting
    );
  }

  // Wait in queue
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      // Remove from queue
      const index = queue.findIndex(item => item.timer === timer);
      if (index > -1) {
        queue.splice(index, 1);
        state.waiting--;
      }
      state.totalRejected++;
      reject(new BulkheadError(
        `Bulkhead queue timeout for ${serviceName}`,
        serviceName,
        state.running,
        state.waiting
      ));
    }, config.queueTimeout);

    queue.push({ resolve, reject, timer });
    state.waiting++;
  });
}

/**
 * Release execution slot and process queue
 */
function releaseSlot(serviceName: string): void {
  const state = getBulkheadState(serviceName);
  const queue = bulkheadQueues.get(serviceName)!;

  state.running--;

  // Process next in queue
  if (queue.length > 0 && state.running < SERVICE_BULKHEAD_CONFIGS[serviceName].maxConcurrent) {
    const next = queue.shift();
    if (next) {
      clearTimeout(next.timer);
      state.waiting--;
      state.running++;
      state.totalExecuted++;
      next.resolve(true);
    }
  }
}

/**
 * Execute function with bulkhead isolation
 */
export async function withBulkhead<T>(
  serviceName: string,
  fn: () => Promise<T>,
  customConfig?: Partial<BulkheadConfig>
): Promise<T> {
  const config: BulkheadConfig = {
    ...SERVICE_BULKHEAD_CONFIGS[serviceName],
    ...customConfig,
  };

  const span = tracer.startSpan('bulkhead.acquire', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'bulkhead.service': serviceName,
      'bulkhead.max_concurrent': config.maxConcurrent,
      'bulkhead.max_queue': config.maxQueue,
    },
  });

  const state = getBulkheadState(serviceName);

  try {
    // Try to acquire slot
    span.setAttribute('bulkhead.running_before', state.running);
    span.setAttribute('bulkhead.waiting_before', state.waiting);

    await acquireSlot(serviceName, config);

    span.setAttribute('bulkhead.acquired', true);
    span.setAttribute('bulkhead.running_after', getBulkheadState(serviceName).running);
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    // Execute function
    const execSpan = tracer.startSpan('bulkhead.execute', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'bulkhead.service': serviceName,
      },
    });

    try {
      const result = await fn();
      execSpan.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      execSpan.recordException(error as Error);
      execSpan.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: (error as Error).message 
      });
      throw error;
    } finally {
      execSpan.end();
      releaseSlot(serviceName);
    }

  } catch (error) {
    // Bulkhead rejection
    if (error instanceof BulkheadError) {
      span.setAttribute('bulkhead.rejected', true);
      span.setAttribute('bulkhead.rejection_reason', error.message);
      
      logger.warn(`[Bulkhead] Rejected request for ${serviceName}`, {
        service: serviceName,
        running: error.running,
        waiting: error.waiting,
        maxConcurrent: config.maxConcurrent,
        maxQueue: config.maxQueue,
      });

      // Create rejection span
      const rejectSpan = tracer.startSpan('bulkhead.rejected', {
        kind: SpanKind.INTERNAL,
        attributes: {
          'bulkhead.service': serviceName,
          'bulkhead.rejection_reason': error.message,
          'bulkhead.running': error.running,
          'bulkhead.waiting': error.waiting,
        },
      });
      rejectSpan.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: 'Bulkhead rejection' 
      });
      rejectSpan.end();
    }

    span.recordException(error as Error);
    span.setStatus({ 
      code: SpanStatusCode.ERROR, 
      message: (error as Error).message 
    });
    span.end();
    throw error;
  }
}

/**
 * Custom error for bulkhead rejections
 */
export class BulkheadError extends Error {
  public readonly serviceName: string;
  public readonly running: number;
  public readonly waiting: number;

  constructor(
    message: string,
    serviceName: string,
    running: number,
    waiting: number
  ) {
    super(message);
    this.name = 'BulkheadError';
    this.serviceName = serviceName;
    this.running = running;
    this.waiting = waiting;
  }
}

/**
 * Get bulkhead health status
 */
export function getBulkheadHealth(): Record<string, {
  running: number;
  waiting: number;
  maxConcurrent: number;
  maxQueue: number;
  utilizationPercent: number;
  totalRejected: number;
  totalExecuted: number;
}> {
  const health: Record<string, {
    running: number;
    waiting: number;
    maxConcurrent: number;
    maxQueue: number;
    utilizationPercent: number;
    totalRejected: number;
    totalExecuted: number;
  }> = {};

  for (const [serviceName, config] of Object.entries(SERVICE_BULKHEAD_CONFIGS)) {
    const state = getBulkheadState(serviceName);
    health[serviceName] = {
      running: state.running,
      waiting: state.waiting,
      maxConcurrent: config.maxConcurrent,
      maxQueue: config.maxQueue,
      utilizationPercent: Math.round((state.running / config.maxConcurrent) * 100),
      totalRejected: state.totalRejected,
      totalExecuted: state.totalExecuted,
    };
  }

  return health;
}

/**
 * Wrap function with bulkhead isolation
 */
export function wrapWithBulkhead<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  serviceName: string,
  config?: Partial<BulkheadConfig>
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return withBulkhead(
      serviceName,
      () => fn(...args),
      config
    ) as Promise<ReturnType<T>>;
  };
}

/**
 * Reset bulkhead state (for testing)
 */
export function resetBulkhead(serviceName?: string): void {
  if (serviceName) {
    bulkheadStates.delete(serviceName);
    bulkheadQueues.delete(serviceName);
  } else {
    bulkheadStates.clear();
    bulkheadQueues.clear();
  }
}
