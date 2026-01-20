import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createReportSchema = z.object({
  businessAccountId: z.string(),
  reportType: z.enum(['PROFIT_AND_LOSS', 'BALANCE_SHEET', 'CASH_FLOW', 'SALES_REPORT', 'EXPENSE_REPORT', 'TAX_REPORT', 'CUSTOM']),
  period: z.string(),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().transform(val => new Date(val)),
  data: z.object({}),
  summary: z.object({}),
  charts: z.object({}).optional(),
  aiInsights: z.object({}).optional(),
  recommendations: z.object({}).optional(),
  metadata: z.object({}).optional(),
});

const updateReportSchema = createReportSchema.partial().omit({
  businessAccountId: true
});

// Get all reports for user's businesses
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { page = 1, limit = 50, reportType, status, startDate, endDate } = req.query;

  const where: any = {
    businessAccount: {
      users: {
        some: {
          userId: user.id
        }
      }
    }
  };

  if (reportType) where.reportType = reportType;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.startDate = {};
    if (startDate) where.startDate.gte = new Date(startDate as string);
    if (endDate) where.startDate.lte = new Date(endDate as string);
  }

  const [reports, total] = await Promise.all([
    prisma.financialReport.findMany({
      where,
      include: {
        businessAccount: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        generatedAt: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    }),
    prisma.financialReport.count({ where })
  ]);

  res.json({
    success: true,
    data: reports,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get reports for specific business
router.get('/business/:businessId', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessId } = req.params;
  const { page = 1, limit = 50, reportType, status } = req.query;

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

  if (reportType) where.reportType = reportType;
  if (status) where.status = status;

  const [reports, total] = await Promise.all([
    prisma.financialReport.findMany({
      where,
      orderBy: {
        generatedAt: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    }),
    prisma.financialReport.count({ where })
  ]);

  res.json({
    success: true,
    data: reports,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get single report
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  const report = await prisma.financialReport.findFirst({
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
      }
    }
  });

  if (!report) {
    throw createError('Report not found', 404);
  }

  res.json({
    success: true,
    data: report
  });
}));

// Create new report
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const validatedData = createReportSchema.parse(req.body);

  // Check if user has permission to create reports for this business
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

  const report = await prisma.financialReport.create({
    data: {
      ...validatedData,
      status: 'DRAFT',
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

  logger.info(`Report created: ${report.reportType}`, {
    reportId: report.id,
    businessId: business.id,
    userId: user.id,
    period: report.period
  });

  res.status(201).json({
    success: true,
    data: report
  });
}));

// Update report
router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;
  const validatedData = updateReportSchema.parse(req.body);

  // Check if user has permission to update this report
  const existingReport = await prisma.financialReport.findFirst({
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

  if (!existingReport) {
    throw createError('Report not found or insufficient permissions', 404);
  }

  const report = await prisma.financialReport.update({
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

  logger.info(`Report updated: ${report.reportType}`, {
    reportId: report.id,
    userId: user.id
  });

  res.json({
    success: true,
    data: report
  });
}));

// Generate report (change status to GENERATING then COMPLETED)
router.post('/:id/generate', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  // Check if user has permission to generate reports
  const existingReport = await prisma.financialReport.findFirst({
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

  if (!existingReport) {
    throw createError('Report not found or insufficient permissions', 404);
  }

  if (existingReport.status !== 'DRAFT') {
    throw createError('Report cannot be generated', 400);
  }

  // Update status to GENERATING
  await prisma.financialReport.update({
    where: { id },
    data: {
      status: 'GENERATING'
    }
  });

  // Generate report data based on type
  const reportData = await generateReportData(existingReport);

  const report = await prisma.financialReport.update({
    where: { id },
    data: {
      ...reportData,
      status: 'COMPLETED',
      generatedAt: new Date()
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

  logger.info(`Report generated: ${report.reportType}`, {
    reportId: report.id,
    userId: user.id,
    period: report.period
  });

  res.json({
    success: true,
    data: report
  });
}));

// Publish report
router.post('/:id/publish', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  // Check if user has permission to publish reports
  const existingReport = await prisma.financialReport.findFirst({
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

  if (!existingReport) {
    throw createError('Report not found or insufficient permissions', 404);
  }

  if (existingReport.status !== 'COMPLETED') {
    throw createError('Report must be completed before publishing', 400);
  }

  const report = await prisma.financialReport.update({
    where: { id },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date()
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

  logger.info(`Report published: ${report.reportType}`, {
    reportId: report.id,
    userId: user.id
  });

  res.json({
    success: true,
    data: report
  });
}));

// Delete report
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  // Check if user has permission to delete reports
  const existingReport = await prisma.financialReport.findFirst({
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

  if (!existingReport) {
    throw createError('Report not found or insufficient permissions', 404);
  }

  if (existingReport.status === 'PUBLISHED') {
    throw createError('Cannot delete published report', 400);
  }

  await prisma.financialReport.delete({
    where: { id }
  });

  logger.info(`Report deleted: ${existingReport.reportType}`, {
    reportId: id,
    userId: user.id
  });

  res.json({
    success: true,
    message: 'Report deleted successfully'
  });
}));

// Helper function to generate report data
async function generateReportData(report: any): Promise<any> {
  const { businessAccountId, reportType, startDate, endDate } = report;

  switch (reportType) {
    case 'PROFIT_AND_LOSS':
      return await generateProfitAndLossReport(businessAccountId, startDate, endDate);
    case 'BALANCE_SHEET':
      return await generateBalanceSheetReport(businessAccountId, startDate, endDate);
    case 'CASH_FLOW':
      return await generateCashFlowReport(businessAccountId, startDate, endDate);
    case 'SALES_REPORT':
      return await generateSalesReport(businessAccountId, startDate, endDate);
    case 'EXPENSE_REPORT':
      return await generateExpenseReport(businessAccountId, startDate, endDate);
    default:
      return {
        data: {},
        summary: { message: 'Custom report data' }
      };
  }
}

async function generateProfitAndLossReport(businessAccountId: string, startDate: Date, endDate: Date) {
  // Get revenue and expenses for the period
  const [revenue, expenses] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        businessAccountId,
        type: 'CREDIT',
        category: 'SALES',
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { amount: true },
      _count: { id: true }
    }),
    prisma.transaction.aggregate({
      where: {
        businessAccountId,
        category: 'EXPENSES',
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { amount: true },
      _count: { id: true }
    })
  ]);

  const totalRevenue = revenue._sum.amount || 0;
  const totalExpenses = expenses._sum.amount || 0;
  const netIncome = totalRevenue - totalExpenses;

  return {
    data: {
      revenue: {
        total: totalRevenue,
        count: revenue._count.id,
        breakdown: [] // Would include detailed breakdown
      },
      expenses: {
        total: totalExpenses,
        count: expenses._count.id,
        breakdown: [] // Would include detailed breakdown
      },
      netIncome
    },
    summary: {
      totalRevenue,
      totalExpenses,
      netIncome,
      profitMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
    }
  };
}

async function generateBalanceSheetReport(businessAccountId: string, startDate: Date, endDate: Date) {
  const [assets, liabilities] = await Promise.all([
    prisma.account.aggregate({
      where: {
        businessAccountId,
        status: 'ACTIVE',
        accountType: {
          in: ['CHECKING', 'SAVINGS', 'INVESTMENT']
        }
      },
      _sum: { balance: true },
      _count: { id: true }
    }),
    prisma.account.aggregate({
      where: {
        businessAccountId,
        status: 'ACTIVE',
        accountType: {
          in: ['CREDIT_CARD', 'LOAN']
        }
      },
      _sum: { balance: true },
      _count: { id: true }
    })
  ]);

  const totalAssets = assets._sum.balance || 0;
  const totalLiabilities = liabilities._sum.balance || 0;
  const equity = totalAssets - totalLiabilities;

  return {
    data: {
      assets: {
        total: totalAssets,
        count: assets._count.id,
        breakdown: [] // Would include detailed breakdown
      },
      liabilities: {
        total: totalLiabilities,
        count: liabilities._count.id,
        breakdown: [] // Would include detailed breakdown
      },
      equity
    },
    summary: {
      totalAssets,
      totalLiabilities,
      equity,
      debtToEquityRatio: equity > 0 ? (totalLiabilities / equity) : 0
    }
  };
}

async function generateCashFlowReport(businessAccountId: string, startDate: Date, endDate: Date) {
  const [inflows, outflows] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        businessAccountId,
        type: {
          in: ['CREDIT', 'PAYMENT_RECEIVED', 'TRANSFER_IN']
        },
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { amount: true },
      _count: { id: true }
    }),
    prisma.transaction.aggregate({
      where: {
        businessAccountId,
        type: {
          in: ['DEBIT', 'PAYMENT_SENT', 'TRANSFER_OUT']
        },
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { amount: true },
      _count: { id: true }
    })
  ]);

  const totalInflows = inflows._sum.amount || 0;
  const totalOutflows = outflows._sum.amount || 0;
  const netCashFlow = totalInflows - totalOutflows;

  return {
    data: {
      inflows: {
        total: totalInflows,
        count: inflows._count.id,
        breakdown: [] // Would include detailed breakdown
      },
      outflows: {
        total: totalOutflows,
        count: outflows._count.id,
        breakdown: [] // Would include detailed breakdown
      },
      netCashFlow
    },
    summary: {
      totalInflows,
      totalOutflows,
      netCashFlow,
      cashFlowRatio: totalOutflows > 0 ? (totalInflows / totalOutflows) : 0
    }
  };
}

