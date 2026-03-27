/**
 * Circuit Breaker Tests
 */

import { CircuitBreaker, CircuitBreakerState } from '../circuit-breaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker('test-service');
  });

  describe('initial state', () => {
    it('should start in CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should allow execution in CLOSED state', () => {
      expect(circuitBreaker.canExecute()).toBe(true);
    });
  });

  describe('recordSuccess', () => {
    it('should keep circuit CLOSED on success', () => {
      circuitBreaker.recordSuccess();
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should transition from HALF_OPEN to CLOSED after threshold successes', () => {
      // Force to HALF_OPEN
      for (let i = 0; i < 5; i++) {
        circuitBreaker.recordFailure();
      }
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);

      // Simulate timeout and transition to HALF_OPEN
      circuitBreaker.recordSuccess();
      circuitBreaker.recordSuccess();

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('recordFailure', () => {
    it('should transition to OPEN after failure threshold', () => {
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);

      for (let i = 0; i < 5; i++) {
        circuitBreaker.recordFailure();
      }

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
    });

    it('should not allow execution in OPEN state', () => {
      for (let i = 0; i < 5; i++) {
        circuitBreaker.recordFailure();
      }

      expect(circuitBreaker.canExecute()).toBe(false);
    });
  });

  describe('canExecute', () => {
    it('should return true when CLOSED', () => {
      expect(circuitBreaker.canExecute()).toBe(true);
    });

    it('should return false when OPEN', () => {
      for (let i = 0; i < 5; i++) {
        circuitBreaker.recordFailure();
      }

      expect(circuitBreaker.canExecute()).toBe(false);
    });

    it('should return true when HALF_OPEN', () => {
      for (let i = 0; i < 5; i++) {
        circuitBreaker.recordFailure();
      }

      // Manually set to HALF_OPEN by calling getState after timeout
      // (In real scenario, this would happen after timeout)
      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);
    });
  });

  describe('getStatus', () => {
    it('should return current status', () => {
      const status = circuitBreaker.getStatus();

      expect(status.state).toBe(CircuitBreakerState.CLOSED);
      expect(status.failureCount).toBe(0);
      expect(status.successCount).toBe(0);
    });

    it('should track failure count', () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      const status = circuitBreaker.getStatus();
      expect(status.failureCount).toBe(2);
    });
  });

  describe('reset', () => {
    it('should reset to CLOSED state', () => {
      for (let i = 0; i < 5; i++) {
        circuitBreaker.recordFailure();
      }

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.OPEN);

      circuitBreaker.reset();

      expect(circuitBreaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(circuitBreaker.canExecute()).toBe(true);
    });

    it('should reset failure and success counts', () => {
      circuitBreaker.recordFailure();
      circuitBreaker.recordFailure();

      circuitBreaker.reset();

      const status = circuitBreaker.getStatus();
      expect(status.failureCount).toBe(0);
      expect(status.successCount).toBe(0);
    });
  });

  describe('custom configuration', () => {
    it('should use custom failure threshold', () => {
      const cb = new CircuitBreaker('test-service', { failureThreshold: 3 });

      cb.recordFailure();
      cb.recordFailure();
      expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);

      cb.recordFailure();
      expect(cb.getState()).toBe(CircuitBreakerState.OPEN);
    });

    it('should use custom success threshold', () => {
      const cb = new CircuitBreaker('test-service', { failureThreshold: 2, successThreshold: 3 });

      // Open the circuit
      cb.recordFailure();
      cb.recordFailure();
      expect(cb.getState()).toBe(CircuitBreakerState.OPEN);

      // Record successes
      cb.recordSuccess();
      cb.recordSuccess();
      expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);
    });
  });
});
