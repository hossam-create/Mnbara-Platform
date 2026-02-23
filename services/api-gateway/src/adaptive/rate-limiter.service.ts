/**
 * Global Rate Limiter Service
 * 
 * Distributed rate limiting using Redis with:
 * - Token Bucket algorithm (burst control)
 * - Sliding Window algorithm (fair distribution)
 * - Tier-based limits (free, premium, enterprise, admin)
 * - Per-user, per-IP, and per-service limits
 * - Distributed rate limit headers
 */

import Redis from 'ioredis';
import { 
  trace, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import { logger } from '../middleware/correlation-logger.middleware';
import { 
  RATE_LIMIT_TIERS, 
  UserTier,
  RateLimitTier 
} from './adaptive-config';

// Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// Rate limit result
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  tier: UserTier;
}

// Rate limit key types
type RateLimitType = 'user' | 'ip' | 'service' | 'global';

// Tracer
const tracer = trace.getTracer('rate-limiter');

// In-memory cache for failed Redis scenarios
const memoryCache = new Map<string, { tokens: number; lastRefill: number }>();

// ============================================
// TOKEN BUCKET IMPLEMENTATION
// ============================================

/**
 * Token Bucket rate limiting
 * Allows bursts up to burstLimit, then limited to refillRate per second
 */
export async function checkTokenBucket(
  key: string,
  tier: UserTier,
  limitType: RateLimitType
): Promise<RateLimitResult> {
  const span = tracer.startSpan('rate_limit.token_bucket', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'rate_limit.key': key,
      'rate_limit.tier': tier,
      'rate_limit.type': limitType,
    },
  });

  const tierConfig = RATE_LIMIT_TIERS[tier];
  const bucketKey = `ratelimit:${limitType}:${key}:tokens`;
  const lastRefillKey = `ratelimit:${limitType}:${key}:last_refill`;

  try {
    // Use Redis Lua script for atomic operation
    const luaScript = `
      local bucket = redis.call('get', KEYS[1])
      local lastRefill = redis.call('get', KEYS[2])
      local now = tonumber(ARGV[1])
      local burst = tonumber(ARGV[2])
      local refillRate = tonumber(ARGV[3])
      
      if not bucket then
        bucket = burst
        lastRefill = now
      else
        bucket = tonumber(bucket)
        lastRefill = tonumber(lastRefill)
        
        local elapsed = now - lastRefill
        local tokensToAdd = math.floor(elapsed * refillRate / 1000)
        bucket = math.min(bucket + tokensToAdd, burst)
      end
      
      if bucket >= 1 then
        bucket = bucket - 1
        redis.call('setex', KEYS[1], 3600, bucket)
        redis.call('setex', KEYS[2], 3600, now)
        return {1, bucket, burst}
      else
        redis.call('setex', KEYS[1], 3600, bucket)
        redis.call('setex', KEYS[2], 3600, now)
        return {0, bucket, burst}
      end
    `;

    const now = Date.now();
    const result = await redis.eval(
      luaScript,
      2,
      bucketKey,
      lastRefillKey,
      now,
      tierConfig.burstLimit,
      tierConfig.refillRate
    ) as [number, number, number];

    const [allowed, remaining, limit] = result;
    
    // Calculate reset time
    const tokensNeeded = 1;
    const timeToRefill = (tokensNeeded / tierConfig.refillRate) * 1000;
    const resetTime = Math.ceil((now + timeToRefill) / 1000);

    span.setAttribute('rate_limit.allowed', allowed === 1);
    span.setAttribute('rate_limit.remaining', remaining);
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    if (allowed === 1) {
      return {
        allowed: true,
        limit,
        remaining,
        resetTime,
        tier,
      };
    } else {
      // Calculate retry after
      const retryAfter = Math.ceil(timeToRefill / 1000);
      
      logger.warn(`[RateLimiter] Rate limit exceeded`, {
        key,
        tier,
        limitType,
        remaining,
        retryAfter,
      });

      return {
        allowed: false,
        limit,
        remaining: 0,
        resetTime,
        retryAfter,
        tier,
      };
    }
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ 
      code: SpanStatusCode.ERROR, 
      message: (error as Error).message 
    });
    span.end();

    // Fallback: allow request if Redis fails
    logger.error(`[RateLimiter] Redis error, allowing request`, {
      error: (error as Error).message,
      key,
    });

    return {
      allowed: true,
      limit: tierConfig.burstLimit,
      remaining: tierConfig.burstLimit - 1,
      resetTime: Math.ceil(Date.now() / 1000) + 60,
      tier,
    };
  }
}

