import { InvestorService, InvestorSnapshot, InvestorRiskDisclosure } from './InvestorService';

export interface InvestorPackContent {
  executiveSummary: string;
  keyHighlights: {
    revenueGrowth: string;
    profitability: string;
    cashPosition: string;
    unitEconomics: string;
    marketPosition: string;
  };
  financialHighlights: {
    currentPeriodRevenue: number;
    revenueGrowthQoQ: number;
    revenueGrowthYoY: number;
    grossMarginPercentage: number;
    ebitdaMarginPercentage: number;
    netMarginPercentage: number;
    cashPosition: number;
    runwayMonths: number;
    ltvCacRatio: number;
    overallPerformanceScore: number;
    investmentGrade: string;
  };
  growthMetrics: {
    revenueTrend: string;
    profitabilityTrend: string;
    cashFlowTrend: string;
    unitEconomicsHealth: string;
    capitalEfficiency: string;
  };
  riskSummary: {
    totalRisks: number;
    criticalRisks: number;
    highRisks: number;
    topRiskCategories: string[];
    mitigationStatus: string;
  };
}

export class InvestorPackGenerator {
  private investorService: InvestorService;

  constructor() {
    this.investorService = new InvestorService();
  }

  // Generate complete investor pack content
  async generatePackContent(
    snapshotId: string,
    businessAccountId: string,
    language: 'en' | 'ar' = 'en'
  ): Promise<InvestorPackContent> {
    // Get investor snapshot
    const snapshot = await this.investorService.getInvestorSnapshotById(snapshotId);
    
    // Get risk disclosures
    const risks = await this.investorService.getRiskDisclosures(snapshotId);

    // Generate executive summary
    const executiveSummary = await this.generateExecutiveSummary(snapshot, risks, language);
    
    // Generate key highlights
    const keyHighlights = await this.generateKeyHighlights(snapshot, language);
    
    // Generate financial highlights
    const financialHighlights = this.generateFinancialHighlights(snapshot);
    
    // Generate growth metrics
    const growthMetrics = this.generateGrowthMetrics(snapshot);
    
    // Generate risk summary
    const riskSummary = await this.generateRiskSummary(risks, language);

    return {
      executiveSummary,
      keyHighlights,
      financialHighlights,
      growthMetrics,
      riskSummary
    };
  }

  // Generate executive summary (investor-focused)
  private async generateExecutiveSummary(
    snapshot: InvestorSnapshot,
    risks: InvestorRiskDisclosure[],
    language: 'en' | 'ar'
  ): Promise<string> {
    const isArabic = language === 'ar';
    
    if (isArabic) {
      return `
ملخص تنفيذي للمستثمرين

الأداء المالي: ${snapshot.currentPeriodRevenue?.toLocaleString() || 'N/A'} إيرادات مع نمو ${snapshot.revenueGrowthYoY?.toFixed(1) || 'N/A'}% سنوياً
الربحية: هامش إجمالي ${snapshot.grossMarginPercentage?.toFixed(1) || 'N/A'}% وهامش صافي ${snapshot.netMarginPercentage?.toFixed(1) || 'N/A'}%
الموقف النقدي: ${snapshot.cashPosition?.toLocaleString() || 'N/A'} مع مدة تشغيل ${snapshot.runwayMonths || 'N/A'} شهراً
اقتصاديات الوحدة: نسبة LTV/CAC ${snapshot.ltvCacRatio?.toFixed(2) || 'N/A'} مع فترة استرداد ${snapshot.paybackPeriodMonths || 'N/A'} شهراً
التقييم العام: ${snapshot.overallPerformanceScore || 'N/A'}/100 مع تصنيف استثماري ${this.getInvestmentGradeAr(snapshot.investmentGrade)}

المخاطر الرئيسية: ${risks.slice(0, 3).map(r => r.riskTitle).join(', ')}
التوصية الاستثمارية: ${this.getInvestmentRecommendationAr(snapshot, risks)}
      `.trim();
    } else {
      return `
Executive Summary for Investors

Financial Performance: $${snapshot.currentPeriodRevenue?.toLocaleString() || 'N/A'} revenue with ${snapshot.revenueGrowthYoY?.toFixed(1) || 'N/A'}% YoY growth
Profitability: ${snapshot.grossMarginPercentage?.toFixed(1) || 'N/A'}% gross margin and ${snapshot.netMarginPercentage?.toFixed(1) || 'N/A'}% net margin
Cash Position: $${snapshot.cashPosition?.toLocaleString() || 'N/A'} with ${snapshot.runwayMonths || 'N/A'} months runway
Unit Economics: ${snapshot.ltvCacRatio?.toFixed(2) || 'N/A'} LTV/CAC ratio with ${snapshot.paybackPeriodMonths || 'N/A'} month payback period
Overall Rating: ${snapshot.overallPerformanceScore || 'N/A'}/100 with ${snapshot.investmentGrade} investment grade

Key Risks: ${risks.slice(0, 3).map(r => r.riskTitle).join(', ')}
Investment Recommendation: ${this.getInvestmentRecommendationEn(snapshot, risks)}
      `.trim();
    }
  }

