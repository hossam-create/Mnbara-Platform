import { RetryStrategy, RetryConfig } from '../RetryStrategy';

describe('RetryStrategy', () => {
  let config: RetryConfig;

  beforeEach(() => {
    config = {
      maxRetries: 3,
      initialDelayMs: 100,
      maxDelayMs: 1000,
      backoffMultiplier: 2
    };
  });

  describe('Successful Execution', () => {
    it('should execute function once if successful', async () => {
      const strategy = new RetryStrategy('test', config);
      const fn = jest.fn().mockResolvedValue('success');

      const result = await strategy.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should return result on first success', async () => {
      const strategy = new RetryStrategy('test', config);
      const fn = jest.fn().mockResolvedValue({ data: 'test' });

      const result = await strategy.execute(fn);

      expect(result).toEqual({ data: 'test' });
    });
  });

  describe('Retry Behavior', () => {
    it('should retry on failure up to maxRetries', async () => {
      const strategy = new RetryStrategy('test', config);
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      await expect(strategy.execute(fn)).rejects.toThrow('fail');

      // Should be called: initial + 3 retries = 4 times
      expect(fn).toHaveBeenCalledTimes(4);
    });

    it('should succeed on retry if function eventually succeeds', async () => {
      const strategy = new RetryStrategy('test', config);
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const result = await strategy.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should apply exponential backoff', async () => {
      const strategy = new RetryStrategy('test', config);
      const fn = jest.fn().mockRejectedValue(new Error('fail'));
      const startTime = Date.now();

      await expect(strategy.execute(fn)).rejects.toThrow('fail');

      const duration = Date.now() - startTime;

      // Expected delays: 100ms, 200ms, 400ms = 700ms total
      // Allow some tolerance for execution time
      expect(duration).toBeGreaterThanOrEqual(650);
      expect(duration).toBeLessThan(900);
    });

    it('should cap delay at maxDelayMs', async () => {
      const strategy = new RetryStrategy('test', {
        maxRetries: 5,
        initialDelayMs: 100,
        maxDelayMs: 200,
        backoffMultiplier: 2
      });
      const fn = jest.fn().mockRejectedValue(new Error('fail'));
      const startTime = Date.now();

      await expect(strategy.execute(fn)).rejects.toThrow('fail');

      const duration = Date.now() - startTime;

      // Expected delays: 100ms, 200ms, 200ms, 200ms, 200ms = 900ms total
      // Allow some tolerance
      expect(duration).toBeGreaterThanOrEqual(850);
      expect(duration).toBeLessThan(1100);
    });
  });

  describe('Retryable Error Filtering', () => {
    it('should not retry if error is not retryable', async () => {
      const strategy = new RetryStrategy('test', config);
      const fn = jest.fn().mockRejectedValue(new Error('not retryable'));
      const isRetryable = jest.fn().mockReturnValue(false);

      await expect(strategy.execute(fn, isRetryable)).rejects.toThrow('not retryable');

      // Should only be called once (no retries)
      expect(fn).toHaveBeenCalledTimes(1);
      expect(isRetryable).toHaveBeenCalledTimes(1);
    });

    it('should retry if error is retryable', async () => {
      const strategy = new RetryStrategy('test', config);
      const fn = jest.fn().mockRejectedValue(new Error('retryable'));
      const isRetryable = jest.fn().mockReturnValue(true);

      await expect(strategy.execute(fn, isRetryable)).rejects.toThrow('retryable');

      // Should be called: initial + 3 retries = 4 times
      expect(fn).toHaveBeenCalledTimes(4);
      // isRetryable is called 3 times (not on the final failure)
      expect(isRetryable).toHaveBeenCalledTimes(3);
    });

    it('should stop retrying if error becomes non-retryable', async () => {
      const strategy = new RetryStrategy('test', config);
      const fn = jest.fn().mockRejectedValue(new Error('fail'));
      const isRetryable = jest.fn()
        .mockReturnValueOnce(true)  // First failure - retry
        .mockReturnValueOnce(false); // Second failure - don't retry

      await expect(strategy.execute(fn, isRetryable)).rejects.toThrow('fail');

      // Should be called: initial + 1 retry = 2 times
      expect(fn).toHaveBeenCalledTimes(2);
      expect(isRetryable).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle maxRetries = 0', async () => {
      const strategy = new RetryStrategy('test', { ...config, maxRetries: 0 });
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      await expect(strategy.execute(fn)).rejects.toThrow('fail');

      // Should only be called once (no retries)
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle very small delays', async () => {
      const strategy = new RetryStrategy('test', {
        maxRetries: 2,
        initialDelayMs: 1,
        maxDelayMs: 10,
        backoffMultiplier: 2
      });
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      await expect(strategy.execute(fn)).rejects.toThrow('fail');

      // Should complete quickly
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should handle backoffMultiplier = 1 (constant delay)', async () => {
      const strategy = new RetryStrategy('test', {
        maxRetries: 3,
        initialDelayMs: 100,
        maxDelayMs: 1000,
        backoffMultiplier: 1
      });
      const fn = jest.fn().mockRejectedValue(new Error('fail'));
      const startTime = Date.now();

      await expect(strategy.execute(fn)).rejects.toThrow('fail');

      const duration = Date.now() - startTime;

      // Expected delays: 100ms, 100ms, 100ms = 300ms total
      expect(duration).toBeGreaterThanOrEqual(280);
      expect(duration).toBeLessThan(400);
    });
  });

  describe('Error Propagation', () => {
    it('should propagate the last error after all retries', async () => {
      const strategy = new RetryStrategy('test', config);
      const error = new Error('final error');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(strategy.execute(fn)).rejects.toThrow('final error');
    });

    it('should propagate different errors on each retry', async () => {
      const strategy = new RetryStrategy('test', config);
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('error 1'))
        .mockRejectedValueOnce(new Error('error 2'))
        .mockRejectedValueOnce(new Error('error 3'))
        .mockRejectedValueOnce(new Error('error 4'));

      await expect(strategy.execute(fn)).rejects.toThrow('error 4');
    });
  });
});
