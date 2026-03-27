import logger from '../utils/logger';
import { redis } from '../index';

/**
 * Uptime monitoring service for the matching engine
 * Tracks availability, downtime, and generates uptime reports
 */
export class UptimeMonitorService {
  private static readonly UPTIME_KEY = 'matching_engine:uptime';
  private static readonly HEALTH_CHECK_KEY = 'matching_engine:health';
  private static readonly DOWNTIME_EVENTS_KEY = 'matching_engine:downtime_events';
  private static readonly UPTIME_REPORT_KEY = 'matching_engine:uptime_report';

  /**
   * Record matching engine startup
   */
  static async recordStartup(): Promise<void> {
    try {
      const now = new Date().toISOString();
      await redis.hSet(this.UPTIME_KEY, 'last_startup', now);
      await redis.hSet(this.UPTIME_KEY, 'status', 'running');
      await redis.hSet(this.HEALTH_CHECK_KEY, 'last_check', now);
      await redis.hSet(this.HEALTH_CHECK_KEY, 'status', 'healthy');
      
      logger.info('Matching engine uptime monitoring started', {
        timestamp: now,
      });
    } catch (error) {
      logger.error('Failed to record matching engine startup', error);
    }
  }

  /**
   * Record matching engine shutdown
   */
  static async recordShutdown(): Promise<void> {
    try {
      const now = new Date().toISOString();
      await redis.hSet(this.UPTIME_KEY, 'last_shutdown', now);
      await redis.hSet(this.UPTIME_KEY, 'status', 'stopped');
      
      logger.info('Matching engine uptime monitoring stopped', {
        timestamp: now,
      });
    } catch (error) {
      logger.error('Failed to record matching engine shutdown', error);
    }
  }

  /**
   * Record health check
   */
  static async recordHealthCheck(healthy: boolean, details?: Record<string, any>): Promise<void> {
    try {
      const now = new Date().toISOString();
      const status = healthy ? 'healthy' : 'unhealthy';
      
      await redis.hSet(this.HEALTH_CHECK_KEY, 'last_check', now);
      await redis.hSet(this.HEALTH_CHECK_KEY, 'status', status);
      
      if (details) {
        await redis.hSet(this.HEALTH_CHECK_KEY, 'details', JSON.stringify(details));
      }
      
      if (!healthy) {
        // Record downtime event
        await this.recordDowntimeEvent(details);
      }
    } catch (error) {
      logger.error('Failed to record health check', error);
    }
  }

  /**
   * Record downtime event
   */
  private static async recordDowntimeEvent(details?: Record<string, any>): Promise<void> {
    try {
      const event = {
        timestamp: new Date().toISOString(),
        reason: details?.reason || 'unknown',
        details: details || {},
      };
      
      await redis.lPush(this.DOWNTIME_EVENTS_KEY, JSON.stringify(event));
      
      // Keep only last 1000 events
      await redis.lTrim(this.DOWNTIME_EVENTS_KEY, 0, 999);
      
      logger.warn('Matching engine downtime event recorded', event);
    } catch (error) {
      logger.error('Failed to record downtime event', error);
    }
  }

  /**
   * Get current uptime status
   */
  static async getUptimeStatus(): Promise<{
    status: string;
    lastStartup: string | null;
    lastShutdown: string | null;
    lastHealthCheck: string | null;
    healthStatus: string;
  }> {
    try {
      const uptimeData = await redis.hGetAll(this.UPTIME_KEY);
      const healthData = await redis.hGetAll(this.HEALTH_CHECK_KEY);
      
      return {
        status: uptimeData.status || 'unknown',
        lastStartup: uptimeData.last_startup || null,
        lastShutdown: uptimeData.last_shutdown || null,
        lastHealthCheck: healthData.last_check || null,
        healthStatus: healthData.status || 'unknown',
      };
    } catch (error) {
      logger.error('Failed to get uptime status', error);
      return {
        status: 'unknown',
        lastStartup: null,
        lastShutdown: null,
        lastHealthCheck: null,
        healthStatus: 'unknown',
      };
    }
  }

