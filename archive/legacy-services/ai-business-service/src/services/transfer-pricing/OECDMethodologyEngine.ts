import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const CUPMethodSchema = z.object({
  comparableTransactions: z.array(z.object({
    price: z.number(),
    quantity: z.number(),
    date: z.string().date(),
    quality: z.string(),
    terms: z.record(z.any()),
    reliability: z.number().min(1).max(5)
  })),
  adjustments: z.array(z.object({
    type: z.string(),
    amount: z.number(),
    justification: z.string()
  })).default([])
});

const CostPlusMethodSchema = z.object({
  costBase: z.number(),
  costComponents: z.record(z.number()),
  markupPercentage: z.number(),
  markupRange: z.object({
    min: z.number(),
    max: z.number(),
    median: z.number()
  }),
  costAllocationMethod: z.enum(['full_cost', 'variable_cost', 'standard_cost', 'actual_cost'])
});

const TNMMMethodSchema = z.object({
  base: z.enum(['sales', 'costs', 'assets']),
  profitLevelIndicator: z.string(),
  comparableMargins: z.array(z.object({
    entity: z.string(),
    margin: z.number(),
    revenue: z.number(),
    costs: z.number(),
    assets: z.number(),
    reliability: z.number().min(1).max(5)
  })),
  adjustments: z.array(z.object({
    type: z.string(),
    impact: z.number(),
    reason: z.string()
  })).default([])
});

const ResaleMinusMethodSchema = z.object({
  resalePrice: z.number(),
  grossMarginPercentage: z.number(),
  operatingExpenses: z.number(),
  comparableMargins: z.array(z.object({
    entity: z.string(),
    grossMargin: z.number(),
    operatingMargin: z.number(),
    reliability: z.number().min(1).max(5)
  }))
});

const ProfitSplitMethodSchema = z.object({
  totalProfit: z.number(),
  contributionAnalysis: z.record(z.object({
    entity: z.string(),
    contribution: z.number(),
    functions: z.array(z.string()),
    assets: z.number(),
    risks: z.array(z.string())
  })),
  splitMethod: z.enum(['residual', 'contributory']),
  allocationFactors: z.record(z.number())
});

export interface CUPAnalysis {
  method: 'cup';
  comparablePrice: number;
  adjustedPrice: number;
  reliabilityScore: number;
  confidenceLevel: number;
  adjustments: any[];
  comparableTransactions: any[];
  conclusions: string[];
}

export interface CostPlusAnalysis {
  method: 'cost_plus';
  totalCost: number;
  markupPercentage: number;
  transferPrice: number;
  costBreakdown: any;
  markupJustification: string;
  reliabilityScore: number;
  confidenceLevel: number;
}

export interface TNMMAnalysis {
  method: 'tnmm';
  base: string;
  profitLevelIndicator: string;
  targetMargin: number;
  transferPrice: number;
  comparableMargins: any[];
  adjustments: any[];
  reliabilityScore: number;
  confidenceLevel: number;
}

export interface ResaleMinusAnalysis {
  method: 'resale_minus';
  resalePrice: number;
  grossMarginPercentage: number;
  operatingExpenses: number;
  transferPrice: number;
  comparableMargins: any[];
  reliabilityScore: number;
  confidenceLevel: number;
}

export interface ProfitSplitAnalysis {
  method: 'profit_split';
  totalProfit: number;
  allocatedProfit: number;
  contributionAnalysis: any;
  splitMethod: string;
  allocationFactors: any;
  reliabilityScore: number;
  confidenceLevel: number;
}

export interface OECDComplianceReport {
  businessAccountId: string;
  fiscalYear: number;
  methodologyAnalyses: any[];
  overallComplianceScore: number;
  riskAssessment: string;
  recommendations: string[];
  documentationRequirements: string[];
  auditReadiness: boolean;
  generatedAt: Date;
  language: string;
}

