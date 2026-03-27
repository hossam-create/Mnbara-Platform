import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import walletRoutes from './routes/wallet.routes';
import paymentRoutes from './routes/payment.routes';
import exchangeRoutes from './routes/exchange.routes';
import transactionRoutes from './routes/transaction.routes';

const app: Express = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3018;

// Middleware
app.use(helmet());
app.use(cors());
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
    service: 'crypto-service',
    supportedCurrencies: ['BTC', 'ETH', 'USDC', 'USDT'],
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/v1/wallets', walletRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/exchange', exchangeRoutes);
app.use('/api/v1/transactions', transactionRoutes);

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
  console.log(`₿ Crypto Service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`💰 Supported: BTC, ETH, USDC, USDT`);
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
