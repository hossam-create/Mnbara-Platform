/**
 * Resilience Layer - Failure Simulation Tests
 * 
 * Manual and automated tests for verifying resilience patterns work correctly.
 * Use these to validate circuit breakers, retries, timeouts, and bulkheads.
 */

import { Request, Response } from 'express';
import axios from 'axios';
import { 
  getCircuitBreaker, 
  forceOpen, 
  forceClose,
  getCircuitBreakerHealth,
  shutdownAllCircuitBreakers 
} from '../resilience/circuit-breaker.service';
import { 
  withRetry, 
  getRetryStats, 
  clearRetryStats 
} from '../resilience/retry.service';
import { 
  withTimeout, 
  TimeoutError 
} from '../resilience/timeout.service';
import { 
  withBulkhead, 
  BulkheadError,
  resetBulkhead 
} from '../resilience/bulkhead.service';
import { 
  withGracefulDegradation 
} from '../resilience/graceful-degradation.service';
import { logger } from '../middleware/correlation-logger.middleware';

// ============================================
// TEST CONTROLLER
// ============================================

export class ResilienceTestController {
  /**
   * Simulate service failure for circuit breaker testing
   */
  async simulateServiceFailure(req: Request, res: Response): Promise<void> {
    const { service, duration = 30000, failureRate = 100 } = req.body;
    
    logger.info(`[Test] Simulating ${failureRate}% failure rate for ${service} for ${duration}ms`);
    
    // Create a failing function
    const failingFn = async () => {
      if (Math.random() * 100 < failureRate) {
        const error = new Error(`Simulated ${service} failure`);
        (error as Error & { statusCode: number }).statusCode = 503;
        throw error;
      }
      return { success: true, service };
    };
    
    // Get or create circuit breaker
    const breaker = getCircuitBreaker(service, failingFn);
    
    // Simulate multiple calls
    const results = [];
    for (let i = 0; i < 20; i++) {
      try {
        const result = await breaker.fire();
        results.push({ attempt: i + 1, success: true, result });
      } catch (error) {
        results.push({ 
          attempt: i + 1, 
          success: false, 
          error: (error as Error).message,
          circuitOpen: breaker.opened 
        });
      }
      
      // Small delay between calls
      await new Promise(r => setTimeout(r, 100));
    }
    
    res.json({
      test: 'circuit-breaker-failure',
      service,
      duration,
      failureRate,
      circuitState: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
      stats: breaker.stats,
      results,
    });
  }

  /**
   * Manually control circuit breaker state
   */
  async controlCircuit(req: Request, res: Response): Promise<void> {
    const { service, action } = req.body;
    
    if (action === 'open') {
      forceOpen(service);
      res.json({ service, action: 'forced-open', status: 'success' });
    } else if (action === 'close') {
      forceClose(service);
      res.json({ service, action: 'forced-close', status: 'success' });
    } else {
      res.status(400).json({ error: 'Invalid action. Use "open" or "close"' });
    }
  }

