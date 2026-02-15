import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const ForecastParametersSchema = z.object({
  businessAccountId: z.string().uuid(),
  entityId: z.string().uuid().optional(),
  currency: z.string().length(3),
  forecastType: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annual']),
  periodStart: z.string().date(),
  periodEnd: z.string().date(),
  openingBalance: z.number(),
  forecastModel: z.enum(['historical', 'trend', 'seasonal', 'regression', 'hybrid']),
  confidenceLevel: z.number().int().min(1).max(5).default(3),
  assumptions: z.record(z.any()).default({}),
  createdBy: z.string().uuid()
});

const CashFlowPatternSchema = z.object({
  businessAccountId: z.string().uuid(),
  entityId: z.string().uuid().optional(),
  currency: z.string().length(3),
  patternType: z.enum(['inflow', 'outflow', 'net_flow']),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  seasonalityFactor: z.number().default(1),
  trendFactor: z.number().default(0),
  volatilityFactor: z.number().default(0),
  baseAmount: z.number(),
  confidenceLevel: z.number().int().min(1).max(5).default(3),
  createdBy: z.string().uuid()
});

export interface ForecastParameters {
  businessAccountId: string;
  entityId?: string;
  currency: string;
  forecastType: string;
  periodStart: Date;
  periodEnd: Date;
  openingBalance: number;
  forecastModel: string;
  confidenceLevel: number;
  assumptions: any;
  createdBy: string;
}

