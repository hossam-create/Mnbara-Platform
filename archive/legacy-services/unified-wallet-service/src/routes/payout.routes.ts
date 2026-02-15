import { Router } from 'express';
import { PayoutController } from '../controllers/payout.controller';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();
const payoutController = new PayoutController();

/**
 * All routes require authentication
 */
router.use(requireAuth);

/**
 * POST /api/payouts/request
 * Create a new payout request
 */
router.post('/request', payoutController.createPayoutRequest.bind(payoutController));

/**
 * GET /api/payouts/my-requests
 * Get user's payout request history
 */
router.get('/my-requests', payoutController.getMyPayoutRequests.bind(payoutController));

/**
 * GET /api/payouts/:id
 * Get a specific payout request
 */
router.get('/:id', payoutController.getPayoutRequest.bind(payoutController));

/**
 * POST /api/payouts/:id/process
 * Process a payout request (admin only)
 */
router.post('/:id/process', requireAdmin, payoutController.processPayout.bind(payoutController));

export default router;