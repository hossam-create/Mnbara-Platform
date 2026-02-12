import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import { config } from '../config';

// In-memory store for single instance, Redis for distributed
let store: rateLimit.Store | undefined;

const createRedisClient = (): Redis | null => {
  try {
    return new Redis(config.redisUrl, {
      retryStrategy: (times: number) => {
        if (times > 3) {
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });
  } catch {
    return null;
  }
};

const redisClient = createRedisClient();

if (redisClient) {
  // @ts-expect-error - RedisStore is not fully typed in express-rate-limit
  const { RedisStore } = require('rate-limit-redis');
  store = new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(args[0], ...args.slice(1)),
  });
}

export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  store: store || undefined,
  keyGenerator: (req: Request): string => {
    // Use IP address or user ID if available
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userId = (req as any).user?.id;
    return userId ? `user:${userId}` : `ip:${ip}`;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(config.rateLimitWindowMs / 1000),
    });
  },
  skip: (req: Request): boolean => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/ready';
  },
});

// Stricter rate limit for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  store: store || undefined,
  keyGenerator: (req: Request): string => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `auth:${ip}`;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many authentication attempts. Please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 900, // 15 minutes
    });
  },
});

// Per-user rate limit
export const userRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per user
  standardHeaders: true,
  legacyHeaders: false,
  store: store || undefined,
  keyGenerator: (req: Request): string => {
    const userId = (req as any).user?.id;
    if (userId) {
      return `user:${userId}`;
    }
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `ip:${ip}`;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'User rate limit exceeded.',
      code: 'USER_RATE_LIMIT_EXCEEDED',
      retryAfter: 60,
    });
  },
});

export default globalRateLimiter;
