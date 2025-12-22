import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, createRetryable, RetryPresets } from '../retry';
import { NetworkError, RateLimitError, ValidationError } from '../errors';

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return result on first successful attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    
    const result = await withRetry(fn);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable error and succeed', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new NetworkError())
      .mockResolvedValueOnce('success');
    
    const resultPromise = withRetry(fn, { maxRetries: 3, baseDelay: 100 });
    
    // Fast-forward through the delay
    await vi.advanceTimersByTimeAsync(200);
    
    const result = await resultPromise;
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries exceeded', async () => {
    vi.useRealTimers(); // Use real timers for this test to avoid unhandled rejection
    
    const error = new NetworkError();
    const fn = vi.fn().mockRejectedValue(error);
    
    await expect(withRetry(fn, { maxRetries: 2, baseDelay: 10 })).rejects.toThrow(error);
    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    
    vi.useFakeTimers(); // Restore fake timers
  });

  it('should not retry non-retryable errors', async () => {
    const error = new ValidationError({ field: ['error'] });
    const fn = vi.fn().mockRejectedValue(error);
    
    await expect(withRetry(fn)).rejects.toThrow(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should use RateLimitError retryAfter for delay', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new RateLimitError(5))
      .mockResolvedValueOnce('success');
    
    const onRetry = vi.fn();
    const resultPromise = withRetry(fn, { maxRetries: 3, onRetry });
    
    // Fast-forward through the rate limit delay (5 seconds)
    await vi.advanceTimersByTimeAsync(5000);
    
    const result = await resultPromise;
    
    expect(result).toBe('success');
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(RateLimitError), 5000);
  });

  it('should call onRetry callback on each retry', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new NetworkError())
      .mockRejectedValueOnce(new NetworkError())
      .mockResolvedValueOnce('success');
    
    const onRetry = vi.fn();
    const resultPromise = withRetry(fn, { maxRetries: 3, baseDelay: 100, onRetry });
    
    await vi.advanceTimersByTimeAsync(1000);
    
    await resultPromise;
    
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(NetworkError), expect.any(Number));
    expect(onRetry).toHaveBeenCalledWith(2, expect.any(NetworkError), expect.any(Number));
  });

  it('should use custom retry condition', async () => {
    const customError = new Error('Custom error');
    const fn = vi.fn()
      .mockRejectedValueOnce(customError)
      .mockResolvedValueOnce('success');
    
    const retryCondition = vi.fn().mockReturnValue(true);
    const resultPromise = withRetry(fn, { 
      maxRetries: 3, 
      baseDelay: 100,
      retryCondition 
    });
    
    await vi.advanceTimersByTimeAsync(200);
    
    const result = await resultPromise;
    
    expect(result).toBe('success');
    expect(retryCondition).toHaveBeenCalledWith(customError);
  });

  it('should respect maxDelay configuration', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new NetworkError())
      .mockRejectedValueOnce(new NetworkError())
      .mockRejectedValueOnce(new NetworkError())
      .mockResolvedValueOnce('success');
    
    const onRetry = vi.fn();
    const resultPromise = withRetry(fn, { 
      maxRetries: 5, 
      baseDelay: 1000,
      maxDelay: 2000,
      backoffMultiplier: 10,
      onRetry 
    });
    
    await vi.advanceTimersByTimeAsync(10000);
    
    await resultPromise;
    
    // Check that delays are capped at maxDelay
    onRetry.mock.calls.forEach((call) => {
      const delay = call[2];
      expect(delay).toBeLessThanOrEqual(2000);
    });
  });
});

describe('createRetryable', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create a retryable function', async () => {
    const originalFn = vi.fn()
      .mockRejectedValueOnce(new NetworkError())
      .mockResolvedValueOnce('success');
    
    const retryableFn = createRetryable(originalFn, { maxRetries: 3, baseDelay: 100 });
    const resultPromise = retryableFn('arg1', 'arg2');
    
    await vi.advanceTimersByTimeAsync(200);
    
    const result = await resultPromise;
    
    expect(result).toBe('success');
    expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('RetryPresets', () => {
  it('should have quick preset with correct values', () => {
    expect(RetryPresets.quick.maxRetries).toBe(2);
    expect(RetryPresets.quick.baseDelay).toBe(500);
    expect(RetryPresets.quick.maxDelay).toBe(2000);
  });

  it('should have standard preset with correct values', () => {
    expect(RetryPresets.standard.maxRetries).toBe(3);
    expect(RetryPresets.standard.baseDelay).toBe(1000);
    expect(RetryPresets.standard.maxDelay).toBe(10000);
  });

  it('should have aggressive preset with correct values', () => {
    expect(RetryPresets.aggressive.maxRetries).toBe(5);
    expect(RetryPresets.aggressive.baseDelay).toBe(1000);
    expect(RetryPresets.aggressive.maxDelay).toBe(30000);
  });

  it('should have none preset with zero retries', () => {
    expect(RetryPresets.none.maxRetries).toBe(0);
  });
});
