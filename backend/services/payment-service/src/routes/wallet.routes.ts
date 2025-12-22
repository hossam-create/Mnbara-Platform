import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';

const router = Router();
const walletController = new WalletController();

// GET /api/wallet - wallet summary
router.get('/', walletController.getBalance);

// GET /api/wallet/payout-methods
router.get('/payout-methods', walletController.getPayoutMethods);

// POST /api/wallet/payout-methods
router.post('/payout-methods', walletController.addPayoutMethod);

// POST /api/wallet/withdraw - full balance withdraw
router.post('/withdraw', walletController.withdraw);

// GET /api/wallet/withdrawals
router.get('/withdrawals', walletController.getWithdrawals);

// Additional legacy/testing endpoints
router.get('/transactions', walletController.getTransactions);
router.post('/deposit', walletController.deposit);

export default router;
