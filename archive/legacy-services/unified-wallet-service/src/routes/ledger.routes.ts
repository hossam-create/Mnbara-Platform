import { Router } from 'express';
import { Decimal } from 'decimal.js';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import { validateQuery, validateParams } from '../utils/validation';
import { createAuditLog } from '../utils/audit';
import { AuthRequest } from '../middleware/auth';
import Joi from 'joi';

// Validation schemas
const validateWalletId = Joi.object({
  walletId: Joi.string().uuid().required(),
});

const validateLedgerQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  accountCode: Joi.string().max(50).optional(),
});

const router = Router();

// Get ledger entries for a wallet
router.get('/wallet/:walletId', validateParams(validateWalletId), validateQuery(validateLedgerQuery), async (req: AuthRequest, res) => {
  try {
    const { walletId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const accountCode = req.query.accountCode as string;

    // Verify wallet access
    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId: req.user!.id },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const where: any = { walletId };
    
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(startDate as string);
      if (endDate) where.entryDate.lte = new Date(endDate as string);
    }

    if (accountCode) {
      where.account = { code: accountCode };
    }

    const [journalEntries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        include: {
          account: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
            },
          },
          transaction: {
            select: {
              id: true,
              type: true,
              status: true,
              referenceId: true,
            },
          },
        },
        orderBy: { entryDate: 'desc' },
        take: limit as number,
        skip: (page as number - 1) * (limit as number),
      }),
      prisma.journalEntry.count({ where }),
    ]);

    await createAuditLog({
      userId: req.user!.id,
      walletId,
      action: 'LEDGER_VIEWED',
      resourceType: 'WALLET',
      resourceId: walletId,
      metadata: { query: { page, limit, startDate, endDate, accountCode } },
    });

    return res.json({
      success: true,
      data: journalEntries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / (limit as number)),
      },
    });
  } catch (error) {
    logger.error('Error getting ledger entries:', error);
    return res.status(500).json({ error: 'Failed to retrieve ledger entries' });
  }
});

// Get account balances for a wallet
router.get('/wallet/:walletId/balances', validateParams(validateWalletId), async (req: AuthRequest, res) => {
  try {
    const { walletId } = req.params;

    // Verify wallet access
    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId: req.user!.id },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const accountBalances = await prisma.journalEntry.groupBy({
      by: ['accountId'],
      where: { walletId },
      _sum: {
        debit: true,
        credit: true,
      },
    });

    const accountIds = accountBalances.map(b => b.accountId);
    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds } },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
      },
    });

    const balances = accountBalances.map(balance => {
      const account = accounts.find(a => a.id === balance.accountId)!;
      const netBalance = new Decimal(balance._sum.debit || 0).minus(new Decimal(balance._sum.credit || 0));
      
      return {
        account,
        debitTotal: balance._sum.debit,
        creditTotal: balance._sum.credit,
        netBalance: netBalance.toString(),
      };
    });

    await createAuditLog({
      userId: req.user!.id,
      walletId,
      action: 'ACCOUNT_BALANCES_VIEWED',
      resourceType: 'WALLET',
      resourceId: walletId,
    });

    return res.json({
      success: true,
      data: balances,
    });
  } catch (error) {
    logger.error('Error getting account balances:', error);
    return res.status(500).json({ error: 'Failed to retrieve account balances' });
  }
});

// Get trial balance
router.get('/trial-balance', async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(startDate as string);
      if (endDate) where.entryDate.lte = new Date(endDate as string);
    }

    const trialBalance = await prisma.journalEntry.groupBy({
      by: ['accountId', 'currency'],
      where,
      _sum: {
        debit: true,
        credit: true,
      },
    });

    const accountIds = trialBalance.map(b => b.accountId);
    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds } },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
      },
    });

    const result = trialBalance.map(balance => {
      const account = accounts.find(a => a.id === balance.accountId)!;
      const debitTotal = new Decimal(balance._sum.debit || 0);
      const creditTotal = new Decimal(balance._sum.credit || 0);
      
      return {
        account,
        currency: balance.currency,
        debitTotal: debitTotal.toString(),
        creditTotal: creditTotal.toString(),
        balance: debitTotal.minus(creditTotal).toString(),
      };
    });

    // Verify trial balance (debits should equal credits)
    const totalDebits = result.reduce((sum, item) => sum.plus(item.debitTotal), new Decimal(0));
    const totalCredits = result.reduce((sum, item) => sum.plus(item.creditTotal), new Decimal(0));
    const isBalanced = totalDebits.equals(totalCredits);

    await createAuditLog({
      userId: req.user!.id,
      action: 'TRIAL_BALANCE_VIEWED',
      resourceType: 'LEDGER',
      metadata: { query: { startDate, endDate }, isBalanced },
    });

    return res.json({
      success: true,
      data: result,
      summary: {
        totalDebits: totalDebits.toString(),
        totalCredits: totalCredits.toString(),
        isBalanced,
      },
    });
  } catch (error) {
    logger.error('Error getting trial balance:', error);
    return res.status(500).json({ error: 'Failed to retrieve trial balance' });
  }
});

export default router;