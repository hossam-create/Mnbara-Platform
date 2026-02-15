import { MnaReadinessService, MnaReadinessSnapshot, MnaNormalizedStatement, MnaNonRecurringItem, MnaScenario, MnaSynergyAnalysis } from './MnaReadinessService';

export interface MnaBuyerPackContent {
  executiveSummary: string;
  businessOverview: {
    companyProfile: any;
    businessModel: string;
    marketPosition: string;
    competitiveAdvantages: string[];
  };
  financialHighlights: {
    revenueGrowth: any[];
    profitabilityMetrics: any[];
    adjustedEbitda: any[];
    workingCapitalAnalysis: any[];
  };
  normalizedFinancials: {
    incomeStatement: any[];
    balanceSheet: any[];
    cashFlowStatement: any[];
    keyRatios: any[];
  };
  nonRecurringAnalysis: {
    totalAdjustments: number;
    majorItems: any[];
    impactOnValuation: number;
  };
  scenarioAnalysis: {
    baseCase: any;
    optimistic: any;
    conservative: any;
    valuationRange: any;
  };
  synergyOpportunities: {
    revenueSynergies: any;
    costSynergies: any;
    totalSynergyValue: number;
    implementationTimeline: any;
  };
  historicalPerformance: {
    multiYearTrends: any[];
    growthRates: any[];
    profitabilityEvolution: any[];
  };
  riskFactors: string[];
  recommendations: string[];
}

export class MnaPackGenerator {
  private mnaService: MnaReadinessService;

  constructor() {
    this.mnaService = new MnaReadinessService();
  }

  // Generate complete buyer-ready pack
  async generateBuyerPack(
    snapshotId: string,
    language: 'en' | 'ar' = 'en'
  ): Promise<MnaBuyerPackContent> {
    const isArabic = language === 'ar';
    
    // Get snapshot data
    const snapshot = await this.mnaService.getReadinessSnapshot(snapshotId);
    const normalizedStatements = await this.mnaService.getNormalizedStatements(snapshotId);
    const nonRecurringItems = await this.mnaService.getNonRecurringItems(snapshotId);
    const scenarios = await this.mnaService.getScenarios(snapshotId);
    const synergyAnalyses = await this.mnaService.getSynergyAnalysis(snapshotId);
    
    // Generate pack content
    const executiveSummary = this.generateExecutiveSummary(snapshot, normalizedStatements, scenarios, language);
    const businessOverview = this.generateBusinessOverview(snapshot, language);
    const financialHighlights = this.generateFinancialHighlights(normalizedStatements, language);
    const normalizedFinancials = this.generateNormalizedFinancials(normalizedStatements, language);
    const nonRecurringAnalysis = this.generateNonRecurringAnalysis(nonRecurringItems, language);
    const scenarioAnalysis = this.generateScenarioAnalysis(scenarios, language);
    const synergyOpportunities = this.generateSynergyOpportunities(synergyAnalyses, language);
    const historicalPerformance = this.generateHistoricalPerformance(normalizedStatements, language);
    const riskFactors = this.generateRiskFactors(normalizedStatements, nonRecurringItems, language);
    const recommendations: string[] = await this.generateRecommendations(snapshot, normalizedStatements, scenarios, language);
    
    return {
      executiveSummary,
      businessOverview,
      financialHighlights,
      normalizedFinancials,
      nonRecurringAnalysis,
      scenarioAnalysis,
      synergyOpportunities,
      historicalPerformance,
      riskFactors,
      recommendations
    };
  }

