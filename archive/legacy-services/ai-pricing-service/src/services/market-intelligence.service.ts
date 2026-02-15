// Market Intelligence Service
// Trend analysis, price history tracking, demand forecasting, market insights

import { PrismaClient, TrendType, TrendDirection, PeriodType, InsightType, ImpactLevel } from '@prisma/client';
import * as simpleStatistics from 'simple-statistics';

const prisma = new PrismaClient();

interface TrendData {
  targetType: string;
  targetId: string;
  targetName: string;
  trendType: TrendType;
  currentValue: number;
  previousValue: number;
  changePercentage: number;
  direction: TrendDirection;
  strength: number;
  periodType: PeriodType;
  periodStart: Date;
  periodEnd: Date;
  keyDrivers?: string[];
  sentimentScore?: number;
}

interface PriceIndexData {
  categoryId?: string;
  categoryName?: string;
  indexValue: number;
  indexChange: number;
  avgPrice: number;
  avgPriceChange: number;
  priceVariance: number;
  totalVolume?: number;
  competitionIndex?: number;
  periodDate: Date;
}

interface DemandForecast {
  targetType: string;
  targetId: string;
  targetName: string;
  periodType: PeriodType;
  periodStart: Date;
  periodEnd: Date;
  predictedDemand: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  modelVersion: string;
  features: Record<string, any>;
}

interface MarketInsight {
  insightType: InsightType;
  title: string;
  description: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  impactLevel: ImpactLevel;
  affectedUsers?: number;
  action?: string;
  actionUrl?: string;
  data?: Record<string, any>;
  expiresAt: Date;
}

export class MarketIntelligenceService {
  // ==========================================
  // TREND ANALYSIS
  // ==========================================

  /**
   * Analyze and track market trends
   */
  async analyzeTrend(data: TrendData): Promise<any> {
    // Calculate direction and strength
    const changePercentage = ((data.currentValue - data.previousValue) / data.previousValue) * 100;
    
    let direction: TrendDirection;
    if (changePercentage > 5) direction = TrendDirection.RISING;
    else if (changePercentage < -5) direction = TrendDirection.FALLING;
    else direction = TrendDirection.STABLE;

    // Calculate strength based on volatility
    const strength = this.calculateTrendStrength(data.currentValue, data.previousValue);

    // Store trend
    const trend = await prisma.marketTrend.create({
      data: {
        targetType: data.targetType as any,
        targetId: data.targetId,
        targetName: data.targetName,
        trendType: data.trendType,
        direction,
        strength,
        currentValue: data.currentValue,
        previousValue: data.previousValue,
        changePercentage,
        changeDirection: changePercentage,
        periodType: data.periodType,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        keyDrivers: data.keyDrivers,
        sentimentScore: data.sentimentScore,
      },
    });

    return trend;
  }

  /**
   * Get trends for a target
   */
  async getTrends(
    targetType: string,
    targetId: string,
    trendTypes?: TrendType[],
    periodType: PeriodType = PeriodType.WEEKLY,
    limit: number = 12
  ): Promise<any[]> {
    return prisma.marketTrend.findMany({
      where: {
        targetType: targetType as any,
        targetId,
        ...(trendTypes && { trendType: { in: trendTypes } }),
      },
      orderBy: { periodStart: 'desc' },
      take: limit,
    });
  }

  /**
   * Get overall market direction
   */
  async getMarketDirection(categoryId?: string): Promise<{
    overallDirection: TrendDirection;
    topRising: any[];
    topFalling: any[];
    volatilityIndex: number;
  }> {
    const trends = await prisma.marketTrend.findMany({
      where: {
        targetType: categoryId ? 'CATEGORY' : 'OVERALL',
        ...(categoryId && { targetId: categoryId }),
      },
      orderBy: { periodStart: 'desc' },
      take: 50,
    });

    if (trends.length === 0) {
      return {
        overallDirection: TrendDirection.STABLE,
        topRising: [],
        topFalling: [],
        volatilityIndex: 0,
      };
    }

    // Calculate overall direction
    const avgChange = simpleStatistics.mean(trends.map(t => t.changePercentage));
    const overallDirection = avgChange > 5 
      ? TrendDirection.RISING 
      : avgChange < -5 
        ? TrendDirection.FALLING 
        : TrendDirection.STABLE;

    // Get top rising and falling
    const sorted = [...trends].sort((a, b) => b.changePercentage - a.changePercentage);
    const topRising = sorted.filter(t => t.changePercentage > 0).slice(0, 5);
    const topFalling = sorted.filter(t => t.changePercentage < 0).slice(-5).reverse();

    // Calculate volatility
    const volatilityIndex = simpleStatistics.standardDeviation(
      trends.map(t => t.changePercentage)
    );

    return { overallDirection, topRising, topFalling, volatilityIndex };
  }

