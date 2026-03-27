import { Request, Response, NextFunction } from 'express';
import { redis } from '../index';
import { logger } from '../utils/logger';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  keyPrefix: string;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  keyPrefix: 'rate_limit:',
};

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const config = {
      ...defaultConfig,
      // Stricter limits for sensitive endpoints
      max: req.path.includes('/transfer') || req.path.includes('/withdrawal') ? 20 : defaultConfig.max,
    };

    const key = `${config.keyPrefix}${req.ip}:${req.path}`;
    const windowStart = Math.floor(Date.now() / config.windowMs) * config.windowMs;
    const windowKey = `${key}:${windowStart}`;

    // Get current count from Redis
    const current = await redis.get(windowKey);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= config.max) {
      const ttl = await redis.ttl(windowKey);
      const resetTime = new Date(Date.now() + (ttl * 1000));

      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again after ${resetTime.toISOString()}`,
        retryAfter: ttl,
      });
    }

    // Increment counter
    const multi = redis.multi();
    multi.incr(windowKey);
    multi.expire(windowKey, Math.ceil(config.windowMs / 1000));
    await multi.exec();

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': config.max.toString(),
      'X-RateLimit-Remaining': (config.max - count - 1).toString(),
      'X-RateLimit-Reset': new Date(windowStart + config.windowMs).toISOString(),
    });

    return next();
  } catch (error) {
    logger.error('Rate limiter error:', error instanceof Error ? error.message : String(error));
    // Don't block requests if Redis is down
    return next();
  }
};