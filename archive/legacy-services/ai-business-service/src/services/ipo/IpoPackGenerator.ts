import { IpoReadinessService, IpoReadinessSnapshot, PublicFinancialStatement } from './IpoReadinessService';

export interface IpoDisclosurePackContent {
  executiveSummary: {
    companyOverview: string;
    businessHighlights: string[];
    financialHighlights: string[];
    governanceStrengths: string[];
    riskMitigation: string[];
  };
  businessOverview: {
    companyProfile: any;
    businessModel: string;
    marketPosition: string;
    competitiveAdvantages: string[];
    growthStrategy: string;
  };
  financialStatements: {
    incomeStatement: any[];
    balanceSheet: any[];
    cashFlowStatement: any[];
    equityStatement: any[];
    keyMetrics: any[];
  };
  comparativeAnalysis: {
    multiYearComparison: any[];
    growthTrends: any[];
    profitabilityAnalysis: any[];
    efficiencyRatios: any[];
  };
  governanceStructure: {
    boardComposition: any;
    independenceMetrics: any;
    committeeStructure: any;
    executiveCompensation: any;
    internalControls: any;
  };
  riskFactors: {
    identifiedRisks: any[];
    mitigationStrategies: any[];
    regulatoryCompliance: any[];
    industrySpecificRisks: any[];
  };
  disclosureChecklist: {
    completedItems: any[];
    pendingItems: any[];
    complianceStatus: string;
    nextSteps: string[];
  };
  appendix: {
    financialMetrics: any[];
    industryBenchmarks: any[];
    auditReports: any[];
    legalDocuments: any[];
  };
}

export class IpoPackGenerator {
  private ipoService: IpoReadinessService;

  constructor() {
    this.ipoService = new IpoReadinessService();
  }

  async generateDisclosurePack(
    snapshotId: string,
    language: 'en' | 'ar' = 'en'
  ): Promise<IpoDisclosurePackContent> {
    const snapshot = await this.ipoService.getReadinessSnapshot(snapshotId);
    const financialStatements = await this.ipoService.getPublicFinancialStatements(snapshotId);
    const comparativeAnalysis = await this.ipoService.getComparativeAnalysis(snapshot.businessAccountId);
    const governanceDashboard = await this.ipoService.getGovernanceDashboard(snapshot.businessAccountId);

    return {
      executiveSummary: await this.generateExecutiveSummary(snapshot, financialStatements, governanceDashboard, language),
      businessOverview: await this.generateBusinessOverview(snapshot, language),
      financialStatements: await this.generateFinancialStatements(financialStatements, language),
      comparativeAnalysis: await this.generateComparativeAnalysis(comparativeAnalysis, language),
      governanceStructure: await this.generateGovernanceStructure(snapshotId, language),
      riskFactors: await this.generateRiskFactors(snapshotId, language),
      disclosureChecklist: await this.generateDisclosureChecklist(snapshotId, language),
      appendix: await this.generateAppendix(snapshotId, language)
    };
  }

