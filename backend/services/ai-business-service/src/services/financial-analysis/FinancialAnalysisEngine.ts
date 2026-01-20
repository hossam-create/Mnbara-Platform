import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

export interface CommonSizeStatement {
  incomeStatement: {
    revenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    operatingExpenses: number;
    operatingIncome: number;
    netIncome: number;
  };
  balanceSheet: {
    totalAssets: number;
    currentAssets: number;
    fixedAssets: number;
    currentLiabilities: number;
    longTermLiabilities: number;
    equity: number;
  };
}

export interface FinancialRatios {
  profitability: {
    grossProfitMargin: number;
    netProfitMargin: number;
    returnOnAssets: number;
    returnOnEquity: number;
  };
  liquidity: {
    currentRatio: number;
    quickRatio: number;
    cashRatio: number;
  };
  assetTurnover: {
    assetTurnover: number;
    inventoryTurnover: number;
    receivablesTurnover: number;
  };
  leverage: {
    debtToEquity: number;
    debtToAssets: number;
    interestCoverage: number;
  };
}

export interface TrendAnalysis {
  metricName: string;
  periodType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  values: number[];
  periodLabels: string[];
  trendDirection: 'INCREASING' | 'DECREASING' | 'STABLE' | 'VOLATILE';
  trendStrength: number;
  growthRate: number;
  volatility: number;
}

export interface ForecastVsActualComparison {
  fiscalYear: number;
  fiscalQuarter?: number;
  fiscalMonth?: number;
  revenue: {
    actual: number;
    forecast: number;
    variance: number;
    variancePercentage: number;
  };
  expenses: {
    actual: number;
    forecast: number;
    variance: number;
    variancePercentage: number;
  };
  netIncome: {
    actual: number;
    forecast: number;
    variance: number;
    variancePercentage: number;
  };
  assets: {
    actual: number;
    forecast: number;
    variance: number;
    variancePercentage: number;
  };
  liabilities: {
    actual: number;
    forecast: number;
    variance: number;
    variancePercentage: number;
  };
  accuracy: {
    meanAbsolutePercentageError: number;
    meanSquaredError: number;
    forecastAccuracyScore: number;
  };
}

export interface AIInsight {
  type: 'PERFORMANCE' | 'TREND' | 'RISK' | 'OPPORTUNITY';
  category: 'PROFITABILITY' | 'LIQUIDITY' | 'EFFICIENCY' | 'GROWTH';
  title: string;
  description: string;
  confidenceScore: number;
  impactLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actionableRecommendations: string[];
  supportingData: any;
}

export interface FinancialAnalysisRequest {
  businessAccountId: string;
  analysisType: 'COMMON_SIZE' | 'RATIOS' | 'TREND' | 'COMPARISON';
  periodType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  fiscalYear: number;
  fiscalQuarter?: number;
  fiscalMonth?: number;
  dataSource: 'ACTUAL' | 'FORECAST' | 'BOTH';
  scenarioId?: string;
  includeAIInsights?: boolean;
  userId?: string;
}

export interface FinancialAnalysisResult {
  id: string;
  businessAccountId: string;
  analysisType: string;
  periodType: string;
  fiscalYear: number;
  fiscalQuarter?: number;
  fiscalMonth?: number;
  dataSource: string;
  scenarioId?: string;
  commonSizeStatements?: CommonSizeStatement;
  financialRatios?: FinancialRatios;
  trendAnalysis?: TrendAnalysis[];
  forecastVsActual?: ForecastVsActualComparison[];
  aiInsights?: AIInsight[];
  analysisDate: Date;
  createdAt: Date;
}

export class FinancialAnalysisEngine {
  constructor(private prisma: PrismaClient) {}

