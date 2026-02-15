import express from 'express';
import { processPayment, getPaymentHistory, getPaymentDetails } from '../controllers/paymentController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// All payment routes require authentication
router.use(authMiddleware);

// Payment processing
router.post('/payments', processPayment);

// Payment history
router.get('/payments', getPaymentHistory);
router.get('/payments/:paymentId', getPaymentDetails);

export default router;