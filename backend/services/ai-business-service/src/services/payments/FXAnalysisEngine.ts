import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const FXRateAnalysisSchema = z.object({
  businessAccountId: z.string().uuid(),
  currencyPair: z.string().length(6),
  baseCurrency: z.string().length(3),
  quoteCurrency: z.string().length(3),
  marketRate: z.number(),
  bankRate: z.number(),
  rateSource: z.string().optional(),
  rateTimestamp: z.string().datetime(),
  isWeekend: z.boolean().default(false),
  isHoliday: z.boolean().default(false),
  marketVolatility: z.number().default(0),
  confidenceLevel: z.number().int().min(1).max(5).default(3)
});

export interface FXRateAnalysis {
  id: string;
  businessAccountId: string;
  currencyPair: string;
  baseCurrency: string;
  quoteCurrency: string;
  marketRate: number;
  bankRate: number;
  spread: number;
  spreadPercentage: number;
  rateSource?: string;
  rateTimestamp: Date;
  isWeekend: boolean;
  isHoliday: boolean;
  marketVolatility: number;
  confidenceLevel: number;
  createdAt: Date;
}

export interface FXSpreadAnalysis {
  currencyPair: string;
  averageSpread: number;
  averageSpreadPercentage: number;
  minSpread: number;
  maxSpread: number;
  spreadVolatility: number;
  totalTransactions: number;
  potentialSavings: number;
  recommendedActions: string[];
}

export interface FXExposureReport {
  currency: string;
  exposureType: string;
  exposureAmount: number;
  currentRate: number;
  unrealizedGainLoss: number;
  riskLevel: string;
  hedgeRecommendations: string[];
  volatilityMetrics: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface HiddenFeeDetection {
  paymentId: string;
  currencyPair: string;
  totalFees: number;
  feePercentage: number;
  hiddenFees: {
    fxSpread: number;
    intermediaryFees: number;
    correspondentFees: number;
    processingFees: number;
    otherFees: number;
  };
  totalHiddenFees: number;
  hiddenFeePercentage: number;
  recommendations: string[];
}

export class FXAnalysisEngine {
  // FX Rate Analysis
  async analyzeFXRate(data: z.infer<typeof FXRateAnalysisSchema>): Promise<FXRateAnalysis> {
    const validated = FXRateAnalysisSchema.parse(data);
    
    const spread = validated.bankRate - validated.marketRate;
    const spreadPercentage = (spread / validated.marketRate) * 100;
    
    const result = await prisma.$queryRaw`
      INSERT INTO fx_rate_intelligence (
        id,
        business_account_id,
        currency_pair,
        base_currency,
        quote_currency,
        market_rate,
        bank_rate,
        spread,
        spread_percentage,
        rate_source,
        rate_timestamp,
        is_weekend,
        is_holiday,
        market_volatility,
        confidence_level
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.currencyPair}::varchar,
        ${validated.baseCurrency}::varchar,
        ${validated.quoteCurrency}::varchar,
        ${validated.marketRate}::decimal,
        ${validated.bankRate}::decimal,
        ${spread}::decimal,
        ${spreadPercentage}::decimal,
        ${validated.rateSource || null}::varchar,
        ${validated.rateTimestamp}::timestamptz,
        ${validated.isWeekend}::boolean,
        ${validated.isHoliday}::boolean,
        ${validated.marketVolatility}::decimal,
        ${validated.confidenceLevel}::integer
      ) RETURNING id
    `;
    
    const fxId = (result as any)[0]?.id;
    return this.getFXRateAnalysis(fxId);
  }