  /**
   * Test retry with exponential backoff
   */
  async testRetry(req: Request, res: Response): Promise<void> {
    const { service = 'test-service', maxRetries = 3, shouldFail = true } = req.body;
    
    clearRetryStats();
    
    let attemptCount = 0;
    
    const flakyFunction = async () => {
      attemptCount++;
      logger.info(`[Test Retry] Attempt ${attemptCount}`);
      
      if (shouldFail && attemptCount < 3) {
        const error = new Error(`Transient error on attempt ${attemptCount}`);
        (error as Error & { statusCode: number }).statusCode = 503;
        throw error;
      }
      
      return { 
        success: true, 
        attempts: attemptCount,
        message: `Succeeded on attempt ${attemptCount}` 
      };
    };
    
    const startTime = Date.now();
    
    try {
      const result = await withRetry(
        'test-operation',
        flakyFunction,
        service,
        { maxRetries }
      );
      
      const duration = Date.now() - startTime;
      
      res.json({
        test: 'retry-backoff',
        success: true,
        result,
        duration,
        retryStats: getRetryStats(),
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      res.status(500).json({
        test: 'retry-backoff',
        success: false,
        error: (error as Error).message,
        attempts: attemptCount,
        duration,
        retryStats: getRetryStats(),
      });
    }
  }

  /**
   * Test timeout protection
   */
  async testTimeout(req: Request, res: Response): Promise<void> {
    const { delay = 5000, timeout = 2000, service = 'test-service' } = req.body;
    
    const slowFunction = async () => {
      logger.info(`[Test Timeout] Starting ${delay}ms operation`);
      await new Promise(r => setTimeout(r, delay));
      return { success: true, delay };
    };
    
    const startTime = Date.now();
    
    try {
      const result = await withTimeout(
        () => slowFunction(),
        service,
        timeout
      );
      
      const duration = Date.now() - startTime;
      
      res.json({
        test: 'timeout',
        success: true,
        result,
        duration,
        expectedTimeout: timeout,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const isTimeout = error instanceof TimeoutError;
      
      res.status(isTimeout ? 504 : 500).json({
        test: 'timeout',
        success: false,
        timedOut: isTimeout,
        error: (error as Error).message,
        duration,
        expectedTimeout: timeout,
        withinTolerance: Math.abs(duration - timeout) < 100,
      });
    }
  }

  /**
   * Test bulkhead isolation
   */
  async testBulkhead(req: Request, res: Response): Promise<void> {
    const { 
      service = 'test-service', 
      concurrent = 10, 
      maxConcurrent = 3,
      taskDuration = 1000 
    } = req.body;
    
    resetBulkhead(service);
    
    const results: unknown[] = [];
    const startTime = Date.now();
    
    // Launch concurrent tasks
    const promises = Array.from({ length: concurrent }, async (_, i) => {
      const taskStart = Date.now();
      
      try {
        const result = await withBulkhead(
          service,
          async () => {
            logger.info(`[Test Bulkhead] Task ${i + 1} executing`);
            await new Promise(r => setTimeout(r, taskDuration));
            return { task: i + 1, executed: true };
          },
          { maxConcurrent, maxQueue: 5, queueTimeout: 2000 }
        );
        
        results.push({
          task: i + 1,
          success: true,
          waitTime: Date.now() - taskStart,
          result,
        });
      } catch (error) {
        results.push({
          task: i + 1,
          success: false,
          waitTime: Date.now() - taskStart,
          error: (error as Error).message,
          rejected: error instanceof BulkheadError,
        });
      }
    });
    
    await Promise.all(promises);
    
    const totalDuration = Date.now() - startTime;
    const successful = results.filter(r => (r as { success: boolean }).success).length;
    const rejected = results.filter(r => !(r as { success: boolean }).success).length;
    
    res.json({
      test: 'bulkhead',
      config: { concurrent, maxConcurrent, taskDuration },
      results: {
        total: concurrent,
        successful,
        rejected,
        totalDuration,
        expectedBatches: Math.ceil(concurrent / maxConcurrent),
      },
      details: results,
    });
  }

  /**
   * Test graceful degradation
   */
  async testDegradation(req: Request, res: Response): Promise<void> {
    const { failDomains = ['wallet'] } = req.body;
    
    const result = await withGracefulDegradation({
      wallet: {
        domain: 'wallet',
        operation: async () => {
          if (failDomains.includes('wallet')) {
            throw new Error('Wallet service unavailable');
          }
          return { balance: 1000, currency: 'USD' };
        },
      },
      traveler: {
        domain: 'traveler',
        operation: async () => {
          if (failDomains.includes('traveler')) {
            throw new Error('Traveler service unavailable');
          }
          return { trips: [{ id: 1, destination: 'Paris' }] };
        },
      },
      marketplace: {
        domain: 'marketplace',
        operation: async () => {
          if (failDomains.includes('marketplace')) {
            throw new Error('Marketplace service unavailable');
          }
          return { listings: [{ id: 1, name: 'Item' }] };
        },
      },
    });
    
    res.json({
      test: 'graceful-degradation',
      partial: result.partial,
      failedDomains: result.failedDomains,
      successDomains: result.successDomains,
      responseTime: result.responseTime,
      data: result.data,
    });
  }

  /**
   * Full resilience stress test
   */
  async stressTest(req: Request, res: Response): Promise<void> {
    const { duration = 30000, requestsPerSecond = 10 } = req.body;
    
    const results = {
      total: 0,
      success: 0,
      failed: 0,
      circuitOpen: 0,
      timeout: 0,
      bulkheadRejection: 0,
      retries: 0,
    };
    
    const endTime = Date.now() + duration;
    const interval = 1000 / requestsPerSecond;
    
    // Run requests for specified duration
    while (Date.now() < endTime) {
      const promises = [];
      
      for (let i = 0; i < requestsPerSecond; i++) {
        promises.push(this.makeStressRequest(results));
      }
      
      await Promise.all(promises);
      await new Promise(r => setTimeout(r, interval));
    }
    
    res.json({
      test: 'stress',
      config: { duration, requestsPerSecond },
      results,
      circuitHealth: getCircuitBreakerHealth(),
    });
  }

  private async makeStressRequest(results: {
    total: number;
    success: number;
    failed: number;
    circuitOpen: number;
    timeout: number;
    bulkheadRejection: number;
    retries: number;
  }): Promise<void> {
    results.total++;
    
    try {
      // Simulate various failure modes
      const random = Math.random();
      
      if (random < 0.3) {
        // 30% chance of slow response (trigger timeout)
        await withTimeout(
          async () => {
            await new Promise(r => setTimeout(r, 5000));
            return { success: true };
          },
          'test-service',
          100
        );
      } else if (random < 0.6) {
        // 30% chance of error (trigger circuit breaker)
        await withRetry(
          'stress-test',
          async () => {
            const error = new Error('Random failure');
            (error as Error & { statusCode: number }).statusCode = 503;
            throw error;
          },
          'test-service',
          { maxRetries: 2, baseDelay: 10 }
        );
      } else {
        // 40% chance of success
        results.success++;
      }
    } catch (error) {
      results.failed++;
      
      if (error instanceof TimeoutError) {
        results.timeout++;
      } else if (error instanceof BulkheadError) {
        results.bulkheadRejection++;
      } else if ((error as Error).message.includes('Breaker is open')) {
        results.circuitOpen++;
      }
    }
  }

  /**
   * Get all resilience health metrics
   */
  async getResilienceMetrics(req: Request, res: Response): Promise<void> {
    res.json({
      circuitBreakers: getCircuitBreakerHealth(),
      retryStats: getRetryStats(),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Reset all test state
   */
  async resetTestState(req: Request, res: Response): Promise<void> {
    shutdownAllCircuitBreakers();
    clearRetryStats();
    resetBulkhead();
    
    res.json({
      status: 'reset',
      message: 'All circuit breakers, retry stats, and bulkheads reset',
    });
  }
}

// Export singleton
export const resilienceTestController = new ResilienceTestController();

// ============================================
// CURL TEST COMMANDS
// ============================================

/*
# 1. Test Circuit Breaker

## Simulate service failure
curl -X POST http://localhost:3000/admin/test/circuit-breaker \
  -H "Content-Type: application/json" \
  -d '{
    "service": "wallet-service",
    "duration": 30000,
    "failureRate": 100
  }'

## Manually open circuit
curl -X POST http://localhost:3000/admin/test/circuit-control \
  -H "Content-Type: application/json" \
  -d '{
    "service": "wallet-service",
    "action": "open"
  }'

## Check health
curl http://localhost:3000/health | jq .features.resilience.circuitBreakers

# 2. Test Retry with Backoff

curl -X POST http://localhost:3000/admin/test/retry \
  -H "Content-Type: application/json" \
  -d '{
    "service": "test-service",
    "maxRetries": 3,
    "shouldFail": true
  }'

# 3. Test Timeout

curl -X POST http://localhost:3000/admin/test/timeout \
  -H "Content-Type: application/json" \
  -d '{
    "delay": 5000,
    "timeout": 2000
  }'

# 4. Test Bulkhead

curl -X POST http://localhost:3000/admin/test/bulkhead \
  -H "Content-Type: application/json" \
  -d '{
    "service": "test-service",
    "concurrent": 10,
    "maxConcurrent": 3,
    "taskDuration": 1000
  }'

# 5. Test Graceful Degradation

curl -X POST http://localhost:3000/admin/test/degradation \
  -H "Content-Type: application/json" \
  -d '{
    "failDomains": ["wallet", "traveler"]
  }'

# 6. Full Stress Test

curl -X POST http://localhost:3000/admin/test/stress \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 30000,
    "requestsPerSecond": 10
  }'

# 7. Get Metrics
curl http://localhost:3000/admin/test/metrics

# 8. Reset State
curl -X POST http://localhost:3000/admin/test/reset
*/

// ============================================
// TEST ROUTES (Add to admin routes)
// ============================================

/*
import { Router } from 'express';
import { resilienceTestController } from './resilience-test.controller';

const testRouter = Router();

testRouter.post('/admin/test/circuit-breaker', resilienceTestController.simulateServiceFailure);
testRouter.post('/admin/test/circuit-control', resilienceTestController.controlCircuit);
testRouter.post('/admin/test/retry', resilienceTestController.testRetry);
testRouter.post('/admin/test/timeout', resilienceTestController.testTimeout);
testRouter.post('/admin/test/bulkhead', resilienceTestController.testBulkhead);
testRouter.post('/admin/test/degradation', resilienceTestController.testDegradation);
testRouter.post('/admin/test/stress', resilienceTestController.stressTest);
testRouter.get('/admin/test/metrics', resilienceTestController.getResilienceMetrics);
testRouter.post('/admin/test/reset', resilienceTestController.resetTestState);

export { testRouter };
*/
