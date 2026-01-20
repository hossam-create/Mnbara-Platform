import { GroupHoldingService, GroupEntity, EntityMapping, ConsolidationSnapshot } from './GroupHoldingService';
import { ConsolidationEngine, ConsolidationResult } from './ConsolidationEngine';

export interface GroupConsolidationPackContent {
  executiveSummary: {
    groupOverview: string;
    consolidationHighlights: string[];
    entityStructure: string;
    financialHighlights: string[];
    keyMetrics: string[];
  };
  groupStructure: {
    parentEntity: any;
    subsidiaries: any[];
    associates: any[];
    jointVentures: any[];
    ownershipChart: any;
  };
  consolidatedFinancials: {
    incomeStatement: any;
    balanceSheet: any;
    cashFlowStatement: any;
    equityStatement: any;
    keyRatios: any[];
  };
  entityPerformance: {
    performanceComparison: any[];
    contributionAnalysis: any[];
    profitabilityRanking: any[];
    efficiencyMetrics: any[];
  };
  consolidationDetails: {
    eliminationEntries: any[];
    intercompanyTransactions: any[];
    minorityInterest: any;
    goodwillAnalysis: any;
    currencyTranslation: any;
  };
  governanceAndControl: {
    groupGovernance: any;
    entityLevelControls: any[];
    consolidationPolicies: any[];
    complianceStatus: any;
  };
  analyticsAndInsights: {
    trendAnalysis: any[];
    performanceDrivers: any[];
    riskFactors: any[];
    opportunities: any[];
  };
  appendix: {
    detailedSchedules: any[];
    supportingDocuments: any[];
    auditReports: any[];
    regulatoryFilings: any[];
  };
}

export class GroupPackGenerator {
  private groupService: GroupHoldingService;
  private consolidationEngine: ConsolidationEngine;

  constructor() {
    this.groupService = new GroupHoldingService();
    this.consolidationEngine = new ConsolidationEngine();
  }

  async generateConsolidationPack(
    snapshotId: string,
    language: 'en' | 'ar' = 'en'
  ): Promise<GroupConsolidationPackContent> {
    const snapshot = await this.groupService.getConsolidationSnapshot(snapshotId);
    const groupEntity = await this.groupService.getGroupEntity(snapshot.groupId);
    const entityMappings = await this.groupService.getEntityMappings(snapshot.groupId);
    const intercompanyTransactions = await this.groupService.getIntercompanyTransactions(snapshot.groupId);
    const groupSummary = await this.groupService.getGroupConsolidationSummary(snapshot.groupId);
    const entityPerformance = await this.groupService.getEntityPerformanceComparison(snapshot.groupId);

    return {
      executiveSummary: await this.generateExecutiveSummary(groupEntity, snapshot, entityMappings, groupSummary, language),
      groupStructure: await this.generateGroupStructure(groupEntity, entityMappings, language),
      consolidatedFinancials: await this.generateConsolidatedFinancials(snapshotId, language),
      entityPerformance: await this.generateEntityPerformance(entityPerformance, language),
      consolidationDetails: await this.generateConsolidationDetails(snapshotId, intercompanyTransactions, language),
      governanceAndControl: await this.generateGovernanceAndControl(snapshot.groupId, language),
      analyticsAndInsights: await this.generateAnalyticsAndInsights(snapshotId, entityPerformance, language),
      appendix: await this.generateAppendix(snapshotId, language)
    };
  }

