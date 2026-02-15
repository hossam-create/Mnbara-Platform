import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { PlatformEventService } from '../services/platform/PlatformEventService';

const router = Router();
const prisma = new PrismaClient();
const platformEventService = new PlatformEventService(prisma);

// Validation schemas
const orderCompletedSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
  customerId: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email().optional(),
  totalAmount: z.number().positive('Total amount must be positive'),
  commissionAmount: z.number().min(0, 'Commission amount must be non-negative'),
  netAmount: z.number().positive('Net amount must be positive'),
  currency: z.string().default('USD'),
  items: z.array(z.any()).optional(),
  shippingAddress: z.any().optional(),
  billingAddress: z.any().optional(),
  notes: z.string().optional()
});

const commissionEarnedSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  commissionType: z.enum(['PLATFORM_FEE', 'SERVICE_FEE', 'TRANSACTION_FEE', 'REFERRAL_BONUS']),
  commissionRate: z.number().min(0).max(1, 'Commission rate must be between 0 and 1'),
  baseAmount: z.number().positive('Base amount must be positive'),
  commissionAmount: z.number().positive('Commission amount must be positive'),
  recipientType: z.enum(['PLATFORM', 'SELLER', 'REFERRER']),
  recipientId: z.string().optional(),
  description: z.string().optional()
});

const refundProcessedSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  refundNumber: z.string().min(1, 'Refund number is required'),
  originalAmount: z.number().positive('Original amount must be positive'),
  refundAmount: z.number().positive('Refund amount must be positive'),
  refundReason: z.string().min(1, 'Refund reason is required'),
  refundType: z.enum(['FULL_REFUND', 'PARTIAL_REFUND', 'CHARGEBACK']),
  notes: z.string().optional()
});

const payoutSentSchema = z.object({
  payoutNumber: z.string().min(1, 'Payout number is required'),
  recipientType: z.enum(['SELLER', 'AFFILIATE', 'EMPLOYEE', 'VENDOR']),
  recipientId: z.string().min(1, 'Recipient ID is required'),
  recipientName: z.string().min(1, 'Recipient name is required'),
  recipientEmail: z.string().email().optional(),
  payoutAmount: z.number().positive('Payout amount must be positive'),
  payoutMethod: z.enum(['BANK_TRANSFER', 'PAYPAL', 'STRIPE', 'CHECK']),
  bankAccount: z.any().optional(),
  scheduledDate: z.string().transform(val => new Date(val)).optional(),
  notes: z.string().optional()
});

const updateMappingSchema = z.object({
  debitAccountId: z.string().min(1, 'Debit account ID is required'),
  creditAccountId: z.string().min(1, 'Credit account ID is required'),
  descriptionTemplate: z.string().min(1, 'Description template is required'),
  autoPost: z.boolean().default(true)
});

// Platform Events Routes

// Get platform events
router.get('/events', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { 
    businessAccountId, 
    eventType, 
    status, 
    startDate, 
    endDate, 
    page = 1, 
    limit = 50 
  } = req.query;

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

  const filters: any = {
    page: Number(page),
    limit: Number(limit)
  };

  if (eventType) filters.eventType = eventType as string;
  if (status) filters.status = status as string;
  if (startDate) filters.startDate = new Date(startDate as string);
  if (endDate) filters.endDate = new Date(endDate as string);

  const result = await platformEventService.getPlatformEvents(
    businessAccountId as string,
    filters
  );

  res.json({
    success: true,
    data: result.events,
    pagination: result.pagination
  });
}));

// Handle order completion event
router.post('/events/order-completed', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId } = req.body;
  const validatedData = orderCompletedSchema.parse(req.body);

  // Check if user has permission to trigger platform events
  const business = await prisma.businessAccount.findFirst({
    where: {
      id: businessAccountId,
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

  const order = await platformEventService.handleOrderCompleted(
    businessAccountId,
    validatedData,
    user.id
  );

  res.status(201).json({
    success: true,
    data: order
  });
}));

// Handle commission earned event
router.post('/events/commission-earned', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId } = req.body;
  const validatedData = commissionEarnedSchema.parse(req.body);

  // Check if user has permission to trigger platform events
  const business = await prisma.businessAccount.findFirst({
    where: {
      id: businessAccountId,
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

  const commission = await platformEventService.handleCommissionEarned(
    businessAccountId,
    validatedData,
    user.id
  );

  res.status(201).json({
    success: true,
    data: commission
  });
}));

// Handle refund processed event
router.post('/events/refund-processed', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId } = req.body;
  const validatedData = refundProcessedSchema.parse(req.body);

  // Check if user has permission to trigger platform events
  const business = await prisma.businessAccount.findFirst({
    where: {
      id: businessAccountId,
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

  const refund = await platformEventService.handleRefundProcessed(
    businessAccountId,
    validatedData,
    user.id
  );

  res.status(201).json({
    success: true,
    data: refund
  });
}));

