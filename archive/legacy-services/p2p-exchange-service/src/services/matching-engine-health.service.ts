import logger from '../utils/logger';
import { prisma, redis } from '../index';
import { UptimeMonitorService } from './uptime-monitor.service';

/**
 * Health check service for the matching engine
 * Monitors the health and availability of the matching engine
 */
export class MatchingEngineHealthService {
  private static readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private static readonly HEALTH_CHECK_TIMEOUT = 10000; // 10 seconds
  private static healthCheckInterval: NodeJS.Timeout | null = null;
  private static lastHealthCheckTime: number = 0;
  private static consecutiveFailures: number = 0;
  private static readonly MAX_CONSECUTIVE_FAILURES = 3;

  /**
   * Start health checks
   */
  static startHealthChecks(): void {
    if (this.healthCheckInterval) {
      logger.warn('Health checks already running');
      return;
    }

    logger.info('Starting matching engine health checks');
    
    // Initial health check
    this.performHealthCheck();
    
    // Schedule periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Stop health checks
   */
  static stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info('Matching engine health checks stopped');
    }
  }

  /**
   * Perform a health check
   */
  private static async performHealthCheck(): Promise<void> {
    try {
      const startTime = Date.now();
      const health = await this.checkHealth();
      const duration = Date.now() - startTime;

      this.lastHealthCheckTime = Date.now();

      if (health.healthy) {
        this.consecutiveFailures = 0;
        logger.debug('Matching engine health check passed', {
          duration,
          details: health.details,
        });
      } else {
        this.consecutiveFailures++;
        logger.warn('Matching engine health check failed', {
          duration,
          consecutiveFailures: this.consecutiveFailures,
          reason: health.reason,
          details: health.details,
        });

        // Alert if too many consecutive failures
        if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
          logger.error('Matching engine health check failed multiple times', {
            consecutiveFailures: this.consecutiveFailures,
            reason: health.reason,
          });
        }
      }

      // Record health check
      await UptimeMonitorService.recordHealthCheck(health.healthy, {
        reason: health.reason,
        details: health.details,
        duration,
      });
    } catch (error) {
      this.consecutiveFailures++;
      logger.error('Error performing health check', error);
      
      await UptimeMonitorService.recordHealthCheck(false, {
        reason: 'health_check_error',
        error: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  /**
   * Check matching engine health
   */
  private static async checkHealth(): Promise<{
    healthy: boolean;
    reason?: string;
    details: Record<string, any>;
  }> {
    const details: Record<string, any> = {};

    try {
      // Check database connection
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      details.database = {
        status: 'connected',
        duration: Date.now() - dbStart,
      };
    } catch (error) {
      details.database = {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'unknown',
      };
      return {
        healthy: false,
        reason: 'database_connection_failed',
        details,
      };
    }

    try {
      // Check Redis connection
      const redisStart = Date.now();
      await redis.ping();
      details.redis = {
        status: 'connected',
        duration: Date.now() - redisStart,
      };
    } catch (error) {
      details.redis = {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'unknown',
      };
      return {
        healthy: false,
        reason: 'redis_connection_failed',
        details,
      };
    }

    try {
      // Check matching engine job status
      const lastJobRun = await redis.hGet('matching_engine:job', 'last_run');
      const lastJobStatus = await redis.hGet('matching_engine:job', 'status');
      
      if (!lastJobRun) {
        details.matchingEngine = {
          status: 'not_started',
        };
        return {
          healthy: false,
          reason: 'matching_engine_not_started',
          details,
        };
      }

      const lastRunTime = new Date(lastJobRun).getTime();
      const timeSinceLastRun = Date.now() - lastRunTime;
      const maxTimeSinceLastRun = 120000; // 2 minutes

      if (timeSinceLastRun > maxTimeSinceLastRun) {
        details.matchingEngine = {
          status: 'stalled',
          lastRun: lastJobRun,
          timeSinceLastRun,
        };
        return {
          healthy: false,
          reason: 'matching_engine_stalled',
          details,
        };
      }

      details.matchingEngine = {
        status: lastJobStatus || 'running',
        lastRun: lastJobRun,
        timeSinceLastRun,
      };
    } catch (error) {
      details.matchingEngine = {
        status: 'error',
        error: error instanceof Error ? error.message : 'unknown',
      };
      return {
        healthy: false,
        reason: 'matching_engine_check_failed',
        details,
      };
    }

    try {
      // Check active exchange requests
      const activeRequests = await prisma.exchangeRequest.count({
        where: {
          status: 'OPEN',
        },
      });
      
      details.activeRequests = activeRequests;
    } catch (error) {
      logger.warn('Failed to count active requests', error);
    }

    try {
      // Check pending matches
      const pendingMatches = await prisma.exchangeMatch.count({
        where: {
          status: 'PENDING',
        },
      });
      
      details.pendingMatches = pendingMatches;
    } catch (error) {
      logger.warn('Failed to count pending matches', error);
    }

    return {
      healthy: true,
      details,
    };
  }

  /**
   * Get current health status
   */
  static async getHealthStatus(): Promise<{
    healthy: boolean;
    lastCheckTime: number;
    consecutiveFailures: number;
    details: Record<string, any>;
  }> {
    const health = await this.checkHealth();
    
    return {
      healthy: health.healthy,
      lastCheckTime: this.lastHealthCheckTime,
      consecutiveFailures: this.consecutiveFailures,
      details: health.details,
    };
  }

  /**
   * Check if matching engine is responsive
   */
  static async isResponsive(): Promise<boolean> {
    try {
      const health = await this.checkHealth();
      return health.healthy;
    } catch (error) {
      logger.error('Error checking if matching engine is responsive', error);
      return false;
    }
  }

  /**
   * Get health metrics
   */
  static async getHealthMetrics(): Promise<{
    uptime: number;
    lastCheckTime: number;
    consecutiveFailures: number;
    healthStatus: string;
  }> {
    const status = await this.getHealthStatus();
    
    return {
      uptime: process.uptime(),
      lastCheckTime: status.lastCheckTime,
      consecutiveFailures: status.consecutiveFailures,
      healthStatus: status.healthy ? 'healthy' : 'unhealthy',
    };
  }
}
