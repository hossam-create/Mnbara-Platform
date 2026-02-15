/**
 * Admin Dispute Routes
 * 
 * Admin-facing dispute endpoints.
 */

import { Router } from 'express';
import { Pool } from 'pg';
import { AdminDisputeController } from '../controllers/AdminDisputeController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';

export function createAdminDisputeRoutes(db: Pool): Router {
  const router = Router();
  const adminDisputeController = new AdminDisputeController(db);

  // Apply authentication and admin authorization to all routes
  router.use(authenticate);
  router.use(requireAdmin);

  /**
   * GET /api/admin/disputes
   * Get all disputes with filters
   * 
   * Query params:
   * - status: DisputeStatus (optional)
   * - reason: DisputeReason (optional)
   * - dateFrom: string (ISO date, optional)
   * - dateTo: string (ISO date, optional)
   * - search: string (request ID or user name, optional)
   * - limit: number (optional, default: 50)
   * - offset: number (optional, default: 0)
   */
  router.get(
    '/admin/disputes',
    adminDisputeController.getAllDisputes
  );

  /**
   * GET /api/admin/disputes/stats
   * Get dispute statistics
   * 
   * Note: This route must come before /:id to avoid route conflicts
   */
  router.get(
    '/admin/disputes/stats',
    adminDisputeController.getDisputeStats
  );

  /**
   * GET /api/admin/disputes/:id
   * Get dispute details with full information
   */
  router.get(
    '/admin/disputes/:id',
    adminDisputeController.getDisputeDetails
  );

  /**
   * POST /api/admin/disputes/:id/review
   * Mark dispute as under review
   */
  router.post(
    '/admin/disputes/:id/review',
    adminDisputeController.markUnderReview
  );

  /**
   * POST /api/admin/disputes/:id/resolve
   * Resolve a dispute
   * 
   * Body:
   * - resolution: DisputeResolution (required)
   * - percentage: number (required for PARTIAL_REFUND, 0-100)
   * - notes: string (optional)
   */
  router.post(
    '/admin/disputes/:id/resolve',
    adminDisputeController.resolveDispute
  );

  return router;
}
