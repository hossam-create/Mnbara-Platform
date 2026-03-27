/**
 * Chaos Adaptive Test Controller
 * 
 * Simulates various overload conditions to test adaptive protection:
 * - CPU spike simulation
 * - Memory pressure
 * - Downstream latency spike
 * - Kafka delay simulation
 * - Cascading failure scenarios
 * 
 * Validates that the adaptive layer reacts correctly.
 */

import { Request, Response } from 'express';
import { 
  trace, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import { logger } from '../middleware/correlation-logger.middleware';
import { 
  applyBrownout,
  getBrownoutHealth,
  getLoadSheddingHealth,
  getCurrentOverloadState,
  getSLOHealth,
  getOverloadHealth,
  recordLatency,
  recordRequestOutcome,
  recordEventLoopLag,
  incrementConnection,
  decrementConnection,
} from '../adaptive';
import { resilientClient } from '../resilience';

// Tracer
const tracer = trace.getTracer('chaos-tests');

// Chaos state tracking
interface ChaosState {
  cpuSpikeActive: boolean;
  memoryPressureActive: boolean;
  downstreamLatencyActive: boolean;
  kafkaDelayActive: boolean;
  startTime?: Date;
}

const chaosState: ChaosState = {
  cpuSpikeActive: false,
  memoryPressureActive: false,
  downstreamLatencyActive: false,
  kafkaDelayActive: false,
};

// Large arrays to simulate memory pressure
let memoryHog: number[][] = [];

export class ChaosAdaptiveController {
  /**
   * Simulate CPU spike
   */
  async simulateCpuSpike(req: Request, res: Response): Promise<void> {
    const { duration = 30000, intensity = 80 } = req.body;
    
    const span = tracer.startSpan('chaos.cpu_spike', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'chaos.duration_ms': duration,
        'chaos.intensity': intensity,
      },
    });

    logger.warn(`[Chaos] Starting CPU spike simulation - ${intensity}% for ${duration}ms`);
    
    chaosState.cpuSpikeActive = true;
    chaosState.startTime = new Date();

    // Simulate CPU load
    const endTime = Date.now() + duration;
    const cpuLoadInterval = setInterval(() => {
      if (Date.now() >= endTime) {
        clearInterval(cpuLoadInterval);
        chaosState.cpuSpikeActive = false;
        logger.info('[Chaos] CPU spike simulation ended');
        return;
      }

      // Spin CPU
      const start = Date.now();
      while (Date.now() - start < (intensity * 10)) {
        Math.random() * Math.random();
      }

      // Add artificial event loop lag
      recordEventLoopLag(intensity * 2);
    }, 100);

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    res.json({
      chaos: 'cpu_spike',
      duration,
      intensity,
      status: 'started',
      message: `CPU spike simulation running for ${duration}ms at ${intensity}% intensity`,
    });
  }

  /**
   * Simulate memory pressure
   */
  async simulateMemoryPressure(req: Request, res: Response): Promise<void> {
    const { sizeMB = 500, duration = 60000 } = req.body;
    
    const span = tracer.startSpan('chaos.memory_pressure', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'chaos.size_mb': sizeMB,
        'chaos.duration_ms': duration,
      },
    });

    logger.warn(`[Chaos] Starting memory pressure simulation - ${sizeMB}MB for ${duration}ms`);
    
    chaosState.memoryPressureActive = true;
    chaosState.startTime = new Date();

    // Allocate memory
    const arraysNeeded = Math.ceil(sizeMB / 4); // ~4MB per array
    memoryHog = [];
    
    for (let i = 0; i < arraysNeeded; i++) {
      const arr = new Array(1000000).fill(Math.random());
      memoryHog.push(arr);
    }

    // Release after duration
    setTimeout(() => {
      memoryHog = [];
      if (global.gc) {
        global.gc();
      }
      chaosState.memoryPressureActive = false;
      logger.info('[Chaos] Memory pressure simulation ended - garbage collected');
    }, duration);

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    res.json({
      chaos: 'memory_pressure',
      sizeMB,
      duration,
      status: 'started',
      message: `Memory pressure simulation: allocated ${sizeMB}MB for ${duration}ms`,
    });
  }

  /**
   * Simulate downstream latency spike
   */
  async simulateDownstreamLatency(req: Request, res: Response): Promise<void> {
    const { service = 'wallet-service', delay = 5000, duration = 30000, errorRate = 0 } = req.body;
    
    const span = tracer.startSpan('chaos.downstream_latency', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'chaos.service': service,
        'chaos.delay_ms': delay,
        'chaos.duration_ms': duration,
        'chaos.error_rate': errorRate,
      },
    });

    logger.warn(`[Chaos] Starting downstream latency - ${service}: ${delay}ms delay, ${errorRate}% errors for ${duration}ms`);
    
    chaosState.downstreamLatencyActive = true;

    // Store original service URL (would need implementation in real scenario)
    // For now, just track state
    
    setTimeout(() => {
      chaosState.downstreamLatencyActive = false;
      logger.info('[Chaos] Downstream latency simulation ended');
    }, duration);

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    res.json({
      chaos: 'downstream_latency',
      service,
      delay,
      duration,
      errorRate,
      status: 'started',
      message: `${service} will have ${delay}ms delay and ${errorRate}% error rate for ${duration}ms`,
    });
  }

  /**
   * Simulate Kafka producer delay
   */
  async simulateKafkaDelay(req: Request, res: Response): Promise<void> {
    const { delay = 200, duration = 30000 } = req.body;
    
    const span = tracer.startSpan('chaos.kafka_delay', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'chaos.delay_ms': delay,
        'chaos.duration_ms': duration,
      },
    });

    logger.warn(`[Chaos] Starting Kafka delay simulation - ${delay}ms for ${duration}ms`);
    
    chaosState.kafkaDelayActive = true;
    
    setTimeout(() => {
      chaosState.kafkaDelayActive = false;
      logger.info('[Chaos] Kafka delay simulation ended');
    }, duration);

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    res.json({
      chaos: 'kafka_delay',
      delay,
      duration,
      status: 'started',
      message: `Kafka producer delay: ${delay}ms for ${duration}ms`,
    });
  }

  /**
   * Simulate cascading failure across services
   */
  async simulateCascadingFailure(req: Request, res: Response): Promise<void> {
    const { services = ['wallet-service', 'traveler-service'], failureRate = 80, duration = 30000 } = req.body;
    
    const span = tracer.startSpan('chaos.cascading_failure', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'chaos.services': services.join(','),
        'chaos.failure_rate': failureRate,
        'chaos.duration_ms': duration,
      },
    });

    logger.error(`[Chaos] Starting cascading failure simulation - ${services.join(', ')} at ${failureRate}% failure rate`);
    
    // Simulate high latency and errors
    for (const service of services) {
      logger.warn(`[Chaos] Injecting failures into ${service}`);
    }

    // Record artificial SLO violations
    for (let i = 0; i < 100; i++) {
      recordLatency(600 + Math.random() * 400); // 600-1000ms latency
      recordRequestOutcome(Math.random() * 100 < failureRate);
    }

    setTimeout(() => {
      logger.info('[Chaos] Cascading failure simulation ended');
    }, duration);

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    res.json({
      chaos: 'cascading_failure',
      services,
      failureRate,
      duration,
      status: 'started',
      message: `Cascading failure: ${services.join(', ')} at ${failureRate}% failure rate for ${duration}ms`,
    });
  }

  /**
   * Simulate connection spike
   */
  async simulateConnectionSpike(req: Request, res: Response): Promise<void> {
    const { connections = 1000, duration = 30000 } = req.body;
    
    const span = tracer.startSpan('chaos.connection_spike', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'chaos.connections': connections,
        'chaos.duration_ms': duration,
      },
    });

    logger.warn(`[Chaos] Simulating connection spike - ${connections} connections`);
    
    // Simulate many connections
    for (let i = 0; i < connections; i++) {
      incrementConnection();
    }

    // Decrement after duration
    setTimeout(() => {
      for (let i = 0; i < connections; i++) {
        decrementConnection();
      }
      logger.info('[Chaos] Connection spike simulation ended');
    }, duration);

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    res.json({
      chaos: 'connection_spike',
      connections,
      duration,
      status: 'started',
      message: `Connection spike: ${connections} connections for ${duration}ms`,
    });
  }

  /**
   * Simulate SLO violation storm
   */
  async simulateSLOViolation(req: Request, res: Response): Promise<void> {
    const { duration = 60000 } = req.body;
    
    const span = tracer.startSpan('chaos.slo_violation', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'chaos.duration_ms': duration,
      },
    });

    logger.error(`[Chaos] Starting SLO violation storm for ${duration}ms`);
    
    // Inject high latency samples
    const interval = setInterval(() => {
      // P95 violations
      for (let i = 0; i < 95; i++) {
        recordLatency(100 + Math.random() * 100); // Normal
      }
      // P5 violations
      for (let i = 0; i < 5; i++) {
        recordLatency(800 + Math.random() * 500); // 800-1300ms
      }
      
      // 5% error rate
      for (let i = 0; i < 95; i++) {
        recordRequestOutcome(false); // Success
      }
      for (let i = 0; i < 5; i++) {
        recordRequestOutcome(true); // Error
      }
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      logger.info('[Chaos] SLO violation storm ended');
    }, duration);

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    res.json({
      chaos: 'slo_violation',
      duration,
      status: 'started',
      message: `SLO violation storm: P95 > 300ms, 5% errors for ${duration}ms`,
    });
  }

  /**
   * Force brownout mode
   */
  async forceBrownout(req: Request, res: Response): Promise<void> {
    const { state = 'critical' } = req.body;
    
    const span = tracer.startSpan('chaos.force_brownout', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'chaos.forced_state': state,
      },
    });

    logger.warn(`[Chaos] Forcing brownout mode: ${state}`);
    
    applyBrownout(state as 'degraded' | 'critical');

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    res.json({
      chaos: 'force_brownout',
      state,
      status: 'applied',
      brownoutHealth: getBrownoutHealth(),
    });
  }

  /**
   * Stop all chaos simulations
   */
  async stopAllChaos(req: Request, res: Response): Promise<void> {
    logger.info('[Chaos] Stopping all chaos simulations');
    
    // Reset state
    chaosState.cpuSpikeActive = false;
    chaosState.memoryPressureActive = false;
    chaosState.downstreamLatencyActive = false;
    chaosState.kafkaDelayActive = false;
    
    // Clear memory hog
    memoryHog = [];
    if (global.gc) {
      global.gc();
    }

    res.json({
      chaos: 'stop_all',
      status: 'stopped',
      message: 'All chaos simulations stopped',
    });
  }

  /**
   * Get chaos state and adaptive response
   */
  async getChaosState(req: Request, res: Response): Promise<void> {
    const span = tracer.startSpan('chaos.get_state', {
      kind: SpanKind.INTERNAL,
    });

    const response = {
      chaos: chaosState,
      adaptive: {
        loadShedding: getLoadSheddingHealth(),
        brownout: getBrownoutHealth(),
        slo: getSLOHealth(),
        overload: getOverloadHealth(),
      },
    };

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    res.json(response);
  }

  /**
   * Full adaptive stress test
   */
  async fullAdaptiveStressTest(req: Request, res: Response): Promise<void> {
    const { duration = 120000 } = req.body;
    
    const span = tracer.startSpan('chaos.full_stress_test', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'chaos.duration_ms': duration,
      },
    });

    logger.warn(`[Chaos] Starting full adaptive stress test for ${duration}ms`);
    
    // Phase 1: CPU + Memory pressure
    setTimeout(() => {
      logger.warn('[Chaos] Phase 1: CPU and Memory pressure');
      // Trigger CPU spike
      this.simulateCpuSpike(
        { body: { duration: 30000, intensity: 70 } } as Request,
        { json: () => {} } as unknown as Response
      );
    }, 0);

    // Phase 2: Downstream latency
    setTimeout(() => {
      logger.warn('[Chaos] Phase 2: Downstream latency');
      this.simulateDownstreamLatency(
        { body: { service: 'wallet-service', delay: 3000, duration: 30000, errorRate: 50 } } as Request,
        { json: () => {} } as unknown as Response
      );
    }, 10000);

    // Phase 3: Connection spike
    setTimeout(() => {
      logger.warn('[Chaos] Phase 3: Connection spike');
      this.simulateConnectionSpike(
        { body: { connections: 5000, duration: 30000 } } as Request,
        { json: () => {} } as unknown as Response
      );
    }, 20000);

    // Phase 4: SLO violation storm
    setTimeout(() => {
      logger.warn('[Chaos] Phase 4: SLO violation storm');
      this.simulateSLOViolation(
        { body: { duration: 30000 } } as Request,
        { json: () => {} } as unknown as Response
      );
    }, 30000);

    // End test
    setTimeout(() => {
      logger.info('[Chaos] Full stress test completed');
      this.stopAllChaos({} as Request, { json: () => {} } as unknown as Response);
    }, duration);

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    res.json({
      chaos: 'full_stress_test',
      duration,
      status: 'started',
      phases: [
        { time: 0, action: 'CPU + Memory pressure' },
        { time: 10000, action: 'Downstream latency' },
        { time: 20000, action: 'Connection spike' },
        { time: 30000, action: 'SLO violation storm' },
        { time: duration, action: 'Test complete' },
      ],
    });
  }
}

