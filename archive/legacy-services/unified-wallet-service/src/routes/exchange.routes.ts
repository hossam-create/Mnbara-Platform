import { Router } from 'express';
import { Decimal } from 'decimal.js';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import { validateQuery, validateRequest } from '../utils/validation';
import { createAuditLog } from '../utils/audit';
import { AuthRequest } from '../middleware/auth';
import { Currency } from '@prisma/client';
import Joi from 'joi';

// Validation schemas
const validateExchangeRateQuery = Joi.object({
  fromCurrency: Joi.string().valid(...Object.values(Currency)).optional(),
  toCurrency: Joi.string().valid(...Object.values(Currency)).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

const validateExchangeRate = Joi.object({
  fromCurrency: Joi.string().valid(...Object.values(Currency)).required(),
  toCurrency: Joi.string().valid(...Object.values(Currency)).required(),
  rate: Joi.number().positive().precision(8).required(),
  spread: Joi.number().min(0).max(1).default(0),
  effectiveFrom: Joi.date().iso().default(() => new Date().toISOString()),
  effectiveTo: Joi.date().iso().optional(),
});

const validateExchange = Joi.object({
  sourceWalletId: Joi.string().uuid().required(),
  destinationWalletId: Joi.string().uuid().required(),
  amount: Joi.number().positive().precision(8).required(),
  fromCurrency: Joi.string().valid(...Object.values(Currency)).required(),
  toCurrency: Joi.string().valid(...Object.values(Currency)).required(),
  description: Joi.string().optional(),
  referenceId: Joi.string().optional(),
  metadata: Joi.object().optional(),
});

const router = Router();

// Get exchange rates
router.get('/rates', validateQuery(validateExchangeRateQuery), async (req: AuthRequest, res) => {
  try {
    const { fromCurrency, toCurrency } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const where: any = {};
    if (fromCurrency) where.fromCurrency = fromCurrency;
    if (toCurrency) where.toCurrency = toCurrency;
    if (fromCurrency && toCurrency) {
      // Get the most recent rate for the specific currency pair
      const rate = await prisma.exchangeRate.findFirst({
        where: {
          fromCurrency: fromCurrency as Currency,
          toCurrency: toCurrency as Currency,
          effectiveFrom: { lte: new Date() },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: new Date() } },
          ],
        },
        orderBy: { effectiveFrom: 'desc' },
      });

      if (!rate) {
        return res.status(404).json({ error: 'Exchange rate not found' });
      }

      await createAuditLog({
        userId: req.user!.id,
        action: 'EXCHANGE_RATE_VIEWED',
        resourceType: 'EXCHANGE_RATE',
        resourceId: rate.id,
        metadata: { fromCurrency, toCurrency },
      });

      return res.json({
        success: true,
        data: rate,
      });
    }

    const [rates, total] = await Promise.all([
      prisma.exchangeRate.findMany({
        where,
        orderBy: { effectiveFrom: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.exchangeRate.count({ where }),
    ]);

    await createAuditLog({
      userId: req.user!.id,
      action: 'EXCHANGE_RATES_LIST_VIEWED',
      resourceType: 'EXCHANGE_RATE',
      metadata: { query: { fromCurrency, toCurrency, page, limit } },
    });

    return res.json({
      success: true,
      data: rates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error('Error getting exchange rates:', error);
    return res.status(500).json({ error: 'Failed to retrieve exchange rates' });
  }
});

// Create exchange rate (admin only)
router.post('/rates', async (req: AuthRequest, res) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { error, value } = validateExchangeRate.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(d => d.message),
      });
    }

    const { fromCurrency, toCurrency, rate, spread, effectiveFrom, effectiveTo } = value;

    // Check if there's an existing rate for this currency pair
    const existingRate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency,
        toCurrency,
        effectiveFrom: { lte: effectiveFrom },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: effectiveFrom } },
        ],
      },
    });

    if (existingRate) {
      return res.status(409).json({
        error: 'Exchange rate already exists for this currency pair and time period',
      });
    }

    const exchangeRate = await prisma.exchangeRate.create({
      data: {
        fromCurrency,
        toCurrency,
        rate,
        inverseRate: new Decimal(1).div(rate),
        spread,
        effectiveFrom,
        effectiveTo,
        userId: req.user!.id,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'EXCHANGE_RATE_CREATED',
      resourceType: 'EXCHANGE_RATE',
      resourceId: exchangeRate.id,
      metadata: { fromCurrency, toCurrency, rate, spread },
    });

    return res.status(201).json({
      success: true,
      data: exchangeRate,
    });
  } catch (error) {
    logger.error('Error creating exchange rate:', error);
    return res.status(500).json({ error: 'Failed to create exchange rate' });
  }
});

