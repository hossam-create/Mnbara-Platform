import { createClient, RedisClientType } from 'redis';

/**
 * Redis Shared Service
 * Handles caching and shared state with connection resilience
 */
export class RedisService {
    private static client: RedisClientType | null = null;
    private static isInitialized = false;

    /**
     * Initialize Redis Connection
     */
    static async connect(): Promise<RedisClientType> {
        if (this.client && this.isInitialized) {
            return this.client;
        }

        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

        this.client = createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.error('❌ Redis maximum reconnection attempts reached');
                        return new Error('Redis reconnection failed');
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        });

        this.client.on('error', (err) => console.error('❌ Redis Client Error:', err));
        this.client.on('connect', () => console.log('✅ Redis connected successfully'));
        this.client.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));

        await this.client.connect();
        this.isInitialized = true;
        return this.client;
    }

    /**
     * Get value from cache
     */
    static async get(key: string): Promise<string | null> {
        const client = await this.connect();
        return await client.get(key);
    }

    /**
     * Set value in cache
     */
    static async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        const client = await this.connect();
        if (ttlSeconds) {
            await client.set(key, value, {
                EX: ttlSeconds
            });
        } else {
            await client.set(key, value);
        }
    }

    /**
     * Delete key from cache
     */
    static async del(key: string): Promise<void> {
        const client = await this.connect();
        await client.del(key);
    }

    /**
     * JSON Get helper
     */
    static async getJson<T>(key: string): Promise<T | null> {
        const val = await this.get(key);
        if (!val) return null;
        try {
            return JSON.parse(val) as T;
        } catch (e) {
            console.error(`❌ Error parsing JSON from Redis key ${key}:`, e);
            return null;
        }
    }

    /**
     * JSON Set helper
     */
    static async setJson(key: string, value: any, ttlSeconds?: number): Promise<void> {
        await this.set(key, JSON.stringify(value), ttlSeconds);
    }

    /**
     * Close Connection
     */
    static async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.disconnect();
            this.isInitialized = false;
        }
    }
}
