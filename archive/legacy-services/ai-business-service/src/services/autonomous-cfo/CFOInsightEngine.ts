import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const CFOInsightSchema = z.object({
  businessAccountId: z.string().uuid(),
  insightType: z.enum(['opportunity', 'risk', 'efficiency', 'strategic', 'operational']),
  insightCategory: z.enum(['cost_optimization', 'revenue_growth', 'cash_management', 'investment', 'risk_mitigation']),
  insightTitle: z.string().min(1),
  insightDescription: z.string().min(1),
  impactLevel: z.enum(['low', 'medium', 'high', 'critical']),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'urgent']),
  confidenceScore: z.number().min(0).max(1).default(1),
  financialImpact: z.number().optional(),
  timeHorizon: z.string().optional(),
  recommendedActions: z.array(z.any()).default([]),
  supportingData: z.record(z.any()).default({}),
  relatedKpis: z.array(z.any()).default([])
});

const KPIAnalysisSchema = z.object({
  businessAccountId: z.string().uuid(),
  kpiCategory: z.enum(['profitability', 'liquidity', 'efficiency', 'solvency', 'growth', 'market']),
  kpiName: z.string().min(1),
  kpiValue: z.number(),
  kpiUnit: z.string().optional(),
  benchmarkValue: z.number().optional(),
  benchmarkSource: z.string().optional(),
  trendDirection: z.enum(['improving', 'declining', 'stable', 'volatile']).optional(),
  trendStrength: z.number().min(0).max(1).optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  confidenceScore: z.number().min(0).max(1).default(1),
  analysisDetails: z.record(z.any()).default({})
});

export interface CFOInsight {
  id: string;
  businessAccountId: string;
  insightDate: Date;
  insightType: string;
  insightCategory: string;
  insightTitle: string;
  insightDescription: string;
  impactLevel: string;
  urgencyLevel: string;
  confidenceScore: number;
  financialImpact?: number;
  timeHorizon?: string;
  recommendedActions: any[];
  supportingData: any;
  relatedKpis: any[];
  status: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  implementedBy?: string;
  implementedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface KPIAnalysis {
  id: string;
  businessAccountId: string;
  analysisDate: Date;
  kpiCategory: string;
  kpiName: string;
  kpiValue: number;
  kpiUnit?: string;
  benchmarkValue?: number;
  benchmarkSource?: string;
  varianceFromBenchmark: number;
  variancePercentage: number;
  trendDirection?: string;
  trendStrength?: number;
  historicalComparison: any;
  industryComparison: any;
  riskLevel: string;
  confidenceScore: number;
  analysisDetails: any;
  createdAt: Date;
  updatedAt: Date;
}

export class CFOInsightEngine {
  // Insight Generation Methods
  async generateInsight(data: z.infer<typeof CFOInsightSchema>): Promise<CFOInsight> {
    const validated = CFOInsightSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT generate_cfo_insight(
        ${validated.businessAccountId}::uuid,
        ${validated.insightType}::varchar,
        ${validated.insightCategory}::varchar,
        ${validated.insightTitle}::varchar,
        ${validated.insightDescription}::text,
        ${validated.impactLevel}::varchar,
        ${validated.urgencyLevel}::varchar,
        ${validated.financialImpact || null}::decimal,
        ${JSON.stringify(validated.recommendedActions)}::jsonb,
        ${JSON.stringify(validated.supportingData)}::jsonb,
        ${uuidv4()}::uuid
      ) as insight_id
    `;
    
    const insightId = (result as any)[0]?.insight_id;
    return this.getInsight(insightId);
  }

  async getInsight(insightId: string): Promise<CFOInsight> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        insight_date as "insightDate",
        insight_type as "insightType",
        insight_category as "insightCategory",
        insight_title as "insightTitle",
        insight_description as "insightDescription",
        impact_level as "impactLevel",
        urgency_level as "urgencyLevel",
        confidence_score as "confidenceScore",
        financial_impact as "financialImpact",
        time_horizon as "timeHorizon",
        recommended_actions as "recommendedActions",
        supporting_data as "supportingData",
        related_kpis as "relatedKpis",
        status,
        reviewed_by as "reviewedBy",
        reviewed_at as "reviewedAt",
        implemented_by as "implementedBy",
        implemented_at as "implementedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM cfo_ai_insights
      WHERE id = ${insightId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getInsights(businessAccountId: string, filters: {
    insightType?: string;
    insightCategory?: string;
    impactLevel?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<CFOInsight[]> {
    const { insightType, insightCategory, impactLevel, status, startDate, endDate, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        insight_date as "insightDate",
        insight_type as "insightType",
        insight_category as "insightCategory",
        insight_title as "insightTitle",
        insight_description as "insightDescription",
        impact_level as "impactLevel",
        urgency_level as "urgencyLevel",
        confidence_score as "confidenceScore",
        financial_impact as "financialImpact",
        time_horizon as "timeHorizon",
        recommended_actions as "recommendedActions",
        supporting_data as "supportingData",
        related_kpis as "relatedKpis",
        status,
        reviewed_by as "reviewedBy",
        reviewed_at as "reviewedAt",
        implemented_by as "implementedBy",
        implemented_at as "implementedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM cfo_ai_insights
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (insightType) {
      query += ` AND insight_type = '${insightType}'`;
    }
    
    if (insightCategory) {
      query += ` AND insight_category = '${insightCategory}'`;
    }
    
    if (impactLevel) {
      query += ` AND impact_level = '${impactLevel}'`;
    }
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    if (startDate) {
      query += ` AND insight_date >= '${startDate}'::date`;
    }
    
    if (endDate) {
      query += ` AND insight_date <= '${endDate}'::date`;
    }
    
    query += ` ORDER BY insight_date DESC, impact_level DESC, urgency_level DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as CFOInsight[];
  }

