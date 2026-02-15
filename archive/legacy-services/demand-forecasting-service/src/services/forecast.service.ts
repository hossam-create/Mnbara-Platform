// Forecast Service - خدمة التنبؤ
// Demand forecasting, trend analysis, seasonal patterns

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Types
type ForecastTarget = 'PRODUCT' | 'CATEGORY' | 'BRAND' | 'REGION' | 'STORE' | 'OVERALL';
type PeriodType = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';

interface ForecastResult {
  predictedDemand: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  seasonalFactor: number;
}

export class ForecastService {
  private modelVersion = '1.0.0';

  // ==========================================
  // 📊 DEMAND FORECASTING
  // ==========================================

  async generateForecast(
    targetType: ForecastTarget,
    targetId: string,
    periodType: PeriodType,
    periodsAhead: number = 7
  ): Promise<ForecastResult[]> {
    // Get historical data
    const history = await this.getHistoricalData(targetType, targetId, 90); // Last 90 days

    if (history.length < 14) {
      throw new Error('Insufficient historical data for forecasting');
    }

    // Calculate base forecast using moving average
    const forecasts: ForecastResult[] = [];
    const values = history.map(h => h.quantity);

    for (let i = 0; i < periodsAhead; i++) {
      const forecast = this.calculateForecast(values, i, periodType);
      forecasts.push(forecast);

      // Store forecast
      const periodStart = this.getPeriodStart(periodType, i);
      const periodEnd = this.getPeriodEnd(periodType, periodStart);

      await prisma.demandForecast.upsert({
        where: {
          targetType_targetId_periodType_periodStart: {
            targetType,
            targetId,
            periodType,
            periodStart,
          },
        },
        update: {
          predictedDemand: forecast.predictedDemand,
          lowerBound: forecast.lowerBound,
          upperBound: forecast.upperBound,
          confidence: forecast.confidence,
          modelVersion: this.modelVersion,
          features: { trend: forecast.trend, seasonalFactor: forecast.seasonalFactor },
        },
        create: {
          targetType,
          targetId,
          periodType,
          periodStart,
          periodEnd,
          predictedDemand: forecast.predictedDemand,
          lowerBound: forecast.lowerBound,
          upperBound: forecast.upperBound,
          confidence: forecast.confidence,
          modelVersion: this.modelVersion,
          features: { trend: forecast.trend, seasonalFactor: forecast.seasonalFactor },
        },
      });
    }

    return forecasts;
  }

  private calculateForecast(values: number[], periodsAhead: number, periodType: PeriodType): ForecastResult {
    // Simple exponential smoothing with trend
    const alpha = 0.3; // Smoothing factor
    const beta = 0.1;  // Trend factor

    // Calculate level and trend
    let level = values[values.length - 1];
    let trend = (values[values.length - 1] - values[0]) / values.length;

    for (let i = 1; i < values.length; i++) {
      const newLevel = alpha * values[i] + (1 - alpha) * (level + trend);
      trend = beta * (newLevel - level) + (1 - beta) * trend;
      level = newLevel;
    }

    // Forecast
    const predictedDemand = Math.max(0, level + trend * (periodsAhead + 1));

    // Calculate confidence interval
    const stdDev = this.calculateStdDev(values);
    const marginOfError = 1.96 * stdDev * Math.sqrt(1 + periodsAhead * 0.1);

    // Seasonal factor (simplified)
    const seasonalFactor = this.getSeasonalFactor(periodType, periodsAhead);

    // Apply seasonal adjustment
    const adjustedDemand = predictedDemand * seasonalFactor;

    return {
      predictedDemand: Math.round(adjustedDemand),
      lowerBound: Math.max(0, Math.round(adjustedDemand - marginOfError)),
      upperBound: Math.round(adjustedDemand + marginOfError),
      confidence: Math.max(0.5, 0.95 - periodsAhead * 0.02),
      trend: trend > 0.5 ? 'UP' : trend < -0.5 ? 'DOWN' : 'STABLE',
      seasonalFactor,
    };
  }

