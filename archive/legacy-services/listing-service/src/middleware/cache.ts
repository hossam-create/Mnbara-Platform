import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';

// Redis client configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

// Cache configuration
const CACHE_TTL = {
  CATEGORIES: 3600, // 1 hour
  CATEGORY_TREE: 1800, // 30 minutes
  CATEGORY_STATS: 900, // 15 minutes
  SEARCH_RESULTS: 300, // 5 minutes
  POPULAR_CATEGORIES: 600 // 10 minutes
};

// Cache keys
const CACHE_KEYS = {
  CATEGORIES: (level?: number, parentId?: string) => 
    `categories:list:${level || 'all'}:${parentId || 'root'}`,
  CATEGORY_TREE: (maxDepth?: number) => 
    `categories:tree:${maxDepth || 4}`,
  CATEGORY_STATS: (categoryId: string) => 
    `categories:stats:${categoryId}`,
  SEARCH_RESULTS: (query: string) => 
    `categories:search:${encodeURIComponent(query)}`,
  POPULAR_CATEGORIES: (limit?: number) => 
    `categories:popular:${limit || 20}`
};

// Cache middleware
export const cacheMiddleware = (ttl: number, keyGenerator: (req: Request) => string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cacheKey = keyGenerator(req);
      const cached = await redis.get(cacheKey);

      if (cached) {
        const data = JSON.parse(cached);
        return res.json({
          success: true,
          data,
          cached: true,
          timestamp: await redis.get(`${cacheKey}:timestamp`)
        });
      }

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data: any) {
        if (data.success && data.data) {
          // Cache the response
          redis.setex(cacheKey, ttl, JSON.stringify(data.data));
          redis.setex(`${cacheKey}:timestamp`, ttl, Date.now().toString());
        }
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Cache invalidation
export const invalidateCache = async (pattern: string) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

// Specific invalidation functions
export const invalidateCategoryCache = async (categoryId?: string) => {
  const patterns = [
    'categories:list:*',
    'categories:tree:*',
    'categories:search:*',
    'categories:popular:*'
  ];

  if (categoryId) {
    patterns.push(`categories:stats:${categoryId}`);
  }

  for (const pattern of patterns) {
    await invalidateCache(pattern);
  }
};

// Cache warming
export const warmCache = async () => {
  try {
    console.log('Warming up cache...');
    
    // This would typically make API calls to pre-populate cache
    // For now, we'll just log that warming is happening
    console.log('Cache warming completed');
  } catch (error) {
    console.error('Cache warming error:', error);
  }
};

// Cache statistics
export const getCacheStats = async () => {
  try {
    const info = await redis.info('memory');
    const keyspace = await redis.info('keyspace');
    const dbSize = await redis.dbsize();
    
    return {
      memory: info,
      keyspace,
      totalKeys: dbSize,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return null;
  }
};

// Health check
export const cacheHealthCheck = async () => {
  try {
    await redis.ping();
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
};

// Export cache utilities
export {
  redis,
  CACHE_TTL,
  CACHE_KEYS
};
