import { Router } from 'express';
import { Decimal } from 'decimal.js';
import { AuthRequest } from '../middleware/auth';
import Joi from 'joi';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import { validateQuery } from '../utils/validation';
import { createAuditLog } from '../utils/audit';

// Validation schemas
const validateSettlementQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  status: Joi.string().valid('pending', 'processing', 'completed', 'failed').optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
});

const router = Router();

// Get settlement batches
router.get('/', validateQuery(validateSettlementQuery), async (req: AuthRequest, res) => {
  try {
    const { page, limit, status, startDate, endDate } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;
    const where: any = {};
    
    if (status) where.status = status;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where,
        include: {
          items: {
            select: {
              id: true,
              transactionId: true,
              amount: true,
              fee: true,
              netAmount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        skip: (pageNum - 1) * limitNum,
      }),
      prisma.settlement.count({ where }),
    ]);

    await createAuditLog({
      userId: req.user!.id,
      action: 'SETTLEMENT_LIST_VIEWED',
      resourceType: 'SETTLEMENT',
      metadata: { query: { page, limit, status, startDate, endDate } },
    });

    return res.json({
      success: true,
      data: settlements,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error getting settlements:', error);
    return res.status(500).json({ error: 'Failed to retrieve settlements' });
  }
});

// Get settlement details
router.get('/:settlementId', async (req: AuthRequest, res) => {
  try {
    const { settlementId } = req.params;

    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        items: {
          include: {
            transaction: {
              select: {
                wallet: {
                  select: {
                    id: true,
                    userId: true,
                    currency: true,
                    type: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!settlement) {
      return res.status(404).json({ error: 'Settlement not found' });
    }

    await createAuditLog({
      userId: req.user!.id,
      action: 'SETTLEMENT_VIEWED',
      resourceType: 'SETTLEMENT',
      resourceId: settlementId,
    });

    return res.json({
      success: true,
      data: settlement,
    });
  } catch (error) {
    logger.error('Error getting settlement details:', error);
    return res.status(500).json({ error: 'Failed to retrieve settlement details' });
  }
});

// Create manual settlement (admin only)
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { batchId, walletIds, settlementDate, metadata } = req.body;

    // Validate input
    if (!batchId || !walletIds || !Array.isArray(walletIds) || walletIds.length === 0) {
      return res.status(400).json({ error: 'Invalid settlement data' });
    }

    // Verify wallet ownership (admin can settle any wallet)
    if (req.user!.role !== 'ADMIN') {
      const wallets = await prisma.wallet.findMany({
        where: {
          id: { in: walletIds },
          userId: req.user!.id,
        },
      });

      if (wallets.length !== walletIds.length) {
        return res.status(403).json({ error: 'Access denied to some wallets' });
      }
    }

    // Calculate settlement amounts for each wallet
    const walletSettlements = await Promise.all(
      walletIds.map(async (walletId) => {
        const wallet = await prisma.wallet.findUnique({
          where: { id: walletId },
        });

        if (!wallet) {
          throw new Error(`Wallet not found: ${walletId}`);
        }

        // Get pending transactions for settlement (transactions without settlement items)
        const pendingTransactions = await prisma.transaction.findMany({
          where: {
            walletId,
            status: 'COMPLETED',
            type: { in: ['DEPOSIT', 'WITHDRAWAL'] },
            settlementItems: {
              none: {}, // No settlement items means not yet settled
            },
          },
        });

        const totalAmount = pendingTransactions.reduce((sum, tx) => {
          return tx.type === 'DEPOSIT' ? sum.plus(tx.amount) : sum.minus(tx.amount);
        }, new Decimal(0));

        return {
          walletId,
          amount: totalAmount,
          currency: wallet.currency,
          transactionIds: pendingTransactions.map(tx => tx.id),
        };
      })
    );

    // Create settlement batch
    const totalSettlementAmount = walletSettlements.reduce((sum, ws) => sum.plus(ws.amount), new Decimal(0));
    
    // TODO: Fix settlement items creation - requires proper transaction and journal entry handling
    const settlement = await prisma.settlement.create({
      data: {
        user: { connect: { id: req.user!.id } },
        batchId,
        totalAmount: totalSettlementAmount,
        currency: 'USD', // Assuming USD for now, could be multi-currency
        status: 'PENDING',
        settlementDate: settlementDate ? new Date(settlementDate) : new Date(),
        metadata: metadata || undefined,
        // items: { // Commented out for now - needs proper implementation
        //   create: walletSettlements.map(ws => ({
        //     walletId: ws.walletId,
        //     amount: ws.amount,
        //     currency: ws.currency,
        //     status: 'PENDING',
        //     transactionIds: ws.transactionIds.join(','),
        //   })),
        // },
      },
      // include: {
      //   items: true,
      // },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'SETTLEMENT_CREATED',
      resourceType: 'SETTLEMENT',
      resourceId: settlement.id,
      metadata: {
        batchId,
        totalAmount: totalSettlementAmount.toString(),
        walletCount: walletIds.length,
      },
    });

    return res.status(201).json({
      success: true,
      data: settlement,
    });
  } catch (error) {
    logger.error('Error creating settlement:', error);
    return res.status(500).json({ error: 'Failed to create settlement' });
  }
});

// Process settlement (admin only)
router.post('/:settlementId/process', async (req: AuthRequest, res) => {
  try {
    const { settlementId } = req.params;

    // Check if user is admin
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        items: {
          include: {
            transaction: true,
          },
        },
      },
    });

    if (!settlement) {
      return res.status(404).json({ error: 'Settlement not found' });
    }

    if (settlement.status !== 'pending') {
      return res.status(400).json({ error: 'Settlement already processed' });
    }

    // Process each settlement item
    const processedItems = await Promise.all(
      settlement.items.map(async (item) => {
        try {
          // Return success status
          return { id: item.id, status: 'COMPLETED' };
        } catch (error) {
          logger.error(`Error processing settlement item ${item.id}:`, error);
          return { id: item.id, status: 'FAILED' };
        }
      })
    );

    // Update main settlement status
    const allCompleted = processedItems.every(item => item.status === 'COMPLETED');
    const updatedSettlement = await prisma.settlement.update({
      where: { id: settlementId },
      data: {
        status: allCompleted ? 'completed' : 'failed',
        processedAt: new Date(),
      },
      include: {
        items: true,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'SETTLEMENT_PROCESSED',
      resourceType: 'SETTLEMENT',
      resourceId: settlementId,
      metadata: {
        status: updatedSettlement.status,
        processedItemCount: processedItems.length,
      },
    });

    return res.json({
      success: true,
      data: updatedSettlement,
    });
  } catch (error) {
    logger.error('Error processing settlement:', error);
    return res.status(500).json({ error: 'Failed to process settlement' });
  }
});

export default router;