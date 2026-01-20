/**
 * Admin Rule Results Routes
 * Exposes rule flags to admin UI
 */

import { Router } from 'express';
import { AdminRuleResultsController } from '../controllers/admin-rule-results.controller';
import { AdminRuleResultsService } from '../services/admin-rule-results.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Create admin rule results routes
 * 
 * @param prisma - Prisma service
 * @returns Express router
 */
export function createAdminRuleResultsRoutes(prisma: PrismaService): Router {
  const router = Router();
  const service = new AdminRuleResultsService(prisma);
  const controller = new AdminRuleResultsController(service);

  /**
   * GET /admin/rules/flags
   * Get all pending flags
   */
  router.get('/flags', (req, res) => controller.getPendingFlags(req, res));

  /**
   * GET /admin/rules/flags/user/:userId
   * Get flags for a user
   */
  router.get('/flags/user/:userId', (req, res) => controller.getUserFlags(req, res));

  /**
   * GET /admin/rules/flags/auction/:auctionId
   * Get flags for an auction
   */
  router.get('/flags/auction/:auctionId', (req, res) => controller.getAuctionFlags(req, res));

  /**
   * GET /admin/rules/flags/status/:status
   * Get flags by status
   */
  router.get('/flags/status/:status', (req, res) => controller.getFlagsByStatus(req, res));

  /**
   * GET /admin/rules/flags/severity/:severity
   * Get flags by severity
   */
  router.get('/flags/severity/:severity', (req, res) => controller.getFlagsBySeverity(req, res));

  /**
   * GET /admin/rules/flags/:flagId
   * Get flag details
   */
  router.get('/flags/:flagId', (req, res) => controller.getFlagDetails(req, res));

  /**
   * POST /admin/rules/flags/:flagId/acknowledge
   * Acknowledge a flag
   */
  router.post('/flags/:flagId/acknowledge', (req, res) => controller.acknowledgeFlag(req, res));

  /**
   * POST /admin/rules/flags/:flagId/override
   * Override a flag
   */
  router.post('/flags/:flagId/override', (req, res) => controller.overrideFlag(req, res));

  /**
   * POST /admin/rules/overrides/:overrideId/approve
   * Approve an override
   */
  router.post('/overrides/:overrideId/approve', (req, res) => controller.approveOverride(req, res));

  /**
   * POST /admin/rules/flags/:flagId/resolve
   * Resolve a flag
   */
  router.post('/flags/:flagId/resolve', (req, res) => controller.resolveFlag(req, res));

  /**
   * GET /admin/rules/audit-logs/:flagId
   * Get audit logs for a flag
   */
  router.get('/audit-logs/:flagId', (req, res) => controller.getAuditLogs(req, res));

  /**
   * GET /admin/rules/statistics
   * Get statistics
   */
  router.get('/statistics', (req, res) => controller.getStatistics(req, res));

  return router;
}
