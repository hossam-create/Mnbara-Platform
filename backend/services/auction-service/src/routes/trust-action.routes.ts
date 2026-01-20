// ============================================================
// PHASE 6.2 — Trust Action Routes
// ============================================================

import { Router } from 'express';
import {
  verifyAdmin,
  executeTrustAction,
  evaluateTrustAction,
  getActiveTrustActions,
  getUserTrustActions,
  getTrustActionDetails,
  liftTrustAction,
  revertTrustAction,
  manualFlagUser,
} from '../controllers/trust-action.controller';

const router = Router();

// ============================================================
// ADMIN / CONTROL CENTER ROUTES (Backend Only)
// ============================================================

// Execute trust action
router.post(
  '/admin/control-center/trust-actions/execute',
  verifyAdmin,
  executeTrustAction
);

// Evaluate user for trust actions
router.post(
  '/admin/control-center/trust-actions/evaluate',
  verifyAdmin,
  evaluateTrustAction
);

// Get all active trust actions
router.get(
  '/admin/control-center/trust-actions/active',
  verifyAdmin,
  getActiveTrustActions
);

// Get trust actions for user
router.get(
  '/admin/control-center/trust-actions/user/:userId',
  verifyAdmin,
  getUserTrustActions
);

// Get trust action details
router.get(
  '/admin/control-center/trust-actions/:actionId',
  verifyAdmin,
  getTrustActionDetails
);

// Lift trust action
router.post(
  '/admin/control-center/trust-actions/:actionId/lift',
  verifyAdmin,
  liftTrustAction
);

// Revert trust action
router.post(
  '/admin/control-center/trust-actions/:actionId/revert',
  verifyAdmin,
  revertTrustAction
);

// Manually flag user
router.post(
  '/admin/control-center/trust-actions/manual-flag',
  verifyAdmin,
  manualFlagUser
);

export default router;
