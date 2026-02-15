import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CommissionService {
  async calculateCommission(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const commissions = [];

    for (const item of order.items) {
      if (!item.variantId) continue;

      // Get variant and product
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
        include: {
          product: true
        }
      });

      if (!variant) continue;

      // Get vendor
      const vendor = await prisma.vendor.findUnique({
        where: { userId: variant.product.sellerId }
      });

      if (!vendor) continue;

      // Calculate commission
      const saleAmount = item.unitPrice * item.quantity;
      const commissionRate = vendor.commissionRate;
      const commissionAmount = Math.round(saleAmount * (commissionRate / 100));
      const netAmount = saleAmount - commissionAmount;

      // Create commission record
      const commission = await prisma.vendorCommission.create({
        data: {
          vendorId: vendor.id,
          orderId: order.id,
          orderItemId: item.id,
          productId: variant.product.id,
          saleAmount,
          commissionRate,
          commissionAmount,
          netAmount,
          status: 'pending'
        }
      });

      commissions.push(commission);

      // Update vendor analytics
      await this.updateVendorAnalytics(vendor.id, saleAmount);
    }

    return commissions;
  }

  async approveCommission(commissionId: string) {
    return await prisma.vendorCommission.update({
      where: { id: commissionId },
      data: { status: 'approved' }
    });
  }

  async markCommissionPaid(commissionId: string) {
    return await prisma.vendorCommission.update({
      where: { id: commissionId },
      data: {
        status: 'paid',
        paidAt: new Date()
      }
    });
  }

  async getCommission(id: string) {
    return await prisma.vendorCommission.findUnique({
      where: { id }
    });
  }

  async listCommissions(filters: {
    vendorId?: string;
    orderId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.orderId) where.orderId = filters.orderId;
    if (filters.status) where.status = filters.status;

    const [commissions, count] = await Promise.all([
      prisma.vendorCommission.findMany({
        where,
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.vendorCommission.count({ where })
    ]);

    return { commissions, count };
  }

  async getVendorCommissionSummary(vendorId: string) {
    const [pending, approved, paid] = await Promise.all([
      prisma.vendorCommission.aggregate({
        where: { vendorId, status: 'pending' },
        _sum: { netAmount: true },
        _count: true
      }),
      prisma.vendorCommission.aggregate({
        where: { vendorId, status: 'approved' },
        _sum: { netAmount: true },
        _count: true
      }),
      prisma.vendorCommission.aggregate({
        where: { vendorId, status: 'paid' },
        _sum: { netAmount: true },
        _count: true
      })
    ]);

    return {
      pending: {
        amount: pending._sum.netAmount || 0,
        count: pending._count
      },
      approved: {
        amount: approved._sum.netAmount || 0,
        count: approved._count
      },
      paid: {
        amount: paid._sum.netAmount || 0,
        count: paid._count
      }
    };
  }

  private async updateVendorAnalytics(vendorId: string, saleAmount: number) {
    const analytics = await prisma.vendorAnalytics.findUnique({
      where: { vendorId }
    });

    if (!analytics) return;

    const newTotalSales = analytics.totalSales + saleAmount;
    const newTotalOrders = analytics.totalOrders + 1;
    const newAverageOrderValue = Math.round(newTotalSales / newTotalOrders);

    await prisma.vendorAnalytics.update({
      where: { vendorId },
      data: {
        totalSales: newTotalSales,
        totalOrders: newTotalOrders,
        averageOrderValue: newAverageOrderValue,
        lastSaleAt: new Date()
      }
    });
  }
}
