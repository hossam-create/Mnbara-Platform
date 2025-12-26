import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import walletRoutes from './routes/wallet.routes';
import balanceRoutes from './routes/balance.routes';
import transferRoutes from './routes/transfer.routes';
import conversionRoutes from './routes/conversion.routes';
import hedgingRoutes from './routes/hedging.routes';
import forexRoutes from './routes/forex.routes';

const app: Express = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3019;

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
    service: 'wallet-service',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'JPY', 'CNY', 'INR', 'TRY'],
    features: ['Multi-Currency', 'Auto-Conversion', 'Forex Hedging'],
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/v1/wallets', walletRoutes);
app.use('/api/v1/balances', balanceRoutes);
app.use('/api/v1/transfers', transferRoutes);
app.use('/api/v1/conversions', conversionRoutes);
app.use('/api/v1/hedging', hedgingRoutes);
app.use('/api/v1/forex', forexRoutes);

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
  console.log(`💰 Multi-Currency Wallet Service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Currencies: USD, EUR, GBP, SAR, AED, EGP, JPY, CNY, INR, TRY`);
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