  // Generate executive summary
  private generateExecutiveSummary(
    snapshot: MnaReadinessSnapshot,
    normalizedStatements: MnaNormalizedStatement[],
    scenarios: MnaScenario[],
    language: 'en' | 'ar'
  ): string {
    const latestStatement = normalizedStatements[0];
    const baseScenario = scenarios.find(s => s.scenarioType === 'base_case');
    
    if (language === 'ar') {
      return `
ملخص تنفيذي للاستعداد للاندماج والاستحواذ

الشركة: ${snapshot.snapshotName}
فترة التقييم: ${snapshot.snapshotPeriodStart} إلى ${snapshot.snapshotPeriodEnd}
tاريخ التقييم: ${snapshot.valuationDate}

الأداء المالي الرئيسي:
- الإيرادات المعيارية: $${(latestStatement?.normalizedRevenue || 0).toLocaleString()}
- EBITDA المعدل: $${(latestStatement?.adjustedEbitda || 0).toLocaleString()}
- صافي الدخل المعياري: $${(latestStatement?.normalizedNetIncome || 0).toLocaleString()}

تحليل السيناريوهات:
- السيناريو الأساسي: $${(baseScenario?.valuationResults?.enterprise_value || 0).toLocaleString()}
- السيناريو المتفائل: $${(scenarios.find(s => s.scenarioType === 'optimistic')?.valuationResults?.enterprise_value || 0).toLocaleString()}
- السيناريو المحافظ: $${(scenarios.find(s => s.scenarioType === 'conservative')?.valuationResults?.enterprise_value || 0).toLocaleString()}

نقاط القوة الرئيسية:
- نمو الإيرادات المستدام
- هوامش ربح قوية
- تدفق نقدي إيجابي
- مركز مالي قوي

التوصية: الشركة جاهزة للاستحواذ مع تقييم عادل بناءً على التحليل المالي الشامل
      `.trim();
    } else {
      return `
M&A Readiness Executive Summary

Company: ${snapshot.snapshotName}
Valuation Period: ${snapshot.snapshotPeriodStart} to ${snapshot.snapshotPeriodEnd}
Valuation Date: ${snapshot.valuationDate}

Key Financial Performance:
- Normalized Revenue: $${(latestStatement?.normalizedRevenue || 0).toLocaleString()}
- Adjusted EBITDA: $${(latestStatement?.adjustedEbitda || 0).toLocaleString()}
- Normalized Net Income: $${(latestStatement?.normalizedNetIncome || 0).toLocaleString()}

Scenario Analysis:
- Base Case: $${(baseScenario?.valuationResults?.enterprise_value || 0).toLocaleString()}
- Optimistic: $${(scenarios.find(s => s.scenarioType === 'optimistic')?.valuationResults?.enterprise_value || 0).toLocaleString()}
- Conservative: $${(scenarios.find(s => s.scenarioType === 'conservative')?.valuationResults?.enterprise_value || 0).toLocaleString()}

Key Strengths:
- Sustainable revenue growth
- Strong profit margins
- Positive cash flow generation
- Solid financial position

Recommendation: Company is acquisition-ready with fair valuation based on comprehensive financial analysis
      `.trim();
    }
  }

  // Generate business overview
  private generateBusinessOverview(snapshot: MnaReadinessSnapshot, language: 'en' | 'ar'): MnaBuyerPackContent['businessOverview'] {
    const isArabic = language === 'ar';
    
    const businessModel = isArabic ? 
      'نموذج عمل متنوع مع مصادر دخل متعددة وقاعدة عملاء مستقرة' :
      'Diversified business model with multiple revenue streams and stable customer base';
    
    const marketPosition = isArabic ? 
      'موقع قوي في السوق مع حصة سوقية تنافسية وعلامة تجارية راسخة' :
      'Strong market position with competitive market share and established brand';
    
    const competitiveAdvantages = isArabic ? [
      'ميزة تنافسية مستدامة',
      'علاقات عملاء قوية',
      'كفاءات تشغيلية',
      'ابتكار مستمر'
    ] : [
      'Sustainable competitive advantage',
      'Strong customer relationships',
      'Operational efficiencies',
      'Continuous innovation'
    ];
    
    return {
      companyProfile: {
        name: snapshot.snapshotName,
        valuationDate: snapshot.valuationDate,
        currency: snapshot.currency,
        status: snapshot.status
      },
      businessModel,
      marketPosition,
      competitiveAdvantages
    };
  }