  private async generateExecutiveSummary(
    groupEntity: GroupEntity,
    snapshot: ConsolidationSnapshot,
    entityMappings: EntityMapping[],
    groupSummary: any[],
    language: 'en' | 'ar'
  ): Promise<any> {
    const summary = groupSummary[0] || {};
    
    return {
      groupOverview: language === 'ar'
        ? `مجموعة ${groupEntity.groupName} هي مجموعة متنوعة الأنشطة مع ${summary.total_entities || 0} كيان تابع، تعمل في قطاعات متعددة مع وجود استراتيجي في السوق.`
        : `${groupEntity.groupName} Group is a diversified group with ${summary.total_entities || 0} entities, operating across multiple sectors with strategic market presence.`,
      consolidationHighlights: language === 'ar' ? [
        `إجمالي الكيانات: ${summary.total_entities || 0}`,
        `شركات تابعة: ${summary.subsidiary_entities || 0}`,
        `شركات شقيقة: ${summary.associate_entities || 0}`,
        `طريقة الدمج: ${groupEntity.consolidationMethod}`,
        `آخر دمج: ${summary.last_consolidation_date || 'N/A'}`
      ] : [
        `Total Entities: ${summary.total_entities || 0}`,
        `Subsidiaries: ${summary.subsidiary_entities || 0}`,
        `Associates: ${summary.associate_entities || 0}`,
        `Consolidation Method: ${groupEntity.consolidationMethod}`,
        `Last Consolidation: ${summary.last_consolidation_date || 'N/A'}`
      ],
      entityStructure: language === 'ar'
        ? `الهيكل التنظيمي للمجموعة يشمل شركة قابضة وعدة كيانات تابعة وشركات شقيقة، مع نسب ملكية متنوعة تتراوح بين الأقلية والسيطرة الكاملة.`
        : 'The group structure includes a holding company with multiple subsidiaries and associates, with ownership percentages ranging from minority to full control.',
      financialHighlights: language === 'ar' ? [
        `الإيرادات المجمعة: ${this.formatCurrency(summary.total_consolidated_revenue || 0, snapshot.currency)}`,
        `صافي الدخل المجمع: ${this.formatCurrency(summary.total_consolidated_income || 0, snapshot.currency)}`,
        `إجمالي الأصول المجمعة: ${this.formatCurrency(summary.total_consolidated_assets || 0, snapshot.currency)}`,
        `إجمالي حقوق الملكية المجمعة: ${this.formatCurrency(summary.total_consolidated_equity || 0, snapshot.currency)}`
      ] : [
        `Consolidated Revenue: ${this.formatCurrency(summary.total_consolidated_revenue || 0, snapshot.currency)}`,
        `Consolidated Net Income: ${this.formatCurrency(summary.total_consolidated_income || 0, snapshot.currency)}`,
        `Consolidated Total Assets: ${this.formatCurrency(summary.total_consolidated_assets || 0, snapshot.currency)}`,
        `Consolidated Total Equity: ${this.formatCurrency(summary.total_consolidated_equity || 0, snapshot.currency)}`
      ],
      keyMetrics: language === 'ar' ? [
        `نسبة الملكية الإجمالية: ${summary.total_ownership_percentage || 0}%`,
        `عدد كيانات الدمج: ${summary.consolidation_snapshots || 0}`,
        `بيانات مالية مجمعة: ${summary.consolidated_statements || 0}`,
        `مؤشرات الأداء الرئيسية: ${summary.group_kpis || 0}`
      ] : [
        `Total Ownership Percentage: ${summary.total_ownership_percentage || 0}%`,
        `Consolidation Snapshots: ${summary.consolidation_snapshots || 0}`,
        `Consolidated Statements: ${summary.consolidated_statements || 0}`,
        `Group KPIs: ${summary.group_kpis || 0}`
      ]
    };
  }

  private async generateGroupStructure(
    groupEntity: GroupEntity,
    entityMappings: EntityMapping[],
    language: 'en' | 'ar'
  ): Promise<any> {
    const subsidiaries = entityMappings.filter(em => em.entityType === 'subsidiary');
    const associates = entityMappings.filter(em => em.entityType === 'associate');
    const jointVentures = entityMappings.filter(em => em.entityType === 'joint_venture');
    const parentEntity = entityMappings.find(em => em.entityType === 'parent');

    return {
      parentEntity: parentEntity ? {
        businessAccountId: parentEntity.businessAccountId,
        entityType: parentEntity.entityType,
        ownershipPercentage: parentEntity.ownershipPercentage,
        votingRightsPercentage: parentEntity.votingRightsPercentage,
        controlPercentage: parentEntity.controlPercentage,
        consolidationMethod: parentEntity.consolidationMethod
      } : null,
      subsidiaries: subsidiaries.map(s => ({
        businessAccountId: s.businessAccountId,
        entityType: s.entityType,
        ownershipPercentage: s.ownershipPercentage,
        votingRightsPercentage: s.votingRightsPercentage,
        controlPercentage: s.controlPercentage,
        consolidationMethod: s.consolidationMethod,
        effectiveDate: s.effectiveDate
      })),
      associates: associates.map(a => ({
        businessAccountId: a.businessAccountId,
        entityType: a.entityType,
        ownershipPercentage: a.ownershipPercentage,
        votingRightsPercentage: a.votingRightsPercentage,
        controlPercentage: a.controlPercentage,
        consolidationMethod: a.consolidationMethod,
        effectiveDate: a.effectiveDate
      })),
      jointVentures: jointVentures.map(jv => ({
        businessAccountId: jv.businessAccountId,
        entityType: jv.entityType,
        ownershipPercentage: jv.ownershipPercentage,
        votingRightsPercentage: jv.votingRightsPercentage,
        controlPercentage: jv.controlPercentage,
        consolidationMethod: jv.consolidationMethod,
        effectiveDate: jv.effectiveDate
      })),
      ownershipChart: {
        groupLevel: {
          name: groupEntity.groupName,
          type: 'holding',
          ownership: 100
        },
        entities: entityMappings.map(em => ({
          businessAccountId: em.businessAccountId,
          entityType: em.entityType,
          ownershipPercentage: em.ownershipPercentage,
          level: this.calculateOwnershipLevel(em.entityType)
        }))
      }
    };
  }

