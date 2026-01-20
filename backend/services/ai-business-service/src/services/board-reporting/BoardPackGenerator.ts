import { BoardReportingService, BoardKPISnapshot, BoardRiskAssessment, BoardStrategicAlert } from './BoardReportingService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface BoardPackContent {
  executiveSummary: string;
  financialHighlights: {
    revenue: {
      current: number;
      previousPeriod: number;
      previousYear: number;
      growthQoQ: number;
      growthYoY: number;
    };
    profitability: {
      ebitda: number;
      ebitdaMargin: number;
      netProfit: number;
      netProfitMargin: number;
      grossMargin: number;
      operatingMargin: number;
    };
    cashPosition: {
      current: number;
      previousPeriod: number;
      monthlyBurnRate: number;
      runwayMonths: number;
    };
  };
  riskSummary: {
    totalRisks: number;
    criticalRisks: number;
    highRisks: number;
    riskByCategory: Record<string, number>;
    topRisks: Array<{
      title: string;
      level: string;
      score: number;
      mitigation: string;
    }>;
  };
  strategicRecommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  alerts: {
    critical: number;
    warning: number;
    info: number;
    actionRequired: number;
  };
  forecastOutlook: {
    confidence: number;
    keyDrivers: string[];
    risks: string[];
    opportunities: string[];
  };
}

export interface BoardPackTemplate {
  templateName: string;
  templateType: string;
  content: string;
  variables: string[];
  language: string;
}

export class BoardPackGenerator {
  private boardReportingService: BoardReportingService;

  constructor() {
    this.boardReportingService = new BoardReportingService();
  }

  // Generate complete board pack content
  async generateBoardPackContent(
    snapshotId: string,
    businessAccountId: string,
    language: 'en' | 'ar' = 'en'
  ): Promise<BoardPackContent> {
    // Get KPI snapshot
    const kpiSnapshot = await this.boardReportingService.getKPISnapshotById(snapshotId);
    
    // Get risk assessments
    const riskAssessments = await this.boardReportingService.getRiskAssessments(snapshotId);
    
    // Get strategic alerts
    const strategicAlerts = await this.boardReportingService.getStrategicAlerts(businessAccountId, {
      status: 'active'
    });

    // Generate executive summary
    const executiveSummary = await this.generateExecutiveSummary(kpiSnapshot, riskAssessments, strategicAlerts, language);
    
    // Generate financial highlights
    const financialHighlights = this.generateFinancialHighlights(kpiSnapshot);
    
    // Generate risk summary
    const riskSummary = this.generateRiskSummary(riskAssessments);
    
    // Generate strategic recommendations
    const strategicRecommendations = await this.generateStrategicRecommendations(kpiSnapshot, riskAssessments, strategicAlerts, language);
    
    // Generate alerts summary
    const alerts = this.generateAlertsSummary(strategicAlerts);
    
    // Generate forecast outlook
    const forecastOutlook = await this.generateForecastOutlook(kpiSnapshot, riskAssessments, strategicAlerts, language);

    return {
      executiveSummary,
      financialHighlights,
      riskSummary,
      strategicRecommendations,
      alerts,
      forecastOutlook
    };
  }

