/**
 * Plugin Cache
 * 
 * Caching utilities for MNBara plugins
 */

export enum CacheStrategy {
  TTL = 'ttl',           // Time To Live
  LRU = 'lru',           // Least Recently Used
  FIFO = 'fifo',         // First In, First Out
  LFU = 'lfu',           // Least Frequently Used
  ARC = 'arc'            // Adaptive Replacement Cache
}

export interface CacheEntry {
  key: string;
  value: any;
  createdAt: Date;
  accessedAt: Date;
  expiresAt?: Date;
  accessCount: number;
  size: number;
}

export interface CacheOptions {
  strategy: CacheStrategy;
  maxSize?: number;
  maxAge?: number; // milliseconds
  checkPeriod?: number; // milliseconds
  serialize?: boolean;
  compression?: boolean;
}

export interface PluginCache {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any, options?: CacheSetOptions) => Promise<void>;
  delete: (key: string) => Promise<boolean>;
  has: (key: string) => Promise<boolean>;
  keys: () => Promise<string[]>;
  clear: () => Promise<void>;
  size: () => Promise<number>;
  
  // Statistics
  getStats: () => Promise<CacheStats>;
  resetStats: () => Promise<void>;
  
  // Batch operations
  getMany: (keys: string[]) => Promise<Record<string, any>>;
  setMany: (items: Record<string, any>, options?: CacheSetOptions) => Promise<void>;
  deleteMany: (keys: string[]) => Promise<number>;
  
  // Advanced operations
  increment: (key: string, amount?: number) => Promise<number>;
  decrement: (key: string, amount?: number) => Promise<number>;
  append: (key: string, value: any) => Promise<void>;
  prepend: (key: string, value: any) => Promise<void>;
  
  // TTL operations
  expire: (key: string, ttl: number) => Promise<boolean>;
  ttl: (key: string) => Promise<number | undefined>;
  
  // Cleanup
  cleanup: () => Promise<void>;
  prune: () => Promise<void>;
}

export interface CacheSetOptions {
  ttl?: number; // milliseconds
  tags?: string[];
  priority?: number;
  compression?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  size: number;
  maxSize: number;
  hitRate: number;
  missRate: number;
  evictionRate: number;
  averageSetTime: number;
  averageGetTime: number;
  memoryUsage: number;
}

export class TTLCache implements PluginCache {
  protected cache: Map<string, CacheEntry> = new Map();
  protected stats: CacheStats;
  protected options: CacheOptions;
  private checkInterval?: NodeJS.Timeout;

  constructor(options: CacheOptions) {
    this.options = options;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      size: 0,
      maxSize: options.maxSize || 1000,
      hitRate: 0,
      missRate: 0,
      evictionRate: 0,
      averageSetTime: 0,
      averageGetTime: 0,
      memoryUsage: 0
    };

