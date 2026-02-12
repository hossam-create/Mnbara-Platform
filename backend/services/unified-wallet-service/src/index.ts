// ============================================================
// Unified Wallet Service - Main Entry Point with Migration Support
// ============================================================

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { UnifiedWalletService } from './services/UnifiedWalletService';
import { WalletMigrationService } from './migration/WalletMigrationService';
import { WinstonLogger } from './utils/logger';
import { RedisClient } from './utils/redis-client';
import { errorHandler } from './middleware/error-handler';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { createRateLimiter } from '../../api-gateway/src/middleware/rate-limiter.middleware';

const app = express();
const PORT = process.env.PORT || 3016;

// Initialize dependencies
const prisma = new PrismaClient();
const logger = new WinstonLogger('unified-wallet-service');
const redis = new RedisClient(process.env.REDIS_URL || 'redis://localhost:6379');

// Initialize services
const walletService = new UnifiedWalletService(prisma, logger, redis);
const migrationService = new WalletMigrationService(prisma, logger);

// Middleware
app.use(express.json());

// Rate limiting
const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  routePrefix: 'wallet-general'
});

const sensitiveRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20,
  routePrefix: 'wallet-sensitive'
});

app.use(generalRateLimiter);

// Health check
app.get('/health', async (req, res) => {
  try {
    const databaseHealthy = await prisma.$queryRaw`SELECT 1`;
    const redisHealthy = await redis.ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: databaseHealthy ? 'healthy' : 'unhealthy',
        redis: redisHealthy ? 'healthy' : 'unhealthy'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Migration routes
app.post('/api/migrate/wallet-service', authMiddleware, async (req, res) => {
  try {
    logger.info('Starting wallet service migration...');
    await migrationService.migrateFromWalletService();
    
    res.json({
      success: true,
      message: 'Wallet service migration completed successfully'
    });
  } catch (error: any) {
    logger.error('Wallet service migration failed', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Migration failed'
    });
  }
});

app.post('/api/migrate/internal-ledger-service', authMiddleware, async (req, res) => {
  try {
    logger.info('Starting internal ledger service migration...');
    await migrationService.migrateFromInternalLedgerService();
    
    res.json({
      success: true,
      message: 'Internal ledger service migration completed successfully'
    });
  } catch (error: any) {
    logger.error('Internal ledger service migration failed', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Migration failed'
    });
  }
});

app.get('/api/migrate/validate', authMiddleware, async (req, res) => {
  try {
    const validation = await migrationService.validateMigration();
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error: any) {
    logger.error('Migration validation failed', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Validation failed'
    });
  }
});

app.post('/api/migrate/rollback', authMiddleware, async (req, res) => {
  try {
    logger.info('Starting migration rollback...');
    await migrationService.rollbackMigration();
    
    res.json({
      success: true,
      message: 'Migration rollback completed successfully'
    });
  } catch (error: any) {
    logger.error('Migration rollback failed', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Rollback failed'
    });
  }
});

// Wallet Routes
app.post('/api/wallets', authMiddleware, sensitiveRateLimiter, async (req, res) => {
  try {
    const { currency, type, limits } = req.body;
    const userId = (req as any).user.id;

    if (!currency) {
      return res.status(400).json({
        success: false,
        error: 'Currency is required'
      });
    }

    const walletId = await walletService.createWallet(userId, currency, { type, limits });

    res.status(201).json({
      success: true,
      data: { walletId }
    });
  } catch (error: any) {
    logger.error('Failed to create wallet', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to create wallet'
    });
  }
});

app.get('/api/wallets', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const wallets = await walletService.getUserWallets(userId);

    res.json({
      success: true,
      data: { wallets }
    });
  } catch (error: any) {
    logger.error('Failed to get wallets', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to get wallets'
    });
  }
});

app.get('/api/wallets/:walletId/balance', authMiddleware, async (req, res) => {
  try {
    const { walletId } = req.params;
    const userId = (req as any).user.id;

    // Verify wallet ownership
    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId }
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    const balance = await walletService.getWalletBalance(walletId);

    res.json({
      success: true,
      data: { balance }
    });
  } catch (error: any) {
    logger.error('Failed to get wallet balance', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to get wallet balance'
    });
  }
});

// Transaction Routes
app.post('/api/wallets/:walletId/deposit', authMiddleware, sensitiveRateLimiter, async (req, res) => {
  try {
    const { walletId } = req.params;
    const { amount, referenceId, metadata } = req.body;
    const userId = (req as any).user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be positive'
      });
    }

    // Verify wallet ownership
    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId }
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    const entry = await walletService.deposit(walletId, amount, referenceId, metadata);

    res.json({
      success: true,
      data: { entry }
    });
  } catch (error: any) {
    logger.error('Failed to deposit funds', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to deposit funds'
    });
  }
});

