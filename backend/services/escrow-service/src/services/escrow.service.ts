import { PrismaClient, EscrowStatus, PaymentMethod, TimelineEvent } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Default escrow settings
const DEFAULT_SETTINGS = {
  escrowFeePercentage: 2.5,
  minEscrowFee: 5,
  maxEscrowFee: 500,
  defaultInspectionDays: 3,
  autoReleaseDays: 7
};

export const escrowService = {
  // إنشاء معاملة ضمان - Create escrow transaction
  async createEscrow(data: {
    orderId: string;
    buyerId: string;
    sellerId: string;
    amount: number;
    currency?: string;
    paymentMethod: PaymentMethod;
    description?: string;
    inspectionDays?: number;
    metadata?: any;
  }) {
    const { orderId, buyerId, sellerId, amount, currency = 'USD', paymentMethod, description, inspectionDays, metadata } = data;

    // Check if escrow already exists for this order
    const existing = await prisma.escrowTransaction.findUnique({
      where: { orderId }
    });

    if (existing) {
      throw new Error('Escrow already exists for this order');
    }

    // Calculate fees
    const escrowFeePercentage = DEFAULT_SETTINGS.escrowFeePercentage;
    let escrowFee = amount * (escrowFeePercentage / 100);
    
    // Apply min/max fee limits
    escrowFee = Math.max(escrowFee, DEFAULT_SETTINGS.minEscrowFee);
    escrowFee = Math.min(escrowFee, DEFAULT_SETTINGS.maxEscrowFee);
    
    // Platform fee (1%)
    const platformFee = amount * 0.01;
    
    // Seller receives
    const sellerReceives = amount - escrowFee - platformFee;

    const escrow = await prisma.escrowTransaction.create({
      data: {
        orderId,
        buyerId,
        sellerId,
        amount,
        currency,
        escrowFee,
        platformFee,
        sellerReceives,
        paymentMethod,
        description,
        inspectionDays: inspectionDays || DEFAULT_SETTINGS.defaultInspectionDays,
        metadata,
        timeline: {
          create: {
            event: 'CREATED',
            description: 'Escrow transaction created',
            descriptionAr: 'تم إنشاء معاملة الضمان',
            actor: buyerId,
            actorRole: 'buyer'
          }
        }
      },
      include: {
        timeline: true
      }
    });

    return escrow;
  },

  // تمويل الضمان - Fund escrow (buyer pays)
  async fundEscrow(escrowId: string, paymentReference: string) {
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.status !== 'PENDING') {
      throw new Error('Escrow is not in pending status');
    }

    const updated = await prisma.escrowTransaction.update({
      where: { id: escrowId },
      data: {
        status: 'FUNDED',
        paymentReference,
        fundedAt: new Date(),
        timeline: {
          create: {
            event: 'FUNDED',
            description: `Payment received: ${paymentReference}`,
            descriptionAr: 'تم استلام الدفع',
            actor: escrow.buyerId,
            actorRole: 'buyer'
          }
        }
      }
    });

    return updated;
  },

  // تأكيد الشحن - Confirm shipping
  async confirmShipping(escrowId: string, trackingNumber?: string) {
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.status !== 'FUNDED') {
      throw new Error('Escrow must be funded before shipping');
    }

    const updated = await prisma.escrowTransaction.update({
      where: { id: escrowId },
      data: {
        status: 'SHIPPED',
        shippedAt: new Date(),
        metadata: {
          ...(escrow.metadata as object || {}),
          trackingNumber
        },
        timeline: {
          create: {
            event: 'SHIPPED',
            description: `Item shipped${trackingNumber ? `: ${trackingNumber}` : ''}`,
            descriptionAr: 'تم شحن المنتج',
            actor: escrow.sellerId,
            actorRole: 'seller',
            metadata: { trackingNumber }
          }
        }
      }
    });

    return updated;
  },

  // تأكيد التسليم - Confirm delivery
  async confirmDelivery(escrowId: string) {
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.status !== 'SHIPPED') {
      throw new Error('Item must be shipped before delivery confirmation');
    }

    // Calculate inspection end date
    const inspectionEndsAt = new Date();
    inspectionEndsAt.setDate(inspectionEndsAt.getDate() + escrow.inspectionDays);

    const updated = await prisma.escrowTransaction.update({
      where: { id: escrowId },
      data: {
        status: 'INSPECTION',
        deliveredAt: new Date(),
        inspectionEndsAt,
        timeline: {
          create: {
            event: 'DELIVERED',
            description: `Item delivered. Inspection period: ${escrow.inspectionDays} days`,
            descriptionAr: `تم تسليم المنتج. فترة الفحص: ${escrow.inspectionDays} أيام`,
            actor: escrow.buyerId,
            actorRole: 'buyer'
          }
        }
      }
    });

    return updated;
  },

  // موافقة المشتري - Buyer approval
  async approveTransaction(escrowId: string) {
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (!['DELIVERED', 'INSPECTION'].includes(escrow.status)) {
      throw new Error('Item must be delivered before approval');
    }

    const updated = await prisma.escrowTransaction.update({
      where: { id: escrowId },
      data: {
        status: 'APPROVED',
        timeline: {
          create: {
            event: 'APPROVED',
            description: 'Buyer approved the transaction',
            descriptionAr: 'وافق المشتري على المعاملة',
            actor: escrow.buyerId,
            actorRole: 'buyer'
          }
        }
      }
    });

    // Auto-release funds
    return this.releaseFunds(escrowId);
  },

  // تحرير الأموال للبائع - Release funds to seller
  async releaseFunds(escrowId: string) {
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (!['APPROVED', 'INSPECTION'].includes(escrow.status)) {
      throw new Error('Transaction must be approved before release');
    }

    const updated = await prisma.escrowTransaction.update({
      where: { id: escrowId },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
        timeline: {
          create: {
            event: 'RELEASED',
            description: `Funds released to seller: ${escrow.sellerReceives} ${escrow.currency}`,
            descriptionAr: `تم تحرير الأموال للبائع: ${escrow.sellerReceives} ${escrow.currency}`,
            actorRole: 'system'
          }
        }
      }
    });

    // TODO: Trigger actual payment to seller via payment service

    return updated;
  },

  // استرداد للمشتري - Refund to buyer
  async refundBuyer(escrowId: string, reason: string) {
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (['RELEASED', 'REFUNDED', 'CANCELLED'].includes(escrow.status)) {
      throw new Error('Cannot refund this transaction');
    }

    const updated = await prisma.escrowTransaction.update({
      where: { id: escrowId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        timeline: {
          create: {
            event: 'REFUNDED',
            description: `Refunded to buyer: ${reason}`,
            descriptionAr: `تم الاسترداد للمشتري: ${reason}`,
            actorRole: 'system',
            metadata: { reason }
          }
        }
      }
    });

    // TODO: Trigger actual refund via payment service

    return updated;
  },

  // الحصول على معاملة ضمان - Get escrow transaction
  async getEscrow(escrowId: string) {
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
      include: {
        timeline: {
          orderBy: { createdAt: 'desc' }
        },
        milestones: {
          orderBy: { order: 'asc' }
        },
        dispute: true
      }
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    return escrow;
  },

  // الحصول على معاملات المستخدم - Get user escrows
  async getUserEscrows(userId: string, role: 'buyer' | 'seller' | 'all', options: {
    status?: EscrowStatus;
    limit?: number;
    offset?: number;
  } = {}) {
    const { status, limit = 20, offset = 0 } = options;

    const where: any = {};
    
    if (role === 'buyer') {
      where.buyerId = userId;
    } else if (role === 'seller') {
      where.sellerId = userId;
    } else {
      where.OR = [
        { buyerId: userId },
        { sellerId: userId }
      ];
    }

    if (status) {
      where.status = status;
    }

    const escrows = await prisma.escrowTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        timeline: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    const total = await prisma.escrowTransaction.count({ where });

    return {
      escrows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  },

  // تمديد فترة الفحص - Extend inspection period
  async extendInspection(escrowId: string, additionalDays: number) {
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new Error('Escrow not found');
    }

    if (escrow.status !== 'INSPECTION') {
      throw new Error('Can only extend during inspection period');
    }

    const maxDays = 14;
    const currentDays = escrow.inspectionDays;
    const newDays = Math.min(currentDays + additionalDays, maxDays);

    const newInspectionEndsAt = new Date(escrow.inspectionEndsAt!);
    newInspectionEndsAt.setDate(newInspectionEndsAt.getDate() + (newDays - currentDays));

    const updated = await prisma.escrowTransaction.update({
      where: { id: escrowId },
      data: {
        inspectionDays: newDays,
        inspectionEndsAt: newInspectionEndsAt,
        timeline: {
          create: {
            event: 'INSPECTION_EXTENDED',
            description: `Inspection period extended to ${newDays} days`,
            descriptionAr: `تم تمديد فترة الفحص إلى ${newDays} أيام`,
            actor: escrow.buyerId,
            actorRole: 'buyer'
          }
        }
      }
    });

    return updated;
  },

  // حساب الرسوم - Calculate fees
  async calculateFees(amount: number) {
    const escrowFeePercentage = DEFAULT_SETTINGS.escrowFeePercentage;
    let escrowFee = amount * (escrowFeePercentage / 100);
    
    escrowFee = Math.max(escrowFee, DEFAULT_SETTINGS.minEscrowFee);
    escrowFee = Math.min(escrowFee, DEFAULT_SETTINGS.maxEscrowFee);
    
    const platformFee = amount * 0.01;
    const sellerReceives = amount - escrowFee - platformFee;

    return {
      amount,
      escrowFee,
      escrowFeePercentage,
      platformFee,
      platformFeePercentage: 1,
      totalFees: escrowFee + platformFee,
      sellerReceives
    };
  }
};
