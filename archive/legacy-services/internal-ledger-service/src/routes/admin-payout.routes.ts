// ============================================================
// Admin Payout Routes - Admin endpoints for managing payouts
// ============================================================

import { Router } from 'express';
import { adminPayoutController } from '../controllers/admin-payout.controller';
import { authenticateUser } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

/**
 * All routes require authentication and admin role
 */
router.use(authenticateUser);
router.use(requireAdmin);

/**
 * GET /api/admin/payouts/pending
 * Get all pending payout requests
 */
router.get(
  '/pending',
  adminPayoutController.getPendingPayouts.bind(adminPayoutController)
);

/**
 * GET /api/admin/payouts/:id
 * Get payout details with decrypted account information
 */
router.get(
  '/:id',
  adminPayoutController.getPayoutDetails.bind(adminPayoutController)
);

/**
 * POST /api/admin/payouts/:id/approve
 * Approve a payout request
 */
router.post(
  '/:id/approve',
  adminPayoutController.approvePayoutRequest.bind(adminPayoutController)
);

/**
 * POST /api/admin/payouts/:id/reject
 * Reject a payout request
 */
router.post(
  '/:id/reject',
  adminPayoutController.rejectPayoutRequest.bind(adminPayoutController)
);

/**
 * POST /api/admin/payouts/:id/process
 * Mark payout as processing
 */
router.post(
  '/:id/process',
  adminPayoutController.markAsProcessing.bind(adminPayoutController)
);

/**
 * POST /api/admin/payouts/:id/complete
 * Complete a payout request
 */
router.post(
  '/:id/complete',
  adminPayoutController.completePayoutRequest.bind(adminPayoutController)
);

export default router;