  async performAnalysis(request: FinancialAnalysisRequest): Promise<FinancialAnalysisResult> {
    try {
      logger.info(`Performing financial analysis for business: ${request.businessAccountId}, type: ${request.analysisType}`);

      // Create analysis result record
      const analysisResult = await this.prisma.financialAnalysisResults.create({
        data: {
          businessAccountId: request.businessAccountId,
          analysisType: request.analysisType,
          analysisPeriodType: request.periodType,
          fiscalYear: request.fiscalYear,
          fiscalQuarter: request.fiscalQuarter,
          fiscalMonth: request.fiscalMonth,
          dataSource: request.dataSource,
          scenarioId: request.scenarioId,
          createdBy: request.userId
        }
      });

      let commonSizeData: any = null;
      let ratiosData: any = null;
      let trendData: any = null;
      let comparisonData: any = null;
      let aiInsightsData: any = null;

      // Perform analysis based on type
      switch (request.analysisType) {
        case 'COMMON_SIZE':
          commonSizeData = await this.calculateCommonSizeStatements(request);
          break;
        case 'RATIOS':
          ratiosData = await this.calculateFinancialRatios(request);
          break;
        case 'TREND':
          trendData = await this.performTrendAnalysis(request);
          break;
        case 'COMPARISON':
          comparisonData = await this.performForecastVsActualComparison(request);
          break;
      }

      // Generate AI insights if requested
      if (request.includeAIInsights) {
        aiInsightsData = await this.generateAIInsights(analysisResult.id, request, {
          commonSizeData,
          ratiosData,
          trendData,
          comparisonData
        });
      }

      // Update analysis result with data
      const updatedResult = await this.prisma.financialAnalysisResults.update({
        where: { id: analysisResult.id },
        data: {
          commonSizeIncomeStatement: commonSizeData?.incomeStatement,
          commonSizeBalanceSheet: commonSizeData?.balanceSheet,
          profitabilityRatios: ratiosData?.profitability,
          liquidityRatios: ratiosData?.liquidity,
          assetTurnoverRatios: ratiosData?.assetTurnover,
          leverageRatios: ratiosData?.leverage,
          trendData: trendData,
          forecastVsActual: comparisonData,
          aiInsights: aiInsightsData
        }
      });

      logger.info(`Financial analysis completed: ${analysisResult.id}`);
      return this.mapToFinancialAnalysisResult(updatedResult);
    } catch (error) {
      logger.error('Failed to perform financial analysis:', error);
      throw error;
    }
  }

  async calculateCommonSizeStatements(request: FinancialAnalysisRequest): Promise<CommonSizeStatement> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT calculate_common_size_statements(
          ${request.businessAccountId},
          ${request.fiscalYear},
          ${request.fiscalQuarter || null},
          ${request.fiscalMonth || null},
          ${request.dataSource}
        ) as result
      `;

      const data = (result as any)[0]?.result;
      
      return {
        incomeStatement: {
          revenue: data?.income_statement?.revenue || 0,
          costOfGoodsSold: data?.income_statement?.cost_of_goods_sold || 0,
          grossProfit: data?.income_statement?.gross_profit || 0,
          operatingExpenses: data?.income_statement?.operating_expenses || 0,
          operatingIncome: data?.income_statement?.operating_income || 0,
          netIncome: data?.income_statement?.net_income || 0
        },
        balanceSheet: {
          totalAssets: data?.balance_sheet?.total_assets || 0,
          currentAssets: data?.balance_sheet?.current_assets || 0,
          fixedAssets: data?.balance_sheet?.fixed_assets || 0,
          currentLiabilities: data?.balance_sheet?.current_liabilities || 0,
          longTermLiabilities: data?.balance_sheet?.long_term_liabilities || 0,
          equity: data?.balance_sheet?.equity || 0
        }
      };
    } catch (error) {
      logger.error('Failed to calculate common size statements:', error);
      throw error;
    }
  }

  async calculateFinancialRatios(request: FinancialAnalysisRequest): Promise<FinancialRatios> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT calculate_financial_ratios(
          ${request.businessAccountId},
          ${request.fiscalYear},
          ${request.fiscalQuarter || null},
          ${request.fiscalMonth || null},
          ${request.dataSource}
        ) as result
      `;

      const data = (result as any)[0]?.result;

