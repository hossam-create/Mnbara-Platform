import { Request, Response, NextFunction } from 'express';
import { Logger } from '@mnbara/shared-utils';

const logger = new Logger('RequestLogger');

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  // Add request ID to request object
  req.id = requestId;

  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
  });

  // Log request body for debugging (in development)
  if (process.env.NODE_ENV === 'development' && req.body && Object.keys(req.body).length > 0) {
    logger.debug('Request body', {
      requestId,
      body: sanitizeBody(req.body),
    });
  }

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk: any, encoding?: any): any {
    const duration = Date.now() - startTime;
    
    // Log response
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
    });

    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize request body for logging
 */
function sanitizeBody(body: any): any {
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'auth',
    'authorization',
    'creditCard',
    'credit_card',
    'ssn',
    'social_security',
  ];

  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Handle nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeBody(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Performance monitoring middleware
 */
export const performanceMonitor = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = process.hrtime.bigint();
  const requestId = req.id || generateRequestId();

  // Override res.end to measure performance
  const originalEnd = res.end;
  res.end = function(chunk: any, encoding?: any): any {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds
    
    // Log performance metrics
    logger.info('Performance metrics', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      memoryUsage: process.memoryUsage(),
    });

    // Alert on slow requests
    if (duration > 5000) { // 5 seconds
      logger.warn('Slow request detected', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        duration: `${duration.toFixed(2)}ms`,
        statusCode: res.statusCode,
      });
    }

    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Request ID middleware (adds request ID to response headers)
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.id || generateRequestId();
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Remove server header
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add request ID to response headers
  if (req.id) {
    res.setHeader('X-Request-ID', req.id);
  }
  
  next();
};

/**
 * CORS preflight handler
 */
export const corsPreflight = (req: Request, res: Response, next: NextFunction): void => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
};