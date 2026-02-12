// ============================================
// Dispute Routes
// User-facing dispute endpoints
// ============================================

import { Router } from 'express';
import {
  openDispute,
  getMyDisputes,
  getDisputeById,
  addEvidence
} from '../controllers/DisputeController';
import { uploadMiddleware } from '../middleware/upload';

const router = Router();

// POST /api/requests/:id/dispute - Open a new dispute
router.post('/requests/:id/dispute', uploadMiddleware.array('evidence', 10), openDispute);

// GET /api/disputes/my-disputes - Get current user's disputes
router.get('/disputes/my-disputes', getMyDisputes);

// GET /api/disputes/:id - Get a specific dispute
router.get('/disputes/:id', getDisputeById);

// POST /api/disputes/:id/add-evidence - Add evidence to a dispute
router.post('/disputes/:id/add-evidence', uploadMiddleware.array('evidence', 10), addEvidence);

export default router;