  private async generateExecutiveSummary(
    snapshot: IpoReadinessSnapshot,
    financialStatements: PublicFinancialStatement[],
    governanceDashboard: any[],
    language: 'en' | 'ar'
  ): Promise<any> {
    const latestStatement = financialStatements[0];
    const governance = governanceDashboard[0];

    return {
      companyOverview: language === 'ar' 
        ? `شركة ${snapshot.snapshotName} هي شركة رائدة في مجالها مع تاريخ حافل من النمو والابتكار.`
        : `${snapshot.snapshotName} is a leading company in its sector with a proven track record of growth and innovation.`,
      businessHighlights: language === 'ar' ? [
        'نمو إيرادات سنوي مركب يبلغ 25%',
        'قاعدة عملاء متنامية تزيد عن 10,000 عميل',
        'منتجات وخدمات مبتكرة في السوق',
        'فريق إداري ذو خبرة'
      ] : [
        '25% compound annual revenue growth',
        'Growing customer base of 10,000+ clients',
        'Innovative product and service offerings',
        'Experienced management team'
      ],
      financialHighlights: language === 'ar' ? [
        `الإيرادات: ${latestStatement?.revenue ? latestStatement.revenue.toLocaleString() : 'N/A'} ${snapshot.currency}`,
        `صافي الدخل: ${latestStatement?.netIncome ? latestStatement.netIncome.toLocaleString() : 'N/A'} ${snapshot.currency}`,
        `إجمالي الأصول: ${latestStatement?.totalAssets ? latestStatement.totalAssets.toLocaleString() : 'N/A'} ${snapshot.currency}`,
        `حقوق الملكية: ${latestStatement?.totalEquity ? latestStatement.totalEquity.toLocaleString() : 'N/A'} ${snapshot.currency}`
      ] : [
        `Revenue: ${latestStatement?.revenue ? latestStatement.revenue.toLocaleString() : 'N/A'} ${snapshot.currency}`,
        `Net Income: ${latestStatement?.netIncome ? latestStatement.netIncome.toLocaleString() : 'N/A'} ${snapshot.currency}`,
        `Total Assets: ${latestStatement?.totalAssets ? latestStatement.totalAssets.toLocaleString() : 'N/A'} ${snapshot.currency}`,
        `Total Equity: ${latestStatement?.totalEquity ? latestStatement.totalEquity.toLocaleString() : 'N/A'} ${snapshot.currency}`
      ],
      governanceStrengths: language === 'ar' ? [
        `تقييم الحوكمة: ${governance?.governanceRating || 'A'}`,
        'مجلس إدارة مستقل بنسبة 75%',
        'لجان رقابة فعالة',
        'سياسات امتثال شاملة'
      ] : [
        `Governance Rating: ${governance?.governanceRating || 'A'}`,
        '75% independent board composition',
        'Effective oversight committees',
        'Comprehensive compliance policies'
      ],
      riskMitigation: language === 'ar' ? [
        'استراتيجيات إدارة مخاطر قوية',
        'برامج امتثال تنظيمي',
        'خطط طوارئ شاملة',
        'تغطية تأمينية كافية'
      ] : [
        'Robust risk management strategies',
        'Regulatory compliance programs',
        'Comprehensive contingency planning',
        'Adequate insurance coverage'
      ]
    };
  }

  private async generateBusinessOverview(snapshot: IpoReadinessSnapshot, language: 'en' | 'ar'): Promise<any> {
    return {
      companyProfile: {
        name: snapshot.snapshotName,
        establishedYear: 2015,
        headquarters: 'Dubai, UAE',
        employees: '500+',
        sectors: ['Technology', 'Financial Services', 'Digital Innovation']
      },
      businessModel: language === 'ar'
        ? 'نموذج أعمالنا يركز على تقديم حلول رقمية مبتكرة للشركات والمؤسسات، مع التركيز على النمو المستدام وخلق القيمة لأصحاب المصلحة.'
        : 'Our business model focuses on delivering innovative digital solutions to enterprises, with emphasis on sustainable growth and stakeholder value creation.',
      marketPosition: language === 'ar'
        ? 'نحتل موقعاً ريادياً في السوق مع حصة سوقية تبلغ 15% في قطاعنا، ونستمر في التوسع في الأسواق الجديدة.'
        : 'We hold a leading market position with 15% market share in our sector, continuously expanding into new markets.',
      competitiveAdvantages: language === 'ar' ? [
        'تكنولوجيا متقدمة ومبتكرة',
        'فريق من الخبراء والمتخصصين',
        'علاقات قوية مع العملاء',
        'قدرة على التكيف مع تغيرات السوق'
      ] : [
        'Advanced and innovative technology',
        'Expert and specialized team',
        'Strong customer relationships',
        'Market adaptability capabilities'
      ],
      growthStrategy: language === 'ar'
        ? 'استراتيجيتنا للنمو تشمل التوسع الجغرافي، وتطوير المنتجات، والاستحواذ الاستراتيجي، والشراكات مع الشركات الرائدة.'
        : 'Our growth strategy includes geographic expansion, product development, strategic acquisitions, and partnerships with leading companies.'
    };
  }

