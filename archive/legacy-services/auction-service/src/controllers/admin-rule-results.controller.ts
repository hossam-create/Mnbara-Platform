/**
 * Admin Rule Results Controller
 * Exposes rule flags to admin UI
 * 
 * Endpoints:
 * - GET /admin/rules/flags - Get all pending flags
 * - GET /admin/rules/flags/:flagId - Get flag details
 * - GET /admin/rules/evaluations - Get evaluation results
 * - POST /admin/rules/flags/:flagId/acknowledge - Acknowledge flag
 * - POST /admin/rules/flags/:flagId/override - Override flag
 * - POST /admin/rules/overrides/:overrideId/approve - Approve override
 * - POST /admin/rules/flags/:flagId/resolve - Resolve flag
 * - GET /admin/rules/audit-logs/:flagId - Get audit logs
 * - GET /admin/rules/statistics - Get statistics
 */

import { Request, Response } from 'express';
import { AdminRuleResultsService, FlagStatus, OverrideAction } from '../services/admin-rule-results.service';

/**
 * Simple logger for Express environment
 */
class Logger {
  constructor(private context: string) {}

  info(message: string) {
    console.info(`[${this.context}] ${message}`);
  }

  error(message: string) {
    console.error(`[${this.context}] ${message}`);
  }
}

/**
 * AdminRuleResultsController - Handles admin rule results endpoints
 */
export class AdminRuleResultsController {
  private readonly logger = new Logger(AdminRuleResultsController.name);

  constructor(private service: AdminRuleResultsService) {}

