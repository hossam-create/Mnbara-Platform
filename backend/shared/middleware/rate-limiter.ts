/**
 * Shared Rate Limiting Middleware
 * Prevents abuse and DDoS attacks across all services
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Standard rate limiter for API endpoints
 * 100 requests per 15 minutes per IP
 */
export const standardRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts',
      message: 'Account temporarily locked due to too many failed attempts.',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

/**
 * Lenient rate limiter for public endpoints
 * 300 requests per 15 minutes per IP
 */
export const publicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    error: 'Too many requests, please slow down.',
    retryAfter: '15 minutes'
  }
});

/**
 * Strict rate limiter for payment endpoints
 * 10 requests per 15 minutes per IP
 */
export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many payment requests, please try again later.',
    retryAfter: '15 minutes'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Payment rate limit exceeded',
      message: 'Too many payment attempts. Please wait before trying again.',
      retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
    });
  }
});

/**
 * Admin rate limiter
 * 200 requests per 15 minutes per IP
 */
export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    error: 'Admin rate limit exceeded',
    retryAfter: '15 minutes'
  }
});