export interface CashFlowPattern {
  id: string;
  businessAccountId: string;
  entityId?: string;
  currency: string;
  patternType: string;
  frequency: string;
  seasonalityFactor: number;
  trendFactor: number;
  volatilityFactor: number;
  baseAmount: number;
  confidenceLevel: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LiquidityForecast {
  id: string;
  businessAccountId: string;
  entityId?: string;
  currency: string;
  forecastType: string;
  forecastDate: Date;
  periodStart: Date;
  periodEnd: Date;
  openingBalance: number;
  inflows: number;
  outflows: number;
  netCashFlow: number;
  closingBalance: number;
  confidenceLevel: number;
  forecastModel?: string;
  assumptions: any;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForecastAccuracy {
  forecastId: string;
  actualAmount: number;
  forecastedAmount: number;
  variancePercentage: number;
  accuracyScore: number;
  modelPerformance: string;
  improvementSuggestions: string[];
}

export interface LiquidityScenario {
  id: string;
  businessAccountId: string;
  scenarioName: string;
  scenarioType: string;
  baseCurrency: string;
  scenarioData: any;
  assumptions: any;
  results: any;
  createdAt: Date;
  createdBy: string;
}

export interface CashRunwayAnalysis {
  businessAccountId: string;
  currency: string;
  currentBalance: number;
  runwayDays: number;
  runwayMonths: number;
  burnRate: number;
  criticalDate: Date;
  scenarios: any[];
  recommendations: string[];
}

export class LiquidityForecastingEngine {
  // Forecast Parameters Management
  async createForecastParameters(data: z.infer<typeof ForecastParametersSchema>): Promise<ForecastParameters> {
    const validated = ForecastParametersSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO forecast_parameters (
        id,
        business_account_id,
        entity_id,
        currency,
        forecast_type,
        period_start,
        period_end,
        opening_balance,
        forecast_model,
        confidence_level,
        assumptions,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.entityId || null}::uuid,
        ${validated.currency}::varchar,
        ${validated.forecastType}::varchar,
        ${validated.periodStart}::date,
        ${validated.periodEnd}::date,
        ${validated.openingBalance}::decimal,
        ${validated.forecastModel}::varchar,
        ${validated.confidenceLevel}::integer,
        ${JSON.stringify(validated.assumptions)}::jsonb,
        ${validated.createdBy}::uuid
      ) RETURNING id
    `;
    
    const parametersId = (result as any)[0]?.id;
    return this.getForecastParameters(parametersId);
  }

  async getForecastParameters(parametersId: string): Promise<ForecastParameters> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        entity_id as "entityId",
        currency,
        forecast_type as "forecastType",
        period_start as "periodStart",
        period_end as "periodEnd",
        opening_balance as "openingBalance",
        forecast_model as "forecastModel",
        confidence_level as "confidenceLevel",
        assumptions,
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM forecast_parameters
      WHERE id = ${parametersId}::uuid
    `;
    
    return (result as any)[0];
  }

  // Cash Flow Pattern Analysis
  async analyzeCashFlowPattern(data: z.infer<typeof CashFlowPatternSchema>): Promise<CashFlowPattern> {
    const validated = CashFlowPatternSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO cash_flow_patterns (
        id,
        business_account_id,
        entity_id,
        currency,
        pattern_type,
        frequency,
        seasonality_factor,
        trend_factor,
        volatility_factor,
        base_amount,
        confidence_level,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.entityId || null}::uuid,
        ${validated.currency}::varchar,
        ${validated.patternType}::varchar,
        ${validated.frequency}::varchar,
        ${validated.seasonalityFactor}::decimal,
        ${validated.trendFactor}::decimal,
        ${validated.volatilityFactor}::decimal,
        ${validated.baseAmount}::decimal,
        ${validated.confidenceLevel}::integer,
        ${validated.createdBy}::uuid
      ) RETURNING id
    `;
    
    const patternId = (result as any)[0]?.id;
    return this.getCashFlowPattern(patternId);
  }

  async getCashFlowPattern(patternId: string): Promise<CashFlowPattern> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        entity_id as "entityId",
        currency,
        pattern_type as "patternType",
        frequency,
        seasonality_factor as "seasonalityFactor",
        trend_factor as "trendFactor",
        volatility_factor as "volatilityFactor",
        base_amount as "baseAmount",
        confidence_level as "confidenceLevel",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM cash_flow_patterns
      WHERE id = ${patternId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getCashFlowPatterns(businessAccountId: string, filters: {
    entityId?: string;
    currency?: string;
    patternType?: string;
    frequency?: string;
    limit?: number;
  } = {}): Promise<CashFlowPattern[]> {
    const { entityId, currency, patternType, frequency, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        entity_id as "entityId",
        currency,
        pattern_type as "patternType",
        frequency,
        seasonality_factor as "seasonalityFactor",
        trend_factor as "trendFactor",
        volatility_factor as "volatilityFactor",
        base_amount as "baseAmount",
        confidence_level as "confidenceLevel",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM cash_flow_patterns
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (entityId) {
      query += ` AND entity_id = '${entityId}'`;
    }
    
    if (currency) {
      query += ` AND currency = '${currency}'`;
    }
    
    if (patternType) {
      query += ` AND pattern_type = '${patternType}'`;
    }
    
    if (frequency) {
      query += ` AND frequency = '${frequency}'`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as CashFlowPattern[];
  }

  // Advanced Forecasting Methods
  async generateHistoricalForecast(
    businessAccountId: string,
    entityId: string,
    currency: string,
    forecastType: string,
    periodStart: Date,
    periodEnd: Date,
    confidenceLevel: number = 3
  ): Promise<LiquidityForecast> {
    // Get historical data for the same period
    const historicalData = await this.getHistoricalCashFlows(
      businessAccountId,
      entityId,
      currency,
      periodStart,
      periodEnd,
      3 // Last 3 years
    );
    
    if (historicalData.length === 0) {
      throw new Error('No historical data available for historical forecast');
    }
    
    // Calculate average inflows and outflows
    const avgInflows = historicalData.reduce((sum, data) => sum + data.inflows, 0) / historicalData.length;
    const avgOutflows = historicalData.reduce((sum, data) => sum + data.outflows, 0) / historicalData.length;
    
    // Apply trend adjustment
    const trendFactor = this.calculateTrendFactor(historicalData);
    const adjustedInflows = avgInflows * (1 + trendFactor);
    const adjustedOutflows = avgOutflows * (1 + trendFactor);
    
    // Calculate opening balance
    const openingBalance = await this.getOpeningBalance(
      businessAccountId,
      entityId,
      currency,
      periodStart
    );
    
    const netCashFlow = adjustedInflows - adjustedOutflows;
    const closingBalance = openingBalance + netCashFlow;
    
    return {
      id: uuidv4(),
      businessAccountId,
      entityId,
      currency,
      forecastType,
      forecastDate: new Date(),
      periodStart,
      periodEnd,
      openingBalance,
      inflows: adjustedInflows,
      outflows: adjustedOutflows,
      netCashFlow,
      closingBalance,
      confidenceLevel,
      forecastModel: 'historical',
      assumptions: {
        historicalYears: 3,
        dataPoints: historicalData.length,
        trendFactor,
        avgInflows,
        avgOutflows
      },
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async generateTrendForecast(
    businessAccountId: string,
    entityId: string,
    currency: string,
    forecastType: string,
    periodStart: Date,
    periodEnd: Date,
    confidenceLevel: number = 3
  ): Promise<LiquidityForecast> {
    // Get historical data for trend analysis
    const historicalData = await this.getHistoricalCashFlows(
      businessAccountId,
      entityId,
      currency,
      new Date(periodStart.getFullYear() - 2, periodStart.getMonth(), periodStart.getDate()),
      periodEnd,
      2 // Last 2 years
    );
    
    if (historicalData.length < 4) {
      throw new Error('Insufficient data for trend forecast');
    }
    
    // Calculate trend using linear regression
    const inflowTrend = this.calculateLinearTrend(historicalData.map(d => d.inflows));
    const outflowTrend = this.calculateLinearTrend(historicalData.map(d => d.outflows));
    
    // Project future values
    const periodsAhead = this.calculatePeriodsAhead(forecastType, periodStart, periodEnd);
    const projectedInflows = inflowTrend.slope * periodsAhead + inflowTrend.intercept;
    const projectedOutflows = outflowTrend.slope * periodsAhead + outflowTrend.intercept;
    
    // Ensure non-negative values
    const adjustedInflows = Math.max(0, projectedInflows);
    const adjustedOutflows = Math.max(0, projectedOutflows);
    
    const openingBalance = await this.getOpeningBalance(
      businessAccountId,
      entityId,
      currency,
      periodStart
    );
    
    const netCashFlow = adjustedInflows - adjustedOutflows;
    const closingBalance = openingBalance + netCashFlow;
    
    return {
      id: uuidv4(),
      businessAccountId,
      entityId,
      currency,
      forecastType,
      forecastDate: new Date(),
      periodStart,
      periodEnd,
      openingBalance,
      inflows: adjustedInflows,
      outflows: adjustedOutflows,
      netCashFlow,
      closingBalance,
      confidenceLevel,
      forecastModel: 'trend',
      assumptions: {
        trendPeriods: historicalData.length,
        inflowTrend,
        outflowTrend,
        periodsAhead,
        rSquared: Math.max(inflowTrend.rSquared, outflowTrend.rSquared)
      },
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async generateSeasonalForecast(
    businessAccountId: string,
    entityId: string,
    currency: string,
    forecastType: string,
    periodStart: Date,
    periodEnd: Date,
    confidenceLevel: number = 3
  ): Promise<LiquidityForecast> {
    // Get historical data for seasonal analysis
    const historicalData = await this.getHistoricalCashFlows(
      businessAccountId,
      entityId,
      currency,
      new Date(periodStart.getFullYear() - 3, periodStart.getMonth(), periodStart.getDate()),
      periodEnd,
      3 // Last 3 years
    );
    
    if (historicalData.length < 12) {
      throw new Error('Insufficient data for seasonal forecast');
    }
    
    // Calculate seasonal factors
    const seasonalFactors = this.calculateSeasonalFactors(historicalData, forecastType);
    
    // Get base amounts (non-seasonal component)
    const baseInflows = this.calculateBaseAmounts(historicalData.map(d => d.inflows), seasonalFactors.inflows);
    const baseOutflows = this.calculateBaseAmounts(historicalData.map(d => d.outflows), seasonalFactors.outflows);
    
    // Apply seasonal adjustment for forecast period
    const periodIndex = this.getPeriodIndex(periodStart, forecastType);
    const seasonalInflowFactor = seasonalFactors.inflows[periodIndex] || 1;
    const seasonalOutflowFactor = seasonalFactors.outflows[periodIndex] || 1;
    
    const adjustedInflows = baseInflows * seasonalInflowFactor;
    const adjustedOutflows = baseOutflows * seasonalOutflowFactor;
    
    const openingBalance = await this.getOpeningBalance(
      businessAccountId,
      entityId,
      currency,
      periodStart
    );
    
    const netCashFlow = adjustedInflows - adjustedOutflows;
    const closingBalance = openingBalance + netCashFlow;
    
    return {
      id: uuidv4(),
      businessAccountId,
      entityId,
      currency,
      forecastType,
      forecastDate: new Date(),
      periodStart,
      periodEnd,
      openingBalance,
      inflows: adjustedInflows,
      outflows: adjustedOutflows,
      netCashFlow,
      closingBalance,
      confidenceLevel,
      forecastModel: 'seasonal',
      assumptions: {
        seasonalFactors,
        baseInflows,
        baseOutflows,
        periodIndex,
        seasonalInflowFactor,
        seasonalOutflowFactor
      },
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Cash Runway Analysis
  async analyzeCashRunway(
    businessAccountId: string,
    entityId: string,
    currency: string,
    forecastType: string = 'daily',
    daysToAnalyze: number = 90
  ): Promise<CashRunwayAnalysis> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + daysToAnalyze);
    
    // Generate forecast for the period
    const forecast = await this.generateHistoricalForecast(
      businessAccountId,
      entityId,
      currency,
      forecastType,
      startDate,
      endDate
    );
    
    // Calculate runway
    let currentBalance = forecast.openingBalance;
    let runwayDays = 0;
    let criticalDate: Date | null = null;
    
    // Simulate daily cash flow
    const dailyBurnRate = forecast.netCashFlow / daysToAnalyze;
    
    if (dailyBurnRate >= 0) {
      // Positive cash flow - infinite runway
      runwayDays = 999;
    } else {
      // Negative cash flow - calculate when cash runs out
      runwayDays = Math.floor(currentBalance / Math.abs(dailyBurnRate));
      criticalDate = new Date();
      criticalDate.setDate(startDate.getDate() + runwayDays);
    }
    
    const runwayMonths = Math.floor(runwayDays / 30);
    
    // Generate scenarios
    const scenarios = await this.generateRunwayScenarios(
      businessAccountId,
      entityId,
      currency,
      currentBalance,
      dailyBurnRate
    );
    
    // Generate recommendations
    const recommendations = this.generateRunwayRecommendations(
      runwayDays,
      dailyBurnRate,
      scenarios,
      forecast.confidenceLevel
    );
    
    return {
      businessAccountId,
      currency,
      currentBalance,
      runwayDays,
      runwayMonths,
      burnRate: Math.abs(dailyBurnRate),
      criticalDate: criticalDate || new Date(),
      scenarios,
      recommendations
    };
  }

  // Forecast Accuracy Analysis
  async analyzeForecastAccuracy(
    businessAccountId: string,
    forecastId: string,
    actualData: any
  ): Promise<ForecastAccuracy> {
    const forecast = await this.getForecastById(forecastId);
    
    const actualAmount = actualData.closingBalance || actualData.netCashFlow || 0;
    const forecastedAmount = forecast.closingBalance || forecast.netCashFlow || 0;
    
    const variancePercentage = ((actualAmount - forecastedAmount) / forecastedAmount) * 100;
    const accuracyScore = Math.max(0, 100 - Math.abs(variancePercentage));
    
    const modelPerformance = this.evaluateModelPerformance(accuracyScore);
    const improvementSuggestions = this.generateImprovementSuggestions(
      forecast.forecastModel,
      accuracyScore,
      variancePercentage
    );
    
    return {
      forecastId,
      actualAmount,
      forecastedAmount,
      variancePercentage,
      accuracyScore,
      modelPerformance,
      improvementSuggestions
    };
  }

  // Helper Methods
  private async getHistoricalCashFlows(
    businessAccountId: string,
    entityId: string,
    currency: string,
    startDate: Date,
    endDate: Date,
    years: number
  ): Promise<any[]> {
    // This would integrate with actual transaction data
    // For now, return placeholder historical data
    const historicalData = [];
    const currentDate = new Date();
    
    for (let i = 0; i < years * 12; i++) {
      const date = new Date(currentDate.getFullYear() - i, currentDate.getMonth(), 1);
      if (date >= startDate && date <= endDate) {
        historicalData.push({
          date,
          inflows: Math.random() * 100000 + 50000,
          outflows: Math.random() * 80000 + 40000,
          netCashFlow: Math.random() * 20000 - 10000
        });
      }
    }
    
    return historicalData.reverse();
  }

  private calculateTrendFactor(historicalData: any[]): number {
    if (historicalData.length < 2) return 0;
    
    const firstPeriod = historicalData[0];
    const lastPeriod = historicalData[historicalData.length - 1];
    
    const inflowGrowth = ((lastPeriod.inflows - firstPeriod.inflows) / firstPeriod.inflows) / historicalData.length;
    const outflowGrowth = ((lastPeriod.outflows - firstPeriod.outflows) / firstPeriod.outflows) / historicalData.length;
    
    return (inflowGrowth - outflowGrowth) / 2;
  }

  private calculateLinearTrend(values: number[]): { slope: number; intercept: number; rSquared: number } {
    if (values.length < 2) return { slope: 0, intercept: values[0] || 0, rSquared: 0 };
    
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const totalSumSquares = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const residualSumSquares = values.reduce((sum, y, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    
    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    
    return { slope, intercept, rSquared: Math.max(0, rSquared) };
  }

  private calculatePeriodsAhead(forecastType: string, start: Date, end: Date): number {
    const diffTime = end.getTime() - start.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    
    switch (forecastType) {
      case 'daily':
        return diffDays;
      case 'weekly':
        return diffDays / 7;
      case 'monthly':
        return diffDays / 30;
      case 'quarterly':
        return diffDays / 90;
      case 'annual':
        return diffDays / 365;
      default:
        return diffDays;
    }
  }

  private calculateSeasonalFactors(historicalData: any[], forecastType: string): { inflows: number[]; outflows: number[] } {
    const periods = forecastType === 'daily' ? 365 : forecastType === 'weekly' ? 52 : forecastType === 'monthly' ? 12 : 4;
    const inflowFactors = new Array(periods).fill(1);
    const outflowFactors = new Array(periods).fill(1);
    
    // Group data by period and calculate seasonal factors
    const inflowByPeriod = new Array(periods).fill(0);
    const outflowByPeriod = new Array(periods).fill(0);
    const countByPeriod = new Array(periods).fill(0);
    
    for (const data of historicalData) {
      const periodIndex = this.getPeriodIndex(data.date, forecastType);
      inflowByPeriod[periodIndex] += data.inflows;
      outflowByPeriod[periodIndex] += data.outflows;
      countByPeriod[periodIndex]++;
    }
    
    // Calculate seasonal factors
    const avgInflow = inflowByPeriod.reduce((sum, val) => sum + val, 0) / countByPeriod.reduce((sum, val) => sum + val, 0);
    const avgOutflow = outflowByPeriod.reduce((sum, val) => sum + val, 0) / countByPeriod.reduce((sum, val) => sum + val, 0);
    
    for (let i = 0; i < periods; i++) {
      if (countByPeriod[i] > 0) {
        inflowFactors[i] = (inflowByPeriod[i] / countByPeriod[i]) / avgInflow;
        outflowFactors[i] = (outflowByPeriod[i] / countByPeriod[i]) / avgOutflow;
      }
    }
    
    return { inflows: inflowFactors, outflows: outflowFactors };
  }

  private calculateBaseAmounts(values: number[], seasonalFactors: number[]): number {
    const deseasonalizedValues = values.map((val, i) => val / (seasonalFactors[i] || 1));
    return deseasonalizedValues.reduce((sum, val) => sum + val, 0) / deseasonalizedValues.length;
  }

  private getPeriodIndex(date: Date, forecastType: string): number {
    switch (forecastType) {
      case 'daily':
        return date.getDate() - 1;
      case 'weekly':
        return Math.floor(date.getDate() / 7);
      case 'monthly':
        return date.getMonth();
      case 'quarterly':
        return Math.floor(date.getMonth() / 3);
      default:
        return 0;
    }
  }

  private async getOpeningBalance(
    businessAccountId: string,
    entityId: string,
    currency: string,
    date: Date
  ): Promise<number> {
    // This would get the actual opening balance from the cash positions
    // For now, return a placeholder
    return 1000000;
  }

  private async getForecastById(forecastId: string): Promise<LiquidityForecast> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        entity_id as "entityId",
        currency,
        forecast_type as "forecastType",
        forecast_date as "forecastDate",
        period_start as "periodStart",
        period_end as "periodEnd",
        opening_balance as "openingBalance",
        inflows,
        outflows,
        net_cash_flow as "netCashFlow",
        closing_balance as "closingBalance",
        confidence_level as "confidenceLevel",
        forecast_model as "forecastModel",
        assumptions,
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM liquidity_forecasts
      WHERE id = ${forecastId}::uuid
    `;
    
    return (result as any)[0];
  }

