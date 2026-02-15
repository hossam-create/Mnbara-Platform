/**
 * Advanced Rate Limiting Middleware
 * 
 * Provides comprehensive rate limiting with Redis backend for scalability.
 * Supports multiple tiers, role-based limits, and custom configurations.
 * 
 * Features:
 * - Redis-based storage for distributed rate limiting
 * - Role-based limits (unverified, verified, admin)
 * - Endpoint-specific limits
 * - Multiple key strategies (IP, User ID, API Key)
 * - Admin bypass
 * - Violation logging
 * - Standard rate limit headers
 */

import { Request, Response, NextFunction } from 'express';
import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Maximum requests per window
  keyPrefix?: string;      // Redis key prefix
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  handler?: (req: Request, res: Response) => void;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter: number;
}

export enum UserRole {
  UNVERIFIED = 'UNVERIFIED',
  VERIFIED = 'VERIFIED',
  ADMIN = 'ADMIN'
}

// ============================================================================
// Redis Client Setup
// ============================================================================

let redisClient: RedisClientType | null = null;
let isRedisAvailable = false;

/**
 * Initialize Redis client
 */
export async function initializeRedis(): Promise<void> {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error', { error: err });
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
      isRedisAvailable = true;
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
      isRedisAvailable = true;
    });

    await redisClient.connect();
    logger.info('Redis initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Redis', { error });
    isRedisAvailable = false;
  }
}

/**
 * Get Redis client
 */
function getRedisClient(): RedisClientType | null {
  return isRedisAvailable ? redisClient : null;
}

// ============================================================================
// Rate Limit Tiers
// ============================================================================

export const RATE_LIMIT_TIERS = {
  // General API limits
  GENERAL: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 100,
    keyPrefix: 'rl:general'
  },

  // Sensitive endpoints (payouts, disputes)
  SENSITIVE: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 10,
    keyPrefix: 'rl:sensitive'
  },

  // Webhook endpoints
  WEBHOOK: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 1000,
    keyPrefix: 'rl:webhook'
  },

  // Payment endpoints
  PAYMENT: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 20,
    keyPrefix: 'rl:payment'
  },

  // Payout endpoints
  PAYOUT: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 5,
    keyPrefix: 'rl:payout'
  },

  // Dispute endpoints
  DISPUTE: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 10,
    keyPrefix: 'rl:dispute'
  }
};

// ============================================================================
// Role-Based Limits
// ============================================================================

export const ROLE_LIMITS = {
  [UserRole.UNVERIFIED]: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 20,
    keyPrefix: 'rl:unverified'
  },
  [UserRole.VERIFIED]: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 100,
    keyPrefix: 'rl:verified'
  },
  [UserRole.ADMIN]: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: Infinity,  // Unlimited
    keyPrefix: 'rl:admin'
  }
};

// ============================================================================
// Rate Limit Key Generation
// ============================================================================

/**
 * Generate rate limit key based on request
 */
function generateRateLimitKey(req: Request, config: RateLimitConfig): string {
  const parts: string[] = [config.keyPrefix || 'rl'];

  // Add user ID if authenticated
  if (req.user?.id) {
    parts.push(`user:${req.user.id}`);
  }
  // Add API key if present
  else if (req.headers['x-api-key']) {
    parts.push(`apikey:${req.headers['x-api-key']}`);
  }
  // Fallback to IP address
  else {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    parts.push(`ip:${ip}`);
  }

  return parts.join(':');
}

// ============================================================================
// Rate Limit Check
// ============================================================================

/**
 * Check rate limit using Redis
 */
