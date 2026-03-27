// ============================================================
// PHASE 5.3 — Reserve Price Routes
// ============================================================

import { Router } from 'express';
import { reservePriceController } from '../controllers/reserve-price.controller';

const router = Router();

// ============================================================
// RESERVE PRICE MANAGEMENT
// ============================================================

// Set reserve price (DRAFT state only)
router.post('/:auctionId/reserve-price', reservePriceController.setReservePrice);

// Get settlement outcome
router.get('/:auctionId/settlement-outcome', reservePriceController.getSettlementOutcome);

// Get escrow release logs
router.get('/:auctionId/escrow-releases', reservePriceController.getEscrowReleaseLogs);

// Restart auction (ENDED_UNMET_RESERVE only)
router.post('/:auctionId/restart', reservePriceController.restartAuction);

// Verify no reserve leaks (security audit)
router.get('/:auctionId/verify-security', reservePriceController.verifyNoReserveLeaks);

export default router;
