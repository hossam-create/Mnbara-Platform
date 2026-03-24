import { Request, Response, NextFunction } from 'express';
import cors, { CorsOptions } from 'cors';
import { config } from '../config';

/**
 * CORS Configuration for different environments
 * Supports multiple origins for dev, staging, and production
 */
const getCorsOptions = (): CorsOptions => {
  const nodeEnv = config.nodeEnv;
  
  // Parse allowed origins from config
  const allowedOrigins = parseAllowedOrigins(config.corsOrigin);
  
  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin ${origin} is not allowed`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Correlation-ID',
      'Accept',
      'Accept-Language',
      'Content-Language',
      'Last-Event-ID',
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-Correlation-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'Retry-After',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
  };
};

/**
 * Parse allowed origins from config string
 * Supports comma-separated values and wildcards
 */
const parseAllowedOrigins = (corsOrigin: string): string[] => {
  if (!corsOrigin) {
    return ['*'];
  }
  
  return corsOrigin
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
};

/**
 * CORS middleware factory
 * Returns configured CORS middleware
 */
export const corsMiddleware = () => {
  return cors(getCorsOptions());
};

/**
 * CORS error handler middleware
 * Handles CORS-related errors
 */
export const corsErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err.message.includes('CORS policy')) {
    res.status(403).json({
      error: 'CORS Error',
      message: err.message,
      origin: req.get('origin'),
      timestamp: new Date().toISOString(),
    });
  } else {
    next(err);
  }
};

export default corsMiddleware;
