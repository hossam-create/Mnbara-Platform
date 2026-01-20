import { ChairmanService, ChairmanStrategicSnapshot, ChairmanStrategicRisk, ChairmanStrategicOpportunity } from './ChairmanService';

export interface ChairmanBriefingContent {
  executiveSummary: string;
  keyInsights: string[];
  strategicRecommendations: string[];
  confidenceSignals: {
    overallFinancialHealth: number;
    forecastReliability: number;
    managementExecution: number;
    strategicAlignment: number;
  };
  riskSignals: {
    topRisks: Array<{
      title: string;
      level: string;
      trend: string;
      mitigation: string;
    }>;
    riskHeatmap: Record<string, number>;
  };
  opportunitySignals: {
    topOpportunities: Array<{
      title: string;
      level: string;
      readiness: string;
      confidence: string;
    }>;
    opportunityPipeline: Record<string, number>;
  };
}

export class ChairmanBriefingGenerator {
  private chairmanService: ChairmanService;

  constructor() {
    this.chairmanService = new ChairmanService();
  }

  // Generate complete chairman briefing content
  async generateBriefingContent(
    snapshotId: string,
    businessAccountId: string,
    language: 'en' | 'ar' = 'en'
  ): Promise<ChairmanBriefingContent> {
    // Get strategic snapshot
    const snapshot = await this.chairmanService.getStrategicSnapshotById(snapshotId);
    
    // Get strategic risks
    const risks = await this.chairmanService.getStrategicRisks(snapshotId);
    
    // Get strategic opportunities
    const opportunities = await this.chairmanService.getStrategicOpportunities(snapshotId);

    // Generate executive summary
    const executiveSummary = await this.generateExecutiveSummary(snapshot, risks, opportunities, language);
    
    // Generate key insights
    const keyInsights = await this.generateKeyInsights(snapshot, risks, opportunities, language);
    
    // Generate strategic recommendations
    const strategicRecommendations = await this.generateStrategicRecommendations(snapshot, risks, opportunities, language);
    
    // Generate confidence signals
    const confidenceSignals = this.generateConfidenceSignals(snapshot);
    
    // Generate risk signals
    const riskSignals = await this.generateRiskSignals(risks);
    
    // Generate opportunity signals
    const opportunitySignals = await this.generateOpportunitySignals(opportunities);

    return {
      executiveSummary,
      keyInsights,
      strategicRecommendations,
      confidenceSignals,
      riskSignals,
      opportunitySignals
    };
  }

  // Generate executive summary (very high level)
  private async generateExecutiveSummary(
    snapshot: ChairmanStrategicSnapshot,
    risks: ChairmanStrategicRisk[],
    opportunities: ChairmanStrategicOpportunity[],
    language: 'en' | 'ar'
  ): Promise<string> {
    const isArabic = language === 'ar';
    
    if (isArabic) {
      return `
ملخص تنفيذي للمجلس

الصحة المالية الإجمالية: ${snapshot.overallFinancialHealthScore}/100 (${this.getHealthStatusAr(snapshot.overallFinancialHealthScore)})
اتجاه الإيرادات: ${this.getDirectionAr(snapshot.revenueDirection)}
موقف النقدية: ${this.getCashStatusAr(snapshot.cashRunwayStatus)}
موثوقية التنبؤ: ${this.getConfidenceLevelAr(snapshot.forecastConfidenceLevel)}

المخاطر الرئيسية: ${risks.slice(0, 3).map(r => r.riskTitle).join(', ')}
الفرص الاستراتيجية: ${opportunities.slice(0, 3).map(o => o.opportunityTitle).join(', ')}

التوصية الاستراتيجية: ${this.getStrategicRecommendationAr(snapshot, risks, opportunities)}
      `.trim();
    } else {
      return `
Executive Summary for the Board

Overall Financial Health: ${snapshot.overallFinancialHealthScore}/100 (${this.getHealthStatusEn(snapshot.overallFinancialHealthScore)})
Revenue Direction: ${this.getDirectionEn(snapshot.revenueDirection)}
Cash Position: ${this.getCashStatusEn(snapshot.cashRunwayStatus)}
Forecast Reliability: ${this.getConfidenceLevelEn(snapshot.forecastConfidenceLevel)}

Top Risks: ${risks.slice(0, 3).map(r => r.riskTitle).join(', ')}
Strategic Opportunities: ${opportunities.slice(0, 3).map(o => o.opportunityTitle).join(', ')}

Strategic Recommendation: ${this.getStrategicRecommendationEn(snapshot, risks, opportunities)}
      `.trim();
    }
  }