  // Generate financial highlights
  private generateFinancialHighlights(normalizedStatements: MnaNormalizedStatement[], language: 'en' | 'ar'): MnaBuyerPackContent['financialHighlights'] {
    const incomeStatements = normalizedStatements.filter(s => s.statementType === 'income_statement');
    
    // Revenue growth calculation
    const revenueGrowth = incomeStatements.map(stmt => ({
      period: stmt.periodEnd,
      revenue: stmt.normalizedRevenue,
      growth: stmt.normalizedRevenue > 0 ? ((stmt.normalizedRevenue - stmt.reportedRevenue) / stmt.reportedRevenue) * 100 : 0
    }));
    
    // Profitability metrics
    const profitabilityMetrics = incomeStatements.map(stmt => ({
      period: stmt.periodEnd,
      ebitdaMargin: stmt.normalizedRevenue > 0 ? (stmt.adjustedEbitda / stmt.normalizedRevenue) * 100 : 0,
      netMargin: stmt.normalizedRevenue > 0 ? (stmt.normalizedNetIncome / stmt.normalizedRevenue) * 100 : 0,
      operatingMargin: stmt.normalizedRevenue > 0 ? ((stmt.normalizedRevenue - stmt.normalizedExpenses) / stmt.normalizedRevenue) * 100 : 0
    }));
    
    // Adjusted EBITDA trend
    const adjustedEbitda = incomeStatements.map(stmt => ({
      period: stmt.periodEnd,
      reportedEbitda: stmt.reportedEbitda,
      adjustedEbitda: stmt.adjustedEbitda,
      adjustment: stmt.adjustedEbitda - stmt.reportedEbitda,
      adjustmentPercent: stmt.reportedEbitda !== 0 ? ((stmt.adjustedEbitda - stmt.reportedEbitda) / Math.abs(stmt.reportedEbitda)) * 100 : 0
    }));
    
    // Working capital analysis
    const workingCapitalAnalysis = normalizedStatements.filter(s => s.workingCapital !== undefined).map(stmt => ({
      period: stmt.periodEnd,
      workingCapital: stmt.workingCapital,
      workingCapitalRatio: stmt.totalAssets ? (stmt.workingCapital! / stmt.totalAssets) * 100 : 0,
      currentRatio: stmt.totalLiabilities ? (stmt.totalAssets! / stmt.totalLiabilities) : 0
    }));
    
    return {
      revenueGrowth,
      profitabilityMetrics,
      adjustedEbitda,
      workingCapitalAnalysis
    };
  }

  // Generate normalized financials
  private generateNormalizedFinancials(normalizedStatements: MnaNormalizedStatement[], language: 'en' | 'ar'): MnaBuyerPackContent['normalizedFinancials'] {
    const incomeStatement = normalizedStatements.filter(s => s.statementType === 'income_statement').map(stmt => ({
      period: stmt.periodEnd,
      reportedRevenue: stmt.reportedRevenue,
      normalizedRevenue: stmt.normalizedRevenue,
      revenueAdjustment: stmt.normalizedRevenue - stmt.reportedRevenue,
      reportedExpenses: stmt.reportedExpenses,
      normalizedExpenses: stmt.normalizedExpenses,
      expenseAdjustment: stmt.normalizedExpenses - stmt.reportedExpenses,
      reportedEbitda: stmt.reportedEbitda,
      adjustedEbitda: stmt.adjustedEbitda,
      ebitdaAdjustment: stmt.adjustedEbitda - stmt.reportedEbitda,
      reportedNetIncome: stmt.reportedNetIncome,
      normalizedNetIncome: stmt.normalizedNetIncome,
      netIncomeAdjustment: stmt.normalizedNetIncome - stmt.reportedNetIncome
    }));
    
    const balanceSheet = normalizedStatements.filter(s => s.statementType === 'balance_sheet').map(stmt => ({
      period: stmt.periodEnd,
      totalAssets: stmt.totalAssets,
      totalLiabilities: stmt.totalLiabilities,
      equity: stmt.equity,
      workingCapital: stmt.workingCapital
    }));
    
    const cashFlowStatement = normalizedStatements.filter(s => s.statementType === 'cash_flow').map(stmt => ({
      period: stmt.periodEnd,
      operatingCashFlow: stmt.operatingCashFlow,
      investingCashFlow: stmt.investingCashFlow,
      financingCashFlow: stmt.financingCashFlow,
      freeCashFlow: stmt.freeCashFlow
    }));
    
    // Calculate key ratios
    const keyRatios = incomeStatement.map(stmt => {
      const balanceSheetStmt = balanceSheet.find(bs => bs.period === stmt.period);
      return {
        period: stmt.period,
        ebitdaMargin: stmt.normalizedRevenue > 0 ? (stmt.adjustedEbitda / stmt.normalizedRevenue) * 100 : 0,
        netMargin: stmt.normalizedRevenue > 0 ? (stmt.normalizedNetIncome / stmt.normalizedRevenue) * 100 : 0,
        roa: balanceSheetStmt?.totalAssets ? (stmt.normalizedNetIncome / balanceSheetStmt.totalAssets) * 100 : 0,
        roe: balanceSheetStmt?.equity ? (stmt.normalizedNetIncome / balanceSheetStmt.equity) * 100 : 0,
        currentRatio: balanceSheetStmt?.totalLiabilities ? (balanceSheetStmt.totalAssets! / balanceSheetStmt.totalLiabilities) : 0
      };
    });
    
    return {
      incomeStatement,
      balanceSheet,
      cashFlowStatement,
      keyRatios
    };
  }

