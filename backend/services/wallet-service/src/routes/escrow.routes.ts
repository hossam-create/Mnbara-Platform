// ============================================================
// PHASE 4.2 — Escrow Routes
// API endpoints for atomic escrow operations
// ============================================================

import { Router } from 'express';
import { escrowController } from '../controllers/escrow.controller';
import { controlCenterErrorHandler } from '../controllers/control-center.controller';

const router = Router();

// ============================================================
// ROUTES
// ============================================================

/**
 * @route   POST /api/v2/escrow
 * @desc    Create a new escrow agreement (no funds moved)
 */
router.post('/', escrowController.create);

/**
 * @route   POST /api/v2/escrow/create-held
 * @desc    Atomic Create + Fund (Buy Now)
 */
router.post('/create-held', escrowController.createAndFund);

/**
 * @route   POST /api/v2/escrow/:id/fund
 * @desc    Fund escrow (Buyer -> System)
 */
router.post('/:id/fund', escrowController.fund);

/**
 * @route   POST /api/v2/escrow/:id/release
 * @desc    Release funds (System -> Seller)
 */
router.post('/:id/release', escrowController.release);

/**
 * @route   POST /api/v2/escrow/:id/refund
 * @desc    Refund buyer (System -> Buyer)
 */
router.post('/:id/refund', escrowController.refund);

/**
 * @route   POST /api/v2/escrow/:id/dispute
 * @desc    Open a dispute
 */
router.post('/:id/dispute', escrowController.dispute);

/**
 * @route   GET /api/v2/escrow/:id
 * @desc    Get escrow details
 */
router.get('/:id', escrowController.get);

// Reuse the error handler from control center as it's generic enough
router.use(controlCenterErrorHandler);

export default router;
