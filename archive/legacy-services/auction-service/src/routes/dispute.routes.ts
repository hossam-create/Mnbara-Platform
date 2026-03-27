// ============================================================
// PHASE 5.2 — Dispute Routes
// ============================================================

import { Router } from 'express';
import { disputeController } from '../controllers/dispute.controller';

const router = Router();

// ============================================================
// DISPUTE MANAGEMENT
// ============================================================

// Get all open disputes (Admin/Control Center)
router.get('/open', disputeController.getAllOpenDisputes);

// Get specific dispute
router.get('/:disputeId', disputeController.getDispute);

// Create dispute (System rules or Admin)
router.post('/', disputeController.createDispute);

// Resolve dispute (Admin with role-based access)
router.post('/:disputeId/resolve', disputeController.resolveDispute);

export default router;
