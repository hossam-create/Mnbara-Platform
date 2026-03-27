/**
 * Plugin Storage
 * 
 * Storage utilities for MNBara plugins
 */

export interface StorageAdapter {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  delete: (key: string) => Promise<void>;
  deleteMany: (keys: string[]) => Promise<void>;
  has: (key: string) => Promise<boolean>;
  keys: () => Promise<string[]>;
  clear: () => Promise<void>;
  size: () => Promise<number>;
}

export interface PluginStorage {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  delete: (key: string) => Promise<void>;
  has: (key: string) => Promise<boolean>;
  keys: () => Promise<string[]>;
  clear: () => Promise<void>;
  size: () => Promise<number>;
  
  // Batch operations
  getMany: (keys: string[]) => Promise<Record<string, any>>;
  setMany: (items: Record<string, any>) => Promise<void>;
  deleteMany: (keys: string[]) => Promise<void>;
  
  // Advanced operations
  increment: (key: string, amount?: number) => Promise<number>;
  decrement: (key: string, amount?: number) => Promise<number>;
  append: (key: string, value: any) => Promise<void>;
  prepend: (key: string, value: any) => Promise<void>;
  
  // Metadata
  getMetadata: (key: string) => Promise<StorageMetadata>;
  setMetadata: (key: string, metadata: Partial<StorageMetadata>) => Promise<void>;
  
  // Plugin-specific operations
  getPluginData: (pluginId: string, key: string) => Promise<any>;
  setPluginData: (pluginId: string, key: string, value: any) => Promise<void>;
  deletePluginData: (pluginId: string, key: string) => Promise<void>;
  getAllPluginData: (pluginId: string) => Promise<Record<string, any>>;
  clearPluginData: (pluginId: string) => Promise<void>;
}

export interface StorageMetadata {
  createdAt: Date;
  updatedAt: Date;
  accessedAt: Date;
  size: number;
  type: string;
  pluginId?: string;
  tags?: string[];
}

export class MemoryStorage implements StorageAdapter {
  private storage: Map<string, { value: any; metadata: StorageMetadata }> = new Map();

  async get(key: string): Promise<any> {
    const item = this.storage.get(key);
    if (item) {
      item.metadata.accessedAt = new Date();
      return item.value;
    }
    return undefined;
  }

  async set(key: string, value: any): Promise<void> {
    const now = new Date();
    const existing = this.storage.get(key);
    
    const metadata: StorageMetadata = existing ? {
      ...existing.metadata,
      updatedAt: now,
      accessedAt: now
    } : {
      createdAt: now,
      updatedAt: now,
      accessedAt: now,
      size: JSON.stringify(value).length,
      type: typeof value
    };

    this.storage.set(key, { value, metadata });
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async deleteMany(keys: string[]): Promise<void> {
    for (const key of keys) {
      this.storage.delete(key);
    }
  }

  async has(key: string): Promise<boolean> {
    return this.storage.has(key);
  }

  async keys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async size(): Promise<number> {
    return this.storage.size;
  }

  async getMetadata(key: string): Promise<StorageMetadata> {
    const item = this.storage.get(key);
    if (!item) {
      throw new Error(`Key not found: ${key}`);
    }
    return { ...item.metadata };
  }

  async setMetadata(key: string, metadata: Partial<StorageMetadata>): Promise<void> {
    const item = this.storage.get(key);
    if (!item) {
      throw new Error(`Key not found: ${key}`);
    }
    item.metadata = { ...item.metadata, ...metadata, updatedAt: new Date() };
  }
}

export class FileStorage implements StorageAdapter {
  private basePath: string;
  private memoryCache: MemoryStorage;

  constructor(basePath: string) {
    this.basePath = basePath;
    this.memoryCache = new MemoryStorage();
  }

  async get(key: string): Promise<any> {
    // For now, just use memory storage
    // In a real implementation, this would read from files
    return this.memoryCache.get(key);
  }

  async set(key: string, value: any): Promise<void> {
    // For now, just use memory storage
    // In a real implementation, this would write to files
    return this.memoryCache.set(key, value);
  }

