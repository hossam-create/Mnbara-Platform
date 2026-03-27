/**
 * Rate Limiting & Anti-Bot Framework
 * 
 * Comprehensive rate limiting with:
 * - Per-user rate limiting
 * - Per-IP rate limiting
 * - Endpoint-specific limits
 * - CAPTCHA integration ready
 * - Brute-force attack prevention
 * 
 * MANDATORY REQUIREMENTS:
 * - Rate limit forms
 * - Rate limit authentication endpoints
 * - Rate limit sensitive APIs
 * - Prevent spam and brute-force attacks
 * - CAPTCHA support (Cloudflare Turnstile / Google reCAPTCHA)
 */

import { ConflictError, ErrorCode } from './errors';

// ============================================================
// RATE LIMIT CONFIGURATION
// ============================================================

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export const RATE_LIMIT_CONFIGS = {
  // Forms: 10 submissions per 15 minutes
  FORM: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
  } as RateLimitConfig,

  // Authentication: 5 attempts per 15 minutes
  AUTH: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
  } as RateLimitConfig,

  // Sensitive APIs: 30 requests per minute
  SENSITIVE_API: {
    windowMs: 60 * 1000,
    maxRequests: 30,
  } as RateLimitConfig,

  // General API: 100 requests per minute
  GENERAL_API: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  } as RateLimitConfig,

  // Bid placement: 20 bids per minute
  BID_PLACEMENT: {
    windowMs: 60 * 1000,
    maxRequests: 20,
  } as RateLimitConfig,

  // Password reset: 3 attempts per hour
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
  } as RateLimitConfig,

  // Email verification: 5 attempts per hour
  EMAIL_VERIFICATION: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
  } as RateLimitConfig,
} as const;

// ============================================================
// RATE LIMITER STORE
// ============================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockUntil?: number;
}

/**
 * In-memory rate limiter store
 * In production, use Redis for distributed rate limiting
 */
export class RateLimiterStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Get rate limit entry
   */
  get(key: string): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  /**
   * Increment request count
   */
  increment(key: string, config: RateLimitConfig): RateLimitEntry {
    const now = Date.now();
    let entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
        blocked: false,
      };
    } else {
      // Increment existing entry
      entry.count++;

      // Check if limit exceeded
      if (entry.count > config.maxRequests) {
        entry.blocked = true;
        entry.blockUntil = now + config.windowMs;
      }
    }

    this.store.set(key, entry);
    return entry;
  }

  /**
   * Check if key is blocked
   */
  isBlocked(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) {
      return false;
    }

    if (entry.blockUntil && Date.now() < entry.blockUntil) {
      return true;
    }

    // Unblock if time has passed
    if (entry.blockUntil && Date.now() >= entry.blockUntil) {
      entry.blocked = false;
      entry.blockUntil = undefined;
    }

    return entry.blocked;
  }

  /**
   * Reset key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime && (!entry.blockUntil || now > entry.blockUntil)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.store.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`[RATE_LIMITER] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      totalEntries: this.store.size,
      entries: Array.from(this.store.entries()).map(([key, entry]) => ({
        key,
        count: entry.count,
        blocked: entry.blocked,
        resetIn: Math.max(0, entry.resetTime - Date.now()),
      })),
    };
  }

  /**
   * Destroy
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// ============================================================
// RATE LIMITER
// ============================================================

export class RateLimiter {
  private store: RateLimiterStore;

  constructor(store?: RateLimiterStore) {
    this.store = store || new RateLimiterStore();
  }

  /**
   * Check rate limit
   */
  checkLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number } {
    // Check if blocked
    if (this.store.isBlocked(key)) {
      console.warn('[RATE_LIMITER] Request blocked for key:', key);
      return { allowed: false, remaining: 0 };
    }

    // Increment counter
    const entry = this.store.increment(key, config);

    const remaining = Math.max(0, config.maxRequests - entry.count);
    const allowed = entry.count <= config.maxRequests;

    if (!allowed) {
      console.warn('[RATE_LIMITER] Rate limit exceeded for key:', {
        key,
        count: entry.count,
        limit: config.maxRequests,
      });
    }

    return { allowed, remaining };
  }

  /**
   * Create middleware for Express
   */
  middleware(config: RateLimitConfig, keyGenerator?: (req: Express.Request) => string) {
    return (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
      // Generate key (IP + endpoint by default)
      const key = keyGenerator
        ? keyGenerator(req)
        : `${req.ip}:${req.method}:${req.path}`;

      // Check rate limit
      const { allowed, remaining } = this.checkLimit(key, config);

      // Set headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + config.windowMs).toISOString());

      if (!allowed) {
        return res.status(429).json({
          success: false,
          error: {
            code: ErrorCode.CONFLICT,
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil(config.windowMs / 1000),
          },
        });
      }

      next();
    };
  }

  /**
   * Reset rate limit for key
   */
  reset(key: string): void {
    this.store.reset(key);
  }

  /**
   * Get stats
   */
  getStats() {
    return this.store.getStats();
  }

  /**
   * Destroy
   */
  destroy(): void {
    this.store.destroy();
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

let rateLimiterInstance: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
  }
  return rateLimiterInstance;
}