  private async generateConsolidatedFinancials(snapshotId: string, language: 'en' | 'ar'): Promise<any> {
    // This would fetch from consolidated_financial_statements table
    // For now, return a placeholder structure
    return {
      incomeStatement: {
        period: 'FY 2024',
        currency: 'USD',
        consolidatedRevenue: 100000000,
        consolidatedCostOfGoodsSold: 60000000,
        consolidatedGrossProfit: 40000000,
        consolidatedOperatingExpenses: 25000000,
        consolidatedOperatingIncome: 15000000,
        consolidatedInterestExpense: 2000000,
        consolidatedInterestIncome: 500000,
        consolidatedOtherIncomeExpense: 1000000,
        consolidatedProfitBeforeTax: 14500000,
        consolidatedTaxExpense: 3600000,
        consolidatedNetIncome: 10900000,
        consolidatedEarningsPerShare: 2.18,
        minorityInterestExpense: 1200000
      },
      balanceSheet: {
        period: 'FY 2024',
        currency: 'USD',
        consolidatedCashAndEquivalents: 15000000,
        consolidatedAccountsReceivable: 25000000,
        consolidatedInventory: 30000000,
        consolidatedOtherCurrentAssets: 5000000,
        consolidatedTotalCurrentAssets: 75000000,
        consolidatedPropertyPlantEquipment: 120000000,
        consolidatedIntangibleAssets: 20000000,
        consolidatedGoodwill: 15000000,
        consolidatedOtherNonCurrentAssets: 10000000,
        consolidatedTotalAssets: 240000000,
        consolidatedAccountsPayable: 20000000,
        consolidatedShortTermDebt: 15000000,
        consolidatedOtherCurrentLiabilities: 5000000,
        consolidatedTotalCurrentLiabilities: 40000000,
        consolidatedLongTermDebt: 80000000,
        consolidatedOtherNonCurrentLiabilities: 10000000,
        consolidatedTotalLiabilities: 130000000,
        consolidatedShareCapital: 50000000,
        consolidatedRetainedEarnings: 45000000,
        consolidatedOtherEquity: 3000000,
        consolidatedMinorityInterest: 12000000,
        consolidatedTotalEquity: 110000000
      },
      cashFlowStatement: {
        period: 'FY 2024',
        currency: 'USD',
        consolidatedCashFromOperations: 18000000,
        consolidatedCashFromInvesting: -25000000,
        consolidatedCashFromFinancing: 12000000,
        consolidatedNetChangeInCash: 5000000,
        consolidatedCashBeginingBalance: 10000000,
        consolidatedCashEndingBalance: 15000000
      },
      equityStatement: {
        period: 'FY 2024',
        currency: 'USD',
        consolidatedShareCapital: 50000000,
        consolidatedRetainedEarnings: 45000000,
        consolidatedOtherEquity: 3000000,
        consolidatedTotalEquity: 110000000
      },
      keyRatios: [
        {
          name: language === 'ar' ? 'هامش التشغيل' : 'Operating Margin',
          value: 15.0,
          category: 'profitability'
        },
        {
          name: language === 'ar' ? 'هامش صافي' : 'Net Margin',
          value: 10.9,
          category: 'profitability'
        },
        {
          name: language === 'ar' ? 'العائد على الأصول' : 'Return on Assets',
          value: 4.5,
          category: 'profitability'
        },
        {
          name: language === 'ar' ? 'العائد على حقوق الملكية' : 'Return on Equity',
          value: 9.9,
          category: 'profitability'
        },
        {
          name: language === 'ar' ? 'النسبة الحالية' : 'Current Ratio',
          value: 1.88,
          category: 'liquidity'
        },
        {
          name: language === 'ar' ? 'نسبة الديون إلى حقوق الملكية' : 'Debt to Equity',
          value: 0.73,
          category: 'solvency'
        }
      ]
    };
  }

