// Price Service - خدمة التسعير
// Price optimization, elasticity analysis

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type PriceAction = 'INCREASE' | 'DECREASE' | 'MAINTAIN' | 'DISCOUNT' | 'PREMIUM';

export class PriceService {
  // ==========================================
  // 💰 PRICE OPTIMIZATION
  // ==========================================

  async optimizePrice(productId: string, currentPrice: number, currentDemand: number) {
    // Get historical price-demand data
    const history = await prisma.salesHistory.findMany({
      where: { productId },
      orderBy: { date: 'desc' },
      take: 90,
    });

    if (history.length < 14) {
      throw new Error('Insufficient data for price optimization');
    }

    // Calculate price elasticity
    const elasticity = this.calculateElasticity(history);

    // Find optimal price
    const { optimalPrice, expectedDemand, expectedRevenue } = this.findOptimalPrice(
      currentPrice,
      currentDemand,
      elasticity
    );

    // Determine recommendation
    const priceChange = ((optimalPrice - currentPrice) / currentPrice) * 100;
    const recommendation = this.determineRecommendation(priceChange, elasticity);

    // Calculate confidence
    const confidence = Math.min(0.95, 0.5 + history.length * 0.005);

    // Save optimization
    const optimization = await prisma.priceOptimization.create({
      data: {
        productId,
        currentPrice,
        currentDemand,
        optimalPrice,
        expectedDemand,
        expectedRevenue,
        elasticity,
        recommendation,
        priceChange,
        confidence,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Valid for 7 days
      },
    });

    return optimization;
  }

  private calculateElasticity(history: any[]): number {
    // Group by price ranges and calculate average demand
    const priceGroups = new Map<number, number[]>();

    for (const h of history) {
      const priceKey = Math.round(h.avgPrice / 5) * 5; // Round to nearest 5
      if (!priceGroups.has(priceKey)) {
        priceGroups.set(priceKey, []);
      }
      priceGroups.get(priceKey)!.push(h.quantity);
    }

    // Calculate average demand per price point
    const pricePoints: { price: number; demand: number }[] = [];
    priceGroups.forEach((demands, price) => {
      pricePoints.push({
        price,
        demand: demands.reduce((a, b) => a + b, 0) / demands.length,
      });
    });

    if (pricePoints.length < 2) {
      return -1.0; // Default elasticity
    }

    // Sort by price
    pricePoints.sort((a, b) => a.price - b.price);

    // Calculate elasticity using midpoint method
    let totalElasticity = 0;
    let count = 0;

    for (let i = 1; i < pricePoints.length; i++) {
      const p1 = pricePoints[i - 1];
      const p2 = pricePoints[i];

      const pctPriceChange = (p2.price - p1.price) / ((p2.price + p1.price) / 2);
      const pctDemandChange = (p2.demand - p1.demand) / ((p2.demand + p1.demand) / 2);

      if (pctPriceChange !== 0) {
        totalElasticity += pctDemandChange / pctPriceChange;
        count++;
      }
    }

    return count > 0 ? totalElasticity / count : -1.0;
  }

  private findOptimalPrice(
    currentPrice: number,
    currentDemand: number,
    elasticity: number
  ): { optimalPrice: number; expectedDemand: number; expectedRevenue: number } {
    // Test price points from -20% to +20%
    const pricePoints = [];
    for (let pct = -20; pct <= 20; pct += 2) {
      const testPrice = currentPrice * (1 + pct / 100);
      const expectedDemand = currentDemand * Math.pow(testPrice / currentPrice, elasticity);
      const expectedRevenue = testPrice * expectedDemand;
      pricePoints.push({ price: testPrice, demand: expectedDemand, revenue: expectedRevenue });
    }

    // Find price with maximum revenue
    const optimal = pricePoints.reduce((best, current) =>
      current.revenue > best.revenue ? current : best
    );

    return {
      optimalPrice: Math.round(optimal.price * 100) / 100,
      expectedDemand: Math.round(optimal.demand),
      expectedRevenue: Math.round(optimal.revenue * 100) / 100,
    };
  }

  private determineRecommendation(priceChange: number, elasticity: number): PriceAction {
    if (priceChange > 10) return 'PREMIUM';
    if (priceChange > 3) return 'INCREASE';
    if (priceChange < -10) return 'DISCOUNT';
    if (priceChange < -3) return 'DECREASE';
    return 'MAINTAIN';
  }

  // ==========================================
  // 📊 GET OPTIMIZATIONS
  // ==========================================

  async getOptimizations(filters: {
    status?: string;
    recommendation?: PriceAction;
    page?: number;
    limit?: number;
  }) {
    const { status, recommendation, page = 1, limit = 20 } = filters;

    const [optimizations, total] = await Promise.all([
      prisma.priceOptimization.findMany({
        where: {
          expiresAt: { gt: new Date() },
          ...(status && { status: status as any }),
          ...(recommendation && { recommendation }),
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.priceOptimization.count({
        where: {
          expiresAt: { gt: new Date() },
          ...(status && { status: status as any }),
        },
      }),
    ]);

    return { optimizations, total, page, limit };
  }

  async getProductOptimization(productId: string) {
    return prisma.priceOptimization.findFirst({
      where: {
        productId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async applyOptimization(optimizationId: string) {
    return prisma.priceOptimization.update({
      where: { id: optimizationId },
      data: {
        status: 'APPLIED',
        appliedAt: new Date(),
      },
    });
  }

  async rejectOptimization(optimizationId: string) {
    return prisma.priceOptimization.update({
      where: { id: optimizationId },
      data: { status: 'REJECTED' },
    });
  }
}

export const priceService = new PriceService();
