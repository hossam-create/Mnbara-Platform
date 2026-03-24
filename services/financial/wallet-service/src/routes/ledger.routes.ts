// ============================================================
// PHASE 4.1 — Ledger Routes
// APPEND-ONLY: Only POST endpoints, no UPDATE/DELETE
// ============================================================

import { Router } from 'express';
import { ledgerController, ledgerErrorHandler } from '../controllers/ledger.controller';

const router = Router();

// ============================================================
// PLACEHOLDER AUTH GUARD
// Replace with actual auth middleware in production
// ============================================================

const authGuard = (req: any, res: any, next: any) => {
  // Extract user from headers (set by API gateway after JWT verification)
  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role'];

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Missing user authentication headers'
    });
  }

  req.user = {
    id: userId,
    role: userRole || 'user',
  };

  next();
};

// ============================================================
// ROUTES — APPEND-ONLY OPERATIONS
// ============================================================

/**
 * @route   POST /api/v2/ledger/credit
 * @desc    Credit (add funds to) a wallet
 * @access  Protected
 * @body    {
 *            walletId: string,
 *            amount: number (major units, e.g., 10.50),
 *            reason: "DEPOSIT" | "REFUND" | "PAYOUT" | "TRANSFER_IN" | "ADJUSTMENT",
 *            referenceType: "ORDER" | "ESCROW" | "TRANSFER" | "MANUAL" | "SYSTEM",
 *            referenceId?: string,
 *            description?: string,
 *            requestId?: string (idempotency key)
 *          }
 * @header  X-Request-Id: Optional idempotency key
 */
router.post('/credit', authGuard, ledgerController.creditWallet);

/**
 * @route   POST /api/v2/ledger/debit
 * @desc    Debit (remove funds from) a wallet
 * @access  Protected
 * @body    {
 *            walletId: string,
 *            amount: number (major units, e.g., 10.50),
 *            reason: "WITHDRAWAL" | "PURCHASE_HOLD" | "FEE" | "TRANSFER_OUT" | "ADJUSTMENT",
 *            referenceType: "ORDER" | "ESCROW" | "TRANSFER" | "MANUAL" | "SYSTEM",
 *            referenceId?: string,
 *            description?: string,
 *            requestId?: string (idempotency key)
 *          }
 * @header  X-Request-Id: Optional idempotency key
 */
router.post('/debit', authGuard, ledgerController.debitWallet);

// ============================================================
// SECURITY: NO UPDATE OR DELETE ROUTES
// Ledger is append-only by design
// ============================================================

// ============================================================
// ERROR HANDLER
// ============================================================

router.use(ledgerErrorHandler);

export default router;
