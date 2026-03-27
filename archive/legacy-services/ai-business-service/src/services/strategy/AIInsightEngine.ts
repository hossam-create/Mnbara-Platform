import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const AIInsightSchema = z.object({
  scenarioId: z.string().uuid(),
  insightType: z.enum(['opportunity', 'risk', 'trend', 'recommendation', 'competitive', 'market', 'financial', 'operational', 'strategic', 'custom']),
  insightTitle: z.string().min(1).max(300),
  insightDescription: z.string().min(1),
  insightData: z.record(z.any()).default({}),
  confidenceScore: z.number().min(0).max(1).default(0),
  priorityLevel: z.number().int().min(1).max(10).default(5),
  actionabilityLevel: z.number().int().min(1).max(10).default(5),
  timeHorizonMonths: z.number().int().optional(),
  potentialImpact: z.number().default(0)
});

export interface AIInsight {
  id: string;
  scenarioId: string;
  insightType: string;
  insightTitle: string;
  insightDescription: string;
  insightData: any;
  confidenceScore: number;
  priorityLevel: number;
  actionabilityLevel: number;
  timeHorizonMonths?: number;
  potentialImpact: number;
  createdAt: Date;
  generatedBy: string;
}

export interface FinancialTrendAnalysis {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  trendStrength: number;
  forecast: number[];
  confidence: number;
  drivers: string[];
}

export interface MarketOpportunity {
  market: string;
  opportunityType: string;
  marketSize: number;
  growthRate: number;
  competitionLevel: 'low' | 'medium' | 'high';
  entryBarriers: string[];
  potentialRevenue: number;
  timeToMarket: number;
}

export interface RiskAssessment {
  riskType: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  riskScore: number;
  mitigationStrategies: string[];
  earlyWarningIndicators: string[];
}

export interface StrategicRecommendation {
  recommendation: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  expectedOutcome: string;
  implementationTime: number;
  requiredResources: string[];
  successMetrics: string[];
  confidenceLevel: number;
}

export class AIInsightEngine {
  // AI Insight Generation Methods
  async generateInsights(scenarioId: string, language: 'en' | 'ar' = 'en'): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Generate financial insights
    const financialInsights = await this.generateFinancialInsights(scenarioId, language);
    insights.push(...financialInsights);
    
    // Generate market insights
    const marketInsights = await this.generateMarketInsights(scenarioId, language);
    insights.push(...marketInsights);
    
    // Generate operational insights
    const operationalInsights = await this.generateOperationalInsights(scenarioId, language);
    insights.push(...operationalInsights);
    
    // Generate strategic insights
    const strategicInsights = await this.generateStrategicInsights(scenarioId, language);
    insights.push(...strategicInsights);
    
    // Generate risk insights
    const riskInsights = await this.generateRiskInsights(scenarioId, language);
    insights.push(...riskInsights);
    