      return {
        profitability: {
          grossProfitMargin: data?.profitability_ratios?.gross_profit_margin || 0,
          netProfitMargin: data?.profitability_ratios?.net_profit_margin || 0,
          returnOnAssets: data?.profitability_ratios?.return_on_assets || 0,
          returnOnEquity: data?.profitability_ratios?.return_on_equity || 0
        },
        liquidity: {
          currentRatio: data?.liquidity_ratios?.current_ratio || 0,
          quickRatio: data?.liquidity_ratios?.quick_ratio || 0,
          cashRatio: data?.liquidity_ratios?.cash_ratio || 0
        },
        assetTurnover: {
          assetTurnover: data?.asset_turnover_ratios?.asset_turnover || 0,
          inventoryTurnover: data?.asset_turnover_ratios?.inventory_turnover || 0,
          receivablesTurnover: data?.asset_turnover_ratios?.receivables_turnover || 0
        },
        leverage: {
          debtToEquity: data?.leverage_ratios?.debt_to_equity || 0,
          debtToAssets: data?.leverage_ratios?.debt_to_assets || 0,
          interestCoverage: data?.leverage_ratios?.interest_coverage || 0
        }
      };
    } catch (error) {
      logger.error('Failed to calculate financial ratios:', error);
      throw error;
    }
  }

  async performTrendAnalysis(request: FinancialAnalysisRequest): Promise<TrendAnalysis[]> {
    try {
      const trendAnalyses: TrendAnalysis[] = [];

      // Define key metrics to analyze
      const metrics = [
        'revenue',
        'net_income',
        'total_assets',
        'current_ratio',
        'debt_to_equity',
        'gross_profit_margin'
      ];

      for (const metricName of metrics) {
        const trendData = await this.calculateTrendForMetric(request, metricName);
        if (trendData) {
          trendAnalyses.push(trendData);
        }
      }

      // Store trend analysis data
      for (const trend of trendAnalyses) {
        await this.prisma.trendAnalysisPeriods.create({
          data: {
            businessAccountId: request.businessAccountId,
            startDate: new Date(request.fiscalYear, 0, 1),
            endDate: new Date(request.fiscalYear, 11, 31),
            periodType: request.periodType,
            metricName: trend.metricName,
            metricValues: trend.values,
            periodLabels: trend.periodLabels,
            trendDirection: trend.trendDirection,
            trendStrength: trend.trendStrength,
            growthRate: trend.growthRate,
            volatility: trend.volatility
          }
        });
      }

      return trendAnalyses;
    } catch (error) {
      logger.error('Failed to perform trend analysis:', error);
      throw error;
    }
  }

  private async calculateTrendForMetric(
    request: FinancialAnalysisRequest,
    metricName: string
  ): Promise<TrendAnalysis | null> {
    try {
      // Get historical data for the metric
      const historicalData = await this.getHistoricalMetricData(request.businessAccountId, metricName, request.periodType);
      
      if (historicalData.length < 2) {
        return null;
      }

      const values = historicalData.map(d => d.value);
      const periodLabels = historicalData.map(d => d.period);

      // Calculate trend statistics
      const trendDirection = this.calculateTrendDirection(values);
      const trendStrength = this.calculateTrendStrength(values);
      const growthRate = this.calculateGrowthRate(values);
      const volatility = this.calculateVolatility(values);

      return {
        metricName,
        periodType: request.periodType,
        values,
        periodLabels,
        trendDirection,
        trendStrength,
        growthRate,
        volatility
      };
    } catch (error) {
      logger.error(`Failed to calculate trend for metric ${metricName}:`, error);
      return null;
    }
  }

  private async getHistoricalMetricData(
    businessAccountId: string,
    metricName: string,
    periodType: string
  ): Promise<Array<{ period: string; value: number }>> {
    // This would typically query actual financial data over multiple periods
    // For now, return sample data structure
    logger.info(`Getting historical data for ${metricName} with period type ${periodType} for business ${businessAccountId}`);
    return [
      { period: 'Q1', value: 100000 },
      { period: 'Q2', value: 110000 },
      { period: 'Q3', value: 105000 },
      { period: 'Q4', value: 120000 }
    ];
  }

  private calculateTrendDirection(values: number[]): 'INCREASING' | 'DECREASING' | 'STABLE' | 'VOLATILE' {
    if (values.length < 2) return 'STABLE';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;

    if (Math.abs(change) < 0.02) return 'STABLE';
    if (change > 0.1) return 'INCREASING';
    if (change < -0.1) return 'DECREASING';
    return 'VOLATILE';
  }

  private calculateTrendStrength(values: number[]): number {
    if (values.length < 2) return 0;

    // Simple linear correlation coefficient
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * (y[i] || 0), 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const correlation = (n * sumXY - sumX * sumY) / 
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return isNaN(correlation) ? 0 : Math.abs(correlation);
  }

  private calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0;

    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const periods = values.length - 1;

    if (firstValue === 0) return 0;
    return ((lastValue / firstValue) - 1) * 100 / periods;
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    
    return Math.sqrt(variance);
  }

  async performForecastVsActualComparison(request: FinancialAnalysisRequest): Promise<ForecastVsActualComparison[]> {
    try {
      if (!request.scenarioId) {
        throw new Error('Scenario ID is required for forecast vs actual comparison');
      }

      // Get forecast data
      const forecastData = await this.prisma.forecastPeriods.findMany({
        where: {
          businessAccountId: request.businessAccountId,
          scenarioId: request.scenarioId,
          fiscalYear: request.fiscalYear,
          ...(request.fiscalQuarter && { fiscalQuarter: request.fiscalQuarter }),
          ...(request.fiscalMonth && { fiscalMonth: request.fiscalMonth })
        },
        include: {
          incomeStatement: true,
          balanceSheet: true
        }
      });

      // Get actual data for the same periods
      const actualData = await this.getActualFinancialData(request.businessAccountId, request.fiscalYear, request.fiscalQuarter, request.fiscalMonth);

      const comparisons: ForecastVsActualComparison[] = [];

      for (const forecast of forecastData) {
        const actual = actualData.find(a => 
          a.fiscalYear === forecast.fiscalYear &&
          a.fiscalQuarter === forecast.fiscalQuarter &&
          a.fiscalMonth === forecast.fiscalMonth
        );

        if (actual && forecast.incomeStatement && forecast.balanceSheet) {
          const comparison = this.createComparison(forecast, actual);
          comparisons.push(comparison);

          // Store comparison data
          await this.prisma.forecastActualComparisons.create({
            data: {
              businessAccountId: request.businessAccountId,
              scenarioId: request.scenarioId,
              periodId: forecast.id,
              fiscalYear: forecast.fiscalYear,
              fiscalQuarter: forecast.fiscalQuarter,
              fiscalMonth: forecast.fiscalMonth,
              actualRevenue: actual.revenue,
              forecastRevenue: forecast.incomeStatement.revenue,
              revenueVariance: comparison.revenue.variance,
              revenueVariancePercentage: comparison.revenue.variancePercentage,
              actualExpenses: actual.expenses,
              forecastExpenses: forecast.incomeStatement.costOfGoodsSold + forecast.incomeStatement.operatingExpenses,
              expenseVariance: comparison.expenses.variance,
              expenseVariancePercentage: comparison.expenses.variancePercentage,
              actualNetIncome: actual.netIncome,
              forecastNetIncome: forecast.incomeStatement.netIncome,
              netIncomeVariance: comparison.netIncome.variance,
              netIncomeVariancePercentage: comparison.netIncome.variancePercentage,
              actualTotalAssets: actual.totalAssets,
              forecastTotalAssets: forecast.balanceSheet.totalAssets,
              assetsVariance: comparison.assets.variance,
              assetsVariancePercentage: comparison.assets.variancePercentage,
              actualTotalLiabilities: actual.totalLiabilities,
              forecastTotalLiabilities: forecast.balanceSheet.totalLiabilities,
              liabilitiesVariance: comparison.liabilities.variance,
              liabilitiesVariancePercentage: comparison.liabilities.variancePercentage,
              meanAbsolutePercentageError: comparison.accuracy.meanAbsolutePercentageError,
              meanSquaredError: comparison.accuracy.meanSquaredError,
              forecastAccuracyScore: comparison.accuracy.forecastAccuracyScore
            }
          });
        }
      }

      return comparisons;
    } catch (error) {
      logger.error('Failed to perform forecast vs actual comparison:', error);
      throw error;
    }
  }

  private async getActualFinancialData(
    businessAccountId: string,
    fiscalYear: number,
    fiscalQuarter?: number,
    fiscalMonth?: number
  ): Promise<Array<any>> {
    // This would typically query actual financial statements
    logger.info(`Getting actual financial data for business ${businessAccountId}, year ${fiscalYear}`);
    return [
      {
        fiscalYear,
        fiscalQuarter,
        fiscalMonth,
        revenue: 100000,
        expenses: 75000,
        netIncome: 25000,
        totalAssets: 200000,
        totalLiabilities: 80000
      }
    ];
  }

  private createComparison(forecast: any, actual: any): ForecastVsActualComparison {
    const revenueVariance = actual.revenue - forecast.incomeStatement.revenue;
    const revenueVariancePercentage = forecast.incomeStatement.revenue !== 0 ? 
      (revenueVariance / forecast.incomeStatement.revenue) * 100 : 0;

    const expensesVariance = actual.expenses - (forecast.incomeStatement.costOfGoodsSold + forecast.incomeStatement.operatingExpenses);
    const expensesVariancePercentage = (forecast.incomeStatement.costOfGoodsSold + forecast.incomeStatement.operatingExpenses) !== 0 ? 
      (expensesVariance / (forecast.incomeStatement.costOfGoodsSold + forecast.incomeStatement.operatingExpenses)) * 100 : 0;

    const netIncomeVariance = actual.netIncome - forecast.incomeStatement.netIncome;
    const netIncomeVariancePercentage = forecast.incomeStatement.netIncome !== 0 ? 
      (netIncomeVariance / forecast.incomeStatement.netIncome) * 100 : 0;

    const assetsVariance = actual.totalAssets - forecast.balanceSheet.totalAssets;
    const assetsVariancePercentage = forecast.balanceSheet.totalAssets !== 0 ? 
      (assetsVariance / forecast.balanceSheet.totalAssets) * 100 : 0;

    const liabilitiesVariance = actual.totalLiabilities - forecast.balanceSheet.totalLiabilities;
    const liabilitiesVariancePercentage = forecast.balanceSheet.totalLiabilities !== 0 ? 
      (liabilitiesVariance / forecast.balanceSheet.totalLiabilities) * 100 : 0;

    // Calculate accuracy metrics
    const mape = Math.abs(revenueVariancePercentage) / 100;
    const mse = Math.pow(revenueVariance, 2);
    const accuracyScore = Math.max(0, 1 - mape);

    return {
      fiscalYear: forecast.fiscalYear,
      fiscalQuarter: forecast.fiscalQuarter,
      fiscalMonth: forecast.fiscalMonth,
      revenue: {
        actual: actual.revenue,
        forecast: forecast.incomeStatement.revenue,
        variance: revenueVariance,
        variancePercentage: revenueVariancePercentage
      },
      expenses: {
        actual: actual.expenses,
        forecast: forecast.incomeStatement.costOfGoodsSold + forecast.incomeStatement.operatingExpenses,
        variance: expensesVariance,
        variancePercentage: expensesVariancePercentage
      },
      netIncome: {
        actual: actual.netIncome,
        forecast: forecast.incomeStatement.netIncome,
        variance: netIncomeVariance,
        variancePercentage: netIncomeVariancePercentage
      },
      assets: {
        actual: actual.totalAssets,
        forecast: forecast.balanceSheet.totalAssets,
        variance: assetsVariance,
        variancePercentage: assetsVariancePercentage
      },
      liabilities: {
        actual: actual.totalLiabilities,
        forecast: forecast.balanceSheet.totalLiabilities,
        variance: liabilitiesVariance,
        variancePercentage: liabilitiesVariancePercentage
      },
      accuracy: {
        meanAbsolutePercentageError: mape,
        meanSquaredError: mse,
        forecastAccuracyScore: accuracyScore
      }
    };
  }

  async generateAIInsights(
    analysisResultId: string,
    request: FinancialAnalysisRequest,
    analysisData: any
  ): Promise<AIInsight[]> {
    try {
      const insights: AIInsight[] = [];

      // Generate insights based on analysis type and data
      if (analysisData.ratiosData) {
        insights.push(...this.generateRatioInsights(analysisData.ratiosData));
      }

      if (analysisData.trendData) {
        insights.push(...this.generateTrendInsights(analysisData.trendData));
      }

      if (analysisData.comparisonData) {
        insights.push(...this.generateComparisonInsights(analysisData.comparisonData));
      }

      // Store insights in database
      for (const insight of insights) {
        await this.prisma.aiAnalysisInsights.create({
          data: {
            businessAccountId: request.businessAccountId,
            analysisResultId,
            insightType: insight.type,
            insightCategory: insight.category,
            insightTitle: insight.title,
            insightDescription: insight.description,
            confidenceScore: insight.confidenceScore,
            impactLevel: insight.impactLevel,
            actionableRecommendations: insight.actionableRecommendations,
            supportingData: insight.supportingData
          }
        });
      }

      return insights;
    } catch (error) {
      logger.error('Failed to generate AI insights:', error);
      throw error;
    }
  }

  private generateRatioInsights(ratiosData: FinancialRatios): AIInsight[] {
    const insights: AIInsight[] = [];

    // Profitability insights
    if (ratiosData.profitability.netProfitMargin < 5) {
      insights.push({
        type: 'PERFORMANCE',
        category: 'PROFITABILITY',
        title: 'Low Net Profit Margin',
        description: `Net profit margin of ${ratiosData.profitability.netProfitMargin.toFixed(2)}% is below industry averages. Consider reviewing cost structure and pricing strategies.`,
        confidenceScore: 0.8,
        impactLevel: 'HIGH',
        actionableRecommendations: [
          'Review and optimize cost of goods sold',
          'Analyze pricing strategy',
          'Identify inefficiencies in operations'
        ],
        supportingData: { netProfitMargin: ratiosData.profitability.netProfitMargin }
      });
    }

    // Liquidity insights
    if (ratiosData.liquidity.currentRatio < 1.5) {
      insights.push({
        type: 'RISK',
        category: 'LIQUIDITY',
        title: 'Low Current Ratio',
        description: `Current ratio of ${ratiosData.liquidity.currentRatio.toFixed(2)} indicates potential liquidity issues. The company may struggle to meet short-term obligations.`,
        confidenceScore: 0.9,
        impactLevel: 'CRITICAL',
        actionableRecommendations: [
          'Improve cash collection processes',
          'Negotiate better payment terms with suppliers',
          'Consider short-term financing options'
        ],
        supportingData: { currentRatio: ratiosData.liquidity.currentRatio }
      });
    }

    // Leverage insights
    if (ratiosData.leverage.debtToEquity > 2) {
      insights.push({
        type: 'RISK',
        category: 'EFFICIENCY',
        title: 'High Financial Leverage',
        description: `Debt-to-equity ratio of ${ratiosData.leverage.debtToEquity.toFixed(2)} indicates high financial leverage. Consider debt reduction strategies.`,
        confidenceScore: 0.7,
        impactLevel: 'MEDIUM',
        actionableRecommendations: [
          'Develop debt reduction plan',
          'Improve profitability to increase equity',
          'Consider equity financing for future needs'
        ],
        supportingData: { debtToEquity: ratiosData.leverage.debtToEquity }
      });
    }

    return insights;
  }

  private generateTrendInsights(trendData: TrendAnalysis[]): AIInsight[] {
    const insights: AIInsight[] = [];

    for (const trend of trendData) {
      if (trend.metricName === 'revenue' && trend.trendDirection === 'DECREASING') {
        insights.push({
          type: 'TREND',
          category: 'GROWTH',
          title: 'Declining Revenue Trend',
          description: `Revenue has shown a decreasing trend with ${trend.growthRate.toFixed(2)}% average decline per period.`,
          confidenceScore: 0.8,
          impactLevel: 'HIGH',
          actionableRecommendations: [
            'Investigate market conditions',
            'Review sales strategy',
            'Consider product/service diversification'
          ],
          supportingData: { trend }
        });
      }
    }

    return insights;
  }

  private generateComparisonInsights(comparisonData: ForecastVsActualComparison[]): AIInsight[] {
    const insights: AIInsight[] = [];

    const avgAccuracy = comparisonData.reduce((sum, comp) => sum + comp.accuracy.forecastAccuracyScore, 0) / comparisonData.length;

    if (avgAccuracy < 0.8) {
      insights.push({
        type: 'PERFORMANCE',
        category: 'EFFICIENCY',
        title: 'Low Forecast Accuracy',
        description: `Average forecast accuracy of ${(avgAccuracy * 100).toFixed(2)}% is below target. Review forecasting assumptions and models.`,
        confidenceScore: 0.9,
        impactLevel: 'MEDIUM',
        actionableRecommendations: [
          'Review and update forecasting assumptions',
          'Consider more sophisticated forecasting models',
          'Increase frequency of forecast updates'
        ],
        supportingData: { averageAccuracy: avgAccuracy }
      });
    }

    return insights;
  }

  async getAnalysisResults(
    businessAccountId: string,
    filters: {
      analysisType?: string;
      periodType?: string;
      fiscalYear?: number;
      fiscalQuarter?: number;
      fiscalMonth?: number;
    } = {}
  ): Promise<FinancialAnalysisResult[]> {
    try {
      const where: any = { businessAccountId };

      if (filters.analysisType) where.analysisType = filters.analysisType;
      if (filters.periodType) where.analysisPeriodType = filters.periodType;
      if (filters.fiscalYear) where.fiscalYear = filters.fiscalYear;
      if (filters.fiscalQuarter) where.fiscalQuarter = filters.fiscalQuarter;
      if (filters.fiscalMonth) where.fiscalMonth = filters.fiscalMonth;

      const results = await this.prisma.financialAnalysisResults.findMany({
        where,
        include: {
          aiInsights: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return results.map(result => this.mapToFinancialAnalysisResult(result));
    } catch (error) {
      logger.error('Failed to get analysis results:', error);
      throw error;
    }
  }

  async deleteAnalysisResult(businessAccountId: string, analysisResultId: string): Promise<void> {
    try {
      await this.prisma.financialAnalysisResults.delete({
        where: {
          id: analysisResultId,
          businessAccountId
        }
      });
    } catch (error) {
      logger.error('Failed to delete analysis result:', error);
      throw error;
    }
  }

  async refreshAnalysisViews(): Promise<void> {
    try {
      await this.prisma.$executeRaw`SELECT refresh_financial_analysis_views()`;
    } catch (error) {
      logger.error('Failed to refresh analysis views:', error);
      throw error;
    }
  }

  private mapToFinancialAnalysisResult(result: any): FinancialAnalysisResult {
    return {
      id: result.id,
      businessAccountId: result.businessAccountId,
      analysisType: result.analysisType,
      periodType: result.analysisPeriodType,
      fiscalYear: result.fiscalYear,
      fiscalQuarter: result.fiscalQuarter,
      fiscalMonth: result.fiscalMonth,
      dataSource: result.dataSource,
      scenarioId: result.scenarioId,
      commonSizeStatements: (result.commonSizeIncomeStatement && result.commonSizeBalanceSheet) ? {
        incomeStatement: result.commonSizeIncomeStatement,
        balanceSheet: result.commonSizeBalanceSheet
      } : undefined,
      financialRatios: (result.profitabilityRatios || result.liquidityRatios || result.assetTurnoverRatios || result.leverageRatios) ? {
        profitability: result.profitabilityRatios,
        liquidity: result.liquidityRatios,
        assetTurnover: result.assetTurnoverRatios,
        leverage: result.leverageRatios
      } : undefined,
      trendAnalysis: result.trendData,
      forecastVsActual: result.forecastVsActual,
      aiInsights: result.aiInsights,
      analysisDate: result.analysisDate,
      createdAt: result.createdAt
    } as FinancialAnalysisResult;
  }
}
