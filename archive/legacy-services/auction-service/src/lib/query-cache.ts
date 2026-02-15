/**
 * Query Result Caching
 * 
 * Simple in-memory caching for frequently accessed data.
 * Reduces database load and improves response times.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
}

/**
 * Simple in-memory cache with TTL support
 */
export class QueryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached value
   */
  set<T>(key: string, data: T, options?: CacheOptions): void {
    const ttl = options?.ttl ?? this.defaultTTL;
    const expiresAt = Date.now() + ttl;

    this.cache.set(key, {
      data,
      expiresAt,
    });
  }

  /**
   * Get or compute value
   */
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const data = await compute();
    this.set(key, data, options);
    return data;
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache stats
   */
  stats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        expiresIn: Math.max(0, entry.expiresAt - Date.now()),
      })),
    };
  }
}

// Export singleton instance
export const queryCache = new QueryCache();

// ============================================================
// CACHE KEY BUILDERS
// ============================================================

/**
 * Build cache key for auction queries
 */
export function buildAuctionCacheKey(auctionId: number, variant?: string): string {
  return `auction:${auctionId}${variant ? `:${variant}` : ''}`;
}

/**
 * Build cache key for user queries
 */
export function buildUserCacheKey(userId: number, variant?: string): string {
  return `user:${userId}${variant ? `:${variant}` : ''}`;
}

/**
 * Build cache key for trust score queries
 */
export function buildTrustScoreCacheKey(userId: number): string {
  return `trust-score:${userId}`;
}

/**
 * Build cache key for analytics queries
 */
export function buildAnalyticsCacheKey(auctionId: number, metric: string): string {
  return `analytics:${auctionId}:${metric}`;
}

// ============================================================
// CACHE INVALIDATION HELPERS
// ============================================================

/**
 * Invalidate all auction-related caches
 */
export function invalidateAuctionCache(auctionId: number): void {
  queryCache.invalidatePattern(new RegExp(`^auction:${auctionId}:`));
  queryCache.invalidatePattern(new RegExp(`^analytics:${auctionId}:`));
}

/**
 * Invalidate all user-related caches
 */
export function invalidateUserCache(userId: number): void {
  queryCache.invalidatePattern(new RegExp(`^user:${userId}:`));
  queryCache.invalidatePattern(new RegExp(`^trust-score:${userId}`));
}

/**
 * Invalidate all caches
 */
export function invalidateAllCaches(): void {
  queryCache.clear();
}
