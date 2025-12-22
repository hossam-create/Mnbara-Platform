/**
 * useApiError Hook
 * Provides centralized error handling with toast notifications
 */

import { useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import {
  parseError,
  formatValidationErrors,
  AuthenticationError,
  RateLimitError,
  ValidationError,
} from '../utils/errors';
import type { ParsedError } from '../utils/errors';

interface UseApiErrorOptions {
  showToast?: boolean;
  onAuthError?: () => void;
  onRateLimitError?: (retryAfter?: number) => void;
  onValidationError?: (fields: Record<string, string[]>) => void;
}

interface HandleErrorResult {
  parsed: ParsedError;
  handled: boolean;
}

export function useApiError(options: UseApiErrorOptions = {}) {
  const { showToast: shouldShowToast = true, onAuthError, onRateLimitError, onValidationError } = options;
  const toast = useToast();

  /**
   * Handle an API error with appropriate user feedback
   */
  const handleError = useCallback(
    (error: unknown, customMessage?: string): HandleErrorResult => {
      const parsed = parseError(error);

      // Handle authentication errors
      if (error instanceof AuthenticationError || parsed.status === 401) {
        if (onAuthError) {
          onAuthError();
        }
        if (shouldShowToast) {
          toast.showError('Session Expired', 'Please log in again to continue.');
        }
        return { parsed, handled: true };
      }

      // Handle rate limit errors
      if (error instanceof RateLimitError || parsed.status === 429) {
        const rateLimitError = error instanceof RateLimitError ? error : null;
        if (onRateLimitError) {
          onRateLimitError(rateLimitError?.retryAfter);
        }
        if (shouldShowToast) {
          toast.showWarning('Too Many Requests', parsed.message);
        }
        return { parsed, handled: true };
      }

      // Handle validation errors
      if (error instanceof ValidationError || parsed.status === 422) {
        if (parsed.details && onValidationError) {
          onValidationError(parsed.details);
        }
        if (shouldShowToast && parsed.details) {
          const messages = formatValidationErrors(parsed.details);
          toast.showError('Validation Error', messages.join('\n'));
        } else if (shouldShowToast) {
          toast.showError('Validation Error', parsed.message);
        }
        return { parsed, handled: true };
      }

      // Handle other errors
      if (shouldShowToast) {
        const title = customMessage || 'Error';
        toast.showError(title, parsed.message);
      }

      return { parsed, handled: true };
    },
    [toast, shouldShowToast, onAuthError, onRateLimitError, onValidationError]
  );

  /**
   * Wrap an async function with error handling
   */
  const withErrorHandling = useCallback(
    <T>(fn: () => Promise<T>, customMessage?: string): Promise<T | null> => {
      return fn().catch((error) => {
        handleError(error, customMessage);
        return null;
      });
    },
    [handleError]
  );

  /**
   * Execute an async function and return result with error info
   */
  const executeWithError = useCallback(
    async <T>(
      fn: () => Promise<T>,
      customMessage?: string
    ): Promise<{ data: T | null; error: ParsedError | null }> => {
      try {
        const data = await fn();
        return { data, error: null };
      } catch (error) {
        const { parsed } = handleError(error, customMessage);
        return { data: null, error: parsed };
      }
    },
    [handleError]
  );

  return {
    handleError,
    withErrorHandling,
    executeWithError,
    parseError,
  };
}

export default useApiError;