  /**
   * Calculate uptime percentage for a given period
   */
  static async calculateUptimePercentage(periodMinutes: number = 1440): Promise<number> {
    try {
      const downtimeEvents = await redis.lRange(this.DOWNTIME_EVENTS_KEY, 0, -1);
      
      if (downtimeEvents.length === 0) {
        return 100;
      }
      
      const now = Date.now();
      const periodMs = periodMinutes * 60 * 1000;
      const startTime = now - periodMs;
      
      let totalDowntimeMs = 0;
      
      for (const eventStr of downtimeEvents) {
        const event = JSON.parse(eventStr);
        const eventTime = new Date(event.timestamp).getTime();
        
        if (eventTime >= startTime) {
          // Assume each downtime event lasts 5 minutes (conservative estimate)
          totalDowntimeMs += 5 * 60 * 1000;
        }
      }
      
      const uptimePercentage = ((periodMs - totalDowntimeMs) / periodMs) * 100;
      return Math.max(0, Math.min(100, uptimePercentage));
    } catch (error) {
      logger.error('Failed to calculate uptime percentage', error);
      return 0;
    }
  }

  /**
   * Get downtime events
   */
  static async getDowntimeEvents(limit: number = 100): Promise<any[]> {
    try {
      const events = await redis.lRange(this.DOWNTIME_EVENTS_KEY, 0, limit - 1);
      return events.map(e => JSON.parse(e));
    } catch (error) {
      logger.error('Failed to get downtime events', error);
      return [];
    }
  }

  /**
   * Generate uptime report
   */
  static async generateUptimeReport(): Promise<{
    period: string;
    uptime1h: number;
    uptime24h: number;
    uptime7d: number;
    uptime30d: number;
    downtimeEvents: any[];
    status: string;
  }> {
    try {
      const [uptime1h, uptime24h, uptime7d, uptime30d, downtimeEvents, status] = await Promise.all([
        this.calculateUptimePercentage(60),
        this.calculateUptimePercentage(1440),
        this.calculateUptimePercentage(10080),
        this.calculateUptimePercentage(43200),
        this.getDowntimeEvents(50),
        this.getUptimeStatus(),
      ]);
      
      const report = {
        period: new Date().toISOString(),
        uptime1h: parseFloat(uptime1h.toFixed(2)),
        uptime24h: parseFloat(uptime24h.toFixed(2)),
        uptime7d: parseFloat(uptime7d.toFixed(2)),
        uptime30d: parseFloat(uptime30d.toFixed(2)),
        downtimeEvents,
        status: status.status,
      };
      
      // Store report in Redis
      await redis.hSet(this.UPTIME_REPORT_KEY, 'latest', JSON.stringify(report));
      
      return report;
    } catch (error) {
      logger.error('Failed to generate uptime report', error);
      return {
        period: new Date().toISOString(),
        uptime1h: 0,
        uptime24h: 0,
        uptime7d: 0,
        uptime30d: 0,
        downtimeEvents: [],
        status: 'unknown',
      };
    }
  }

  /**
   * Check if uptime meets SLA (99.9%)
   */
  static async checkSLACompliance(periodMinutes: number = 1440): Promise<{
    compliant: boolean;
    uptime: number;
    slaTarget: number;
    allowedDowntimeMinutes: number;
    actualDowntimeMinutes: number;
  }> {
    try {
      const uptime = await this.calculateUptimePercentage(periodMinutes);
      const slaTarget = 99.9;
      const allowedDowntimeMinutes = (periodMinutes * (100 - slaTarget)) / 100;
      const actualDowntimeMinutes = (periodMinutes * (100 - uptime)) / 100;
      
      return {
        compliant: uptime >= slaTarget,
        uptime: parseFloat(uptime.toFixed(2)),
        slaTarget,
        allowedDowntimeMinutes: parseFloat(allowedDowntimeMinutes.toFixed(2)),
        actualDowntimeMinutes: parseFloat(actualDowntimeMinutes.toFixed(2)),
      };
    } catch (error) {
      logger.error('Failed to check SLA compliance', error);
      return {
        compliant: false,
        uptime: 0,
        slaTarget: 99.9,
        allowedDowntimeMinutes: 0,
        actualDowntimeMinutes: 0,
      };
    }
  }

  /**
   * Reset uptime data (for testing)
   */
  static async reset(): Promise<void> {
    try {
      await redis.del(this.UPTIME_KEY);
      await redis.del(this.HEALTH_CHECK_KEY);
      await redis.del(this.DOWNTIME_EVENTS_KEY);
      await redis.del(this.UPTIME_REPORT_KEY);
      
      logger.info('Uptime monitoring data reset');
    } catch (error) {
      logger.error('Failed to reset uptime monitoring data', error);
    }
  }
}