export class OECDMethodologyEngine {
  // CUP (Comparable Uncontrolled Price) Method
  async applyCUPMethod(
    transactionData: any,
    comparableData: z.infer<typeof CUPMethodSchema>,
    language: 'en' | 'ar' = 'en'
  ): Promise<CUPAnalysis> {
    const validated = CUPMethodSchema.parse(comparableData);
    
    // Calculate weighted average of comparable transactions
    const weightedPrices = validated.comparableTransactions.map(ct => ({
      price: ct.price,
      weight: ct.reliability / 5 // Normalize reliability to 0-1
    }));
    
    const totalWeight = weightedPrices.reduce((sum, wp) => sum + wp.weight, 0);
    const comparablePrice = weightedPrices.reduce((sum, wp) => sum + wp.price * wp.weight, 0) / totalWeight;
    
    // Apply adjustments
    let adjustedPrice = comparablePrice;
    const adjustments = validated.adjustments.map(adj => {
      adjustedPrice += adj.amount;
      return {
        type: adj.type,
        amount: adj.amount,
        justification: adj.justification,
        impact: adj.amount / comparablePrice * 100
      };
    });
    
    // Calculate reliability score
    const avgReliability = validated.comparableTransactions.reduce((sum, ct) => sum + ct.reliability, 0) / validated.comparableTransactions.length;
    const reliabilityScore = Math.min(100, avgReliability * 20); // Convert to 0-100 scale
    
    // Calculate confidence level based on sample size and reliability
    const confidenceLevel = this.calculateConfidenceLevel(
      validated.comparableTransactions.length,
      avgReliability
    );
    
    const conclusions = this.generateCUPConclusions(
      comparablePrice,
      adjustedPrice,
      reliabilityScore,
      language
    );
    
    return {
      method: 'cup',
      comparablePrice,
      adjustedPrice,
      reliabilityScore,
      confidenceLevel,
      adjustments,
      comparableTransactions: validated.comparableTransactions,
      conclusions
    };
  }

  // Cost Plus Method
  async applyCostPlusMethod(
    transactionData: any,
    costData: z.infer<typeof CostPlusMethodSchema>,
    language: 'en' | 'ar' = 'en'
  ): Promise<CostPlusAnalysis> {
    const validated = CostPlusMethodSchema.parse(costData);
    
    // Calculate total cost based on cost allocation method
    let totalCost = 0;
    switch (validated.costAllocationMethod) {
      case 'full_cost':
        totalCost = Object.values(validated.costComponents).reduce((sum, cost) => sum + cost, 0);
        break;
      case 'variable_cost':
        totalCost = (validated.costComponents.variable || 0) + (validated.costComponents.direct_labor || 0);
        break;
      case 'standard_cost':
        totalCost = validated.costBase;
        break;
      case 'actual_cost':
        totalCost = validated.costBase;
        break;
    }
    
    // Apply markup
    const transferPrice = totalCost * (1 + validated.markupPercentage / 100);
    
    // Validate markup against range
    const markupJustification = this.validateMarkupRange(
      validated.markupPercentage,
      validated.markupRange,
      language
    );
    
    // Calculate reliability score
    const reliabilityScore = this.calculateCostPlusReliability(
      validated.costAllocationMethod,
      validated.markupRange,
      validated.markupPercentage
    );
    
    const confidenceLevel = this.calculateConfidenceLevel(
      Object.keys(validated.costComponents).length,
      reliabilityScore / 20
    );
    
    return {
      method: 'cost_plus',
      totalCost,
      markupPercentage: validated.markupPercentage,
      transferPrice,
      costBreakdown: validated.costComponents,
      markupJustification,
      reliabilityScore,
      confidenceLevel
    };
  }

