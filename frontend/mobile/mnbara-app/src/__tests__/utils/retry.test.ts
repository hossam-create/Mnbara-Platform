import { withRetry, RetryPresets } from '../../utils/retry';
import { NetworkError, RateLimitError, ValidationError } from '../../utils/errors';

describe('withRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return result on first successful attempt', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    
    const result = await withRetry(fn);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable error and succeed', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new NetworkError())
      .mockResolvedValueOnce('success');
    
    const resultPromise = withRetry(fn, { maxRetries: 3, baseDelay: 100 });
    
    // Fast-forward through the delay
    await jest.advanceTimersByTimeAsync(200);
    
    const result = await resultPromise;
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries exceeded', async () => {
    const error = new NetworkError();
    const fn = jest.fn().mockRejectedValue(error);
    
    const resultPromise = withRetry(fn, { maxRetries: 2, baseDelay: 100 });
    
    // Fast-forward through all retries
    await jest.advanceTimersByTimeAsync(1000);
    
    await expect(resultPromise).rejects.toThrow(error);
    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should not retry non-retryable errors', async () => {
    const error = new ValidationError({ field: ['error'] });
    const fn = jest.fn().mockRejectedValue(error);
    
    await expect(withRetry(fn)).rejects.toThrow(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should use RateLimitError retryAfter for delay', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new RateLimitError(5))
      .mockResolvedValueOnce('success');
    
    const onRetry = jest.fn();
    const resultPromise = withRetry(fn, { maxRetries: 3, onRetry });
    
    // Fast-forward through the rate limit delay (5 seconds)
    await jest.advanceTimersByTimeAsync(5000);
    
    const result = await resultPromise;
    
    expect(result).toBe('success');
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(RateLimitError), 5000);
  });

  it('should call onRetry callback on each retry', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new NetworkError())
      .mockRejectedValueOnce(new NetworkError())
      .mockResolvedValueOnce('success');
    
    const onRetry = jest.fn();
    const resultPromise = withRetry(fn, { maxRetries: 3, baseDelay: 100, onRetry });
    
    await jest.advanceTimersByTimeAsync(1000);
    
    await resultPromise;
    
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(NetworkError), expect.any(Number));
    expect(onRetry).toHaveBeenCalledWith(2, expect.any(NetworkError), expect.any(Number));
  });

  it('should use custom retry condition', async () => {
    const customError = new Error('Custom error');
    const fn = jest.fn()
      .mockRejectedValueOnce(customError)
      .mockResolvedValueOnce('success');
    
    const retryCondition = jest.fn().mockReturnValue(true);
    const resultPromise = withRetry(fn, { 
      maxRetries: 3, 
      baseDelay: 100,
      retryCondition 
    });
    
    await jest.advanceTimersByTimeAsync(200);
    
    const result = await resultPromise;
    
    expect(result).toBe('success');
    expect(retryCondition).toHaveBeenCalledWith(customError);
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
});