  // Generate key insights (3-5 maximum)
  private async generateKeyInsights(
    snapshot: ChairmanStrategicSnapshot,
    risks: ChairmanStrategicRisk[],
    opportunities: ChairmanStrategicOpportunity[],
    language: 'en' | 'ar'
  ): Promise<string[]> {
    const isArabic = language === 'ar';
    const insights = [];

    // Financial health insight
    if (snapshot.overallFinancialHealthScore > 75) {
      insights.push(isArabic ? 
        'الصحة المالية القوية تدعم النمو المستدام' : 
        'Strong financial health supports sustainable growth'
      );
    } else if (snapshot.overallFinancialHealthScore < 50) {
      insights.push(isArabic ? 
        'يتطلب تحسين الصحة المالية اهتمامًا فوريًا' : 
        'Financial health requires immediate attention'
      );
    }

    // Revenue direction insight
    if (snapshot.revenueDirection === 'confirmed_growth') {
      insights.push(isArabic ? 
        'نمو الإيرادات مؤكد مع ثقة عالية' : 
        'Revenue growth confirmed with high confidence'
      );
    } else if (snapshot.revenueDirection === 'at_risk_decline') {
      insights.push(isArabic ? 
        'انخفاض الإيرادات يتطلب تدخلًا استراتيجيًا' : 
        'Revenue decline requires strategic intervention'
      );
    }

    // Cash position insight
    if (snapshot.cashRunwayStatus === 'critical') {
      insights.push(isArabic ? 
        'الموقف النقدي حرج يتطلب إجراءات فورية' : 
        'Critical cash position requires immediate action'
      );
    } else if (snapshot.cashRunwayStatus === 'excellent') {
      insights.push(isArabic ? 
        'الموقف النقدي الممتاز يوفر مرونة استراتيجية' : 
        'Excellent cash position provides strategic flexibility'
      );
    }

    // Risk concentration insight
    const criticalRisks = risks.filter(r => r.riskLevel === 'critical').length;
    if (criticalRisks > 2) {
      insights.push(isArabic ? 
        'تركز المخاطر الحرجة يتطلب إدارة نشطة' : 
        'Critical risk concentration requires active management'
      );
    }

    // Opportunity insight
    const transformationalOpportunities = opportunities.filter(o => o.opportunityLevel === 'transformational').length;
    if (transformationalOpportunities > 0) {
      insights.push(isArabic ? 
        'فرص تحويلية متاحة للنمو الاستراتيجي' : 
        'Transformational opportunities available for strategic growth'
      );
    }

    return insights.slice(0, 5); // Maximum 5 insights
  }

  // Generate strategic recommendations (2-3 maximum)
  private async generateStrategicRecommendations(
    snapshot: ChairmanStrategicSnapshot,
    risks: ChairmanStrategicRisk[],
    opportunities: ChairmanStrategicOpportunity[],
    language: 'en' | 'ar'
  ): Promise<string[]> {
    const isArabic = language === 'ar';
    const recommendations = [];

    // Financial health recommendations
    if (snapshot.overallFinancialHealthScore < 60) {
      recommendations.push(isArabic ? 
        'إطلاق خطة تحسين مالي شاملة' : 
        'Launch comprehensive financial improvement plan'
      );
    }

    // Cash position recommendations
    if (snapshot.cashRunwayStatus === 'concerning' || snapshot.cashRunwayStatus === 'critical') {
      recommendations.push(isArabic ? 
        'تأمين التمويل العاجل وتحسين إدارة التدفق النقدي' : 
        'Secure emergency financing and improve cash flow management'
      );
    }

    // Risk mitigation recommendations
    const criticalRisks = risks.filter(r => r.riskLevel === 'critical');
    if (criticalRisks.length > 0) {
      recommendations.push(isArabic ? 
        'إعطاء الأولوية للتخفيف من المخاطر الحرجة' : 
        'Prioritize critical risk mitigation'
      );
    }

    // Opportunity capture recommendations
    const highValueOpportunities = opportunities.filter(o => 
      o.opportunityLevel === 'transformational' || o.opportunityLevel === 'significant'
    );
    if (highValueOpportunities.length > 0) {
      recommendations.push(isArabic ? 
        'تسريع الاستحواذ على الفرص الاستراتيجية عالية القيمة' : 
        'Accelerate capture of high-value strategic opportunities'
      );
    }

    // Execution confidence recommendations
    if (snapshot.managementExecutionConfidence < 0.7) {
      recommendations.push(isArabic ? 
        'تعزيز قدرات التنفيذ الإدارية' : 
        'Strengthen management execution capabilities'
      );
    }

    return recommendations.slice(0, 3); // Maximum 3 recommendations
  }

  // Generate confidence signals
  private generateConfidenceSignals(snapshot: ChairmanStrategicSnapshot): ChairmanBriefingContent['confidenceSignals'] {
    return {
      overallFinancialHealth: snapshot.overallFinancialHealthScore,
      forecastReliability: snapshot.forecastReliabilityScore * 100,
      managementExecution: snapshot.managementExecutionConfidence * 100,
      strategicAlignment: snapshot.strategicAlignmentScore * 100
    };
  }