  // Generate executive summary with board-level tone
  private async generateExecutiveSummary(
    kpiSnapshot: BoardKPISnapshot,
    riskAssessments: BoardRiskAssessment[],
    strategicAlerts: BoardStrategicAlert[],
    language: 'en' | 'ar'
  ): Promise<string> {
    const isArabic = language === 'ar';
    
    if (isArabic) {
      return `
مجلس الإدارة المحترم،

يسر مجلس الإدارة تقديم التقرير ${kpiSnapshot.periodType} للفترة المنتهية في ${kpiSnapshot.periodEndDate.toLocaleDateString('ar-SA')}.

**الأداء المالي:**
بلغت الإيرادات للفترة ${this.formatCurrency(kpiSnapshot.revenueCurrent, language)}، ممثلة تغييرًا بنسبة ${kpiSnapshot.revenueGrowthQoQ}% عن الفترة السابقة. تبلغ هامش EBITDA ${kpiSnapshot.ebitdaMarginCurrent}%, مع هامش صافي الربح يبلغ ${kpiSnapshot.netProfitMarginCurrent}%.

**المركز النقدي:**
تحافظ الشركة على مركز نقدي قوي يبلغ ${this.formatCurrency(kpiSnapshot.cashPositionCurrent, language)}، مما يوفر ${kpiSnapshot.cashRunwayMonths} شهرًا من المدة التشغيلية بمعدلات الحرق الحالية.

**النقاط الاستراتيجية:**
${this.generateStrategicHighlights(kpiSnapshot, riskAssessments, strategicAlerts, language)}

**المخاطر الرئيسية:**
${this.generateKeyRisksSummary(riskAssessments, language)}

**التوقعات:**
${this.generateForecastOutlookText(kpiSnapshot, riskAssessments, strategicAlerts, language)}

يظل مجلس الإدارة واثقًا في الاتجاه الاستراتيجي والمالي للشركة.
      `.trim();
    } else {
      return `
The Board of Directors is pleased to present the ${kpiSnapshot.periodType} report for the period ending ${kpiSnapshot.periodEndDate.toLocaleDateString()}.

**Financial Performance:**
Revenue for the period reached ${this.formatCurrency(kpiSnapshot.revenueCurrent, language)}, representing a ${kpiSnapshot.revenueGrowthQoQ}% change from the previous period. EBITDA margin stands at ${kpiSnapshot.ebitdaMarginCurrent}%, with net profit margin at ${kpiSnapshot.netProfitMarginCurrent}%.

**Cash Position:**
The company maintains a strong cash position of ${this.formatCurrency(kpiSnapshot.cashPositionCurrent, language)}, providing ${kpiSnapshot.cashRunwayMonths} months of operational runway at current burn rates.

**Strategic Highlights:**
${this.generateStrategicHighlights(kpiSnapshot, riskAssessments, strategicAlerts, language)}

**Key Risks:**
${this.generateKeyRisksSummary(riskAssessments, language)}

**Outlook:**
${this.generateForecastOutlookText(kpiSnapshot, riskAssessments, strategicAlerts, language)}

The Board remains confident in the company's strategic direction and financial trajectory.
      `.trim();
    }
  }

  // Generate financial highlights section
  private generateFinancialHighlights(kpiSnapshot: BoardKPISnapshot): BoardPackContent['financialHighlights'] {
    return {
      revenue: {
        current: kpiSnapshot.revenueCurrent,
        previousPeriod: kpiSnapshot.revenuePreviousPeriod,
        previousYear: kpiSnapshot.revenuePreviousYear,
        growthQoQ: kpiSnapshot.revenueGrowthQoQ,
        growthYoY: kpiSnapshot.revenueGrowthYoY
      },
      profitability: {
        ebitda: kpiSnapshot.ebitdaCurrent,
        ebitdaMargin: kpiSnapshot.ebitdaMarginCurrent,
        netProfit: kpiSnapshot.netProfitCurrent,
        netProfitMargin: kpiSnapshot.netProfitMarginCurrent,
        grossMargin: kpiSnapshot.grossMarginCurrent,
        operatingMargin: kpiSnapshot.operatingMarginCurrent
      },
      cashPosition: {
        current: kpiSnapshot.cashPositionCurrent,
        previousPeriod: kpiSnapshot.cashPositionPreviousPeriod,
        monthlyBurnRate: kpiSnapshot.monthlyBurnRate,
        runwayMonths: kpiSnapshot.cashRunwayMonths
      }
    };
  }