  private calculateTrendStrength(current: number, previous: number): number {
    const change = Math.abs((current - previous) / previous);
    return Math.min(1, change);
  }

  // ==========================================
  // PRICE INDEX TRACKING
  // ==========================================

  /**
   * Calculate and store price index
   */
  async calculatePriceIndex(data: PriceIndexData): Promise<any> {
    const indexValue = 100; // Base index
    const indexChange = data.indexValue - 100;

    // Calculate competition index (0-1)
    const competitionIndex = this.calculateCompetitionIndex(data.priceVariance);

    const index = await prisma.priceIndex.create({
      data: {
        categoryId: data.categoryId,
        categoryName: data.categoryName,
        indexValue,
        indexChange,
        indexChangeDirection: indexChange,
        avgPrice: data.avgPrice,
        avgPriceChange: data.avgPriceChange,
        priceVariance: data.priceVariance,
        totalVolume: data.totalVolume,
        competitionIndex,
        periodDate: data.periodDate,
        periodType: PeriodType.DAILY,
      },
    });

    return index;
  }

  /**
   * Get price index history
   */
  async getPriceIndexHistory(
    categoryId?: string,
    periodType: PeriodType = PeriodType.WEEKLY,
    limit: number = 52
  ): Promise<any[]> {
    return prisma.priceIndex.findMany({
      where: {
        ...(categoryId && { categoryId }),
      },
      orderBy: { periodDate: 'desc' },
      take: limit,
    });
  }

