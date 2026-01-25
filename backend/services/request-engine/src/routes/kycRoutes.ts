import { Router } from 'express';
import { KYCController } from '../controllers/KYCController';
import { KYCService } from '../services/KYCService';
import { upload } from '../middleware/upload';
import { Pool } from 'pg';
import { FileStorageService } from '../services/storage/FileStorageService';

export function createKYCRoutes(db: Pool, storageService: FileStorageService): Router {
  const router = Router();
  const kycService = new KYCService(db, storageService);
  const kycController = new KYCController(kycService);

  // Get verification status
  router.get('/status', kycController.getStatus);

  // Get user's documents
  router.get('/documents', kycController.getDocuments);

  // Upload ID document
  router.post(
    '/upload-id',
    upload.fields([
      { name: 'frontImage', maxCount: 1 },
      { name: 'backImage', maxCount: 1 },
    ]),
    kycController.uploadId
  );

  // Phone verification
  router.post('/verify-phone', kycController.verifyPhone);
  router.post('/confirm-phone', kycController.confirmPhone);

  // Email verification
  router.post('/verify-email', kycController.verifyEmail);
  router.get('/confirm-email/:token', kycController.confirmEmail);

  // Get upgrade information
  router.get('/upgrade', kycController.getUpgrade);

  return router;
}
