import { Router } from 'express';
import { MatchController } from '../controllers/match.controller';
import {
  getMatchValidator,
  initiatePaymentValidator,
  uploadProofValidator,
  confirmReceiptValidator,
} from '../validators/match.validator';
import multer from 'multer';
import path from 'path';

const router = Router();
const matchController = new MatchController();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/proofs/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `proof-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
    }
  },
});

/**
 * GET /api/v1/exchange/matches/:id
 * Get match details
 */
router.get('/:id', getMatchValidator, matchController.getMatch);

/**
 * POST /api/v1/exchange/matches/:id/initiate-payment
 * Initiate payment for a match
 */
router.post(
  '/:id/initiate-payment',
  initiatePaymentValidator,
  matchController.initiatePayment
);

/**
 * POST /api/v1/exchange/matches/:id/upload-proof
 * Upload proof of payment
 */
router.post(
  '/:id/upload-proof',
  upload.single('proof'),
  uploadProofValidator,
  matchController.uploadProof
);

/**
 * POST /api/v1/exchange/matches/:id/confirm-receipt
 * Confirm receipt of payment
 */
router.post(
  '/:id/confirm-receipt',
  confirmReceiptValidator,
  matchController.confirmReceipt
);

export default router;
