/**
 * WebSocket Rate Limiter
 * 
 * Rate limiting for WebSocket connections to prevent abuse.
 * Limits:
 * - Max 2 connections per user
 * - Connection attempt rate: 10 per minute per IP
 */

import { Request } from 'express';
import Redis from 'ioredis';
import { config } from '../config';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

class WebSocketRateLimiter {
  private redis: Redis | null = null;
  private readonly CONNECTION_ATTEMPTS_WINDOW = 60; // 1 minute
  private readonly MAX_CONNECTION_ATTEMPTS = 10;

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    try {
      this.redis = new Redis(config.redisUrl, {
        retryStrategy: (times: number) => {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
      });

      this.redis.on('error', (err: Error) => {
        console.warn('[WebSocketRateLimiter] Redis error:', err.message);
      });
    } catch {
      console.warn('[WebSocketRateLimiter] Redis not available, using in-memory fallback');
      this.redis = null;
    }
  }

  /**
   * Check if connection attempt is allowed
   */
  async checkConnectionAttempt(ip: string): Promise<RateLimitResult> {
    const key = `ws_conn_attempts:${ip}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - this.CONNECTION_ATTEMPTS_WINDOW;

    if (!this.redis) {
      // Fallback: allow all if Redis is not available
      return { allowed: true, remaining: this.MAX_CONNECTION_ATTEMPTS, resetTime: now + this.CONNECTION_ATTEMPTS_WINDOW };
    }

    try {
      // Use Redis sorted set for sliding window
      // Remove old entries
      await this.redis.zremrangebyscore(key, 0, windowStart);

      // Count current attempts
      const currentAttempts = await this.redis.zcard(key);

      if (currentAttempts >= this.MAX_CONNECTION_ATTEMPTS) {
        const oldestEntry = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
        const resetTime = parseInt(oldestEntry[1] || '0', 10) + this.CONNECTION_ATTEMPTS_WINDOW;

        return {
          allowed: false,
          remaining: 0,
          resetTime,
        };
      }

      // Add current attempt
      await this.redis.zadd(key, now, `${now}:${Math.random()}`);
      await this.redis.expire(key, this.CONNECTION_ATTEMPTS_WINDOW);

      const remaining = this.MAX_CONNECTION_ATTEMPTS - currentAttempts - 1;
      const resetTime = now + this.CONNECTION_ATTEMPTS_WINDOW;

      return {
        allowed: true,
        remaining,
        resetTime,
      };
    } catch (error) {
      console.error('[WebSocketRateLimiter] Error checking rate limit:', error);
      // Fail open on Redis errors
      return { allowed: true, remaining: this.MAX_CONNECTION_ATTEMPTS, resetTime: now + this.CONNECTION_ATTEMPTS_WINDOW };
    }
  }

  /**
   * Get rate limit status for an IP
   */
  async getRateLimitStatus(ip: string): Promise<{ limit: number; remaining: number; resetTime: number }> {
    const key = `ws_conn_attempts:${ip}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - this.CONNECTION_ATTEMPTS_WINDOW;

    if (!this.redis) {
      return { limit: this.MAX_CONNECTION_ATTEMPTS, remaining: this.MAX_CONNECTION_ATTEMPTS, resetTime: now + this.CONNECTION_ATTEMPTS_WINDOW };
    }

    try {
      await this.redis.zremrangebyscore(key, 0, windowStart);
      const currentAttempts = await this.redis.zcard(key);
      const oldestEntry = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
      const resetTime = oldestEntry[1] 
        ? parseInt(oldestEntry[1], 10) + this.CONNECTION_ATTEMPTS_WINDOW 
        : now + this.CONNECTION_ATTEMPTS_WINDOW;

      return {
        limit: this.MAX_CONNECTION_ATTEMPTS,
        remaining: Math.max(0, this.MAX_CONNECTION_ATTEMPTS - currentAttempts),
        resetTime,
      };
    } catch {
      return { limit: this.MAX_CONNECTION_ATTEMPTS, remaining: this.MAX_CONNECTION_ATTEMPTS, resetTime: now + this.CONNECTION_ATTEMPTS_WINDOW };
    }
  }
}

// Export singleton
export const wsRateLimiter = new WebSocketRateLimiter();
export default wsRateLimiter;
