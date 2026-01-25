/**
 * Dispute Routes
 * 
 * User-facing dispute endpoints.
 */

import { Router } from 'express';
import { Pool } from 'pg';
import { DisputeController } from '../controllers/DisputeController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { rateLimiter } from '../middleware/rateLimiter';

export function createDisputeRoutes(db: Pool): Router {
  const router = Router();
  const disputeController = new DisputeController(db);

  // Apply authentication to all routes
  router.use(authenticate);

  /**
   * POST /api/requests/:id/dispute
   * Open a new dispute for a request
   * 
   * Body (multipart/form-data):
   * - reason: DisputeReason (required)
   * - description: string (required)
   * - evidence: File[] (optional, max 5 files)
   */
  router.post(
    '/requests/:id/dispute',
    rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 disputes per 15 minutes
    upload.array('evidence', 5),
    disputeController.openDispute
  );

  /**
   * GET /api/disputes/my-disputes
   * Get user's disputes
   * 
   * Query params:
   * - status: DisputeStatus (optional)
   * - limit: number (optional, default: 20)
   * - offset: number (optional, default: 0)
   */
  router.get(
    '/disputes/my-disputes',
    disputeController.getMyDisputes
  );

  /**
   * GET /api/disputes/:id
   * Get specific dispute details
   */
  router.get(
    '/disputes/:id',
    disputeController.getDisputeById
  );

  /**
   * POST /api/disputes/:id/add-evidence
   * Add additional evidence to dispute
   * 
   * Body (multipart/form-data):
   * - evidence: File[] (required, max 5 files)
   */
  router.post(
    '/disputes/:id/add-evidence',
    rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 evidence uploads per 15 minutes
    upload.array('evidence', 5),
    disputeController.addEvidence
  );

  return router;
}
