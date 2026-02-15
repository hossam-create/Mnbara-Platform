// ============================================================
// Payout Routes - User endpoints
// ============================================================

import { Router } from 'express';
import { payoutController } from '../controllers/payout.controller';
import { authenticateUser } from '../middleware/auth';
import { requireVerification } from '../middleware/verification';
import { require2FA } from '../middleware/2fa';

const router = Router();

/**
 * All routes require authentication
 */
router.use(authenticateUser);

/**
 * POST /api/payouts/request
 * Create a new payout request
 * Requires: verified user, 2FA for amounts > $500
 */
router.post(
  '/request',
  requireVerification,
  require2FA({ amountField: 'amount', threshold: 500 }),
  payoutController.createPayoutRequest.bind(payoutController)
);

/**
 * GET /api/payouts/my-requests
 * Get user's payout request history
 */
router.get(
  '/my-requests',
  payoutController.getMyPayoutRequests.bind(payoutController)
);

/**
 * GET /api/payouts/:id
 * Get a specific payout request
 */
router.get('/:id', payoutController.getPayoutRequest.bind(payoutController));

export default router;
