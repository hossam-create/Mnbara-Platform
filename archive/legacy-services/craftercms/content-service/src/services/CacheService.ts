import { Redis } from 'ioredis';
import { Logger } from '@mnbara/shared-utils';

/**
 * Cache Service for CrafterCMS Content
 * Provides caching layer for content, search results, and personalization
 */
export class CacheService {
  private redis: Redis;
  private logger: Logger;
  private defaultTTL: number;

  constructor(redisUrl: string = 'redis://localhost:6379', defaultTTL: number = 300) {
    this.redis = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    
    this.logger = new Logger('CacheService');
    this.defaultTTL = defaultTTL;

    this.setupEventHandlers();
  }

  /**
   * Setup Redis event handlers
   */
  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      this.logger.info('Connected to Redis');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error', error);
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      this.logger.info('Reconnecting to Redis');
    });
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      
      if (value === null) {
        this.logger.debug(`Cache miss for key: ${key}`);
        return null;
      }

      this.logger.debug(`Cache hit for key: ${key}`);
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Failed to get cache value for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      const cacheTTL = ttl || this.defaultTTL;

      await this.redis.setex(key, cacheTTL, serializedValue);
      this.logger.debug(`Cached value for key: ${key} (TTL: ${cacheTTL}s)`);
    } catch (error) {
      this.logger.error(`Failed to set cache value for key: ${key}`, error);
    }
  }

  /**
   * Set value in cache with custom TTL
   */
  async setex<T>(key: string, ttl: number, value: T): Promise<void> {
    await this.set(key, value, ttl);
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.logger.debug(`Deleted cache key: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete cache key: ${key}`, error);
    }
  }

  /**
   * Delete multiple keys from cache
   */
  async delMultiple(keys: string[]): Promise<void> {
    try {
      if (keys.length === 0) {
        return;
      }

      await this.redis.del(...keys);
      this.logger.debug(`Deleted ${keys.length} cache keys`);
    } catch (error) {
      this.logger.error(`Failed to delete cache keys: ${keys.join(', ')}`, error);
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Failed to check cache existence for key: ${key}`, error);
      return false;
    }
  }

  /**
   * Get TTL for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      const ttl = await this.redis.ttl(key);
      return ttl;
    } catch (error) {
      this.logger.error(`Failed to get TTL for key: ${key}`, error);
      return -2; // Key doesn't exist
    }
  }

  /**
   * Set TTL for existing key
   */
  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.redis.expire(key, ttl);
      this.logger.debug(`Set TTL for key: ${key} to ${ttl}s`);
    } catch (error) {
      this.logger.error(`Failed to set TTL for key: ${key}`, error);
    }
  }

  /**
   * Get multiple values from cache
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) {
        return [];
      }

      const values = await this.redis.mget(...keys);
      
      return values.map(value => {
        if (value === null) {
          return null;
        }
        return JSON.parse(value) as T;
      });
    } catch (error) {
      this.logger.error(`Failed to get multiple cache values`, error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple values in cache
   */
  async mset<T>(keyValuePairs: Record<string, T>, ttl?: number): Promise<void> {
    try {
      if (Object.keys(keyValuePairs).length === 0) {
        return;
      }

      const pipeline = this.redis.pipeline();
      const cacheTTL = ttl || this.defaultTTL;

      for (const [key, value] of Object.entries(keyValuePairs)) {
        const serializedValue = JSON.stringify(value);
        pipeline.setex(key, cacheTTL, serializedValue);
      }

      await pipeline.exec();
      this.logger.debug(`Cached ${Object.keys(keyValuePairs).length} key-value pairs`);
    } catch (error) {
      this.logger.error(`Failed to set multiple cache values`, error);
    }
  }

  /**
   * Get keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      const keys = await this.redis.keys(pattern);
      return keys;
    } catch (error) {
      this.logger.error(`Failed to get keys matching pattern: ${pattern}`, error);
      return [];
    }
  }

  /**
   * Delete keys matching pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        await this.delMultiple(keys);
        this.logger.info(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete keys matching pattern: ${pattern}`, error);
    }
  }

  /**
   * Increment counter
   */
  async incr(key: string): Promise<number> {
    try {
      const value = await this.redis.incr(key);
      this.logger.debug(`Incremented counter for key: ${key}`);
      return value;
    } catch (error) {
      this.logger.error(`Failed to increment counter for key: ${key}`, error);
      return 0;
    }
  }

  /**
   * Increment counter by value
   */
  async incrby(key: string, increment: number): Promise<number> {
    try {
      const value = await this.redis.incrby(key, increment);
      this.logger.debug(`Incremented counter for key: ${key} by ${increment}`);
      return value;
    } catch (error) {
      this.logger.error(`Failed to increment counter for key: ${key}`, error);
      return 0;
    }
  }

  /**
   * Decrement counter
   */
  async decr(key: string): Promise<number> {
    try {
      const value = await this.redis.decr(key);
      this.logger.debug(`Decremented counter for key: ${key}`);
      return value;
    } catch (error) {
      this.logger.error(`Failed to decrement counter for key: ${key}`, error);
      return 0;
    }
  }

  /**
   * Add to set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      const count = await this.redis.sadd(key, ...members);
      this.logger.debug(`Added ${members.length} members to set: ${key}`);
      return count;
    } catch (error) {
      this.logger.error(`Failed to add members to set: ${key}`, error);
      return 0;
    }
  }

  /**
   * Remove from set
   */
  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      const count = await this.redis.srem(key, ...members);
      this.logger.debug(`Removed ${members.length} members from set: ${key}`);
      return count;
    } catch (error) {
      this.logger.error(`Failed to remove members from set: ${key}`, error);
      return 0;
    }
  }

  /**
   * Get set members
   */
  async smembers(key: string): Promise<string[]> {
    try {
      const members = await this.redis.smembers(key);
      return members;
    } catch (error) {
      this.logger.error(`Failed to get members from set: ${key}`, error);
      return [];
    }
  }

  /**
   * Check if member exists in set
   */
  async sismember(key: string, member: string): Promise<boolean> {
    try {
      const exists = await this.redis.sismember(key, member);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Failed to check membership in set: ${key}`, error);
      return false;
    }
  }

  /**
   * Add to sorted set with score
   */
  async zadd(key: string, score: number, member: string): Promise<number> {
    try {
      const count = await this.redis.zadd(key, score, member);
      this.logger.debug(`Added member to sorted set: ${key}`);
      return count;
    } catch (error) {
      this.logger.error(`Failed to add member to sorted set: ${key}`, error);
      return 0;
    }
  }

  /**
   * Remove from sorted set
   */
  async zrem(key: string, ...members: string[]): Promise<number> {
    try {
      const count = await this.redis.zrem(key, ...members);
      this.logger.debug(`Removed members from sorted set: ${key}`);
      return count;
    } catch (error) {
      this.logger.error(`Failed to remove members from sorted set: ${key}`, error);
      return 0;
    }
  }

  /**
   * Get sorted set members by rank
   */
  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      const members = await this.redis.zrange(key, start, stop);
      return members;
    } catch (error) {
      this.logger.error(`Failed to get range from sorted set: ${key}`, error);
      return [];
    }
  }

  /**
   * Get sorted set members by score
   */
  async zrangebyscore(key: string, min: number, max: number): Promise<string[]> {
    try {
      const members = await this.redis.zrangebyscore(key, min, max);
      return members;
    } catch (error) {
      this.logger.error(`Failed to get range by score from sorted set: ${key}`, error);
      return [];
    }
  }

  /**
   * Get hash field
   */
  async hget(key: string, field: string): Promise<string | null> {
    try {
      const value = await this.redis.hget(key, field);
      return value;
    } catch (error) {
      this.logger.error(`Failed to get hash field: ${key}.${field}`, error);
      return null;
    }
  }

  /**
   * Set hash field
   */
  async hset(key: string, field: string, value: string): Promise<number> {
    try {
      const count = await this.redis.hset(key, field, value);
      this.logger.debug(`Set hash field: ${key}.${field}`);
      return count;
    } catch (error) {
      this.logger.error(`Failed to set hash field: ${key}.${field}`, error);
      return 0;
    }
  }

  /**
   * Get all hash fields
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      const fields = await this.redis.hgetall(key);
      return fields;
    } catch (error) {
      this.logger.error(`Failed to get all hash fields: ${key}`, error);
      return {};
    }
  }

  /**
   * Execute pipeline
   */
  pipeline(): any {
    return this.redis.pipeline();
  }

  /**
   * Execute transaction
   */
  multi(): any {
    return this.redis.multi();
  }

  /**
   * Flush all cache
   */
  async flushall(): Promise<void> {
    try {
      await this.redis.flushall();
      this.logger.warn('Flushed all cache');
    } catch (error) {
      this.logger.error('Failed to flush all cache', error);
    }
  }

  /**
   * Flush current database
   */
  async flushdb(): Promise<void> {
    try {
      await this.redis.flushdb();
      this.logger.warn('Flushed current database');
    } catch (error) {
      this.logger.error('Failed to flush current database', error);
    }
  }

  /**
   * Get cache statistics
   */
  async info(): Promise<Record<string, any>> {
    try {
      const info = await this.redis.info();
      const stats: Record<string, any> = {};
      
      // Parse Redis INFO output
      const lines = info.split('\r\n');
      for (const line of lines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          stats[key] = isNaN(Number(value)) ? value : Number(value);
        }
      }
      
      return stats;
    } catch (error) {
      this.logger.error('Failed to get cache statistics', error);
      return {};
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    try {
      await this.redis.quit();
      this.logger.info('Closed Redis connection');
    } catch (error) {
      this.logger.error('Failed to close Redis connection', error);
    }
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.redis.ping();
      this.logger.info('Cache connection test successful');
      return true;
    } catch (error) {
      this.logger.error('Cache connection test failed', error);
      return false;
    }
  }
}