  // KPI Analysis Methods
  async analyzeKPI(data: z.infer<typeof KPIAnalysisSchema>): Promise<KPIAnalysis> {
    const validated = KPIAnalysisSchema.parse(data);
    
    const analysisId = uuidv4();
    
    // Calculate variance from benchmark
    const varianceFromBenchmark = validated.benchmarkValue ? 
      validated.kpiValue - validated.benchmarkValue : 0;
    const variancePercentage = validated.benchmarkValue ? 
      ((validated.kpiValue - validated.benchmarkValue) / validated.benchmarkValue) * 100 : 0;
    
    await prisma.$queryRaw`
      INSERT INTO cfo_kpi_analyses (
        id,
        business_account_id,
        analysis_date,
        kpi_category,
        kpi_name,
        kpi_value,
        kpi_unit,
        benchmark_value,
        benchmark_source,
        variance_from_benchmark,
        variance_percentage,
        trend_direction,
        trend_strength,
        risk_level,
        confidence_score,
        analysis_details,
        created_at
      ) VALUES (
        ${analysisId}::uuid,
        ${validated.businessAccountId}::uuid,
        CURRENT_DATE,
        ${validated.kpiCategory}::varchar,
        ${validated.kpiName}::varchar,
        ${validated.kpiValue}::decimal,
        ${validated.kpiUnit || null}::varchar,
        ${validated.benchmarkValue || null}::decimal,
        ${validated.benchmarkSource || null}::varchar,
        ${varianceFromBenchmark}::decimal,
        ${variancePercentage}::decimal,
        ${validated.trendDirection || null}::varchar,
        ${validated.trendStrength || null}::decimal,
        ${validated.riskLevel}::varchar,
        ${validated.confidenceScore}::decimal,
        ${JSON.stringify(validated.analysisDetails)}::jsonb,
        CURRENT_TIMESTAMP
      )
    `;
    
    return this.getKPIAnalysis(analysisId);
  }

