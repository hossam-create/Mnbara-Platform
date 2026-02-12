import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';

const router = Router();
const transactionController = new TransactionController();

// Transaction routes
router.post('/deposit', transactionController.createDeposit);
router.post('/withdrawal', transactionController.createWithdrawal);
router.post('/transfer', transactionController.createTransfer);
router.get('/', transactionController.getTransactions);
router.get('/:transactionId', transactionController.getTransaction);

export default router;