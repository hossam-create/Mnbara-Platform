import { Request, Response } from 'express';
import { UptimeMonitorService } from '../services/uptime-monitor.service';
import { MatchingEngineHealthService } from '../services/matching-engine-health.service';
import logger from '../utils/logger';

/**
 * Controller for uptime monitoring endpoints
 */
export class UptimeMonitorController {
  /**
   * GET /api/v1/admin/uptime/status
   * Get current uptime status
   */
  static async getUptimeStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await UptimeMonitorService.getUptimeStatus();
      
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error('Error getting uptime status', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get uptime status',
      });
    }
  }

  /**
   * GET /api/v1/admin/uptime/report
   * Get uptime report
   */
  static async getUptimeReport(req: Request, res: Response): Promise<void> {
    try {
      const report = await UptimeMonitorService.generateUptimeReport();
      
      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      logger.error('Error generating uptime report', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate uptime report',
      });
    }
  }

  /**
   * GET /api/v1/admin/uptime/sla
   * Check SLA compliance
   */
  static async checkSLACompliance(req: Request, res: Response): Promise<void> {
    try {
      const { period = 1440 } = req.query;
      const periodMinutes = parseInt(period as string, 10);
      
      if (isNaN(periodMinutes) || periodMinutes < 1) {
        res.status(400).json({
          success: false,
          error: 'Invalid period parameter',
        });
        return;
      }
      
      const compliance = await UptimeMonitorService.checkSLACompliance(periodMinutes);
      
      res.status(200).json({
        success: true,
        data: compliance,
      });
    } catch (error) {
      logger.error('Error checking SLA compliance', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check SLA compliance',
      });
    }
  }

  /**
   * GET /api/v1/admin/uptime/downtime-events
   * Get downtime events
   */
  static async getDowntimeEvents(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 100 } = req.query;
      const limitNum = parseInt(limit as string, 10);
      
      if (isNaN(limitNum) || limitNum < 1) {
        res.status(400).json({
          success: false,
          error: 'Invalid limit parameter',
        });
        return;
      }
      
      const events = await UptimeMonitorService.getDowntimeEvents(limitNum);
      
      res.status(200).json({
        success: true,
        data: {
          count: events.length,
          events,
        },
      });
    } catch (error) {
      logger.error('Error getting downtime events', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get downtime events',
      });
    }
  }

  /**
   * GET /api/v1/admin/health/matching-engine
   * Get matching engine health status
   */
  static async getMatchingEngineHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await MatchingEngineHealthService.getHealthStatus();
      
      res.status(health.healthy ? 200 : 503).json({
        success: health.healthy,
        data: health,
      });
    } catch (error) {
      logger.error('Error getting matching engine health', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get matching engine health',
      });
    }
  }

  /**
   * GET /api/v1/admin/health/metrics
   * Get health metrics
   */
  static async getHealthMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await MatchingEngineHealthService.getHealthMetrics();
      
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Error getting health metrics', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get health metrics',
      });
    }
  }

  /**
   * POST /api/v1/admin/uptime/reset (for testing only)
   * Reset uptime monitoring data
   */
  static async resetUptimeData(req: Request, res: Response): Promise<void> {
    try {
      // Only allow in development
      if (process.env.NODE_ENV === 'production') {
        res.status(403).json({
          success: false,
          error: 'Not allowed in production',
        });
        return;
      }
      
      await UptimeMonitorService.reset();
      
      res.status(200).json({
        success: true,
        message: 'Uptime monitoring data reset',
      });
    } catch (error) {
      logger.error('Error resetting uptime data', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset uptime data',
      });
    }
  }
}