  // Generate risk summary
  private generateRiskSummary(riskAssessments: BoardRiskAssessment[]): BoardPackContent['riskSummary'] {
    const totalRisks = riskAssessments.length;
    const criticalRisks = riskAssessments.filter(r => r.riskLevel === 'critical').length;
    const highRisks = riskAssessments.filter(r => r.riskLevel === 'high').length;
    
    const riskByCategory = riskAssessments.reduce((acc, risk) => {
      acc[risk.riskCategory] = (acc[risk.riskCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topRisks = riskAssessments
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5)
      .map(risk => ({
        title: risk.riskTitle,
        level: risk.riskLevel,
        score: risk.riskScore,
        mitigation: risk.mitigationStrategy || 'No mitigation strategy defined'
      }));

    return {
      totalRisks,
      criticalRisks,
      highRisks,
      riskByCategory,
      topRisks
    };
  }

  // Generate strategic recommendations
  private async generateStrategicRecommendations(
    kpiSnapshot: BoardKPISnapshot,
    riskAssessments: BoardRiskAssessment[],
    strategicAlerts: BoardStrategicAlert[],
    language: 'en' | 'ar'
  ): Promise<BoardPackContent['strategicRecommendations']> {
    const isArabic = language === 'ar';
    
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Financial performance recommendations
    if (kpiSnapshot.revenueGrowthQoQ < 0) {
      immediate.push(isArabic ? 
        'تنفيذ خطة طارئة لزيادة الإيرادات وتحسين الأداء' : 
        'Implement emergency revenue growth plan and performance improvement'
      );
    }

    if (kpiSnapshot.cashRunwayMonths < 6) {
      immediate.push(isArabic ? 
        'تقليل المصاريف التشغيلية وزيادة التدفقات النقدية' : 
        'Reduce operational expenses and increase cash flow'
      );
    }

    if (kpiSnapshot.ebitdaMarginCurrent < 10) {
      shortTerm.push(isArabic ? 
        'تحسين هوامش الربح من خلال تحسين التكاليف' : 
        'Improve profit margins through cost optimization'
      );
    }

    // Risk-based recommendations
    const criticalRisks = riskAssessments.filter(r => r.riskLevel === 'critical');
    criticalRisks.forEach(risk => {
      immediate.push(isArabic ? 
        `معالجة المخاطر الحرجة: ${risk.riskTitle}` : 
        `Address critical risk: ${risk.riskTitle}`
      );
    });

    const highRisks = riskAssessments.filter(r => r.riskLevel === 'high');
    highRisks.forEach(risk => {
      shortTerm.push(isArabic ? 
        `إدارة المخاطر العالية: ${risk.riskTitle}` : 
        `Manage high risk: ${risk.riskTitle}`
      );
    });

    // Alert-based recommendations
    const criticalAlerts = strategicAlerts.filter(a => a.severity === 'critical' && a.actionRequired);
    criticalAlerts.forEach(alert => {
      immediate.push(isArabic ? 
        `اتخاذ إجراء فوري للتنبيه: ${alert.title}` : 
        `Take immediate action on alert: ${alert.title}`
      );
    });

    // Strategic long-term recommendations
    if (kpiSnapshot.forecastConfidenceScore < 0.7) {
      longTerm.push(isArabic ? 
        'تحسين جودة التنبؤات المالية ونماذج التخطيط' : 
        'Improve financial forecasting accuracy and planning models'
      );
    }

    if (kpiSnapshot.ltvCacRatio < 3) {
      longTerm.push(isArabic ? 
        'تحسين استراتيجية اكتساب العملاء وزيادة قيمتهم مدى الحياة' : 
        'Optimize customer acquisition strategy and increase lifetime value'
      );
    }

    return { immediate, shortTerm, longTerm };
  }

  // Generate alerts summary
  private generateAlertsSummary(strategicAlerts: BoardStrategicAlert[]): BoardPackContent['alerts'] {
    const critical = strategicAlerts.filter(a => a.severity === 'critical').length;
    const warning = strategicAlerts.filter(a => a.severity === 'warning').length;
    const info = strategicAlerts.filter(a => a.severity === 'info').length;
    const actionRequired = strategicAlerts.filter(a => a.actionRequired).length;

    return { critical, warning, info, actionRequired };
  }

  // Generate forecast outlook
  private async generateForecastOutlook(
    kpiSnapshot: BoardKPISnapshot,
    riskAssessments: BoardRiskAssessment[],
    strategicAlerts: BoardStrategicAlert[],
    language: 'en' | 'ar'
  ): Promise<BoardPackContent['forecastOutlook']> {
    const isArabic = language === 'ar';
    
    const confidence = kpiSnapshot.forecastConfidenceScore;
    
    const keyDrivers = [
      isArabic ? 'أداء المبيعات' : 'Sales performance',
      isArabic ? 'كفاءة التشغيل' : 'Operational efficiency',
      isArabic ? 'إدارة التكاليف' : 'Cost management',
      isArabic ? 'ظروف السوق' : 'Market conditions'
    ];

    const risks = riskAssessments
      .filter(r => r.riskLevel === 'critical' || r.riskLevel === 'high')
      .slice(0, 3)
      .map(r => r.riskTitle);

    const opportunities = [
      isArabic ? 'فرص النمو في السوق' : 'Market growth opportunities',
      isArabic ? 'تحسينات الكفاءة' : 'Efficiency improvements',
      isArabic ? 'مبادرات استراتيجية جديدة' : 'New strategic initiatives'
    ];

    return {
      confidence,
      keyDrivers,
      risks,
      opportunities
    };
  }

  // Helper methods for content generation
  private generateStrategicHighlights(
    kpiSnapshot: BoardKPISnapshot,
    riskAssessments: BoardRiskAssessment[],
    strategicAlerts: BoardStrategicAlert[],
    language: 'en' | 'ar'
  ): string {
    const isArabic = language === 'ar';
    
    const highlights = [];
    
    if (kpiSnapshot.revenueGrowthQoQ > 10) {
      highlights.push(isArabic ? 
        'نمو إيرادات قوي يتجاوز التوقعات' : 
        'Strong revenue growth exceeding expectations'
      );
    }
    
    if (kpiSnapshot.cashRunwayMonths > 18) {
      highlights.push(isArabic ? 
        'مركز نقدي قوي مع مدة تشغيلية طويلة' : 
        'Strong cash position with extended runway'
      );
    }
    
    if (kpiSnapshot.ebitdaMarginCurrent > 15) {
      highlights.push(isArabic ? 
        'هوامش ربح صحية ومستدامة' : 
        'Healthy and sustainable profit margins'
      );
    }
    
    return highlights.join('. ');
  }

  private generateKeyRisksSummary(riskAssessments: BoardRiskAssessment[], language: 'en' | 'ar'): string {
    const isArabic = language === 'ar';
    
    const criticalRisks = riskAssessments.filter(r => r.riskLevel === 'critical');
    const highRisks = riskAssessments.filter(r => r.riskLevel === 'high');
    
    if (criticalRisks.length === 0 && highRisks.length === 0) {
      return isArabic ? 
        'لا توجد مخاطر حرجة أو عالية تتطلب اهتمامًا فوريًا' : 
        'No critical or high risks requiring immediate attention';
    }
    
    const summary = [];
    if (criticalRisks.length > 0) {
      summary.push(isArabic ? 
        `${criticalRisks.length} مخاطر حرجة تتطلب اهتمامًا فوريًا` : 
        `${criticalRisks.length} critical risks requiring immediate attention`
      );
    }
    
    if (highRisks.length > 0) {
      summary.push(isArabic ? 
        `${highRisks.length} مخاطر عالية تتطلب مراقبة مستمرة` : 
        `${highRisks.length} high risks requiring ongoing monitoring`
      );
    }
    
    return summary.join('. ');
  }

  private generateForecastOutlookText(
    kpiSnapshot: BoardKPISnapshot,
    riskAssessments: BoardRiskAssessment[],
    strategicAlerts: BoardStrategicAlert[],
    language: 'en' | 'ar'
  ): string {
    const isArabic = language === 'ar';
    
    const confidence = kpiSnapshot.forecastConfidenceScore;
    
    if (confidence > 0.8) {
      return isArabic ? 
        'ثقة عالية في التوقعات المالية مع استقرار في الأداء المتوقع' : 
        'High confidence in financial forecasts with stable performance expected';
    } else if (confidence > 0.6) {
      return isArabic ? 
        'ثقة معتدلة في التوقعات مع بعض التقلبات المحتملة' : 
        'Moderate confidence in forecasts with some potential volatility';
    } else {
      return isArabic ? 
        'ثقة منخفضة في التوقعات تتطلب تحسين في نماذج التنبؤ' : 
        'Low confidence in forecasts requiring improvement in prediction models';
    }
  }

  private formatCurrency(amount: number, language: 'en' | 'ar'): string {
    const isArabic = language === 'ar';
    const currency = isArabic ? 'ر.س' : '$';
    return `${currency}${amount.toLocaleString(isArabic ? 'ar-SA' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  // Get narrative templates
  async getNarrativeTemplates(templateType?: string, language: 'en' | 'ar' = 'en'): Promise<BoardPackTemplate[]> {
    let query = `
      SELECT 
        template_name as "templateName",
        template_type as "templateType",
        template_content as "content",
        variables,
        language
      FROM board_narrative_templates
      WHERE is_active = true
        AND language = ${language}::varchar
    `;
    
    if (templateType) {
      query += ` AND template_type = ${templateType}::varchar`;
    }
    
    query += ` ORDER BY template_name`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as BoardPackTemplate[];
  }

  // Apply template variables
  applyTemplateVariables(template: string, variables: Record<string, any>): string {
    let content = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), String(value));
    });
    
    return content;
  }

  // Generate board pack document
  async generateBoardPackDocument(
    snapshotId: string,
    businessAccountId: string,
    documentType: 'pdf' | 'docx' | 'html',
    language: 'en' | 'ar' = 'en',
    generatedBy: string
  ): Promise<any> {
    const startTime = Date.now();
    
    // Generate content
    const content = await this.generateBoardPackContent(snapshotId, businessAccountId, language);
    
    // Get narrative templates
    const templates = await this.getNarrativeTemplates('executive_summary', language);
    const template = templates[0];
    
    // Apply template to executive summary
    const executiveSummary = template ? 
      this.applyTemplateVariables(template.content, {
        period_type: content.financialHighlights.revenue.growthQoQ > 0 ? 'quarterly' : 'monthly',
        period_end_date: new Date().toISOString().split('T')[0],
        revenue_current: this.formatCurrency(content.financialHighlights.revenue.current, language),
        revenue_growth_qoq: content.financialHighlights.revenue.growthQoQ,
        ebitda_margin_current: content.financialHighlights.profitability.ebitdaMargin,
        net_profit_margin_current: content.financialHighlights.profitability.netProfitMargin,
        cash_position_current: this.formatCurrency(content.financialHighlights.cashPosition.current, language),
        cash_runway_months: content.financialHighlights.cashPosition.runwayMonths,
        strategic_highlights: 'Key strategic achievements and milestones',
        key_risks: content.riskSummary.topRisks.slice(0, 3).map(r => r.title).join(', '),
        forecast_outlook: content.forecastOutlook.confidence > 0.7 ? 'Positive outlook with strong growth potential' : 'Cautious outlook with focus on risk mitigation'
      }) : content.executiveSummary;
    
    // Create board pack document
    const boardPackDocument = await this.boardReportingService.createBoardPackDocument({
      snapshotId,
      businessAccountId,
      documentType,
      title: `Board Pack - ${new Date().toLocaleDateString()} (${language.toUpperCase()})`,
      description: `Board-level reporting pack for ${documentType.toUpperCase()} format`,
      executiveSummary,
      financialHighlights: content.financialHighlights,
      riskSummary: content.riskSummary,
      strategicRecommendations: content.strategicRecommendations,
      language,
      generatedBy
    });
    
    // Update generation duration
    const generationDurationMs = Date.now() - startTime;
    
    await prisma.$queryRaw`
      UPDATE board_pack_documents 
      SET generation_duration_ms = ${generationDurationMs}::integer
      WHERE id = ${boardPackDocument.id}::uuid
    `;
    
    return {
      ...boardPackDocument,
      generationDurationMs,
      content
    };
  }
}