    return insights;
  }

  async generateFinancialInsights(scenarioId: string, language: 'en' | 'ar'): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Analyze financial projections
    const projections = await this.getScenarioProjections(scenarioId);
    const trends = this.analyzeFinancialTrends(projections);
    
    for (const trend of trends) {
      const insight = await this.createInsight({
        scenarioId,
        insightType: 'trend',
        insightTitle: language === 'ar' ? `اتجاه ${trend.metric}` : `${trend.metric} Trend`,
        insightDescription: this.generateTrendDescription(trend, language),
        insightData: trend,
        confidenceScore: trend.confidence,
        priorityLevel: this.calculatePriorityFromTrend(trend),
        actionabilityLevel: this.calculateActionabilityFromTrend(trend),
        potentialImpact: this.calculateImpactFromTrend(trend)
      });
      
      insights.push(insight);
    }
    
    // Identify opportunities
    const opportunities = this.identifyFinancialOpportunities(projections);
    for (const opportunity of opportunities) {
      const insight = await this.createInsight({
        scenarioId,
        insightType: 'opportunity',
        insightTitle: language === 'ar' ? 'فرصة مالية' : 'Financial Opportunity',
        insightDescription: this.generateOpportunityDescription(opportunity, language),
        insightData: opportunity,
        confidenceScore: opportunity.confidence || 0.7,
        priorityLevel: opportunity.priority || 6,
        actionabilityLevel: opportunity.actionability || 7,
        potentialImpact: opportunity.impact || 0
      });
      
      insights.push(insight);
    }
    
    return insights;
  }

  async generateMarketInsights(scenarioId: string, language: 'en' | 'ar'): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Analyze market opportunities
    const opportunities = await this.identifyMarketOpportunities(scenarioId);
    for (const opportunity of opportunities) {
      const insight = await this.createInsight({
        scenarioId,
        insightType: 'opportunity',
        insightTitle: language === 'ar' ? `فرصة سوق: ${opportunity.market}` : `Market Opportunity: ${opportunity.market}`,
        insightDescription: this.generateMarketOpportunityDescription(opportunity, language),
        insightData: opportunity,
        confidenceScore: 0.8,
        priorityLevel: this.calculatePriorityFromOpportunity(opportunity),
        actionabilityLevel: 8,
        timeHorizonMonths: opportunity.timeToMarket,
        potentialImpact: opportunity.potentialRevenue
      });
      
      insights.push(insight);
    }
    
    // Analyze competitive landscape
    const competitiveInsights = await this.analyzeCompetitiveLandscape(scenarioId);
    for (const competitive of competitiveInsights) {
      const insight = await this.createInsight({
        scenarioId,
        insightType: 'competitive',
        insightTitle: language === 'ar' ? 'تحليل تنافسي' : 'Competitive Analysis',
        insightDescription: this.generateCompetitiveDescription(competitive, language),
        insightData: competitive,
        confidenceScore: competitive.confidence || 0.7,
        priorityLevel: competitive.priority || 5,
        actionabilityLevel: 6,
        potentialImpact: competitive.impact || 0
      });
      
      insights.push(insight);
    }
    
    return insights;
  }

  async generateOperationalInsights(scenarioId: string, language: 'en' | 'ar'): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Analyze operational efficiency
    const efficiencyInsights = await this.analyzeOperationalEfficiency(scenarioId);
    for (const efficiency of efficiencyInsights) {
      const insight = await this.createInsight({
        scenarioId,
        insightType: 'operational',
        insightTitle: language === 'ar' ? 'كفاءة تشغيلية' : 'Operational Efficiency',
        insightDescription: this.generateEfficiencyDescription(efficiency, language),
        insightData: efficiency,
        confidenceScore: efficiency.confidence || 0.8,
        priorityLevel: efficiency.priority || 6,
        actionabilityLevel: 8,
        potentialImpact: efficiency.impact || 0
      });
      
      insights.push(insight);
    }
    
    return insights;
  }

  async generateStrategicInsights(scenarioId: string, language: 'en' | 'ar'): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Generate strategic recommendations
    const recommendations = await this.generateStrategicRecommendations(scenarioId, language);
    for (const recommendation of recommendations) {
      const insight = await this.createInsight({
        scenarioId,
        insightType: 'recommendation',
        insightTitle: language === 'ar' ? 'توصية استراتيجية' : 'Strategic Recommendation',
        insightDescription: recommendation.recommendation,
        insightData: recommendation,
        confidenceScore: recommendation.confidenceLevel / 10,
        priorityLevel: this.getPriorityFromLevel(recommendation.priority),
        actionabilityLevel: 7,
        timeHorizonMonths: recommendation.implementationTime,
        potentialImpact: this.calculateImpactFromRecommendation(recommendation)
      });
      
      insights.push(insight);
    }
    
    return insights;
  }

  async generateRiskInsights(scenarioId: string, language: 'en' | 'ar'): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Analyze risks
    const risks = await this.assessRisks(scenarioId);
    for (const risk of risks) {
      const insight = await this.createInsight({
        scenarioId,
        insightType: 'risk',
        insightTitle: language === 'ar' ? `مخاطر: ${risk.riskType}` : `Risk: ${risk.riskType}`,
        insightDescription: this.generateRiskDescription(risk, language),
        insightData: risk,
        confidenceScore: risk.probability,
        priorityLevel: this.getPriorityFromRiskLevel(risk.riskLevel),
        actionabilityLevel: 8,
        timeHorizonMonths: 12, // Default time horizon for risks
        potentialImpact: -risk.impact // Negative impact for risks
      });
      
      insights.push(insight);
    }
    
    return insights;
  }

  // Helper Methods for Analysis
  private async getScenarioProjections(scenarioId: string): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        projection_year as "projectionYear",
        revenue,
        net_income as "netIncome",
        ebitda,
        free_cash_flow as "freeCashFlow",
        operating_income as "operatingIncome"
      FROM financial_projections
      WHERE scenario_id = ${scenarioId}::uuid
      ORDER BY projection_year ASC
    `;
    
    return result as any[];
  }

  private analyzeFinancialTrends(projections: any[]): FinancialTrendAnalysis[] {
    const trends: FinancialTrendAnalysis[] = [];
    
    if (projections.length < 2) return trends;
    
    // Analyze revenue trend
    const revenueTrend = this.calculateTrend(projections.map(p => p.revenue));
    trends.push({
      metric: 'Revenue',
      trend: revenueTrend.direction,
      trendStrength: revenueTrend.strength,
      forecast: revenueTrend.forecast,
      confidence: revenueTrend.confidence,
      drivers: ['Market Growth', 'Pricing Strategy', 'Customer Acquisition']
    });
    
    // Analyze profitability trend
    const profitabilityTrend = this.calculateTrend(projections.map(p => p.netIncome));
    trends.push({
      metric: 'Net Income',
      trend: profitabilityTrend.direction,
      trendStrength: profitabilityTrend.strength,
      forecast: profitabilityTrend.forecast,
      confidence: profitabilityTrend.confidence,
      drivers: ['Cost Management', 'Operational Efficiency', 'Revenue Growth']
    });
    
    // Analyze cash flow trend
    const cashFlowTrend = this.calculateTrend(projections.map(p => p.freeCashFlow));
    trends.push({
      metric: 'Free Cash Flow',
      trend: cashFlowTrend.direction,
      trendStrength: cashFlowTrend.strength,
      forecast: cashFlowTrend.forecast,
      confidence: cashFlowTrend.confidence,
      drivers: ['Working Capital Management', 'Capital Expenditure', 'Profitability']
    });
    
    return trends;
  }

  private calculateTrend(values: number[]): any {
    if (values.length < 2) {
      return { direction: 'stable', strength: 0, forecast: [], confidence: 0 };
    }
    
    // Simple linear regression for trend analysis
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Determine trend direction
    let direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    if (Math.abs(slope) < 0.01) {
      direction = 'stable';
    } else if (slope > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }
    
    // Calculate trend strength (R-squared)
    const yMean = sumY / n;
    const totalSumSquares = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const residualSumSquares = values.reduce((sum, y, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    
    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    const strength = Math.max(0, Math.min(1, rSquared));
    
    // Generate forecast
    const forecast = [];
    for (let i = n; i < n + 3; i++) {
      forecast.push(slope * i + intercept);
    }
    
    return {
      direction,
      strength,
      forecast,
      confidence: strength
    };
  }

  private identifyFinancialOpportunities(projections: any[]): any[] {
    const opportunities = [];
    
    if (projections.length < 2) return opportunities;
    
    // Look for improving margins
    const margins = projections.map(p => p.revenue > 0 ? (p.netIncome / p.revenue) * 100 : 0);
    const marginTrend = this.calculateTrend(margins);
    
    if (marginTrend.direction === 'increasing' && marginTrend.strength > 0.5) {
      opportunities.push({
        type: 'margin_improvement',
        description: 'Profit margins are improving consistently',
        confidence: marginTrend.confidence,
        priority: 7,
        actionability: 8,
        impact: 1000000 // Placeholder impact value
      });
    }
    
    // Look for strong cash flow
    const cashFlows = projections.map(p => p.freeCashFlow);
    const avgCashFlow = cashFlows.reduce((a, b) => a + b, 0) / cashFlows.length;
    
    if (avgCashFlow > 0) {
      opportunities.push({
        type: 'positive_cash_flow',
        description: 'Consistent positive cash flow provides investment opportunities',
        confidence: 0.8,
        priority: 6,
        actionability: 9,
        impact: avgCashFlow * 12 // Annualized impact
      });
    }
    
    return opportunities;
  }

  private async identifyMarketOpportunities(scenarioId: string): Promise<MarketOpportunity[]> {
    // This would integrate with market data APIs
    // For now, return placeholder opportunities
    return [
      {
        market: 'Digital Services',
        opportunityType: 'Market Expansion',
        marketSize: 50000000,
        growthRate: 15,
        competitionLevel: 'medium',
        entryBarriers: ['Technology Investment', 'Regulatory Compliance'],
        potentialRevenue: 5000000,
        timeToMarket: 18
      },
      {
        market: 'Enterprise Software',
        opportunityType: 'Product Line Extension',
        marketSize: 100000000,
        growthRate: 12,
        competitionLevel: 'high',
        entryBarriers: ['R&D Investment', 'Sales Infrastructure'],
        potentialRevenue: 8000000,
        timeToMarket: 24
      }
    ];
  }

  private async analyzeCompetitiveLandscape(scenarioId: string): Promise<any[]> {
    // This would integrate with competitive intelligence APIs
    return [
      {
        type: 'competitive_advantage',
        description: 'Strong market position in core segments',
        confidence: 0.8,
        priority: 5,
        impact: 2000000
      },
      {
        type: 'competitive_threat',
        description: 'New entrants with disruptive technology',
        confidence: 0.6,
        priority: 7,
        impact: -1500000
      }
    ];
  }

  private async analyzeOperationalEfficiency(scenarioId: string): Promise<any[]> {
    // This would analyze operational metrics
    return [
      {
        type: 'efficiency_improvement',
        description: 'Opportunity to optimize supply chain costs',
        confidence: 0.7,
        priority: 6,
        impact: 800000
      },
      {
        type: 'automation_opportunity',
        description: 'Automation potential in repetitive processes',
        confidence: 0.8,
        priority: 7,
        impact: 1200000
      }
    ];
  }

  private async generateStrategicRecommendations(scenarioId: string, language: 'en' | 'ar'): Promise<StrategicRecommendation[]> {
    const recommendations: StrategicRecommendation[] = [];
    
    // Growth recommendations
    recommendations.push({
      recommendation: language === 'ar' ? 
        'توسيع الحصة السوقية من خلال الاستحواذ الاستراتيجي' : 
        'Expand market share through strategic acquisitions',
      category: 'growth',
      priority: 'high',
      expectedOutcome: language === 'ar' ? 
        'زيادة الإيرادات بنسبة 25٪ خلال 3 سنوات' : 
        '25% revenue increase within 3 years',
      implementationTime: 36,
      requiredResources: ['Capital', 'M&A Team', 'Integration Expertise'],
      successMetrics: ['Revenue Growth', 'Market Share', 'Integration Success'],
      confidenceLevel: 7
    });
    
    // Efficiency recommendations
    recommendations.push({
      recommendation: language === 'ar' ? 
        'تنفيذ مبادرات التحول الرقمي' : 
        'Implement digital transformation initiatives',
      category: 'efficiency',
      priority: 'medium',
      expectedOutcome: language === 'ar' ? 
        'خفض تكاليف التشغيل بنسبة 15٪' : 
        '15% reduction in operating costs',
      implementationTime: 24,
      requiredResources: ['Technology Investment', 'Change Management', 'Training'],
      successMetrics: ['Cost Reduction', 'Process Efficiency', 'User Adoption'],
      confidenceLevel: 8
    });
    
    return recommendations;
  }

  private async assessRisks(scenarioId: string): Promise<RiskAssessment[]> {
    const risks: RiskAssessment[] = [];
    
    // Market risks
    risks.push({
      riskType: 'Market Risk',
      riskLevel: 'medium',
      probability: 0.4,
      impact: 2000000,
      riskScore: 0.8,
      mitigationStrategies: ['Market Diversification', 'Competitive Intelligence', 'Agile Strategy'],
      earlyWarningIndicators: ['Market Share Decline', 'Competitor Price Wars', 'Customer Churn Increase']
    });
    
    // Financial risks
    risks.push({
      riskType: 'Financial Risk',
      riskLevel: 'low',
      probability: 0.2,
      impact: 1500000,
      riskScore: 0.4,
      mitigationStrategies: ['Cash Reserve Management', 'Diversified Funding Sources', 'Financial Monitoring'],
      earlyWarningIndicators: ['Cash Flow Decline', 'Debt Ratio Increase', 'Profitability Decline']
    });
    
    // Operational risks
    risks.push({
      riskType: 'Operational Risk',
      riskLevel: 'medium',
      probability: 0.3,
      impact: 1000000,
      riskScore: 0.6,
      mitigationStrategies: ['Process Standardization', 'Quality Control Systems', 'Business Continuity Planning'],
      earlyWarningIndicators: ['Quality Issues', 'Delivery Delays', 'Customer Complaints Increase']
    });
    
    return risks;
  }

  // Insight Creation Helper
  private async createInsight(data: z.infer<typeof AIInsightSchema>): Promise<AIInsight> {
    const validated = AIInsightSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO ai_insights (
        id,
        scenario_id,
        insight_type,
        insight_title,
        insight_description,
        insight_data,
        confidence_score,
        priority_level,
        actionability_level,
        time_horizon_months,
        potential_impact
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.scenarioId}::uuid,
        ${validated.insightType}::varchar,
        ${validated.insightTitle}::varchar,
        ${validated.insightDescription}::text,
        ${JSON.stringify(validated.insightData)}::jsonb,
        ${validated.confidenceScore}::decimal,
        ${validated.priorityLevel}::integer,
        ${validated.actionabilityLevel}::integer,
        ${validated.timeHorizonMonths || null}::integer,
        ${validated.potentialImpact}::decimal
      ) RETURNING id
    `;
    
    const insightId = (result as any)[0]?.id;
    return this.getInsight(insightId);
  }

  async getInsight(insightId: string): Promise<AIInsight> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        scenario_id as "scenarioId",
        insight_type as "insightType",
        insight_title as "insightTitle",
        insight_description as "insightDescription",
        insight_data as "insightData",
        confidence_score as "confidenceScore",
        priority_level as "priorityLevel",
        actionability_level as "actionabilityLevel",
        time_horizon_months as "timeHorizonMonths",
        potential_impact as "potentialImpact",
        created_at as "createdAt",
        generated_by as "generatedBy"
      FROM ai_insights
      WHERE id = ${insightId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getInsights(scenarioId: string, filters: {
    insightType?: string;
    priorityLevel?: number;
    limit?: number;
  } = {}): Promise<AIInsight[]> {
    const { insightType, priorityLevel, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        scenario_id as "scenarioId",
        insight_type as "insightType",
        insight_title as "insightTitle",
        insight_description as "insightDescription",
        insight_data as "insightData",
        confidence_score as "confidenceScore",
        priority_level as "priorityLevel",
        actionability_level as "actionabilityLevel",
        time_horizon_months as "timeHorizonMonths",
        potential_impact as "potentialImpact",
        created_at as "createdAt",
        generated_by as "generatedBy"
      FROM ai_insights
      WHERE scenario_id = ${scenarioId}::uuid
    `;
    
    if (insightType) {
      query += ` AND insight_type = '${insightType}'`;
    }
    
    if (priorityLevel) {
      query += ` AND priority_level >= ${priorityLevel}`;
    }
    
    query += ` ORDER BY priority_level DESC, confidence_score DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as AIInsight[];
  }

  // Description Generation Methods
  private generateTrendDescription(trend: FinancialTrendAnalysis, language: 'en' | 'ar'): string {
    if (language === 'ar') {
      const trendAr = {
        increasing: 'متزايد',
        decreasing: 'متناقص',
        stable: 'مستقر',
        volatile: 'متقلب'
      };
      return `اتجاه ${trend.metric} ${trendAr[trend.trend]} بقوة ${(trend.trendStrength * 100).toFixed(1)}% مع ثقة ${(trend.confidence * 100).toFixed(1)}%`;
    }
    
    return `${trend.metric} is showing a ${trend.trend} trend with ${(trend.trendStrength * 100).toFixed(1)}% strength and ${(trend.confidence * 100).toFixed(1)}% confidence`;
  }

  private generateOpportunityDescription(opportunity: any, language: 'en' | 'ar'): string {
    return language === 'ar' ? opportunity.description : opportunity.description;
  }

  private generateMarketOpportunityDescription(opportunity: MarketOpportunity, language: 'en' | 'ar'): string {
    if (language === 'ar') {
      return `فرصة في سوق ${opportunity.market} بحجم سوق ${opportunity.marketSize.toLocaleString()} ومعدل نمو ${opportunity.growthRate}%`;
    }
    
    return `Opportunity in ${opportunity.market} market with market size of ${opportunity.marketSize.toLocaleString()} and ${opportunity.growthRate}% growth rate`;
  }

  private generateCompetitiveDescription(competitive: any, language: 'en' | 'ar'): string {
    return language === 'ar' ? competitive.description : competitive.description;
  }

  private generateEfficiencyDescription(efficiency: any, language: 'en' | 'ar'): string {
    return language === 'ar' ? efficiency.description : efficiency.description;
  }

  private generateRiskDescription(risk: RiskAssessment, language: 'en' | 'ar'): string {
    if (language === 'ar') {
      return `${risk.riskType} بمستوى مخاطر ${risk.riskLevel} واحتمال ${(risk.probability * 100).toFixed(1)}% وتأثير ${risk.impact.toLocaleString()}`;
    }
    
    return `${risk.riskType} with ${risk.riskLevel} risk level, ${(risk.probability * 100).toFixed(1)}% probability, and ${risk.impact.toLocaleString()} impact`;
  }

  // Priority and Impact Calculation Methods
  private calculatePriorityFromTrend(trend: FinancialTrendAnalysis): number {
    if (trend.trend === 'decreasing' && trend.strength > 0.7) return 9;
    if (trend.trend === 'increasing' && trend.strength > 0.7) return 7;
    if (trend.trend === 'volatile') return 8;
    return 5;
  }

  private calculateActionabilityFromTrend(trend: FinancialTrendAnalysis): number {
    if (trend.trend === 'decreasing') return 9;
    if (trend.trend === 'increasing') return 6;
    return 5;
  }

  private calculateImpactFromTrend(trend: FinancialTrendAnalysis): number {
    return trend.strength * 1000000; // Placeholder impact calculation
  }

  private calculatePriorityFromOpportunity(opportunity: MarketOpportunity): number {
    if (opportunity.growthRate > 20) return 9;
    if (opportunity.growthRate > 15) return 8;
    if (opportunity.growthRate > 10) return 7;
    return 6;
  }

  private getPriorityFromLevel(level: string): number {
    const priorityMap = { low: 3, medium: 6, high: 8, critical: 10 };
    return priorityMap[level as keyof typeof priorityMap] || 5;
  }

  private getPriorityFromRiskLevel(level: string): number {
    const priorityMap = { low: 4, medium: 6, high: 8, critical: 10 };
    return priorityMap[level as keyof typeof priorityMap] || 5;
  }

  private calculateImpactFromRecommendation(recommendation: StrategicRecommendation): number {
    return recommendation.confidenceLevel * 100000; // Placeholder impact calculation
  }
}
