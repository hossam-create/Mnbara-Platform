import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { AccountingEngine } from '../services/accounting/AccountingEngine';

const router = Router();
const prisma = new PrismaClient();
const accountingEngine = new AccountingEngine(prisma);

// Validation schemas
const createJournalEntrySchema = z.object({
  businessAccountId: z.string(),
  entryDate: z.string().transform(val => new Date(val)),
  description: z.string().min(1, 'Description is required'),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  lines: z.array(z.object({
    accountId: z.string(),
    description: z.string().optional(),
    debitAmount: z.number().min(0),
    creditAmount: z.number().min(0),
    referenceType: z.string().optional(),
    referenceId: z.string().optional()
  })).min(2, 'At least 2 lines required'),
  isAdjustingEntry: z.boolean().default(false),
  isClosingEntry: z.boolean().default(false)
});

const createChartOfAccountSchema = z.object({
  businessAccountId: z.string(),
  accountCode: z.string().min(1, 'Account code is required'),
  accountName: z.string().min(1, 'Account name is required'),
  accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'CONTRA_ASSET', 'CONTRA_REVENUE']),
  accountSubtype: z.string().optional(),
  normalBalance: z.enum(['DEBIT', 'CREDIT']),
  parentAccountId: z.string().optional(),
  description: z.string().optional()
});

const createFiscalPeriodSchema = z.object({
  businessAccountId: z.string(),
  periodType: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  periodStart: z.string().transform(val => new Date(val)),
  periodEnd: z.string().transform(val => new Date(val)),
  fiscalYear: z.number(),
  fiscalQuarter: z.number().optional(),
  fiscalMonth: z.number().optional(),
  notes: z.string().optional()
});

// Chart of Accounts Routes

// Get chart of accounts for business
router.get('/chart-of-accounts', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId } = req.query;

  if (!businessAccountId) {
    throw createError('Business account ID is required', 400);
  }

  // Check if user has access to this business
  const business = await prisma.businessAccount.findFirst({
    where: {
      id: businessAccountId as string,
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

  const chartOfAccounts = await prisma.chartOfAccount.findMany({
    where: {
      businessAccountId: businessAccountId as string,
      isActive: true
    },
    include: {
      parentAccount: {
        select: {
          id: true,
          accountCode: true,
          accountName: true
        }
      },
      childAccounts: {
        select: {
          id: true,
          accountCode: true,
          accountName: true
        }
      }
    },
    orderBy: {
      accountCode: 'asc'
    }
  });

  res.json({
    success: true,
    data: chartOfAccounts
  });
}));

// Create chart of account
router.post('/chart-of-accounts', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const validatedData = createChartOfAccountSchema.parse(req.body);

  // Check if user has permission to create chart of accounts
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

  const chartOfAccount = await prisma.chartOfAccount.create({
    data: {
      ...validatedData,
      level: validatedData.parentAccountId ? 2 : 1
    },
    include: {
      parentAccount: {
        select: {
          id: true,
          accountCode: true,
          accountName: true
        }
      }
    }
  });

  logger.info(`Chart of account created: ${chartOfAccount.accountCode}`, {
    accountId: chartOfAccount.id,
    businessId: business.id,
    userId: user.id
  });

  res.status(201).json({
    success: true,
    data: chartOfAccount
  });
}));

// Journal Entries Routes

// Get journal entries
router.get('/journal-entries', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId, fiscalPeriodId, status, page = 1, limit = 50 } = req.query;

  let whereClause: any = {
    businessAccount: {
      users: {
        some: {
          userId: user.id
        }
      }
    }
  };

  if (businessAccountId) whereClause.businessAccountId = businessAccountId;
  if (fiscalPeriodId) whereClause.fiscalPeriodId = fiscalPeriodId;
  if (status) whereClause.status = status;

  const [journalEntries, total] = await Promise.all([
    prisma.journalEntry.findMany({
      where: whereClause,
      include: {
        businessAccount: {
          select: {
            id: true,
            name: true
          }
        },
        fiscalPeriod: {
          select: {
            id: true,
            periodStart: true,
            periodEnd: true,
            status: true
          }
        },
        lines: {
          include: {
            account: {
              select: {
                id: true,
                accountCode: true,
                accountName: true,
                normalBalance: true
              }
            }
          }
        }
      },
      orderBy: {
        entryDate: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    }),
    prisma.journalEntry.count({ where: whereClause })
  ]);

  res.json({
    success: true,
    data: journalEntries,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Create journal entry
router.post('/journal-entries', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const validatedData = createJournalEntrySchema.parse(req.body);

  // Check if user has permission to create journal entries
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

  const journalEntry = await accountingEngine.createJournalEntry(validatedData, user.id);

  res.status(201).json({
    success: true,
    data: journalEntry
  });
}));

// Post journal entry
router.post('/journal-entries/:id/post', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  // Check if user has permission to post journal entries
  const journalEntry = await prisma.journalEntry.findFirst({
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

  if (!journalEntry) {
    throw createError('Journal entry not found or insufficient permissions', 404);
  }

  const postedEntry = await accountingEngine.postJournalEntry(id, user.id);

  res.json({
    success: true,
    data: postedEntry
  });
}));

// Fiscal Periods Routes

// Get fiscal periods
router.get('/fiscal-periods', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId, status } = req.query;

  let whereClause: any = {
    businessAccount: {
      users: {
        some: {
          userId: user.id
        }
      }
    }
  };

  if (businessAccountId) whereClause.businessAccountId = businessAccountId;
  if (status) whereClause.status = status;

  const fiscalPeriods = await prisma.fiscalPeriod.findMany({
    where: whereClause,
    include: {
      businessAccount: {
        select: {
          id: true,
          name: true
        }
      },
      _count: {
        select: {
          journalEntries: true
        }
      }
    },
    orderBy: {
      periodStart: 'desc'
    }
  });

  res.json({
    success: true,
    data: fiscalPeriods
  });
}));

