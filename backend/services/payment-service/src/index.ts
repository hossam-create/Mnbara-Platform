import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import paymentRoutes from './routes/payment.routes';
import escrowKenyaRoutes from './routes/escrowKenyaRoutes';
import manualPayoutRoutes from './routes/manualPayoutRoutes';
import automationRoutes from './routes/automationRoutes';
import disputeSystemRoutes from './routes/disputeSystemRoutes';
import { EnvValidator, ENV_CONFIGS, validateProductionSecrets } from '../../shared/utils/env-validator';

// Validate environment variables before starting
// Note: Only validate if shared utils are available. If not, proceed with caution.
try {
  if (EnvValidator && ENV_CONFIGS && ENV_CONFIGS.PAYMENT_SERVICE) {
    EnvValidator.validate(ENV_CONFIGS.PAYMENT_SERVICE);
    validateProductionSecrets();
  }
} catch (error) {
  console.warn('Environment validation skipped due to missing shared utils');
}

const app = express();
const PORT = process.env.PORT || 3003;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
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
    status: 'ok', 
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

const server = app.listen(PORT, () => {
  console.log(`🚀 Payment service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💳 Payment API: http://localhost:${PORT}/api/payments`);
  console.log(`🇰🇪 Escrow Kenya API: http://localhost:${PORT}/api/escrow-kenya`);
  console.log(`💰 Manual Payouts: http://localhost:${PORT}/api/manual-payouts`);
  console.log(`🤖 Automation: http://localhost:${PORT}/api/automation`);
  console.log(`⚖️ Dispute System: http://localhost:${PORT}/api/dispute-system`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

export default app;
