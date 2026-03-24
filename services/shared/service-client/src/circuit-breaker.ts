/**
 * Circuit Breaker - Prevents cascading failures in service-to-service communication
 */

import { CircuitBreakerConfig, CircuitBreakerState } from './types';

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly config: CircuitBreakerConfig;
  private readonly logger: any;
  private readonly serviceName: string;

  constructor(serviceName: string, config: Partial<CircuitBreakerConfig> = {}, logger?: any) {
    this.serviceName = serviceName;
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      successThreshold: config.successThreshold ?? 2,
      timeout: config.timeout ?? 60000,
    };
    this.logger = logger || console;
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    // Check if we should transition from OPEN to HALF_OPEN
    if (this.state === CircuitBreakerState.OPEN) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure >= this.config.timeout) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.successCount = 0;
        this.logger.info(`Circuit breaker for ${this.serviceName} transitioned to HALF_OPEN`);
      }
    }

    return this.state;
  }

  /**
   * Record a successful call
   */
  recordSuccess(): void {
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.logger.info(`Circuit breaker for ${this.serviceName} transitioned to CLOSED`);
      }
    } else if (this.state === CircuitBreakerState.CLOSED) {
      this.failureCount = 0;
    }
  }

  /**
   * Record a failed call
   */
  recordFailure(): void {
    this.lastFailureTime = Date.now();

    if (this.state === CircuitBreakerState.CLOSED) {
      this.failureCount++;

      if (this.failureCount >= this.config.failureThreshold) {
        this.state = CircuitBreakerState.OPEN;
        this.logger.warn(
          `Circuit breaker for ${this.serviceName} transitioned to OPEN after ${this.failureCount} failures`
        );
      }
    } else if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.OPEN;
      this.failureCount = 0;
      this.successCount = 0;
      this.logger.warn(`Circuit breaker for ${this.serviceName} transitioned back to OPEN`);
    }
  }

  /**
   * Check if request should be allowed
   */
  canExecute(): boolean {
    const currentState = this.getState();
    return currentState !== CircuitBreakerState.OPEN;
  }

  /**
   * Get circuit breaker status
   */
  getStatus(): {
    state: CircuitBreakerState;
    failureCount: number;
    successCount: number;
    lastFailureTime: number;
  } {
    return {
      state: this.getState(),
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.logger.info(`Circuit breaker for ${this.serviceName} reset`);
  }
}

export const createCircuitBreaker = (
  serviceName: string,
  config?: Partial<CircuitBreakerConfig>,
  logger?: any
): CircuitBreaker => {
  return new CircuitBreaker(serviceName, config, logger);
};
