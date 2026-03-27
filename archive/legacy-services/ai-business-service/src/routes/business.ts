import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createBusinessSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  legalName: z.string().optional(),
  businessType: z.enum(['SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LLC', 'CORPORATION', 'NON_PROFIT', 'GOVERNMENT']),
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  industry: z.string().optional(),
  description: z.string().optional(),
  currency: z.string().default('USD'),
  creditLimit: z.number().optional(),
});

const updateBusinessSchema = createBusinessSchema.partial();

// Get all business accounts for authenticated user
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  
  const businesses = await prisma.businessAccount.findMany({
    where: {
      users: {
        some: {
          userId: user.id
        }
      }
    },
    include: {
      accounts: {
        where: { status: 'ACTIVE' }
      },
      _count: {
        select: {
          transactions: true,
          invoices: true,
          expenses: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.json({
    success: true,
    data: businesses
  });
}));

// Get single business account
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  const business = await prisma.businessAccount.findFirst({
    where: {
      id,
      users: {
        some: {
          userId: user.id
        }
      }
    },
    include: {
      accounts: true,
      users: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      },
      _count: {
        select: {
          transactions: true,
          invoices: true,
          expenses: true,
          aiAnalyses: true
        }
      }
    }
  });

  if (!business) {
    throw createError('Business account not found', 404);
  }

  res.json({
    success: true,
    data: business
  });
}));

// Create new business account
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const validatedData = createBusinessSchema.parse(req.body);

  const business = await prisma.businessAccount.create({
    data: {
      ...validatedData,
      status: 'ACTIVE',
      onboardedAt: new Date(),
      users: {
        create: {
          userId: user.id,
          role: 'OWNER',
          permissions: ['business:*', 'accounts:*', 'transactions:*', 'invoices:*', 'expenses:*', 'reports:*']
        }
      }
    },
    include: {
      users: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  });

  logger.info(`Business account created: ${business.name}`, {
    businessId: business.id,
    userId: user.id
  });

  res.status(201).json({
    success: true,
    data: business
  });
}));

// Update business account
router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;
  const validatedData = updateBusinessSchema.parse(req.body);

  // Check if user has permission to update this business
  const existingBusiness = await prisma.businessAccount.findFirst({
    where: {
      id,
      users: {
        some: {
          userId: user.id,
          role: {
            in: ['OWNER', 'ADMIN']
          }
        }
      }
    }
  });

  if (!existingBusiness) {
    throw createError('Business account not found or insufficient permissions', 404);
  }

  const business = await prisma.businessAccount.update({
    where: { id },
    data: validatedData,
    include: {
      users: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  });

  logger.info(`Business account updated: ${business.name}`, {
    businessId: business.id,
    userId: user.id
  });

  res.json({
    success: true,
    data: business
  });
}));

// Delete business account (soft delete)
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  // Check if user is owner
  const existingBusiness = await prisma.businessAccount.findFirst({
    where: {
      id,
      users: {
        some: {
          userId: user.id,
          role: 'OWNER'
        }
      }
    }
  });

  if (!existingBusiness) {
    throw createError('Business account not found or insufficient permissions', 404);
  }

  await prisma.businessAccount.update({
    where: { id },
    data: {
      status: 'CLOSED',
      deletedAt: new Date()
    }
  });

  logger.info(`Business account deleted: ${existingBusiness.name}`, {
    businessId: id,
    userId: user.id
  });

  res.json({
    success: true,
    message: 'Business account deleted successfully'
  });
}));

// Get business summary
router.get('/:id/summary', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  // Check access
  const business = await prisma.businessAccount.findFirst({
    where: {
      id,
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

  const summary = await prisma.$queryRaw`
    SELECT 
      ba.id as business_account_id,
      ba.name as business_name,
      ba.business_type,
      ba.status,
      COUNT(DISTINCT a.id) as account_count,
      COUNT(DISTINCT t.id) as transaction_count,
      COALESCE(SUM(a.balance), 0) as total_balance,
      COALESCE(SUM(CASE WHEN t.type IN ('DEBIT', 'PAYMENT_SENT', 'TRANSFER_OUT') THEN t.amount ELSE 0 END), 0) as total_debits,
      COALESCE(SUM(CASE WHEN t.type IN ('CREDIT', 'PAYMENT_RECEIVED', 'TRANSFER_IN') THEN t.amount ELSE 0 END), 0) as total_credits,
      MAX(t.created_at) as last_transaction_at,
      ba.created_at
    FROM business_accounts ba
    LEFT JOIN accounts a ON a.business_account_id = ba.id AND a.status = 'ACTIVE'
    LEFT JOIN transactions t ON t.business_account_id = ba.id AND t.status = 'COMPLETED'
    WHERE ba.id = ${id}
    GROUP BY ba.id, ba.name, ba.business_type, ba.status, ba.created_at
  `;

  res.json({
    success: true,
    data: summary[0] || null
  });
}));

export default router;
