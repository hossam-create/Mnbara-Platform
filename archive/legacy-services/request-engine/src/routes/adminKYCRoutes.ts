import { Router } from 'express';
import { AdminKYCController } from '../controllers/AdminKYCController';
import { KYCService } from '../services/KYCService';
import { Pool } from 'pg';
import { FileStorageService } from '../services/storage/FileStorageService';

export function createAdminKYCRoutes(db: Pool, storageService: FileStorageService): Router {
  const router = Router();
  const kycService = new KYCService(db, storageService);
  const adminKYCController = new AdminKYCController(kycService);

  // Get pending verifications
  router.get('/verifications/pending', adminKYCController.getPendingVerifications);

  // Get user's verification documents
  router.get('/verifications/users/:userId/documents', adminKYCController.getUserDocuments);

  // Get user verification status
  router.get('/verifications/users/:userId/status', adminKYCController.getUserStatus);

  // Approve verification
  router.post('/verifications/:id/approve', adminKYCController.approveVerification);

  // Reject verification
  router.post('/verifications/:id/reject', adminKYCController.rejectVerification);

  return router;
}
