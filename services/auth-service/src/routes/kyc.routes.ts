/**
 * KYC Routes
 * Requirements: 16.1, 16.2, 16.3 - KYC verification endpoints
 */

import { Router } from 'express';
import {
  submitKYC,
  getKYCStatus,
  getMyKYCStatus,
  handleWebhook,
  getPendingSubmissions,
  approveKYC,
  rejectKYC,
  getDocumentTypes,
} from '../controllers/kyc.controller';
import { authenticate } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';

const router = Router();

/**
 * Public routes
 */

// Webhook endpoint (no auth required, uses signature verification)
router.post('/webhook', handleWebhook);

// Get supported document types
router.get('/document-types', getDocumentTypes);

/**
 * Authenticated user routes
 */

// Submit KYC verification
router.post('/submit', authenticate, submitKYC);

// Get current user's KYC status
router.get('/me', authenticate, getMyKYCStatus);

// Get specific submission status
router.get('/status/:submissionId', authenticate, getKYCStatus);

/**
 * Admin routes
 */

// Get pending KYC submissions
router.get(
  '/admin/pending',
  authenticate,
  checkPermission('kyc', 'read'),
  getPendingSubmissions
);

// Approve KYC submission
router.post(
  '/admin/:submissionId/approve',
  authenticate,
  checkPermission('kyc', 'manage'),
  approveKYC
);

// Reject KYC submission
router.post(
  '/admin/:submissionId/reject',
  authenticate,
  checkPermission('kyc', 'manage'),
  rejectKYC
);

export default router;
