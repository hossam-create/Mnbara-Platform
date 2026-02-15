import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createExpenseSchema = z.object({
  businessAccountId: z.string(),
  merchantName: z.string().min(1, 'Merchant name is required'),
  merchantCategory: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  receiptNumber: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('USD'),
  taxAmount: z.number().default(0),
  expenseDate: z.string().transform(val => new Date(val)),
  category: z.enum(['OFFICE_SUPPLIES', 'TRAVEL', 'MEALS', 'ENTERTAINMENT', 'MARKETING', 'SOFTWARE', 'HARDWARE', 'UTILITIES', 'RENT', 'INSURANCE', 'LEGAL', 'ACCOUNTING', 'CONSULTING', 'TRAINING', 'OTHER']),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  attachments: z.array(z.string()).default([]),
  metadata: z.object({}).optional(),
});

const updateExpenseSchema = createExpenseSchema.partial().omit({
  businessAccountId: true
});

// Get all expenses for user's businesses
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { page = 1, limit = 50, status, category, startDate, endDate } = req.query;

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
  if (startDate || endDate) {
    where.expenseDate = {};
    if (startDate) where.expenseDate.gte = new Date(startDate as string);
    if (endDate) where.expenseDate.lte = new Date(endDate as string);
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        businessAccount: {
          select: {
            id: true,
            name: true
          }
        },
        transactions: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                accountNumber: true
              }
            }
          }
        },
        _count: {
          select: {
            transactions: true
          }
        }
      },
      orderBy: {
        expenseDate: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    }),
    prisma.expense.count({ where })
  ]);

  res.json({
    success: true,
    data: expenses,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get expenses for specific business
router.get('/business/:businessId', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessId } = req.params;
  const { page = 1, limit = 50, status, category, startDate, endDate } = req.query;

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
  if (startDate || endDate) {
    where.expenseDate = {};
    if (startDate) where.expenseDate.gte = new Date(startDate as string);
    if (endDate) where.expenseDate.lte = new Date(endDate as string);
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        transactions: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                accountNumber: true
              }
            }
          }
        },
        _count: {
          select: {
            transactions: true
          }
        }
      },
      orderBy: {
        expenseDate: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    }),
    prisma.expense.count({ where })
  ]);

  res.json({
    success: true,
    data: expenses,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get single expense
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  const expense = await prisma.expense.findFirst({
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
      transactions: {
        include: {
          account: {
            select: {
              id: true,
              name: true,
              accountNumber: true
            }
          }
        }
      }
    }
  });

  if (!expense) {
    throw createError('Expense not found', 404);
  }

  res.json({
    success: true,
    data: expense
  });
}));

// Create new expense
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const validatedData = createExpenseSchema.parse(req.body);

  // Check if user has permission to create expenses for this business
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

  const expense = await prisma.expense.create({
    data: {
      ...validatedData,
      status: 'PENDING',
      submittedAt: new Date(),
      metadata: validatedData.metadata || {}
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

  logger.info(`Expense created: ${expense.merchantName}`, {
    expenseId: expense.id,
    businessId: business.id,
    userId: user.id,
    amount: expense.amount,
    category: expense.category
  });

  res.status(201).json({
    success: true,
    data: expense
  });
}));

// Update expense
router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;
  const validatedData = updateExpenseSchema.parse(req.body);

  // Check if user has permission to update this expense
  const existingExpense = await prisma.expense.findFirst({
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

  if (!existingExpense) {
    throw createError('Expense not found or insufficient permissions', 404);
  }

  // Don't allow updating reimbursed expenses
  if (existingExpense.status === 'REIMBURSED') {
    throw createError('Cannot update reimbursed expense', 400);
  }

  const expense = await prisma.expense.update({
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
      }
    }
  });

  logger.info(`Expense updated: ${expense.merchantName}`, {
    expenseId: expense.id,
    userId: user.id
  });

  res.json({
    success: true,
    data: expense
  });
}));

// Approve expense
router.post('/:id/approve', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  // Check if user has permission to approve expenses
  const existingExpense = await prisma.expense.findFirst({
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

  if (!existingExpense) {
    throw createError('Expense not found or insufficient permissions', 404);
  }

  if (existingExpense.status !== 'PENDING') {
    throw createError('Expense cannot be approved', 400);
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: user.id
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

  logger.info(`Expense approved: ${expense.merchantName}`, {
    expenseId: expense.id,
    userId: user.id,
    approvedBy: user.id
  });

  res.json({
    success: true,
    data: expense
  });
}));

// Reject expense
router.post('/:id/reject', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;
  const { reason } = req.body;

  // Check if user has permission to reject expenses
  const existingExpense = await prisma.expense.findFirst({
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

  if (!existingExpense) {
    throw createError('Expense not found or insufficient permissions', 404);
  }

  if (existingExpense.status !== 'PENDING') {
    throw createError('Expense cannot be rejected', 400);
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      status: 'REJECTED',
      approvedBy: user.id,
      notes: reason || existingExpense.notes
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

  logger.info(`Expense rejected: ${expense.merchantName}`, {
    expenseId: expense.id,
    userId: user.id,
    reason
  });

  res.json({
    success: true,
    data: expense
  });
}));

// Mark expense as reimbursed
router.post('/:id/reimburse', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;
  const { reimbursementDate, reimbursementAmount } = req.body;

  // Check if user has permission to mark expenses as reimbursed
  const existingExpense = await prisma.expense.findFirst({
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

  if (!existingExpense) {
    throw createError('Expense not found or insufficient permissions', 404);
  }

  if (existingExpense.status !== 'APPROVED') {
    throw createError('Expense must be approved before reimbursement', 400);
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      status: 'REIMBURSED',
      reimbursedAt: new Date(reimbursementDate) || new Date()
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

  logger.info(`Expense reimbursed: ${expense.merchantName}`, {
    expenseId: expense.id,
    userId: user.id,
    reimbursementAmount: reimbursementAmount || existingExpense.amount
  });

  res.json({
    success: true,
    data: expense
  });
}));

// Delete expense
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  // Check if user has permission to delete expenses
  const existingExpense = await prisma.expense.findFirst({
    where: {
      id,
      businessAccount: {
        users: {
          some: {
            userId: user.id,
            role: {
              in: ['OWNER', 'ADMIN']
            }
          }
        }
      }
    }
  });

  if (!existingExpense) {
    throw createError('Expense not found or insufficient permissions', 404);
  }

  if (existingExpense.status === 'REIMBURSED') {
    throw createError('Cannot delete reimbursed expense', 400);
  }

  await prisma.expense.delete({
    where: { id }
  });

  logger.info(`Expense deleted: ${existingExpense.merchantName}`, {
    expenseId: id,
    userId: user.id
  });

  res.json({
    success: true,
    message: 'Expense deleted successfully'
  });
}));

// Get expense categories summary
router.get('/business/:businessId/categories', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessId } = req.params;
  const { startDate, endDate } = req.query;

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

  if (startDate || endDate) {
    where.expenseDate = {};
    if (startDate) where.expenseDate.gte = new Date(startDate as string);
    if (endDate) where.expenseDate.lte = new Date(endDate as string);
  }

  const categories = await prisma.expense.groupBy({
    by: ['category'],
    where,
    _sum: {
      amount: true
    },
    _count: {
      id: true
    },
    orderBy: {
      _sum: {
        amount: 'desc'
      }
    }
  });

  res.json({
    success: true,
    data: categories.map(cat => ({
      category: cat.category,
      totalAmount: cat._sum.amount || 0,
      count: cat._count.id
    }))
  });
}));

export default router;
