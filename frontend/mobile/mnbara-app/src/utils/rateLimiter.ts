/**
 * Rate Limiter Utility for MNBARA Mobile App
 * Handles 429 responses with exponential backoff and request throttling
 */

import { RateLimitError } from './errors';

interface RateLimitState {
  isLimited: boolean;
  retryAfter: number | null;
  limitedUntil: number | null;
  consecutiveErrors: number;
}

interface RateLimiterConfig {
  maxConsecutiveErrors?: number;
  baseBackoff?: number;
  maxBackoff?: number;
  onRateLimited?: (retryAfter: number) => void;
  onRateLimitCleared?: () => void;
}

const DEFAULT_CONFIG = {
  maxConsecutiveErrors: 5,
  baseBackoff: 1000,
  maxBackoff: 60000,
};

class RateLimiter {
  private state: RateLimitState = {
    isLimited: false,
    retryAfter: null,
    limitedUntil: null,
    consecutiveErrors: 0,
  };
  private config: typeof DEFAULT_CONFIG;
  private callbacks: Pick<RateLimiterConfig, 'onRateLimited' | 'onRateLimitCleared'>;
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: RateLimiterConfig = {}) {
    this.config = {
      maxConsecutiveErrors: config.maxConsecutiveErrors ?? DEFAULT_CONFIG.maxConsecutiveErrors,
      baseBackoff: config.baseBackoff ?? DEFAULT_CONFIG.baseBackoff,
      maxBackoff: config.maxBackoff ?? DEFAULT_CONFIG.maxBackoff,
    };
    this.callbacks = {
      onRateLimited: config.onRateLimited,
      onRateLimitCleared: config.onRateLimitCleared,
    };
  }

  /**
   * Check if currently rate limited
   */
  isRateLimited(): boolean {
    if (!this.state.isLimited) return false;
    
    if (this.state.limitedUntil && Date.now() >= this.state.limitedUntil) {
      this.clearRateLimit();
      return false;
    }
    
    return true;
  }

  /**
   * Get time remaining until rate limit clears (in ms)
   */
  getTimeRemaining(): number {
    if (!this.state.limitedUntil) return 0;
    return Math.max(0, this.state.limitedUntil - Date.now());
  }

  /**
   * Get retry-after value in seconds
   */
  getRetryAfter(): number | null {
    return this.state.retryAfter;
  }

  /**
   * Handle a rate limit error (429 response)
   */
  handleRateLimitError(error: RateLimitError | { retryAfter?: number }): void {
    this.state.consecutiveErrors++;
    
    let backoffMs: number;
    if ('retryAfter' in error && error.retryAfter) {
      backoffMs = error.retryAfter * 1000;
    } else {
      backoffMs = Math.min(
        this.config.baseBackoff * Math.pow(2, this.state.consecutiveErrors - 1),
        this.config.maxBackoff
      );
    }

    this.state.isLimited = true;
    this.state.retryAfter = Math.ceil(backoffMs / 1000);
    this.state.limitedUntil = Date.now() + backoffMs;

    if (this.callbacks.onRateLimited) {
      this.callbacks.onRateLimited(this.state.retryAfter);
    }

    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
    }
    this.clearTimer = setTimeout(() => {
      this.clearRateLimit();
    }, backoffMs);
  }

  /**
   * Handle a successful request
   */
  handleSuccess(): void {
    this.state.consecutiveErrors = 0;
  }

  /**
   * Clear rate limit state
   */
  clearRateLimit(): void {
    this.state.isLimited = false;
    this.state.retryAfter = null;
    this.state.limitedUntil = null;
    
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = null;
    }

    if (this.callbacks.onRateLimitCleared) {
      this.callbacks.onRateLimitCleared();
    }
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.clearRateLimit();
    this.state.consecutiveErrors = 0;
  }

  /**
   * Get current state
   */
  getState(): Readonly<RateLimitState> {
    return { ...this.state };
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter();

/**
 * Create a new rate limiter instance
 */
export function createRateLimiter(config?: RateLimiterConfig): RateLimiter {
  return new RateLimiter(config);
}

/**
 * Wrap an async function with rate limit checking
 */
export async function withRateLimitCheck<T>(
  fn: () => Promise<T>,
  rateLimiter: RateLimiter = globalRateLimiter
): Promise<T> {
  if (rateLimiter.isRateLimited()) {
    const retryAfter = rateLimiter.getRetryAfter();
    throw new RateLimitError(retryAfter ?? undefined);
  }

  try {
    const result = await fn();
    rateLimiter.handleSuccess();
    return result;
  } catch (error) {
    if (error instanceof RateLimitError) {
      rateLimiter.handleRateLimitError(error);
    }
    throw error;
  }
}

/**
 * Format rate limit message for display
 */
export function formatRateLimitMessage(retryAfter: number): string {
  if (retryAfter < 60) {
    return `Please wait ${retryAfter} second${retryAfter !== 1 ? 's' : ''} before trying again.`;
  }
  const minutes = Math.ceil(retryAfter / 60);
  return `Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before trying again.`;
}

export default RateLimiter;