  private async generateEntityPerformance(entityPerformance: any[], language: 'en' | 'ar'): Promise<any> {
    return {
      performanceComparison: entityPerformance.map(entity => ({
        businessAccountId: entity.business_account_id,
        entityName: entity.entity_name,
        entityType: entity.entity_type,
        ownershipPercentage: entity.ownership_percentage,
        consolidatedRevenue: entity.consolidated_revenue,
        consolidatedNetIncome: entity.consolidated_net_income,
        consolidatedTotalAssets: entity.consolidated_total_assets,
        consolidatedTotalEquity: entity.consolidated_total_equity,
        netMargin: entity.net_margin,
        returnOnAssets: entity.return_on_assets,
        returnOnEquity: entity.return_on_equity,
        revenueRank: entity.revenue_rank,
        profitabilityRank: entity.profitability_rank
      })),
      contributionAnalysis: entityPerformance.map(entity => ({
        businessAccountId: entity.business_account_id,
        entityName: entity.entity_name,
        revenueContribution: this.calculateContribution(
          entity.consolidated_revenue,
          entityPerformance.reduce((sum, e) => sum + (e.consolidated_revenue || 0), 0)
        ),
        profitContribution: this.calculateContribution(
          entity.consolidated_net_income,
          entityPerformance.reduce((sum, e) => sum + (e.consolidated_net_income || 0), 0)
        ),
        assetContribution: this.calculateContribution(
          entity.consolidated_total_assets,
          entityPerformance.reduce((sum, e) => sum + (e.consolidated_total_assets || 0), 0)
        )
      })),
      profitabilityRanking: entityPerformance
        .filter(entity => entity.consolidated_net_income > 0)
        .sort((a, b) => (b.consolidated_net_income || 0) - (a.consolidated_net_income || 0))
        .map((entity, index) => ({
          rank: index + 1,
          businessAccountId: entity.business_account_id,
          entityName: entity.entity_name,
          netIncome: entity.consolidated_net_income,
          netMargin: entity.net_margin,
          returnOnEquity: entity.return_on_equity
        })),
      efficiencyMetrics: entityPerformance.map(entity => ({
        businessAccountId: entity.business_account_id,
        entityName: entity.entity_name,
        assetTurnover: entity.consolidated_total_assets > 0 ? 
          (entity.consolidated_revenue || 0) / entity.consolidated_total_assets : 0,
        equityTurnover: entity.consolidated_total_equity > 0 ? 
          (entity.consolidated_revenue || 0) / entity.consolidated_total_equity : 0,
        operatingEfficiency: entity.consolidated_revenue > 0 ? 
          ((entity.consolidated_revenue - (entity.consolidated_cost_of_goods_sold || 0)) / entity.consolidated_revenue) * 100 : 0
      }))
    };
  }

  private async generateConsolidationDetails(
    snapshotId: string,
    intercompanyTransactions: any[],
    language: 'en' | 'ar'
  ): Promise<any> {
    return {
      eliminationEntries: intercompanyTransactions.map(transaction => ({
        transactionId: transaction.transactionId,
        sourceEntityId: transaction.sourceEntityId,
        targetEntityId: transaction.targetEntityId,
        transactionType: transaction.transactionType,
        eliminationMethod: transaction.eliminationMethod,
        eliminationPercentage: transaction.eliminationPercentage,
        isEliminated: transaction.isEliminated,
        eliminationDate: transaction.eliminationDate
      })),
      intercompanyTransactions: intercompanyTransactions.map(transaction => ({
        id: transaction.id,
        sourceEntityId: transaction.sourceEntityId,
        targetEntityId: transaction.targetEntityId,
        transactionType: transaction.transactionType,
        amount: this.formatCurrency(1000000, 'USD'), // Placeholder
        currency: 'USD',
        date: transaction.createdAt,
        status: transaction.isEliminated ? 
          (language === 'ar' ? 'تم إلغاؤه' : 'Eliminated') : 
          (language === 'ar' ? 'معلق' : 'Pending')
      })),
      minorityInterest: {
        totalMinorityInterest: 12000000,
        entitiesWithMinorityInterest: 3,
        averageMinorityPercentage: 25.5,
        minorityInterestExpense: 1200000,
        calculationMethod: language === 'ar' ? 
          'نسبة الأقلية × صافي الدخل' : 'Minority Percentage × Net Income'
      },
      goodwillAnalysis: {
        totalGoodwill: 15000000,
        goodwillByEntity: [
          { entityId: 'entity1', goodwill: 8000000, acquisitionDate: '2022-01-15' },
          { entityId: 'entity2', goodwill: 7000000, acquisitionDate: '2023-06-20' }
        ],
        impairmentTesting: language === 'ar' ? 'مكتمل' : 'Completed',
        lastImpairmentTest: '2024-12-31'
      },
      currencyTranslation: {
        consolidationCurrency: 'USD',
        translationMethods: {
          'EUR': 'Closing Rate',
          'AED': 'Closing Rate',
          'GBP': 'Average Rate'
        },
        translationAdjustments: 2500000,
        translationGainLoss: -150000
      }
    };
  }

