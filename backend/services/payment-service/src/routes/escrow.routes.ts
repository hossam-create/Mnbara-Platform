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

// Raise dispute
router.post('/:id/dispute', (req, res) => escrowController.raiseDispute(req, res));

// Get escrow status
router.get('/:id/status', (req, res) => escrowController.getStatus(req, res));

// Auto-release check (for cron job)
router.post('/auto-release', (req, res) => escrowController.checkAutoRelease(req, res));

export default router;