  // TNMM (Transactional Net Margin Method)
  async applyTNMMMethod(
    transactionData: any,
    tnmmData: z.infer<typeof TNMMMethodSchema>,
    language: 'en' | 'ar' = 'en'
  ): Promise<TNMMAnalysis> {
    const validated = TNMMMethodSchema.parse(tnmmData);
    
    // Calculate target margin from comparable entities
    const weightedMargins = validated.comparableMargins.map(cm => ({
      margin: cm.margin,
      weight: cm.reliability / 5
    }));
    
    const totalWeight = weightedMargins.reduce((sum, wm) => sum + wm.weight, 0);
    const targetMargin = weightedMargins.reduce((sum, wm) => sum + wm.margin * wm.weight, 0) / totalWeight;
    
    // Apply adjustments
    let adjustedMargin = targetMargin;
    const adjustments = validated.adjustments.map(adj => {
      adjustedMargin += adj.impact;
      return {
        type: adj.type,
        impact: adj.impact,
        reason: adj.reason,
        adjustedMargin
      };
    });
    
    // Calculate transfer price based on base
    let transferPrice = 0;
    switch (validated.base) {
      case 'sales':
        transferPrice = transactionData.revenue * (1 - adjustedMargin / 100);
        break;
      case 'costs':
        transferPrice = transactionData.costs * (1 + adjustedMargin / 100);
        break;
      case 'assets':
        transferPrice = transactionData.assets * (adjustedMargin / 100);
        break;
    }
    
    // Calculate reliability score
    const avgReliability = validated.comparableMargins.reduce((sum, cm) => sum + cm.reliability, 0) / validated.comparableMargins.length;
    const reliabilityScore = Math.min(100, avgReliability * 20);
    
    const confidenceLevel = this.calculateConfidenceLevel(
      validated.comparableMargins.length,
      avgReliability
    );
    
    return {
      method: 'tnmm',
      base: validated.base,
      profitLevelIndicator: validated.profitLevelIndicator,
      targetMargin: adjustedMargin,
      transferPrice,
      comparableMargins: validated.comparableMargins,
      adjustments,
      reliabilityScore,
      confidenceLevel
    };
  }

  // Resale Minus Method
  async applyResaleMinusMethod(
    transactionData: any,
    resaleData: z.infer<typeof ResaleMinusMethodSchema>,
    language: 'en' | 'ar' = 'en'
  ): Promise<ResaleMinusAnalysis> {
    const validated = ResaleMinusMethodSchema.parse(resaleData);
    
    // Calculate target gross margin from comparable entities
    const weightedMargins = validated.comparableMargins.map(cm => ({
      grossMargin: cm.grossMargin,
      weight: cm.reliability / 5
    }));
    
    const totalWeight = weightedMargins.reduce((sum, wm) => sum + wm.weight, 0);
    const targetGrossMargin = weightedMargins.reduce((sum, wm) => sum + wm.grossMargin * wm.weight, 0) / totalWeight;
    
    // Calculate transfer price
    const transferPrice = validated.resalePrice * (1 - targetGrossMargin / 100);
    
    // Calculate reliability score
    const avgReliability = validated.comparableMargins.reduce((sum, cm) => sum + cm.reliability, 0) / validated.comparableMargins.length;
    const reliabilityScore = Math.min(100, avgReliability * 20);
    
    const confidenceLevel = this.calculateConfidenceLevel(
      validated.comparableMargins.length,
      avgReliability
    );
    
    return {
      method: 'resale_minus',
      resalePrice: validated.resalePrice,
      grossMarginPercentage: targetGrossMargin,
      operatingExpenses: validated.operatingExpenses,
      transferPrice,
      comparableMargins: validated.comparableMargins,
      reliabilityScore,
      confidenceLevel
    };
  }

