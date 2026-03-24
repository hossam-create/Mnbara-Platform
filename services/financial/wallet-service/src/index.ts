/**
 * @deprecated This Express entry point is deprecated.
 * Use main.ts (NestJS) for all production deployments.
 * This file is kept for backward compatibility and development flexibility only.
 * 
 * See: ENTRY_POINT_STRATEGY.md for details
 * Production entry point: src/main.ts
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import walletRoutes from './routes/wallet.routes';
import walletSummaryRoutes from './routes/wallet-summary.routes';
import balanceRoutes from './routes/balance.routes';
import transferRoutes from './routes/transfer.routes';
import conversionRoutes from './routes/conversion.routes';
import hedgingRoutes from './routes/hedging.routes';
import forexRoutes from './routes/forex.routes';
import biometricRoutes from './routes/biometric.routes';
import limitsRoutes from './routes/limits.routes';

// Phase 4.1 — Ledger-first wallet routes
import walletRoutesV2 from './routes/wallet.routes.v2';
import ledgerRoutes from './routes/ledger.routes';
import transferRoutesV2 from './routes/transfer.routes.v2';
import controlCenterRoutes from './routes/control-center.routes';
import escrowRoutes from './routes/escrow.routes';
import webhookRoutes from './routes/webhook.routes';

const app: Express = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({
  verify: (req: any, res, buf) => {
    // Capture raw body for webhook signature verification
    if (req.url.startsWith('/api/v2/webhooks')) {
      req.rawBody = buf;
    }
  }
}));
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
    version: '2.1.0',
    phase: '4.2',
    supportedCurrencies: ['EGP'],
    features: ['Ledger-First', 'Integer Money', 'Atomic Transfers', 'Control Center', 'Escrow State Machine'],
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes (v1 - Legacy)
app.use('/api/v1/wallets', walletRoutes);
app.use('/api/v1/wallet', walletSummaryRoutes);
app.use('/api/v1/balances', balanceRoutes);
app.use('/api/v1/transfers', transferRoutes);
app.use('/api/v1/conversions', conversionRoutes);
app.use('/api/v1/hedging', hedgingRoutes);
app.use('/api/v1/forex', forexRoutes);
app.use('/api/v1/biometric', biometricRoutes);
app.use('/api/v1/limits', limitsRoutes);

// API Routes (v2 - Phase 4. Ledger-first)
app.use('/api/v2/wallets', walletRoutesV2);
app.use('/api/v2/ledger', ledgerRoutes);
app.use('/api/v2/transfer', transferRoutesV2);
app.use('/api/v2/control-center', controlCenterRoutes);
app.use('/api/v2/escrow', escrowRoutes);
app.use('/api/v2/webhooks', webhookRoutes);

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