  async getKPIAnalysis(analysisId: string): Promise<KPIAnalysis> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        analysis_date as "analysisDate",
        kpi_category as "kpiCategory",
        kpi_name as "kpiName",
        kpi_value as "kpiValue",
        kpi_unit as "kpiUnit",
        benchmark_value as "benchmarkValue",
        benchmark_source as "benchmarkSource",
        variance_from_benchmark as "varianceFromBenchmark",
        variance_percentage as "variancePercentage",
        trend_direction as "trendDirection",
        trend_strength as "trendStrength",
        historical_comparison as "historicalComparison",
        industry_comparison as "industryComparison",
        risk_level as "riskLevel",
        confidence_score as "confidenceScore",
        analysis_details as "analysisDetails",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM cfo_kpi_analyses
      WHERE id = ${analysisId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getKPIAnalyses(businessAccountId: string, filters: {
    kpiCategory?: string;
    riskLevel?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<KPIAnalysis[]> {
    const { kpiCategory, riskLevel, startDate, endDate, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        analysis_date as "analysisDate",
        kpi_category as "kpiCategory",
        kpi_name as "kpiName",
        kpi_value as "kpiValue",
        kpi_unit as "kpiUnit",
        benchmark_value as "benchmarkValue",
        benchmark_source as "benchmarkSource",
        variance_from_benchmark as "varianceFromBenchmark",
        variance_percentage as "variancePercentage",
        trend_direction as "trendDirection",
        trend_strength as "trendStrength",
        historical_comparison as "historicalComparison",
        industry_comparison as "industryComparison",
        risk_level as "riskLevel",
        confidence_score as "confidenceScore",
        analysis_details as "analysisDetails",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM cfo_kpi_analyses
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (kpiCategory) {
      query += ` AND kpi_category = '${kpiCategory}'`;
    }
    
    if (riskLevel) {
      query += ` AND risk_level = '${riskLevel}'`;
    }
    
    if (startDate) {
      query += ` AND analysis_date >= '${startDate}'::date`;
    }
    
    if (endDate) {
      query += ` AND analysis_date <= '${endDate}'::date`;
    }
    
    query += ` ORDER BY analysis_date DESC, risk_level DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as KPIAnalysis[];
  }

  // Automated Insight Generation
  async generateAutomatedInsights(businessAccountId: string): Promise<CFOInsight[]> {
    const insights: CFOInsight[] = [];
    
    // Get latest financial aggregations
    const financialData = await this.getLatestFinancialData(businessAccountId);
    
    if (!financialData) {
      return insights;
    }
    
    // Generate revenue insights
    const revenueInsights = await this.analyzeRevenuePerformance(businessAccountId, financialData);
    insights.push(...revenueInsights);
    
    // Generate cost optimization insights
    const costInsights = await this.analyzeCostStructure(businessAccountId, financialData);
    insights.push(...costInsights);
    
    // Generate cash flow insights
    const cashFlowInsights = await this.analyzeCashFlow(businessAccountId, financialData);
    insights.push(...cashFlowInsights);
    
    // Generate profitability insights
    const profitabilityInsights = await this.analyzeProfitability(businessAccountId, financialData);
    insights.push(...profitabilityInsights);
    
    // Generate risk insights
    const riskInsights = await this.analyzeRiskFactors(businessAccountId, financialData);
    insights.push(...riskInsights);
    
    return insights;
  }

  private async getLatestFinancialData(businessAccountId: string): Promise<any> {
    const result = await prisma.$queryRaw`
      SELECT 
        total_revenue as totalRevenue,
        total_expenses as totalExpenses,
        net_income as netIncome,
        total_assets as totalAssets,
        total_liabilities as totalLiabilities,
        equity,
        cash_flow as cashFlow,
        profit_margin as profitMargin,
        roa,
        roe,
        current_ratio as currentRatio,
        debt_to_equity as debtToEquity,
        working_capital as workingCapital,
        ebitda
      FROM cfo_financial_aggregations
      WHERE business_account_id = ${businessAccountId}::uuid
        AND aggregation_period = 'monthly'
        AND data_source = 'financial_statements'
      ORDER BY aggregation_date DESC
      LIMIT 1
    `;
    
    return (result as any)[0];
  }

  private async analyzeRevenuePerformance(businessAccountId: string, financialData: any): Promise<CFOInsight[]> {
    const insights: CFOInsight[] = [];
    
    // Revenue growth analysis
    if (financialData.totalRevenue > 0) {
      const previousMonthData = await this.getPreviousMonthData(businessAccountId);
      
      if (previousMonthData && previousMonthData.totalRevenue > 0) {
        const growthRate = ((financialData.totalRevenue - previousMonthData.totalRevenue) / previousMonthData.totalRevenue) * 100;
        
        if (growthRate > 10) {
          insights.push(await this.generateInsight({
            businessAccountId,
            insightType: 'opportunity',
            insightCategory: 'revenue_growth',
            insightTitle: 'Strong Revenue Growth Detected',
            insightDescription: `Revenue has grown by ${growthRate.toFixed(1)}% compared to previous month. This represents a significant positive trend that should be leveraged for further growth opportunities.`,
            impactLevel: growthRate > 20 ? 'high' : 'medium',
            urgencyLevel: 'medium',
            confidenceScore: 0.85,
            financialImpact: financialData.totalRevenue - previousMonthData.totalRevenue,
            timeHorizon: 'short_term',
            recommendedActions: [
              'Analyze revenue drivers to understand growth sources',
              'Consider scaling successful initiatives',
              'Review pricing strategy for optimization opportunities'
            ],
            supportingData: {
              currentRevenue: financialData.totalRevenue,
              previousRevenue: previousMonthData.totalRevenue,
              growthRate: growthRate
            }
          }));
        } else if (growthRate < -5) {
          insights.push(await this.generateInsight({
            businessAccountId,
            insightType: 'risk',
            insightCategory: 'revenue_growth',
            insightTitle: 'Revenue Decline Alert',
            insightDescription: `Revenue has declined by ${Math.abs(growthRate).toFixed(1)}% compared to previous month. Immediate attention required to identify and address the root cause.`,
            impactLevel: growthRate < -15 ? 'critical' : 'high',
            urgencyLevel: 'high',
            confidenceScore: 0.9,
            financialImpact: financialData.totalRevenue - previousMonthData.totalRevenue,
            timeHorizon: 'short_term',
            recommendedActions: [
              'Conduct immediate revenue analysis to identify decline sources',
              'Review customer retention and acquisition metrics',
              'Assess market conditions and competitive pressures'
            ],
            supportingData: {
              currentRevenue: financialData.totalRevenue,
              previousRevenue: previousMonthData.totalRevenue,
              declineRate: growthRate
            }
          }));
        }
      }
    }
    
    return insights;
  }

  private async analyzeCostStructure(businessAccountId: string, financialData: any): Promise<CFOInsight[]> {
    const insights: CFOInsight[] = [];
    
    // Expense ratio analysis
    if (financialData.totalRevenue > 0 && financialData.totalExpenses > 0) {
      const expenseRatio = (financialData.totalExpenses / financialData.totalRevenue) * 100;
      
      if (expenseRatio > 80) {
        insights.push(await this.generateInsight({
          businessAccountId,
          insightType: 'efficiency',
          insightCategory: 'cost_optimization',
          insightTitle: 'High Expense Ratio Detected',
          insightDescription: `Expense ratio is ${expenseRatio.toFixed(1)}%, which is above optimal levels. Significant cost optimization opportunities may exist.`,
          impactLevel: expenseRatio > 90 ? 'critical' : 'high',
          urgencyLevel: 'medium',
          confidenceScore: 0.8,
          financialImpact: financialData.totalExpenses * (expenseRatio - 70) / 100,
          timeHorizon: 'medium_term',
          recommendedActions: [
            'Conduct comprehensive expense review',
            'Identify non-essential costs for reduction',
            'Implement cost control measures',
            'Review vendor contracts for optimization'
          ],
          supportingData: {
            expenseRatio: expenseRatio,
            totalExpenses: financialData.totalExpenses,
            totalRevenue: financialData.totalRevenue
          }
        }));
      }
    }
    
    return insights;
  }

  private async analyzeCashFlow(businessAccountId: string, financialData: any): Promise<CFOInsight[]> {
    const insights: CFOInsight[] = [];
    
    // Cash flow analysis
    if (financialData.cashFlow < 0) {
      insights.push(await this.generateInsight({
        businessAccountId,
        insightType: 'risk',
        insightCategory: 'cash_management',
        insightTitle: 'Negative Cash Flow Alert',
        insightDescription: `Current cash flow is negative at ${Math.abs(financialData.cashFlow).toFixed(2)}. This requires immediate attention to ensure liquidity.`,
        impactLevel: 'critical',
        urgencyLevel: 'urgent',
        confidenceScore: 0.95,
        financialImpact: financialData.cashFlow,
        timeHorizon: 'short_term',
        recommendedActions: [
          'Review accounts receivable collection processes',
          'Evaluate payment terms with suppliers',
          'Consider short-term financing options',
          'Implement cash flow improvement measures'
        ],
        supportingData: {
          cashFlow: financialData.cashFlow,
          workingCapital: financialData.workingCapital,
          currentRatio: financialData.currentRatio
        }
      }));
    }
    
    // Working capital analysis
    if (financialData.workingCapital < 0) {
      insights.push(await this.generateInsight({
        businessAccountId,
        insightType: 'risk',
        insightCategory: 'cash_management',
        insightTitle: 'Negative Working Capital',
        insightDescription: `Working capital is negative, indicating potential liquidity issues. Immediate action required to improve cash management.`,
        impactLevel: 'high',
        urgencyLevel: 'high',
        confidenceScore: 0.9,
        financialImpact: financialData.workingCapital,
        timeHorizon: 'short_term',
        recommendedActions: [
          'Accelerate accounts receivable collection',
          'Negotiate extended payment terms with suppliers',
          'Review inventory levels for optimization',
          'Consider working capital financing'
        ],
        supportingData: {
          workingCapital: financialData.workingCapital,
          currentRatio: financialData.currentRatio,
          totalAssets: financialData.totalAssets,
          totalLiabilities: financialData.totalLiabilities
        }
      }));
    }
    
    return insights;
  }

  private async analyzeProfitability(businessAccountId: string, financialData: any): Promise<CFOInsight[]> {
    const insights: CFOInsight[] = [];
    
    // Profit margin analysis
    if (financialData.profitMargin < 5) {
      insights.push(await this.generateInsight({
        businessAccountId,
        insightType: 'efficiency',
        insightCategory: 'cost_optimization',
        insightTitle: 'Low Profit Margin Alert',
        insightDescription: `Profit margin is ${financialData.profitMargin.toFixed(1)}%, which is below optimal levels. Review pricing strategy and cost structure.`,
        impactLevel: financialData.profitMargin < 2 ? 'critical' : 'high',
        urgencyLevel: 'medium',
        confidenceScore: 0.85,
        financialImpact: financialData.totalRevenue * (10 - financialData.profitMargin) / 100,
        timeHorizon: 'medium_term',
        recommendedActions: [
          'Review pricing strategy and competitive positioning',
          'Analyze cost structure for optimization opportunities',
          'Focus on high-margin products/services',
          'Improve operational efficiency'
        ],
        supportingData: {
          profitMargin: financialData.profitMargin,
          totalRevenue: financialData.totalRevenue,
          netIncome: financialData.netIncome
        }
      }));
    }
    
    // ROE analysis
    if (financialData.roe < 10) {
      insights.push(await this.generateInsight({
        businessAccountId,
        insightType: 'strategic',
        insightCategory: 'investment',
        insightTitle: 'Low Return on Equity',
        insightDescription: `Return on equity is ${financialData.roe.toFixed(1)}%, which may be below investor expectations. Consider strategic initiatives to improve profitability.`,
        impactLevel: 'medium',
        urgencyLevel: 'low',
        confidenceScore: 0.75,
        financialImpact: financialData.equity * (15 - financialData.roe) / 100,
        timeHorizon: 'long_term',
        recommendedActions: [
          'Evaluate capital structure optimization',
          'Focus on high-return investment opportunities',
          'Improve operational efficiency',
          'Consider strategic acquisitions or divestments'
        ],
        supportingData: {
          roe: financialData.roe,
          equity: financialData.equity,
          netIncome: financialData.netIncome
        }
      }));
    }
    
    return insights;
  }

  private async analyzeRiskFactors(businessAccountId: string, financialData: any): Promise<CFOInsight[]> {
    const insights: CFOInsight[] = [];
    
    // Debt to equity analysis
    if (financialData.debtToEquity > 2) {
      insights.push(await this.generateInsight({
        businessAccountId,
        insightType: 'risk',
        insightCategory: 'risk_mitigation',
        insightTitle: 'High Debt to Equity Ratio',
        insightDescription: `Debt to equity ratio is ${financialData.debtToEquity.toFixed(2)}, indicating high financial leverage. Consider debt reduction strategies.`,
        impactLevel: financialData.debtToEquity > 3 ? 'critical' : 'high',
        urgencyLevel: 'medium',
        confidenceScore: 0.9,
        financialImpact: financialData.totalLiabilities * 0.1,
        timeHorizon: 'medium_term',
        recommendedActions: [
          'Develop debt reduction strategy',
          'Consider equity financing options',
          'Review capital structure optimization',
          'Improve profitability to strengthen equity base'
        ],
        supportingData: {
          debtToEquity: financialData.debtToEquity,
          totalLiabilities: financialData.totalLiabilities,
          equity: financialData.equity
        }
      }));
    }
    
    // Current ratio analysis
    if (financialData.currentRatio < 1) {
      insights.push(await this.generateInsight({
        businessAccountId,
        insightType: 'risk',
        insightCategory: 'risk_mitigation',
        insightTitle: 'Low Liquidity Ratio',
        insightDescription: `Current ratio is ${financialData.currentRatio.toFixed(2)}, indicating potential short-term liquidity issues.`,
        impactLevel: financialData.currentRatio < 0.8 ? 'critical' : 'high',
        urgencyLevel: 'high',
        confidenceScore: 0.85,
        financialImpact: financialData.totalLiabilities * (1 - financialData.currentRatio),
        timeHorizon: 'short_term',
        recommendedActions: [
          'Improve accounts receivable collection',
          'Negotiate extended payment terms',
          'Consider short-term financing',
          'Optimize inventory management'
        ],
        supportingData: {
          currentRatio: financialData.currentRatio,
          totalAssets: financialData.totalAssets,
          totalLiabilities: financialData.totalLiabilities
        }
      }));
    }
    
    return insights;
  }

  private async getPreviousMonthData(businessAccountId: string): Promise<any> {
    const result = await prisma.$queryRaw`
      SELECT 
        total_revenue as totalRevenue,
        total_expenses as totalExpenses,
        net_income as netIncome,
        total_assets as totalAssets,
        total_liabilities as totalLiabilities,
        equity,
        cash_flow as cashFlow,
        profit_margin as profitMargin,
        roa,
        roe,
        current_ratio as currentRatio,
        debt_to_equity as debtToEquity,
        working_capital as workingCapital,
        ebitda
      FROM cfo_financial_aggregations
      WHERE business_account_id = ${businessAccountId}::uuid
        AND aggregation_period = 'monthly'
        AND data_source = 'financial_statements'
        AND aggregation_date = (
          SELECT aggregation_date - INTERVAL '1 month'
          FROM cfo_financial_aggregations
          WHERE business_account_id = ${businessAccountId}::uuid
            AND aggregation_period = 'monthly'
            AND data_source = 'financial_statements'
          ORDER BY aggregation_date DESC
          LIMIT 1
        )
      LIMIT 1
    `;
    
    return (result as any)[0];
  }

  // Analytics and Dashboard Methods
  async getInsightAnalytics(businessAccountId: string, language: 'en' | 'ar' = 'en'): Promise<any> {
    const result = await prisma.$queryRaw`
      SELECT * FROM cfo_insight_impact_analysis
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    const analytics = result as any[];
    
    return {
      analytics: language === 'ar' ? {
        title: 'تحليل رؤى CFO',
        totalInsights: analytics.reduce((sum, a) => sum + parseInt(a.insight_count), 0),
        avgConfidence: analytics.length > 0 ? 
          analytics.reduce((sum, a) => sum + parseFloat(a.avg_confidence), 0) / analytics.length : 0,
        totalFinancialImpact: analytics.reduce((sum, a) => sum + parseFloat(a.total_financial_impact || 0), 0),
        implementationRate: analytics.length > 0 ? 
          analytics.reduce((sum, a) => sum + parseFloat(a.implementation_rate_pct), 0) / analytics.length : 0,
        avgDaysToImplement: analytics.length > 0 ? 
          analytics.reduce((sum, a) => sum + parseFloat(a.avg_days_to_implement || 0), 0) / analytics.length : 0,
        generatedAt: new Date().toISOString()
      } : {
        title: 'CFO Insight Analytics',
        totalInsights: analytics.reduce((sum, a) => sum + parseInt(a.insight_count), 0),
        avgConfidence: analytics.length > 0 ? 
          analytics.reduce((sum, a) => sum + parseFloat(a.avg_confidence), 0) / analytics.length : 0,
        totalFinancialImpact: analytics.reduce((sum, a) => sum + parseFloat(a.total_financial_impact || 0), 0),
        implementationRate: analytics.length > 0 ? 
          analytics.reduce((sum, a) => sum + parseFloat(a.implementation_rate_pct), 0) / analytics.length : 0,
        avgDaysToImplement: analytics.length > 0 ? 
          analytics.reduce((sum, a) => sum + parseFloat(a.avg_days_to_implement || 0), 0) / analytics.length : 0,
        generatedAt: new Date().toISOString()
      },
      breakdown: analytics,
      recommendations: this.generateInsightRecommendations(analytics, language)
    };
  }

  private generateInsightRecommendations(analytics: any[], language: 'en' | 'ar'): string[] {
    const recommendations = [];
    
    const totalInsights = analytics.reduce((sum, a) => sum + parseInt(a.insight_count), 0);
    const avgImplementationRate = analytics.length > 0 ? 
      analytics.reduce((sum, a) => sum + parseFloat(a.implementation_rate_pct), 0) / analytics.length : 0;
    
    if (totalInsights > 50) {
      recommendations.push(language === 'ar' ? 
        'عدد كبير من الرؤى - فكر في تحسين أولويات الرؤى' : 
        'High number of insights - consider improving insight prioritization'
      );
    }
    
    if (avgImplementationRate < 50) {
      recommendations.push(language === 'ar' ? 
        'معدل تنفيذ منخفض - راجع عملية التنفيذ والعقبات' : 
        'Low implementation rate - review implementation process and barriers'
      );
    }
    
    const criticalInsights = analytics.filter(a => a.impact_level === 'critical');
    if (criticalInsights.length > 0) {
      recommendations.push(language === 'ar' ? 
        `${criticalInsights.length} رؤى حرجة تتطلب اهتمامًا فوريًا` : 
        `${criticalInsights.length} critical insights require immediate attention`
      );
    }
    
    return recommendations;
  }
}