// Create fiscal period
router.post('/fiscal-periods', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const validatedData = createFiscalPeriodSchema.parse(req.body);

  // Check if user has permission to create fiscal periods
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

  const fiscalPeriod = await prisma.fiscalPeriod.create({
    data: validatedData,
    include: {
      businessAccount: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  logger.info(`Fiscal period created: ${fiscalPeriod.periodType}`, {
    periodId: fiscalPeriod.id,
    businessId: business.id,
    userId: user.id
  });

  res.status(201).json({
    success: true,
    data: fiscalPeriod
  });
}));

// Lock fiscal period
router.post('/fiscal-periods/:id/lock', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  // Check if user has permission to lock fiscal periods
  const fiscalPeriod = await prisma.fiscalPeriod.findFirst({
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

  if (!fiscalPeriod) {
    throw createError('Fiscal period not found or insufficient permissions', 404);
  }

  if (fiscalPeriod.status === 'LOCKED') {
    throw createError('Fiscal period is already locked', 400);
  }

  const lockedPeriod = await prisma.fiscalPeriod.update({
    where: { id },
    data: {
      status: 'LOCKED',
      lockedAt: new Date(),
      lockedBy: user.id
    }
  });

  logger.info(`Fiscal period locked: ${id}`, {
    periodId: id,
    userId: user.id
  });

  res.json({
    success: true,
    data: lockedPeriod
  });
}));

// Unlock fiscal period
router.post('/fiscal-periods/:id/unlock', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  // Check if user has permission to unlock fiscal periods
  const fiscalPeriod = await prisma.fiscalPeriod.findFirst({
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

  if (!fiscalPeriod) {
    throw createError('Fiscal period not found or insufficient permissions', 404);
  }

  if (fiscalPeriod.status !== 'LOCKED') {
    throw createError('Fiscal period is not locked', 400);
  }

  const unlockedPeriod = await prisma.fiscalPeriod.update({
    where: { id },
    data: {
      status: 'OPEN',
      lockedAt: null,
      lockedBy: null
    }
  });

  logger.info(`Fiscal period unlocked: ${id}`, {
    periodId: id,
    userId: user.id
  });

  res.json({
    success: true,
    data: unlockedPeriod
  });
}));

// Reports Routes

// Get trial balance
router.get('/reports/trial-balance', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId, fiscalPeriodId } = req.query;

  if (!businessAccountId || !fiscalPeriodId) {
    throw createError('Business account ID and fiscal period ID are required', 400);
  }

  // Check if user has access to this business
  const business = await prisma.businessAccount.findFirst({
    where: {
      id: businessAccountId as string,
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

  const trialBalance = await accountingEngine.getTrialBalance(
    businessAccountId as string,
    fiscalPeriodId as string
  );

  res.json({
    success: true,
    data: trialBalance
  });
}));

// Get balance sheet
router.get('/reports/balance-sheet', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId, fiscalPeriodId } = req.query;

  if (!businessAccountId || !fiscalPeriodId) {
    throw createError('Business account ID and fiscal period ID are required', 400);
  }

  // Check if user has access to this business
  const business = await prisma.businessAccount.findFirst({
    where: {
      id: businessAccountId as string,
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

  const balanceSheet = await accountingEngine.getBalanceSheet(
    businessAccountId as string,
    fiscalPeriodId as string
  );

  res.json({
    success: true,
    data: balanceSheet
  });
}));

// Get profit and loss
router.get('/reports/profit-loss', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId, fiscalPeriodId } = req.query;

  if (!businessAccountId || !fiscalPeriodId) {
    throw createError('Business account ID and fiscal period ID are required', 400);
  }

  // Check if user has access to this business
  const business = await prisma.businessAccount.findFirst({
    where: {
      id: businessAccountId as string,
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

  const profitAndLoss = await accountingEngine.getProfitAndLoss(
    businessAccountId as string,
    fiscalPeriodId as string
  );

  res.json({
    success: true,
    data: profitAndLoss
  });
}));

// Audit Log Routes

// Get accounting audit log
router.get('/audit-log', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId, tableName, action, page = 1, limit = 50 } = req.query;

  let whereClause: any = {
    businessAccount: {
      users: {
        some: {
          userId: user.id
        }
      }
    }
  };

  if (businessAccountId) whereClause.businessAccountId = businessAccountId;
  if (tableName) whereClause.tableName = tableName;
  if (action) whereClause.action = action;

  const [auditLogs, total] = await Promise.all([
    prisma.accountingAuditLog.findMany({
      where: whereClause,
      include: {
        businessAccount: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    }),
    prisma.accountingAuditLog.count({ where: whereClause })
  ]);

  res.json({
    success: true,
    data: auditLogs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

export default router;