  // Generate non-recurring analysis
  private generateNonRecurringAnalysis(nonRecurringItems: MnaNonRecurringItem[], language: 'en' | 'ar'): MnaBuyerPackContent['nonRecurringAnalysis'] {
    const totalAdjustments = nonRecurringItems.reduce((sum, item) => sum + Math.abs(item.impactOnEbitda), 0);
    
    const majorItems = nonRecurringItems
      .sort((a, b) => Math.abs(b.impactOnEbitda) - Math.abs(a.impactOnEbitda))
      .slice(0, 10)
      .map(item => ({
        name: item.itemName,
        type: item.itemType,
        classification: item.classification,
        amount: item.amount,
        impactOnEbitda: item.impactOnEbitda,
        impactOnNetIncome: item.impactOnNetIncome,
        period: `${item.periodStart} - ${item.periodEnd}`,
        description: item.description
      }));
    
    const impactOnValuation = totalAdjustments * 6; // Assuming 6x EBITDA multiple
    
    return {
      totalAdjustments,
      majorItems,
      impactOnValuation
    };
  }

  // Generate scenario analysis
  private generateScenarioAnalysis(scenarios: MnaScenario[], language: 'en' | 'ar'): MnaBuyerPackContent['scenarioAnalysis'] {
    const baseCase = scenarios.find(s => s.scenarioType === 'base_case');
    const optimistic = scenarios.find(s => s.scenarioType === 'optimistic');
    const conservative = scenarios.find(s => s.scenarioType === 'conservative');
    
    const valuationRange = {
      enterpriseValue: {
        low: conservative?.valuationResults?.enterprise_value || 0,
        base: baseCase?.valuationResults?.enterprise_value || 0,
        high: optimistic?.valuationResults?.enterprise_value || 0
      },
      equityValue: {
        low: conservative?.valuationResults?.equity_value || 0,
        base: baseCase?.valuationResults?.equity_value || 0,
        high: optimistic?.valuationResults?.equity_value || 0
      },
      multiples: {
        evEbitda: {
          low: conservative?.valuationResults?.ev_ebitda_multiple || 0,
          base: baseCase?.valuationResults?.ev_ebitda_multiple || 0,
          high: optimistic?.valuationResults?.ev_ebitda_multiple || 0
        }
      }
    };
    
    return {
      baseCase: baseCase?.valuationResults || {},
      optimistic: optimistic?.valuationResults || {},
      conservative: conservative?.valuationResults || {},
      valuationRange
    };
  }

