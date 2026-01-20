import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import paymentRoutes from './routes/paymentRoutes';
import escrowKenyaRoutes from './routes/escrowKenyaRoutes';
import manualPayoutRoutes from './routes/manualPayoutRoutes';
import automationRoutes from './routes/automationRoutes';
import disputeSystemRoutes from './routes/disputeSystemRoutes';

const app = express();
const PORT = process.env.PORT || 3003;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/payments', paymentRoutes);
app.use('/api/escrow-kenya', escrowKenyaRoutes);
app.use('/api/manual-payouts', manualPayoutRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/dispute-system', disputeSystemRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'payment-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: {
      stripe: true,
      escrow: true,
      payouts: true,
      disputes: true,
      subscriptions: true,
      escrowKenya: true,
      mpesa: true,
      manualPayouts: true,
      automation: true,
      disputeSystem: true,
    }
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Payment service error:', err);
  
  if (err.type === 'StripeCardError') {
    return res.status(400).json({ error: 'Your card was declined.' });
  }
  
  if (err.type === 'StripeRateLimitError') {
    return res.status(429).json({ error: 'Too many requests to Stripe.' });
  }
  
  if (err.type === 'StripeInvalidRequestError') {
    return res.status(400).json({ error: 'Invalid payment request.' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Payment service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💳 Payment API: http://localhost:${PORT}/api/payments`);
  console.log(`🇰🇪 Escrow Kenya API: http://localhost:${PORT}/api/escrow-kenya`);
  console.log(`💰 Manual Payouts: http://localhost:${PORT}/api/manual-payouts`);
  console.log(`🤖 Automation: http://localhost:${PORT}/api/automation`);
  console.log(`⚖️ Dispute System: http://localhost:${PORT}/api/dispute-system`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('✅ Features Available:');
  console.log('  - Stripe Payments (Global)');
  console.log('  - Escrow System');
  console.log('  - Payouts Management');
  console.log('  - Dispute Resolution');
  console.log('  - Subscription Billing');
  console.log('  - Multi-Currency Support');
  console.log('  - Escrow Kenya Integration');
  console.log('  - Manual Payouts');
  console.log('  - M-Pesa Payments');
  console.log('  - Automation Engine');
  console.log('  - Dispute Resolution System');
  console.log('');
  console.log('🧪 Test Cards:');
  console.log('  - Success: 4242 4242 4242 4242');
  console.log('  - Decline: 4000 0000 0000 0002');
  console.log('  - 3D Secure: 4000 0025 0000 3155');
  console.log('');
  console.log('📱 M-Pesa Test:');
  console.log('  - Phone: 2547XXXXXXXX');
  console.log('  - Amount: Any amount in KES');
});

export default app;
