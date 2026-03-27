/**
 * Wallet Summary Routes
 * READ-ONLY wallet visibility endpoints
 * No money movement operations
 */

import { Router } from 'express';
import { walletSummaryController } from '../controllers/wallet-summary.controller';

const router = Router();

// Wallet summary with escrow awareness
router.get('/summary', walletSummaryController.getWalletSummary.bind(walletSummaryController));

// Transaction history (read-only)
router.get('/transactions', walletSummaryController.getTransactionHistory.bind(walletSummaryController));

// Escrow holds breakdown
router.get('/escrow/holds', walletSummaryController.getEscrowHolds.bind(walletSummaryController));

export default router;