  // Generate synergy opportunities
  private generateSynergyOpportunities(synergyAnalyses: MnaSynergyAnalysis[], language: 'en' | 'ar'): MnaBuyerPackContent['synergyOpportunities'] {
    if (synergyAnalyses.length === 0) {
      return {
        revenueSynergies: {},
        costSynergies: {},
        totalSynergyValue: 0,
        implementationTimeline: {}
      };
    }
    
    const latestAnalysis = synergyAnalyses[0];
    
    return {
      revenueSynergies: {
        crossSelling: latestAnalysis?.crossSellingOpportunities || [],
        marketExpansion: latestAnalysis?.marketExpansionOpportunities || [],
        pricingPower: latestAnalysis?.pricingPowerImprovements || [],
        totalValue: latestAnalysis?.revenueSynergyValue || 0
      },
      costSynergies: {
        operationalEfficiencies: latestAnalysis?.operationalEfficiencies || [],
        procurementSavings: latestAnalysis?.procurementSavings || [],
        overheadReduction: latestAnalysis?.overheadReduction || [],
        totalValue: latestAnalysis?.costSynergyValue || 0
      },
      totalSynergyValue: latestAnalysis?.totalSynergyValue || 0,
      implementationTimeline: latestAnalysis?.implementationTimeline || {}
    };
  }

  // Generate historical performance
  private generateHistoricalPerformance(normalizedStatements: MnaNormalizedStatement[], language: 'en' | 'ar'): MnaBuyerPackContent['historicalPerformance'] {
    const incomeStatements = normalizedStatements.filter(s => s.statementType === 'income_statement');
    
    // Multi-year trends
    const multiYearTrends = incomeStatements.map(stmt => ({
      year: new Date(stmt.periodEnd).getFullYear(),
      revenue: stmt.normalizedRevenue,
      ebitda: stmt.adjustedEbitda,
      netIncome: stmt.normalizedNetIncome,
      ebitdaMargin: stmt.normalizedRevenue > 0 ? (stmt.adjustedEbitda / stmt.normalizedRevenue) * 100 : 0
    }));
    
    // Growth rates
    const growthRates = multiYearTrends.slice(1).map((trend, index) => {
      const prevTrend = multiYearTrends[index];
      if (!prevTrend) {
        return {
          year: trend.year,
          revenueGrowth: 0,
          ebitdaGrowth: 0,
          netIncomeGrowth: 0
        };
      }
      
      return {
        year: trend.year,
        revenueGrowth: prevTrend.revenue > 0 ? ((trend.revenue - prevTrend.revenue) / prevTrend.revenue) * 100 : 0,
        ebitdaGrowth: prevTrend.ebitda !== 0 ? ((trend.ebitda - prevTrend.ebitda) / Math.abs(prevTrend.ebitda)) * 100 : 0,
        netIncomeGrowth: prevTrend.netIncome !== 0 ? ((trend.netIncome - prevTrend.netIncome) / Math.abs(prevTrend.netIncome)) * 100 : 0
      };
    });
    
    // Profitability evolution
    const profitabilityEvolution = multiYearTrends.map(trend => ({
      year: trend.year,
      ebitdaMargin: trend.ebitdaMargin,
      netMargin: trend.revenue > 0 ? (trend.netIncome / trend.revenue) * 100 : 0,
      operatingMargin: trend.revenue > 0 ? ((trend.revenue - (trend.ebitda * 0.7)) / trend.revenue) * 100 : 0
    }));
    
    return {
      multiYearTrends,
      growthRates,
      profitabilityEvolution
    };
  }

