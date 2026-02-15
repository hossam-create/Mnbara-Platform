import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { FinancialStatementsEngine } from '../services/financial/FinancialStatementsEngine';

const router = Router();
const prisma = new PrismaClient();
const financialEngine = new FinancialStatementsEngine(prisma);

// Validation schemas
const generateStatementSchema = z.object({
  businessAccountId: z.string().min(1, 'Business account ID is required'),
  periodType: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  periodStart: z.string().transform(val => new Date(val)),
  periodEnd: z.string().transform(val => new Date(val)),
  fiscalYear: z.number().optional(),
  fiscalQuarter: z.number().optional(),
  fiscalMonth: z.number().optional()
});

const updateStatusSchema = z.object({
  status: z.enum(['GENERATED', 'REVIEWED', 'FINALIZED', 'ARCHIVED']),
  notes: z.string().optional()
});

const listStatementsSchema = z.object({
  statementType: z.enum(['INCOME_STATEMENT', 'BALANCE_SHEET', 'CASH_FLOW']).optional(),
  periodType: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  periodStart: z.string().transform(val => new Date(val)).optional(),
  periodEnd: z.string().transform(val => new Date(val)).optional(),
  fiscalYear: z.number().optional(),
  fiscalQuarter: z.number().optional(),
  fiscalMonth: z.number().optional(),
  status: z.enum(['GENERATED', 'REVIEWED', 'FINALIZED', 'ARCHIVED']).optional(),
  page: z.number().default(1),
  limit: z.number().default(50)
});

// Financial Statements Routes

// Generate Income Statement
router.post('/income-statement', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const validatedData = generateStatementSchema.parse(req.body);

  // Check if user has permission to generate statements
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

  const statement = await financialEngine.generateIncomeStatement(validatedData, user.id);

  res.status(201).json({
    success: true,
    data: statement
  });
}));

// Generate Balance Sheet
router.post('/balance-sheet', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const validatedData = generateStatementSchema.parse(req.body);

  // Check if user has permission to generate statements
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

  const statement = await financialEngine.generateBalanceSheet(validatedData, user.id);

  res.status(201).json({
    success: true,
    data: statement
  });
}));

// Generate Cash Flow Statement
router.post('/cash-flow-statement', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const validatedData = generateStatementSchema.parse(req.body);

  // Check if user has permission to generate statements
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

  const statement = await financialEngine.generateCashFlowStatement(validatedData, user.id);

  res.status(201).json({
    success: true,
    data: statement
  });
}));

// Generate All Financial Statements
router.post('/all-statements', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const validatedData = generateStatementSchema.parse(req.body);

  // Check if user has permission to generate statements
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

  const statements = await financialEngine.generateAllStatements(validatedData, user.id);

  res.status(201).json({
    success: true,
    data: statements
  });
}));

// List Financial Statements
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId } = req.query;
  const validatedFilters = listStatementsSchema.parse(req.query);

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

  const result = await financialEngine.getFinancialStatements(
    businessAccountId as string,
    validatedFilters
  );

  res.json({
    success: true,
    data: result.statements,
    pagination: result.pagination
  });
}));

// Get Single Financial Statement
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  const statement = await financialEngine.getFinancialStatement(id);

  if (!statement) {
    throw createError('Financial statement not found', 404);
  }

  // Check if user has access to this business
  const business = await prisma.businessAccount.findFirst({
    where: {
      id: statement.businessAccountId,
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

  res.json({
    success: true,
    data: statement
  });
}));

// Update Statement Status
router.put('/:id/status', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;
  const validatedData = updateStatusSchema.parse(req.body);

  // Check if statement exists and user has permission
  const statement = await prisma.financialStatement.findUnique({
    where: { id }
  });

  if (!statement) {
    throw createError('Financial statement not found', 404);
  }

  const business = await prisma.businessAccount.findFirst({
    where: {
      id: statement.businessAccountId,
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

  const updatedStatement = await financialEngine.updateStatementStatus(
    id,
    validatedData.status,
    validatedData.notes,
    user.id
  );

  res.json({
    success: true,
    data: updatedStatement
  });
}));

// Get Income Statement Summary
router.get('/income-statement/summary', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId, periodStart, periodEnd } = req.query;

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

  // Get the most recent income statement
  const statement = await prisma.financialStatement.findFirst({
    where: {
      businessAccountId: businessAccountId as string,
      statementType: 'INCOME_STATEMENT',
      ...(periodStart && { periodStart: { gte: new Date(periodStart as string) } }),
      ...(periodEnd && { periodEnd: { lte: new Date(periodEnd as string) } })
    },
    orderBy: {
      periodStart: 'desc'
    },
    include: {
      calculations: {
        orderBy: {
          calculationOrder: 'asc'
        }
      }
    }
  });

  if (!statement) {
    throw createError('No income statement found for the specified criteria', 404);
  }

  res.json({
    success: true,
    data: statement
  });
}));

