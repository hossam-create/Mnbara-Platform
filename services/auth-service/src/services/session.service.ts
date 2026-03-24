/**
 * Session Management Service
 * Redis-based session storage with device tracking and concurrent session limits
 */

import { createClient, RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

interface RedisError extends Error {
  message: string;
}

export interface SessionData {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  metadata: Record<string, any>;
}

export interface CreateSessionParams {
  userId: string;
  deviceId?: string;
  deviceName?: string;
  deviceFingerprint?: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
  maxAge?: number; // in seconds
}

export interface SessionValidationResult {
  valid: boolean;
  session?: SessionData;
  reason?: string;
}

export class SessionService {
  private redisClient: RedisClientType;
  private readonly SESSION_PREFIX = 'session:';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private readonly DEVICE_SESSIONS_PREFIX = 'device_sessions:';
  private readonly MAX_CONCURRENT_SESSIONS = 5;
  private readonly DEFAULT_SESSION_TTL = 7 * 24 * 60 * 60; // 7 days

  constructor() {
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.redisClient.on('error', (err: Error) => {
      logger.error('Redis Client Error:', err.message);
    });

    this.redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (!this.redisClient.isOpen) {
      await this.redisClient.connect();
    }
  }

  /**
   * Create a new session
   */
  async createSession(params: CreateSessionParams): Promise<SessionData> {
    const sessionId = uuidv4();
    const now = new Date();
    const maxAge = params.maxAge || this.DEFAULT_SESSION_TTL;
    const expiresAt = new Date(now.getTime() + maxAge * 1000);

    const session: SessionData = {
      id: sessionId,
      userId: params.userId,
      deviceId: params.deviceId || uuidv4(),
      deviceName: params.deviceName || 'Unknown Device',
      deviceFingerprint: params.deviceFingerprint || '',
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      createdAt: now,
      lastActivityAt: now,
      expiresAt,
      metadata: params.metadata || {},
    };

    // Check concurrent session limit before creating
    const userSessionCount = await this.getUserSessionCount(params.userId);
    if (userSessionCount >= this.MAX_CONCURRENT_SESSIONS) {
      // Remove oldest session
      await this.removeOldestSession(params.userId);
    }

    // Store session data
    await this.redisClient.setEx(
      `${this.SESSION_PREFIX}${sessionId}`,
      maxAge,
      JSON.stringify(session)
    );

    // Add to user's session set
    await this.redisClient.sAdd(
      `${this.USER_SESSIONS_PREFIX}${params.userId}`,
      sessionId
    );
    await this.redisClient.expire(
      `${this.USER_SESSIONS_PREFIX}${params.userId}`,
      this.DEFAULT_SESSION_TTL
    );

    // Add to device's session set
    await this.redisClient.sAdd(
      `${this.DEVICE_SESSIONS_PREFIX}${session.deviceId}`,
      sessionId
    );
    await this.redisClient.expire(
      `${this.DEVICE_SESSIONS_PREFIX}${session.deviceId}`,
      this.DEFAULT_SESSION_TTL
    );

    logger.info(`Session created: ${sessionId} for user ${params.userId}`);
    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const sessionData = await this.redisClient.get(
      `${this.SESSION_PREFIX}${sessionId}`
    );
    if (!sessionData) {
      return null;
    }
    return JSON.parse(sessionData) as SessionData;
  }

  /**
   * Validate session
   */
  async validateSession(sessionId: string): Promise<SessionValidationResult> {
    const session = await this.getSession(sessionId);

    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }

    if (session.expiresAt < new Date()) {
      await this.deleteSession(sessionId);
      return { valid: false, reason: 'Session expired' };
    }

    return { valid: true, session };
  }

  /**
   * Update session activity (extend expiry)
   */
  async updateSessionActivity(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    const now = new Date();
    const maxAge = this.DEFAULT_SESSION_TTL;
    const expiresAt = new Date(now.getTime() + maxAge * 1000);

    session.lastActivityAt = now;
    session.expiresAt = expiresAt;

    await this.redisClient.setEx(
      `${this.SESSION_PREFIX}${sessionId}`,
      maxAge,
      JSON.stringify(session)
    );

    return true;
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    const sessionIds = await this.redisClient.sMembers(
      `${this.USER_SESSIONS_PREFIX}${userId}`
    );

    const sessions: SessionData[] = [];
    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session && session.expiresAt > new Date()) {
        sessions.push(session);
      }
    }

    return sessions.sort(
      (a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime()
    );
  }

  /**
   * Get user session count
   */
  async getUserSessionCount(userId: string): Promise<number> {
    const sessionIds = await this.redisClient.sMembers(
      `${this.USER_SESSIONS_PREFIX}${userId}`
    );

    let count = 0;
    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session && session.expiresAt > new Date()) {
        count++;
      }
    }

    return count;
  }

  /**
   * Remove oldest session for user
   */
  async removeOldestSession(userId: string): Promise<boolean> {
    const sessions = await this.getUserSessions(userId);
    if (sessions.length === 0) {
      return false;
    }

    const oldestSession = sessions[sessions.length - 1];
    await this.deleteSession(oldestSession.id);
    return true;
  }

  /**
   * Delete a specific session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    // Remove from session storage
    await this.redisClient.del(`${this.SESSION_PREFIX}${sessionId}`);

    // Remove from user's session set
    await this.redisClient.sRem(
      `${this.USER_SESSIONS_PREFIX}${session.userId}`,
      sessionId
    );

    // Remove from device's session set
    await this.redisClient.sRem(
      `${this.DEVICE_SESSIONS_PREFIX}${session.deviceId}`,
      sessionId
    );

    logger.info(`Session deleted: ${sessionId}`);
    return true;
  }

  /**
   * Delete all sessions for a user
   */
  async deleteAllUserSessions(userId: string): Promise<number> {
    const sessions = await this.getUserSessions(userId);
    let count = 0;

    for (const session of sessions) {
      await this.deleteSession(session.id);
      count++;
    }

    logger.info(`Deleted ${count} sessions for user ${userId}`);
    return count;
  }

  /**
   * Delete all sessions except current
   */
  async deleteOtherSessions(userId: string, currentSessionId: string): Promise<number> {
    const sessions = await this.getUserSessions(userId);
    let count = 0;

    for (const session of sessions) {
      if (session.id !== currentSessionId) {
        await this.deleteSession(session.id);
        count++;
      }
    }

    logger.info(`Deleted ${count} other sessions for user ${userId}`);
    return count;
  }

  /**
   * Delete sessions for a specific device
   */
  async deleteDeviceSessions(deviceId: string): Promise<number> {
    const sessionIds = await this.redisClient.sMembers(
      `${this.DEVICE_SESSIONS_PREFIX}${deviceId}`
    );

    let count = 0;
    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session) {
        await this.deleteSession(sessionId);
        count++;
      }
    }

    logger.info(`Deleted ${count} sessions for device ${deviceId}`);
    return count;
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    let cleaned = 0;

    // This is a simplified cleanup - in production, you'd want to scan keys
    const pattern = `${this.SESSION_PREFIX}*`;
    const keys = await this.redisClient.keys(pattern);

    for (const key of keys) {
      const sessionData = await this.redisClient.get(key);
      if (sessionData) {
        const session = JSON.parse(sessionData) as SessionData;
        if (session.expiresAt < new Date()) {
          await this.redisClient.del(key);
          cleaned++;
        }
      }
    }

    logger.info(`Cleaned up ${cleaned} expired sessions`);
    return cleaned;
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    totalSessions: number;
    activeUsers: number;
  }> {
    const pattern = `${this.SESSION_PREFIX}*`;
    const keys = await this.redisClient.keys(pattern);

    const pattern2 = `${this.USER_SESSIONS_PREFIX}*`;
    const userKeys = await this.redisClient.keys(pattern2);

    return {
      totalSessions: keys.length,
      activeUsers: userKeys.length,
    };
  }
}

// Export singleton instance
export const sessionService = new SessionService();
