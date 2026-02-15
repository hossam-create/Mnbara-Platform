// Analytics Manager
// Handles viewer tracking and stream analytics

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';

interface ViewerEvent {
  streamId: string;
  userId: string;
  eventType: 'join' | 'leave' | 'heartbeat';
  timestamp: Date;
  metadata?: any;
}

interface StreamStats {
  streamId: string;
  totalViewers: number;
  currentViewers: number;
  peakViewers: number;
  averageViewDuration: number;
  totalWatchTime: number;
  uniqueViewers: number;
  chatMessages: number;
  reactions: number;
  shares: number;
}

interface AnalyticsFilters {
  streamId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}

export class AnalyticsManager extends EventEmitter {
  private viewerSessions: Map<string, any> = new Map();
  private collectionInterval: NodeJS.Timeout | null = null;
  private statsCache: Map<string, StreamStats> = new Map();

  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private logger: Logger
  ) {
    super();
  }

  /**
   * Track viewer event
   */
  async trackViewerEvent(event: ViewerEvent): Promise<void> {
    try {
      const sessionKey = `session:${event.streamId}:${event.userId}`;
      
      switch (event.eventType) {
        case 'join':
          await this.handleViewerJoin(sessionKey, event);
          break;
        case 'leave':
          await this.handleViewerLeave(sessionKey, event);
          break;
        case 'heartbeat':
          await this.handleViewerHeartbeat(sessionKey, event);
          break;
      }

      // Update real-time stats
      await this.updateRealtimeStats(event.streamId);
      
      this.logger.info(`Viewer event: ${event.eventType} for stream ${event.streamId} by user ${event.userId}`);
    } catch (error) {
      this.logger.error('Failed to track viewer event', error);
    }
  }

  /**
   * Handle viewer join
   */
  private async handleViewerJoin(sessionKey: string, event: ViewerEvent): Promise<void> {
    const sessionData = {
      streamId: event.streamId,
      userId: event.userId,
      joinTime: event.timestamp,
      lastHeartbeat: event.timestamp,
      totalWatchTime: 0,
      metadata: event.metadata || {}
    };

    // Store in Redis
    await this.redis.hmset(sessionKey, sessionData);
    await this.redis.expire(sessionKey, 3600); // 1 hour TTL

    // Add to active viewers set
    const activeKey = `active:${event.streamId}`;
    await this.redis.sadd(activeKey, event.userId);
    await this.redis.expire(activeKey, 300); // 5 minutes TTL

    // Update viewer count
    const countKey = `count:${event.streamId}`;
    await this.redis.incr(`${countKey}:total`);
    await this.redis.incr(`${countKey}:current`);

    this.viewerSessions.set(sessionKey, sessionData);
  }

  /**
   * Handle viewer leave
   */
  private async handleViewerLeave(sessionKey: string, event: ViewerEvent): Promise<void> {
    const sessionData = this.viewerSessions.get(sessionKey);
    if (!sessionData) {
      // Try to get from Redis
      const redisData = await this.redis.hgetall(sessionKey);
      if (redisData && redisData.joinTime) {
        sessionData = {
          ...redisData,
          joinTime: new Date(redisData.joinTime),
          lastHeartbeat: new Date(redisData.lastHeartbeat)
        };
      } else {
        return;
      }
    }

    // Calculate watch time
    const watchTime = Math.floor((event.timestamp.getTime() - sessionData.joinTime.getTime()) / 1000);
    sessionData.totalWatchTime = watchTime;

    // Remove from active viewers
    const activeKey = `active:${event.streamId}`;
    await this.redis.srem(activeKey, event.userId);

    // Update current viewer count
    const countKey = `count:${event.streamId}`;
    await this.redis.decr(`${countKey}:current`);

    // Store session in database
    await this.storeViewerSession(sessionData);

    // Clean up
    this.viewerSessions.delete(sessionKey);
    await this.redis.del(sessionKey);
  }

  /**
   * Handle viewer heartbeat
   */
  private async handleViewerHeartbeat(sessionKey: string, event: ViewerEvent): Promise<void> {
    const sessionData = this.viewerSessions.get(sessionKey);
    if (sessionData) {
      sessionData.lastHeartbeat = event.timestamp;
      await this.redis.hset(sessionKey, 'lastHeartbeat', event.timestamp.toISOString());
    }

    // Update active viewers TTL
    const activeKey = `active:${event.streamId}`;
    await this.redis.expire(activeKey, 300); // Reset to 5 minutes
  }

  /**
   * Store viewer session in database
   */
  private async storeViewerSession(sessionData: any): Promise<void> {
    try {
      await this.prisma.streamAnalytic.create({
        data: {
          streamId: sessionData.streamId,
          userId: sessionData.userId,
          eventType: 'VIEW',
          duration: sessionData.totalWatchTime,
          metadata: sessionData.metadata
        }
      });
    } catch (error) {
      this.logger.error('Failed to store viewer session', error);
    }
  }

  /**
   * Get current viewer count
   */
  async getCurrentViewers(streamId: string): Promise<number> {
    try {
      const activeKey = `active:${streamId}`;
      const count = await this.redis.scard(activeKey);
      return count;
    } catch (error) {
      this.logger.error('Failed to get current viewers', error);
      return 0;
    }
  }

  /**
   * Get stream statistics
   */
  async getStreamStats(streamId: string): Promise<StreamStats> {
    try {
      // Check cache first
      const cached = this.statsCache.get(streamId);
      if (cached && (Date.now() - cached.lastUpdated) < 30000) { // 30 seconds cache
        return cached;
      }

      // Get current viewers
      const currentViewers = await this.getCurrentViewers(streamId);

      // Get historical stats from database
      const [totalViewers, uniqueViewers, totalWatchTime, peakViewers, chatMessages, reactions, shares] = await Promise.all([
        this.getTotalViewers(streamId),
        this.getUniqueViewers(streamId),
        this.getTotalWatchTime(streamId),
        this.getPeakViewers(streamId),
        this.getChatMessageCount(streamId),
        this.getReactionCount(streamId),
        this.getShareCount(streamId)
      ]);

      const stats: StreamStats = {
        streamId,
        totalViewers,
        currentViewers,
        peakViewers,
        averageViewDuration: totalViewers > 0 ? Math.floor(totalWatchTime / totalViewers) : 0,
        totalWatchTime,
        uniqueViewers,
        chatMessages,
        reactions,
        shares
      };

      // Cache the stats
      (stats as any).lastUpdated = Date.now();
      this.statsCache.set(streamId, stats);

      return stats;
    } catch (error) {
      this.logger.error('Failed to get stream stats', error);
      return {
        streamId,
        totalViewers: 0,
        currentViewers: 0,
        peakViewers: 0,
        averageViewDuration: 0,
        totalWatchTime: 0,
        uniqueViewers: 0,
        chatMessages: 0,
        reactions: 0,
        shares: 0
      };
    }
  }

  /**
   * Get total viewers
   */
  private async getTotalViewers(streamId: string): Promise<number> {
    try {
      const count = await this.prisma.streamAnalytic.count({
        where: {
          streamId,
          eventType: 'VIEW'
        }
      });
      return count;
    } catch (error) {
      this.logger.error('Failed to get total viewers', error);
      return 0;
    }
  }

  /**
   * Get unique viewers
   */
  private async getUniqueViewers(streamId: string): Promise<number> {
    try {
      const result = await this.prisma.streamAnalytic.groupBy({
        by: ['userId'],
        where: {
          streamId,
          eventType: 'VIEW'
        },
        _count: {
          userId: true
        }
      });
      return result.length;
    } catch (error) {
      this.logger.error('Failed to get unique viewers', error);
      return 0;
    }
  }

  /**
   * Get total watch time
   */
  private async getTotalWatchTime(streamId: string): Promise<number> {
    try {
      const result = await this.prisma.streamAnalytic.aggregate({
        where: {
          streamId,
          eventType: 'VIEW'
        },
        _sum: {
          duration: true
        }
      });
      return result._sum.duration || 0;
    } catch (error) {
      this.logger.error('Failed to get total watch time', error);
      return 0;
    }
  }

  /**
   * Get peak viewers
   */
  private async getPeakViewers(streamId: string): Promise<number> {
    try {
      const peakKey = `peak:${streamId}`;
      const peak = await this.redis.get(peakKey);
      return peak ? parseInt(peak) : 0;
    } catch (error) {
      this.logger.error('Failed to get peak viewers', error);
      return 0;
    }
  }

  /**
   * Get chat message count
   */
  private async getChatMessageCount(streamId: string): Promise<number> {
    try {
      const count = await this.prisma.streamMessage.count({
        where: {
          streamId,
          isDeleted: false
        }
      });
      return count;
    } catch (error) {
      this.logger.error('Failed to get chat message count', error);
      return 0;
    }
  }

  /**
   * Get reaction count
   */
  private async getReactionCount(streamId: string): Promise<number> {
    try {
      const count = await this.prisma.streamAnalytic.count({
        where: {
          streamId,
          eventType: 'REACTION'
        }
      });
      return count;
    } catch (error) {
      this.logger.error('Failed to get reaction count', error);
      return 0;
    }
  }

  /**
   * Get share count
   */
  private async getShareCount(streamId: string): Promise<number> {
    try {
      const count = await this.prisma.streamAnalytic.count({
        where: {
          streamId,
          eventType: 'SHARE'
        }
      });
      return count;
    } catch (error) {
      this.logger.error('Failed to get share count', error);
      return 0;
    }
  }

  /**
   * Update real-time statistics
   */
  private async updateRealtimeStats(streamId: string): Promise<void> {
    try {
      const currentViewers = await this.getCurrentViewers(streamId);
      
      // Update peak viewers if current is higher
      const peakKey = `peak:${streamId}`;
      const currentPeak = await this.redis.get(peakKey);
      if (!currentPeak || currentViewers > parseInt(currentPeak)) {
        await this.redis.set(peakKey, currentViewers);
      }

      // Store time-series data
      const timestamp = Math.floor(Date.now() / 60000); // 1-minute buckets
      const timeseriesKey = `timeseries:${streamId}:${timestamp}`;
      await this.redis.hset(timeseriesKey, {
        viewers: currentViewers,
        timestamp: Date.now()
      });
      await this.redis.expire(timeseriesKey, 86400); // 24 hours
    } catch (error) {
      this.logger.error('Failed to update realtime stats', error);
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(filters: AnalyticsFilters = {}): Promise<any> {
    try {
      const where: any = {};
      
      if (filters.streamId) {
        where.streamId = filters.streamId;
      }
      
      if (filters.dateFrom) {
        where.createdAt = { gte: filters.dateFrom };
      }
      
      if (filters.dateTo) {
        where.createdAt = { ...where.createdAt, lte: filters.dateTo };
      }

      const analytics = await this.prisma.streamAnalytic.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 1000
      });

      return this.processAnalyticsData(analytics, filters.groupBy);
    } catch (error) {
      this.logger.error('Failed to get analytics', error);
      return [];
    }
  }

  /**
   * Process analytics data
   */
  private processAnalyticsData(analytics: any[], groupBy?: string): any[] {
    if (!groupBy) {
      return analytics;
    }

    const grouped = new Map<string, any>();
    
    analytics.forEach(record => {
      const key = this.getGroupKey(record.createdAt, groupBy);
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          period: key,
          totalViewers: 0,
          uniqueViewers: new Set(),
          totalWatchTime: 0,
          chatMessages: 0,
          reactions: 0,
          shares: 0
        });
      }

      const group = grouped.get(key);
      group.totalViewers++;
      group.uniqueViewers.add(record.userId);
      group.totalWatchTime += record.duration || 0;
      
      if (record.eventType === 'CHAT') {
        group.chatMessages++;
      } else if (record.eventType === 'REACTION') {
        group.reactions++;
      } else if (record.eventType === 'SHARE') {
        group.shares++;
      }
    });

    return Array.from(grouped.values()).map(group => ({
      ...group,
      uniqueViewers: group.uniqueViewers.size,
      averageWatchTime: group.totalViewers > 0 ? Math.floor(group.totalWatchTime / group.totalViewers) : 0
    }));
  }

  /**
   * Get group key for time period
   */
  private getGroupKey(date: Date, groupBy: string): string {
    const d = new Date(date);
    
    switch (groupBy) {
      case 'hour':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`;
      case 'day':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      case 'week':
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      default:
        return d.toISOString();
    }
  }

  /**
   * Get time-series data
   */
  async getTimeSeriesData(streamId: string, duration: number = 3600): Promise<any[]> {
    try {
      const data = [];
      const now = Math.floor(Date.now() / 60000);
      const start = now - Math.floor(duration / 60);

      for (let i = start; i <= now; i++) {
        const key = `timeseries:${streamId}:${i}`;
        const record = await this.redis.hgetall(key);
        
        if (record && record.viewers) {
          data.push({
            timestamp: parseInt(record.timestamp),
            viewers: parseInt(record.viewers)
          });
        }
      }

      return data;
    } catch (error) {
      this.logger.error('Failed to get time-series data', error);
      return [];
    }
  }

  /**
   * Start analytics collection
   */
  startCollection(): void {
    if (this.collectionInterval) {
      return; // Already running
    }

    this.collectionInterval = setInterval(() => {
      this.collectPeriodicData();
    }, 60000); // Collect every minute

    this.logger.info('Analytics collection started');
  }

  /**
   * Stop analytics collection
   */
  stopCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
      this.logger.info('Analytics collection stopped');
    }
  }

  /**
   * Collect periodic data
   */
  private async collectPeriodicData(): Promise<void> {
    try {
      // Get all active streams
      const activeStreams = await this.prisma.liveStream.findMany({
        where: { status: 'ACTIVE' }
      });

      for (const stream of activeStreams) {
        await this.updateRealtimeStats(stream.id);
      }
    } catch (error) {
      this.logger.error('Failed to collect periodic data', error);
    }
  }
}