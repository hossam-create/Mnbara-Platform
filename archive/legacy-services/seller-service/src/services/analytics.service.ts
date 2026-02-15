import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AnalyticsService {
  // Get Sales Analytics
  async getSalesAnalytics(sellerId: string, startDate: Date, endDate: Date) {
    const sales = await prisma.sale.findMany({
      where: {
        sellerId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Group by date
    const salesByDate = this.groupByDate(sales);

    // Top products
    const productSales = new Map<string, { count: number; revenue: number }>();
    sales.forEach(sale => {
      const existing = productSales.get(sale.productId) || { count: 0, revenue: 0 };
      productSales.set(sale.productId, {
        count: existing.count + sale.quantity,
        revenue: existing.revenue + sale.totalPrice,
      });
    });

    const topProducts = await this.getTopProducts(sellerId, productSales);

    return {
      summary: {
        totalSales,
        totalRevenue,
        totalProfit,
        avgOrderValue,
      },
      salesByDate,
      topProducts,
    };
  }

  // Get Product Performance
  async getProductPerformance(sellerId: string, productId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sales = await prisma.sale.findMany({
      where: {
        sellerId,
        productId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
    });

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        views: true,
        favorites: true,
        sold: true,
      },
    });

    const totalSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const conversionRate = product?.views ? (totalSold / product.views) * 100 : 0;

    return {
      totalSold,
      totalRevenue,
      conversionRate,
      views: product?.views || 0,
      favorites: product?.favorites || 0,
      salesHistory: this.groupByDate(sales),
    };
  }

  // Get Dashboard Metrics
  async getDashboardMetrics(sellerId: string) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Today's sales
    const todaySales = await this.getSalesSummary(sellerId, today, today);
    const yesterdaySales = await this.getSalesSummary(sellerId, yesterday, yesterday);
    const weekSales = await this.getSalesSummary(sellerId, lastWeek, today);
    const monthSales = await this.getSalesSummary(sellerId, lastMonth, today);

    // Inventory status
    const inventory = await prisma.inventory.findMany({
      where: { sellerId },
    });

    const lowStock = inventory.filter(i => i.available <= i.reorderPoint).length;
    const outOfStock = inventory.filter(i => i.available === 0).length;

    // Recent orders
    const recentOrders = await prisma.sale.findMany({
      where: { sellerId },
      include: {
        product: {
          select: {
            title: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      today: todaySales,
      yesterday: yesterdaySales,
      week: weekSales,
      month: monthSales,
      inventory: {
        total: inventory.length,
        lowStock,
        outOfStock,
      },
      recentOrders,
    };
  }

  // Helper: Get Sales Summary
  private async getSalesSummary(sellerId: string, startDate: Date, endDate: Date) {
    const sales = await prisma.sale.findMany({
      where: {
        sellerId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return {
      count: sales.length,
      revenue: sales.reduce((sum, sale) => sum + sale.totalPrice, 0),
      profit: sales.reduce((sum, sale) => sum + (sale.profit || 0), 0),
    };
  }

  // Helper: Group Sales by Date
  private groupByDate(sales: any[]) {
    const grouped = new Map<string, { count: number; revenue: number }>();

    sales.forEach(sale => {
      const date = sale.createdAt.toISOString().split('T')[0];
      const existing = grouped.get(date) || { count: 0, revenue: 0 };
      grouped.set(date, {
        count: existing.count + 1,
        revenue: existing.revenue + sale.totalPrice,
      });
    });

    return Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  // Helper: Get Top Products
  private async getTopProducts(
    sellerId: string,
    productSales: Map<string, { count: number; revenue: number }>
  ) {
    const topProductIds = Array.from(productSales.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10)
      .map(([id]) => id);

    const products = await prisma.product.findMany({
      where: {
        id: { in: topProductIds },
        sellerId,
      },
      select: {
        id: true,
        title: true,
        images: true,
        price: true,
      },
    });

    return products.map(product => ({
      ...product,
      ...productSales.get(product.id),
    }));
  }
}