async function generateSalesReport(businessAccountId: string, startDate: Date, endDate: Date) {
  const salesData = await prisma.transaction.aggregate({
    where: {
      businessAccountId,
      type: 'CREDIT',
      category: 'SALES',
      status: 'COMPLETED',
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _sum: { amount: true },
    _count: { id: true },
    _avg: { amount: true }
  });

  return {
    data: {
      sales: {
        total: salesData._sum.amount || 0,
        count: salesData._count.id,
        average: salesData._avg.amount || 0,
        breakdown: [] // Would include detailed breakdown by product/customer
      }
    },
    summary: {
      totalSales: salesData._sum.amount || 0,
      transactionCount: salesData._count.id,
      averageTransactionValue: salesData._avg.amount || 0
    }
  };
}

async function generateExpenseReport(businessAccountId: string, startDate: Date, endDate: Date) {
  const expenses = await prisma.expense.findMany({
    where: {
      businessAccountId,
      expenseDate: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      transactions: true
    }
  });

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  return {
    data: {
      expenses: {
        total: totalExpenses,
        count: expenses.length,
        byCategory: expensesByCategory,
        breakdown: expenses
      }
    },
    summary: {
      totalExpenses,
      expenseCount: expenses.length,
      averageExpense: expenses.length > 0 ? totalExpenses / expenses.length : 0,
      topCategory: Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || null
    }
  };
}

export default router;