  private evaluateModelPerformance(accuracyScore: number): string {
    if (accuracyScore >= 90) return 'excellent';
    if (accuracyScore >= 75) return 'good';
    if (accuracyScore >= 60) return 'average';
    if (accuracyScore >= 40) return 'poor';
    return 'critical';
  }

  private generateImprovementSuggestions(
    model: string,
    accuracyScore: number,
    variancePercentage: number
  ): string[] {
    const suggestions = [];
    
    if (accuracyScore < 60) {
      suggestions.push('Consider using a different forecasting model');
      suggestions.push('Increase historical data period for better accuracy');
    }
    
    if (Math.abs(variancePercentage) > 20) {
      suggestions.push('Review and adjust forecast assumptions');
      suggestions.push('Consider external factors affecting cash flow');
    }
    
    if (model === 'historical') {
      suggestions.push('Try trend or seasonal models for better accuracy');
    }
    
    return suggestions;
  }

  private async generateRunwayScenarios(
    businessAccountId: string,
    entityId: string,
    currency: string,
    currentBalance: number,
    burnRate: number
  ): Promise<any[]> {
    return [
      {
        scenario: 'baseline',
        description: 'Current burn rate continues',
        runway: Math.floor(currentBalance / Math.abs(burnRate)),
        confidence: 70
      },
      {
        scenario: 'optimistic',
        description: '20% reduction in burn rate',
        runway: Math.floor(currentBalance / Math.abs(burnRate * 0.8)),
        confidence: 50
      },
      {
        scenario: 'pessimistic',
        description: '20% increase in burn rate',
        runway: Math.floor(currentBalance / Math.abs(burnRate * 1.2)),
        confidence: 50
      }
    ];
  }

  private generateRunwayRecommendations(
    runwayDays: number,
    burnRate: number,
    scenarios: any[],
    confidenceLevel: number
  ): string[] {
    const recommendations = [];
    
    if (runwayDays < 30) {
      recommendations.push('Critical: Immediate action required to improve cash position');
      recommendations.push('Consider emergency financing options');
    } else if (runwayDays < 90) {
      recommendations.push('Review and optimize cash flow management');
      recommendations.push('Explore cost reduction opportunities');
    }
    
    if (burnRate > 10000) {
      recommendations.push('High burn rate detected - implement expense controls');
    }
    
    if (confidenceLevel < 3) {
      recommendations.push('Low forecast confidence - increase data quality');
    }
    
    return recommendations;
  }
}