  /**
   * GET /admin/rules/flags
   * Get all pending flags
   */
  async getPendingFlags(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      this.logger.info(`Getting pending flags (limit: ${limit}, offset: ${offset})`);

      const flags = await this.service.getPendingFlags(limit, offset);

      res.json({
        success: true,
        data: flags,
        pagination: { limit, offset },
      });
    } catch (error) {
      this.logger.error(`Failed to get pending flags: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/rules/flags/user/:userId
   * Get flags for a user
   */
  async getUserFlags(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      this.logger.info(`Getting flags for user: ${userId}`);

      const flags = await this.service.getUserFlags(userId, limit);

      res.json({
        success: true,
        data: flags,
      });
    } catch (error) {
      this.logger.error(`Failed to get user flags: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/rules/flags/auction/:auctionId
   * Get flags for an auction
   */
  async getAuctionFlags(req: Request, res: Response): Promise<void> {
    try {
      const { auctionId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      this.logger.info(`Getting flags for auction: ${auctionId}`);

      const flags = await this.service.getAuctionFlags(auctionId, limit);

      res.json({
        success: true,
        data: flags,
      });
    } catch (error) {
      this.logger.error(`Failed to get auction flags: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/rules/flags/status/:status
   * Get flags by status
   */
  async getFlagsByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      // Validate status
      if (!Object.values(FlagStatus).includes(status as FlagStatus)) {
        res.status(400).json({
          success: false,
          error: `Invalid status: ${status}`,
        });
        return;
      }

      this.logger.info(`Getting flags with status: ${status}`);

      const flags = await this.service.getFlagsByStatus(status as FlagStatus, limit);

      res.json({
        success: true,
        data: flags,
      });
    } catch (error) {
      this.logger.error(`Failed to get flags by status: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/rules/flags/severity/:severity
   * Get flags by severity
   */
  async getFlagsBySeverity(req: Request, res: Response): Promise<void> {
    try {
      const { severity } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      this.logger.info(`Getting flags with severity: ${severity}`);

      const flags = await this.service.getFlagsBySeverity(severity, limit);

      res.json({
        success: true,
        data: flags,
      });
    } catch (error) {
      this.logger.error(`Failed to get flags by severity: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/rules/flags/:flagId
   * Get flag details
   */
  async getFlagDetails(req: Request, res: Response): Promise<void> {
    try {
      const { flagId } = req.params;

      this.logger.info(`Getting flag details: ${flagId}`);

      const details = await this.service.getFlagDetails(flagId);

      res.json({
        success: true,
        data: details,
      });
    } catch (error) {
      this.logger.error(`Failed to get flag details: ${error.message}`);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /admin/rules/flags/:flagId/acknowledge
   * Acknowledge a flag
   */
  async acknowledgeFlag(req: Request, res: Response): Promise<void> {
    try {
      const { flagId } = req.params;
      const { adminUserId, notes } = req.body;

      if (!adminUserId) {
        res.status(400).json({
          success: false,
          error: 'adminUserId is required',
        });
        return;
      }

      this.logger.info(`Acknowledging flag: ${flagId} by admin: ${adminUserId}`);

      const acknowledgment = await this.service.acknowledgeFlag(flagId, adminUserId, notes);

      res.json({
        success: true,
        data: acknowledgment,
      });
    } catch (error) {
      this.logger.error(`Failed to acknowledge flag: ${error.message}`);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /admin/rules/flags/:flagId/override
   * Override a flag
   */
  async overrideFlag(req: Request, res: Response): Promise<void> {
    try {
      const { flagId } = req.params;
      const { adminUserId, action, reason, requiresApproval } = req.body;

      if (!adminUserId) {
        res.status(400).json({
          success: false,
          error: 'adminUserId is required',
        });
        return;
      }

      if (!action) {
        res.status(400).json({
          success: false,
          error: 'action is required',
        });
        return;
      }

      if (!Object.values(OverrideAction).includes(action as OverrideAction)) {
        res.status(400).json({
          success: false,
          error: `Invalid action: ${action}`,
        });
        return;
      }

      if (!reason) {
        res.status(400).json({
          success: false,
          error: 'reason is required',
        });
        return;
      }

      this.logger.info(
        `Overriding flag: ${flagId} by admin: ${adminUserId} with action: ${action}`
      );

      const override = await this.service.overrideFlag(
        flagId,
        adminUserId,
        action as OverrideAction,
        reason,
        requiresApproval || false
      );

      res.json({
        success: true,
        data: override,
      });
    } catch (error) {
      this.logger.error(`Failed to override flag: ${error.message}`);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /admin/rules/overrides/:overrideId/approve
   * Approve an override
   */
  async approveOverride(req: Request, res: Response): Promise<void> {
    try {
      const { overrideId } = req.params;
      const { adminUserId } = req.body;

      if (!adminUserId) {
        res.status(400).json({
          success: false,
          error: 'adminUserId is required',
        });
        return;
      }

      this.logger.info(`Approving override: ${overrideId} by admin: ${adminUserId}`);

      const override = await this.service.approveOverride(overrideId, adminUserId);

      res.json({
        success: true,
        data: override,
      });
    } catch (error) {
      this.logger.error(`Failed to approve override: ${error.message}`);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * POST /admin/rules/flags/:flagId/resolve
   * Resolve a flag
   */
  async resolveFlag(req: Request, res: Response): Promise<void> {
    try {
      const { flagId } = req.params;
      const { adminUserId } = req.body;

      if (!adminUserId) {
        res.status(400).json({
          success: false,
          error: 'adminUserId is required',
        });
        return;
      }

      this.logger.info(`Resolving flag: ${flagId} by admin: ${adminUserId}`);

      const flag = await this.service.resolveFlag(flagId, adminUserId);

      res.json({
        success: true,
        data: flag,
      });
    } catch (error) {
      this.logger.error(`Failed to resolve flag: ${error.message}`);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/rules/audit-logs/:flagId
   * Get audit logs for a flag
   */
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { flagId } = req.params;

      this.logger.info(`Getting audit logs for flag: ${flagId}`);

      const logs = await this.service.getAuditLogs(flagId);

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      this.logger.error(`Failed to get audit logs: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/rules/statistics
   * Get statistics
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const timeWindowMinutes = parseInt(req.query.timeWindow as string) || 1440;

      this.logger.info(`Getting statistics (time window: ${timeWindowMinutes} minutes)`);

      const stats = await this.service.getStatistics(timeWindowMinutes);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      this.logger.error(`Failed to get statistics: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}
