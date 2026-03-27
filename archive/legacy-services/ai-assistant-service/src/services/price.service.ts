// Price Optimization Service - Gen 10 AI
// خدمة تحسين الأسعار - الجيل العاشر

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface PriceAnalysis {
  currentPrice: number;
  suggestedPrice: number;
  priceChange: number;
  changePercent: number;
  expectedRevenue: number;
  expectedSales: number;
  demandElasticity: number;
  competitorAnalysis: {
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    position: string;
  };
  reasoning: string;
  reasoningAr: string;
}

export class PriceService {
  // Optimize price for a product
  async optimizePrice(data: {
    productId: string;
    currentPrice: number;
    cost?: number;
    competitorPrices?: number[];
    historicalSales?: Array<{ price: number; sales: number }>;
    targetMargin?: number;
  }): Promise<PriceAnalysis & { id: string }> {
    // Calculate demand elasticity
    const elasticity = this.calculateElasticity(data.historicalSales || []);
    
    // Analyze competitor prices
    const competitorAnalysis = this.analyzeCompetitors(data.currentPrice, data.competitorPrices || []);
    
    // Calculate optimal price
    const optimalPrice = await this.calculateOptimalPrice({
      currentPrice: data.currentPrice,
      cost: data.cost || data.currentPrice * 0.6,
      elasticity,
      competitorAvg: competitorAnalysis.averagePrice,
      targetMargin: data.targetMargin || 0.3
    });
    
    // Estimate impact
    const impact = this.estimateImpact(data.currentPrice, optimalPrice, elasticity);
    
    // Generate reasoning
    const { reasoning, reasoningAr } = await this.generateReasoning({
      currentPrice: data.currentPrice,
      suggestedPrice: optimalPrice,
      elasticity,
      competitorAnalysis,
      impact
    });

    // Save optimization
    const saved = await prisma.priceOptimization.create({
      data: {
        productId: data.productId,
        currentPrice: new Decimal(data.currentPrice),
        suggestedPrice: new Decimal(optimalPrice),
        demandElasticity: elasticity,
        competitorPrices: data.competitorPrices || [],
        marketTrend: competitorAnalysis.position,
        expectedRevenue: impact.expectedRevenue,
        expectedSales: impact.expectedSales
      }
    });

    return {
      id: saved.id,
      currentPrice: data.currentPrice,
      suggestedPrice: optimalPrice,
      priceChange: optimalPrice - data.currentPrice,
      changePercent: ((optimalPrice - data.currentPrice) / data.currentPrice) * 100,
      expectedRevenue: impact.expectedRevenue,
      expectedSales: impact.expectedSales,
      demandElasticity: elasticity,
      competitorAnalysis,
      reasoning,
      reasoningAr
    };
  }

  // Calculate demand elasticity
  private calculateElasticity(historicalSales: Array<{ price: number; sales: number }>): number {
    if (historicalSales.length < 2) return -1.5; // Default elastic demand
    
    // Calculate price elasticity of demand
    const sorted = [...historicalSales].sort((a, b) => a.price - b.price);
    
    let totalElasticity = 0;
    let count = 0;
    
    for (let i = 1; i < sorted.length; i++) {
      const priceChange = (sorted[i].price - sorted[i-1].price) / sorted[i-1].price;
      const salesChange = (sorted[i].sales - sorted[i-1].sales) / sorted[i-1].sales;
      
      if (priceChange !== 0) {
        totalElasticity += salesChange / priceChange;
        count++;
      }
    }
    
    return count > 0 ? totalElasticity / count : -1.5;
  }

  // Analyze competitor prices
  private analyzeCompetitors(currentPrice: number, competitorPrices: number[]) {
    if (!competitorPrices.length) {
      return {
        averagePrice: currentPrice,
        minPrice: currentPrice,
        maxPrice: currentPrice,
        position: 'unknown'
      };
    }
    
    const avgPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
    const minPrice = Math.min(...competitorPrices);
    const maxPrice = Math.max(...competitorPrices);
    
    let position: string;
    if (currentPrice < avgPrice * 0.9) position = 'below_market';
    else if (currentPrice > avgPrice * 1.1) position = 'above_market';
    else position = 'competitive';
    
    return { averagePrice: avgPrice, minPrice, maxPrice, position };
  }

