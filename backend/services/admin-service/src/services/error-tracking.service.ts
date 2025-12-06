import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import '@sentry/tracing';

@Injectable()
export class ErrorTrackingService implements OnModuleInit {
  onModuleInit() {
    // Initialize Sentry
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 1.0,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
      ],
    });

    console.log('Sentry error tracking initialized');
  }

  /**
   * Capture exception
   */
  captureException(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
      extra: context,
    });
  }

  /**
   * Capture message
   */
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  }

  /**
   * Log blockchain error
   */
  logBlockchainError(error: {
    contract: string;
    method: string;
    error: Error;
    txHash?: string;
    from?: string;
    to?: string;
  }) {
    Sentry.captureException(error.error, {
      tags: {
        type: 'blockchain',
        contract: error.contract,
        method: error.method,
      },
      extra: {
        txHash: error.txHash,
        from: error.from,
        to: error.to,
      },
    });
  }

  /**
   * Log API error
   */
  logAPIError(error: {
    endpoint: string;
    method: string;
    statusCode: number;
    error: Error;
    userId?: number;
  }) {
    Sentry.captureException(error.error, {
      tags: {
        type: 'api',
        endpoint: error.endpoint,
        method: error.method,
        statusCode: error.statusCode.toString(),
      },
      user: error.userId ? { id: error.userId.toString() } : undefined,
    });
  }

  /**
   * Log database error
   */
  logDatabaseError(error: {
    query: string;
    error: Error;
    table?: string;
  }) {
    Sentry.captureException(error.error, {
      tags: {
        type: 'database',
        table: error.table,
      },
      extra: {
        query: error.query,
      },
    });
  }

  /**
   * Set user context
   */
  setUser(user: { id: number; email?: string; walletAddress?: string }) {
    Sentry.setUser({
      id: user.id.toString(),
      email: user.email,
      username: user.walletAddress,
    });
  }

  /**
   * Clear user context
   */
  clearUser() {
    Sentry.setUser(null);
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: Sentry.SeverityLevel;
    data?: Record<string, any>;
  }) {
    Sentry.addBreadcrumb({
      message: breadcrumb.message,
      category: breadcrumb.category || 'default',
      level: breadcrumb.level || 'info',
      data: breadcrumb.data,
    });
  }

  /**
   * Start transaction
   */
  startTransaction(name: string, operation: string) {
    return Sentry.startTransaction({
      name,
      op: operation,
    });
  }
}
