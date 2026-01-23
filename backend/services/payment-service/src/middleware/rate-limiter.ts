import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate Limiter Middleware
 * Protects payment endpoints from abuse
 */

/**
 * General payment endpoint rate limiter
 * 10 requests per minute per IP
 */
export const paymentRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per window
  message: {
    error: 'Too many payment requests from this IP, please try again later.',
    retryAfter: '1 minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit for payment operations',
      retryAfter: '60 seconds',
    });
  },
});

/**
 * Webhook rate limiter
 * More permissive for webhooks (100 per minute)
 */
export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  message: {
    error: 'Too many webhook requests',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for requests from Stripe IPs
    // In production, you should verify Stripe IPs
    const stripeIPs = process.env.STRIPE_WEBHOOK_IPS?.split(',') || [];
    const clientIP = req.ip || req.socket.remoteAddress || '';
    return stripeIPs.includes(clientIP);
  },
});

/**
 * Strict rate limiter for sensitive operations
 * 3 requests per minute per IP
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 requests per window
  message: {
    error: 'Too many requests for this sensitive operation',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