  private async generateGovernanceAndControl(groupId: string, language: 'en' | 'ar'): Promise<any> {
    return {
      groupGovernance: {
        governanceStructure: language === 'ar' ? 'مركزي' : 'Centralized',
        boardComposition: {
          totalMembers: 12,
          independentDirectors: 8,
          executiveDirectors: 4,
          femaleDirectors: 3
        },
        consolidationPolicies: [
          language === 'ar' ? 'سياسة الدمج الكامل' : 'Full Consolidation Policy',
          language === 'ar' ? 'سياسة ترجمة العملات' : 'Currency Translation Policy',
          language === 'ar' ? 'سياسة القضاء على المعاملات بين الشركات' : 'Intercompany Elimination Policy'
        ],
        approvalWorkflow: language === 'ar' ? 
          'مدير الكيان → مدير الدمج → CFO → مجلس الإدارة' : 
          'Entity Manager → Consolidation Manager → CFO → Board'
      },
      entityLevelControls: [
        {
          entityId: 'entity1',
          controlFramework: 'COSO',
          lastAssessment: '2024-12-15',
          effectiveness: 'Effective',
          keyControls: [
            'Financial Reporting Controls',
            'Segregation of Duties',
            'Management Review'
          ]
        },
        {
          entityId: 'entity2',
          controlFramework: 'COSO',
          lastAssessment: '2024-12-10',
          effectiveness: 'Needs Improvement',
          keyControls: [
            'Financial Reporting Controls',
            'Access Controls',
            'Change Management'
          ]
        }
      ],
      consolidationPolicies: [
        {
          policyName: language === 'ar' ? 'سياسة الدمج' : 'Consolidation Policy',
          description: language === 'ar' ? 
            'جميع الكيانات التي تزيد نسبة الملكية فيها عن 50% يتم دمجها بالكامل' :
            'All entities with ownership > 50% are fully consolidated',
          effectiveDate: '2023-01-01',
          lastReviewed: '2024-12-01'
        },
        {
          policyName: language === 'ar' ? 'سياسة ترجمة العملات' : 'Currency Translation Policy',
          description: language === 'ar' ? 
            'يتم استخدام سعر الإقفال للأصول والخصوم ومتوسط السعر للدخل والمصروفات' :
            'Closing rate for assets/liabilities, average rate for income/expenses',
          effectiveDate: '2023-01-01',
          lastReviewed: '2024-12-01'
        }
      ],
      complianceStatus: {
        overallCompliance: 'Compliant',
        lastAuditDate: '2024-11-30',
        auditFindings: 2,
        criticalFindings: 0,
        remediationStatus: 'In Progress'
      }
    };
  }

