/**
 * Sentry Configuration for MNBARA Admin Dashboard
 * Requirements: 20.3 - Configure alerts for payment failures, auction timer drift, and service health
 */

import * as Sentry from '@sentry/react';

// Environment configuration
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';
const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || 'development';
const RELEASE = import.meta.env.VITE_APP_VERSION || '1.0.0';

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
    release: `mnbara-admin@${RELEASE}`,
    
    // Performance monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Performance sample rates - higher for admin dashboard
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.2 : 1.0,
    
    // Session replay sample rates
    replaysSessionSampleRate: ENVIRONMENT === 'production' ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,
    
    // Filter out non-critical errors
    beforeSend(event: Sentry.ErrorEvent, hint: Sentry.EventHint) {
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
    
    // Add custom tags for admin dashboard
    initialScope: {
      tags: {
        app: 'mnbara-admin',
        platform: 'web',
        dashboard: 'admin',
      },
    },
  });
}

/**
 * Set admin user context for Sentry
 */
export function setSentryUser(user: { id: string; email?: string; role?: string } | null): void {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
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
      scope.setExtras(context);
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
      scope.setExtras(context);
    }
    Sentry.captureMessage(message);
  });
}

/**
 * Add breadcrumb for tracking admin actions
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

// Export Sentry for direct access when needed
export { Sentry };