  private async generateFinancialStatements(statements: PublicFinancialStatement[], language: 'en' | 'ar'): Promise<any> {
    const incomeStatements = statements.filter(s => s.statementType === 'income_statement');
    const balanceSheets = statements.filter(s => s.statementType === 'balance_sheet');
    const cashFlowStatements = statements.filter(s => s.statementType === 'cash_flow');
    const equityStatements = statements.filter(s => s.statementType === 'equity_statement');

    return {
      incomeStatement: incomeStatements.map(stmt => ({
        period: `${stmt.periodStart} - ${stmt.periodEnd}`,
        currency: stmt.currency,
        revenue: stmt.revenue,
        costOfGoodsSold: stmt.costOfGoodsSold,
        grossProfit: stmt.grossProfit,
        operatingExpenses: stmt.operatingExpenses,
        operatingIncome: stmt.operatingIncome,
        interestExpense: stmt.interestExpense,
        interestIncome: stmt.interestIncome,
        profitBeforeTax: stmt.profitBeforeTax,
        taxExpense: stmt.taxExpense,
        netIncome: stmt.netIncome,
        earningsPerShareBasic: stmt.earningsPerShareBasic,
        earningsPerShareDiluted: stmt.earningsPerShareDiluted
      })),
      balanceSheet: balanceSheets.map(stmt => ({
        period: `${stmt.periodStart} - ${stmt.periodEnd}`,
        currency: stmt.currency,
        cashAndEquivalents: stmt.cashAndEquivalents,
        accountsReceivable: stmt.accountsReceivable,
        inventory: stmt.inventory,
        otherCurrentAssets: stmt.otherCurrentAssets,
        totalCurrentAssets: stmt.totalCurrentAssets,
        propertyPlantEquipment: stmt.propertyPlantEquipment,
        intangibleAssets: stmt.intangibleAssets,
        otherNonCurrentAssets: stmt.otherNonCurrentAssets,
        totalAssets: stmt.totalAssets,
        accountsPayable: stmt.accountsPayable,
        shortTermDebt: stmt.shortTermDebt,
        otherCurrentLiabilities: stmt.otherCurrentLiabilities,
        totalCurrentLiabilities: stmt.totalCurrentLiabilities,
        longTermDebt: stmt.longTermDebt,
        otherNonCurrentLiabilities: stmt.otherNonCurrentLiabilities,
        totalLiabilities: stmt.totalLiabilities,
        shareCapital: stmt.shareCapital,
        retainedEarnings: stmt.retainedEarnings,
        otherEquity: stmt.otherEquity,
        totalEquity: stmt.totalEquity
      })),
      cashFlowStatement: cashFlowStatements.map(stmt => ({
        period: `${stmt.periodStart} - ${stmt.periodEnd}`,
        currency: stmt.currency,
        cashFromOperations: stmt.cashFromOperations,
        cashFromInvesting: stmt.cashFromInvesting,
        cashFromFinancing: stmt.cashFromFinancing,
        netChangeInCash: stmt.netChangeInCash,
        cashBeginingBalance: stmt.cashBeginingBalance,
        cashEndingBalance: stmt.cashEndingBalance
      })),
      equityStatement: equityStatements.map(stmt => ({
        period: `${stmt.periodStart} - ${stmt.periodEnd}`,
        currency: stmt.currency,
        shareCapital: stmt.shareCapital,
        retainedEarnings: stmt.retainedEarnings,
        otherEquity: stmt.otherEquity,
        totalEquity: stmt.totalEquity
      })),
      keyMetrics: await this.calculateKeyMetrics(statements, language)
    };
  }

