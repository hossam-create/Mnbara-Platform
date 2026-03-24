/**
 * Logger Utilities
 * Provides structured logging helpers for the API Gateway
 */

import { requestLogger } from '../middleware/logging.middleware';
import { loggingConfig } from '../config/logging.config';

export interface LogContext {
  requestId?: string;
  userId?: string;
  service?: string;
  action?: string;
  [key: string]: unknown;
}

export interface LogMetadata {
  context?: LogContext;
  duration?: number;
  error?: Error | string;
  data?: Record<string, unknown>;
}

/**
 * Log an info message with context
 */
export const logInfo = (message: string, metadata?: LogMetadata): void => {
  requestLogger.info(message, {
    ...metadata?.context,
    duration: metadata?.duration,
    data: metadata?.data,
  });
};

/**
 * Log a warning message with context
 */
export const logWarn = (message: string, metadata?: LogMetadata): void => {
  requestLogger.warn(message, {
    ...metadata?.context,
    duration: metadata?.duration,
    data: metadata?.data,
  });
};

/**
 * Log an error message with context
 */
export const logError = (message: string, metadata?: LogMetadata): void => {
  const errorData = metadata?.error instanceof Error
    ? {
        message: metadata.error.message,
        stack: metadata.error.stack,
      }
    : { message: metadata?.error };

  requestLogger.error(message, {
    ...metadata?.context,
    duration: metadata?.duration,
    error: errorData,
    data: metadata?.data,
  });
};

/**
 * Log a debug message with context
 */
export const logDebug = (message: string, metadata?: LogMetadata): void => {
  requestLogger.debug(message, {
    ...metadata?.context,
    duration: metadata?.duration,
    data: metadata?.data,
  });
};

/**
 * Create a performance timer
 */
export const createTimer = () => {
  const startTime = Date.now();
  return {
    elapsed: (): number => Date.now() - startTime,
    elapsedMs: (): string => `${Date.now() - startTime}ms`,
  };
};

/**
 * Log API call with timing
 */
export const logApiCall = (
  method: string,
  endpoint: string,
  statusCode: number,
  duration: number,
  context?: LogContext
): void => {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  const message = `${method} ${endpoint} - ${statusCode}`;

  requestLogger.log(level, message, {
    ...context,
    method,
    endpoint,
    statusCode,
    duration: `${duration}ms`,
  });
};

/**
 * Log service-to-service communication
 */
export const logServiceCall = (
  fromService: string,
  toService: string,
  method: string,
  endpoint: string,
  statusCode: number,
  duration: number,
  context?: LogContext
): void => {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  const message = `Service call: ${fromService} -> ${toService}`;

  requestLogger.log(level, message, {
    ...context,
    fromService,
    toService,
    method,
    endpoint,
    statusCode,
    duration: `${duration}ms`,
  });
};

/**
 * Log database operation
 */
export const logDatabaseOperation = (
  operation: string,
  table: string,
  duration: number,
  rowsAffected?: number,
  context?: LogContext
): void => {
  requestLogger.info(`Database operation: ${operation} on ${table}`, {
    ...context,
    operation,
    table,
    duration: `${duration}ms`,
    rowsAffected,
  });
};

/**
 * Log cache operation
 */
export const logCacheOperation = (
  operation: 'get' | 'set' | 'delete' | 'clear',
  key: string,
  hit: boolean,
  duration: number,
  context?: LogContext
): void => {
  const message = `Cache ${operation}: ${key} (${hit ? 'HIT' : 'MISS'})`;
  requestLogger.info(message, {
    ...context,
    operation,
    key,
    hit,
    duration: `${duration}ms`,
  });
};

/**
 * Log authentication event
 */
export const logAuthEvent = (
  event: 'login' | 'logout' | 'token_refresh' | 'auth_failed',
  userId?: string,
  reason?: string,
  context?: LogContext
): void => {
  const level = event === 'auth_failed' ? 'warn' : 'info';
  requestLogger.log(level, `Authentication event: ${event}`, {
    ...context,
    event,
    userId,
    reason,
  });
};

/**
 * Log rate limit event
 */
export const logRateLimitEvent = (
  userId: string,
  endpoint: string,
  limit: number,
  remaining: number,
  context?: LogContext
): void => {
  const level = remaining === 0 ? 'warn' : 'info';
  requestLogger.log(level, `Rate limit: ${endpoint}`, {
    ...context,
    userId,
    endpoint,
    limit,
    remaining,
  });
};

/**
 * Log circuit breaker event
 */
export const logCircuitBreakerEvent = (
  service: string,
  state: 'closed' | 'open' | 'half-open',
  reason?: string,
  context?: LogContext
): void => {
  const level = state === 'open' ? 'error' : 'warn';
  requestLogger.log(level, `Circuit breaker: ${service} -> ${state}`, {
    ...context,
    service,
    state,
    reason,
  });
};

/**
 * Log health check result
 */
export const logHealthCheck = (
  service: string,
  healthy: boolean,
  responseTime: number,
  context?: LogContext
): void => {
  const level = healthy ? 'info' : 'warn';
  requestLogger.log(level, `Health check: ${service} - ${healthy ? 'OK' : 'FAILED'}`, {
    ...context,
    service,
    healthy,
    responseTime: `${responseTime}ms`,
  });
};

/**
 * Log queue operation
 */
export const logQueueOperation = (
  operation: 'enqueue' | 'dequeue' | 'process',
  queueName: string,
  itemCount: number,
  duration?: number,
  context?: LogContext
): void => {
  requestLogger.info(`Queue operation: ${operation} on ${queueName}`, {
    ...context,
    operation,
    queueName,
    itemCount,
    duration: duration ? `${duration}ms` : undefined,
  });
};

/**
 * Log business event
 */
export const logBusinessEvent = (
  eventType: string,
  eventData: Record<string, unknown>,
  context?: LogContext
): void => {
  requestLogger.info(`Business event: ${eventType}`, {
    ...context,
    eventType,
    ...eventData,
  });
};

/**
 * Log security event
 */
export const logSecurityEvent = (
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, unknown>,
  context?: LogContext
): void => {
  const level = severity === 'critical' ? 'error' : severity === 'high' ? 'warn' : 'info';
  requestLogger.log(level, `Security event: ${eventType} (${severity})`, {
    ...context,
    eventType,
    severity,
    ...details,
  });
};

export default {
  logInfo,
  logWarn,
  logError,
  logDebug,
  createTimer,
  logApiCall,
  logServiceCall,
  logDatabaseOperation,
  logCacheOperation,
  logAuthEvent,
  logRateLimitEvent,
  logCircuitBreakerEvent,
  logHealthCheck,
  logQueueOperation,
  logBusinessEvent,
  logSecurityEvent,
};