// Get Balance Sheet Summary
router.get('/balance-sheet/summary', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId, periodStart, periodEnd } = req.query;

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

  // Get the most recent balance sheet
  const statement = await prisma.financialStatement.findFirst({
    where: {
      businessAccountId: businessAccountId as string,
      statementType: 'BALANCE_SHEET',
      ...(periodStart && { periodStart: { gte: new Date(periodStart as string) } }),
      ...(periodEnd && { periodEnd: { lte: new Date(periodEnd as string) } })
    },
    orderBy: {
      periodStart: 'desc'
    },
    include: {
      calculations: {
        orderBy: {
          calculationOrder: 'asc'
        }
      }
    }
  });

  if (!statement) {
    throw createError('No balance sheet found for the specified criteria', 404);
  }

  res.json({
    success: true,
    data: statement
  });
}));

// Get Cash Flow Statement Summary
router.get('/cash-flow-statement/summary', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId, periodStart, periodEnd } = req.query;

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

  // Get the most recent cash flow statement
  const statement = await prisma.financialStatement.findFirst({
    where: {
      businessAccountId: businessAccountId as string,
      statementType: 'CASH_FLOW',
      ...(periodStart && { periodStart: { gte: new Date(periodStart as string) } }),
      ...(periodEnd && { periodEnd: { lte: new Date(periodEnd as string) } })
    },
    orderBy: {
      periodStart: 'desc'
    },
    include: {
      calculations: {
        orderBy: {
          calculationOrder: 'asc'
        }
      }
    }
  });

  if (!statement) {
    throw createError('No cash flow statement found for the specified criteria', 404);
  }

  res.json({
    success: true,
    data: statement
  });
}));

// Get Financial Statement Comparisons
router.get('/comparisons', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { 
    businessAccountId, 
    statementType, 
    currentPeriodStart, 
    currentPeriodEnd, 
    comparisonType 
  } = req.query;

  if (!businessAccountId || !statementType || !currentPeriodStart || !currentPeriodEnd) {
    throw createError('Business account ID, statement type, and current period are required', 400);
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

  // Get current period statement
  const currentStatement = await prisma.financialStatement.findFirst({
    where: {
      businessAccountId: businessAccountId as string,
      statementType: statementType as string,
      periodStart: new Date(currentPeriodStart as string),
      periodEnd: new Date(currentPeriodEnd as string)
    }
  });

  if (!currentStatement) {
    throw createError('Current period statement not found', 404);
  }

  // Calculate comparison period
  const currentStart = new Date(currentPeriodStart as string);
  const currentEnd = new Date(currentPeriodEnd as string);
  let comparisonStart: Date;
  let comparisonEnd: Date;

  if (comparisonType === 'PERIOD_OVER_PERIOD') {
    // Previous period (e.g., previous month)
    const periodLength = currentEnd.getTime() - currentStart.getTime();
    comparisonEnd = new Date(currentStart.getTime() - 1);
    comparisonStart = new Date(comparisonEnd.getTime() - periodLength + 1);
  } else if (comparisonType === 'YEAR_OVER_YEAR') {
    // Same period last year
    comparisonStart = new Date(currentStart);
    comparisonStart.setFullYear(currentStart.getFullYear() - 1);
    comparisonEnd = new Date(currentEnd);
    comparisonEnd.setFullYear(currentEnd.getFullYear() - 1);
  } else {
    throw createError('Invalid comparison type', 400);
  }

  // Get comparison period statement
  const comparisonStatement = await prisma.financialStatement.findFirst({
    where: {
      businessAccountId: businessAccountId as string,
      statementType: statementType as string,
      periodStart: comparisonStart,
      periodEnd: comparisonEnd
    }
  });

  if (!comparisonStatement) {
    throw createError('Comparison period statement not found', 404);
  }

  // Calculate variance and percentage changes
  const varianceData = {};
  const percentageChanges = {};

  // Simple comparison based on statement data
  const currentData = currentStatement.statementData as any;
  const comparisonData = comparisonStatement.statementData as any;

  for (const key in currentData) {
    if (typeof currentData[key] === 'number' && comparisonData[key] !== undefined) {
      const currentValue = currentData[key];
      const comparisonValue = comparisonData[key];
      const variance = currentValue - comparisonValue;
      const percentageChange = comparisonValue !== 0 ? (variance / comparisonValue) * 100 : 0;

      varianceData[key] = variance;
      percentageChanges[key] = percentageChange;
    }
  }

  res.json({
    success: true,
    data: {
      currentPeriod: {
        statement: currentStatement,
        data: currentData
      },
      comparisonPeriod: {
        statement: comparisonStatement,
        data: comparisonData
      },
      variance: varianceData,
      percentageChanges,
      comparisonType
    }
  });
}));

// Refresh Financial Statement Views
router.post('/refresh-views', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;

  // Check if user has admin permissions
  const hasPermission = await prisma.user.findFirst({
    where: {
      id: user.id,
      businessUsers: {
        some: {
          role: {
            in: ['OWNER', 'ADMIN']
          }
        }
      }
    }
  });

  if (!hasPermission) {
    throw createError('Insufficient permissions to refresh views', 403);
  }

  await financialEngine.refreshViews();

  res.json({
    success: true,
    message: 'Financial statement views refreshed successfully'
  });
}));

export default router;