  // Generate risk signals
  private async generateRiskSignals(risks: ChairmanStrategicRisk[]): Promise<ChairmanBriefingContent['riskSignals']> {
    // Top risks (maximum 3)
    const topRisks = risks.slice(0, 3).map(risk => ({
      title: risk.riskTitle,
      level: risk.riskLevel,
      trend: risk.riskTrend,
      mitigation: risk.mitigationStatus
    }));

    // Risk heatmap (by category)
    const riskHeatmap = risks.reduce((acc, risk) => {
      acc[risk.riskCategory] = (acc[risk.riskCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      topRisks,
      riskHeatmap
    };
  }

  // Generate opportunity signals
  private async generateOpportunitySignals(opportunities: ChairmanStrategicOpportunity[]): Promise<ChairmanBriefingContent['opportunitySignals']> {
    // Top opportunities (maximum 3)
    const topOpportunities = opportunities.slice(0, 3).map(opportunity => ({
      title: opportunity.opportunityTitle,
      level: opportunity.opportunityLevel,
      readiness: opportunity.readinessLevel,
      confidence: opportunity.confidenceLevel
    }));

    // Opportunity pipeline (by category)
    const opportunityPipeline = opportunities.reduce((acc, opportunity) => {
      acc[opportunity.opportunityCategory] = (acc[opportunity.opportunityCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      topOpportunities,
      opportunityPipeline
    };
  }

  // Helper methods for Arabic translations
  private getHealthStatusAr(score: number): string {
    if (score >= 80) return 'ممتازة';
    if (score >= 60) return 'جيدة';
    if (score >= 40) return 'متوسطة';
    return 'ضعيفة';
  }

  private getDirectionAr(direction: string): string {
    const directions: Record<string, string> = {
      'confirmed_growth': 'نمو مؤكد',
      'confirmed_stable': 'استقرار مؤكد',
      'at_risk_decline': 'انخفاض محفوف بالمخاطر',
      'at_risk_volatile': 'تقلب محفوف بالمخاطر'
    };
    return directions[direction] || direction;
  }

  private getCashStatusAr(status: string): string {
    const statuses: Record<string, string> = {
      'excellent': 'ممتاز',
      'healthy': 'صحي',
      'adequate': 'كافٍ',
      'concerning': 'مقلق',
      'critical': 'حرج'
    };
    return statuses[status] || status;
  }

  private getConfidenceLevelAr(level: string): string {
    const levels: Record<string, string> = {
      'high_confidence': 'ثقة عالية',
      'moderate_confidence': 'ثقة معتدلة',
      'low_confidence': 'ثقة منخفضة',
      'unreliable': 'غير موثوق'
    };
    return levels[level] || level;
  }

  private getStrategicRecommendationAr(
    snapshot: ChairmanStrategicSnapshot,
    risks: ChairmanStrategicRisk[],
    opportunities: ChairmanStrategicOpportunity[]
  ): string {
    if (snapshot.overallFinancialHealthScore < 50) {
      return 'إعادة التركيز على الاستقرار المالي وتخفيف المخاطر';
    }
    if (risks.filter(r => r.riskLevel === 'critical').length > 0) {
      return 'إعطاء الأولوية لإدارة المخاطر الحرجة';
    }
    if (opportunities.filter(o => o.opportunityLevel === 'transformational').length > 0) {
      return 'الاستفادة من الفرص التحويلية المتاحة';
    }
    return 'الاستمرار في المسار الاستراتيجي الحالي مع مراقبة الأداء';
  }

  // Helper methods for English translations
  private getHealthStatusEn(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  }

  private getDirectionEn(direction: string): string {
    const directions: Record<string, string> = {
      'confirmed_growth': 'Confirmed Growth',
      'confirmed_stable': 'Confirmed Stable',
      'at_risk_decline': 'At Risk - Declining',
      'at_risk_volatile': 'At Risk - Volatile'
    };
    return directions[direction] || direction;
  }

  private getCashStatusEn(status: string): string {
    const statuses: Record<string, string> = {
      'excellent': 'Excellent',
      'healthy': 'Healthy',
      'adequate': 'Adequate',
      'concerning': 'Concerning',
      'critical': 'Critical'
    };
    return statuses[status] || status;
  }

  private getConfidenceLevelEn(level: string): string {
    const levels: Record<string, string> = {
      'high_confidence': 'High Confidence',
      'moderate_confidence': 'Moderate Confidence',
      'low_confidence': 'Low Confidence',
      'unreliable': 'Unreliable'
    };
    return levels[level] || level;
  }

  private getStrategicRecommendationEn(
    snapshot: ChairmanStrategicSnapshot,
    risks: ChairmanStrategicRisk[],
    opportunities: ChairmanStrategicOpportunity[]
  ): string {
    if (snapshot.overallFinancialHealthScore < 50) {
      return 'Focus on financial stabilization and risk mitigation';
    }
    if (risks.filter(r => r.riskLevel === 'critical').length > 0) {
      return 'Prioritize critical risk management';
    }
    if (opportunities.filter(o => o.opportunityLevel === 'transformational').length > 0) {
      return 'Pursue transformational opportunities';
    }
    return 'Continue current strategic path with performance monitoring';
  }
}