// Exchange currency
router.post('/exchange', validateRequest(validateExchange), async (req: AuthRequest, res) => {
  try {
    const {
      sourceWalletId,
      destinationWalletId,
      amount,
      fromCurrency,
      toCurrency,
      description,
      referenceId,
      metadata,
    } = req.body;

    // Verify wallet ownership
    const sourceWallet = await prisma.wallet.findFirst({
      where: { id: sourceWalletId, userId: req.user!.id },
    });

    const destinationWallet = await prisma.wallet.findFirst({
      where: { id: destinationWalletId, userId: req.user!.id },
    });

    if (!sourceWallet || !destinationWallet) {
      return res.status(404).json({ error: 'One or both wallets not found' });
    }

    // Get exchange rate
    const exchangeRate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency,
        toCurrency,
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } },
        ],
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    if (!exchangeRate) {
      return res.status(404).json({ error: 'Exchange rate not found' });
    }

    // Calculate converted amount with spread
    const fromAmount = new Decimal(amount);
    const spreadRate = exchangeRate.rate.mul(new Decimal(1).plus(exchangeRate.spread));
    const toAmount = fromAmount.mul(spreadRate);

    // Check sufficient balance
    const sourceBalance = new Decimal(sourceWallet.availableBalance);
    if (sourceBalance.lt(fromAmount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create exchange transaction
    const exchange = await prisma.$transaction(async (tx) => {
      // Create exchange transaction
      const exchangeTx = await tx.transaction.create({
        data: {
          walletId: sourceWalletId,
          userId: req.user!.id,
          type: 'EXCHANGE',
          amount: fromAmount,
          currency: fromCurrency,
          fee: new Decimal(0),
          netAmount: fromAmount,
          status: 'COMPLETED',
          description: description || `Exchange ${fromCurrency} to ${toCurrency}`,
          referenceId,
          sourceWalletId,
          destinationWalletId,
          exchangeRate: spreadRate,
          baseCurrency: toCurrency,
          baseAmount: toAmount,
          metadata: {
            ...metadata,
            exchangeRate: spreadRate.toString(),
            toAmount: toAmount.toString(),
          },
        },
      });

      // Create destination wallet transaction
      await tx.transaction.create({
        data: {
          walletId: destinationWalletId,
          userId: req.user!.id,
          type: 'EXCHANGE',
          amount: toAmount,
          currency: toCurrency,
          fee: new Decimal(0),
          netAmount: toAmount,
          status: 'COMPLETED',
          description: description || `Exchange ${fromCurrency} to ${toCurrency}`,
          referenceId,
          sourceWalletId,
          destinationWalletId,
          exchangeRate: spreadRate,
          baseCurrency: fromCurrency,
          baseAmount: fromAmount,
          metadata: {
            ...metadata,
            exchangeRate: spreadRate.toString(),
            fromAmount: fromAmount.toString(),
          },
        },
      });

      // Update wallet balances
      await tx.wallet.update({
        where: { id: sourceWalletId },
        data: {
          balance: new Decimal(sourceWallet.balance).minus(fromAmount).toString(),
          availableBalance: sourceBalance.minus(fromAmount).toString(),
          lastActivityAt: new Date(),
        },
      });

      await tx.wallet.update({
        where: { id: destinationWalletId },
        data: {
          balance: new Decimal(destinationWallet.balance).plus(toAmount).toString(),
          availableBalance: new Decimal(destinationWallet.availableBalance).plus(toAmount).toString(),
          lastActivityAt: new Date(),
        },
      });

      return exchangeTx;
    });

    await createAuditLog({
      userId: req.user!.id,
      walletId: sourceWalletId,
      transactionId: exchange.id,
      action: 'EXCHANGE_COMPLETED',
      resourceType: 'TRANSACTION',
      resourceId: exchange.id,
      metadata: {
        fromAmount: fromAmount.toString(),
        toAmount: toAmount.toString(),
        exchangeRate: spreadRate,
        fromCurrency,
        toCurrency,
        destinationWalletId,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        transaction: exchange,
        exchangeRate: spreadRate,
        fromAmount: fromAmount.toString(),
        toAmount: toAmount.toString(),
      },
    });
  } catch (error) {
    logger.error('Error exchanging currency:', error);
    return res.status(500).json({ error: 'Failed to exchange currency' });
  }
});

export default router;