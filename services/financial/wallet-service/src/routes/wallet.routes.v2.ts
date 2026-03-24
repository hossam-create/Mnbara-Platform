// ============================================================
// PHASE 4.1 — Wallet Routes (v2)
// REST API routes - READ-ONLY + CREATE
// ============================================================

import { Router } from 'express';
import { walletControllerV2, walletErrorHandler } from '../controllers/wallet.controller.v2';

const router = Router();

// ============================================================
// PLACEHOLDER AUTH GUARD
// Replace with actual auth middleware in production
// ============================================================

const authGuard = (req: any, res: any, next: any) => {
  // TODO: Implement actual authentication
  // For now, extract user from header or set default
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
 * @route   POST /api/v2/wallets
 * @desc    Create a new wallet
 * @access  Protected
 * @body    { ownerType, ownerId, currency? }
 */
router.post('/', authGuard, walletControllerV2.createWallet);

/**
 * @route   GET /api/v2/wallets/owner/:ownerType/:ownerId
 * @desc    Get wallet by owner
 * @access  Protected
 * @params  ownerType - USER | SELLER | TRAVELER | SYSTEM
 * @params  ownerId - Owner identifier
 * @query   currency - Currency code (default: EGP)
 */
router.get('/owner/:ownerType/:ownerId', authGuard, walletControllerV2.getWalletByOwner);

/**
 * @route   GET /api/v2/wallets/:id
 * @desc    Get wallet by ID
 * @access  Protected
 * @params  id - Wallet UUID
 */
router.get('/:id', authGuard, walletControllerV2.getWallet);

/**
 * @route   GET /api/v2/wallets/:id/balance
 * @desc    Get wallet balance (computed from ledger)
 * @access  Protected
 * @params  id - Wallet UUID
 */
router.get('/:id/balance', authGuard, walletControllerV2.getWalletBalance);

/**
 * @route   GET /api/v2/wallets/:id/ledger
 * @desc    List wallet ledger entries
 * @access  Protected
 * @params  id - Wallet UUID
 * @query   entryType - CREDIT | DEBIT
 * @query   reason - DEPOSIT | WITHDRAWAL | PURCHASE_HOLD | etc.
 * @query   referenceType - ORDER | ESCROW | TRANSFER | MANUAL | SYSTEM
 * @query   referenceId - Reference entity ID
 * @query   fromDate - Filter from date (ISO string)
 * @query   toDate - Filter to date (ISO string)
 * @query   limit - Page size (default: 20, max: 100)
 * @query   offset - Page offset (default: 0)
 */
router.get('/:id/ledger', authGuard, walletControllerV2.listLedgerEntries);

/**
 * @route   GET /api/v2/wallets/:id/verify
 * @desc    Verify wallet balance integrity
 * @access  Protected (Admin only in production)
 * @params  id - Wallet UUID
 */
router.get('/:id/verify', authGuard, walletControllerV2.verifyBalance);

// ============================================================
// ERROR HANDLER
// ============================================================

router.use(walletErrorHandler);

export default router;
