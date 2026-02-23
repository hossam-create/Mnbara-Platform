/**
 * Correlation Logging Middleware
 * 
 * Adds trace context (traceId, spanId) and user context to every log line.
 * Ensures logs are structured and searchable by trace ID.
 * 
 * Format: {
 *   timestamp: string,
 *   level: string,
 *   message: string,
 *   service: string,
 *   traceId?: string,
 *   spanId?: string,
 *   userId?: string,
 *   requestId?: string,
 *   ...metadata
 * }
 */

import { Request, Response, NextFunction } from 'express';
import { trace, context, Span } from '@opentelemetry/api';
import winston from 'winston';

// Create Winston logger with correlation
const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'api-gateway';

const correlationFormat = winston.format((info) => {
  // Get current span context
  const span = trace.getSpan(context.active());
  const spanContext = span?.spanContext();
  
  // Add correlation fields
  const enrichedInfo = {
    ...info,
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
  };
  
  if (spanContext) {
    enrichedInfo.traceId = spanContext.traceId;
    enrichedInfo.spanId = spanContext.spanId;
    enrichedInfo.traceFlags = spanContext.traceFlags;
  }
  
  return enrichedInfo;
});

// Create the logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    correlationFormat(),
    winston.format.json()
  ),
  defaultMeta: { service: SERVICE_NAME },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, traceId, spanId, userId, requestId, ...rest }) => {
          const correlation = [
            traceId ? `traceId=${traceId.slice(-8)}` : null,
            spanId ? `spanId=${spanId.slice(-8)}` : null,
            userId ? `userId=${userId}` : null,
            requestId ? `requestId=${requestId}` : null,
          ].filter(Boolean).join(' ');
          
          const base = `${timestamp} [${level}]: ${message}`;
          return correlation ? `${base} (${correlation})` : base;
        })
      ),
    }),
  ],
});

// File transport for production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error',
    format: winston.format.json(),
  }));
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log',
    format: winston.format.json(),
  }));
}

/**
 * Express middleware for adding correlation to requests
 */
export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string || 
    `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Store in request for later use
  (req as Request & { requestId: string }).requestId = requestId;
  
  // Get userId from JWT if available
  const userId = (req as Request & { user?: { id: string } }).user?.id;
  
  // Create child logger for this request
  const requestLogger = logger.child({
    requestId,
    userId,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });
  
  // Attach to request
  (req as Request & { logger: typeof logger }).logger = requestLogger;
  
  // Log request
  requestLogger.info(`→ ${req.method} ${req.path}`, {
    query: req.query,
    userAgent: req.headers['user-agent'],
  });
  
  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - ((req as Request & { startTime: number }).startTime || Date.now());
    
    requestLogger.info(`← ${req.method} ${req.path} ${res.statusCode}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  
  next();
}

/**
 * Get trace context for manual logging
 */
export function getTraceContext(): { traceId?: string; spanId?: string } {
  const span = trace.getSpan(context.active());
  const spanContext = span?.spanContext();
  
  return {
    traceId: spanContext?.traceId,
    spanId: spanContext?.spanId,
  };
}

/**
 * Log with automatic trace correlation
 */
export function logWithCorrelation(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  metadata: Record<string, unknown> = {}
): void {
  const traceContext = getTraceContext();
  
  logger.log(level, message, {
    ...metadata,
    ...traceContext,
  });
}

/**
 * Create span and log together
 */
export function logSpan(
  operation: string,
  metadata: Record<string, unknown> = {}
): void {
  const tracer = trace.getTracer('correlation-logger');
  const span = tracer.startSpan(operation);
  
  const spanContext = span.spanContext();
  
  logger.info(operation, {
    ...metadata,
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  });
  
  span.end();
}

export default logger;
