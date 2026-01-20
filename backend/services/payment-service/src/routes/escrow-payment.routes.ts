/**
 * Escrow Payment Routes
 * Defines API endpoints for escrow-first payment flow
 */

import { Router } from 'express';
import { EscrowPaymentController } from '../controllers/escrow-payment.controller';

const router = Router();
const escrowPaymentController = new EscrowPaymentController();

// Escrow Payment Flow Routes
router.post('/create', escrowPaymentController.createEscrowPayment.bind(escrowPaymentController));
router.post('/capture', escrowPaymentController.captureToEscrow.bind(escrowPaymentController));
router.get('/state/:orderId', escrowPaymentController.getPaymentState.bind(escrowPaymentController));
router.get('/providers', escrowPaymentController.getAvailableProviders.bind(escrowPaymentController));

// Dispute Handling
router.post('/dispute', escrowPaymentController.handleDispute.bind(escrowPaymentController));

// Control Center Only Routes (should be protected by middleware)
router.post('/release', escrowPaymentController.releaseEscrowFunds.bind(escrowPaymentController));
router.post('/refund', escrowPaymentController.refundToBuyer.bind(escrowPaymentController));

export default router;
