// ============================================================
// PHASE 6.1 — Safeguard Routes
// ============================================================

import { Router } from 'express';
import {
  evaluateSafeguards,
  getUserSafeguards,
  checkUserSafeguard,
  applySafeguardLimit,
  getActiveSafeguards,
  getSafeguardHistory,
  getSafeguardDetails,
  liftSafeguard,
} from '../controllers/safeguard.controller';

const router = Router();

// ============================================================
// INTERNAL ROUTES (System Only)
// ============================================================

router.post(
  '/internal/safeguards/evaluate',
  evaluateSafeguards
);

// ============================================================
// USER ROUTES (Authenticated Users)
// ============================================================

router.get(
  '/me/safeguards',
  getUserSafeguards
);

router.get(
  '/me/safeguards/check/:safeguardType',
  checkUserSafeguard
);

router.get(
  '/me/safeguards/apply/:action',
  applySafeguardLimit
);

// ============================================================
// ADMIN ROUTES (Read-Only)
// ============================================================

router.get(
  '/admin/safeguards/active',
  getActiveSafeguards
);

router.get(
  '/admin/safeguards/history',
  getSafeguardHistory
);

router.get(
  '/admin/safeguards/:activationId',
  getSafeguardDetails
);

router.post(
  '/admin/safeguards/:activationId/lift',
  liftSafeguard
);

export default router;