// ============================================
// SLIDING WINDOW IMPLEMENTATION
// ============================================

/**
 * Sliding Window rate limiting
 * More accurate for sustained rate limiting over time windows
 */
export async function checkSlidingWindow(
  key: string,
  tier: UserTier,
  limitType: RateLimitType,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const span = tracer.startSpan('rate_limit.sliding_window', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'rate_limit.key': key,
      'rate_limit.tier': tier,
      'rate_limit.type': limitType,
      'rate_limit.window': windowSeconds,
    },
  });

  const tierConfig = RATE_LIMIT_TIERS[tier];
  const limit = tierConfig.requestsPerMinute;
  const windowKey = `ratelimit:${limitType}:${key}:window:${windowSeconds}`;

  try {
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);

    // Use Redis sorted set for sliding window
    const luaScript = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local windowStart = tonumber(ARGV[2])
      local limit = tonumber(ARGV[3])
      
      -- Remove old entries
      redis.call('zremrangebyscore', key, 0, windowStart)
      
      -- Count current
      local current = redis.call('zcard', key)
      
      if current < limit then
        -- Add current request
        redis.call('zadd', key, now, now)
        redis.call('expire', key, 120)
        return {1, limit - current - 1, limit}
      else
        -- Get oldest entry for retry-after
        local oldest = redis.call('zrange', key, 0, 0, 'withscores')
        local retryAfter = math.ceil((oldest[2] + 60000 - now) / 1000)
        return {0, 0, limit, retryAfter}
      end
    `;

    const result = await redis.eval(
      luaScript,
      1,
      windowKey,
      now,
      windowStart,
      limit
    ) as [number, number, number, number?];

    const [allowed, remaining, windowLimit, retryAfter] = result;

    span.setAttribute('rate_limit.allowed', allowed === 1);
    span.setAttribute('rate_limit.remaining', remaining);
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    const resetTime = Math.ceil((now + (windowSeconds * 1000)) / 1000);

    if (allowed === 1) {
      return {
        allowed: true,
        limit: windowLimit,
        remaining,
        resetTime,
        tier,
      };
    } else {
      logger.warn(`[RateLimiter] Sliding window limit exceeded`, {
        key,
        tier,
        limitType,
        retryAfter,
      });

      return {
        allowed: false,
        limit: windowLimit,
        remaining: 0,
        resetTime,
        retryAfter: retryAfter || windowSeconds,
        tier,
      };
    }
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ 
      code: SpanStatusCode.ERROR, 
      message: (error as Error).message 
    });
    span.end();

    // Fallback
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetTime: Math.ceil(Date.now() / 1000) + windowSeconds,
      tier,
    };
  }
}

// ============================================
// COMPOSITE RATE LIMITING
// ============================================

/**
 * Check all rate limits (token bucket + sliding window)
 */
export async function checkAllRateLimits(
  userId: string,
  ip: string,
  tier: UserTier = 'free'
): Promise<{ allowed: boolean; result: RateLimitResult; headers: Record<string, string> }> {
  const span = tracer.startSpan('rate_limit.check_all', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'rate_limit.user_id': userId,
      'rate_limit.ip': ip,
      'rate_limit.tier': tier,
    },
  });

  // Check token bucket (burst control)
  const userTokenResult = await checkTokenBucket(userId, tier, 'user');
  
  if (!userTokenResult.allowed) {
    span.setAttribute('rate_limit.rejected_by', 'token_bucket_user');
    span.end();
    return {
      allowed: false,
      result: userTokenResult,
      headers: buildRateLimitHeaders(userTokenResult),
    };
  }

  // Check IP token bucket
  const ipTokenResult = await checkTokenBucket(ip, tier, 'ip');
  
  if (!ipTokenResult.allowed) {
    span.setAttribute('rate_limit.rejected_by', 'token_bucket_ip');
    span.end();
    return {
      allowed: false,
      result: ipTokenResult,
      headers: buildRateLimitHeaders(ipTokenResult),
    };
  }

  // Check sliding window (sustained rate)
  const slidingResult = await checkSlidingWindow(userId, tier, 'user', 60);
  
  if (!slidingResult.allowed) {
    span.setAttribute('rate_limit.rejected_by', 'sliding_window');
    span.end();
    return {
      allowed: false,
      result: slidingResult,
      headers: buildRateLimitHeaders(slidingResult),
    };
  }

  // Use the most restrictive remaining
  const finalResult: RateLimitResult = {
    allowed: true,
    limit: Math.min(userTokenResult.limit, slidingResult.limit),
    remaining: Math.min(userTokenResult.remaining, slidingResult.remaining),
    resetTime: Math.max(userTokenResult.resetTime, slidingResult.resetTime),
    tier,
  };

  span.setAttribute('rate_limit.allowed', true);
  span.setAttribute('rate_limit.remaining', finalResult.remaining);
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  return {
    allowed: true,
    result: finalResult,
    headers: buildRateLimitHeaders(finalResult),
  };
}

/**
 * Build rate limit headers for HTTP response
 */
export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(result.resetTime),
    'X-RateLimit-Tier': result.tier,
  };

  if (result.retryAfter) {
    headers['Retry-After'] = String(result.retryAfter);
  }

  if (!result.allowed) {
    headers['X-RateLimit-Status'] = 'exceeded';
  }

  return headers;
}

// ============================================
// SERVICE-SPECIFIC RATE LIMITING
// ============================================

/**
 * Check service-specific rate limit
 */
export async function checkServiceRateLimit(
  serviceName: string,
  operation: string,
  maxRequests: number = 100
): Promise<boolean> {
  const key = `service:${serviceName}:${operation}`;
  const result = await checkSlidingWindow(key, 'internal', 'service', 60);
  return result.allowed;
}

// ============================================
// TIER MANAGEMENT
// ============================================

/**
 * Determine user tier from request
 */
export function determineUserTier(
  userId: string,
  apiKey?: string,
  subscription?: string
): UserTier {
  // Check for admin/internal users
  if (userId.startsWith('internal_') || apiKey?.startsWith('internal_')) {
    return 'internal';
  }

  // Check for admin role
  if (userId.startsWith('admin_')) {
    return 'admin';
  }

  // Check subscription tier
  if (subscription) {
    if (subscription === 'enterprise') return 'enterprise';
    if (subscription === 'premium') return 'premium';
  }

  // Default to free
  return 'free';
}

/**
 * Get tier configuration
 */
export function getTierConfig(tier: UserTier): RateLimitTier {
  return RATE_LIMIT_TIERS[tier];
}

// ============================================
// METRICS & MONITORING
// ============================================

interface RateLimitMetrics {
  totalRequests: number;
  allowedRequests: number;
  rejectedRequests: number;
  byTier: Record<UserTier, { allowed: number; rejected: number }>;
}

const metrics: RateLimitMetrics = {
  totalRequests: 0,
  allowedRequests: 0,
  rejectedRequests: 0,
  byTier: {
    free: { allowed: 0, rejected: 0 },
    premium: { allowed: 0, rejected: 0 },
    enterprise: { allowed: 0, rejected: 0 },
    admin: { allowed: 0, rejected: 0 },
    internal: { allowed: 0, rejected: 0 },
  },
};

export function recordRateLimitMetric(
  allowed: boolean,
  tier: UserTier
): void {
  metrics.totalRequests++;
  if (allowed) {
    metrics.allowedRequests++;
    metrics.byTier[tier].allowed++;
  } else {
    metrics.rejectedRequests++;
    metrics.byTier[tier].rejected++;
  }
}

export function getRateLimitMetrics(): RateLimitMetrics {
  return { ...metrics };
}

export function resetRateLimitMetrics(): void {
  metrics.totalRequests = 0;
  metrics.allowedRequests = 0;
  metrics.rejectedRequests = 0;
  for (const tier of Object.keys(metrics.byTier) as UserTier[]) {
    metrics.byTier[tier] = { allowed: 0, rejected: 0 };
  }
}

// ============================================
// CLEANUP
// ============================================

export async function shutdownRateLimiter(): Promise<void> {
  await redis.quit();
  logger.info('[RateLimiter] Shutdown complete');
}

export { redis };
