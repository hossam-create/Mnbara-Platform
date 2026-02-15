// ============================================
// Admin Dispute Routes
// Admin-facing dispute management endpoints
// ============================================

import { Router } from 'express';
import {
  getAllDisputes,
  getDisputeDetails,
  markUnderReview,
  resolveDispute,
  getDisputeStats,
  closeDispute
} from '../controllers/AdminDisputeController';

const router = Router();

// GET /api/admin/disputes - Get all disputes with filtering
router.get('/disputes', getAllDisputes);

// GET /api/admin/disputes/stats - Get dispute statistics
router.get('/disputes/stats', getDisputeStats);

// GET /api/admin/disputes/:id - Get dispute details for admin
router.get('/disputes/:id', getDisputeDetails);

// POST /api/admin/disputes/:id/review - Mark dispute as under review
router.post('/disputes/:id/review', markUnderReview);

// POST /api/admin/disputes/:id/resolve - Resolve a dispute
router.post('/disputes/:id/resolve', resolveDispute);

// POST /api/admin/disputes/:id/close - Close a resolved dispute
router.post('/disputes/:id/close', closeDispute);

export default router;