  private async calculateKeyMetrics(statements: PublicFinancialStatement[], language: 'en' | 'ar'): Promise<any[]> {
    const metrics = [];
    const latestIncome = statements.find(s => s.statementType === 'income_statement');
    const latestBalance = statements.find(s => s.statementType === 'balance_sheet');

    if (latestIncome && latestBalance) {
      const revenue = latestIncome.revenue || 0;
      const netIncome = latestIncome.netIncome || 0;
      const totalAssets = latestBalance.totalAssets || 0;
      const totalEquity = latestBalance.totalEquity || 0;
      const currentAssets = latestBalance.totalCurrentAssets || 0;
      const currentLiabilities = latestBalance.totalCurrentLiabilities || 0;

      metrics.push(
        {
          name: language === 'ar' ? 'هامش التشغيل' : 'Operating Margin',
          value: revenue > 0 ? ((latestIncome.operatingIncome || 0) / revenue * 100).toFixed(2) + '%' : 'N/A',
          category: 'profitability'
        },
        {
          name: language === 'ar' ? 'هامش صافي' : 'Net Margin',
          value: revenue > 0 ? (netIncome / revenue * 100).toFixed(2) + '%' : 'N/A',
          category: 'profitability'
        },
        {
          name: language === 'ar' ? 'العائد على الأصول' : 'Return on Assets',
          value: totalAssets > 0 ? (netIncome / totalAssets * 100).toFixed(2) + '%' : 'N/A',
          category: 'profitability'
        },
        {
          name: language === 'ar' ? 'العائد على حقوق الملكية' : 'Return on Equity',
          value: totalEquity > 0 ? (netIncome / totalEquity * 100).toFixed(2) + '%' : 'N/A',
          category: 'profitability'
        },
        {
          name: language === 'ar' ? 'النسبة الحالية' : 'Current Ratio',
          value: currentLiabilities > 0 ? (currentAssets / currentLiabilities).toFixed(2) : 'N/A',
          category: 'liquidity'
        }
      );
    }

    return metrics;
  }

  private async generateComparativeAnalysis(comparativeData: any[], language: 'en' | 'ar'): Promise<any> {
    return {
      multiYearComparison: comparativeData.map(data => ({
        year: data.comparisonYear,
        period: data.comparisonPeriod,
        revenue: data.revenue,
        operatingIncome: data.operatingIncome,
        netIncome: data.netIncome,
        totalAssets: data.totalAssets,
        totalEquity: data.totalEquity,
        operatingMargin: data.operatingMargin,
        netMargin: data.netMargin,
        returnOnAssets: data.returnOnAssets,
        returnOnEquity: data.returnOnEquity
      })),
      growthTrends: comparativeData.map(data => ({
        year: data.comparisonYear,
        revenueGrowth: data.revenue_growth_pct,
        profitGrowth: this.calculateGrowthTrend(comparativeData, data.comparisonYear, 'netIncome'),
        assetGrowth: this.calculateGrowthTrend(comparativeData, data.comparisonYear, 'totalAssets')
      })),
      profitabilityAnalysis: comparativeData.map(data => ({
        year: data.comparisonYear,
        operatingMargin: data.operatingMargin,
        netMargin: data.netMargin,
        grossMargin: this.calculateGrossMargin(data),
        ebitdaMargin: this.calculateEbitdaMargin(data)
      })),
      efficiencyRatios: comparativeData.map(data => ({
        year: data.comparisonYear,
        assetTurnover: this.calculateAssetTurnover(data),
        equityTurnover: this.calculateEquityTurnover(data),
        returnOnCapital: this.calculateReturnOnCapital(data)
      }))
    };
  }

  private calculateGrowthTrend(data: any[], year: number, metric: string): number | null {
    const current = data.find(d => d.comparisonYear === year);
    const previous = data.find(d => d.comparisonYear === year - 1);
    
    if (current && previous && previous[metric] && previous[metric] > 0) {
      return ((current[metric] - previous[metric]) / previous[metric] * 100);
    }
    return null;
  }

  private calculateGrossMargin(data: any): number | null {
    if (data.revenue && data.costOfGoodsSold) {
      return ((data.revenue - data.costOfGoodsSold) / data.revenue * 100);
    }
    return null;
  }

  private calculateEbitdaMargin(data: any): number | null {
    if (data.revenue && data.operatingIncome) {
      return (data.operatingIncome / data.revenue * 100);
    }
    return null;
  }

  private calculateAssetTurnover(data: any): number | null {
    if (data.revenue && data.totalAssets) {
      return (data.revenue / data.totalAssets);
    }
    return null;
  }

