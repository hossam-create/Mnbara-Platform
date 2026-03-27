import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PayoutService {
  async createPayout(vendorId: string, commissionIds: string[], method: string) {
    // Get commissions
    const commissions = await prisma.vendorCommission.findMany({
      where: {
        id: { in: commissionIds },
        vendorId,
        status: 'approved'
      }
    });

    if (commissions.length === 0) {
      throw new Error('No approved commissions found');
    }

    // Calculate total amount
    const amount = commissions.reduce((sum, c) => sum + c.netAmount, 0);

    // Create payout
    const payout = await prisma.vendorPayout.create({
      data: {
        vendorId,
        amount,
        currency: 'SAR',
        method,
        status: 'pending',
        commissionIds: commissionIds
      }
    });

    return payout;
  }

  async processPayout(payoutId: string, reference?: string) {
    const payout = await prisma.vendorPayout.update({
      where: { id: payoutId },
      data: {
        status: 'processing',
        reference
      }
    });

    return payout;
  }

  async completePayout(payoutId: string, reference: string) {
    const payout = await prisma.vendorPayout.findUnique({
      where: { id: payoutId }
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    // Update payout status
    await prisma.vendorPayout.update({
      where: { id: payoutId },
      data: {
        status: 'completed',
        reference,
        processedAt: new Date()
      }
    });

    // Mark commissions as paid
    const commissionIds = payout.commissionIds as string[];
    await prisma.vendorCommission.updateMany({
      where: {
        id: { in: commissionIds }
      },
      data: {
        status: 'paid',
        paidAt: new Date()
      }
    });

    // Update vendor analytics
    await this.updateVendorPayoutAnalytics(payout.vendorId, payout.amount);

    return payout;
  }

  async failPayout(payoutId: string, failureReason: string) {
    return await prisma.vendorPayout.update({
      where: { id: payoutId },
      data: {
        status: 'failed',
        failureReason
      }
    });
  }

  async getPayout(id: string) {
    return await prisma.vendorPayout.findUnique({
      where: { id },
      include: {
        vendor: true
      }
    });
  }

  async listPayouts(filters: {
    vendorId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.status) where.status = filters.status;

    const [payouts, count] = await Promise.all([
      prisma.vendorPayout.findMany({
        where,
        include: {
          vendor: true
        },
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.vendorPayout.count({ where })
    ]);

    return { payouts, count };
  }

  async batchCreatePayouts(vendorIds: string[], method: string) {
    const payouts = [];

    for (const vendorId of vendorIds) {
      // Get approved commissions
      const commissions = await prisma.vendorCommission.findMany({
        where: {
          vendorId,
          status: 'approved'
        }
      });

      if (commissions.length === 0) continue;

      const commissionIds = commissions.map(c => c.id);
      const payout = await this.createPayout(vendorId, commissionIds, method);
      payouts.push(payout);
    }

    return payouts;
  }

  async getVendorPayoutSummary(vendorId: string) {
    const [pending, processing, completed, failed] = await Promise.all([
      prisma.vendorPayout.aggregate({
        where: { vendorId, status: 'pending' },
        _sum: { amount: true },
        _count: true
      }),
      prisma.vendorPayout.aggregate({
        where: { vendorId, status: 'processing' },
        _sum: { amount: true },
        _count: true
      }),
      prisma.vendorPayout.aggregate({
        where: { vendorId, status: 'completed' },
        _sum: { amount: true },
        _count: true
      }),
      prisma.vendorPayout.aggregate({
        where: { vendorId, status: 'failed' },
        _sum: { amount: true },
        _count: true
      })
    ]);

    return {
      pending: {
        amount: pending._sum.amount || 0,
        count: pending._count
      },
      processing: {
        amount: processing._sum.amount || 0,
        count: processing._count
      },
      completed: {
        amount: completed._sum.amount || 0,
        count: completed._count
      },
      failed: {
        amount: failed._sum.amount || 0,
        count: failed._count
      }
    };
  }

  private async updateVendorPayoutAnalytics(vendorId: string, payoutAmount: number) {
    const analytics = await prisma.vendorAnalytics.findUnique({
      where: { vendorId }
    });

    if (!analytics) return;

    await prisma.vendorAnalytics.update({
      where: { vendorId },
      data: {
        totalPayouts: analytics.totalPayouts + payoutAmount
      }
    });
  }
}
