import { Request, Response, NextFunction } from 'express';
import { logger, logPerformance } from '../utils/logger';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const timestamp = new Date().toISOString();
  const requestId = req.headers['x-request-id'] || 'unknown';

  // Log the error with full context
  logger.error('Request error', {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId
    },
    timestamp
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let details = undefined;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = error.details || error.errors;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    message = 'Conflict';
  } else if (error.name === 'TooManyRequestsError') {
    statusCode = 429;
    message = 'Too many requests';
  } else if (error.code === 'P2002') {
    // Prisma unique constraint violation
    statusCode = 409;
    message = 'Resource already exists';
    details = error.meta?.target || 'Unique constraint violation';
  } else if (error.code === 'P2025') {
    // Prisma record not found
    statusCode = 404;
    message = 'Resource not found';
  } else if (error.code === 'P2014') {
    // Prisma foreign key constraint violation
    statusCode = 400;
    message = 'Invalid reference';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
    details = undefined;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    details,
    requestId,
    timestamp
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const timestamp = new Date().toISOString();
  const requestId = req.headers['x-request-id'] || 'unknown';

  logger.warn('Route not found', {
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId
    },
    timestamp
  });

  res.status(404).json({
    success: false,
    error: 'Route not found',
    requestId,
    timestamp
  });
};

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  // Add request ID to headers for tracking
  req.headers['x-request-id'] = requestId;

  // Log request
  logger.info('Incoming request', {
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId
    }
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): any {
    const duration = Date.now() - start;
    const responseTime = `${duration}ms`;

    // Log response
    logger.info('Request completed', {
      request: {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime,
        requestId
      }
    });

    // Log performance metrics for slow requests
    if (duration > 1000) {
      logPerformance('Slow request', duration, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode
      });
    }

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://app.ebay-live.com',
    'https://admin.ebay-live.com'
  ];

  const origin = req.headers.origin as string;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Request-ID');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
};

export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:; media-src 'self' blob:;");
  
  next();
};

export const compressionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Simple compression middleware (consider using compression package for production)
  const originalSend = res.send;
  
  res.send = function(data: any): any {
    if (typeof data === 'string' && data.length > 1024 && req.get('Accept-Encoding')?.includes('gzip')) {
      // In production, use proper gzip compression
      res.header('Content-Encoding', 'gzip');
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

export const timeoutMiddleware = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Request timeout'
        });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
};

export const healthCheckMiddleware = (req: Request, res: Response): void => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
    node: process.version,
    platform: process.platform
  };

  res.json({
    success: true,
    data: health
  });
};