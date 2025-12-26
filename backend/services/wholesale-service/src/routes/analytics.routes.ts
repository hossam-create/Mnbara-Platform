// Analytics Routes - Wholesale B2B
// مسارات التحليلات - البيع بالجملة

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get supplier analytics
router.get('/supplier/:supplierId', async (req, res) => {
  try {
    const { period } = req.query;
    const startDate = new Date();
    
    switch (period) {
      case 'week': startDate.setDate(startDate.getDate() - 7); break;
      case 'month': startDate.setMonth(startDate.getMonth() - 1); break;
      case 'year': startDate.setFullYear(startDate.getFullYear() - 1); break;
      default: startDate.setMonth(startDate.getMonth() - 1);
    }

    const analytics = await prisma.wholesaleAnalytics.findMany({
      where: {
        supplierId: req.params.supplierId,
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    });

    res.json({ success: true, data: analytics });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get supplier summary
router.get('/supplier/:supplierId/summary', async (req, res) => {
  try {
    const supplierId = req.params.supplierId;

    const [orders, products, reviews] = await Promise.all([
      prisma.bulkOrder.aggregate({
        where: { supplierId },
        _count: true,
        _sum: { totalAmount: true }
      }),
      prisma.wholesaleProduct.count({
        where: { supplierId, status: 'ACTIVE' }
      }),
      prisma.supplierReview.aggregate({
        where: { supplierId },
        _avg: { overallRating: true },
        _count: true
      })
    ]);

    res.json({
      success: true,
      data: {
        totalOrders: orders._count,
        totalRevenue: orders._sum.totalAmount || 0,
        activeProducts: products,
        avgRating: reviews._avg.overallRating || 0,
        totalReviews: reviews._count
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get top products
router.get('/supplier/:supplierId/top-products', async (req, res) => {
  try {
    const topProducts = await prisma.bulkOrderItem.groupBy({
      by: ['productId'],
      where: {
        order: { supplierId: req.params.supplierId, status: 'COMPLETED' }
      },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: 10
    });

    res.json({ success: true, data: topProducts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get platform analytics (admin)
router.get('/platform', async (req, res) => {
  try {
    const [suppliers, products, orders] = await Promise.all([
      prisma.supplier.count({ where: { status: 'ACTIVE' } }),
      prisma.wholesaleProduct.count({ where: { status: 'ACTIVE' } }),
      prisma.bulkOrder.aggregate({
        _count: true,
        _sum: { totalAmount: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        activeSuppliers: suppliers,
        activeProducts: products,
        totalOrders: orders._count,
        totalGMV: orders._sum.totalAmount || 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
