/**
 * Structured Logging Middleware
 * JSON logging with correlation IDs for request tracing
 */

import { Request, Response, NextFunction } from 'express';
import { getCorrelationId } from './correlation.middleware';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  correlationId: string;
  requestId?: string;
  method: string;
  path: string;
  statusCode?: number;
  responseTime?: number;
  userId?: string;
  userAgent?: string;
  ip?: string;
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Create structured log entry
 */
const createLogEntry = (
  req: Request,
  level: LogEntry['level'],
  message: string,
  metadata?: Record<string, any>
): LogEntry => {
  return {
    timestamp: new Date().toISOString(),
    level,
    correlationId: getCorrelationId(req),
    requestId: req.headers['x-request-id'] as string,
    method: req.method,
    path: req.originalUrl || req.url,
    userId: req.headers['x-user-id'] as string,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.socket.remoteAddress,
    message,
    metadata,
  };
};

/**
 * Log to stdout in JSON format
 */
const log = (entry: LogEntry): void => {
  console.log(JSON.stringify(entry));
};

/**
 * Request logging middleware
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log incoming request
  log(createLogEntry(req, 'info', 'Incoming request', {
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    contentLength: req.headers['content-length'],
  }));

  // Capture response
  const originalSend = res.send;
  res.send = function (body): Response {
    const responseTime = Date.now() - startTime;
    
    // Log response
    const logLevel: LogEntry['level'] = res.statusCode >= 500 ? 'error' : 
                                        res.statusCode >= 400 ? 'warn' : 'info';
    
    log({
      ...createLogEntry(req, logLevel, 'Request completed'),
      statusCode: res.statusCode,
      responseTime,
    });

    return originalSend.call(this, body);
  };

  next();
};

/**
 * Error logging middleware
 */
export const errorLogger = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const entry = createLogEntry(req, 'error', 'Request error');
  entry.error = {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  };
  
  log(entry);
  next(err);
};

/**
 * Create logger instance for use in other modules
 */
export const logger = {
  info: (message: string, metadata?: Record<string, any>) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...metadata,
    }));
  },
  
  warn: (message: string, metadata?: Record<string, any>) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      ...metadata,
    }));
  },
  
  error: (message: string, error?: Error, metadata?: Record<string, any>) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      } : undefined,
      ...metadata,
    }));
  },
  
  debug: (message: string, metadata?: Record<string, any>) => {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        ...metadata,
      }));
    }
  },
};
