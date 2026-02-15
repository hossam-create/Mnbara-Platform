// Fraud Detection Routes - مسارات كشف الاحتيال

import { Router } from 'express';
import { fraudController } from '../controllers/fraud.controller';

const router = Router();

// Transaction Analysis
router.post('/analyze', fraudController.analyzeTransaction);
router.get('/transaction/:transactionId', fraudController.getTransactionRisk);

// User Risk Profile
router.get('/user/:userId/profile', fraudController.getUserRiskProfile);
router.put('/user/:userId/profile', fraudController.updateUserRiskProfile);
router.post('/user/:userId/device', fraudController.addKnownDevice);
router.post('/user/:userId/location', fraudController.addKnownLocation);

// Dashboard & Analytics
router.get('/dashboard', fraudController.getDashboardStats);
router.get('/metrics', fraudController.getMetrics);

export { router as fraudRoutes };