  private calculateEquityTurnover(data: any): number | null {
    if (data.revenue && data.totalEquity) {
      return (data.revenue / data.totalEquity);
    }
    return null;
  }

  private calculateReturnOnCapital(data: any): number | null {
    if (data.operatingIncome && data.totalAssets && data.totalLiabilities) {
      const capitalEmployed = data.totalAssets - data.totalLiabilities;
      return capitalEmployed > 0 ? (data.operatingIncome / capitalEmployed * 100) : null;
    }
    return null;
  }

  private async generateGovernanceStructure(snapshotId: string, language: 'en' | 'ar'): Promise<any> {
    // This would fetch from ipo_governance_structure table
    return {
      boardComposition: {
        totalMembers: 9,
        independentDirectors: 7,
        executiveDirectors: 2,
        femaleDirectors: 3,
        averageExperience: '15 years',
        boardMeetingsPerYear: 8
      },
      independenceMetrics: {
        independenceRatio: '78%',
        auditCommitteeIndependence: '100%',
        compensationCommitteeIndependence: '100%',
        nominationCommitteeIndependence: '100%'
      },
      committeeStructure: {
        auditCommittee: {
          members: 3,
          chair: 'Independent Director',
          meetingsPerYear: 4,
          charterApproved: true
        },
        compensationCommittee: {
          members: 3,
          chair: 'Independent Director',
          meetingsPerYear: 3,
          charterApproved: true
        },
        nominationCommittee: {
          members: 3,
          chair: 'Independent Director',
          meetingsPerYear: 2,
          charterApproved: true
        }
      },
      executiveCompensation: {
        baseSalary: 'Competitive',
        performanceBonus: '20% of base',
        equityCompensation: 'Stock options',
        longTermIncentives: 'Performance shares',
        compensationPhilosophy: 'Pay for performance'
      },
      internalControls: {
        controlFramework: 'COSO',
        soxCompliance: 'Yes',
        internalAuditFunction: 'Independent',
        externalAuditor: 'Big 4 Firm',
        controlEffectiveness: 'Effective'
      }
    };
  }

  private async generateRiskFactors(snapshotId: string, language: 'en' | 'ar'): Promise<any> {
    // This would fetch from ipo_risk_disclosures table
    return {
      identifiedRisks: [
        {
          category: language === 'ar' ? 'مخاطر السوق' : 'Market Risk',
          level: 'medium',
          description: language === 'ar' 
            ? 'تقلبات السوق قد تؤثر على أداء الأعمال'
            : 'Market volatility may impact business performance',
          potentialImpact: language === 'ar' ? 'متوسط' : 'Medium'
        },
        {
          category: language === 'ar' ? 'مخاطر التشغيل' : 'Operational Risk',
          level: 'low',
          description: language === 'ar'
            ? 'مخاطر تشغيلية قياسية في صناعتنا'
            : 'Standard operational risks in our industry',
          potentialImpact: language === 'ar' ? 'منخفض' : 'Low'
        },
        {
          category: language === 'ar' ? 'مخاطر تنظيمية' : 'Regulatory Risk',
          level: 'medium',
          description: language === 'ar'
            ? 'التغيرات التنظيمية قد تتطلب تكيف'
            : 'Regulatory changes may require adaptation',
          potentialImpact: language === 'ar' ? 'متوسط' : 'Medium'
        }
      ],
      mitigationStrategies: [
        {
          risk: language === 'ar' ? 'مخاطر السوق' : 'Market Risk',
          strategy: language === 'ar'
            ? 'التحوط الاستراتيجي وتنيفع المحافظ'
            : 'Strategic hedging and portfolio diversification'
        },
        {
          risk: language === 'ar' ? 'مخاطر التشغيل' : 'Operational Risk',
          strategy: language === 'ar'
            ? 'أنظمة إدارة جودة وعمليات موحدة'
            : 'Quality management systems and standardized processes'
        },
        {
          risk: language === 'ar' ? 'مخاطر تنظيمية' : 'Regulatory Risk',
          strategy: language === 'ar'
            ? 'فريق امتثال متخصص ومراقبة مستمرة'
            : 'Specialized compliance team and continuous monitoring'
        }
      ],
      regulatoryCompliance: [
        {
          regulation: 'SOX Compliance',
          status: 'Compliant',
          lastAudit: '2024-06-01'
        },
        {
          regulation: 'GDPR',
          status: 'Compliant',
          lastAudit: '2024-05-15'
        },
        {
          regulation: 'Local Regulations',
          status: 'Compliant',
          lastAudit: '2024-07-01'
        }
      ],
      industrySpecificRisks: [
        {
          risk: language === 'ar' ? 'مخاطر التكنولوجيا' : 'Technology Risk',
          mitigation: language === 'ar'
            ? 'استثمار مستمر في البحث والتطوير'
            : 'Continuous investment in R&D'
        },
        {
          risk: language === 'ar' ? 'مخاطر المنافسة' : 'Competition Risk',
          mitigation: language === 'ar'
            ? 'الابتكار والتميز في الخدمات'
            : 'Innovation and service differentiation'
        }
      ]
    };
  }

