import { Response } from 'express';
import { Decimal } from 'decimal.js';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import { validateWalletCreation, validateWalletUpdate } from '../utils/validation';
import { createAuditLog } from '../utils/audit';
import { AuthRequest } from '../middleware/auth';

export class WalletController {
  async createWallet(req: AuthRequest, res: Response) {
    try {
      const { error, value } = validateWalletCreation.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.details.map(d => d.message),
        });
      }

      const { userId, currency, type } = value;
      
      // Check if wallet already exists
      const existingWallet = await prisma.wallet.findFirst({
        where: { userId, currency, type },
      });

      if (existingWallet) {
        return res.status(409).json({
          error: 'Wallet already exists',
          message: `A ${type} wallet for ${currency} already exists for this user`,
        });
      }

      // Create wallet
      const wallet = await prisma.wallet.create({
        data: {
          userId,
          currency,
          type,
          balance: new Decimal(0),
          availableBalance: new Decimal(0),
          holdBalance: new Decimal(0),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Create audit log
      await createAuditLog({
        userId,
        walletId: wallet.id,
        action: 'WALLET_CREATED',
        resourceType: 'wallet',
        resourceId: wallet.id,
        newValue: wallet,
        ipAddress: req.ip || '',
        userAgent: req.get('User-Agent') || '',
      });

      logger.info(`Wallet created: ${wallet.id} for user ${userId}`);

      return res.status(201).json({
        success: true,
        data: {
          id: wallet.id,
          userId: wallet.userId,
          type: wallet.type,
          currency: wallet.currency,
          balance: wallet.balance.toString(),
          availableBalance: wallet.availableBalance.toString(),
          holdBalance: wallet.holdBalance.toString(),
          creditLimit: wallet.creditLimit.toString(),
          isActive: wallet.isActive,
          isFrozen: wallet.isFrozen,
          createdAt: wallet.createdAt,
          user: wallet.user,
        },
      });
    } catch (error) {
      logger.error('Error creating wallet:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create wallet',
      });
    }
  }

  async getWallet(req: AuthRequest, res: Response) {
    try {
      const { walletId } = req.params;
      const userId = req.user?.id;

      if (!walletId) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Wallet ID is required',
        });
      }

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const wallet = await prisma.wallet.findFirst({
        where: {
          id: walletId,
          userId, // Ensure user can only access their own wallets
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true,
              kycStatus: true,
            },
          },
          _count: {
            select: {
              transactions: true,
              settlements: true,
            },
          },
        },
      });

      if (!wallet) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Wallet not found or access denied',
        });
      }

      return res.json({
        success: true,
        data: {
          id: wallet.id,
          userId: wallet.userId,
          type: wallet.type,
          currency: wallet.currency,
          balance: wallet.balance.toString(),
          availableBalance: wallet.availableBalance.toString(),
          holdBalance: wallet.holdBalance.toString(),
          creditLimit: wallet.creditLimit.toString(),
          isActive: wallet.isActive,
          isFrozen: wallet.isFrozen,
          frozenReason: wallet.frozenReason,
          frozenAt: wallet.frozenAt,
          lastActivityAt: wallet.lastActivityAt,
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt,
          user: wallet.user,
        },
      });
    } catch (error) {
      logger.error('Error getting wallet:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve wallet',
      });
    }
  }

  async getUserWallets(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { currency, type, includeInactive } = req.query;

      const where: any = { userId };
      
      if (currency) {
        where.currency = currency;
      }
      
      if (type) {
        where.type = type;
      }
      
      if (!includeInactive || includeInactive === 'false') {
        where.isActive = true;
      }

      const wallets = await prisma.wallet.findMany({
        where,
        include: {
          _count: {
            select: {
              transactions: true,
            },
          },
        },
        orderBy: [
          { isActive: 'desc' },
          { currency: 'asc' },
          { type: 'asc' },
          { createdAt: 'desc' },
        ],
      });

      const totalBalance = wallets.reduce((sum, wallet) => {
        return sum.plus(wallet.balance);
      }, new Decimal(0));

      res.json({
        success: true,
        data: {
          wallets: wallets.map(wallet => ({
            id: wallet.id,
            type: wallet.type,
            currency: wallet.currency,
            balance: wallet.balance.toString(),
            availableBalance: wallet.availableBalance.toString(),
            holdBalance: wallet.holdBalance.toString(),
            creditLimit: wallet.creditLimit.toString(),
            isActive: wallet.isActive,
            isFrozen: wallet.isFrozen,
            lastActivityAt: wallet.lastActivityAt,
            createdAt: wallet.createdAt,
            transactionCount: wallet._count.transactions,
          })),
          summary: {
            totalWallets: wallets.length,
            totalBalance: totalBalance.toString(),
            currencies: [...new Set(wallets.map(w => w.currency))],
            types: [...new Set(wallets.map(w => w.type))],
          },
        },
      });
    } catch (error) {
      logger.error('Error getting user wallets:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve wallets',
      });
    }
  }

  async updateWallet(req: AuthRequest, res: Response) {
    try {
      const { walletId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const { error, value } = validateWalletUpdate.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.details.map(d => d.message),
        });
      }

      // Find existing wallet
      const existingWallet = await prisma.wallet.findFirst({
        where: {
          id: walletId,
          userId,
        },
      });

      if (!existingWallet) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Wallet not found or access denied',
        });
      }

      // Update wallet
      const wallet = await prisma.wallet.update({
        where: { id: walletId },
        data: {
          ...value,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Create audit log
      await createAuditLog({
        userId: userId!,
        walletId: wallet.id,
        action: 'WALLET_UPDATED',
        resourceType: 'wallet',
        resourceId: wallet.id,
        oldValue: existingWallet,
        newValue: wallet,
        ipAddress: req.ip || '',
        userAgent: req.get('User-Agent') || '',
      });

      logger.info(`Wallet updated: ${wallet.id} for user ${userId}`);

      return res.json({
        success: true,
        data: {
          id: wallet.id,
          userId: wallet.userId,
          type: wallet.type,
          currency: wallet.currency,
          balance: wallet.balance.toString(),
          availableBalance: wallet.availableBalance.toString(),
          holdBalance: wallet.holdBalance.toString(),
          creditLimit: wallet.creditLimit.toString(),
          isActive: wallet.isActive,
          isFrozen: wallet.isFrozen,
          frozenReason: wallet.frozenReason,
          lastActivityAt: wallet.lastActivityAt,
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt,
          user: wallet.user,
        },
      });
    } catch (error) {
      logger.error('Error updating wallet:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update wallet',
      });
    }
  }

  async freezeWallet(req: AuthRequest, res: Response) {
    try {
      const { walletId } = req.params;
      const userId = req.user?.id;
      const { reason } = req.body;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Freeze reason is required',
        });
      }

      // Find existing wallet
      const existingWallet = await prisma.wallet.findFirst({
        where: {
          id: walletId,
          userId,
        },
      });

      if (!existingWallet) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Wallet not found or access denied',
        });
      }

      if (existingWallet.isFrozen) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Wallet is already frozen',
        });
      }

      // Freeze wallet
      const wallet = await prisma.wallet.update({
        where: { id: walletId },
        data: {
          isFrozen: true,
          frozenReason: reason.trim(),
          frozenAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create audit log
      await createAuditLog({
        userId: userId!,
        walletId: wallet.id,
        action: 'WALLET_FROZEN',
        resourceType: 'wallet',
        resourceId: wallet.id,
        oldValue: existingWallet,
        newValue: wallet,
        ipAddress: req.ip || '',
        userAgent: req.get('User-Agent') || '',
      });

      logger.info(`Wallet frozen: ${wallet.id} for user ${userId}. Reason: ${reason}`);

      return res.json({
        success: true,
        data: {
          id: wallet.id,
          isFrozen: wallet.isFrozen,
          frozenReason: wallet.frozenReason,
          frozenAt: wallet.frozenAt,
          updatedAt: wallet.updatedAt,
        },
      });
    } catch (error) {
      logger.error('Error freezing wallet:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to freeze wallet',
      });
    }
  }

  async unfreezeWallet(req: AuthRequest, res: Response) {
    try {
      const { walletId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      // Find existing wallet
      const existingWallet = await prisma.wallet.findFirst({
        where: {
          id: walletId,
          userId,
        },
      });

      if (!existingWallet) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Wallet not found or access denied',
        });
      }

      if (!existingWallet.isFrozen) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Wallet is not frozen',
        });
      }

      // Unfreeze wallet
      const wallet = await prisma.wallet.update({
        where: { id: walletId },
        data: {
          isFrozen: false,
          frozenReason: null,
          frozenAt: null,
          updatedAt: new Date(),
        },
      });

      // Create audit log
      await createAuditLog({
        userId: userId!,
        walletId: wallet.id,
        action: 'WALLET_UNFROZEN',
        resourceType: 'wallet',
        resourceId: wallet.id,
        oldValue: existingWallet,
        newValue: wallet,
        ipAddress: req.ip || '',
        userAgent: req.get('User-Agent') || '',
      });

      logger.info(`Wallet unfrozen: ${wallet.id} for user ${userId}`);

      return res.json({
        success: true,
        data: {
          id: wallet.id,
          isFrozen: wallet.isFrozen,
          updatedAt: wallet.updatedAt,
        },
      });
    } catch (error) {
      logger.error('Error unfreezing wallet:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to unfreeze wallet',
      });
    }
  }

  async getWalletStatement(req: AuthRequest, res: Response) {
    try {
      const { walletId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      const { 
        startDate, 
        endDate, 
        type, 
        status, 
        page: pageStr = '1', 
        limit: limitStr = '50' 
      } = req.query;
      
      const page = parseInt(pageStr as string) || 1;
      const limit = parseInt(limitStr as string) || 50;

      if (!walletId) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Wallet ID is required',
        });
      }

      // Verify wallet ownership
      const wallet = await prisma.wallet.findFirst({
        where: {
          id: walletId,
          userId,
        },
      });

      if (!wallet) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Wallet not found or access denied',
        });
      }

      const where: any = { walletId };
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate as string);
        }
      }
      
      if (type) {
        where.type = type;
      }
      
      if (status) {
        where.status = status;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          include: {
            sourceWallet: {
              select: {
                id: true,
                currency: true,
                type: true,
              },
            },
            destinationWallet: {
              select: {
                id: true,
                currency: true,
                type: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.transaction.count({ where }),
      ]);

      // Calculate running balance
      let runningBalance = new Decimal(0);
      const statementItems = transactions.map(transaction => {
        const amount = new Decimal(transaction.amount);
        const fee = new Decimal(transaction.fee);
        const netAmount = new Decimal(transaction.netAmount);
        
        // Update running balance based on transaction type
        if (transaction.type === 'DEPOSIT') {
          runningBalance = runningBalance.plus(amount);
        } else if (transaction.type === 'WITHDRAWAL' || transaction.type === 'FEE') {
          runningBalance = runningBalance.minus(amount);
        } else if (transaction.type === 'TRANSFER') {
          if (transaction.sourceWalletId === walletId) {
            runningBalance = runningBalance.minus(amount);
          } else if (transaction.destinationWalletId === walletId) {
            runningBalance = runningBalance.plus(amount);
          }
        }

        return {
          id: transaction.id,
          type: transaction.type,
          status: transaction.status,
          amount: amount.toString(),
          fee: fee.toString(),
          netAmount: netAmount.toString(),
          description: transaction.description,
          referenceId: transaction.referenceId,
          sourceWalletId: transaction.sourceWalletId,
          destinationWalletId: transaction.destinationWalletId,
          exchangeRate: transaction.exchangeRate?.toString(),
          baseCurrency: transaction.baseCurrency,
          baseAmount: transaction.baseAmount?.toString(),
          runningBalance: runningBalance.toString(),
          createdAt: transaction.createdAt,
          processedAt: transaction.processedAt,
        };
      });

      const totalPages = Math.ceil(total / Number(limit));

      return res.json({
        success: true,
        data: {
          walletId,
          currency: wallet.currency,
          currentBalance: wallet.balance.toString(),
          statement: {
            items: statementItems,
            pagination: {
              page: Number(page),
              limit: Number(limit),
              total,
              totalPages,
              hasNext: Number(page) < totalPages,
              hasPrev: Number(page) > 1,
            },
          },
        },
      });
    } catch (error) {
      logger.error('Error getting wallet statement:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve wallet statement',
      });
    }
  }
}