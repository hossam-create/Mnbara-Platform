import { CircuitBreaker, CircuitState, CircuitBreakerConfig } from '../CircuitBreaker';

describe('CircuitBreaker', () => {
  let config: CircuitBreakerConfig;

  beforeEach(() => {
    config = {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
      rollingWindowMs: 60000
    };
  });

  describe('State Transitions', () => {
    it('should start in CLOSED state', () => {
      const breaker = new CircuitBreaker('test', config);
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should transition to OPEN after failure threshold', async () => {
      const breaker = new CircuitBreaker('test', config);
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));

      // Execute 3 times to hit threshold
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should transition to HALF_OPEN after timeout', async () => {
      const breaker = new CircuitBreaker('test', { ...config, timeout: 100 });
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));

      // Trigger OPEN state
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Next execution should transition to HALF_OPEN
      const successFn = jest.fn().mockResolvedValue('success');
      await breaker.execute(successFn);

      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
    });

    it('should transition from HALF_OPEN to CLOSED after success threshold', async () => {
      const breaker = new CircuitBreaker('test', { ...config, timeout: 100 });
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));

      // Trigger OPEN state
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
      }

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Execute successfully to reach success threshold
      const successFn = jest.fn().mockResolvedValue('success');
      await breaker.execute(successFn); // HALF_OPEN
      await breaker.execute(successFn); // Should transition to CLOSED

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should transition from HALF_OPEN back to OPEN on failure', async () => {
      const breaker = new CircuitBreaker('test', { ...config, timeout: 100 });
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));

      // Trigger OPEN state
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
      }

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Execute successfully once to enter HALF_OPEN
      const successFn = jest.fn().mockResolvedValue('success');
      await breaker.execute(successFn);
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      // Fail again - should go back to OPEN
      await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('Execution Behavior', () => {
    it('should execute function when CLOSED', async () => {
      const breaker = new CircuitBreaker('test', config);
      const fn = jest.fn().mockResolvedValue('success');

      const result = await breaker.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reject immediately when OPEN', async () => {
      const breaker = new CircuitBreaker('test', config);
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));

      // Trigger OPEN state
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
      }

      // Should reject without calling function
      const fn = jest.fn().mockResolvedValue('success');
      await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker [test] is OPEN');
      expect(fn).not.toHaveBeenCalled();
    });

    it('should reset failure count on success in CLOSED state', async () => {
      const breaker = new CircuitBreaker('test', config);
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));
      const successFn = jest.fn().mockResolvedValue('success');

      // Fail twice (below threshold)
      await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
      await expect(breaker.execute(failingFn)).rejects.toThrow('fail');

      // Succeed - should reset failure count
      await breaker.execute(successFn);

      // Should still be CLOSED
      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      // Fail twice more - should not open (count was reset)
      await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
      await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('Statistics', () => {
    it('should track failure count', async () => {
      const breaker = new CircuitBreaker('test', config);
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));

      await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
      await expect(breaker.execute(failingFn)).rejects.toThrow('fail');

      const stats = breaker.getStats();
      expect(stats.failures).toBe(2);
    });

    it('should track success count in HALF_OPEN', async () => {
      const breaker = new CircuitBreaker('test', { ...config, timeout: 100 });
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));

      // Trigger OPEN
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
      }

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Execute successfully
      const successFn = jest.fn().mockResolvedValue('success');
      await breaker.execute(successFn);

      const stats = breaker.getStats();
      expect(stats.successes).toBe(1);
    });

    it('should reset stats when transitioning to CLOSED', async () => {
      const breaker = new CircuitBreaker('test', { ...config, timeout: 100 });
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));

      // Trigger OPEN
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
      }

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Execute successfully to reach CLOSED
      const successFn = jest.fn().mockResolvedValue('success');
      await breaker.execute(successFn);
      await breaker.execute(successFn);

      const stats = breaker.getStats();
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
    });
  });

  describe('Reset', () => {
    it('should reset to CLOSED state', async () => {
      const breaker = new CircuitBreaker('test', config);
      const failingFn = jest.fn().mockRejectedValue(new Error('fail'));

      // Trigger OPEN
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failingFn)).rejects.toThrow('fail');
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Reset
      breaker.reset();

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      const stats = breaker.getStats();
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
    });
  });
});