  async getFXRateAnalysis(fxId: string): Promise<FXRateAnalysis> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        currency_pair as "currencyPair",
        base_currency as "baseCurrency",
        quote_currency as "quoteCurrency",
        market_rate as "marketRate",
        bank_rate as "bankRate",
        spread,
        spread_percentage as "spreadPercentage",
        rate_source as "rateSource",
        rate_timestamp as "rateTimestamp",
        is_weekend as "isWeekend",
        is_holiday as "isHoliday",
        market_volatility as "marketVolatility",
        confidence_level as "confidenceLevel",
        created_at as "createdAt"
      FROM fx_rate_intelligence
      WHERE id = ${fxId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getFXRateAnalyses(businessAccountId: string, filters: {
    currencyPair?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<FXRateAnalysis[]> {
    const { currencyPair, startDate, endDate, limit = 100 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        currency_pair as "currencyPair",
        base_currency as "baseCurrency",
        quote_currency as "quoteCurrency",
        market_rate as "marketRate",
        bank_rate as "bankRate",
        spread,
        spread_percentage as "spreadPercentage",
        rate_source as "rateSource",
        rate_timestamp as "rateTimestamp",
        is_weekend as "isWeekend",
        is_holiday as "isHoliday",
        market_volatility as "marketVolatility",
        confidence_level as "confidenceLevel",
        created_at as "createdAt"
      FROM fx_rate_intelligence
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (currencyPair) {
      query += ` AND currency_pair = '${currencyPair}'`;
    }
    
    if (startDate) {
      query += ` AND rate_timestamp >= '${startDate}'::timestamptz`;
    }
    
    if (endDate) {
      query += ` AND rate_timestamp <= '${endDate}'::timestamptz`;
    }
    
    query += ` ORDER BY rate_timestamp DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as FXRateAnalysis[];
  }

  // FX Spread Analysis
  async analyzeFXSpreads(businessAccountId: string, currencyPair: string, periodDays: number = 30): Promise<FXSpreadAnalysis> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    
    const fxData = await this.getFXRateAnalyses(businessAccountId, {
      currencyPair,
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString()
    });

    if (fxData.length === 0) {
      return {
        currencyPair,
        averageSpread: 0,
        averageSpreadPercentage: 0,
        minSpread: 0,
        maxSpread: 0,
        spreadVolatility: 0,
        totalTransactions: 0,
        potentialSavings: 0,
        recommendedActions: ['No FX data available for analysis']
      };
    }

    const spreads = fxData.map(fx => fx.spread);
    const spreadPercentages = fxData.map(fx => fx.spreadPercentage);
    
    const averageSpread = spreads.reduce((sum, spread) => sum + spread, 0) / spreads.length;
    const averageSpreadPercentage = spreadPercentages.reduce((sum, sp) => sum + sp, 0) / spreadPercentages.length;
    const minSpread = Math.min(...spreads);
    const maxSpread = Math.max(...spreads);
    
    // Calculate spread volatility
    const meanSpread = averageSpread;
    const variance = spreads.reduce((sum, spread) => sum + Math.pow(spread - meanSpread, 2), 0) / spreads.length;
    const spreadVolatility = Math.sqrt(variance);
    
    // Calculate potential savings (if spreads could be optimized)
    const totalVolume = fxData.length * 100000; // Placeholder volume calculation
    const potentialSavings = totalVolume * (averageSpread - 0.001); // Assuming optimal spread of 0.001
    
    const recommendedActions = this.generateSpreadRecommendations(averageSpread, spreadVolatility, averageSpreadPercentage);
    
    return {
      currencyPair,
      averageSpread,
      averageSpreadPercentage,
      minSpread,
      maxSpread,
      spreadVolatility,
      totalTransactions: fxData.length,
      potentialSavings,
      recommendedActions
    };
  }

  // Hidden Fee Detection
  async detectHiddenFees(businessAccountId: string, paymentId: string): Promise<HiddenFeeDetection> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        payment_reference as "paymentReference",
        original_amount as "originalAmount",
        converted_amount as "convertedAmount",
        fx_rate_applied as "fxRateApplied",
        fx_spread as "fxSpread",
        total_fees as "totalFees",
        fee_breakdown as "feeBreakdown",
        source_currency as "sourceCurrency",
        destination_currency as "destinationCurrency"
      FROM cross_border_payments
      WHERE id = ${paymentId}::uuid AND business_account_id = ${businessAccountId}::uuid
    `;
    
    const payment = (result as any)[0];
    if (!payment) {
      throw new Error('Payment not found');
    }

    const feePercentage = (payment.totalFees / payment.originalAmount) * 100;
    
    // Analyze fee breakdown to identify hidden fees
    const feeBreakdown = payment.feeBreakdown || {};
    const hiddenFees = {
      fxSpread: payment.fxSpread * payment.originalAmount,
      intermediaryFees: feeBreakdown.intermediary || 0,
      correspondentFees: feeBreakdown.correspondent || 0,
      processingFees: feeBreakdown.processing || 0,
      otherFees: feeBreakdown.other || 0
    };
    
    const totalHiddenFees = Object.values(hiddenFees).reduce((sum, fee) => sum + fee, 0);
    const hiddenFeePercentage = (totalHiddenFees / payment.originalAmount) * 100;
    
    const recommendations = this.generateHiddenFeeRecommendations(
      feePercentage,
      hiddenFeePercentage,
      payment.fxSpread,
      payment.currencyPair
    );
    
    return {
      paymentId,
      currencyPair: payment.sourceCurrency + payment.destinationCurrency,
      totalFees: payment.totalFees,
      feePercentage,
      hiddenFees,
      totalHiddenFees,
      hiddenFeePercentage,
      recommendations
    };
  }

  // FX Exposure Analysis
  async analyzeFXExposure(businessAccountId: string, currency: string, baseCurrency: string = 'USD'): Promise<FXExposureReport> {
    // Get all payments involving the currency
    const paymentsResult = await prisma.$queryRaw`
      SELECT 
        original_amount as "originalAmount",
        converted_amount as "convertedAmount",
        source_currency as "sourceCurrency",
        destination_currency as "destinationCurrency",
        fx_rate_applied as "fxRateApplied",
        status,
        initiated_date as "initiatedDate"
      FROM cross_border_payments
      WHERE business_account_id = ${businessAccountId}::uuid 
        AND (source_currency = ${currency}::varchar OR destination_currency = ${currency}::varchar)
        AND status = 'completed'
      ORDER BY initiated_date DESC
      LIMIT 1000
    `;
    
    const payments = paymentsResult as any[];
    
    // Calculate exposure amounts
    const inboundExposure = payments
      .filter(p => p.destinationCurrency === currency)
      .reduce((sum, p) => sum + p.convertedAmount, 0);
    
    const outboundExposure = payments
      .filter(p => p.sourceCurrency === currency)
      .reduce((sum, p) => sum + p.originalAmount, 0);
    
    const netExposure = inboundExposure - outboundExposure;
    
    // Get current FX rate (this would integrate with real FX service)
    const currentRate = await this.getCurrentFXRate(baseCurrency, currency);
    
    // Calculate unrealized gain/loss
    const unrealizedGainLoss = netExposure * (currentRate - 1.0);
    
    // Determine risk level
    const riskLevel = this.determineFXRiskLevel(Math.abs(unrealizedGainLoss), netExposure);
    
    // Calculate volatility metrics
    const volatilityMetrics = await this.calculateVolatilityMetrics(businessAccountId, currency, baseCurrency);
    
    // Generate hedge recommendations
    const hedgeRecommendations = this.generateHedgeRecommendations(
      netExposure,
      riskLevel,
      volatilityMetrics
    );
    
    return {
      currency,
      exposureType: 'transactional',
      exposureAmount: netExposure,
      currentRate,
      unrealizedGainLoss,
      riskLevel,
      hedgeRecommendations,
      volatilityMetrics
    };
  }

  // Helper Methods
  private generateSpreadRecommendations(averageSpread: number, volatility: number, spreadPercentage: number): string[] {
    const recommendations = [];
    
    if (averageSpread > 0.005) { // More than 0.5%
      recommendations.push('FX spreads are high - consider negotiating better rates with banks');
    }
    
    if (volatility > 0.001) {
      recommendations.push('High spread volatility detected - implement spread monitoring alerts');
    }
    
    if (spreadPercentage > 0.5) {
      recommendations.push('Spread percentage exceeds 0.5% - review FX pricing strategy');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('FX spreads are within acceptable ranges');
    }
    
    return recommendations;
  }

  private generateHiddenFeeRecommendations(
    feePercentage: number,
    hiddenFeePercentage: number,
    fxSpread: number,
    currencyPair: string
  ): string[] {
    const recommendations = [];
    
    if (feePercentage > 2.0) {
      recommendations.push('Total fees exceed 2% - consider alternative payment methods');
    }
    
    if (hiddenFeePercentage > 1.0) {
      recommendations.push('Hidden fees detected - request detailed fee breakdown from banks');
    }
    
    if (fxSpread > 0.003) { // More than 0.3%
      recommendations.push(`High FX spread for ${currencyPair} - negotiate better rates`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Fee structure appears reasonable');
    }
    
    return recommendations;
  }

  private async getCurrentFXRate(baseCurrency: string, quoteCurrency: string): Promise<number> {
    // This would integrate with real FX rate service
    // For now, return placeholder rates
    const rates: Record<string, number> = {
      'USDEUR': 0.85,
      'USDGBP': 0.73,
      'USDAED': 3.67,
      'EURUSD': 1.18,
      'GBPUSD': 1.37,
      'AEDUSD': 0.27
    };
    
    return rates[baseCurrency + quoteCurrency] || 1.0;
  }

  private determineFXRiskLevel(unrealizedGainLoss: number, exposureAmount: number): string {
    const lossPercentage = Math.abs(unrealizedGainLoss) / Math.abs(exposureAmount) * 100;
    
    if (lossPercentage > 10) return 'critical';
    if (lossPercentage > 5) return 'high';
    if (lossPercentage > 2) return 'medium';
    return 'low';
  }

  private async calculateVolatilityMetrics(
    businessAccountId: string,
    currency: string,
    baseCurrency: string
  ): Promise<{ daily: number; weekly: number; monthly: number }> {
    // Get historical FX rates for volatility calculation
    const fxData = await this.getFXRateAnalyses(businessAccountId, {
      currencyPair: baseCurrency + currency,
      limit: 90 // Last 90 days
    });
    
    if (fxData.length < 2) {
      return { daily: 0, weekly: 0, monthly: 0 };
    }
    
    // Calculate daily volatility
    const dailyReturns = [];
    for (let i = 1; i < fxData.length; i++) {
      const previousRate = fxData[i - 1].marketRate;
      const currentRate = fxData[i].marketRate;
      dailyReturns.push((currentRate - previousRate) / previousRate);
    }
    
    const dailyMean = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
    const dailyVariance = dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - dailyMean, 2), 0) / dailyReturns.length;
    const dailyVolatility = Math.sqrt(dailyVariance);
    
    return {
      daily: dailyVolatility,
      weekly: dailyVolatility * Math.sqrt(7),
      monthly: dailyVolatility * Math.sqrt(30)
    };
  }

  private generateHedgeRecommendations(
    exposureAmount: number,
    riskLevel: string,
    volatilityMetrics: { daily: number; weekly: number; monthly: number }
  ): string[] {
    const recommendations = [];
    
    if (Math.abs(exposureAmount) > 1000000) {
      recommendations.push('Consider FX forward contracts to hedge large exposures');
    }
    
    if (riskLevel === 'high' || riskLevel === 'critical') {
      recommendations.push('Implement immediate hedging strategy due to high risk level');
    }
    
    if (volatilityMetrics.monthly > 0.05) {
      recommendations.push('High volatility detected - consider options for flexible hedging');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Current FX exposure is within acceptable risk parameters');
    }
    
    return recommendations;
  }

  // Analytics Methods
  async getFXEfficiencyDashboard(businessAccountId: string): Promise<any> {
    const result = await prisma.$queryRaw`
      SELECT * FROM fx_efficiency_analysis
      WHERE business_account_id = ${businessAccountId}::uuid
      ORDER BY last_payment_date DESC
    `;
    
    return result;
  }

  async getFXExposureSummary(businessAccountId: string): Promise<any> {
    const currencies = ['EUR', 'GBP', 'AED', 'JPY', 'CHF'];
    const exposures = [];
    
    for (const currency of currencies) {
      const exposure = await this.analyzeFXExposure(businessAccountId, currency);
      exposures.push(exposure);
    }
    
    return {
      businessAccountId,
      totalExposure: exposures.reduce((sum, exp) => sum + Math.abs(exp.exposureAmount), 0),
      currencyExposures: exposures,
      highRiskCurrencies: exposures.filter(exp => exp.riskLevel === 'high' || exp.riskLevel === 'critical'),
      lastUpdated: new Date()
    };
  }

  async generateFXOptimizationReport(businessAccountId: string, language: 'en' | 'ar' = 'en'): Promise<any> {
    const fxData = await this.getFXRateAnalyses(businessAccountId, { limit: 100 });
    const currencyPairs = [...new Set(fxData.map(fx => fx.currencyPair))];
    
    const analyses = [];
    for (const pair of currencyPairs) {
      const spreadAnalysis = await this.analyzeFXSpreads(businessAccountId, pair);
      analyses.push(spreadAnalysis);
    }
    
    const totalPotentialSavings = analyses.reduce((sum, analysis) => sum + analysis.potentialSavings, 0);
    
    return {
      summary: language === 'ar' ? {
        reportTitle: 'تقرير تحسين FX',
        totalCurrencyPairs: currencyPairs.length,
        totalPotentialSavings,
        highRiskPairs: analyses.filter(a => a.averageSpreadPercentage > 0.5).length,
        generatedAt: new Date().toISOString()
      } : {
        reportTitle: 'FX Optimization Report',
        totalCurrencyPairs: currencyPairs.length,
        totalPotentialSavings,
        highRiskPairs: analyses.filter(a => a.averageSpreadPercentage > 0.5).length,
        generatedAt: new Date().toISOString()
      },
      currencyPairAnalyses: analyses,
      recommendations: this.generateOverallFXRecommendations(analyses, language)
    };
  }

  private generateOverallFXRecommendations(analyses: FXSpreadAnalysis[], language: 'en' | 'ar'): string[] {
    const recommendations = [];
    
    const highSpreadPairs = analyses.filter(a => a.averageSpreadPercentage > 0.5);
    if (highSpreadPairs.length > 0) {
      recommendations.push(language === 'ar' ? 
        `${highSpreadPairs.length} أزواج عملات لديها فروقات عالية - راجع أسعار FX` : 
        `${highSpreadPairs.length} currency pairs have high spreads - review FX pricing`
      );
    }
    
    const highVolatilityPairs = analyses.filter(a => a.spreadVolatility > 0.001);
    if (highVolatilityPairs.length > 0) {
      recommendations.push(language === 'ar' ? 
        `${highVolatilityPairs.length} أزواج عملات لديها تقلبات عالية - نفذ استراتيجيات التحوط` : 
        `${highVolatilityPairs.length} currency pairs have high volatility - implement hedging strategies`
      );
    }
    
    const totalSavings = analyses.reduce((sum, a) => sum + a.potentialSavings, 0);
    if (totalSavings > 10000) {
      recommendations.push(language === 'ar' ? 
        `فرصة توفير محتملة: ${totalSavings.toLocaleString()} من خلال تحسين FX` : 
        `Potential savings opportunity: ${totalSavings.toLocaleString()} through FX optimization`
      );
    }
    
    return recommendations;
  }
}