// Handle payout sent event
router.post('/events/payout-sent', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId } = req.body;
  const validatedData = payoutSentSchema.parse(req.body);

  // Check if user has permission to trigger platform events
  const business = await prisma.businessAccount.findFirst({
    where: {
      id: businessAccountId,
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

  const payout = await platformEventService.handlePayoutSent(
    businessAccountId,
    validatedData,
    user.id
  );

  res.status(201).json({
    success: true,
    data: payout
  });
}));

// Platform Orders Routes

// Get platform orders
router.get('/orders', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId, status, page = 1, limit = 50 } = req.query;

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

  const whereClause: any = {
    businessAccountId: businessAccountId as string
  };

  if (status) whereClause.status = status;

  const [orders, total] = await Promise.all([
    prisma.platformOrder.findMany({
      where: whereClause,
      orderBy: {
        orderDate: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    }),
    prisma.platformOrder.count({ where: whereClause })
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get single platform order
router.get('/orders/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  const order = await prisma.platformOrder.findFirst({
    where: {
      id,
      businessAccount: {
        users: {
          some: {
            userId: user.id
          }
        }
      }
    }
  });

  if (!order) {
    throw createError('Order not found', 404);
  }

  res.json({
    success: true,
    data: order
  });
}));

// Platform Commissions Routes

// Get platform commissions
router.get('/commissions', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId, commissionType, status, page = 1, limit = 50 } = req.query;

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

  const whereClause: any = {
    businessAccountId: businessAccountId as string
  };

  if (commissionType) whereClause.commissionType = commissionType;
  if (status) whereClause.status = status;

  const [commissions, total] = await Promise.all([
    prisma.platformCommission.findMany({
      where: whereClause,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true
          }
        }
      },
      orderBy: {
        calculatedAt: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    }),
    prisma.platformCommission.count({ where: whereClause })
  ]);

  res.json({
    success: true,
    data: commissions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Platform Refunds Routes

// Get platform refunds
router.get('/refunds', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId, refundType, status, page = 1, limit = 50 } = req.query;

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

  const whereClause: any = {
    businessAccountId: businessAccountId as string
  };

  if (refundType) whereClause.refundType = refundType;
  if (status) whereClause.status = status;

  const [refunds, total] = await Promise.all([
    prisma.platformRefund.findMany({
      where: whereClause,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    }),
    prisma.platformRefund.count({ where: whereClause })
  ]);

  res.json({
    success: true,
    data: refunds,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Platform Payouts Routes

// Get platform payouts
router.get('/payouts', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId, recipientType, payoutStatus, page = 1, limit = 50 } = req.query;

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

  const whereClause: any = {
    businessAccountId: businessAccountId as string
  };

  if (recipientType) whereClause.recipientType = recipientType;
  if (payoutStatus) whereClause.payoutStatus = payoutStatus;

  const [payouts, total] = await Promise.all([
    prisma.platformPayout.findMany({
      where: whereClause,
      orderBy: {
        scheduledDate: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    }),
    prisma.platformPayout.count({ where: whereClause })
  ]);

  res.json({
    success: true,
    data: payouts,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Accounting Event Mappings Routes

// Get accounting event mappings
router.get('/accounting-mappings', asyncHandler(async (req: AuthenticatedRequest, res) => {
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

  const mappings = await platformEventService.getAccountingMappings(businessAccountId as string);

  res.json({
    success: true,
    data: mappings
  });
}));

// Update accounting event mapping
router.put('/accounting-mappings/:eventType', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId } = req.body;
  const { eventType } = req.params;
  const validatedData = updateMappingSchema.parse(req.body);

  // Check if user has permission to update mappings
  const business = await prisma.businessAccount.findFirst({
    where: {
      id: businessAccountId,
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

  const mapping = await platformEventService.updateAccountingMapping(
    businessAccountId,
    eventType,
    validatedData
  );

  res.json({
    success: true,
    data: mapping
  });
}));

// Event Processing Queue Routes

// Get event processing queue
router.get('/event-queue', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessAccountId, queueStatus, page = 1, limit = 50 } = req.query;

  if (!businessAccountId) {
    throw createError('Business account ID is required', 400);
  }

  // Check if user has access to this business
  const business = await prisma.businessAccount.findFirst({
    where: {
      id: businessAccountId as string,
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

  const whereClause: any = {
    platformEvent: {
      businessAccountId: businessAccountId as string
    }
  };

  if (queueStatus) whereClause.queueStatus = queueStatus;

  const [queueItems, total] = await Promise.all([
    prisma.eventProcessingQueue.findMany({
      where: whereClause,
      include: {
        platformEvent: {
          select: {
            id: true,
            eventType: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledAt: 'asc' }
      ],
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    }),
    prisma.eventProcessingQueue.count({ where: whereClause })
  ]);

  res.json({
    success: true,
    data: queueItems,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

export default router;
