import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import paymentRoutes from './routes/payment.routes';
import refundRoutes from './routes/refund.routes';
import webhookRoutes from './routes/webhook.routes';
import merchantRoutes from './routes/merchant.routes';

const app: Express = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3023;

// Middleware
app.use(helmet());
app.use(cors());

// Raw body for webhooks
app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    service: 'paypal-service',
    features: [
      'PayPal Checkout',
      'Instant Payments',
      'Refunds',
      'Merchant Onboarding',
      'Webhooks'
    ],
    environment: process.env.PAYPAL_MODE || 'sandbox',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/refunds', refundRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/merchants', merchantRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    messageAr: 'المسار غير موجود'
  });
});

// Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    messageAr: 'خطأ في الخادم'
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`💳 PayPal Service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.PAYPAL_MODE || 'sandbox'}`);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

export { app, prisma };
