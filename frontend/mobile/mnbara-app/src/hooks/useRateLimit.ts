/**
 * useRateLimit Hook for Mobile App
 * Provides rate limit status and utilities for components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { globalRateLimiter, createRateLimiter, formatRateLimitMessage } from '../utils/rateLimiter';

interface UseRateLimitOptions {
  showAlert?: boolean;
  useGlobal?: boolean;
}

interface RateLimitStatus {
  isLimited: boolean;
  retryAfter: number | null;
  timeRemaining: number;
  message: string | null;
}

export function useRateLimit(options: UseRateLimitOptions = {}) {
  const { showAlert: shouldShowAlert = true, useGlobal = true } = options;
  
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

      if (shouldShowAlert) {
        Alert.alert('Too Many Requests', message, [{ text: 'OK' }]);
      }
    },
    [rateLimiter, shouldShowAlert]
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

      if (shouldShowAlert) {
        Alert.alert('Please Wait', message, [{ text: 'OK' }]);
      }
    }
    return isLimited;
  }, [rateLimiter, shouldShowAlert]);

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
