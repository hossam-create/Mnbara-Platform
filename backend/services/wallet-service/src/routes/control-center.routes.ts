// ============================================================
// PHASE 4.1 — Control Center Routes
// READ-ONLY endpoints for admin finance dashboard
// ============================================================

import { Router } from 'express';
import { controlCenterController, controlCenterErrorHandler } from '../controllers/control-center.controller';

const router = Router();

// ============================================================
// ADMIN AUTH GUARD (Placeholder)
// In production, verify admin role
// ============================================================

const adminGuard = (req: any, res: any, next: any) => {
  // Extract user from headers (set by API gateway after JWT verification)
  req.user = {
    id: req.headers['x-user-id'] || 'admin',
    role: req.headers['x-user-role'] || 'user',
  };

  // Verify admin role
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Admin access required',
      message: 'You do not have permission to access this resource'
    });
  }

  next();
};

// ============================================================
// READ-ONLY ROUTES
// No POST, PUT, PATCH, or DELETE
// ============================================================

/**
 * @route   GET /api/v2/control-center/wallets
 * @desc    List all wallets with filters
 * @access  Admin only
 * @query   ownerType - USER | SELLER | TRAVELER | SYSTEM
 * @query   status - ACTIVE | FROZEN | CLOSED
 * @query   currency - EGP | USD | etc.
 * @query   search - Search by owner_id
 * @query   limit - Page size (default: 20, max: 100)
 * @query   offset - Page offset
 */
router.get('/wallets', adminGuard, controlCenterController.listWallets);

/**
 * @route   GET /api/v2/control-center/wallets/:id/snapshot
 * @desc    Get detailed wallet snapshot
 * @access  Admin only
 * @params  id - Wallet UUID
 */
router.get('/wallets/:id/snapshot', adminGuard, controlCenterController.getWalletSnapshot);

/**
 * @route   GET /api/v2/control-center/ledger
 * @desc    Get system-wide ledger audit trail
 * @access  Admin only
 * @query   walletId - Filter by specific wallet
 * @query   ownerType - Filter by owner type
 * @query   entryType - CREDIT | DEBIT
 * @query   reason - DEPOSIT | WITHDRAWAL | etc.
 * @query   referenceType - ORDER | ESCROW | etc.
 * @query   referenceId - Filter by reference
 * @query   fromDate - Start date (ISO string)
 * @query   toDate - End date (ISO string)
 * @query   limit - Page size (default: 50, max: 100)
 * @query   offset - Page offset
 */
router.get('/ledger', adminGuard, controlCenterController.getLedgerTrail);

/**
 * @route   GET /api/v2/control-center/totals
 * @desc    Get system total balances per currency
 * @access  Admin only
 * @returns Aggregate balances by currency and owner type
 */
router.get('/totals', adminGuard, controlCenterController.getSystemTotals);

/**
 * @route   GET /api/v2/control-center/daily-summary
 * @desc    Get daily transaction summary for charts
 * @access  Admin only
 * @query   days - Number of days to include (default: 30)
 */
router.get('/daily-summary', adminGuard, controlCenterController.getDailySummary);

/**
 * @route   GET /api/v2/control-center/escrows
 * @desc    List escrows with filters
 */
router.get('/escrows', adminGuard, controlCenterController.listEscrows);

/**
 * @route   GET /api/v2/control-center/escrows/totals
 * @desc    System-wide escrow totals
 */
router.get('/escrows/totals', adminGuard, controlCenterController.getEscrowTotals);

/**
 * @route   GET /api/v2/control-center/escrows/:id
 * @desc    Get detailed escrow info
 */
router.get('/escrows/:id', adminGuard, controlCenterController.getEscrowDetails);

/**
 * @route   GET /api/v2/control-center/escrow/exposure/:id
 * @desc    Get wallet escrow exposure report
 */
router.get('/escrow/exposure/:id', adminGuard, controlCenterController.getWalletEscrowExposure);

// ============================================================
// ERROR HANDLER
// ============================================================

router.use(controlCenterErrorHandler);

export default router;