app.post('/api/wallets/:walletId/withdraw', authMiddleware, sensitiveRateLimiter, async (req, res) => {
  try {
    const { walletId } = req.params;
    const { amount, referenceId, metadata } = req.body;
    const userId = (req as any).user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be positive'
      });
    }

    // Verify wallet ownership
    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId }
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    const entry = await walletService.withdraw(walletId, amount, referenceId, metadata);

    res.json({
      success: true,
      data: { entry }
    });
  } catch (error: any) {
    logger.error('Failed to withdraw funds', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to withdraw funds'
    });
  }
});

app.post('/api/wallets/transfer', authMiddleware, sensitiveRateLimiter, async (req, res) => {
  try {
    const { fromWalletId, toWalletId, amount, referenceId, metadata } = req.body;
    const userId = (req as any).user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be positive'
      });
    }

    // Verify source wallet ownership
    const fromWallet = await prisma.wallet.findFirst({
      where: { id: fromWalletId, userId }
    });

    if (!fromWallet) {
      return res.status(404).json({
        success: false,
        error: 'Source wallet not found'
      });
    }

    const result = await walletService.transfer(fromWalletId, toWalletId, amount, referenceId, metadata);

    res.json({
      success: true,
      data: { 
        fromEntry: result.fromEntry,
        toEntry: result.toEntry
      }
    });
  } catch (error: any) {
    logger.error('Failed to transfer funds', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to transfer funds'
    });
  }
});

// Settlement Routes
app.post('/api/settlements', authMiddleware, sensitiveRateLimiter, async (req, res) => {
  try {
    const settlementRequest = req.body;
    const userId = (req as any).user.id;

    // Verify buyer wallet ownership
    const buyerWallet = await prisma.wallet.findFirst({
      where: { id: settlementRequest.buyerWalletId, userId }
    });

    if (!buyerWallet) {
      return res.status(404).json({
        success: false,
        error: 'Buyer wallet not found or unauthorized'
      });
    }

    const entries = await walletService.createSettlement(settlementRequest);

    res.json({
      success: true,
      data: { entries }
    });
  } catch (error: any) {
    logger.error('Failed to create settlement', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to create settlement'
    });
  }
});

// Escrow Routes
app.post('/api/escrow', authMiddleware, sensitiveRateLimiter, async (req, res) => {
  try {
    const escrowData = req.body;
    const userId = (req as any).user.id;

    // Verify buyer wallet ownership
    const buyerWallet = await prisma.wallet.findFirst({
      where: { id: escrowData.buyerWalletId, userId }
    });

    if (!buyerWallet) {
      return res.status(404).json({
        success: false,
        error: 'Buyer wallet not found or unauthorized'
      });
    }

    const escrow = await walletService.createEscrowTransaction({
      ...escrowData,
      buyerId: userId
    });

    res.status(201).json({
      success: true,
      data: { escrow }
    });
  } catch (error: any) {
    logger.error('Failed to create escrow', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to create escrow'
    });
  }
});

app.post('/api/escrow/:escrowId/release', authMiddleware, sensitiveRateLimiter, async (req, res) => {
  try {
    const { escrowId } = req.params;
    const { metadata } = req.body;
    const userId = (req as any).user.id;

    // Verify escrow ownership
    const escrow = await prisma.escrowTransaction.findFirst({
      where: { id: escrowId, buyerId: userId }
    });

    if (!escrow) {
      return res.status(404).json({
        success: false,
        error: 'Escrow not found or unauthorized'
      });
    }

    await walletService.releaseEscrow(escrowId, metadata);

    res.json({
      success: true,
      message: 'Escrow released successfully'
    });
  } catch (error: any) {
    logger.error('Failed to release escrow', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to release escrow'
    });
  }
});

// Ledger Routes
app.get('/api/wallets/:walletId/ledger', authMiddleware, async (req, res) => {
  try {
    const { walletId } = req.params;
    const { limit, offset, startDate, endDate, type } = req.query;
    const userId = (req as any).user.id;

    // Verify wallet ownership
    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId }
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    const result = await walletService.getLedgerEntries(walletId, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      type: type as 'debit' | 'credit' | undefined
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Failed to get ledger entries', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to get ledger entries'
    });
  }
});

// Currency Conversion Routes
app.post('/api/wallets/convert', authMiddleware, sensitiveRateLimiter, async (req, res) => {
  try {
    const { fromWalletId, toWalletId, fromAmount, toCurrency } = req.body;
    const userId = (req as any).user.id;

    // Verify source wallet ownership
    const fromWallet = await prisma.wallet.findFirst({
      where: { id: fromWalletId, userId }
    });

    if (!fromWallet) {
      return res.status(404).json({
        success: false,
        error: 'Source wallet not found or unauthorized'
      });
    }

    const conversion = await walletService.convertCurrency(fromWalletId, toWalletId, fromAmount, toCurrency);

    res.json({
      success: true,
      data: { conversion }
    });
  } catch (error: any) {
    logger.error('Failed to convert currency', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to convert currency'
    });
  }
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await redis.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`Unified Wallet Service running on port ${PORT}`);
});

export default app;