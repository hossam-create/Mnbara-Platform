/**
 * Stripe Connect Routes
 */

import { Router } from 'express';
import { StripeConnectController } from '../controllers/stripe-connect.controller';

const router = Router();
const controller = new StripeConnectController();

// Onboarding
router.post('/onboard', controller.onboard.bind(controller));
router.get('/onboard/refresh', controller.refreshOnboarding.bind(controller));

// Status & Info
router.get('/status', controller.getStatus.bind(controller));
router.get('/balance', controller.getBalance.bind(controller));
router.get('/payouts', controller.listPayouts.bind(controller));
router.get('/dashboard', controller.getDashboardLink.bind(controller));

// Transfers (admin/internal)
router.post('/transfer', controller.createTransfer.bind(controller));

export default router;
