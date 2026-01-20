import { Router } from 'express';
import { EscrowKenyaController } from '../controllers/EscrowKenyaController';

const router = Router();
const escrowKenyaController = new EscrowKenyaController();

// Transaction routes
router.post('/transactions', escrowKenyaController.createTransaction);
router.post('/transactions/:transactionId/fund-mpesa', escrowKenyaController.fundTransactionWithMpesa);
router.post('/transactions/:transactionId/fund-card', escrowKenyaController.fundTransactionWithCard);
router.post('/transactions/:transactionId/release', escrowKenyaController.releaseFunds);
router.post('/transactions/:transactionId/refund', escrowKenyaController.refundTransaction);
router.get('/transactions/:transactionId/status', escrowKenyaController.getTransactionStatus);

// User routes
router.get('/users/:userId/transactions', escrowKenyaController.getUserTransactionHistory);

// Payout routes
router.post('/payouts', escrowKenyaController.createPayout);
router.get('/payouts/:payoutId/status', escrowKenyaController.getPayoutStatus);
router.get('/sellers/:sellerId/payouts', escrowKenyaController.getSellerPayoutHistory);

// Webhook routes
router.post('/webhook', escrowKenyaController.handleWebhook);
router.post('/mpesa-callback', escrowKenyaController.handleMpesaCallback);

// Statistics routes
router.get('/stats/escrow', escrowKenyaController.getEscrowStats);
router.get('/stats/mpesa', escrowKenyaController.getMpesaStats);

export default router;
