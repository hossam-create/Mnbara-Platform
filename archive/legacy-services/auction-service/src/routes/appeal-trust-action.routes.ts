// ============================================================
// PHASE 6.3 — Appeal Trust Action Routes
//
// User and Admin endpoints for appeals workflow
// ============================================================

import { Router } from 'express';
import { appealTrustActionController } from '../controllers/appeal-trust-action.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';

const router = Router();

// ============================================================
// USER ENDPOINTS (Authenticated)
// ============================================================

/**
 * POST /api/v1/appeals
 * User submits appeal for trust action
 */
router.post('/api/v1/appeals', authMiddleware, (req, res) =>
  appealTrustActionController.submitAppeal(req, res)
);

/**
 * GET /api/v1/appeals/:appealId
 * Get appeal details (user can see their own appeals)
 */
router.get('/api/v1/appeals/:appealId', authMiddleware, (req, res) =>
  appealTrustActionController.getAppeal(req, res)
);

/**
 * GET /api/v1/appeals
 * Get user's appeals
 */
router.get('/api/v1/appeals', authMiddleware, (req, res) =>
  appealTrustActionController.getUserAppeals(req, res)
);

// ============================================================
// ADMIN / CONTROL CENTER ENDPOINTS (Admin Only)
// ============================================================

/**
 * GET /admin/control-center/appeals/pending
 * Get pending appeals (admin only)
 */
router.get('/admin/control-center/appeals/pending', authMiddleware, adminMiddleware, (req, res) =>
  appealTrustActionController.getPendingAppeals(req, res)
);

/**
 * GET /admin/control-center/appeals/:appealId
 * Get appeal details (admin only)
 */
router.get('/admin/control-center/appeals/:appealId', authMiddleware, adminMiddleware, (req, res) =>
  appealTrustActionController.getAppealAdmin(req, res)
);

/**
 * POST /admin/control-center/appeals/:appealId/assign
 * Assign reviewer to appeal (admin only)
 */
router.post(
  '/admin/control-center/appeals/:appealId/assign',
  authMiddleware,
  adminMiddleware,
  (req, res) => appealTrustActionController.assignReviewer(req, res)
);

/**
 * POST /admin/control-center/appeals/:appealId/approve
 * Approve appeal and create reversal action (admin only, dual approval required)
 */
router.post(
  '/admin/control-center/appeals/:appealId/approve',
  authMiddleware,
  adminMiddleware,
  (req, res) => appealTrustActionController.approveAppeal(req, res)
);

/**
 * POST /admin/control-center/appeals/:appealId/reject
 * Reject appeal (admin only)
 */
router.post(
  '/admin/control-center/appeals/:appealId/reject',
  authMiddleware,
  adminMiddleware,
  (req, res) => appealTrustActionController.rejectAppeal(req, res)
);

/**
 * GET /admin/control-center/appeals/:appealId/timeline
 * Get appeal timeline (admin only)
 */
router.get(
  '/admin/control-center/appeals/:appealId/timeline',
  authMiddleware,
  adminMiddleware,
  (req, res) => appealTrustActionController.getAppealTimeline(req, res)
);

/**
 * GET /admin/control-center/appeals
 * Get all appeals history (admin only)
 */
router.get('/admin/control-center/appeals', authMiddleware, adminMiddleware, (req, res) =>
  appealTrustActionController.getAppealHistory(req, res)
);

export default router;
