const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Test server setup
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Test routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'payment-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    message: 'Payment service is running!'
  });
});

app.get('/api/payments/test', (req, res) => {
  res.json({
    message: 'Payment API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Payment service error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`🚀 Payment service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💳 Payment API: http://localhost:${PORT}/api/payments/test`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('✅ Next steps:');
  console.log('1. Get Stripe test keys from https://dashboard.stripe.com/test/apikeys');
  console.log('2. Update .env file with your Stripe keys');
  console.log('3. Set up PostgreSQL database');
  console.log('4. Test with Stripe test cards');
  console.log('');
  console.log('🧪 Test Cards:');
  console.log('- Success: 4242 4242 4242 4242');
  console.log('- Decline: 4000 0000 0000 0002');
  console.log('- 3D Secure: 4000 0025 0000 3155');
});

module.exports = app;
