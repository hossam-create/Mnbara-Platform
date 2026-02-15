import { Router } from 'express';
import { AdminExchangeController } from '../controllers/admin-exchange.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import {
  getAdminRequestsValidator,
  verifyProofValidator,
  retrySettlementValidator,
  freezeDepositValidator,
} from '../validators/admin.validator';

const router = Router();
const adminExchangeController = new AdminExchangeController();

/**
 * Apply admin authentication middleware to all routes
 */
router.use(requireAdmin);

/**
 * GET /api/v1/admin/exchange/requests
 * Get all exchange requests (admin)
 */
router.get('/requests', getAdminRequestsValidator, adminExchangeController.getAllRequests);

/**
 * GET /api/v1/admin/exchange/proofs/pending
 * Get pending proofs for review (admin)
 */
router.get('/proofs/pending', adminExchangeController.getPendingProofs);

/**
 * POST /api/v1/admin/exchange/proofs/:id/verify
 * Verify proof of payment (admin)
 */
router.post('/proofs/:id/verify', verifyProofValidator, adminExchangeController.verifyProof);

/**
 * POST /api/v1/admin/exchange/settlements/:id/retry
 * Retry failed settlement (admin)
 */
router.post(
  '/settlements/:id/retry',
  retrySettlementValidator,
  adminExchangeController.retrySettlement
);

/**
 * POST /api/v1/admin/exchange/security-deposit/:userId/freeze
 * Freeze user's security deposit (admin)
 */
router.post(
  '/security-deposit/:userId/freeze',
  freezeDepositValidator,
  adminExchangeController.freezeSecurityDeposit
);

export default router;