async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitInfo> {
  const client = getRedisClient();
  
  if (!client) {
    // Fallback: allow request if Redis is unavailable
    logger.warn('Redis unavailable, allowing request');
    return {
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
      retryAfter: 0
    };
  }

  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Use Redis sorted set for sliding window
    const multi = client.multi();

    // Remove old entries
    multi.zRemRangeByScore(key, 0, windowStart);

    // Count current requests
    multi.zCard(key);

    // Add current request
    multi.zAdd(key, { score: now, value: `${now}` });

    // Set expiry
    multi.expire(key, Math.ceil(config.windowMs / 1000));

    const results = await multi.exec();
    const count = (results[1] as number) || 0;

    const remaining = Math.max(0, config.maxRequests - count - 1);
    const resetTime = now + config.windowMs;
    const retryAfter = remaining === 0 ? Math.ceil(config.windowMs / 1000) : 0;

    return {
      limit: config.maxRequests,
      remaining,
      resetTime,
      retryAfter
    };
  } catch (error) {
    logger.error('Rate limit check failed', { error, key });
    // Fallback: allow request on error
    return {
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
      retryAfter: 0
    };
  }
}

// ============================================================================
// Middleware Factory
// ============================================================================

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is admin (bypass rate limiting)
      if (req.user?.role === UserRole.ADMIN) {
        logger.debug('Admin user bypassing rate limit', { userId: req.user.id });
        return next();
      }

      // Generate rate limit key
      const key = generateRateLimitKey(req, config);

      // Check rate limit
      const info = await checkRateLimit(key, config);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', info.limit.toString());
      res.setHeader('X-RateLimit-Remaining', info.remaining.toString());
      res.setHeader('X-RateLimit-Reset', new Date(info.resetTime).toISOString());

      // Check if limit exceeded
      if (info.remaining < 0) {
        res.setHeader('Retry-After', info.retryAfter.toString());

        // Log violation
        logger.warn('Rate limit exceeded', {
          key,
          userId: req.user?.id,
          ip: req.ip,
          path: req.path,
          method: req.method,
          limit: info.limit,
          resetTime: new Date(info.resetTime).toISOString()
        });

        // Custom handler or default response
        if (config.handler) {
          return config.handler(req, res);
        }

        res.status(429).json({
          error: 'Too many requests',
          message: 'You have exceeded the rate limit. Please try again later.',
          retryAfter: info.retryAfter,
          limit: info.limit,
          resetTime: new Date(info.resetTime).toISOString()
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Rate limiter middleware error', { error });
      // On error, allow request to proceed
      next();
    }
  };
}

// ============================================================================
// Role-Based Rate Limiter
// ============================================================================

/**
 * Create role-based rate limiter
 */
export function createRoleBasedRateLimiter() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Determine user role
      const role = req.user?.role || UserRole.UNVERIFIED;

      // Get role-specific config
      const config = ROLE_LIMITS[role];

      // Admin bypass
      if (role === UserRole.ADMIN) {
        return next();
      }

      // Apply rate limit
      const limiter = createRateLimiter(config);
      return limiter(req, res, next);
    } catch (error) {
      logger.error('Role-based rate limiter error', { error });
      next();
    }
  };
}

// ============================================================================
// Preset Rate Limiters
// ============================================================================

/**
 * General API rate limiter
 */
export const generalRateLimiter = createRateLimiter(RATE_LIMIT_TIERS.GENERAL);

/**
 * Sensitive endpoints rate limiter
 */
export const sensitiveRateLimiter = createRateLimiter(RATE_LIMIT_TIERS.SENSITIVE);

/**
 * Webhook rate limiter
 */
export const webhookRateLimiter = createRateLimiter(RATE_LIMIT_TIERS.WEBHOOK);

/**
 * Payment endpoints rate limiter
 */
export const paymentRateLimiter = createRateLimiter(RATE_LIMIT_TIERS.PAYMENT);

/**
 * Payout endpoints rate limiter
 */
export const payoutRateLimiter = createRateLimiter(RATE_LIMIT_TIERS.PAYOUT);

/**
 * Dispute endpoints rate limiter
 */
export const disputeRateLimiter = createRateLimiter(RATE_LIMIT_TIERS.DISPUTE);

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
}