// ============================================================
// CAPTCHA VERIFICATION (READY FOR INTEGRATION)
// ============================================================

export interface CaptchaConfig {
  provider: 'cloudflare' | 'google';
  siteKey: string;
  secretKey: string;
}

export class CaptchaVerifier {
  private config: CaptchaConfig;

  constructor(config: CaptchaConfig) {
    this.config = config;
  }

  /**
   * Verify CAPTCHA token
   */
  async verify(token: string): Promise<boolean> {
    try {
      if (this.config.provider === 'cloudflare') {
        return await this.verifyCloudflare(token);
      } else if (this.config.provider === 'google') {
        return await this.verifyGoogle(token);
      }

      return false;
    } catch (error) {
      console.error('[CAPTCHA] Verification error:', error);
      return false;
    }
  }

  /**
   * Verify Cloudflare Turnstile
   */
  private async verifyCloudflare(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: this.config.secretKey,
          response: token,
        }),
      });

      const data = (await response.json()) as { success: boolean };
      return data.success;
    } catch (error) {
      console.error('[CAPTCHA] Cloudflare verification error:', error);
      return false;
    }
  }

  /**
   * Verify Google reCAPTCHA
   */
  private async verifyGoogle(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${this.config.secretKey}&response=${token}`,
      });

      const data = (await response.json()) as { success: boolean; score?: number };
      return data.success && (data.score === undefined || data.score > 0.5);
    } catch (error) {
      console.error('[CAPTCHA] Google verification error:', error);
      return false;
    }
  }
}

// ============================================================
// BRUTE-FORCE ATTACK DETECTION
// ============================================================

export class BruteForceDetector {
  private failedAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  /**
   * Record failed attempt
   */
  recordFailedAttempt(key: string): void {
    const now = Date.now();
    let entry = this.failedAttempts.get(key);

    if (!entry || now - entry.lastAttempt > this.LOCKOUT_DURATION) {
      entry = { count: 1, lastAttempt: now };
    } else {
      entry.count++;
      entry.lastAttempt = now;
    }

    this.failedAttempts.set(key, entry);

    if (entry.count >= this.MAX_ATTEMPTS) {
      console.warn('[SECURITY] Brute-force attack detected for key:', key);
    }
  }

  /**
   * Check if account is locked
   */
  isLocked(key: string): boolean {
    const entry = this.failedAttempts.get(key);
    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now - entry.lastAttempt > this.LOCKOUT_DURATION) {
      this.failedAttempts.delete(key);
      return false;
    }

    return entry.count >= this.MAX_ATTEMPTS;
  }

  /**
   * Reset failed attempts
   */
  reset(key: string): void {
    this.failedAttempts.delete(key);
  }

  /**
   * Get lockout time remaining
   */
  getLockoutTimeRemaining(key: string): number {
    const entry = this.failedAttempts.get(key);
    if (!entry) {
      return 0;
    }

    const remaining = this.LOCKOUT_DURATION - (Date.now() - entry.lastAttempt);
    return Math.max(0, remaining);
  }
}

// ============================================================
// SINGLETON INSTANCES
// ============================================================

let bruteForceDetectorInstance: BruteForceDetector | null = null;

export function getBruteForceDetector(): BruteForceDetector {
  if (!bruteForceDetectorInstance) {
    bruteForceDetectorInstance = new BruteForceDetector();
  }
  return bruteForceDetectorInstance;
}