  // Generate risk factors
  private generateRiskFactors(normalizedStatements: MnaNormalizedStatement[], nonRecurringItems: MnaNonRecurringItem[], language: 'en' | 'ar'): string[] {
    const risks: string[] = [];
    
    // Revenue concentration risk
    const latestRevenue = normalizedStatements[0]?.normalizedRevenue || 0;
    if (latestRevenue > 0) {
      const revenueVolatility = this.calculateRevenueVolatility(normalizedStatements);
      if (revenueVolatility > 20) {
        risks.push(language === 'ar' ? 
          'تقلبات عالية في الإيرادات قد تشير إلى مخاطر التركيز' :
          'High revenue volatility may indicate concentration risks');
      }
    }
    
    // Profitability risk
    const latestEbitdaMargin = normalizedStatements[0]?.adjustedEbitda && latestRevenue > 0 ? 
      (normalizedStatements[0].adjustedEbitda / latestRevenue) * 100 : 0;
    if (latestEbitdaMargin < 10) {
      risks.push(language === 'ar' ? 
        'هوامش ربح منخفضة قد تؤثر على الاستدامة المالية' :
        'Low profit margins may affect financial sustainability');
    }
    
    // Non-recurring items risk
    if (nonRecurringItems.length > 5) {
      risks.push(language === 'ar' ? 
        'عدد كبير من البنود غير المتكررة يشير إلى عدم الاستقرار التشغيلي' :
        'High number of non-recurring items indicates operational instability');
    }
    
    // Working capital risk
    const workingCapital = normalizedStatements[0]?.workingCapital;
    if (workingCapital && workingCapital < 0) {
      risks.push(language === 'ar' ? 
        'رأس المال العامل السلبي يشير إلى ضغوط سيولة' :
        'Negative working capital indicates liquidity pressures');
    }
    
    return risks;
  }

  // Generate recommendations
  private async generateRecommendations(
    snapshot: MnaReadinessSnapshot,
    normalizedStatements: MnaNormalizedStatement[],
    scenarios: MnaScenario[],
    language: 'en' | 'ar'
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Valuation recommendations
    const baseScenario = scenarios.find(s => s.scenarioType === 'base_case');
    const optimisticScenario = scenarios.find(s => s.scenarioType === 'optimistic');
    
    if (baseScenario && optimisticScenario) {
      const valuationSpread = (optimisticScenario.valuationResults?.enterprise_value || 0) - 
                            (baseScenario.valuationResults?.enterprise_value || 0);
      const spreadPercent = baseScenario.valuationResults?.enterprise_value ? 
        (valuationSpread / baseScenario.valuationResults.enterprise_value) * 100 : 0;
      
      if (spreadPercent > 30) {
        recommendations.push(language === 'ar' ? 
          'نطاق تقييم واسع يتطلب تحليل أعمق للفرص والمخاطر' :
          'Wide valuation range requires deeper analysis of opportunities and risks');
      }
    }
    
    // Financial quality recommendations
    const latestStatement = normalizedStatements[0];
    if (latestStatement) {
      const adjustmentSize = Math.abs(latestStatement.adjustedEbitda - latestStatement.reportedEbitda);
      const adjustmentPercent = latestStatement.reportedEbitda !== 0 ? 
        (adjustmentSize / Math.abs(latestStatement.reportedEbitda)) * 100 : 0;
      
      if (adjustmentPercent > 20) {
        recommendations.push(language === 'ar' ? 
          'التعديلات الكبيرة على EBITDA تتطلب مزيد من الشفافية' :
          'Large EBITDA adjustments require more transparency');
      }
    }
    
    // Operational recommendations
    const nonRecurringItems = await this.mnaService.getNonRecurringItems(snapshot.id);
    const recurringItems = nonRecurringItems.filter(item => 
      item.classification === 'one_time' && Math.abs(item.impactOnEbitda) > 100000
    );
    
    if (recurringItems.length > 3) {
      recommendations.push(language === 'ar' ? 
        'تحليل البنود المتكررة لتحسين جودة الأرباح' :
        'Analyze recurring items to improve earnings quality');
    }
    
    return recommendations;
  }

  // Helper methods
  private calculateRevenueVolatility(statements: MnaNormalizedStatement[]): number {
    const revenues = statements
      .filter(s => s.statementType === 'income_statement')
      .map(s => s.normalizedRevenue)
      .filter(r => r > 0);
    
    if (revenues.length < 2) return 0;
    
    const mean = revenues.reduce((sum, r) => sum + r, 0) / revenues.length;
    const variance = revenues.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / revenues.length;
    const stdDev = Math.sqrt(variance);
    
    return mean > 0 ? (stdDev / mean) * 100 : 0;
  }
}
