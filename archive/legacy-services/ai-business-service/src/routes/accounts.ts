import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createAccountSchema = z.object({
  businessAccountId: z.string(),
  accountType: z.enum(['CHECKING', 'SAVINGS', 'CREDIT_CARD', 'LOAN', 'INVESTMENT', 'CASH']),
  name: z.string().min(1, 'Account name is required'),
  description: z.string().optional(),
  currency: z.string().default('USD'),
  externalAccountId: z.string().optional(),
  bankAccountId: z.string().optional(),
  plaidAccountId: z.string().optional(),
});

const updateAccountSchema = createAccountSchema.partial().omit({
  businessAccountId: true
});

// Get all accounts for user's businesses
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;

  const accounts = await prisma.account.findMany({
    where: {
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
      _count: {
        select: {
          transactions: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.json({
    success: true,
    data: accounts
  });
}));

// Get accounts for specific business
router.get('/business/:businessId', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessId } = req.params;

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

  const accounts = await prisma.account.findMany({
    where: {
      businessAccountId: businessId
    },
    include: {
      _count: {
        select: {
          transactions: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  res.json({
    success: true,
    data: accounts
  });
}));

// Get single account
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  const account = await prisma.account.findFirst({
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
        take: 10,
        orderBy: {
          createdAt: 'desc'
        }
      },
      _count: {
        select: {
          transactions: true
        }
      }
    }
  });

  if (!account) {
    throw createError('Account not found', 404);
  }

  res.json({
    success: true,
    data: account
  });
}));

// Create new account
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const validatedData = createAccountSchema.parse(req.body);

  // Check if user has permission to create accounts for this business
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

  // Generate unique account number
  const accountNumber = await generateAccountNumber();

  const account = await prisma.account.create({
    data: {
      ...validatedData,
      accountNumber,
      balance: 0,
      availableBalance: 0,
      holdBalance: 0,
      status: 'ACTIVE',
      isActive: true
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

  logger.info(`Account created: ${account.name}`, {
    accountId: account.id,
    businessId: business.id,
    userId: user.id
  });

  res.status(201).json({
    success: true,
    data: account
  });
}));

// Update account
router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;
  const validatedData = updateAccountSchema.parse(req.body);

  // Check if user has permission to update this account
  const existingAccount = await prisma.account.findFirst({
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

  if (!existingAccount) {
    throw createError('Account not found or insufficient permissions', 404);
  }

  const account = await prisma.account.update({
    where: { id },
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

  logger.info(`Account updated: ${account.name}`, {
    accountId: account.id,
    userId: user.id
  });

  res.json({
    success: true,
    data: account
  });
}));

// Close account
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  // Check if user is owner or admin
  const existingAccount = await prisma.account.findFirst({
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

  if (!existingAccount) {
    throw createError('Account not found or insufficient permissions', 404);
  }

  // Check if account has zero balance
  if (existingAccount.balance !== 0) {
    throw createError('Cannot close account with non-zero balance', 400);
  }

  await prisma.account.update({
    where: { id },
    data: {
      status: 'CLOSED',
      isActive: false,
      closedAt: new Date()
    }
  });

  logger.info(`Account closed: ${existingAccount.name}`, {
    accountId: id,
    userId: user.id
  });

  res.json({
    success: true,
    message: 'Account closed successfully'
  });
}));

// Helper function to generate unique account number
async function generateAccountNumber(): Promise<string> {
  const prefix = '100000';
  let accountNumber: string;
  let attempts = 0;
  
  do {
    const random = Math.floor(Math.random() * 900000) + 100000;
    accountNumber = prefix + random.toString();
    attempts++;
    
    if (attempts > 10) {
      throw new Error('Unable to generate unique account number');
    }
  } while (await prisma.account.findUnique({ where: { accountNumber } }));
  
  return accountNumber;
}

export default router;