  private async generateAnalyticsAndInsights(snapshotId: string, entityPerformance: any[], language: 'en' | 'ar'): Promise<any> {
    return {
      trendAnalysis: [
        {
          metric: language === 'ar' ? 'الإيرادات المجمعة' : 'Consolidated Revenue',
          trend: 'increasing',
          growthRate: 12.5,
          period: '3 years',
          drivers: [
            'Organic Growth',
            'Acquisition Impact',
            'Market Expansion'
          ]
        },
        {
          metric: language === 'ar' ? 'هامش التشغيل' : 'Operating Margin',
          trend: 'stable',
          growthRate: 0.5,
          period: '3 years',
          drivers: [
            'Cost Management',
            'Operational Efficiency',
            'Pricing Strategy'
          ]
        }
      ],
      performanceDrivers: [
        {
          driver: language === 'ar' ? 'النمو العضوي' : 'Organic Growth',
          impact: 'high',
          contributingEntities: ['entity1', 'entity3'],
          recommendations: language === 'ar' ? 
            'زيادة الاستثمار في الكيانات عالية الأداء' :
            'Increase investment in high-performing entities'
        },
        {
          driver: language === 'ar' ? 'التحسين التشغيلي' : 'Operational Improvement',
          impact: 'medium',
          contributingEntities: ['entity2', 'entity4'],
          recommendations: language === 'ar' ? 
            'تنفيذ مبادرات تحسين التكاليف' :
            'Implement cost improvement initiatives'
        }
      ],
      riskFactors: [
        {
          risk: language === 'ar' ? 'مخاطر العملة' : 'Currency Risk',
          level: 'medium',
          impact: language === 'ar' ? 
            'قد يؤثر ترجمة العملات على الأرباح المجمعة' :
            'Currency translation may impact consolidated profits',
          mitigation: language === 'ar' ? 
            'استخدام أدوات التحوط المناسبة' :
            'Use appropriate hedging instruments'
        },
        {
          risk: language === 'ar' ? 'مخاطر التكامل' : 'Integration Risk',
          level: 'low',
          impact: language === 'ar' ? 
            'تحديات في دمج الكيانات المكتسبة حديثاً' :
            'Challenges in integrating recently acquired entities',
          mitigation: language === 'ar' ? 
            'خطة تكامل منظمة ومراقبة مستمرة' :
            'Structured integration plan and ongoing monitoring'
        }
      ],
      opportunities: [
        {
          opportunity: language === 'ar' ? 'تحقيق وفورات الحجم' : 'Synergy Realization',
          potential: 5000000,
          timeframe: '12-18 months',
          description: language === 'ar' ? 
            'تحقيق وفورات من خلال التكامل المركزي للمشتريات والعمليات' :
            'Achieve savings through centralized procurement and operations integration'
        },
        {
          opportunity: language === 'ar' ? 'تحسين هيكل رأس المال' : 'Capital Structure Optimization',
          potential: 3000000,
          timeframe: '6-12 months',
          description: language === 'ar' ? 
            'إعادة هيكل الديون والملكية لتحسين تكلفة رأس المال' :
            'Restructuring debt and equity to improve cost of capital'
        }
      ]
    };
  }

  private async generateAppendix(snapshotId: string, language: 'en' | 'ar'): Promise<any> {
    return {
      detailedSchedules: [
        {
          scheduleName: language === 'ar' ? 'جدول الإيرادات المفصل' : 'Detailed Revenue Schedule',
          description: language === 'ar' ? 
            'تحليل الإيرادات حسب الكيان والمنتج والمنطقة الجغرافية' :
            'Revenue analysis by entity, product line, and geography',
          pages: 15
        },
        {
          scheduleName: language === 'ar' ? 'جدود الاستحقاق' : 'Aging Schedules',
          description: language === 'ar' ? 
            'تحليل المديونية والدائنة حسب الفئات العمرية' :
            'Analysis of receivables and payables by aging categories',
          pages: 8
        }
      ],
      supportingDocuments: [
        {
          documentType: language === 'ar' ? 'البيانات المالية للكيانات' : 'Entity Financial Statements',
          description: language === 'ar' ? 
            'البيانات المالية المدققة لجميع الكيانات المجمعة' :
            'Audited financial statements for all consolidated entities',
          count: 5
        },
        {
          documentType: language === 'ar' ? 'اتفاقيات الدمج' : 'Consolidation Agreements',
          description: language === 'ar' ? 
            'الاتفاقيات القانونية والتنظيمية للدمج' :
            'Legal and regulatory agreements for consolidation',
          count: 3
        }
      ],
      auditReports: [
        {
          reportType: language === 'ar' ? 'تقرير تدقيق المجموعة' : 'Group Audit Report',
          auditor: 'Big 4 Firm',
          date: '2024-12-31',
          opinion: language === 'ar' ? 'نظري نظيف' : 'Unqualified Opinion'
        }
      ],
      regulatoryFilings: [
        {
          filingType: language === 'ar' ? 'إفادات تنظيمية' : 'Regulatory Filings',
          jurisdiction: 'UAE',
          lastFiling: '2024-03-31',
          status: language === 'ar' ? 'مكتمل' : 'Completed'
        }
      ]
    };
  }

  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  private calculateContribution(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0;
  }

  private calculateOwnershipLevel(entityType: string): number {
    const levels: Record<string, number> = {
      'parent': 0,
      'subsidiary': 1,
      'associate': 2,
      'joint_venture': 2
    };
    return levels[entityType] || 3;
  }
}
