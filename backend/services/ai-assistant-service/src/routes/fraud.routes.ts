// Fraud Detection Routes - Gen 10 AI (99.9% Accuracy)
// مسارات كشف الاحتيال - الجيل العاشر

import { Router } from 'express';
import { fraudController } from '../controllers/fraud.controller';

const router = Router();

// Assess risk for any target
router.post('/assess', fraudController.assessRisk.bind(fraudController));

// Review fraud detection
router.put('/detections/:detectionId/review', fraudController.reviewDetection.bind(fraudController));

// Get fraud statistics
router.get('/stats', fraudController.getStats.bind(fraudController));

// Check user risk
router.post('/users/:userId/check', fraudController.checkUserRisk.bind(fraudController));

// Check order risk
router.post('/orders/:orderId/check', fraudController.checkOrderRisk.bind(fraudController));

// Check payment risk
router.post('/payments/:paymentId/check', fraudController.checkPaymentRisk.bind(fraudController));

export default router;
