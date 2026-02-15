import { MultiCountryTaxService, CountryTaxConfig, TaxExposureAnalysis } from './MultiCountryTaxService';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const TaxComplianceReportSchema = z.object({
  businessAccountId: z.string().uuid(),
  countryId: z.string().uuid(),
  reportType: z.string().min(1).max(100),
  reportPeriodStart: z.string().datetime(),
  reportPeriodEnd: z.string().datetime(),
  dueDate: z.string().datetime(),
  reportData: z.record(z.any()).default({}),
  calculatedTaxLiability: z.number().min(0),
  paidAmount: z.number().min(0),
  balanceDue: z.number().min(0),
  penalties: z.number().min(0),
  interestCharges: z.number().min(0),
  supportingDocuments: z.array(z.any()).default([]),
  complianceNotes: z.string().optional(),
  createdBy: z.string().uuid()
});

export interface TaxComplianceReport {
  id: string;
  businessAccountId: string;
  countryId: string;
  reportType: string;
  reportPeriodStart: Date;
  reportPeriodEnd: Date;
  filingDate?: Date;
  dueDate: Date;
  status: string;
  reportData: Record<string, any>;
  calculatedTaxLiability: number;
  paidAmount: number;
  balanceDue: number;
  penalties: number;
  interestCharges: number;
  supportingDocuments: any[];
  complianceNotes?: string;
  auditTrail: any[];
  submittedBy?: string;
  approvedBy?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxReportTemplate {
  id: string;
  countryId: string;
  reportType: string;
  templateName: string;
  templateStructure: any;
  requiredFields: string[];
  optionalFields: string[];
  validationRules: any[];
  language: 'en' | 'ar';
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedTaxReport {
  reportId: string;
  reportType: string;
  country: string;
  period: string;
  currency: string;
  generatedAt: Date;
  content: {
    executiveSummary: any;
    financialData: any;
    taxCalculations: any;
    complianceStatus: any;
    supportingSchedules: any[];
    recommendations: any[];
  };
  format: 'json' | 'pdf' | 'excel';
  language: 'en' | 'ar';
}

export class TaxComplianceReportsService {
  private taxService: MultiCountryTaxService;

  constructor() {
    this.taxService = new MultiCountryTaxService();
  }

  // Tax Compliance Reports Management
  async createComplianceReport(data: z.infer<typeof TaxComplianceReportSchema>): Promise<TaxComplianceReport> {
    const validated = TaxComplianceReportSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO tax_compliance_reports (
        id,
        business_account_id,
        country_id,
        report_type,
        report_period_start,
        report_period_end,
        due_date,
        report_data,
        calculated_tax_liability,
        paid_amount,
        balance_due,
        penalties,
        interest_charges,
        supporting_documents,
        compliance_notes,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.countryId}::uuid,
        ${validated.reportType}::varchar,
        ${validated.reportPeriodStart}::date,
        ${validated.reportPeriodEnd}::date,
        ${validated.dueDate}::date,
        ${JSON.stringify(validated.reportData)}::jsonb,
        ${validated.calculatedTaxLiability}::decimal,
        ${validated.paidAmount}::decimal,
        ${validated.balanceDue}::decimal,
        ${validated.penalties}::decimal,
        ${validated.interestCharges}::decimal,
        ${JSON.stringify(validated.supportingDocuments)}::jsonb,
        ${validated.complianceNotes || null}::text,
        ${validated.createdBy}::uuid
      ) RETURNING id
    `;
    
    const reportId = (result as any)[0]?.id;
    return this.getComplianceReport(reportId);
  }

  async getComplianceReport(reportId: string): Promise<TaxComplianceReport> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        country_id as "countryId",
        report_type as "reportType",
        report_period_start as "reportPeriodStart",
        report_period_end as "reportPeriodEnd",
        filing_date as "filingDate",
        due_date as "dueDate",
        status,
        report_data as "reportData",
        calculated_tax_liability as "calculatedTaxLiability",
        paid_amount as "paidAmount",
        balance_due as "balanceDue",
        penalties,
        interest_charges as "interestCharges",
        supporting_documents as "supportingDocuments",
        compliance_notes as "complianceNotes",
        audit_trail as "auditTrail",
        submitted_by as "submittedBy",
        approved_by as "approvedBy",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM tax_compliance_reports
      WHERE id = ${reportId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getComplianceReports(businessAccountId: string, filters: {
    countryId?: string;
    reportType?: string;
    status?: string;
    dueDate?: string;
    limit?: number;
  } = {}): Promise<TaxComplianceReport[]> {
    const { countryId, reportType, status, dueDate, limit = 20 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        country_id as "countryId",
        report_type as "reportType",
        report_period_start as "reportPeriodStart",
        report_period_end as "reportPeriodEnd",
        filing_date as "filingDate",
        due_date as "dueDate",
        status,
        report_data as "reportData",
        calculated_tax_liability as "calculatedTaxLiability",
        paid_amount as "paidAmount",
        balance_due as "balanceDue",
        penalties,
        interest_charges as "interestCharges",
        supporting_documents as "supportingDocuments",
        compliance_notes as "complianceNotes",
        audit_trail as "auditTrail",
        submitted_by as "submittedBy",
        approved_by as "approvedBy",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM tax_compliance_reports
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (countryId) {
      query += ` AND country_id = ${countryId}::uuid`;
    }
    
    if (reportType) {
      query += ` AND report_type = '${reportType}'`;
    }
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    if (dueDate) {
      query += ` AND due_date >= '${dueDate}'`;
    }
    
    query += ` ORDER BY due_date DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as TaxComplianceReport[];
  }

  // Report Generation
  async generateTaxReport(
    businessAccountId: string,
    countryId: string,
    reportType: string,
    periodStart: string,
    periodEnd: string,
    language: 'en' | 'ar' = 'en',
    format: 'json' | 'pdf' | 'excel' = 'json'
  ): Promise<GeneratedTaxReport> {
    const countryConfig = await this.taxService.getCountryTaxConfig(countryId);
    const taxExposure = await this.taxService.getTaxExposureAnalyses(businessAccountId, {
      countryId,
      limit: 1
    });
    
    const reportData = await this.generateReportContent(
      businessAccountId,
      countryId,
      reportType,
      periodStart,
      periodEnd,
      language,
      countryConfig,
      taxExposure[0]
    );

    const reportId = uuidv4();
    
    return {
      reportId,
      reportType,
      country: countryConfig.countryName,
      period: `${periodStart} to ${periodEnd}`,
      currency: countryConfig.currency,
      generatedAt: new Date(),
      content: reportData,
      format,
      language
    };
  }

  private async generateReportContent(
    businessAccountId: string,
    countryId: string,
    reportType: string,
    periodStart: string,
    periodEnd: string,
    language: 'en' | 'ar',
    countryConfig: CountryTaxConfig,
    taxExposure?: TaxExposureAnalysis
  ): Promise<any> {
    switch (reportType) {
      case 'vat_return':
        return this.generateVATReturn(businessAccountId, countryId, periodStart, periodEnd, language, countryConfig);
      
      case 'corporate_tax_return':
        return this.generateCorporateTaxReturn(businessAccountId, countryId, periodStart, periodEnd, language, countryConfig, taxExposure);
      
      case 'withholding_tax_summary':
        return this.generateWithholdingTaxSummary(businessAccountId, countryId, periodStart, periodEnd, language, countryConfig);
      
      case 'tax_exposure_analysis':
        return this.generateTaxExposureReport(businessAccountId, countryId, periodStart, periodEnd, language, countryConfig, taxExposure);
      
      case 'compliance_dashboard':
        return this.generateComplianceDashboard(businessAccountId, countryId, periodStart, periodEnd, language, countryConfig);
      
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }
  }

  private async generateVATReturn(
    businessAccountId: string,
    countryId: string,
    periodStart: string,
    periodEnd: string,
    language: 'en' | 'ar',
    countryConfig: CountryTaxConfig
  ): Promise<any> {
    const taxMappings = await this.taxService.getTransactionTaxMappings(businessAccountId, {
      countryId,
      taxType: 'vat',
      status: 'calculated'
    });

    const totalVAT = taxMappings.reduce((sum, mapping) => sum + mapping.calculatedTax, 0);
    const totalRevenue = taxMappings.reduce((sum, mapping) => sum + mapping.taxableAmount, 0);

    return {
      executiveSummary: language === 'ar' ? {
        reportTitle: 'إقرار ضريبة القيمة المضافة',
        period: `${periodStart} - ${periodEnd}`,
        country: countryConfig.countryName,
        currency: countryConfig.currency,
        totalVATLiability: totalVAT,
        totalRevenue: totalRevenue,
        effectiveVATRate: totalRevenue > 0 ? (totalVAT / totalRevenue) * 100 : 0
      } : {
        reportTitle: 'VAT Return',
        period: `${periodStart} - ${periodEnd}`,
        country: countryConfig.countryName,
        currency: countryConfig.currency,
        totalVATLiability: totalVAT,
        totalRevenue: totalRevenue,
        effectiveVATRate: totalRevenue > 0 ? (totalVAT / totalRevenue) * 100 : 0
      },
      financialData: {
        totalRevenue,
        totalVAT,
        vatRate: countryConfig.vatRate,
        taxableTransactions: taxMappings.length,
        averageVATPerTransaction: taxMappings.length > 0 ? totalVAT / taxMappings.length : 0
      },
      taxCalculations: {
        vatBreakdown: taxMappings.map(mapping => ({
          transactionId: mapping.transactionId,
          taxableAmount: mapping.taxableAmount,
          vatRate: mapping.taxRate,
          calculatedVAT: mapping.calculatedTax,
          currency: mapping.currency,
          date: mapping.createdAt
        }))
      },
      complianceStatus: {
        status: 'compliant',
        lastFilingDate: new Date().toISOString(),
        nextFilingDate: this.calculateNextFilingDate(countryConfig.filingFrequency),
        outstandingBalance: 0,
        penalties: 0
      },
      supportingSchedules: [
        {
          scheduleName: language === 'ar' ? 'جدول المعاملات الخاضعة للضريبة' : 'VAT Transaction Schedule',
          data: taxMappings.map(mapping => ({
            transactionId: mapping.transactionId,
            date: mapping.createdAt,
            description: language === 'ar' ? 'معاملة خاضعة للضريبة' : 'VAT Transaction',
            amount: mapping.taxableAmount,
            vatRate: mapping.taxRate,
            vatAmount: mapping.calculatedTax,
            currency: mapping.currency
          }))
        }
      ],
      recommendations: this.generateVATRecommendations(totalVAT, totalRevenue, language)
    };
  }

  private async generateCorporateTaxReturn(
    businessAccountId: string,
    countryId: string,
    periodStart: string,
    periodEnd: string,
    language: 'en' | 'ar',
    countryConfig: CountryTaxConfig,
    taxExposure?: TaxExposureAnalysis
  ): Promise<any> {
    const taxMappings = await this.taxService.getTransactionTaxMappings(businessAccountId, {
      countryId,
      taxType: 'corporate_tax',
      status: 'calculated'
    });

    const totalCorporateTax = taxMappings.reduce((sum, mapping) => sum + mapping.calculatedTax, 0);
    const totalIncome = taxMappings.reduce((sum, mapping) => sum + mapping.taxableAmount, 0);

    return {
      executiveSummary: language === 'ar' ? {
        reportTitle: 'إقرار ضريبة الشركات',
        period: `${periodStart} - ${periodEnd}`,
        country: countryConfig.countryName,
        currency: countryConfig.currency,
        totalCorporateTaxLiability: totalCorporateTax,
        totalIncome: totalIncome,
        effectiveTaxRate: totalIncome > 0 ? (totalCorporateTax / totalIncome) * 100 : 0,
        taxExposureScore: taxExposure?.taxExposureScore || 0,
        riskLevel: taxExposure?.riskLevel || 'low'
      } : {
        reportTitle: 'Corporate Tax Return',
        period: `${periodStart} - ${periodEnd}`,
        country: countryConfig.countryName,
        currency: countryConfig.currency,
        totalCorporateTaxLiability: totalCorporateTax,
        totalIncome: totalIncome,
        effectiveTaxRate: totalIncome > 0 ? (totalCorporateTax / totalIncome) * 100 : 0,
        taxExposureScore: taxExposure?.taxExposureScore || 0,
        riskLevel: taxExposure?.riskLevel || 'low'
      },
      financialData: {
        totalIncome,
        totalCorporateTax,
        corporateTaxRate: countryConfig.corporateTaxRate,
        taxableTransactions: taxMappings.length,
        averageTaxPerTransaction: taxMappings.length > 0 ? totalCorporateTax / taxMappings.length : 0
      },
      taxCalculations: {
        corporateTaxBreakdown: taxMappings.map(mapping => ({
          transactionId: mapping.transactionId,
          taxableIncome: mapping.taxableAmount,
          taxRate: mapping.taxRate,
          calculatedTax: mapping.calculatedTax,
          currency: mapping.currency,
          date: mapping.createdAt
        }))
      },
      complianceStatus: {
        status: taxExposure?.riskLevel === 'critical' ? 'non_compliant' : 'compliant',
        lastFilingDate: new Date().toISOString(),
        nextFilingDate: this.calculateNextFilingDate(countryConfig.filingFrequency),
        outstandingBalance: taxExposure?.outstandingTaxLiability || 0,
        penalties: taxExposure?.riskLevel === 'critical' ? 1000 : 0
      },
      supportingSchedules: [
        {
          scheduleName: language === 'ar' ? 'جدول المعاملات الخاضعة للضريبة' : 'Corporate Tax Transaction Schedule',
          data: taxMappings.map(mapping => ({
            transactionId: mapping.transactionId,
            date: mapping.createdAt,
            description: language === 'ar' ? 'معاملة خاضعة للضريبة' : 'Corporate Tax Transaction',
            taxableIncome: mapping.taxableAmount,
            taxRate: mapping.taxRate,
            taxAmount: mapping.calculatedTax,
            currency: mapping.currency
          }))
        }
      ],
      recommendations: this.generateCorporateTaxRecommendations(totalCorporateTax, totalIncome, taxExposure, language)
    };
  }

  private async generateWithholdingTaxSummary(
    businessAccountId: string,
    countryId: string,
    periodStart: string,
    periodEnd: string,
    language: 'en' | 'ar',
    countryConfig: CountryTaxConfig
  ): Promise<any> {
    const taxMappings = await this.taxService.getTransactionTaxMappings(businessAccountId, {
      countryId,
      taxType: 'withholding_tax',
      status: 'calculated'
    });

    const totalWithholdingTax = taxMappings.reduce((sum, mapping) => sum + mapping.calculatedTax, 0);
    const totalPayments = taxMappings.reduce((sum, mapping) => sum + mapping.taxableAmount, 0);

    // Group by withholding tax type
    const withholdingByType = taxMappings.reduce((groups, mapping) => {
      const type = mapping.transactionType || 'general';
      if (!groups[type]) {
        groups[type] = { total: 0, count: 0, rate: 0 };
      }
      groups[type].total += mapping.calculatedTax;
      groups[type].count += 1;
      groups[type].rate = mapping.taxRate;
      return groups;
    }, {} as Record<string, any>);

    return {
      executiveSummary: language === 'ar' ? {
        reportTitle: 'ملخص ضريبة الاستقطاع',
        period: `${periodStart} - ${periodEnd}`,
        country: countryConfig.countryName,
        currency: countryConfig.currency,
        totalWithholdingTax: totalWithholdingTax,
        totalPayments: totalPayments,
        averageWithholdingRate: totalPayments > 0 ? (totalWithholdingTax / totalPayments) * 100 : 0
      } : {
        reportTitle: 'Withholding Tax Summary',
        period: `${periodStart} - ${periodEnd}`,
        country: countryConfig.countryName,
        currency: countryConfig.currency,
        totalWithholdingTax: totalWithholdingTax,
        totalPayments: totalPayments,
        averageWithholdingRate: totalPayments > 0 ? (totalWithholdingTax / totalPayments) * 100 : 0
      },
      financialData: {
        totalPayments,
        totalWithholdingTax,
        withholdingTransactions: taxMappings.length,
        withholdingByType
      },
      taxCalculations: {
        withholdingBreakdown: taxMappings.map(mapping => ({
          transactionId: mapping.transactionId,
          paymentAmount: mapping.taxableAmount,
          withholdingRate: mapping.taxRate,
          calculatedWithholding: mapping.calculatedTax,
          currency: mapping.currency,
          date: mapping.createdAt,
          transactionType: mapping.transactionType
        }))
      },
      complianceStatus: {
        status: 'compliant',
        lastFilingDate: new Date().toISOString(),
        nextFilingDate: this.calculateNextFilingDate(countryConfig.filingFrequency),
        outstandingBalance: 0,
        penalties: 0
      },
      supportingSchedules: [
        {
          scheduleName: language === 'ar' ? 'جدول معاملات الاستقطاع' : 'Withholding Tax Schedule',
          data: taxMappings.map(mapping => ({
            transactionId: mapping.transactionId,
            date: mapping.createdAt,
            description: language === 'ar' ? 'معاملة استقطاع' : 'Withholding Transaction',
            paymentAmount: mapping.taxableAmount,
            withholdingRate: mapping.taxRate,
            withholdingAmount: mapping.calculatedTax,
            currency: mapping.currency,
            transactionType: mapping.transactionType
          }))
        }
      ],
      recommendations: this.generateWithholdingTaxRecommendations(totalWithholdingTax, totalPayments, language)
    };
  }

  private async generateTaxExposureReport(
    businessAccountId: string,
    countryId: string,
    periodStart: string,
    periodEnd: string,
    language: 'en' | 'ar',
    countryConfig: CountryTaxConfig,
    taxExposure?: TaxExposureAnalysis
  ): Promise<any> {
    return {
      executiveSummary: language === 'ar' ? {
        reportTitle: 'تحليل التعرض الضريبي',
        period: `${periodStart} - ${periodEnd}`,
        country: countryConfig.countryName,
        currency: countryConfig.currency,
        taxExposureScore: taxExposure?.taxExposureScore || 0,
        riskLevel: taxExposure?.riskLevel || 'low',
        outstandingTaxLiability: taxExposure?.outstandingTaxLiability || 0,
        estimatedTaxLiability: taxExposure?.estimatedTaxLiability || 0
      } : {
        reportTitle: 'Tax Exposure Analysis',
        period: `${periodStart} - ${periodEnd}`,
        country: countryConfig.countryName,
        currency: countryConfig.currency,
        taxExposureScore: taxExposure?.taxExposureScore || 0,
        riskLevel: taxExposure?.riskLevel || 'low',
        outstandingTaxLiability: taxExposure?.outstandingTaxLiability || 0,
        estimatedTaxLiability: taxExposure?.estimatedTaxLiability || 0
      },
      financialData: {
        totalRevenue: taxExposure?.totalRevenue || 0,
        totalExpenses: taxExposure?.totalExpenses || 0,
        taxableIncome: taxExposure?.taxableIncome || 0,
        estimatedTaxLiability: taxExposure?.estimatedTaxLiability || 0,
        paidTax: taxExposure?.paidTax || 0,
        outstandingTaxLiability: taxExposure?.outstandingTaxLiability || 0
      },
      taxCalculations: {
        exposureFactors: taxExposure?.exposureFactors || {},
        mitigationStrategies: taxExposure?.mitigationStrategies || []
      },
      complianceStatus: {
        status: taxExposure?.riskLevel === 'critical' ? 'high_risk' : 'compliant',
        lastAssessmentDate: new Date().toISOString(),
        nextAssessmentDate: this.calculateNextAssessmentDate(),
        riskFactors: taxExposure?.exposureFactors || {}
      },
      supportingSchedules: [
        {
          scheduleName: language === 'ar' ? 'جدول عوامل التعرض' : 'Exposure Factors Schedule',
          data: Object.entries(taxExposure?.exposureFactors || {}).map(([key, value]) => ({
            factor: key,
            value: value,
            impact: this.assessFactorImpact(value)
          }))
        }
      ],
      recommendations: this.generateTaxExposureRecommendations(taxExposure, language)
    };
  }

  private async generateComplianceDashboard(
    businessAccountId: string,
    countryId: string,
    periodStart: string,
    periodEnd: string,
    language: 'en' | 'ar',
    countryConfig: CountryTaxConfig
  ): Promise<any> {
    const dashboard = await this.taxService.getTaxComplianceDashboard(businessAccountId);
    
    return {
      executiveSummary: language === 'ar' ? {
        reportTitle: 'لوحة الامتثال الضريبي',
        period: `${periodStart} - ${periodEnd}`,
        country: countryConfig.countryName,
        currency: countryConfig.currency,
        overallComplianceStatus: dashboard[0]?.compliance_status || 'unknown'
      } : {
        reportTitle: 'Tax Compliance Dashboard',
        period: `${periodStart} - ${periodEnd}`,
        country: countryConfig.countryName,
        currency: countryConfig.currency,
        overallComplianceStatus: dashboard[0]?.compliance_status || 'unknown'
      },
      financialData: {
        totalTaxCalculated: dashboard[0]?.total_tax_calculated || 0,
        totalBalanceDue: dashboard[0]?.total_balance_due || 0,
        totalOverdueAmount: dashboard[0]?.total_overdue_amount || 0,
        countriesCovered: dashboard[0]?.countries_covered || 0
      },
      taxCalculations: {
        complianceMetrics: dashboard[0] || {}
      },
      complianceStatus: {
        status: dashboard[0]?.compliance_status || 'unknown',
        nextFilingDate: dashboard[0]?.next_filing_date,
        nextPaymentDate: dashboard[0]?.next_payment_date,
        overduePayments: dashboard[0]?.overdue_payments || 0,
        totalOverdueAmount: dashboard[0]?.total_overdue_amount || 0
      },
      supportingSchedules: [
        {
          scheduleName: language === 'ar' ? 'جدول الامتثال حسب البلد' : 'Compliance by Country',
          data: dashboard
        }
      ],
      recommendations: this.generateComplianceRecommendations(dashboard[0], language)
    };
  }

  // Helper Methods
  private calculateNextFilingDate(filingFrequency: string): Date {
    const now = new Date();
    
    switch (filingFrequency) {
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        return new Date(now.getFullYear(), quarter * 3, 1);
      case 'annually':
        return new Date(now.getFullYear() + 1, 0, 1);
      case 'semi_annual':
        const halfYear = now.getMonth() >= 6 ? 2 : 1;
        return new Date(now.getFullYear(), halfYear * 6, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
  }

  private calculateNextAssessmentDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 3, 1);
  }

  private assessFactorImpact(value: any): string {
    if (typeof value === 'number') {
      if (value >= 0.8) return 'high';
      if (value >= 0.5) return 'medium';
      return 'low';
    }
    return 'unknown';
  }

  private generateVATRecommendations(totalVAT: number, totalRevenue: number, language: 'en' | 'ar'): string[] {
    const recommendations = [];
    
    if (totalVAT > 0) {
      recommendations.push(language === 'ar' ? 
        'النظر في خطط دفعات ضريبة القيمة المضافة لتجنب الغرامات' : 
        'Consider VAT payment plans to avoid penalties'
      );
    }
    
    if (totalRevenue > 0 && (totalVAT / totalRevenue) > 0.15) {
      recommendations.push(language === 'ar' ? 
        'مراجعة الإعفاءات الضريبية المحتملة' : 
        'Review potential tax exemptions'
      );
    }
    
    return recommendations;
  }

  private generateCorporateTaxRecommendations(
    totalCorporateTax: number,
    totalIncome: number,
    taxExposure?: TaxExposureAnalysis,
    language: 'en' | 'ar'
  ): string[] {
    const recommendations = [];
    
    if (taxExposure?.riskLevel === 'high' || taxExposure?.riskLevel === 'critical') {
      recommendations.push(language === 'ar' ? 
        'الاستشارة بمستشار ضريبي للحد من التعرض الضريبي' : 
        'Consult tax advisor to minimize tax exposure'
      );
    }
    
    if (totalCorporateTax > 0) {
      recommendations.push(language === 'ar' ? 
        'النظر في تخطيطات دفعات ضريبة الشركات' : 
        'Consider corporate tax payment planning'
      );
    }
    
    return recommendations;
  }

  private generateWithholdingTaxRecommendations(
    totalWithholdingTax: number,
    totalPayments: number,
    language: 'en' | 'ar'
  ): string[] {
    const recommendations = [];
    
    if (totalWithholdingTax > 0) {
      recommendations.push(language === 'ar' ? 
        'التحقق من دقة معدلات الاستقطاع المطبقة' : 
        'Verify withholding tax rates applied'
      );
    }
    
    if (totalPayments > 0 && (totalWithholdingTax / totalPayments) > 0.20) {
      recommendations.push(language === 'ar' ? 
        'مراجعة اتفاقيات الازدواج المزدوجة لتقليل ضريبة الاستقطاع' : 
        'Review double taxation treaties to reduce withholding tax'
      );
    }
    
    return recommendations;
  }

  private generateTaxExposureRecommendations(
    taxExposure: TaxExposureAnalysis,
    language: 'en' | 'ar'
  ): string[] {
    const recommendations = [];
    
    if (taxExposure.riskLevel === 'critical') {
      recommendations.push(language === 'ar' ? 
        'اتخاذ إجراءات فورية للحد من التعرض الضريبي' : 
        'Take immediate action to reduce tax exposure'
      );
    }
    
    if (taxExposure.outstandingTaxLiability > 0) {
      recommendations.push(language === 'ar' ? 
        'دفع الالتزامات الضريبية المستحقة في أقرب وقت ممكن' : 
        'Pay outstanding tax liabilities as soon as possible'
      );
    }
    
    return recommendations;
  }

  private generateComplianceRecommendations(dashboard: any, language: 'en' | 'ar'): string[] {
    const recommendations = [];
    
    if (dashboard.overdue_payments > 0) {
      recommendations.push(language === 'ar' ? 
        'معالجة المدفوعات المتأخرة فوراً' : 
        'Address overdue payments immediately'
      );
    }
    
    if (dashboard.total_balance_due > 0) {
      recommendations.push(language === 'ar' ? 
        'جدولة خطة دفعات للالتزامات الضريبية' : 
        'Set up payment plans for tax liabilities'
      );
    }
    
    return recommendations;
  }
}
