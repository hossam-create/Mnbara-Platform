import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';

const router = Router();
const walletController = new WalletController();

// Get wallet balance
router.get('/', walletController.getBalance);

// Get transaction history
router.get('/transactions', walletController.getTransactions);

// Deposit funds (Top-up)
router.post('/deposit', walletController.deposit);

// Withdraw funds
router.post('/withdraw', walletController.withdraw);

export default router;
