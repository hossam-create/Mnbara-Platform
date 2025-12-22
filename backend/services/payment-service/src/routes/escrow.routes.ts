import { Router } from 'express';
import { EscrowController } from '../controllers/escrow.controller';

const router = Router();
const escrowController = new EscrowController();

// Create escrow for order
router.post('/create', (req, res) => escrowController.createEscrow(req, res));

// Hold payment
router.post('/:id/hold', (req, res) => escrowController.holdPayment(req, res));

// Release payment to traveler
router.post('/:id/release', (req, res) => escrowController.releasePayment(req, res));

// Refund payment to buyer
router.post('/:id/refund', (req, res) => escrowController.refundPayment(req, res));

// Force release/refund (admin override)
router.post('/:id/force-release', (req, res) => escrowController.forceRelease(req, res));
router.post('/:id/force-refund', (req, res) => escrowController.forceRefund(req, res));

// Delivery proof & receipt
router.post('/:id/proof', (req, res) => escrowController.uploadProof(req, res));
router.post('/:id/receipt', (req, res) => escrowController.uploadReceipt(req, res));
router.post('/:id/confirm-delivery', (req, res) => escrowController.confirmDelivery(req, res));
router.post('/:id/reject-delivery', (req, res) => escrowController.rejectDelivery(req, res));

// Raise dispute
router.post('/:id/dispute', (req, res) => escrowController.raiseDispute(req, res));

// Get escrow status
router.get('/:id/status', (req, res) => escrowController.getStatus(req, res));

// Get escrow by orderId
router.get('/order/:orderId', (req, res) => escrowController.getByOrder(req, res));
router.get('/order/:orderId/receipt', (req, res) => escrowController.getReceiptByOrder(req, res));

// Buyer protection
router.post('/protection/open', (req, res) => escrowController.openProtection(req, res));
router.post('/protection/:id/approve-refund', (req, res) => escrowController.approveProtectionRefund(req, res));
router.post('/protection/:id/approve-release', (req, res) => escrowController.approveProtectionRelease(req, res));
router.post('/protection/:id/reject', (req, res) => escrowController.rejectProtection(req, res));

// Auto-release check (for cron job)
router.post('/auto-release', (req, res) => escrowController.checkAutoRelease(req, res));

export default router;
