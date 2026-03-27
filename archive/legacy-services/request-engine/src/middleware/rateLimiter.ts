/**
 * Rate Limiter Middleware
 * 
 * Implements rate limiting to prevent abuse.
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
}

/**
 * Create rate limiter middleware
 * 
 * @param options - Rate limiter configuration
 * @returns Express rate limiter middleware
 */
export const rateLimiter = (options: RateLimiterOptions) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: options.message || 'Too many requests, please try again later'
      });
    },
    // Use user ID as key if authenticated, otherwise use IP
    keyGenerator: (req: Request) => {
      return req.user?.id?.toString() || req.ip;
    }
  });
};

/**
 * Default rate limiter for general API endpoints
 * 100 requests per 15 minutes
 */
export const defaultRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});

/**
 * Strict rate limiter for sensitive operations
 * 10 requests per 15 minutes
 */
export const strictRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10
});