    if (options.checkPeriod) {
      this.startCleanupInterval();
    }
  }

  async get(key: string): Promise<any> {
    const startTime = Date.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateRates();
      return undefined;
    }

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.deletes++;
      this.updateRates();
      return undefined;
    }

    // Update access time and count
    entry.accessedAt = new Date();
    entry.accessCount++;

    this.stats.hits++;
    this.stats.averageGetTime = (this.stats.averageGetTime + (Date.now() - startTime)) / 2;
    this.updateRates();

    return entry.value;
  }

  async set(key: string, value: any, options?: CacheSetOptions): Promise<void> {
    const startTime = Date.now();
    const now = new Date();
    
    let expiresAt: Date | undefined;
    if (options?.ttl || this.options.maxAge) {
      expiresAt = new Date(now.getTime() + (options?.ttl || this.options.maxAge!));
    }

    const entry: CacheEntry = {
      key,
      value,
      createdAt: now,
      accessedAt: now,
      expiresAt,
      accessCount: 1,
      size: JSON.stringify(value).length
    };

    // Check if we need to evict entries
    if (this.cache.size >= this.stats.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
    this.stats.sets++;
    this.stats.size = this.cache.size;
    this.stats.averageSetTime = (this.stats.averageSetTime + (Date.now() - startTime)) / 2;
    this.stats.memoryUsage += entry.size;
  }

  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (entry) {
      this.stats.memoryUsage -= entry.size;
      this.cache.delete(key);
      this.stats.deletes++;
      this.stats.size = this.cache.size;
      return true;
    }
    return false;
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      this.cache.delete(key);
      this.stats.deletes++;
      return false;
    }

    return true;
  }

  async keys(): Promise<string[]> {
    this.cleanupExpired();
    return Array.from(this.cache.keys());
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.stats.size = 0;
    this.stats.memoryUsage = 0;
  }

  async size(): Promise<number> {
    return this.cache.size;
  }

  async getStats(): Promise<CacheStats> {
    return { ...this.stats };
  }

  async resetStats(): Promise<void> {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      size: this.cache.size,
      maxSize: this.options.maxSize || 1000,
      hitRate: 0,
      missRate: 0,
      evictionRate: 0,
      averageSetTime: 0,
      averageGetTime: 0,
      memoryUsage: this.stats.memoryUsage
    };
  }

  async getMany(keys: string[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    for (const key of keys) {
      results[key] = await this.get(key);
    }
    return results;
  }

  async setMany(items: Record<string, any>, options?: CacheSetOptions): Promise<void> {
    for (const [key, value] of Object.entries(items)) {
      await this.set(key, value, options);
    }
  }

  async deleteMany(keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (await this.delete(key)) {
        deleted++;
      }
    }
    return deleted;
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    const current = await this.get(key) || 0;
    if (typeof current !== 'number') {
      throw new Error(`Cannot increment non-numeric value at key: ${key}`);
    }
    const newValue = current + amount;
    await this.set(key, newValue);
    return newValue;
  }

  async decrement(key: string, amount: number = 1): Promise<number> {
    return this.increment(key, -amount);
  }

  async append(key: string, value: any): Promise<void> {
    const current = await this.get(key) || [];
    if (Array.isArray(current)) {
      current.push(value);
      await this.set(key, current);
    } else {
      throw new Error(`Cannot append to non-array value at key: ${key}`);
    }
  }

  async prepend(key: string, value: any): Promise<void> {
    const current = await this.get(key) || [];
    if (Array.isArray(current)) {
      current.unshift(value);
      await this.set(key, current);
    } else {
      throw new Error(`Cannot prepend to non-array value at key: ${key}`);
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    entry.expiresAt = new Date(Date.now() + ttl);
    return true;
  }

  async ttl(key: string): Promise<number | undefined> {
    const entry = this.cache.get(key);
    if (!entry || !entry.expiresAt) {
      return undefined;
    }

    const ttl = entry.expiresAt.getTime() - Date.now();
    return ttl > 0 ? ttl : undefined;
  }

  async cleanup(): Promise<void> {
    this.cleanupExpired();
  }

  async prune(): Promise<void> {
    // Remove expired entries and reduce size if needed
    this.cleanupExpired();
    
    while (this.cache.size > this.stats.maxSize * 0.9) {
      this.evictOldest();
    }
  }

  private cleanupExpired(): void {
    const now = new Date();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      const entry = this.cache.get(key);
      if (entry) {
        this.stats.memoryUsage -= entry.size;
        this.cache.delete(key);
      }
    }

    if (toDelete.length > 0) {
      this.stats.deletes += toDelete.length;
      this.stats.size = this.cache.size;
    }
  }

  protected evictOldest(): void {
    let oldestKey: string | undefined;
    let oldestTime = new Date();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessedAt < oldestTime) {
        oldestTime = entry.accessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.stats.memoryUsage -= entry.size;
        this.cache.delete(oldestKey);
        this.stats.evictions++;
        this.stats.size = this.cache.size;
      }
    }
  }

  private updateRates(): void {
    const total = this.stats.hits + this.stats.misses;
    if (total > 0) {
      this.stats.hitRate = this.stats.hits / total;
      this.stats.missRate = this.stats.misses / total;
    }
    
    if (this.stats.sets > 0) {
      this.stats.evictionRate = this.stats.evictions / this.stats.sets;
    }
  }

  private startCleanupInterval(): void {
    this.checkInterval = setInterval(() => {
      this.cleanupExpired();
    }, this.options.checkPeriod);
  }

  stopCleanupInterval(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }
}

export class LRUCache extends TTLCache {
  constructor(options: CacheOptions) {
    super(options);
  }

  protected evictOldest(): void {
    let oldestKey: string | undefined;
    let oldestTime = new Date();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessedAt < oldestTime) {
        oldestTime = entry.accessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.stats.memoryUsage -= entry.size;
        this.cache.delete(oldestKey);
        this.stats.evictions++;
        this.stats.size = this.cache.size;
      }
    }
  }
}