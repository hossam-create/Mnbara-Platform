import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { logger } from '../utils/logger';
import { config } from '../config';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient;
  private redis: Redis;
  private isConnected: boolean = false;

  private constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: config.database.url
        }
      },
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' }
      ]
    });

    this.redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.setupEventListeners();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  private setupEventListeners(): void {
    // Prisma query logging
    this.prisma.$on('query', (e) => {
      logger.debug('Prisma Query', {
        query: e.query,
        params: e.params,
        duration: e.duration
      });
    });

    this.prisma.$on('error', (e) => {
      logger.error('Prisma Error', e);
    });

    // Redis event listeners
    this.redis.on('connect', () => {
      logger.info('Redis connected');
      this.isConnected = true;
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error', error);
      this.isConnected = false;
    });

    this.redis.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    this.redis.on('close', () => {
      logger.warn('Redis connection closed');
      this.isConnected = false;
    });
  }

  public async connect(): Promise<void> {
    try {
      logger.info('Connecting to databases...');
      
      // Connect to Prisma
      await this.prisma.$connect();
      logger.info('Prisma connected successfully');

      // Connect to Redis
      await this.redis.connect();
      logger.info('Redis connected successfully');

      this.isConnected = true;
      
      // Run health check
      await this.healthCheck();
      
      logger.info('Database connections established successfully');
    } catch (error) {
      logger.error('Failed to connect to databases', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      logger.info('Disconnecting from databases...');
      
      await this.prisma.$disconnect();
      await this.redis.quit();
      
      this.isConnected = false;
      logger.info('Database connections closed successfully');
    } catch (error) {
      logger.error('Error disconnecting from databases', error);
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      // Test Prisma connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Test Redis connection
      await this.redis.ping();
      
      return true;
    } catch (error) {
      logger.error('Database health check failed', error);
      return false;
    }
  }

  public getPrisma(): PrismaClient {
    return this.prisma;
  }

  public getRedis(): Redis {
    return this.redis;
  }

  public isHealthy(): boolean {
    return this.isConnected;
  }

  // Transaction wrapper
  public async transaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(fn);
  }

  // Redis cache helpers
  public async cacheSet(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
    } catch (error) {
      logger.error('Failed to set cache', { key, error });
      throw error;
    }
  }

  public async cacheGet<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Failed to get cache', { key, error });
      return null;
    }
  }

  public async cacheDelete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error('Failed to delete cache', { key, error });
      throw error;
    }
  }

  public async cacheExists(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Failed to check cache existence', { key, error });
      return false;
    }
  }

  // Redis pub/sub helpers
  public async publish(channel: string, message: any): Promise<void> {
    try {
      await this.redis.publish(channel, JSON.stringify(message));
    } catch (error) {
      logger.error('Failed to publish message', { channel, error });
      throw error;
    }
  }

  public subscribe(channel: string, callback: (message: any) => void): void {
    try {
      const subscriber = this.redis.duplicate();
      subscriber.subscribe(channel);
      subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          try {
            const parsed = JSON.parse(message);
            callback(parsed);
          } catch (error) {
            logger.error('Failed to parse message', { channel, message, error });
          }
        }
      });
    } catch (error) {
      logger.error('Failed to subscribe to channel', { channel, error });
      throw error;
    }
  }
}