  async delete(key: string): Promise<void> {
    return this.memoryCache.delete(key);
  }

  async deleteMany(keys: string[]): Promise<void> {
    return this.memoryCache.deleteMany(keys);
  }

  async has(key: string): Promise<boolean> {
    return this.memoryCache.has(key);
  }

  async keys(): Promise<string[]> {
    return this.memoryCache.keys();
  }

  async clear(): Promise<void> {
    return this.memoryCache.clear();
  }

  async size(): Promise<number> {
    return this.memoryCache.size();
  }
}

export class DefaultPluginStorage implements PluginStorage {
  private adapter: StorageAdapter;
  private pluginId: string;

  constructor(adapter: StorageAdapter, pluginId: string) {
    this.adapter = adapter;
    this.pluginId = pluginId;
  }

  async get(key: string): Promise<any> {
    return this.adapter.get(this.prefixKey(key));
  }

  async set(key: string, value: any): Promise<void> {
    return this.adapter.set(this.prefixKey(key), value);
  }

  async delete(key: string): Promise<void> {
    return this.adapter.delete(this.prefixKey(key));
  }

  async has(key: string): Promise<boolean> {
    return this.adapter.has(this.prefixKey(key));
  }

  async keys(): Promise<string[]> {
    const allKeys = await this.adapter.keys();
    return allKeys.filter(key => key.startsWith(`${this.pluginId}:`));
  }

  async clear(): Promise<void> {
    const keys = await this.keys();
    await this.adapter.deleteMany(keys);
  }

  async size(): Promise<number> {
    return this.adapter.size();
  }

  async getMany(keys: string[]): Promise<Record<string, any>> {
    const prefixedKeys = keys.map(key => this.prefixKey(key));
    const results: Record<string, any> = {};
    
    for (let i = 0; i < keys.length; i++) {
      results[keys[i]] = await this.adapter.get(prefixedKeys[i]);
    }
    
    return results;
  }

  async setMany(items: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(items)) {
      await this.set(key, value);
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.delete(key);
    }
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    const current = await this.get(key) || 0;
    const newValue = (typeof current === 'number' ? current : 0) + amount;
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

  async getMetadata(key: string): Promise<StorageMetadata> {
    if (this.adapter instanceof MemoryStorage) {
      return this.adapter.getMetadata(this.prefixKey(key));
    }
    
    // Default metadata for other adapters
    return {
      createdAt: new Date(),
      updatedAt: new Date(),
      accessedAt: new Date(),
      size: 0,
      type: 'unknown',
      pluginId: this.pluginId
    };
  }

  async setMetadata(key: string, metadata: Partial<StorageMetadata>): Promise<void> {
    if (this.adapter instanceof MemoryStorage) {
      return this.adapter.setMetadata(this.prefixKey(key), metadata);
    }
  }

  async getPluginData(pluginId: string, key: string): Promise<any> {
    return this.adapter.get(`${pluginId}:${key}`);
  }

  async setPluginData(pluginId: string, key: string, value: any): Promise<void> {
    return this.adapter.set(`${pluginId}:${key}`, value);
  }

  async deletePluginData(pluginId: string, key: string): Promise<void> {
    return this.adapter.delete(`${pluginId}:${key}`);
  }

  async getAllPluginData(pluginId: string): Promise<Record<string, any>> {
    const keys = await this.adapter.keys();
    const pluginKeys = keys.filter(key => key.startsWith(`${pluginId}:`));
    const data: Record<string, any> = {};
    
    for (const key of pluginKeys) {
      const shortKey = key.substring(pluginId.length + 1);
      data[shortKey] = await this.adapter.get(key);
    }
    
    return data;
  }

  async clearPluginData(pluginId: string): Promise<void> {
    const keys = await this.adapter.keys();
    const pluginKeys = keys.filter(key => key.startsWith(`${pluginId}:`));
    await this.adapter.deleteMany(pluginKeys);
  }

  private prefixKey(key: string): string {
    return `${this.pluginId}:${key}`;
  }
}