  /**
   * Get category price comparison
   */
  async compareCategoryPrices(categoryId: string): Promise<{
    category: any;
    comparison: {
      vsMarket: number;
      vsPrevious: number;
      pricePosition: 'below' | 'at' | 'above';
      percentile: number;
    };
  }> {
    const [currentIndex, previousIndex, marketIndex] = await Promise.all([
      this.getLatestPriceIndex(categoryId),
      this.getPriceIndexForDate(categoryId, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
      this.getAverageMarketIndex(),
    ]);

    const vsMarket = currentIndex?.avgPrice - (marketIndex?.avgPrice || 0);
    const vsPrevious = currentIndex?.avgPriceChange || 0;

    // Determine price position
    let pricePosition: 'below' | 'at' | 'above';
    if (vsMarket < -5) pricePosition = 'below';
    else if (vsMarket > 5) pricePosition = 'above';
    else pricePosition = 'at';

    // Calculate percentile (simplified)
    const percentile = this.calculatePricePercentile(
      currentIndex?.avgPrice || 0,
      marketIndex?.avgPrice || 0
    );

    return {
      category: currentIndex,
      comparison: {
        vsMarket,
        vsPrevious,
        pricePosition,
        percentile,
      },
    };
  }

  private calculateCompetitionIndex(priceVariance: number): number {
    // Higher variance = more competition
    // Normalize to 0-1 range
    return Math.min(1, priceVariance / 100);
  }

  private async getLatestPriceIndex(categoryId: string): Promise<any> {
    return prisma.priceIndex.findFirst({
      where: { categoryId },
      orderBy: { periodDate: 'desc' },
    });
  }

  private async getPriceIndexForDate(categoryId: string, date: Date): Promise<any> {
    return prisma.priceIndex.findFirst({
      where: {
        categoryId,
        periodDate: {
          gte: new Date(date.getTime() - 24 * 60 * 60 * 1000),
          lte: new Date(date.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { periodDate: 'desc' },
    });
  }

  private async getAverageMarketIndex(): Promise<any> {
    const indices = await prisma.priceIndex.findMany({
      orderBy: { periodDate: 'desc' },
      take: 30,
    });

    if (indices.length === 0) return null;

    return {
      avgPrice: simpleStatistics.mean(indices.map(i => i.avgPrice)),
      avgPriceChange: simpleStatistics.mean(indices.map(i => i.avgPriceChange)),
    };
  }

  private calculatePricePercentile(price: number, marketAvg: number): number {
    if (marketAvg === 0) return 50;
    
    const ratio = price / marketAvg;
    
    if (ratio < 0.9) return 30;
    if (ratio < 1.0) return 45;
    if (ratio < 1.1) return 55;
    if (ratio < 1.2) return 70;
    return 85;
  }

  // ==========================================
  // DEMAND FORECASTING
  // ==========================================

  /**
   * Generate demand forecast
   */
  async generateDemandForecast(
    targetType: string,
    targetId: string,
    targetName: string,
    periodType: PeriodType,
    periods: number = 12
  ): Promise<DemandForecast[]> {
    // Get historical data
    const historicalData = await this.getHistoricalDemand(targetType, targetId, 90);

    // Calculate seasonality
    const seasonality = this.calculateSeasonality(historicalData);

    // Calculate trend
    const trend = this.calculateDemandTrend(historicalData);

    // Generate forecasts
    const forecasts: DemandForecast[] = [];
    const now = new Date();
    let baseDemand = simpleStatistics.mean(historicalData.map(d => d.quantity)) || 100;

    for (let i = 1; i <= periods; i++) {
      const periodStart = this.getPeriodStart(now, periodType, i);
      const periodEnd = this.getPeriodEnd(periodStart, periodType);
      
      // Apply seasonality and trend
      const seasonalMultiplier = this.getSeasonalMultiplier(seasonality, periodStart);
      const trendMultiplier = 1 + (trend * i * 0.01);
      const predictedDemand = baseDemand * seasonalMultiplier * trendMultiplier;

      // Calculate confidence (decreases with time)
      const confidence = Math.max(0.5, 0.95 - i * 0.03);

      // Calculate bounds
      const margin = (1 - confidence) * predictedDemand * 0.3;

      forecasts.push({
        targetType,
        targetId,
        targetName,
        periodType,
        periodStart,
        periodEnd,
        predictedDemand: Math.round(predictedDemand),
        lowerBound: Math.round(predictedDemand - margin),
        upperBound: Math.round(predictedDemand + margin),
        confidence,
        modelVersion: '1.0.0',
        features: {
          seasonalMultiplier,
          trendMultiplier,
          baseDemand,
          dataPoints: historicalData.length,
        },
      });
    }

    // Store forecasts
    for (const forecast of forecasts) {
      await prisma.demandForecast.create({
        data: {
          targetType: forecast.targetType as any,
          targetId: forecast.targetId,
          periodType: forecast.periodType,
          periodStart: forecast.periodStart,
          periodEnd: forecast.periodEnd,
          predictedDemand: forecast.predictedDemand,
          lowerBound: forecast.lowerBound,
          upperBound: forecast.upperBound,
          confidence: forecast.confidence,
          modelVersion: forecast.modelVersion,
          features: forecast.features as any,
        },
      });
    }

    return forecasts;
  }

  private async getHistoricalDemand(
    targetType: string,
    targetId: string,
    days: number
  ): Promise<{ date: Date; quantity: number }[]> {
    // This would integrate with sales/orders service
    // Mock implementation
    const data: { date: Date; quantity: number }[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate mock data with some pattern
      const weekday = date.getDay();
      const isWeekend = weekday === 0 || weekday === 6;
      const baseQty = isWeekend ? 120 : 80;
      const random = 0.8 + Math.random() * 0.4;
      
      data.push({
        date,
        quantity: Math.round(baseQty * random),
      });
    }

    return data;
  }

  private calculateSeasonality(
    data: { date: Date; quantity: number }[]
  ): Record<number, number> {
    // Group by month
    const monthlyData = new Map<number, number[]>();
    
    data.forEach(d => {
      const month = d.date.getMonth();
      const list = monthlyData.get(month) || [];
      list.push(d.quantity);
      monthlyData.set(month, list);
    });

    // Calculate monthly averages
    const overallAvg = simpleStatistics.mean(data.map(d => d.quantity)) || 1;
    const seasonality: Record<number, number> = {};

    monthlyData.forEach((values, month) => {
      const avg = simpleStatistics.mean(values);
      seasonality[month] = avg / overallAvg;
    });

    return seasonality;
  }

  private calculateDemandTrend(data: { date: Date; quantity: number }[]): number {
    if (data.length < 14) return 0;

    const sorted = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
    const recent = sorted.slice(0, Math.floor(sorted.length / 3));
    const older = sorted.slice(Math.floor(sorted.length * 2 / 3));

    const recentAvg = simpleStatistics.mean(recent.map(d => d.quantity));
    const olderAvg = simpleStatistics.mean(older.map(d => d.quantity));

    if (olderAvg === 0) return 0;

    return ((recentAvg - olderAvg) / olderAvg) * 100;
  }

  private getSeasonalMultiplier(
    seasonality: Record<number, number>,
    date: Date
  ): number {
    const month = date.getMonth();
    return seasonality[month] || 1;
  }

  private getPeriodStart(base: Date, periodType: PeriodType, periods: number): Date {
    const result = new Date(base);
    
    switch (periodType) {
      case PeriodType.DAILY:
        result.setDate(result.getDate() + periods);
        break;
      case PeriodType.WEEKLY:
        result.setDate(result.getDate() + periods * 7);
        break;
      case PeriodType.MONTHLY:
        result.setMonth(result.getMonth() + periods);
        break;
      case PeriodType.QUARTERLY:
        result.setMonth(result.getMonth() + periods * 3);
        break;
    }
    
    return result;
  }

  private getPeriodEnd(start: Date, periodType: PeriodType): Date {
    const end = new Date(start);
    
    switch (periodType) {
      case PeriodType.DAILY:
        end.setHours(23, 59, 59, 999);
        break;
      case PeriodType.WEEKLY:
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case PeriodType.MONTHLY:
        const lastDay = new Date(end.getFullYear(), end.getMonth() + 1, 0);
        end.setDate(lastDay.getDate());
        end.setHours(23, 59, 59, 999);
        break;
      case PeriodType.QUARTERLY:
        end.setMonth(end.getMonth() + 3);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
    }
    
    return end;
  }

  /**
   * Get forecast accuracy (after period ends)
   */
  async validateForecast(forecastId: string, actualDemand: number): Promise<{
    accuracy: number;
    mape: number;
    updated: boolean;
  }> {
    const forecast = await prisma.demandForecast.findUnique({
      where: { id: forecastId },
    });

    if (!forecast) {
      throw new Error('Forecast not found');
    }

    // Calculate MAPE
    const mape = Math.abs((actualDemand - forecast.predictedDemand) / actualDemand) * 100;
    const accuracy = 100 - mape;

    // Update forecast
    await prisma.demandForecast.update({
      where: { id: forecastId },
      data: {
        actualDemand,
        accuracy,
      },
    });

    return { accuracy, mape, updated: true };
  }

  // ==========================================
  // MARKET INSIGHTS
  // ==========================================

  /**
   * Generate market insights
   */
  async generateInsights(): Promise<MarketInsight[]> {
    const insights: MarketInsight[] = [];

    // Check for price drops
    const priceDropInsights = await this.detectPriceDrops();
    insights.push(...priceDropInsights);

    // Check for demand spikes
    const demandSpikeInsights = await this.detectDemandSpikes();
    insights.push(...demandSpikeInsights);

    // Check for trend changes
    const trendChangeInsights = await this.detectTrendChanges();
    insights.push(...trendChangeInsights);

    // Store insights
    for (const insight of insights) {
      await this.storeInsight(insight);
    }

    return insights;
  }

  private async detectPriceDrops(): Promise<MarketInsight[]> {
    // Get significant price drops from price history
    const priceHistory = await prisma.priceHistory?.findMany({
      orderBy: { recordedAt: 'desc' },
      take: 1000,
    }) || [];

    const drops: MarketInsight[] = [];
    const productDrops = new Map<string, any>();

    // Group by product
    priceHistory.forEach(ph => {
      const existing = productDrops.get(ph.productId);
      if (!existing || new Date(ph.recordedAt) > new Date(existing.recordedAt)) {
        productDrops.set(ph.productId, ph);
      }
    });

    // Find significant drops
    productDrops.forEach((ph, productId) => {
      if (ph.priceChange && ph.priceChange < -0.15) {
        drops.push({
          insightType: InsightType.PRICE_DROP,
          title: 'Significant Price Drop Detected',
          description: `${productId} has dropped by ${Math.abs(ph.priceChange * 100).toFixed(1)}%`,
          targetType: 'PRODUCT',
          targetId: productId,
          impactLevel: ph.priceChange < -0.25 ? ImpactLevel.HIGH : ImpactLevel.MEDIUM,
          action: 'Review and update pricing',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      }
    });

    return drops.slice(0, 10);
  }

  private async detectDemandSpikes(): Promise<MarketInsight[]> {
    // Detect demand spikes from recent sales data
    // This would integrate with sales service
    return [];
  }

  private async detectTrendChanges(): Promise<MarketInsight[]> {
    // Detect significant trend reversals
    const trends = await prisma.marketTrend.findMany({
      orderBy: { periodStart: 'desc' },
      take: 100,
    });

    const changes: MarketInsight[] = [];

    // Group by target
    const targetTrends = new Map<string, any[]>();
    trends.forEach(t => {
      const list = targetTrends.get(t.targetId) || [];
      list.push(t);
      targetTrends.set(t.targetId, list);
    });

    // Find trend changes
    targetTrends.forEach((list, targetId) => {
      if (list.length >= 2) {
        const recent = list[0];
        const previous = list[1];

        // Check for direction change
        if (recent.direction !== previous.direction) {
          const isReversal = (recent.direction === 'RISING' && previous.direction === 'FALLING')
            || (recent.direction === 'FALLING' && previous.direction === 'RISING');

          if (isReversal && Math.abs(recent.changePercentage) > 10) {
            changes.push({
              insightType: InsightType.TREND_ALERT,
              title: `Trend Reversal Detected for ${targetId}`,
              description: `Trend changed from ${previous.direction} to ${recent.direction} with ${recent.changePercentage.toFixed(1)}% change`,
              targetType: recent.targetType,
              targetId,
              impactLevel: Math.abs(recent.changePercentage) > 20 ? ImpactLevel.HIGH : ImpactLevel.MEDIUM,
              action: 'Review inventory and pricing strategy',
              data: {
                previousDirection: previous.direction,
                currentDirection: recent.direction,
                changePercent: recent.changePercentage,
              },
              expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            });
          }
        }
      }
    });

    return changes.slice(0, 10);
  }

  private async storeInsight(insight: MarketInsight): Promise<void> {
    await prisma.marketInsight.create({
      data: {
        insightType: insight.insightType,
        title: insight.title,
        description: insight.description,
        targetType: insight.targetType as any,
        targetId: insight.targetId,
        targetName: insight.targetName,
        impactLevel: insight.impactLevel,
        affectedUsers: insight.affectedUsers,
        action: insight.action,
        actionUrl: insight.actionUrl,
        data: insight.data as any,
        expiresAt: insight.expiresAt,
      },
    });
  }

  /**
   * Get active insights
   */
  async getActiveInsights(
    filters?: {
      insightType?: InsightType;
      impactLevel?: ImpactLevel;
      targetType?: string;
    }
  ): Promise<any[]> {
    return prisma.marketInsight.findMany({
      where: {
        expiresAt: { gt: new Date() },
        ...(filters?.insightType && { insightType: filters.insightType }),
        ...(filters?.impactLevel && { impactLevel: filters.impactLevel }),
        ...(filters?.targetType && { targetType: filters.targetType as any }),
      },
      orderBy: [
        { impactLevel: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 50,
    });
  }

  // ==========================================
  // PRICE HISTORY TRACKING
  // ==========================================

  /**
   * Record price point
   */
  async recordPricePoint(data: {
    productId: string;
    basePrice: number;
    sellingPrice: number;
    originalPrice?: number;
    costPrice?: number;
    competitorPrice?: number;
    competitorSource?: string;
    marketAverage?: number;
    marketMin?: number;
    marketMax?: number;
    demandScore?: number;
    supplyScore?: number;
  }): Promise<void> {
    const margin = data.costPrice ? data.sellingPrice - data.costPrice : null;
    const marginPercentage = margin && data.costPrice > 0 
      ? (margin / data.costPrice) * 100 
      : null;

    await prisma.priceHistory.create({
      data: {
        productId: data.productId,
        basePrice: data.basePrice,
        sellingPrice: data.sellingPrice,
        originalPrice: data.originalPrice,
        costPrice: data.costPrice,
        margin: margin || 0,
        marginPercentage: marginPercentage || 0,
        competitorPrice: data.competitorPrice,
        competitorSource: data.competitorSource,
        marketAverage: data.marketAverage,
        marketMin: data.marketMin,
        marketMax: data.marketMax,
        demandScore: data.demandScore,
        supplyScore: data.supplyScore,
      },
    });
  }

  /**
   * Get price history for a product
   */
  async getPriceHistory(
    productId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    return prisma.priceHistory.findMany({
      where: {
        productId,
        recordedAt: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      },
      orderBy: { recordedAt: 'desc' },
    });
  }

  /**
   * Get price statistics
   */
  async getPriceStats(productId: string): Promise<{
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    avgDiscount: number;
    volatility: number;
    trend: 'rising' | 'stable' | 'falling';
  }> {
    const history = await this.getPriceHistory(productId);
    
    if (history.length === 0) {
      return {
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        avgDiscount: 0,
        volatility: 0,
        trend: 'stable' as const,
      };
    }

    const prices = history.map(h => h.sellingPrice);
    const originalPrices = history.filter(h => h.originalPrice).map(h => h.originalPrice!);

    // Calculate trend
    const recentPrices = prices.slice(0, Math.min(30, prices.length));
    const olderPrices = prices.slice(Math.floor(prices.length / 2));
    const trend = this.calculatePriceTrendSimple(recentPrices, olderPrices);

    return {
      avgPrice: simpleStatistics.mean(prices),
      minPrice: simpleStatistics.min(prices),
      maxPrice: simpleStatistics.max(prices),
      avgDiscount: originalPrices.length > 0
        ? simpleStatistics.mean(originalPrices.map((op, i) => 
            (op - prices[i]) / op * 100
          ))
        : 0,
      volatility: prices.length > 1
        ? simpleStatistics.standardDeviation(prices) / simpleStatistics.mean(prices)
        : 0,
      trend,
    };
  }

  private calculatePriceTrendSimple(recent: number[], older: number[]): 'rising' | 'stable' | 'falling' {
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = simpleStatistics.mean(recent);
    const olderAvg = simpleStatistics.mean(older);
    const change = (recentAvg - olderAvg) / olderAvg;

    if (change > 0.05) return 'rising';
    if (change < -0.05) return 'falling';
    return 'stable';
  }

  // ==========================================
  // MARKET ANALYTICS ENDPOINTS
  // ==========================================

  /**
   * Get comprehensive market overview
   */
  async getMarketOverview(categoryId?: string): Promise<{
    marketSize: number;
    marketGrowth: number;
    avgPrice: number;
    priceChange: number;
    topSellers: any[];
    topCategories: any[];
    demandIndex: number;
    competitionLevel: number;
  }> {
    // Get aggregated data
    const [priceIndex, trends, marketIndex] = await Promise.all([
      this.getLatestPriceIndex(categoryId || ''),
      this.getMarketDirection(categoryId),
      this.getAverageMarketIndex(),
    ]);

    return {
      marketSize: marketIndex?.totalVolume || 0,
      marketGrowth: trends.overallDirection === 'RISING' ? 5
        : trends.overallDirection === 'FALLING' ? -3
        : 1,
      avgPrice: priceIndex?.avgPrice || 0,
      priceChange: priceIndex?.avgPriceChange || 0,
      topSellers: [], // Would aggregate seller data
      topCategories: [], // Would aggregate category data
      demandIndex: trends.overallDirection === 'RISING' ? 0.7
        : trends.overallDirection === 'FALLING' ? 0.4
        : 0.5,
      competitionLevel: priceIndex?.competitionIndex || 0.5,
    };
  }
}

export const marketIntelligenceService = new MarketIntelligenceService();
