// ============================================================
// PHASE 5.2 — Bid Dispute Routes (extends bid routes)
// ============================================================

import { Router } from 'express';
import { disputeController } from '../controllers/dispute.controller';

const router = Router();

// ============================================================
// BID INVALIDATION & ESCROW PREVIEW
// ============================================================

// Get escrow impact preview before invalidation (Control Center)
router.get('/:bidId/escrow-impact', disputeController.getEscrowImpactPreview);

// Get invalidation history for a bid
router.get('/:bidId/invalidation-history', disputeController.getInvalidationHistory);

// Invalidate bid (Admin BEFORE settlement only)
router.post('/:bidId/invalidate', disputeController.invalidateBid);

export default router;
