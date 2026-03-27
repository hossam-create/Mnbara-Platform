import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Decimal } from 'decimal.js';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import { TransactionStatus, TransactionType } from '@prisma/client';
import { 
  validateDeposit, 
  validateWithdrawal, 
  validateTransfer 
} from '../utils/validation';
import { createAuditLog } from '../utils/audit';
import { checkWalletLimits } from '../utils/walletLimits';
import { createJournalEntries } from '../utils/journalEntries';
import { updateWalletBalance } from '../utils/walletBalance';

export class TransactionController {
  async createDeposit(req: AuthRequest, res: Response) {
    try {
      const { error, value } = validateDeposit.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.details.map(d => d.message),
        });
      }

      const { walletId, amount, currency, description, referenceId, metadata } = value;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      // Get wallet and verify ownership
      const wallet = await prisma.wallet.findFirst({
        where: { id: walletId, userId },
        include: { user: true },
      });

      if (!wallet) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Wallet not found or access denied',
        });
      }

      if (wallet.isFrozen) {
        return res.status(423).json({
          error: 'Wallet frozen',
          message: 'Wallet is frozen and cannot accept deposits',
        });
      }

      // Check deposit limits
      const limitCheck = await checkWalletLimits({
        walletId,
        transactionType: 'DEPOSIT',
        amount: new Decimal(amount),
        currency,
      });

      if (!limitCheck.allowed) {
        return res.status(400).json({
          error: 'Limit exceeded',
          message: limitCheck.message,
        });
      }

      // Create transaction
      const transaction = await prisma.transaction.create({
        data: {
          walletId,
          userId,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.PENDING,
          amount: new Decimal(amount),
          currency,
          fee: new Decimal(0), // Deposits typically have no fees
          netAmount: new Decimal(amount),
          description,
          referenceId,
          metadata,
        },
      });

      try {
        // Process the deposit
        await this.processDeposit(transaction.id);
        
        // Get updated transaction
        const updatedTransaction = await prisma.transaction.findUnique({
          where: { id: transaction.id },
          include: {
            wallet: {
              select: {
                id: true,
                currency: true,
                balance: true,
                availableBalance: true,
              },
            },
          },
        });

        if (!updatedTransaction) {
          return res.status(404).json({
            error: 'Not found',
            message: 'Transaction not found',
          });
        }

        // Create audit log
        await createAuditLog({
          userId: userId!,
          walletId,
          transactionId: transaction.id,
          action: 'DEPOSIT_CREATED',
          resourceType: 'transaction',
          resourceId: transaction.id,
          newValue: updatedTransaction,
          ipAddress: req.ip || '',
          userAgent: req.get('User-Agent') || '',
        });

        logger.info(`Deposit created: ${transaction.id} for wallet ${walletId}`);

        return res.status(201).json({
          success: true,
          data: {
            id: updatedTransaction.id,
            type: updatedTransaction.type,
            status: updatedTransaction.status,
            amount: updatedTransaction.amount.toString(),
            currency: updatedTransaction.currency,
            fee: updatedTransaction.fee.toString(),
            netAmount: updatedTransaction.netAmount.toString(),
            description: updatedTransaction.description,
            referenceId: updatedTransaction.referenceId,
            processedAt: updatedTransaction.processedAt,
            createdAt: updatedTransaction.createdAt,
            wallet: {
              id: updatedTransaction.wallet.id,
              currency: updatedTransaction.wallet.currency,
              balance: updatedTransaction.wallet.balance.toString(),
              availableBalance: updatedTransaction.wallet.availableBalance.toString(),
            },
          },
        });
      } catch (processError) {
        // Mark transaction as failed
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.FAILED,
            failedAt: new Date(),
            failureReason: processError instanceof Error ? processError.message : 'Unknown error',
          },
        });

        throw processError;
      }
    } catch (error) {
      logger.error('Error creating deposit:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create deposit',
      });
    }
  }

  async createWithdrawal(req: AuthRequest, res: Response) {
    try {
      const { error, value } = validateWithdrawal.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.details.map(d => d.message),
        });
      }

      const { walletId, amount, currency, description, referenceId, metadata } = value;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      // Get wallet and verify ownership
      const wallet = await prisma.wallet.findFirst({
        where: { id: walletId, userId },
        include: { user: true },
      });

      if (!wallet) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Wallet not found or access denied',
        });
      }

      if (wallet.isFrozen) {
        return res.status(423).json({
          error: 'Wallet frozen',
          message: 'Wallet is frozen and cannot process withdrawals',
        });
      }

      const withdrawalAmount = new Decimal(amount);
      
      // Check sufficient balance
      if (wallet.availableBalance.lt(withdrawalAmount)) {
        return res.status(400).json({
          error: 'Insufficient balance',
          message: 'Available balance is insufficient for this withdrawal',
        });
      }

      // Check withdrawal limits
      const limitCheck = await checkWalletLimits({
        walletId,
        transactionType: 'WITHDRAWAL',
        amount: withdrawalAmount,
        currency,
      });

      if (!limitCheck.allowed) {
        return res.status(400).json({
          error: 'Limit exceeded',
          message: limitCheck.message,
        });
      }

      // Calculate withdrawal fee (you can make this configurable)
      const fee = withdrawalAmount.mul(0.01); // 1% fee
      const netAmount = withdrawalAmount.minus(fee);

      // Create transaction
      const transaction = await prisma.transaction.create({
        data: {
          walletId,
          userId: userId!,
          type: TransactionType.WITHDRAWAL,
          status: TransactionStatus.PENDING,
          amount: withdrawalAmount,
          currency,
          fee,
          netAmount,
          description,
          referenceId,
          metadata,
        },
      });

      try {
        // Process the withdrawal
        await this.processWithdrawal(transaction.id);
        
        // Get updated transaction
        const updatedTransaction = await prisma.transaction.findUnique({
          where: { id: transaction.id },
          include: {
            wallet: {
              select: {
                id: true,
                currency: true,
                balance: true,
                availableBalance: true,
              },
            },
          },
        });

        if (!updatedTransaction) {
          return res.status(404).json({
            error: 'Not found',
            message: 'Transaction not found',
          });
        }

        // Create audit log
        await createAuditLog({
          userId: userId!,
          walletId,
          transactionId: transaction.id,
          action: 'WITHDRAWAL_CREATED',
          resourceType: 'transaction',
          resourceId: transaction.id,
          newValue: updatedTransaction,
          ipAddress: req.ip || '',
          userAgent: req.get('User-Agent') || '',
        });

        logger.info(`Withdrawal created: ${transaction.id} for wallet ${walletId}`);

        return res.status(201).json({
          success: true,
          data: {
            id: updatedTransaction.id,
            type: updatedTransaction.type,
            status: updatedTransaction.status,
            amount: updatedTransaction.amount.toString(),
            currency: updatedTransaction.currency,
            fee: updatedTransaction.fee.toString(),
            netAmount: updatedTransaction.netAmount.toString(),
            description: updatedTransaction.description,
            referenceId: updatedTransaction.referenceId,
            processedAt: updatedTransaction.processedAt,
            createdAt: updatedTransaction.createdAt,
            wallet: {
              id: updatedTransaction.wallet.id,
              currency: updatedTransaction.wallet.currency,
              balance: updatedTransaction.wallet.balance.toString(),
              availableBalance: updatedTransaction.wallet.availableBalance.toString(),
            },
          },
        });
      } catch (processError) {
        // Mark transaction as failed
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.FAILED,
            failedAt: new Date(),
            failureReason: processError instanceof Error ? processError.message : 'Unknown error',
          },
        });

        throw processError;
      }
    } catch (error) {
      logger.error('Error creating withdrawal:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create withdrawal',
      });
    }
  }

  async createTransfer(req: AuthRequest, res: Response) {
    try {
      const { error, value } = validateTransfer.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.details.map(d => d.message),
        });
      }

      const { 
        sourceWalletId, 
        destinationWalletId, 
        amount, 
        currency, 
        description, 
        referenceId, 
        metadata 
      } = value;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
      }

      // Verify both wallets belong to the user (for now, can be extended for inter-user transfers)
      const [sourceWallet, destinationWallet] = await Promise.all([
        prisma.wallet.findFirst({
          where: { id: sourceWalletId, userId },
          include: { user: true },
        }),
        prisma.wallet.findFirst({
          where: { id: destinationWalletId, userId },
          include: { user: true },
        }),
      ]);

      if (!sourceWallet || !destinationWallet) {
        return res.status(404).json({
          error: 'Not found',
          message: 'One or both wallets not found or access denied',
        });
      }

      if (sourceWallet.isFrozen || destinationWallet.isFrozen) {
        return res.status(423).json({
          error: 'Wallet frozen',
          message: 'One or both wallets are frozen and cannot process transfers',
        });
      }

      if (sourceWallet.currency !== destinationWallet.currency) {
        return res.status(400).json({
          error: 'Currency mismatch',
          message: 'Source and destination wallets must have the same currency',
        });
      }

      const transferAmount = new Decimal(amount);
      
      // Check sufficient balance in source wallet
      if (sourceWallet.availableBalance.lt(transferAmount)) {
        return res.status(400).json({
          error: 'Insufficient balance',
          message: 'Available balance is insufficient for this transfer',
        });
      }

      // Check transfer limits for source wallet
      const limitCheck = await checkWalletLimits({
        walletId: sourceWalletId,
        transactionType: 'TRANSFER',
        amount: transferAmount,
        currency,
      });

      if (!limitCheck.allowed) {
        return res.status(400).json({
          error: 'Limit exceeded',
          message: limitCheck.message,
        });
      }

      // Calculate transfer fee (you can make this configurable)
      const fee = transferAmount.mul(0.005); // 0.5% fee
      const netAmount = transferAmount.minus(fee);

      // Create transaction
      const transaction = await prisma.transaction.create({
        data: {
          walletId: sourceWalletId,
          userId: userId!,
          type: TransactionType.TRANSFER,
          status: TransactionStatus.PENDING,
          amount: transferAmount,
          currency,
          fee,
          netAmount,
          description,
          referenceId,
          sourceWalletId,
          destinationWalletId,
          metadata,
        },
      });

      try {
        // Process the transfer
        await this.processTransfer(transaction.id);
        
        // Get updated transaction
        const updatedTransaction = await prisma.transaction.findUnique({
          where: { id: transaction.id },
          include: {
            wallet: {
              select: {
                id: true,
                currency: true,
                balance: true,
                availableBalance: true,
              },
            },
            sourceWallet: {
              select: {
                id: true,
                currency: true,
                balance: true,
                availableBalance: true,
              },
            },
            destinationWallet: {
              select: {
                id: true,
                currency: true,
                balance: true,
                availableBalance: true,
              },
            },
          },
        });

        if (!updatedTransaction) {
          return res.status(404).json({
            error: 'Not found',
            message: 'Transaction not found',
          });
        }

        // Create audit log
        await createAuditLog({
          userId: userId!,
          walletId: sourceWalletId,
          transactionId: transaction.id,
          action: 'TRANSFER_CREATED',
          resourceType: 'transaction',
          resourceId: transaction.id,
          newValue: updatedTransaction,
          ipAddress: req.ip || '',
          userAgent: req.get('User-Agent') || '',
        });

        logger.info(`Transfer created: ${transaction.id} from ${sourceWalletId} to ${destinationWalletId}`);

        return res.status(201).json({
          success: true,
          data: {
            id: updatedTransaction.id,
            type: updatedTransaction.type,
            status: updatedTransaction.status,
            amount: updatedTransaction.amount.toString(),
            currency: updatedTransaction.currency,
            fee: updatedTransaction.fee.toString(),
            netAmount: updatedTransaction.netAmount.toString(),
            description: updatedTransaction.description,
            referenceId: updatedTransaction.referenceId,
            processedAt: updatedTransaction.processedAt,
            createdAt: updatedTransaction.createdAt,
            sourceWallet: updatedTransaction.sourceWallet ? {
              id: updatedTransaction.sourceWallet.id,
              currency: updatedTransaction.sourceWallet.currency,
              balance: updatedTransaction.sourceWallet.balance.toString(),
              availableBalance: updatedTransaction.sourceWallet.availableBalance.toString(),
            } : null,
            destinationWallet: updatedTransaction.destinationWallet ? {
              id: updatedTransaction.destinationWallet.id,
              currency: updatedTransaction.destinationWallet.currency,
              balance: updatedTransaction.destinationWallet.balance.toString(),
              availableBalance: updatedTransaction.destinationWallet.availableBalance.toString(),
            } : null,
          },
        });
      } catch (processError) {
        // Mark transaction as failed
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.FAILED,
            failedAt: new Date(),
            failureReason: processError instanceof Error ? processError.message : 'Unknown error',
          },
        });

        throw processError;
      }
    } catch (error) {
      logger.error('Error creating transfer:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create transfer',
      });
    }
  }

  async getTransaction(req: AuthRequest, res: Response) {
    try {
      const { transactionId } = req.params;
      const userId = req.user?.id;

      if (!transactionId) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Transaction ID is required',
        });
      }

      const transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          userId: userId!, // Ensure user can only access their own transactions
        },
        include: {
          wallet: {
            select: {
              id: true,
              currency: true,
              type: true,
            },
          },
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
      });

      if (!transaction) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Transaction not found or access denied',
        });
      }

      return res.json({
        success: true,
        data: {
          id: transaction.id,
          type: transaction.type,
          status: transaction.status,
          amount: transaction.amount.toString(),
          currency: transaction.currency,
          fee: transaction.fee.toString(),
          netAmount: transaction.netAmount.toString(),
          description: transaction.description,
          referenceId: transaction.referenceId,
          sourceWalletId: transaction.sourceWalletId,
          destinationWalletId: transaction.destinationWalletId,
          exchangeRate: transaction.exchangeRate?.toString(),
          baseCurrency: transaction.baseCurrency,
          baseAmount: transaction.baseAmount?.toString(),
          metadata: transaction.metadata,
          processedAt: transaction.processedAt,
          failedAt: transaction.failedAt,
          failureReason: transaction.failureReason,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
          wallet: transaction.wallet,
          sourceWallet: transaction.sourceWallet,
          destinationWallet: transaction.destinationWallet,
        },
      });
    } catch (error) {
      logger.error('Error getting transaction:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve transaction',
      });
    }
  }

  async getTransactions(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const {
        walletId,
        type,
        status,
        currency,
        startDate,
        endDate,
        page = 1,
        limit = 50,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const where: any = { userId };
      
      if (walletId) {
        where.walletId = walletId;
      }
      
      if (type) {
        where.type = type;
      }
      
      if (status) {
        where.status = status;
      }
      
      if (currency) {
        where.currency = currency;
      }
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate as string);
        }
      }

      const skip = (Number(page) - 1) * Number(limit);
      const orderBy = { [sortBy as string]: sortOrder as string };

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          include: {
            wallet: {
              select: {
                id: true,
                currency: true,
                type: true,
              },
            },
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
          orderBy,
          skip,
          take: Number(limit),
        }),
        prisma.transaction.count({ where }),
      ]);

      const totalPages = Math.ceil(total / Number(limit));

      res.status(200).json({
        success: true,
        data: {
          transactions: transactions.map(transaction => ({
            id: transaction.id,
            type: transaction.type,
            status: transaction.status,
            amount: transaction.amount.toString(),
            currency: transaction.currency,
            fee: transaction.fee.toString(),
            netAmount: transaction.netAmount.toString(),
            description: transaction.description,
            referenceId: transaction.referenceId,
            sourceWalletId: transaction.sourceWalletId,
            destinationWalletId: transaction.destinationWalletId,
            processedAt: transaction.processedAt,
            failedAt: transaction.failedAt,
            failureReason: transaction.failureReason,
            createdAt: transaction.createdAt,
            wallet: transaction.wallet,
            sourceWallet: transaction.sourceWallet,
            destinationWallet: transaction.destinationWallet,
          })),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages,
            hasNext: Number(page) < totalPages,
            hasPrev: Number(page) > 1,
          },
        },
      });
    } catch (error) {
      logger.error('Error getting transactions:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve transactions',
      });
    }
  }

  // Internal transaction processing methods
  private async processDeposit(transactionId: string): Promise<void> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new Error('Transaction is not in pending status');
    }

    const amount = new Decimal(transaction.amount);

    try {
      // Start database transaction
      await prisma.$transaction(async (tx) => {
        // Update transaction status
        await tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: TransactionStatus.PROCESSING,
          },
        });

        // Update wallet balance
        await updateWalletBalance(
          transaction.walletId,
          amount.toNumber(),
          'DEPOSIT',
          tx
        );

        // Create journal entries
        await createJournalEntries({
          transactionId,
          walletId: transaction.walletId,
          userId: transaction.userId,
          amount,
          currency: transaction.currency,
          transactionType: 'DEPOSIT',
          tx,
        });

        // Update transaction as completed
        await tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: TransactionStatus.COMPLETED,
            processedAt: new Date(),
          },
        });
      });

      logger.info(`Deposit processed successfully: ${transactionId}`);
    } catch (error) {
      logger.error('Error processing deposit:', error);
      throw new Error('Failed to process deposit');
    }
  }

  private async processWithdrawal(transactionId: string): Promise<void> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new Error('Transaction is not in pending status');
    }

    const amount = new Decimal(transaction.amount);
    const fee = new Decimal(transaction.fee);
    const totalAmount = amount.plus(fee);

    try {
      // Start database transaction
      await prisma.$transaction(async (tx) => {
        // Update transaction status
        await tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: TransactionStatus.PROCESSING,
          },
        });

        // Update wallet balance
        await updateWalletBalance(
          transaction.walletId,
          totalAmount.negated().toNumber(), // Negative for withdrawal
          'WITHDRAWAL',
          tx
        );

        // Create journal entries
        await createJournalEntries({
          transactionId,
          walletId: transaction.walletId,
          userId: transaction.userId,
          amount,
          fee,
          currency: transaction.currency,
          transactionType: 'WITHDRAWAL',
          tx,
        });

        // Update transaction as completed
        await tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: TransactionStatus.COMPLETED,
            processedAt: new Date(),
          },
        });
      });

      logger.info(`Withdrawal processed successfully: ${transactionId}`);
    } catch (error) {
      logger.error('Error processing withdrawal:', error);
      throw new Error('Failed to process withdrawal');
    }
  }

  private async processTransfer(transactionId: string): Promise<void> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { 
        wallet: true,
        sourceWallet: true,
        destinationWallet: true,
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.PENDING) {
      throw new Error('Transaction is not in pending status');
    }

    if (!transaction.sourceWalletId || !transaction.destinationWalletId) {
      throw new Error('Source and destination wallet IDs are required for transfer');
    }

    const amount = new Decimal(transaction.amount);
    const fee = new Decimal(transaction.fee);
    const totalAmount = amount.plus(fee);

    try {
      // Start database transaction
      await prisma.$transaction(async (tx) => {
        // Update transaction status
        await tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: TransactionStatus.PROCESSING,
          },
        });

        // Update source wallet balance (debit)
        await updateWalletBalance(
          transaction.sourceWalletId!,
          totalAmount.negated().toNumber(), // Negative for debit
          'TRANSFER_OUT',
          tx
        );

        // Update destination wallet balance (credit)
        await updateWalletBalance(
          transaction.destinationWalletId!,
          amount.toNumber(), // Positive for credit
          'TRANSFER_IN',
          tx
        );

        // Create journal entries for both sides
        if (transaction.destinationWalletId) {
          await createJournalEntries({
            transactionId,
            walletId: transaction.sourceWalletId!,
            userId: transaction.userId,
            amount,
            fee,
            currency: transaction.currency,
            transactionType: 'TRANSFER',
            destinationWalletId: transaction.destinationWalletId,
            tx,
          });
        }

        // Update transaction as completed
        await tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: TransactionStatus.COMPLETED,
            processedAt: new Date(),
          },
        });
      });

      logger.info(`Transfer processed successfully: ${transactionId}`);
    } catch (error) {
      logger.error('Error processing transfer:', error);
      throw new Error('Failed to process transfer');
    }
  }
}