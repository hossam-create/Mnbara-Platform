// ============================================================
// PHASE 5.5 — Appeals Window Routes
// ============================================================

import { Router } from 'express';
import * as appealsController from '../controllers/appeals-window.controller';

const router = Router();

// ============================================================
// BIDDER/SELLER ENDPOINTS
// ============================================================

// Submit appeal during appeals window
router.post('/submit', appealsController.submitAppeal);

// Get appeal details
router.get('/:appealId', appealsController.getAppeal);

// Get appeals for auction
router.get('/auction/:auctionId', appealsController.getAppealsForAuction);

// Get appeals window config
router.get('/window/:auctionId', appealsController.getAppealWindowConfig);

// Check settlement finality
router.get('/:auctionId/finality', appealsController.checkSettlementFinality);

// ============================================================
// ADMIN ENDPOINTS
// ============================================================

// Resolve appeal (admin only)
router.post('/:appealId/resolve', appealsController.resolveAppeal);

// Finalize settlement (after window closes)
router.post('/:auctionId/finalize', appealsController.finalizeSettlement);

// Admin override (dual approval required)
router.post('/:auctionId/override', appealsController.adminOverride);

// Get override history
router.get('/:auctionId/overrides', appealsController.getOverrideHistory);

// Get all open appeals (control center)
router.get('/admin/open', appealsController.getAllOpenAppeals);

export default router;
