/**
 * useRateLimit Hook
 * Provides rate limit status and utilities for components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { globalRateLimiter, createRateLimiter, formatRateLimitMessage } from '../utils/rateLimiter';
import { useToast } from '../context/ToastContext';

interface UseRateLimitOptions {
  showToast?: boolean;
  useGlobal?: boolean;
}

interface RateLimitStatus {
  isLimited: boolean;
  retryAfter: number | null;
  timeRemaining: number;
  message: string | null;
}

export function useRateLimit(options: UseRateLimitOptions = {}) {
  const { showToast: shouldShowToast = true, useGlobal = true } = options;
  const toast = useToast();
  
  const rateLimiterRef = useRef(useGlobal ? globalRateLimiter : createRateLimiter());
  const rateLimiter = rateLimiterRef.current;

  const [status, setStatus] = useState<RateLimitStatus>({
    isLimited: false,
    retryAfter: null,
    timeRemaining: 0,
    message: null,
  });

  // Update status periodically when rate limited
  useEffect(() => {
    if (!status.isLimited) return;

    const interval = setInterval(() => {
      const remaining = rateLimiter.getTimeRemaining();
      if (remaining <= 0) {
        setStatus({
          isLimited: false,
          retryAfter: null,
          timeRemaining: 0,
          message: null,
        });
      } else {
        setStatus((prev) => ({
          ...prev,
          timeRemaining: remaining,
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status.isLimited, rateLimiter]);

  /**
   * Handle a rate limit error
   */
  const handleRateLimitError = useCallback(
    (retryAfter?: number) => {
      rateLimiter.handleRateLimitError({ retryAfter });
      
      const actualRetryAfter = rateLimiter.getRetryAfter() ?? 30;
      const message = formatRateLimitMessage(actualRetryAfter);

      setStatus({
        isLimited: true,
        retryAfter: actualRetryAfter,
        timeRemaining: rateLimiter.getTimeRemaining(),
        message,
      });

      if (shouldShowToast) {
        toast.showWarning('Rate Limited', message);
      }
    },
    [rateLimiter, shouldShowToast, toast]
  );

  /**
   * Handle a successful request
   */
  const handleSuccess = useCallback(() => {
    rateLimiter.handleSuccess();
  }, [rateLimiter]);

  /**
   * Clear rate limit manually
   */
  const clearRateLimit = useCallback(() => {
    rateLimiter.clearRateLimit();
    setStatus({
      isLimited: false,
      retryAfter: null,
      timeRemaining: 0,
      message: null,
    });
  }, [rateLimiter]);

  /**
   * Check if rate limited before making a request
   */
  const checkRateLimit = useCallback((): boolean => {
    const isLimited = rateLimiter.isRateLimited();
    if (isLimited) {
      const retryAfter = rateLimiter.getRetryAfter() ?? 30;
      const message = formatRateLimitMessage(retryAfter);
      
      setStatus({
        isLimited: true,
        retryAfter,
        timeRemaining: rateLimiter.getTimeRemaining(),
        message,
      });

      if (shouldShowToast) {
        toast.showWarning('Please Wait', message);
      }
    }
    return isLimited;
  }, [rateLimiter, shouldShowToast, toast]);

  /**
   * Wrap an async function with rate limit handling
   */
  const withRateLimitHandling = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      if (checkRateLimit()) {
        return null;
      }

      try {
        const result = await fn();
        handleSuccess();
        return result;
      } catch (error) {
        // Check if it's a rate limit error (status 429)
        if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
          const retryAfter = 'retryAfter' in error ? (error.retryAfter as number) : undefined;
          handleRateLimitError(retryAfter);
        }
        throw error;
      }
    },
    [checkRateLimit, handleSuccess, handleRateLimitError]
  );

  return {
    ...status,
    handleRateLimitError,
    handleSuccess,
    clearRateLimit,
    checkRateLimit,
    withRateLimitHandling,
  };
}

export default useRateLimit;
