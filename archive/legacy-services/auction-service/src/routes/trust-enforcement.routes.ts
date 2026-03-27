// ============================================================
// PHASE 6.0 — Trust & Safety Enforcement Routes
// ============================================================

import { Router } from 'express';
import {
  verifyTrustSafetyAdmin,
  createEnforcementReview,
  approveEnforcementAction,
  rejectEnforcementAction,
  executeEnforcementAction,
  revertEnforcementAction,
  getEnforcementActions,
  getEnforcementAction,
  evaluatePolicy,
  decideAppeal,
  getOpenAppeals,
  getEnforcementStatus,
  submitAppeal,
  getUserAppeals,
  getAppealWindowInfo,
} from '../controllers/trust-enforcement.controller';

const router = Router();

// ============================================================
// ADMIN ROUTES (Trust & Safety Only)
// ============================================================

// Enforcement Review & Approval
router.post(
  '/admin/enforcement/review',
  verifyTrustSafetyAdmin,
  createEnforcementReview
);

router.post(
  '/admin/enforcement/approve',
  verifyTrustSafetyAdmin,
  approveEnforcementAction
);

router.post(
  '/admin/enforcement/reject',
  verifyTrustSafetyAdmin,
  rejectEnforcementAction
);

// Enforcement Execution & Reversion
router.post(
  '/admin/enforcement/execute',
  verifyTrustSafetyAdmin,
  executeEnforcementAction
);

router.post(
  '/admin/enforcement/revert',
  verifyTrustSafetyAdmin,
  revertEnforcementAction
);

// Enforcement Listing & Details
router.get(
  '/admin/enforcement/actions',
  verifyTrustSafetyAdmin,
  getEnforcementActions
);

router.get(
  '/admin/enforcement/actions/:actionId',
  verifyTrustSafetyAdmin,
  getEnforcementAction
);

// Policy Evaluation
router.post(
  '/admin/enforcement/policy/evaluate',
  verifyTrustSafetyAdmin,
  evaluatePolicy
);

// Appeal Decision
router.post(
  '/admin/appeals/decide',
  verifyTrustSafetyAdmin,
  decideAppeal
);

router.get(
  '/admin/appeals/open',
  verifyTrustSafetyAdmin,
  getOpenAppeals
);

// ============================================================
// USER ROUTES (Authenticated Users)
// ============================================================

// Enforcement Status
router.get(
  '/me/enforcement-status',
  getEnforcementStatus
);

// Appeal Submission & Retrieval
router.post(
  '/me/appeal',
  submitAppeal
);

router.get(
  '/me/appeals',
  getUserAppeals
);

router.get(
  '/me/appeal-window/:actionId',
  getAppealWindowInfo
);

export default router;
