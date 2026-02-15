import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createAnalysisSchema = z.object({
  businessAccountId: z.string(),
  analysisType: z.enum(['CASH_FLOW_PREDICTION', 'EXPENSE_CLASSIFICATION', 'REVENUE_FORECAST', 'RISK_ASSESSMENT', 'FRAUD_DETECTION', 'ANOMALY_DETECTION', 'TREND_ANALYSIS', 'OPTIMIZATION']),
  model: z.string(),
  version: z.string(),
  inputData: z.object({}),
  context: z.object({}).optional(),
  transactionIds: z.array(z.string()).optional(),
});

// Get all AI analyses for user's businesses
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { page = 1, limit = 50, analysisType, status } = req.query;

  const where: any = {
    businessAccount: {
      users: {
        some: {
          userId: user.id
        }
      }
    }
  };

  if (analysisType) where.analysisType = analysisType;
  if (status) where.status = status;

  const [analyses, total] = await Promise.all([
    prisma.aIAnalysis.findMany({
      where,
      include: {
        businessAccount: {
          select: {
            id: true,
            name: true
          }
        },
        transactions: {
          select: {
            id: true,
            referenceNumber: true,
            amount,
            type,
            description
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    }),
    prisma.aIAnalysis.count({ where })
  ]);

  res.json({
    success: true,
    data: analyses,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get AI analyses for specific business
router.get('/business/:businessId', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessId } = req.params;
  const { page = 1, limit = 50, analysisType, status } = req.query;

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

  if (analysisType) where.analysisType = analysisType;
  if (status) where.status = status;

  const [analyses, total] = await Promise.all([
    prisma.aIAnalysis.findMany({
      where,
      include: {
        transactions: {
          select: {
            id: true,
            referenceNumber: true,
            amount,
            type,
            description
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    }),
    prisma.aIAnalysis.count({ where })
  ]);

  res.json({
    success: true,
    data: analyses,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get single AI analysis
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  const analysis = await prisma.aIAnalysis.findFirst({
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

  if (!analysis) {
    throw createError('AI analysis not found', 404);
  }

  res.json({
    success: true,
    data: analysis
  });
}));

// Create new AI analysis
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const validatedData = createAnalysisSchema.parse(req.body);

  // Check if user has permission to create AI analyses for this business
  const business = await prisma.businessAccount.findFirst({
    where: {
      id: validatedData.businessAccountId,
      users: {
        some: {
          userId: user.id,
          role: {
            in: ['OWNER', 'ADMIN', 'AI_ANALYST']
          }
        }
      }
    }
  });

  if (!business) {
    throw createError('Business account not found or insufficient permissions', 404);
  }

  // Create analysis in PENDING status
  const analysis = await prisma.aIAnalysis.create({
    data: {
      ...validatedData,
      status: 'PENDING',
      context: validatedData.context || {},
      confidence: 0, // Will be updated when processing completes
      processingTimeMs: null,
      cost: null
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

  // Link transactions if provided
  if (validatedData.transactionIds && validatedData.transactionIds.length > 0) {
    await prisma.aIAnalysis.update({
      where: { id: analysis.id },
      data: {
        transactions: {
          connect: validatedData.transactionIds.map(id => ({ id }))
        }
      }
    });
  }

  logger.info(`AI analysis created: ${analysis.id}`, {
    analysisId: analysis.id,
    businessId: business.id,
    userId: user.id,
    analysisType: analysis.analysisType,
    model: analysis.model
  });

  // TODO: Queue for AI processing (will be implemented in later sprints)

  res.status(201).json({
    success: true,
    data: analysis
  });
}));

// Process AI analysis (simulate AI processing)
router.post('/:id/process', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  // Check if user has permission to process AI analyses
  const existingAnalysis = await prisma.aIAnalysis.findFirst({
    where: {
      id,
      businessAccount: {
        users: {
          some: {
            userId: user.id,
            role: {
              in: ['OWNER', 'ADMIN', 'AI_ANALYST']
            }
          }
        }
      }
    }
  });

  if (!existingAnalysis) {
    throw createError('AI analysis not found or insufficient permissions', 404);
  }

  if (existingAnalysis.status !== 'PENDING') {
    throw createError('AI analysis cannot be processed', 400);
  }

  const startTime = Date.now();

  // Simulate AI processing (will be replaced with actual AI models in later sprints)
  const mockResults = generateMockResults(existingAnalysis.analysisType, existingAnalysis.inputData);
  const mockInsights = generateMockInsights(existingAnalysis.analysisType);
  const mockRecommendations = generateMockRecommendations(existingAnalysis.analysisType);

  const processingTime = Date.now() - startTime;

  const analysis = await prisma.aIAnalysis.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      processedAt: new Date(),
      completedAt: new Date(),
      results: mockResults,
      insights: mockInsights,
      recommendations: mockRecommendations,
      confidence: 0.85 + Math.random() * 0.14, // 0.85 to 0.99
      processingTimeMs: processingTime,
      cost: (processingTime / 1000) * 0.001 // $0.001 per second
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

  logger.info(`AI analysis processed: ${analysis.id}`, {
    analysisId: analysis.id,
    userId: user.id,
    processingTimeMs: processingTime,
    confidence: analysis.confidence
  });

  res.json({
    success: true,
    data: analysis
  });
}));

// Delete AI analysis
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  // Check if user has permission to delete AI analyses
  const existingAnalysis = await prisma.aIAnalysis.findFirst({
    where: {
      id,
      businessAccount: {
        users: {
          some: {
            userId: user.id,
            role: {
              in: ['OWNER', 'ADMIN', 'AI_ANALYST']
            }
          }
        }
      }
    }
  });

  if (!existingAnalysis) {
    throw createError('AI analysis not found or insufficient permissions', 404);
  }

  await prisma.aIAnalysis.delete({
    where: { id }
  });

  logger.info(`AI analysis deleted: ${existingAnalysis.id}`, {
    analysisId: id,
    userId: user.id
  });

  res.json({
    success: true,
    message: 'AI analysis deleted successfully'
  });
}));

// Mock result generators (will be replaced with actual AI models)
function generateMockResults(analysisType: string, inputData: any): any {
  switch (analysisType) {
    case 'CASH_FLOW_PREDICTION':
      return {
        predictions: [
          { month: '2024-02', predicted: 50000, confidence: 0.9 },
          { month: '2024-03', predicted: 55000, confidence: 0.85 },
          { month: '2024-04', predicted: 52000, confidence: 0.8 }
        ],
        trend: 'positive',
        factors: ['seasonal_growth', 'market_conditions']
      };
    case 'EXPENSE_CLASSIFICATION':
      return {
        classifications: [
          { category: 'OPERATING', percentage: 65, amount: 32500 },
          { category: 'MARKETING', percentage: 20, amount: 10000 },
          { category: 'ADMIN', percentage: 15, amount: 7500 }
        ],
        efficiency_score: 0.78
      };
    case 'REVENUE_FORECAST':
      return {
        forecast: [
          { period: 'Q1 2024', revenue: 150000, growth_rate: 0.12 },
          { period: 'Q2 2024', revenue: 168000, growth_rate: 0.12 },
          { period: 'Q3 2024', revenue: 188000, growth_rate: 0.12 }
        ],
        confidence_interval: { lower: 0.08, upper: 0.16 }
      };
    default:
      return {
        score: 0.85,
        metrics: { accuracy: 0.92, precision: 0.88, recall: 0.85 }
      };
  }
}

function generateMockInsights(analysisType: string): any {
  switch (analysisType) {
    case 'CASH_FLOW_PREDICTION':
      return [
        'Cash flow shows positive trend for next 3 months',
        'Seasonal patterns indicate Q2 peak',
        'Recommended to maintain current cash reserves'
      ];
    case 'EXPENSE_CLASSIFICATION':
      return [
        'Operating expenses are within industry benchmarks',
        'Marketing spend shows positive ROI',
        'Administrative costs could be optimized by 10%'
      ];
    default:
      return ['Analysis completed successfully', 'No anomalies detected'];
  }
}

function generateMockRecommendations(analysisType: string): any {
  switch (analysisType) {
    case 'CASH_FLOW_PREDICTION':
      return [
        { action: 'increase_cash_reserves', priority: 'medium', impact: 'high' },
        { action: 'review_payment_terms', priority: 'low', impact: 'medium' }
      ];
    case 'EXPENSE_CLASSIFICATION':
      return [
        { action: 'optimize_admin_costs', priority: 'high', impact: 'medium' },
        { action: 'maintain_marketing_budget', priority: 'medium', impact: 'high' }
      ];
    default:
      return [
        { action: 'monitor_metrics', priority: 'low', impact: 'low' }
      ];
  }
}

export default router;
