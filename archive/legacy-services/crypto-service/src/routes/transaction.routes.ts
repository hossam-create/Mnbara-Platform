import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller';

const router = Router();

// إنشاء إيداع - Create deposit
router.post('/deposit', transactionController.createDeposit);

// إنشاء سحب - Create withdrawal
router.post('/withdraw', transactionController.createWithdrawal);

// الحصول على معاملة - Get transaction
router.get('/:transactionId', transactionController.getTransaction);

// الحصول على حالة الإيداع - Get deposit status
router.get('/deposit/:depositId', transactionController.getDepositStatus);

// الحصول على حالة السحب - Get withdrawal status
router.get('/withdrawal/:withdrawalId', transactionController.getWithdrawalStatus);

// تحويل داخلي - Internal transfer
router.post('/transfer', transactionController.internalTransfer);

export default router;
