/**
 * Rate Limiter Middleware
 * Implements rate limiting per IP and per user with Redis backing
 */

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  total: number;
}

// Redis client singleton
let redisClient: Redis | null = null;

const getRedisClient = (): Redis => {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redisClient.on('error', (err) => {
      console.error('Redis rate limiter error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Rate limiter connected to Redis');
    });
  }
  return redisClient;
};

// In-memory fallback when Redis is unavailable
const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

const cleanupInMemoryStore = () => {
  const now = Date.now();
  for (const [key, value] of inMemoryStore.entries()) {
    if (value.resetTime < now) {
      inMemoryStore.delete(key);
    }
  }
};

// Cleanup every minute
setInterval(cleanupInMemoryStore, 60000);

/**
 * Get rate limit key based on IP and optionally user ID
 */
const getRateLimitKey = (req: Request, prefix: string): string => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userId = (req as any).user?.id;
  
  if (userId) {
    return `ratelimit:${prefix}:user:${userId}`;
  }
  return `ratelimit:${prefix}:ip:${ip}`;
};

/**
 * Check rate limit using Redis
 */
const checkRateLimitRedis = async (
  key: string,
  config: RateLimitConfig
): Promise<RateLimitInfo> => {
  const redis = getRedisClient();
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Use Redis sorted set for sliding window
    const multi = redis.multi();
    
    // Remove old entries
    multi.zremrangebyscore(key, 0, windowStart);
    
    // Count current entries
    multi.zcard(key);
    
    // Add current request
    multi.zadd(key, now.toString(), `${now}:${Math.random()}`);
    
    // Set expiry
    multi.pexpire(key, config.windowMs);
    
    const results = await multi.exec();
    
    if (!results) {
      throw new Error('Redis transaction failed');
    }

    const count = (results[1][1] as number) + 1; // +1 for current request
    const remaining = Math.max(0, config.maxRequests - count);
    const resetTime = now + config.windowMs;

    return {
      remaining,
      resetTime,
      total: config.maxRequests,
    };
  } catch (error) {
    console.error('Redis rate limit error, falling back to in-memory:', error);
    return checkRateLimitInMemory(key, config);
  }
};

/**
 * Check rate limit using in-memory store (fallback)
 */
const checkRateLimitInMemory = (
  key: string,
  config: RateLimitConfig
): RateLimitInfo => {
  const now = Date.now();
  const entry = inMemoryStore.get(key);

  if (!entry || entry.resetTime < now) {
    // New window
    inMemoryStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
      total: config.maxRequests,
    };
  }

  // Increment count
  entry.count++;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  return {
    remaining,
    resetTime: entry.resetTime,
    total: config.maxRequests,
  };
};

/**
 * Create rate limiter middleware
 */
export const createRateLimiter = (config: RateLimitConfig, routePrefix: string = 'default') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = getRateLimitKey(req, routePrefix);
    
    try {
      const rateLimitInfo = await checkRateLimitRedis(key, config);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', rateLimitInfo.total);
      res.setHeader('X-RateLimit-Remaining', rateLimitInfo.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitInfo.resetTime / 1000));

      if (rateLimitInfo.remaining < 0) {
        const retryAfter = Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000);
        res.setHeader('Retry-After', retryAfter);
        
        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter,
        });
        return;
      }

      next();
    } catch (error) {
      // On error, allow request but log
      console.error('Rate limiter error:', error);
      next();
    }
  };
};

/**
 * Global rate limiter for all requests
 */
export const globalRateLimiter = createRateLimiter(
  { windowMs: 60000, maxRequests: 1000 },
  'global'
);

/**
 * Strict rate limiter for sensitive endpoints
 */
export const strictRateLimiter = createRateLimiter(
  { windowMs: 60000, maxRequests: 10 },
  'strict'
);

/**
 * Close Redis connection (for graceful shutdown)
 */
export const closeRateLimiter = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
  return;
};
