// ============================================================
// PHASE 5.2 — Auction Dispute Routes (extends auction routes)
// ============================================================

import { Router } from 'express';
import { disputeController } from '../controllers/dispute.controller';

const router = Router();

// ============================================================
// AUCTION-LEVEL DISPUTE OPERATIONS
// ============================================================

// Get disputes for an auction
router.get('/:auctionId/disputes', disputeController.getDisputesForAuction);

// Validate settlement (used by settlement engine)
router.get('/:auctionId/settlement-validation', disputeController.validateSettlement);

export default router;
