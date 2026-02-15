// Inventory Service - خدمة المخزون
// Inventory optimization, reorder recommendations

import { PrismaClient } from '@prisma/client';
import { forecastService } from './forecast.service';

const prisma = new PrismaClient();

type StockoutRisk = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type OverstockRisk = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
type InventoryAction = 'REORDER_NOW' | 'REORDER_SOON' | 'MAINTAIN' | 'REDUCE_STOCK' | 'CLEARANCE';
type Urgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export class InventoryService {
  // ==========================================
  // 📦 INVENTORY RECOMMENDATIONS
  // ==========================================

  async generateRecommendation(productId: string, currentStock: number, warehouseId?: string) {
    // Get forecast for next 30 days
    const forecasts = await forecastService.getForecasts('PRODUCT', productId, 'DAILY');
    const next30Days = forecasts.slice(0, 30);

    if (next30Days.length === 0) {
      // Generate forecast if not exists
      await forecastService.generateForecast('PRODUCT', productId, 'DAILY', 30);
      return this.generateRecommendation(productId, currentStock, warehouseId);
    }

    // Calculate metrics
    const forecastedDemand = next30Days.reduce((sum, f) => sum + f.predictedDemand, 0);
    const avgDailySales = forecastedDemand / 30;
    const daysOfStock = avgDailySales > 0 ? currentStock / avgDailySales : 999;

    // Calculate safety stock (2 weeks of average sales)
    const safetyStock = Math.ceil(avgDailySales * 14);

    // Calculate reorder point (lead time demand + safety stock)
    const leadTimeDays = 7; // Assume 7 days lead time
    const reorderPoint = Math.ceil(avgDailySales * leadTimeDays + safetyStock);

    // Calculate reorder quantity (EOQ simplified)
    const reorderQuantity = Math.ceil(avgDailySales * 30); // 1 month supply

    // Assess risks
    const stockoutRisk = this.assessStockoutRisk(daysOfStock, avgDailySales);
    const overstockRisk = this.assessOverstockRisk(daysOfStock, avgDailySales);

    // Determine action
    const { action, urgency } = this.determineAction(currentStock, reorderPoint, daysOfStock, stockoutRisk);

    // Save recommendation
    const recommendation = await prisma.inventoryRecommendation.create({
      data: {
        productId,
        warehouseId,
        currentStock,
        avgDailySales,
        daysOfStock,
        forecastedDemand,
        reorderPoint,
        reorderQuantity,
        safetyStock,
        stockoutRisk,
        overstockRisk,
        action,
        urgency,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Valid for 24 hours
      },
    });

    // Create alert if needed
    if (stockoutRisk === 'CRITICAL' || stockoutRisk === 'HIGH') {
      await this.createStockAlert(productId, stockoutRisk, daysOfStock);
    }

    return recommendation;
  }

  private assessStockoutRisk(daysOfStock: number, avgDailySales: number): StockoutRisk {
    if (avgDailySales === 0) return 'NONE';
    if (daysOfStock <= 3) return 'CRITICAL';
    if (daysOfStock <= 7) return 'HIGH';
    if (daysOfStock <= 14) return 'MEDIUM';
    if (daysOfStock <= 21) return 'LOW';
    return 'NONE';
  }

  private assessOverstockRisk(daysOfStock: number, avgDailySales: number): OverstockRisk {
    if (avgDailySales === 0 && daysOfStock > 0) return 'HIGH';
    if (daysOfStock > 90) return 'HIGH';
    if (daysOfStock > 60) return 'MEDIUM';
    if (daysOfStock > 45) return 'LOW';
    return 'NONE';
  }

  private determineAction(
    currentStock: number,
    reorderPoint: number,
    daysOfStock: number,
    stockoutRisk: StockoutRisk
  ): { action: InventoryAction; urgency: Urgency } {
    if (stockoutRisk === 'CRITICAL') {
      return { action: 'REORDER_NOW', urgency: 'CRITICAL' };
    }
    if (stockoutRisk === 'HIGH' || currentStock <= reorderPoint) {
      return { action: 'REORDER_NOW', urgency: 'HIGH' };
    }
    if (stockoutRisk === 'MEDIUM') {
      return { action: 'REORDER_SOON', urgency: 'MEDIUM' };
    }
    if (daysOfStock > 90) {
      return { action: 'REDUCE_STOCK', urgency: 'MEDIUM' };
    }
    if (daysOfStock > 120) {
      return { action: 'CLEARANCE', urgency: 'HIGH' };
    }
    return { action: 'MAINTAIN', urgency: 'LOW' };
  }

  private async createStockAlert(productId: string, risk: StockoutRisk, daysOfStock: number) {
    await prisma.forecastAlert.create({
      data: {
        alertType: 'STOCKOUT_WARNING',
        severity: risk === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        targetType: 'PRODUCT',
        targetId: productId,
        title: `Low Stock Alert - ${daysOfStock.toFixed(1)} days remaining`,
        titleAr: `تنبيه مخزون منخفض - ${daysOfStock.toFixed(1)} يوم متبقي`,
        message: `Product ${productId} has only ${daysOfStock.toFixed(1)} days of stock remaining. Immediate reorder recommended.`,
        messageAr: `المنتج ${productId} لديه ${daysOfStock.toFixed(1)} يوم فقط من المخزون. يوصى بإعادة الطلب فوراً.`,
        data: { daysOfStock, risk },
      },
    });
  }

  // ==========================================
  // 📊 GET RECOMMENDATIONS
  // ==========================================

  async getRecommendations(filters: {
    urgency?: Urgency;
    action?: InventoryAction;
    warehouseId?: string;
    page?: number;
    limit?: number;
  }) {
    const { urgency, action, warehouseId, page = 1, limit = 20 } = filters;

    const [recommendations, total] = await Promise.all([
      prisma.inventoryRecommendation.findMany({
        where: {
          expiresAt: { gt: new Date() },
          ...(urgency && { urgency }),
          ...(action && { action }),
          ...(warehouseId && { warehouseId }),
        },
        orderBy: [
          { urgency: 'desc' },
          { daysOfStock: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inventoryRecommendation.count({
        where: {
          expiresAt: { gt: new Date() },
          ...(urgency && { urgency }),
          ...(action && { action }),
        },
      }),
    ]);

    return { recommendations, total, page, limit };
  }

  async getProductRecommendation(productId: string) {
    return prisma.inventoryRecommendation.findFirst({
      where: {
        productId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==========================================
  // 📈 INVENTORY ANALYTICS
  // ==========================================

  async getInventoryHealth() {
    const recommendations = await prisma.inventoryRecommendation.findMany({
      where: { expiresAt: { gt: new Date() } },
    });

    const health = {
      total: recommendations.length,
      critical: recommendations.filter(r => r.urgency === 'CRITICAL').length,
      high: recommendations.filter(r => r.urgency === 'HIGH').length,
      medium: recommendations.filter(r => r.urgency === 'MEDIUM').length,
      low: recommendations.filter(r => r.urgency === 'LOW').length,
      stockoutRisk: {
        critical: recommendations.filter(r => r.stockoutRisk === 'CRITICAL').length,
        high: recommendations.filter(r => r.stockoutRisk === 'HIGH').length,
        medium: recommendations.filter(r => r.stockoutRisk === 'MEDIUM').length,
      },
      overstockRisk: {
        high: recommendations.filter(r => r.overstockRisk === 'HIGH').length,
        medium: recommendations.filter(r => r.overstockRisk === 'MEDIUM').length,
      },
    };

    return health;
  }
}

export const inventoryService = new InventoryService();