  // Profit Split Method
  async applyProfitSplitMethod(
    transactionData: any,
    profitData: z.infer<typeof ProfitSplitMethodSchema>,
    language: 'en' | 'ar' = 'en'
  ): Promise<ProfitSplitAnalysis> {
    const validated = ProfitSplitMethodSchema.parse(profitData);
    
    let allocatedProfit = 0;
    
    if (validated.splitMethod === 'residual') {
      // Residual method: allocate routine profit first, then split residual
      const routineProfit = validated.totalProfit * 0.3; // Assume 30% routine profit
      const residualProfit = validated.totalProfit - routineProfit;
      
      // Split residual based on contribution
      const totalContribution = Object.values(validated.contributionAnalysis).reduce(
        (sum, ca: any) => sum + ca.contribution, 0
      );
      
      allocatedProfit = routineProfit + (residualProfit * (
        validated.contributionAnalysis[Object.keys(validated.contributionAnalysis)[0]].contribution / totalContribution
      ));
    } else {
      // Contributory method: split based on allocation factors
      const totalFactors = Object.values(validated.allocationFactors).reduce((sum, factor) => sum + factor, 0);
      allocatedProfit = validated.totalProfit * (
        validated.allocationFactors[Object.keys(validated.allocationFactors)[0]] / totalFactors
      );
    }
    
    // Calculate reliability score
    const reliabilityScore = this.calculateProfitSplitReliability(
      validated.splitMethod,
      Object.keys(validated.contributionAnalysis).length,
      Object.keys(validated.allocationFactors).length
    );
    
    const confidenceLevel = this.calculateConfidenceLevel(
      Object.keys(validated.contributionAnalysis).length,
      reliabilityScore / 20
    );
    
    return {
      method: 'profit_split',
      totalProfit: validated.totalProfit,
      allocatedProfit,
      contributionAnalysis: validated.contributionAnalysis,
      splitMethod: validated.splitMethod,
      allocationFactors: validated.allocationFactors,
      reliabilityScore,
      confidenceLevel
    };
  }

  // OECD Compliance Assessment
  async assessOECDCompliance(
    businessAccountId: string,
    fiscalYear: number,
    language: 'en' | 'ar' = 'en'
  ): Promise<OECDComplianceReport> {
    // Get all transfer pricing transactions for the fiscal year
    const transactionsResult = await prisma.$queryRaw`
      SELECT 
        id,
        transaction_type as "transactionType",
        pricing_method as "pricingMethod",
        compliance_score as "complianceScore",
        risk_level as "riskLevel",
        justification,
        benchmark_data as "benchmarkData"
      FROM intercompany_transactions
      WHERE business_account_id = ${businessAccountId}::uuid
        AND EXTRACT(YEAR FROM transaction_date) = ${fiscalYear}
    `;
    
    const transactions = transactionsResult as any[];
    
    // Analyze methodology usage
    const methodologyAnalyses = this.analyzeMethodologyUsage(transactions);
    
    // Calculate overall compliance score
    const overallComplianceScore = transactions.reduce((sum, t) => sum + (t.complianceScore || 0), 0) / transactions.length;
    
    // Assess risk level
    const riskAssessment = this.assessRiskLevel(transactions, overallComplianceScore, language);
    
    // Generate recommendations
    const recommendations = this.generateOECDRecommendations(transactions, methodologyAnalyses, language);
    
    // Check documentation requirements
    const documentationRequirements = this.getDocumentationRequirements(methodologyAnalyses, language);
    
    // Assess audit readiness
    const auditReadiness = this.assessAuditReadiness(transactions, methodologyAnalyses);
    
    return {
      businessAccountId,
      fiscalYear,
      methodologyAnalyses,
      overallComplianceScore,
      riskAssessment,
      recommendations,
      documentationRequirements,
      auditReadiness,
      generatedAt: new Date(),
      language
    };
  }

  // Helper Methods
  private calculateConfidenceLevel(sampleSize: number, avgReliability: number): number {
    // Confidence level based on sample size and reliability
    let confidence = 0;
    
    if (sampleSize >= 10) confidence += 40;
    else if (sampleSize >= 5) confidence += 25;
    else if (sampleSize >= 3) confidence += 15;
    
    confidence += avgReliability * 12; // Max 60 from reliability
    
    return Math.min(100, confidence);
  }

