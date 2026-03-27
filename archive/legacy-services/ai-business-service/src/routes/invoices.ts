import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createInvoiceSchema = z.object({
  businessAccountId: z.string(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email().optional(),
  customerTaxId: z.string().optional(),
  subtotal: z.number().positive('Subtotal must be positive'),
  taxAmount: z.number().default(0),
  totalAmount: z.number().positive('Total amount must be positive'),
  issueDate: z.string().transform(val => new Date(val)),
  dueDate: z.string().transform(val => new Date(val)),
  notes: z.string().optional(),
  terms: z.string().optional(),
  lineItems: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().positive('Quantity must be positive'),
    unitPrice: z.number().positive('Unit price must be positive'),
    totalPrice: z.number().positive('Total price must be positive'),
    taxRate: z.number().default(0),
    taxAmount: z.number().default(0),
    metadata: z.object({}).optional()
  })).min(1, 'At least one line item is required'),
  metadata: z.object({}).optional(),
});

const updateInvoiceSchema = createInvoiceSchema.partial().omit({
  businessAccountId: true,
  invoiceNumber: true
});

// Get all invoices for user's businesses
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { page = 1, limit = 50, status, startDate, endDate } = req.query;

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
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate as string);
    if (endDate) where.createdAt.lte = new Date(endDate as string);
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        businessAccount: {
          select: {
            id: true,
            name: true
          }
        },
        lineItems: true,
        _count: {
          select: {
            transactions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    }),
    prisma.invoice.count({ where })
  ]);

  res.json({
    success: true,
    data: invoices,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get invoices for specific business
router.get('/business/:businessId', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { businessId } = req.params;
  const { page = 1, limit = 50, status, startDate, endDate } = req.query;

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
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate as string);
    if (endDate) where.createdAt.lte = new Date(endDate as string);
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        lineItems: true,
        _count: {
          select: {
            transactions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    }),
    prisma.invoice.count({ where })
  ]);

  res.json({
    success: true,
    data: invoices,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

// Get single invoice
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  const invoice = await prisma.invoice.findFirst({
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
      lineItems: true,
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

  if (!invoice) {
    throw createError('Invoice not found', 404);
  }

  res.json({
    success: true,
    data: invoice
  });
}));

// Create new invoice
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const validatedData = createInvoiceSchema.parse(req.body);

  // Check if user has permission to create invoices for this business
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

  // Generate unique invoice number
  const invoiceNumber = await generateInvoiceNumber(validatedData.businessAccountId);

  const invoice = await prisma.invoice.create({
    data: {
      ...validatedData,
      invoiceNumber,
      status: 'DRAFT',
      paidAmount: 0,
      dueAmount: validatedData.totalAmount,
      metadata: validatedData.metadata || {},
      lineItems: {
        create: validatedData.lineItems.map(item => ({
          ...item,
          metadata: item.metadata || {}
        }))
      }
    },
    include: {
      businessAccount: {
        select: {
          id: true,
          name: true
        }
      },
      lineItems: true
    }
  });

  logger.info(`Invoice created: ${invoiceNumber}`, {
    invoiceId: invoice.id,
    businessId: business.id,
    userId: user.id,
    totalAmount: invoice.totalAmount
  });

  res.status(201).json({
    success: true,
    data: invoice
  });
}));

// Update invoice
router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;
  const validatedData = updateInvoiceSchema.parse(req.body);

  // Check if user has permission to update this invoice
  const existingInvoice = await prisma.invoice.findFirst({
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

  if (!existingInvoice) {
    throw createError('Invoice not found or insufficient permissions', 404);
  }

  // Don't allow updating paid invoices
  if (existingInvoice.status === 'PAID') {
    throw createError('Cannot update paid invoice', 400);
  }

  // Update line items if provided
  const updateData: any = {
    ...validatedData,
    metadata: validatedData.metadata || {}
  };

  if (validatedData.lineItems) {
    // Delete existing line items and create new ones
    await prisma.invoiceLineItem.deleteMany({
      where: { invoiceId: id }
    });

    updateData.lineItems = {
      create: validatedData.lineItems.map(item => ({
        ...item,
        metadata: item.metadata || {}
      }))
    };
  }

  const invoice = await prisma.invoice.update({
    where: { id },
    data: updateData,
    include: {
      businessAccount: {
        select: {
          id: true,
          name: true
        }
      },
      lineItems: true
    }
  });

  logger.info(`Invoice updated: ${invoice.invoiceNumber}`, {
    invoiceId: invoice.id,
    userId: user.id
  });

  res.json({
    success: true,
    data: invoice
  });
}));

// Send invoice (change status to SENT)
router.post('/:id/send', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  // Check if user has permission to send invoices
  const existingInvoice = await prisma.invoice.findFirst({
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

  if (!existingInvoice) {
    throw createError('Invoice not found or insufficient permissions', 404);
  }

  if (existingInvoice.status !== 'DRAFT') {
    throw createError('Invoice cannot be sent', 400);
  }

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      status: 'SENT'
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

  logger.info(`Invoice sent: ${invoice.invoiceNumber}`, {
    invoiceId: invoice.id,
    userId: user.id
  });

  res.json({
    success: true,
    data: invoice
  });
}));

// Mark invoice as paid
router.post('/:id/pay', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;
  const { amount, paymentDate, paymentMethod } = req.body;

  // Check if user has permission to mark invoices as paid
  const existingInvoice = await prisma.invoice.findFirst({
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

  if (!existingInvoice) {
    throw createError('Invoice not found or insufficient permissions', 404);
  }

  if (existingInvoice.status === 'PAID') {
    throw createError('Invoice is already paid', 400);
  }

  const paymentAmount = Number(amount) || existingInvoice.dueAmount;
  const newPaidAmount = existingInvoice.paidAmount + paymentAmount;
  const newDueAmount = existingInvoice.totalAmount - newPaidAmount;

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
      status: newDueAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID',
      paidAt: newDueAmount <= 0 ? new Date(paymentDate) : existingInvoice.paidAt
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

  logger.info(`Invoice payment recorded: ${invoice.invoiceNumber}`, {
    invoiceId: invoice.id,
    userId: user.id,
    paymentAmount,
    newStatus: invoice.status
  });

  res.json({
    success: true,
    data: invoice
  });
}));

// Delete invoice
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { id } = req.params;

  // Check if user has permission to delete invoices
  const existingInvoice = await prisma.invoice.findFirst({
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

  if (!existingInvoice) {
    throw createError('Invoice not found or insufficient permissions', 404);
  }

  if (existingInvoice.status === 'PAID') {
    throw createError('Cannot delete paid invoice', 400);
  }

  await prisma.invoice.delete({
    where: { id }
  });

  logger.info(`Invoice deleted: ${existingInvoice.invoiceNumber}`, {
    invoiceId: id,
    userId: user.id
  });

  res.json({
    success: true,
    message: 'Invoice deleted successfully'
  });
}));

// Helper function to generate unique invoice number
async function generateInvoiceNumber(businessAccountId: string): Promise<string> {
  const prefix = 'INV';
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Get count of invoices for this business in current month
  const count = await prisma.invoice.count({
    where: {
      businessAccountId,
      createdAt: {
        gte: new Date(year, new Date().getMonth(), 1),
        lt: new Date(year, new Date().getMonth() + 1, 1)
      }
    }
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `${prefix}-${year}${month}-${sequence}`;
}

export default router;