  // Generate key highlights
  private async generateKeyHighlights(snapshot: InvestorSnapshot, language: 'en' | 'ar'): Promise<InvestorPackContent['keyHighlights']> {
    const isArabic = language === 'ar';
    
    return {
      revenueGrowth: isArabic ? 
        `نمو الإيرادات ${snapshot.revenueGrowthYoY?.toFixed(1) || 'N/A'}% سنوياً` :
        `${snapshot.revenueGrowthYoY?.toFixed(1) || 'N/A'}% YoY revenue growth`,
      
      profitability: isArabic ? 
        `هامش صافي ${snapshot.netMarginPercentage?.toFixed(1) || 'N/A'}%` :
        `${snapshot.netMarginPercentage?.toFixed(1) || 'N/A'}% net margin`,
      
      cashPosition: isArabic ? 
        `موقف نقدي مع ${snapshot.runwayMonths || 'N/A'} شهر تشغيل` :
        `$${snapshot.cashPosition?.toLocaleString() || 'N/A'} cash with ${snapshot.runwayMonths || 'N/A'} months runway`,
      
      unitEconomics: isArabic ? 
        `نسبة LTV/CAC ${snapshot.ltvCacRatio?.toFixed(2) || 'N/A'}` :
        `${snapshot.ltvCacRatio?.toFixed(2) || 'N/A'} LTV/CAC ratio`,
      
      marketPosition: isArabic ? 
        `تصنيف استثماري ${this.getInvestmentGradeAr(snapshot.investmentGrade)}` :
        `${snapshot.investmentGrade} investment grade`
    };
  }

  // Generate financial highlights
  private generateFinancialHighlights(snapshot: InvestorSnapshot): InvestorPackContent['financialHighlights'] {
    return {
      currentPeriodRevenue: snapshot.currentPeriodRevenue || 0,
      revenueGrowthQoQ: snapshot.revenueGrowthQoQ || 0,
      revenueGrowthYoY: snapshot.revenueGrowthYoY || 0,
      grossMarginPercentage: snapshot.grossMarginPercentage || 0,
      ebitdaMarginPercentage: snapshot.ebitdaMarginPercentage || 0,
      netMarginPercentage: snapshot.netMarginPercentage || 0,
      cashPosition: snapshot.cashPosition || 0,
      runwayMonths: snapshot.runwayMonths || 0,
      ltvCacRatio: snapshot.ltvCacRatio || 0,
      overallPerformanceScore: snapshot.overallPerformanceScore || 0,
      investmentGrade: snapshot.investmentGrade || 'N/A'
    };
  }

  // Generate growth metrics
  private generateGrowthMetrics(snapshot: InvestorSnapshot): InvestorPackContent['growthMetrics'] {
    return {
      revenueTrend: snapshot.revenueGrowthTrend || 'N/A',
      profitabilityTrend: snapshot.profitabilityTrend || 'N/A',
      cashFlowTrend: snapshot.cashFlowTrend || 'N/A',
      unitEconomicsHealth: snapshot.unitEconomicsHealth || 'N/A',
      capitalEfficiency: snapshot.capitalEfficiencyRatio > 1.5 ? 'Excellent' : 
                      snapshot.capitalEfficiencyRatio > 1 ? 'Good' : 'Needs Improvement'
    };
  }

  // Generate risk summary
  private async generateRiskSummary(risks: InvestorRiskDisclosure[], language: 'en' | 'ar'): Promise<InvestorPackContent['riskSummary']> {
    const totalRisks = risks.length;
    const criticalRisks = risks.filter(r => r.riskLevel === 'critical').length;
    const highRisks = risks.filter(r => r.riskLevel === 'high').length;
    
    const topRiskCategories = risks
      .reduce((acc, risk) => {
        acc[risk.riskCategory] = (acc[risk.riskCategory] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
      .sort((a, b) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    const isArabic = language === 'ar';
    
    const mitigationStatus = isArabic ? 
      (risks.filter(r => r.mitigationStatus === 'completed').length > risks.length / 2 ? 
       'ممتاز' : 'قيد التنفيذ') :
      (risks.filter(r => r.mitigationStatus === 'completed').length > risks.length / 2 ? 
       'Excellent' : 'In Progress');

    return {
      totalRisks,
      criticalRisks,
      highRisks,
      topRiskCategories,
      mitigationStatus
    };
  }

  // Helper methods for Arabic translations
  private getInvestmentGradeAr(grade: string): string {
    const grades: Record<string, string> = {
      'A+': 'أ+',
      'A': 'أ',
      'A-': 'أ-',
      'B+': 'ب+',
      'B': 'ب',
      'B-': 'ب-',
      'C+': 'ج+',
      'C': 'ج',
      'C-': 'ج-'
    };
    return grades[grade] || grade;
  }

  private getInvestmentRecommendationAr(snapshot: InvestorSnapshot, risks: InvestorRiskDisclosure[]): string {
    const score = snapshot.overallPerformanceScore || 0;
    const criticalRisks = risks.filter(r => r.riskLevel === 'critical').length;
    
    if (score >= 80 && criticalRisks === 0) {
      return 'استثمار موصى به بشدة - نمو قوي مع مخاطر منخفضة';
    } else if (score >= 60 && criticalRisks <= 1) {
      return 'استثمار موصى به - أداء جيد مع مخاطر محدودة';
    } else if (score >= 40) {
      return 'استثمار محتمل - يحتاج مراقبة وتحليل إضافي';
    } else {
      return 'استثمار محفوف بالمخاطر - يتطلب إدارة مخاطر نشطة';
    }
  }

  private getInvestmentRecommendationEn(snapshot: InvestorSnapshot, risks: InvestorRiskDisclosure[]): string {
    const score = snapshot.overallPerformanceScore || 0;
    const criticalRisks = risks.filter(r => r.riskLevel === 'critical').length;
    
    if (score >= 80 && criticalRisks === 0) {
      return 'Strong Buy - Strong growth with low risk profile';
    } else if (score >= 60 && criticalRisks <= 1) {
      return 'Buy - Good performance with manageable risks';
    } else if (score >= 40) {
      return 'Hold - Potential investment requiring additional due diligence';
    } else {
      return 'High Risk - Requires active risk management and monitoring';
    }
  }
}