  private generateCUPConclusions(
    comparablePrice: number,
    adjustedPrice: number,
    reliabilityScore: number,
    language: 'en' | 'ar'
  ): string[] {
    const conclusions = [];
    
    const deviation = Math.abs(adjustedPrice - comparablePrice) / comparablePrice;
    
    if (reliabilityScore > 80) {
      conclusions.push(language === 'ar' ? 
        'درجة موثوقية عالية لبيانات المقارنة' : 
        'High reliability of comparable data'
      );
    }
    
    if (deviation < 0.05) {
      conclusions.push(language === 'ar' ? 
        'انحراف ضئيل عن سعر المقارنة' : 
        'Minimal deviation from comparable price'
      );
    } else if (deviation > 0.15) {
      conclusions.push(language === 'ar' ? 
        'انحراف كبير يتطلب مبررات إضافية' : 
        'Significant deviation requires additional justification'
      );
    }
    
    return conclusions;
  }

  private validateMarkupRange(
    markupPercentage: number,
    markupRange: { min: number; max: number; median: number },
    language: 'en' | 'ar'
  ): string {
    if (markupPercentage < markupRange.min) {
      return language === 'ar' ? 
        `علامة التسعير (${markupPercentage}%) أقل من الحد الأدنى (${markupRange.min}%)` : 
        `Markup (${markupPercentage}%) is below minimum range (${markupRange.min}%)`;
    } else if (markupPercentage > markupRange.max) {
      return language === 'ar' ? 
        `علامة التسعير (${markupPercentage}%) أعلى من الحد الأقصى (${markupRange.max}%)` : 
        `Markup (${markupPercentage}%) is above maximum range (${markupRange.max}%)`;
    } else {
      return language === 'ar' ? 
        `علامة التسعير (${markupPercentage}%) ضمن النطاق المقبول` : 
        `Markup (${markupPercentage}%) is within acceptable range`;
    }
  }

  private calculateCostPlusReliability(
    costAllocationMethod: string,
    markupRange: any,
    markupPercentage: number
  ): number {
    let reliability = 60; // Base reliability
    
    // Adjust based on cost allocation method
    if (costAllocationMethod === 'standard_cost') reliability += 15;
    else if (costAllocationMethod === 'actual_cost') reliability += 10;
    else if (costAllocationMethod === 'full_cost') reliability += 5;
    
    // Adjust based on markup range validity
    if (markupPercentage >= markupRange.min && markupPercentage <= markupRange.max) {
      reliability += 15;
    } else {
      reliability -= 10;
    }
    
    return Math.min(100, Math.max(0, reliability));
  }

  private calculateProfitSplitReliability(
    splitMethod: string,
    contributionEntities: number,
    allocationFactors: number
  ): number {
    let reliability = 50; // Base reliability
    
    if (splitMethod === 'residual') reliability += 10;
    else reliability += 5; // Contributory method is slightly less reliable
    
    if (contributionEntities >= 3) reliability += 20;
    else if (contributionEntities >= 2) reliability += 10;
    
    if (allocationFactors >= 3) reliability += 15;
    else if (allocationFactors >= 2) reliability += 8;
    
    return Math.min(100, Math.max(0, reliability));
  }

  private analyzeMethodologyUsage(transactions: any[]): any[] {
    const methodCounts = transactions.reduce((counts, t) => {
      counts[t.pricingMethod] = (counts[t.pricingMethod] || 0) + 1;
      return counts;
    }, {});
    
    return Object.entries(methodCounts).map(([method, count]) => ({
      method,
      usage: count,
      percentage: (count / transactions.length) * 100,
      avgComplianceScore: transactions
        .filter(t => t.pricingMethod === method)
        .reduce((sum, t) => sum + (t.complianceScore || 0), 0) / count
    }));
  }

