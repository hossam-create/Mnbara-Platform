/**
 * Sentry Configuration for MNBARA Mobile Application
 * Requirements: 20.3 - Configure alerts for payment failures, auction timer drift, and service health
 */

import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
// @ts-ignore - Config is loaded from react-native-config or similar
import Config from 'react-native-config';

// Environment configuration - these should be set in your .env file
// For React Native, use react-native-config or similar package
const SENTRY_DSN = Config?.SENTRY_DSN || '';
const ENVIRONMENT = Config?.ENVIRONMENT || __DEV__ ? 'development' : 'production';
const RELEASE = Config?.APP_VERSION || '1.0.0';

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initSentry(): void {
  if (!SENTRY_DSN) {
    console.warn('[Sentry] DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: `mnbara-mobile@${RELEASE}`,
    dist: Platform.OS,
    
    // Enable automatic instrumentation
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    
    // Performance monitoring
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    
    // Enable native crash reporting
    enableNativeCrashHandling: true,
    
    // Attach screenshots on crash (iOS only)
    attachScreenshot: true,
    
    // Filter out non-critical errors
    beforeSend(event: Sentry.Event, hint: Sentry.EventHint) {
      const error = hint.originalException;
      
      // Ignore network errors that are expected
      if (error instanceof Error) {
        if (error.message.includes('Network Error')) {
          return null;
        }
        // Ignore cancelled requests
        if (error.message.includes('canceled')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Add custom tags
    initialScope: {
      tags: {
        app: 'mnbara-mobile',
        platform: Platform.OS,
      },
    },
  });
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(user: { id: string; email?: string; role?: string } | null): void {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      // @ts-ignore - role is a custom field
      role: user.role,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Capture a custom error with additional context
 */
export function captureError(
  error: Error,
  context?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'error'
): void {
  Sentry.withScope((scope: Sentry.Scope) => {
    scope.setLevel(level);
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture a custom message
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>
): void {
  Sentry.withScope((scope: Sentry.Scope) => {
    scope.setLevel(level);
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureMessage(message);
  });
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

/**
 * Wrap a component with Sentry error boundary
 */
export const withSentryErrorBoundary = Sentry.wrap;

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startSpan({ name, op }, () => {});
}

// Export Sentry for direct access when needed
export { Sentry };
