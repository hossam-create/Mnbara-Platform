/**
 * Refund Routes
 * READ-ONLY refund status and chargeback tracking
 * No money movement operations
 */

import { Router } from 'express';
import { refundController } from '../controllers/refund.controller';

const router = Router();

// Get refund status for an order
router.get('/refunds/:orderId', refundController.getRefundStatus.bind(refundController));

// Get chargeback status for an order
router.get('/chargebacks/:orderId', refundController.getChargebackStatus.bind(refundController));

// Submit refund intent (request only, no execution)
router.post('/refunds/intent', refundController.submitRefundIntent.bind(refundController));

export default router;