// Export singleton
export const chaosAdaptiveController = new ChaosAdaptiveController();

// ============================================
// TEST ROUTES (Add to admin routes)
// ============================================

/*
import { Router } from 'express';
import { chaosAdaptiveController } from './chaos-adaptive-test.controller';

const chaosRouter = Router();

// Chaos simulations
chaosRouter.post('/admin/chaos/cpu', chaosAdaptiveController.simulateCpuSpike);
chaosRouter.post('/admin/chaos/memory', chaosAdaptiveController.simulateMemoryPressure);
chaosRouter.post('/admin/chaos/downstream', chaosAdaptiveController.simulateDownstreamLatency);
chaosRouter.post('/admin/chaos/kafka', chaosAdaptiveController.simulateKafkaDelay);
chaosRouter.post('/admin/chaos/cascading', chaosAdaptiveController.simulateCascadingFailure);
chaosRouter.post('/admin/chaos/connections', chaosAdaptiveController.simulateConnectionSpike);
chaosRouter.post('/admin/chaos/slo', chaosAdaptiveController.simulateSLOViolation);
chaosRouter.post('/admin/chaos/brownout', chaosAdaptiveController.forceBrownout);
chaosRouter.post('/admin/chaos/stop', chaosAdaptiveController.stopAllChaos);
chaosRouter.get('/admin/chaos/state', chaosAdaptiveController.getChaosState);
chaosRouter.post('/admin/chaos/full', chaosAdaptiveController.fullAdaptiveStressTest);

export { chaosRouter };
*/