  // Calculate optimal price
  private async calculateOptimalPrice(params: {
    currentPrice: number;
    cost: number;
    elasticity: number;
    competitorAvg: number;
    targetMargin: number;
  }): Promise<number> {
    const { currentPrice, cost, elasticity, competitorAvg, targetMargin } = params;
    
    // Minimum price based on cost and target margin
    const minPrice = cost / (1 - targetMargin);
    
    // Optimal price using elasticity (markup rule)
    // Optimal markup = 1 / (1 + elasticity)
    const optimalMarkup = elasticity !== -1 ? 1 / (1 + elasticity) : 0.3;
    const elasticityBasedPrice = cost * (1 + Math.abs(optimalMarkup));
    
    // Consider competitor prices
    const competitorWeight = 0.3;
    const elasticityWeight = 0.5;
    const currentWeight = 0.2;
    
    let suggestedPrice = 
      elasticityBasedPrice * elasticityWeight +
      competitorAvg * competitorWeight +
      currentPrice * currentWeight;
    
    // Ensure minimum margin
    suggestedPrice = Math.max(suggestedPrice, minPrice);
    
    // Round to nice price point
    suggestedPrice = this.roundToNicePrice(suggestedPrice);
    
    return suggestedPrice;
  }

  // Round to psychologically appealing price
  private roundToNicePrice(price: number): number {
    if (price < 10) return Math.round(price * 100) / 100;
    if (price < 100) return Math.round(price) - 0.01;
    if (price < 1000) return Math.round(price / 5) * 5 - 0.01;
    return Math.round(price / 10) * 10 - 0.01;
  }

  // Estimate impact of price change
  private estimateImpact(currentPrice: number, newPrice: number, elasticity: number) {
    const priceChangePercent = (newPrice - currentPrice) / currentPrice;
    const salesChangePercent = priceChangePercent * elasticity;
    
    // Assume base sales of 100 units
    const baseSales = 100;
    const newSales = Math.round(baseSales * (1 + salesChangePercent));
    
    const currentRevenue = currentPrice * baseSales;
    const newRevenue = newPrice * newSales;
    
    return {
      expectedSales: newSales,
      expectedRevenue: newRevenue,
      revenueChange: newRevenue - currentRevenue,
      revenueChangePercent: ((newRevenue - currentRevenue) / currentRevenue) * 100
    };
  }


