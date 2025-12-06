import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import * as UAParser from 'ua-parser-js';
import * as geoip from 'geoip-lite';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SessionService implements OnModuleInit, OnModuleDestroy {
  private redisClient: RedisClientType;

  constructor(
    private configService: ConfigService,
    private db: DatabaseService,
  ) {}

  async onModuleInit() {
    this.redisClient = createClient({
      socket: {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
      },
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    try {
      await this.redisClient.connect();
      console.log('✅ Redis connected successfully');
    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
    }
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
    console.log('Redis connection closed');
  }

  async createSession(
    userId: number,
    userAgent: string,
    ipAddress: string,
  ): Promise<string> {
    // Parse user agent
    const parser = new UAParser(userAgent);
    const deviceType = parser.getDevice().type || 'desktop';
    const deviceInfo = {
      browser: parser.getBrowser().name,
      browserVersion: parser.getBrowser().version,
      os: parser.getOS().name,
      osVersion: parser.getOS().version,
      device: deviceType,
    };

    // Get location from IP
    const geo = geoip.lookup(ipAddress);
    const country = geo?.country || 'Unknown';
    const city = geo?.city || 'Unknown';

    // Create session in database
    const session = await this.db.insert('user_sessions', {
      user_id: userId,
      device_type: deviceType,
      device_info: deviceInfo,
      ip_address: ipAddress,
      country,
      city,
      login_at: new Date(),
      is_active: true,
    });

    // Generate session ID
    const sessionId = `session:${userId}:${session.id}`;

    // Store session in Redis (expires in 24 hours)
    await this.redisClient.setEx(
      sessionId,
      24 * 60 * 60, // 24 hours
      JSON.stringify({
        userId,
        sessionDbId: session.id,
        deviceType,
        country,
        loginAt: new Date().toISOString(),
      }),
    );

    // Track active sessions count
    await this.redisClient.sAdd(`user:${userId}:sessions`, sessionId);

    // Update user login count
    await this.db.query(
      `UPDATE users 
       SET total_login_count = COALESCE(total_login_count, 0) + 1,
           last_login_at = $1,
           last_login_ip = $2,
           last_login_country = $3
       WHERE id = $4`,
      [new Date(), ipAddress, country, userId],
    );

    return sessionId;
  }

  async endSession(sessionId: string): Promise<void> {
    try {
      // Get session data from Redis
      const sessionData = await this.redisClient.get(sessionId);
      if (!sessionData) return;

      const session = JSON.parse(sessionData);
      const loginAt = new Date(session.loginAt);
      const logoutAt = new Date();
      const sessionDuration = Math.floor((logoutAt.getTime() - loginAt.getTime()) / 1000);

      // Update session in database
      await this.db.update(
        'user_sessions',
        { id: session.sessionDbId },
        {
          logout_at: logoutAt,
          session_duration: sessionDuration,
          is_active: false,
        },
      );

      // Remove from Redis
      await this.redisClient.del(sessionId);
      await this.redisClient.sRem(`user:${session.userId}:sessions`, sessionId);
    } catch (error) {
      console.error('Error ending session:', error.message);
    }
  }

  async getActiveSession(sessionId: string): Promise<any> {
    const sessionData = await this.redisClient.get(sessionId);
    return sessionData ? JSON.parse(sessionData) : null;
  }

  async getUserActiveSessions(userId: number): Promise<string[]> {
    return await this.redisClient.sMembers(`user:${userId}:sessions`);
  }

  async endAllUserSessions(userId: number): Promise<void> {
    const sessions = await this.getUserActiveSessions(userId);
    
    for (const sessionId of sessions) {
      await this.endSession(sessionId);
    }
  }

  async getActiveUsersCount(): Promise<number> {
    // Count unique users with active sessions
    const keys = await this.redisClient.keys('session:*');
    const uniqueUsers = new Set<number>();

    for (const key of keys) {
      const sessionData = await this.redisClient.get(key);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        uniqueUsers.add(session.userId);
      }
    }

    return uniqueUsers.size;
  }

  async cleanupExpiredSessions(): Promise<void> {
    // This should be called periodically (e.g., via cron job)
    // Update database sessions that are still marked as active but expired in Redis
    const activeSessions = await this.db.query(
      `SELECT id, user_id, login_at 
       FROM user_sessions 
       WHERE is_active = true 
         AND login_at < NOW() - INTERVAL '24 hours'`,
    );

    for (const session of activeSessions.rows) {
      const sessionId = `session:${session.user_id}:${session.id}`;
      const exists = await this.redisClient.exists(sessionId);

      if (!exists) {
        // Session expired, mark as inactive
        await this.db.update(
          'user_sessions',
          { id: session.id },
          {
            logout_at: new Date(session.login_at.getTime() + 24 * 60 * 60 * 1000),
            session_duration: 24 * 60 * 60,
            is_active: false,
          },
        );
      }
    }
  }
}
