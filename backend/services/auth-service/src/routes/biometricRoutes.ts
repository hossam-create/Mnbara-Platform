import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as BiometricController from '../controllers/biometricController';

const router = Router();

// Registration routes
router.get('/register/start', authenticate, BiometricController.startRegistration);
router.post('/register/finish', authenticate, BiometricController.finishRegistration);

// Authentication routes (Step-up or login)
router.get('/login/start', authenticate, BiometricController.startAuthentication);
router.post('/login/finish', authenticate, BiometricController.finishAuthentication);

// KYC Upgrade
router.post('/kyc/upgrade', authenticate, BiometricController.verifyAndUpgradeKYC);

export default router;
