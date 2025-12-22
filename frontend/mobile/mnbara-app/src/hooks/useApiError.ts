/**
 * useApiError Hook for Mobile App
 * Provides centralized error handling with user-friendly alerts
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import {
  parseError,
  formatValidationErrors,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  OfflineError,
} from '../utils/errors';
import type { ParsedError } from '../utils/errors';
import { useAuthStore } from '../store/authStore';

interface UseApiErrorOptions {
  showAlert?: boolean;
  onAuthError?: () => void;
  onOfflineError?: () => void;
  onRateLimitError?: (retryAfter?: number) => void;
  onValidationError?: (fields: Record<string, string[]>) => void;
}

interface HandleErrorResult {
  parsed: ParsedError;
  handled: boolean;
}

export function useApiError(options: UseApiErrorOptions = {}) {
  const {
    showAlert: shouldShowAlert = true,
    onAuthError,
    onOfflineError,
    onRateLimitError,
    onValidationError,
  } = options;
  const logout = useAuthStore((state) => state.logout);

  /**
   * Show an alert dialog
   */
  const showAlert = useCallback(
    (title: string, message: string, buttons?: { text: string; onPress?: () => void }[]) => {
      if (!shouldShowAlert) return;
      Alert.alert(
        title,
        message,
        buttons || [{ text: 'OK' }],
        { cancelable: true }
      );
    },
    [shouldShowAlert]
  );

  /**
   * Handle an API error with appropriate user feedback
   */
  const handleError = useCallback(
    (error: unknown, customTitle?: string): HandleErrorResult => {
      const parsed = parseError(error);

      // Handle offline errors
      if (error instanceof OfflineError || parsed.isOffline) {
        if (onOfflineError) {
          onOfflineError();
        }
        showAlert(
          'You\'re Offline',
          'Your request has been saved and will be sent when you\'re back online.',
          [{ text: 'OK' }]
        );
        return { parsed, handled: true };
      }

      // Handle authentication errors
      if (error instanceof AuthenticationError || parsed.status === 401) {
        if (onAuthError) {
          onAuthError();
        } else {
          logout();
        }
        showAlert(
          'Session Expired',
          'Please log in again to continue.',
          [{ text: 'OK' }]
        );
        return { parsed, handled: true };
      }

      // Handle rate limit errors
      if (error instanceof RateLimitError || parsed.status === 429) {
        const rateLimitError = error instanceof RateLimitError ? error : null;
        if (onRateLimitError) {
          onRateLimitError(rateLimitError?.retryAfter);
        }
        showAlert(
          'Too Many Requests',
          parsed.message,
          [{ text: 'OK' }]
        );
        return { parsed, handled: true };
      }

      // Handle validation errors
      if (error instanceof ValidationError || parsed.status === 422) {
        if (parsed.details && onValidationError) {
          onValidationError(parsed.details);
        }
        const message = parsed.details
          ? formatValidationErrors(parsed.details)
          : parsed.message;
        showAlert(
          'Validation Error',
          message,
          [{ text: 'OK' }]
        );
        return { parsed, handled: true };
      }

      // Handle other errors
      showAlert(
        customTitle || 'Error',
        parsed.message,
        [{ text: 'OK' }]
      );

      return { parsed, handled: true };
    },
    [showAlert, logout, onAuthError, onOfflineError, onRateLimitError, onValidationError]
  );

  /**
   * Wrap an async function with error handling
   */
  const withErrorHandling = useCallback(
    <T>(fn: () => Promise<T>, customTitle?: string): Promise<T | null> => {
      return fn().catch((error) => {
        handleError(error, customTitle);
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
      customTitle?: string
    ): Promise<{ data: T | null; error: ParsedError | null }> => {
      try {
        const data = await fn();
        return { data, error: null };
      } catch (error) {
        const { parsed } = handleError(error, customTitle);
        return { data: null, error: parsed };
      }
    },
    [handleError]
  );

  return {
    handleError,
    withErrorHandling,
    executeWithError,
    showAlert,
    parseError,
  };
}

export default useApiError;
