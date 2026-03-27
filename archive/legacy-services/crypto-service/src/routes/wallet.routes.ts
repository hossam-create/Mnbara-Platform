import { Router } from 'express';
import { walletController } from '../controllers/wallet.controller';

const router = Router();

// إنشاء محفظة - Create wallet
router.post('/', walletController.createWallet);

// الحصول على المحفظة - Get wallet
router.get('/:userId', walletController.getWallet);

// الحصول على الرصيد - Get balance
router.get('/:userId/balance', walletController.getBalance);

// الحصول على عنوان الإيداع - Get deposit address
router.get('/:userId/deposit-address', walletController.getDepositAddress);

// الحصول على تاريخ المعاملات - Get transaction history
router.get('/:userId/transactions', walletController.getTransactionHistory);

export default router;
