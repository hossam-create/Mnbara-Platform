// Escrow Routes

import { Router } from 'express';
import { EscrowController } from '../controllers/escrow.controller';

const router = Router();
const controller = new EscrowController();

// Health check
router.get('/health', controller.healthCheck.bind(controller));

// Create escrow
router.post('/', controller.createEscrow.bind(controller));

// Get escrow
router.get('/:id', controller.getEscrow.bind(controller));

// Get status
router.get('/:id/status', controller.getStatus.bind(controller));

// Add signature
router.post('/:id/signature', controller.addSignature.bind(controller));

// Lock transaction
router.post('/:id/lock', controller.lockTransaction.bind(controller));

// Release funds
router.post('/:id/release', controller.releaseTransaction.bind(controller));

// Dispute management
router.post('/:id/dispute', controller.initiateDispute.bind(controller));
router.post('/:id/resolve', controller.resolveDispute.bind(controller));

export default router;
