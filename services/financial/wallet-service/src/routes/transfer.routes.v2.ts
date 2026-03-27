// ============================================================
// PHASE 4.1 — Transfer Routes
// Atomic wallet-to-wallet transfer
// ============================================================

import { Router } from 'express';
import { transferController, transferErrorHandler } from '../controllers/transfer.controller.v2';

const router = Router();

// ============================================================
// PLACEHOLDER AUTH GUARD
// ============================================================

const authGuard = (req: any, res: any, next: any) => {
  req.user = {
    id: req.headers['x-user-id'] || 'system',
    role: req.headers['x-user-role'] || 'user',
  };
  next();
};

// ============================================================
// ROUTES
// ============================================================

/**
 * @route   POST /api/v2/transfer
 * @desc    Transfer funds between wallets atomically
 * @access  Protected
 * @body    {
 *            fromWalletId: string,
 *            toWalletId: string,
 *            amount: number (major units),
 *            reason: LedgerReason,
 *            referenceType: ReferenceType,
 *            referenceId?: string,
 *            description?: string,
 *            requestId?: string (idempotency)
 *          }
 * 
 * USE CASES:
 * - Buyer → System (escrow hold)
 * - System → Seller (payout)
 * - Manual admin adjustment
 */
router.post('/', authGuard, transferController.transferFunds);

// ============================================================
// ERROR HANDLER
// ============================================================

router.use(transferErrorHandler);

export default router;
