import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createOrder, getOrders, acceptOrder } from './controllers/orderController';
import { processPayment, getPaymentHistory, getPaymentDetails } from './controllers/paymentController';
import { authMiddleware } from './middleware/authMiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(compression());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'MVP Order System Running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Public routes
app.get('/orders', getOrders); // View available orders

// Protected routes
app.use(authMiddleware);

// Order management
app.post('/orders', createOrder); // Create order request
app.post('/orders/:id/accept', acceptOrder); // Traveler accepts order

// Payment routes
app.post('/payments', processPayment); // Process service fee payment
app.get('/payments', getPaymentHistory); // Get payment history
app.get('/payments/:paymentId', getPaymentDetails); // Get payment details

app.listen(PORT, () => {
  console.log(`🎯 MVP Order System running on port ${PORT}`);
  console.log(`🛒 Create order: POST /orders`);
  console.log(`📋 View orders: GET /orders`);
  console.log(`✅ Accept order: POST /orders/:id/accept`);
  console.log(`💳 Process payment: POST /payments`);
});

export default app;