  private calculateStdDev(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  private getSeasonalFactor(periodType: PeriodType, periodsAhead: number): number {
    // Simplified seasonal factors
    const now = new Date();
    const futureDate = new Date(now);

    switch (periodType) {
      case 'DAILY':
        futureDate.setDate(futureDate.getDate() + periodsAhead);
        const dayOfWeek = futureDate.getDay();
        // Weekend boost
        return [0, 1].includes(dayOfWeek) ? 1.2 : dayOfWeek === 5 ? 1.1 : 1.0;
      case 'MONTHLY':
        futureDate.setMonth(futureDate.getMonth() + periodsAhead);
        const month = futureDate.getMonth();
        // Holiday season boost
        return [10, 11].includes(month) ? 1.4 : month === 0 ? 0.8 : 1.0;
      default:
        return 1.0;
    }
  }

  private getPeriodStart(periodType: PeriodType, periodsAhead: number): Date {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    switch (periodType) {
      case 'HOURLY':
        now.setHours(now.getHours() + periodsAhead);
        break;
      case 'DAILY':
        now.setDate(now.getDate() + periodsAhead);
        break;
      case 'WEEKLY':
        now.setDate(now.getDate() + periodsAhead * 7);
        break;
      case 'MONTHLY':
        now.setMonth(now.getMonth() + periodsAhead);
        break;
      case 'QUARTERLY':
        now.setMonth(now.getMonth() + periodsAhead * 3);
        break;
    }

    return now;
  }

  private getPeriodEnd(periodType: PeriodType, start: Date): Date {
    const end = new Date(start);

    switch (periodType) {
      case 'HOURLY':
        end.setHours(end.getHours() + 1);
        break;
      case 'DAILY':
        end.setDate(end.getDate() + 1);
        break;
      case 'WEEKLY':
        end.setDate(end.getDate() + 7);
        break;
      case 'MONTHLY':
        end.setMonth(end.getMonth() + 1);
        break;
      case 'QUARTERLY':
        end.setMonth(end.getMonth() + 3);
        break;
    }

    return end;
  }

  // ==========================================
  // 📈 HISTORICAL DATA
  // ==========================================

  private async getHistoricalData(targetType: ForecastTarget, targetId: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = { date: { gte: startDate } };

    switch (targetType) {
      case 'PRODUCT':
        where.productId = targetId;
        break;
      case 'CATEGORY':
        where.categoryId = targetId;
        break;
      case 'BRAND':
        where.brandId = targetId;
        break;
      case 'REGION':
        where.region = targetId;
        break;
    }

    return prisma.salesHistory.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  async recordSales(data: {
    productId: string;
    categoryId?: string;
    brandId?: string;
    date: Date;
    quantity: number;
    revenue: number;
    region?: string;
    channel?: string;
  }) {
    const avgPrice = data.revenue / data.quantity;
    const dateOnly = new Date(data.date);
    dateOnly.setHours(0, 0, 0, 0);

    return prisma.salesHistory.upsert({
      where: {
        productId_date_hour: {
          productId: data.productId,
          date: dateOnly,
          hour: data.date.getHours(),
        },
      },
      update: {
        quantity: { increment: data.quantity },
        revenue: { increment: data.revenue },
        avgPrice,
      },
      create: {
        ...data,
        date: dateOnly,
        hour: data.date.getHours(),
        avgPrice,
        isWeekend: [0, 6].includes(data.date.getDay()),
      },
    });
  }

  // ==========================================
  // 📊 GET FORECASTS
  // ==========================================

  async getForecasts(
    targetType: ForecastTarget,
    targetId: string,
    periodType?: PeriodType,
    startDate?: Date,
    endDate?: Date
  ) {
    return prisma.demandForecast.findMany({
      where: {
        targetType,
        targetId,
        ...(periodType && { periodType }),
        ...(startDate && { periodStart: { gte: startDate } }),
        ...(endDate && { periodEnd: { lte: endDate } }),
      },
      orderBy: { periodStart: 'asc' },
    });
  }

  // ==========================================
  // 📈 TREND ANALYSIS
  // ==========================================

  async analyzeTrend(targetType: ForecastTarget, targetId: string) {
    const history = await this.getHistoricalData(targetType, targetId, 30);

    if (history.length < 7) {
      return { trend: 'INSUFFICIENT_DATA', change: 0 };
    }

    const recentWeek = history.slice(-7);
    const previousWeek = history.slice(-14, -7);

    const recentAvg = recentWeek.reduce((sum, h) => sum + h.quantity, 0) / recentWeek.length;
    const previousAvg = previousWeek.reduce((sum, h) => sum + h.quantity, 0) / previousWeek.length;

    const change = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

    let trend: string;
    if (change > 10) trend = 'STRONG_UP';
    else if (change > 5) trend = 'UP';
    else if (change < -10) trend = 'STRONG_DOWN';
    else if (change < -5) trend = 'DOWN';
    else trend = 'STABLE';

    return { trend, change: Math.round(change * 10) / 10 };
  }

  // ==========================================
  // 🎯 MODEL PERFORMANCE
  // ==========================================

  async evaluateModelPerformance() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // Get forecasts that have actual data now
    const forecasts = await prisma.demandForecast.findMany({
      where: {
        periodEnd: { lte: yesterday },
        actualDemand: { not: null },
      },
      take: 1000,
    });

    if (forecasts.length === 0) return null;

    // Calculate MAPE
    let totalError = 0;
    for (const f of forecasts) {
      if (f.actualDemand && f.actualDemand > 0) {
        totalError += Math.abs(f.predictedDemand - f.actualDemand) / f.actualDemand;
      }
    }
    const mape = (totalError / forecasts.length) * 100;

    // Calculate RMSE
    const squaredErrors = forecasts
      .filter(f => f.actualDemand !== null)
      .map(f => Math.pow(f.predictedDemand - (f.actualDemand || 0), 2));
    const rmse = Math.sqrt(squaredErrors.reduce((a, b) => a + b, 0) / squaredErrors.length);

    // Calculate MAE
    const absoluteErrors = forecasts
      .filter(f => f.actualDemand !== null)
      .map(f => Math.abs(f.predictedDemand - (f.actualDemand || 0)));
    const mae = absoluteErrors.reduce((a, b) => a + b, 0) / absoluteErrors.length;

    // Store performance
    await prisma.modelPerformance.create({
      data: {
        modelVersion: this.modelVersion,
        evaluationDate: yesterday,
        mape,
        rmse,
        mae,
        r2: 1 - (rmse * rmse) / this.calculateVariance(forecasts.map(f => f.actualDemand || 0)),
        sampleSize: forecasts.length,
      },
    });

    return { mape, rmse, mae, sampleSize: forecasts.length };
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }
}

export const forecastService = new ForecastService();
