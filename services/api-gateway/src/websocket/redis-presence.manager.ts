/**
 * Redis Presence Manager
 * 
 * Manages user presence and socket mappings in Redis for horizontal scaling.
 * Key patterns:
 * - online_users:{userId} -> Set of socket IDs
 * - socket_metadata:{socketId} -> JSON with user info
 * TTL: 5 minutes (refreshed on heartbeat)
 */

import Redis from 'ioredis';
import { config } from '../config';

const KEY_PREFIX = 'online_users';
const METADATA_PREFIX = 'socket_metadata';
const DEFAULT_TTL = 300; // 5 minutes in seconds

class RedisPresenceManager {
  private redis: Redis | null = null;

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    try {
      this.redis = new Redis(config.redisUrl, {
        retryStrategy: (times: number) => {
          if (times > 3) {
            console.warn('[RedisPresence] Connection failed after 3 retries');
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
        maxRetriesPerRequest: 2,
      });

      this.redis.on('error', (err: Error) => {
        console.warn('[RedisPresence] Redis error:', err.message);
      });

      console.log('[RedisPresence] Manager initialized');
    } catch (error) {
      console.warn('[RedisPresence] Initialization failed:', error);
      this.redis = null;
    }
  }

  /**
   * Register a socket for a user
   */
  async registerSocket(userId: string, socketId: string): Promise<void> {
    if (!this.redis) return;

    const key = `${KEY_PREFIX}:${userId}`;
    const metadataKey = `${METADATA_PREFIX}:${socketId}`;

    try {
      // Add socket to user's set
      await this.redis.sadd(key, socketId);
      await this.redis.expire(key, DEFAULT_TTL);

      // Store socket metadata
      await this.redis.setex(
        metadataKey,
        DEFAULT_TTL,
        JSON.stringify({
          userId,
          socketId,
          connectedAt: new Date().toISOString(),
        })
      );

      console.log(`[RedisPresence] Registered socket ${socketId} for user ${userId}`);
    } catch (error) {
      console.error('[RedisPresence] Failed to register socket:', error);
    }
  }

  /**
   * Unregister a socket for a user
   */
  async unregisterSocket(userId: string, socketId: string): Promise<void> {
    if (!this.redis) return;

    const key = `${KEY_PREFIX}:${userId}`;
    const metadataKey = `${METADATA_PREFIX}:${socketId}`;

    try {
      // Remove socket from user's set
      await this.redis.srem(key, socketId);

      // Remove socket metadata
      await this.redis.del(metadataKey);

      console.log(`[RedisPresence] Unregistered socket ${socketId} for user ${userId}`);
    } catch (error) {
      console.error('[RedisPresence] Failed to unregister socket:', error);
    }
  }

  /**
   * Refresh heartbeat TTL for a socket
   */
  async refreshHeartbeat(userId: string, socketId: string): Promise<void> {
    if (!this.redis) return;

    const key = `${KEY_PREFIX}:${userId}`;
    const metadataKey = `${METADATA_PREFIX}:${socketId}`;

    try {
      // Refresh TTL on user's socket set
      await this.redis.expire(key, DEFAULT_TTL);

      // Refresh TTL on socket metadata
      const metadata = await this.redis.get(metadataKey);
      if (metadata) {
        const parsed = JSON.parse(metadata);
        parsed.lastHeartbeat = new Date().toISOString();
        await this.redis.setex(metadataKey, DEFAULT_TTL, JSON.stringify(parsed));
      }
    } catch (error) {
      console.error('[RedisPresence] Failed to refresh heartbeat:', error);
    }
  }

  /**
   * Get all socket IDs for a user
   */
  async getUserSockets(userId: string): Promise<string[]> {
    if (!this.redis) return [];

    const key = `${KEY_PREFIX}:${userId}`;

    try {
      const sockets = await this.redis.smembers(key);
      return sockets;
    } catch (error) {
      console.error('[RedisPresence] Failed to get user sockets:', error);
      return [];
    }
  }

  /**
   * Check if a user is online (has any active sockets)
   */
  async isUserOnline(userId: string): Promise<boolean> {
    if (!this.redis) return false;

    const key = `${KEY_PREFIX}:${userId}`;

    try {
      const count = await this.redis.scard(key);
      return count > 0;
    } catch (error) {
      console.error('[RedisPresence] Failed to check user presence:', error);
      return false;
    }
  }

  /**
   * Get total online users count (across all instances)
   */
  async getOnlineUsersCount(): Promise<number> {
    if (!this.redis) return 0;

    try {
      const keys = await this.redis.keys(`${KEY_PREFIX}:*`);
      return keys.length;
    } catch (error) {
      console.error('[RedisPresence] Failed to get online users count:', error);
      return 0;
    }
  }

  /**
   * Get all active sockets for broadcasting (admin use)
   */
  async getAllActiveSockets(): Promise<string[]> {
    if (!this.redis) return [];

    try {
      const metadataKeys = await this.redis.keys(`${METADATA_PREFIX}:*`);
      return metadataKeys.map((key) => key.replace(`${METADATA_PREFIX}:`, ''));
    } catch (error) {
      console.error('[RedisPresence] Failed to get all sockets:', error);
      return [];
    }
  }

  /**
   * Cleanup disconnected sockets for a user (admin/debug use)
   */
  async cleanupUserSockets(userId: string): Promise<void> {
    if (!this.redis) return;

    const key = `${KEY_PREFIX}:${userId}`;

    try {
      const socketIds = await this.redis.smembers(key);
      
      // Delete all metadata keys
      for (const socketId of socketIds) {
        await this.redis.del(`${METADATA_PREFIX}:${socketId}`);
      }

      // Delete user's socket set
      await this.redis.del(key);

      console.log(`[RedisPresence] Cleaned up ${socketIds.length} sockets for user ${userId}`);
    } catch (error) {
      console.error('[RedisPresence] Failed to cleanup user sockets:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ connected: boolean; latency: number }> {
    if (!this.redis) {
      return { connected: false, latency: -1 };
    }

    const start = Date.now();
    try {
      await this.redis.ping();
      return { connected: true, latency: Date.now() - start };
    } catch {
      return { connected: false, latency: -1 };
    }
  }
}

// Export singleton
export const redisPresenceManager = new RedisPresenceManager();
export default redisPresenceManager;
