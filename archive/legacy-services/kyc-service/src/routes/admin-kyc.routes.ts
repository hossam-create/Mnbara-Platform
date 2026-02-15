/**
 * Admin KYC Routes
 */

import { Router } from 'express';
import { AdminKYCController } from '../controllers/admin-kyc.controller';

const router = Router();
const controller = new AdminKYCController();

// Admin endpoints
router.get('/pending', controller.getPending.bind(controller));
router.post('/:id/review', controller.review.bind(controller));

export default router;
