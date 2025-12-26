import { Router } from 'express';
import { walletController } from '../controllers/wallet.controller';

const router = Router();

// إنشاء محفظة - Create wallet
router.post('/', walletController.createWallet);

// الحصول على المحفظة - Get wallet
router.get('/:userId', walletController.getWallet);

// الحصول على الرصيد الإجمالي - Get total balance
router.get('/:userId/total-balance', walletController.getTotalBalance);

// إيداع - Deposit
router.post('/deposit', walletController.deposit);

// سحب - Withdraw
router.post('/withdraw', walletController.withdraw);

// تحويل بين العملات - Convert currencies
router.post('/convert', walletController.convert);

// الحصول على تاريخ المعاملات - Get transaction history
router.get('/:userId/transactions', walletController.getTransactionHistory);

// تحديث الحدود - Update limits
router.patch('/:userId/limits', walletController.updateLimits);

export default router;