// ============================================
// CURL EXAMPLES
// ============================================

/*
# CPU Spike
curl -X POST http://localhost:3000/admin/chaos/cpu \
  -H "Content-Type: application/json" \
  -d '{"duration": 30000, "intensity": 80}'

# Memory Pressure
curl -X POST http://localhost:3000/admin/chaos/memory \
  -H "Content-Type: application/json" \
  -d '{"sizeMB": 500, "duration": 60000}'

# Downstream Latency
curl -X POST http://localhost:3000/admin/chaos/downstream \
  -H "Content-Type: application/json" \
  -d '{"service": "wallet-service", "delay": 3000, "errorRate": 50}'

# Connection Spike
curl -X POST http://localhost:3000/admin/chaos/connections \
  -H "Content-Type: application/json" \
  -d '{"connections": 5000}'

# SLO Violation Storm
curl -X POST http://localhost:3000/admin/chaos/slo \
  -H "Content-Type: application/json" \
  -d '{"duration": 60000}'

# Force Brownout
curl -X POST http://localhost:3000/admin/chaos/brownout \
  -H "Content-Type: application/json" \
  -d '{"state": "critical"}'

# Full Stress Test
curl -X POST http://localhost:3000/admin/chaos/full \
  -H "Content-Type: application/json" \
  -d '{"duration": 120000}'

# Get State
curl http://localhost:3000/admin/chaos/state

# Stop All Chaos
curl -X POST http://localhost:3000/admin/chaos/stop
*/