  // Generate AI reasoning for price suggestion
  private async generateReasoning(params: any): Promise<{ reasoning: string; reasoningAr: string }> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a pricing expert. Explain the price recommendation in 2-3 sentences. Be concise and data-driven.'
          },
          {
            role: 'user',
            content: `Current price: ${params.currentPrice}, Suggested: ${params.suggestedPrice}, Elasticity: ${params.elasticity}, Competitor avg: ${params.competitorAnalysis.averagePrice}, Position: ${params.competitorAnalysis.position}`
          }
        ],
        temperature: 0.5,
        max_tokens: 200
      });

      const reasoning = response.choices[0]?.message?.content || 'Price optimized based on market analysis.';
      
      // Translate to Arabic
      const arResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Translate to Arabic. Return only the translation.' },
          { role: 'user', content: reasoning }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      const reasoningAr = arResponse.choices[0]?.message?.content || 'تم تحسين السعر بناءً على تحليل السوق.';

      return { reasoning, reasoningAr };
    } catch {
      return {
        reasoning: 'Price optimized based on market analysis and demand patterns.',
        reasoningAr: 'تم تحسين السعر بناءً على تحليل السوق وأنماط الطلب.'
      };
    }
  }

  // Batch price optimization
  async batchOptimize(products: Array<{
    productId: string;
    currentPrice: number;
    cost?: number;
    competitorPrices?: number[];
  }>) {
    const results = await Promise.all(
      products.map(p => this.optimizePrice(p))
    );

    const summary = {
      total: results.length,
      priceIncreases: results.filter(r => r.priceChange > 0).length,
      priceDecreases: results.filter(r => r.priceChange < 0).length,
      noChange: results.filter(r => r.priceChange === 0).length,
      avgChangePercent: results.reduce((sum, r) => sum + r.changePercent, 0) / results.length,
      totalExpectedRevenueChange: results.reduce((sum, r) => sum + (r.expectedRevenue - r.currentPrice * 100), 0)
    };

    return { results, summary };
  }

  // Dynamic pricing based on real-time factors
  async getDynamicPrice(data: {
    productId: string;
    basePrice: number;
    currentInventory: number;
    demandLevel: 'low' | 'medium' | 'high';
    timeOfDay?: number;
    dayOfWeek?: number;
    isHoliday?: boolean;
  }) {
    let multiplier = 1;
    
    // Inventory-based adjustment
    if (data.currentInventory < 10) multiplier *= 1.1; // Low stock premium
    else if (data.currentInventory > 100) multiplier *= 0.95; // High stock discount
    
    // Demand-based adjustment
    if (data.demandLevel === 'high') multiplier *= 1.15;
    else if (data.demandLevel === 'low') multiplier *= 0.9;
    
    // Time-based adjustment
    if (data.timeOfDay !== undefined) {
      // Peak hours (10am-2pm, 7pm-10pm)
      if ((data.timeOfDay >= 10 && data.timeOfDay <= 14) || 
          (data.timeOfDay >= 19 && data.timeOfDay <= 22)) {
        multiplier *= 1.05;
      }
    }
    
    // Day of week adjustment
    if (data.dayOfWeek !== undefined) {
      // Weekend premium
      if (data.dayOfWeek === 0 || data.dayOfWeek === 6) {
        multiplier *= 1.05;
      }
    }
    
    // Holiday adjustment
    if (data.isHoliday) multiplier *= 1.1;
    
    const dynamicPrice = this.roundToNicePrice(data.basePrice * multiplier);
    
    return {
      productId: data.productId,
      basePrice: data.basePrice,
      dynamicPrice,
      multiplier,
      factors: {
        inventory: data.currentInventory < 10 ? 'low_stock' : data.currentInventory > 100 ? 'high_stock' : 'normal',
        demand: data.demandLevel,
        timeOfDay: data.timeOfDay,
        dayOfWeek: data.dayOfWeek,
        isHoliday: data.isHoliday
      },
      validUntil: new Date(Date.now() + 3600000) // Valid for 1 hour
    };
  }

  // Apply price optimization
  async applyOptimization(optimizationId: string) {
    return prisma.priceOptimization.update({
      where: { id: optimizationId },
      data: {
        applied: true,
        appliedAt: new Date()
      }
    });
  }

  // Get price history and analytics
  async getPriceAnalytics(productId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const optimizations = await prisma.priceOptimization.findMany({
      where: {
        productId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' }
    });

    const applied = optimizations.filter(o => o.applied);
    const pending = optimizations.filter(o => !o.applied);

    return {
      productId,
      period: `${days} days`,
      totalOptimizations: optimizations.length,
      applied: applied.length,
      pending: pending.length,
      averageSuggestedChange: optimizations.length 
        ? optimizations.reduce((sum, o) => {
            const current = Number(o.currentPrice);
            const suggested = Number(o.suggestedPrice);
            return sum + ((suggested - current) / current * 100);
          }, 0) / optimizations.length
        : 0,
      recentOptimizations: optimizations.slice(0, 5).map(o => ({
        id: o.id,
        currentPrice: Number(o.currentPrice),
        suggestedPrice: Number(o.suggestedPrice),
        applied: o.applied,
        createdAt: o.createdAt
      }))
    };
  }

  // A/B test price
  async createPriceTest(data: {
    productId: string;
    priceA: number;
    priceB: number;
    duration: number; // days
  }) {
    // In production, this would create an A/B test configuration
    return {
      testId: `test_${Date.now()}`,
      productId: data.productId,
      variants: {
        A: { price: data.priceA, traffic: 50 },
        B: { price: data.priceB, traffic: 50 }
      },
      startDate: new Date(),
      endDate: new Date(Date.now() + data.duration * 24 * 60 * 60 * 1000),
      status: 'active',
      message: 'A/B test created successfully',
      messageAr: 'تم إنشاء اختبار A/B بنجاح'
    };
  }

  // Get competitor price monitoring
  async monitorCompetitorPrices(productId: string, competitors: string[]) {
    // In production, this would scrape or use APIs to get competitor prices
    const mockPrices = competitors.map(c => ({
      competitor: c,
      price: Math.random() * 100 + 50,
      lastUpdated: new Date()
    }));

    const avgPrice = mockPrices.reduce((sum, p) => sum + p.price, 0) / mockPrices.length;

    return {
      productId,
      competitors: mockPrices,
      averagePrice: avgPrice,
      lowestPrice: Math.min(...mockPrices.map(p => p.price)),
      highestPrice: Math.max(...mockPrices.map(p => p.price)),
      recommendation: avgPrice > 75 ? 'Consider price increase' : 'Price is competitive',
      recommendationAr: avgPrice > 75 ? 'فكر في زيادة السعر' : 'السعر تنافسي'
    };
  }
}

export const priceService = new PriceService();
