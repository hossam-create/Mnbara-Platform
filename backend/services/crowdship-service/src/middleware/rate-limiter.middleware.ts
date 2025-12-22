/**
 * Rate Limiter Middleware
 * Sprint 3: Market Hardening & Go-Live Safety
 *
 * CONSTRAINTS:
 * - Read-only advisory APIs only
 * - Soft throttling with human-readable warnings
 * - Feature-flagged
 */

import { Request, Response, NextFunction } from 'express';
import { getFeatureFlags } from '../config/feature-flags';
import { structuredLog, LogLevel } from '../services/structured-logger.service';

// Rate limit configuration per endpoint type
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  softLimitPercent: number; // Percentage at which to warn (e.g., 80%)
  message: string;
}

// Default rate limits
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Advisory endpoints - generous limits
  'corridor/advisory': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    softLimitPercent: 80,
    message: 'Too many corridor advisory requests. Please slow down.',
  },
  'intent/classify': {
    windowMs: 60 * 1000,
    maxRequests: 60,
    softLimitPercent: 80,
    message: 'Too many intent classification requests. Please slow down.',
  },
  checkpoints: {
    windowMs: 60 * 1000,
    maxRequests: 30,
    softLimitPercent: 80,
    message: 'Too many checkpoint requests. Please slow down.',
  },
  // Default for other endpoints
  default: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    softLimitPercent: 80,
    message: 'Too many requests. Please slow down.',
  },
};

// In-memory rate limit store (production: use Redis)
interface RateLimitEntry {
  count: number;
  windowStart: number;
  warnings: number;
}

const rateLimitStore: Map<string, RateLimitEntry> = new Map();

// Cleanup old entries periodically
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now - entry.windowStart > 5 * 60 * 1000) {
        // 5 minutes
        rateLimitStore.delete(key);
      }
    }
  },
  60 * 1000
); // Every minute

/**
 * Get rate limit key from request
 */
function getRateLimitKey(req: Request, endpoint: string): string {
  const userId = (req as any).user?.id || 'anonymous';
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `${endpoint}:${userId}:${ip}`;
}

/**
 * Get endpoint identifier from request path
 */
function getEndpointId(path: string): string {
  if (path.includes('/corridor/advisory')) return 'corridor/advisory';
  if (path.includes('/intent/classify')) return 'intent/classify';
  if (path.includes('/checkpoints')) return 'checkpoints';
  return 'default';
}

/**
 * Rate limiter middleware factory
 */
export function createRateLimiter(customConfig?: Partial<Record<string, RateLimitConfig>>) {
  const config = { ...RATE_LIMITS, ...customConfig };

  return (req: Request, res: Response, next: NextFunction) => {
    const flags = getFeatureFlags();

    // Check if rate limiting is enabled
    if (!flags.RATE_LIMITING_ENABLED) {
      return next();
    }

    const endpointId = getEndpointId(req.path);
    const limitConfig = config[endpointId] || config.default;
    const key = getRateLimitKey(req, endpointId);
    const now = Date.now();

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    if (!entry || now - entry.windowStart > limitConfig.windowMs) {
      entry = { count: 0, windowStart: now, warnings: 0 };
    }

    entry.count++;
    rateLimitStore.set(key, entry);

    // Calculate remaining requests
    const remaining = Math.max(0, limitConfig.maxRequests - entry.count);
    const resetTime = entry.windowStart + limitConfig.windowMs;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limitConfig.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));

    // Check soft limit (warning)
    const softLimit = Math.floor(limitConfig.maxRequests * (limitConfig.softLimitPercent / 100));
    if (entry.count >= softLimit && entry.count < limitConfig.maxRequests) {
      res.setHeader('X-RateLimit-Warning', 'Approaching rate limit');

      structuredLog(LogLevel.WARN, 'Rate limit warning', {
        endpoint: endpointId,
        userId: (req as any).user?.id,
        ip: req.ip,
        count: entry.count,
        limit: limitConfig.maxRequests,
        remaining,
      });
    }

    // Check hard limit
    if (entry.count > limitConfig.maxRequests) {
      structuredLog(LogLevel.WARN, 'Rate limit exceeded', {
        endpoint: endpointId,
        userId: (req as any).user?.id,
        ip: req.ip,
        count: entry.count,
        limit: limitConfig.maxRequests,
      });

      return res.status(429).json({
        error: 'Too Many Requests',
        message: limitConfig.message,
        retryAfter: Math.ceil((resetTime - now) / 1000),
        meta: {
          limit: limitConfig.maxRequests,
          windowMs: limitConfig.windowMs,
          resetTime: new Date(resetTime).toISOString(),
        },
      });
    }

    next();
  };
}

/**
 * Get current rate limit status for a user/IP
 */
export function getRateLimitStatus(
  userId: string,
  ip: string,
  endpoint: string
): { count: number; limit: number; remaining: number; resetTime: number } | null {
  const key = `${endpoint}:${userId}:${ip}`;
  const entry = rateLimitStore.get(key);
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;

  if (!entry) {
    return {
      count: 0,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
    };
  }

  return {
    count: entry.count,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.windowStart + config.windowMs,
  };
}

export default createRateLimiter;
