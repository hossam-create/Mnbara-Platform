import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createTransactionSchema = z.object({
  businessAccountId: z.string(),
  accountId: z.string().optional(),
  type: z.enum(['DEBIT', 'CREDIT', 'TRANSFER_IN', 'TRANSFER_OUT', 'PAYMENT_RECEIVED', 'PAYMENT_SENT', 'REFUND', 'FEE']),
  category: z.enum(['SALES', 'PURCHASES', 'EXPENSES', 'TRANSFERS', 'FEES', 'INTEREST', 'TAXES', 'OTHER']),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('USD'),
  description: z.string().optional(),
  notes: z.string().optional(),
  counterpartyName: z.string().optional(),
  counterpartyAccount: z.string().optional(),
  counterpartyBank: z.string().optional(),
  metadata: z.object({}).optional(),
  invoiceId: z.string().optional(),
  expenseId: z.string().optional(),
});

const updateTransactionSchema = createTransactionSchema.partial().omit({
  businessAccountId: true,
  referenceNumber: true
});

// Get all transactions for user's businesses
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { page = 1, limit = 50, status, category, type, startDate, endDate } = req.query;

  const where: any = {
    businessAccount: {
      users: {
        some: {
          userId: user.id
        }
      }
    }
  };

  if (status) where.status = status;
  if (category) where.category = category;
  if (type) where.type = type;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate as string);
    if (endDate) where.createdAt.lte = new Date(endDate as string);
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        businessAccount: {
          select: {
            id: true,
            name: true
          }
        },
        account: {
          select: {
            id: true,
            name: true,
            accountNumber: true
          }
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true
          }
        },
        expense: {
          select: {
            id: true,
            merchantName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    }),
    prisma.transaction.count({ where })
  ]);

  res.json({
    success: true,
    data: transactions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get transactions for specific business
router.get('/business/:businessId', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessId } = req.params;
  const { page = 1, limit = 50, status, category, type, startDate, endDate } = req.query;

  // Check if user has access to this business
  const business = await prisma.businessAccount.findFirst({
    where: {
      id: businessId,
      users: {
        some: {
          userId: user.id
        }
      }
    }
  });

  if (!business) {
    throw createError('Business account not found', 404);
  }

  const where: any = {
    businessAccountId: businessId
  };

  if (status) where.status = status;
  if (category) where.category = category;
  if (type) where.type = type;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate as string);
    if (endDate) where.createdAt.lte = new Date(endDate as string);
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            name: true,
            accountNumber: true
          }
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true
          }
        },
        expense: {
          select: {
            id: true,
            merchantName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    }),
    prisma.transaction.count({ where })
  ]);

  res.json({
    success: true,
    data: transactions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get single transaction
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  const transaction = await prisma.transaction.findFirst({
    where: {
      id,
      businessAccount: {
        users: {
          some: {
            userId: user.id
          }
        }
      }
    },
    include: {
      businessAccount: {
        select: {
          id: true,
          name: true
        }
      },
      account: true,
      invoice: true,
      expense: true,
      aiAnalyses: {
        include: {
          businessAccount: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  if (!transaction) {
    throw createError('Transaction not found', 404);
  }

  res.json({
    success: true,
    data: transaction
  });
}));

// Create new transaction
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const validatedData = createTransactionSchema.parse(req.body);

  // Check if user has permission to create transactions for this business
  const business = await prisma.businessAccount.findFirst({
    where: {
      id: validatedData.businessAccountId,
      users: {
        some: {
          userId: user.id,
          role: {
            in: ['OWNER', 'ADMIN', 'FINANCE']
          }
        }
      }
    }
  });

  if (!business) {
    throw createError('Business account not found or insufficient permissions', 404);
  }

  // Generate unique reference number
  const referenceNumber = await generateReferenceNumber();

  const transaction = await prisma.transaction.create({
    data: {
      ...validatedData,
      referenceNumber,
      status: 'PENDING',
      metadata: validatedData.metadata || {}
    },
    include: {
      businessAccount: {
        select: {
          id: true,
          name: true
        }
      },
      account: {
        select: {
          id: true,
          name: true,
          accountNumber: true
        }
      }
    }
  });

  logger.info(`Transaction created: ${referenceNumber}`, {
    transactionId: transaction.id,
    businessId: business.id,
    userId: user.id,
    amount: transaction.amount,
    type: transaction.type
  });

  res.status(201).json({
    success: true,
    data: transaction
  });
}));

// Update transaction
router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;
  const validatedData = updateTransactionSchema.parse(req.body);

  // Check if user has permission to update this transaction
  const existingTransaction = await prisma.transaction.findFirst({
    where: {
      id,
      businessAccount: {
        users: {
          some: {
            userId: user.id,
            role: {
              in: ['OWNER', 'ADMIN', 'FINANCE']
            }
          }
        }
      }
    }
  });

  if (!existingTransaction) {
    throw createError('Transaction not found or insufficient permissions', 404);
  }

  // Don't allow updating completed transactions
  if (existingTransaction.status === 'COMPLETED') {
    throw createError('Cannot update completed transaction', 400);
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      ...validatedData,
      metadata: validatedData.metadata || {}
    },
    include: {
      businessAccount: {
        select: {
          id: true,
          name: true
        }
      },
      account: {
        select: {
          id: true,
          name: true,
          accountNumber: true
        }
      }
    }
  });

  logger.info(`Transaction updated: ${transaction.referenceNumber}`, {
    transactionId: transaction.id,
    userId: user.id
  });

  res.json({
    success: true,
    data: transaction
  });
}));

// Process transaction (mark as completed)
router.post('/:id/process', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  // Check if user has permission to process transactions
  const existingTransaction = await prisma.transaction.findFirst({
    where: {
      id,
      businessAccount: {
        users: {
          some: {
            userId: user.id,
            role: {
              in: ['OWNER', 'ADMIN', 'FINANCE']
            }
          }
        }
      }
    }
  });

  if (!existingTransaction) {
    throw createError('Transaction not found or insufficient permissions', 404);
  }

  if (existingTransaction.status !== 'PENDING') {
    throw createError('Transaction cannot be processed', 400);
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      processedAt: new Date()
    },
    include: {
      businessAccount: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  logger.info(`Transaction processed: ${transaction.referenceNumber}`, {
    transactionId: transaction.id,
    userId: user.id
  });

  res.json({
    success: true,
    data: transaction
  });
}));

// Cancel transaction
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  // Check if user has permission to cancel transactions
  const existingTransaction = await prisma.transaction.findFirst({
    where: {
      id,
      businessAccount: {
        users: {
          some: {
            userId: user.id,
            role: {
              in: ['OWNER', 'ADMIN', 'FINANCE']
            }
          }
        }
      }
    }
  });

  if (!existingTransaction) {
    throw createError('Transaction not found or insufficient permissions', 404);
  }

  if (existingTransaction.status === 'COMPLETED') {
    throw createError('Cannot cancel completed transaction', 400);
  }

  await prisma.transaction.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      failedAt: new Date(),
      failureReason: 'Cancelled by user'
    }
  });

  logger.info(`Transaction cancelled: ${existingTransaction.referenceNumber}`, {
    transactionId: id,
    userId: user.id
  });

  res.json({
    success: true,
    message: 'Transaction cancelled successfully'
  });
}));

// Helper function to generate unique reference number
async function generateReferenceNumber(): Promise<string> {
  const prefix = 'TXN';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

export default router;