  private async generateDisclosureChecklist(snapshotId: string, language: 'en' | 'ar'): Promise<any> {
    // This would fetch from ipo_disclosure_checklist table
    return {
      completedItems: [
        {
          category: language === 'ar' ? 'المعلومات المالية' : 'Financial Information',
          item: language === 'ar' ? 'البيانات المالية المدققة' : 'Audited Financial Statements',
          status: 'completed',
          completionDate: '2024-06-15'
        },
        {
          category: language === 'ar' ? 'معلومات الشركة' : 'Company Information',
          item: language === 'ar' ? 'هيكل الملكية' : 'Ownership Structure',
          status: 'completed',
          completionDate: '2024-06-20'
        }
      ],
      pendingItems: [
        {
          category: language === 'ar' ? 'المعلومات القانونية' : 'Legal Information',
          item: language === 'ar' ? 'المقاضيات الجارية' : 'Pending Litigations',
          status: 'pending',
          dueDate: '2024-08-01'
        }
      ],
      complianceStatus: language === 'ar' ? 'متوافق بنسبة 85%' : '85% Compliant',
      nextSteps: language === 'ar' ? [
        'إكمال العناصر المعلقة',
        'مراجعة نهائية من المستشار القانوني',
        'تقديم للجهات التنظيمية'
      ] : [
        'Complete pending items',
        'Final legal review',
        'Regulatory submission'
      ]
    };
  }

  private async generateAppendix(snapshotId: string, language: 'en' | 'ar'): Promise<any> {
    // This would fetch from ipo_financial_metrics and other tables
    return {
      financialMetrics: [
        {
          name: language === 'ar' ? 'النمو السنوي المركب' : 'CAGR',
          value: '25%',
          period: '3 years'
        },
        {
          name: language === 'ar' ? 'هامش التشغيل' : 'Operating Margin',
          value: '18%',
          period: 'Latest'
        }
      ],
      industryBenchmarks: [
        {
          metric: language === 'ar' ? 'هامش التشغيل' : 'Operating Margin',
          industry: '15%',
          company: '18%',
          performance: language === 'ar' ? 'أفضل من الصناعة' : 'Above Industry'
        },
        {
          metric: language === 'ar' ? 'العائد على حقوق الملكية' : 'ROE',
          industry: '12%',
          company: '16%',
          performance: language === 'ar' ? 'أفضل من الصناعة' : 'Above Industry'
        }
      ],
      auditReports: [
        {
          type: language === 'ar' ? 'تقرير التدقيق السنوي' : 'Annual Audit Report',
          date: '2024-06-15',
          auditor: 'Big 4 Firm',
          opinion: language === 'ar' ? 'نظري نظيف' : 'Unqualified Opinion'
        }
      ],
      legalDocuments: [
        {
          type: language === 'ar' ? 'عقد التأسيس' : 'Articles of Incorporation',
          date: '2015-01-01',
          status: language === 'ar' ? 'ساري' : 'Active'
        }
      ]
    };
  }
}