  private assessRiskLevel(
    transactions: any[],
    overallComplianceScore: number,
    language: 'en' | 'ar'
  ): string {
    const highRiskTransactions = transactions.filter(t => t.riskLevel === 'high' || t.riskLevel === 'critical').length;
    const riskPercentage = (highRiskTransactions / transactions.length) * 100;
    
    if (overallComplianceScore < 60 || riskPercentage > 30) {
      return language === 'ar' ? 'مرتفع' : 'high';
    } else if (overallComplianceScore < 80 || riskPercentage > 15) {
      return language === 'ar' ? 'متوسط' : 'medium';
    } else {
      return language === 'ar' ? 'منخفض' : 'low';
    }
  }

  private generateOECDRecommendations(
    transactions: any[],
    methodologyAnalyses: any[],
    language: 'en' | 'ar'
  ): string[] {
    const recommendations = [];
    
    const lowComplianceTransactions = transactions.filter(t => (t.complianceScore || 0) < 70);
    if (lowComplianceTransactions.length > 0) {
      recommendations.push(language === 'ar' ? 
        `${lowComplianceTransactions.length} معاملات تحتاج إلى تحسين الامتثال` : 
        `${lowComplianceTransactions.length} transactions need compliance improvement`
      );
    }
    
    const methodsWithLowCompliance = methodologyAnalyses.filter(m => m.avgComplianceScore < 70);
    if (methodsWithLowCompliance.length > 0) {
      recommendations.push(language === 'ar' ? 
        `مراجعة منهجيات: ${methodsWithLowCompliance.map(m => m.method).join(', ')}` : 
        `Review methodologies: ${methodsWithLowCompliance.map(m => m.method).join(', ')}`
      );
    }
    
    const missingBenchmarkData = transactions.filter(t => !t.benchmarkData || Object.keys(t.benchmarkData).length === 0).length;
    if (missingBenchmarkData > 0) {
      recommendations.push(language === 'ar' ? 
        `${missingBenchmarkData} معاملات تفتقر إلى بيانات المعايير` : 
        `${missingBenchmarkData} transactions missing benchmark data`
      );
    }
    
    return recommendations;
  }

  private getDocumentationRequirements(methodologyAnalyses: any[], language: 'en' | 'ar'): string[] {
    const requirements = [];
    
    const usedMethods = methodologyAnalyses.map(m => m.method);
    
    if (usedMethods.includes('cup')) {
      requirements.push(language === 'ar' ? 
        'توثيق بيانات المقارنة وتحليل التكافؤ' : 
        'Documentation of comparable data and arm\'s length analysis'
      );
    }
    
    if (usedMethods.includes('cost_plus')) {
      requirements.push(language === 'ar' ? 
        'تحليل تفصيلي للمكونات والتكاليف وعلامات التسعير' : 
        'Detailed cost component analysis and markup justification'
      );
    }
    
    if (usedMethods.includes('tnmm')) {
      requirements.push(language === 'ar' ? 
        'تحليل هوامش الربح ومؤشرات مستوى الربح' : 
        'Net margin analysis and profit level indicators'
      );
    }
    
    if (usedMethods.includes('profit_split')) {
      requirements.push(language === 'ar' ? 
        'تحليل المساهمة وتوزيع الأرباح' : 
        'Contribution analysis and profit allocation'
      );
    }
    
    return requirements;
  }

  private assessAuditReadiness(transactions: any[], methodologyAnalyses: any[]): boolean {
    // Check if all transactions have adequate documentation
    const documentedTransactions = transactions.filter(t => 
      t.justification && 
      t.benchmarkData && 
      Object.keys(t.benchmarkData).length > 0
    ).length;
    
    const documentationCoverage = documentedTransactions / transactions.length;
    
    // Check if methodologies have adequate compliance scores
    const methodologiesAdequate = methodologyAnalyses.every(m => m.avgComplianceScore >= 70);
    
    return documentationCoverage >= 0.9 && methodologiesAdequate;
  }
}
