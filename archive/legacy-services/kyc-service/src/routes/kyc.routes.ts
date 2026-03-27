/**
 * KYC Routes
 */

import { Router } from 'express';
import multer from 'multer';
import { KYCController } from '../controllers/kyc.controller';

const router = Router();
const controller = new KYCController();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  },
});

// User endpoints
router.post(
  '/submit',
  upload.fields([
    { name: 'idPhoto', maxCount: 1 },
    { name: 'selfiePhoto', maxCount: 1 },
  ]),
  controller.submit.bind(controller),
);

router.get('/status', controller.getStatus.bind(controller));

export default router;
