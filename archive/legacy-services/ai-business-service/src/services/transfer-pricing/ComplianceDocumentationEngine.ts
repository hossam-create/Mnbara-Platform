import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const DocumentationPackSchema = z.object({
  businessAccountId: z.string().uuid(),
  documentationType: z.enum(['master_file', 'local_file', 'country_file', 'benchmark_study', 'methodology', 'adjustment_report', 'other']),
  fiscalYear: z.number(),
  countryCode: z.string().length(2).optional(),
  entityId: z.string().uuid().optional(),
  documentTitle: z.string().min(1).max(200),
  documentContent: z.string().optional(),
  documentMetadata: z.record(z.any()).default({}),
  supportingDocuments: z.array(z.any()).default([]),
  methodologyDescription: z.string().optional(),
  functionalAnalysis: z.string().optional(),
  benchmarkAnalysis: z.string().optional(),
  conclusions: z.string().optional(),
  language: z.enum(['en', 'ar']).default('en'),
  createdBy: z.string().uuid()
});

const SnapshotSchema = z.object({
  businessAccountId: z.string().uuid(),
  snapshotName: z.string().min(1).max(200),
  snapshotDescription: z.string().optional(),
  snapshotDate: z.string().date(),
  snapshotData: z.record(z.any()),
  includesSimulations: z.boolean().default(false),
  createdBy: z.string().uuid()
});

export interface DocumentationPack {
  id: string;
  businessAccountId: string;
  documentationType: string;
  fiscalYear: number;
  countryCode?: string;
  entityId?: string;
  documentTitle: string;
  documentContent?: string;
  documentMetadata: any;
  supportingDocuments: any[];
  methodologyDescription?: string;
  functionalAnalysis?: string;
  benchmarkAnalysis?: string;
  conclusions?: string;
  status: string;
  approvedBy?: string;
  approvalDate?: Date;
  version: number;
  language: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransferPricingSnapshot {
  id: string;
  businessAccountId: string;
  snapshotName: string;
  snapshotDescription?: string;
  snapshotDate: Date;
  snapshotData: any;
  includesSimulations: boolean;
  isReadOnly: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface ComplianceReport {
  businessAccountId: string;
  fiscalYear: number;
  documentationCompleteness: number;
  methodologyCompliance: number;
  benchmarkAdequacy: number;
  auditReadiness: number;
  riskAssessment: string;
  recommendations: string[];
  missingDocuments: string[];
  lastUpdated: Date;
  language: string;
}

export interface AuditTrail {
  businessAccountId: string;
  entityType: string;
  entityId: string;
  action: string;
  previousState: any;
  newState: any;
  reason: string;
  userId: string;
  timestamp: Date;
  ipAddress: string;
}

export class ComplianceDocumentationEngine {
  // Documentation Pack Management
  async createDocumentationPack(data: z.infer<typeof DocumentationPackSchema>): Promise<DocumentationPack> {
    const validated = DocumentationPackSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO transfer_pricing_documentation (
        id,
        business_account_id,
        documentation_type,
        fiscal_year,
        country_code,
        entity_id,
        document_title,
        document_content,
        document_metadata,
        supporting_documents,
        methodology_description,
        functional_analysis,
        benchmark_analysis,
        conclusions,
        language,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.documentationType}::varchar,
        ${validated.fiscalYear}::integer,
        ${validated.countryCode || null}::varchar,
        ${validated.entityId || null}::uuid,
        ${validated.documentTitle}::varchar,
        ${validated.documentContent || null}::text,
        ${JSON.stringify(validated.documentMetadata)}::jsonb,
        ${JSON.stringify(validated.supportingDocuments)}::jsonb,
        ${validated.methodologyDescription || null}::text,
        ${validated.functionalAnalysis || null}::text,
        ${validated.benchmarkAnalysis || null}::text,
        ${validated.conclusions || null}::text,
        ${validated.language}::varchar,
        ${validated.createdBy}::uuid
      ) RETURNING id
    `;
    
    const documentId = (result as any)[0]?.id;
    return this.getDocumentationPack(documentId);
  }

  async getDocumentationPack(documentId: string): Promise<DocumentationPack> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        documentation_type as "documentationType",
        fiscal_year as "fiscalYear",
        country_code as "countryCode",
        entity_id as "entityId",
        document_title as "documentTitle",
        document_content as "documentContent",
        document_metadata as "documentMetadata",
        supporting_documents as "supportingDocuments",
        methodology_description as "methodologyDescription",
        functional_analysis as "functionalAnalysis",
        benchmark_analysis as "benchmarkAnalysis",
        conclusions,
        status,
        approved_by as "approvedBy",
        approval_date as "approvalDate",
        version,
        language,
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM transfer_pricing_documentation
      WHERE id = ${documentId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getDocumentationPacks(businessAccountId: string, filters: {
    documentationType?: string;
    fiscalYear?: number;
    countryCode?: string;
    status?: string;
    language?: string;
    limit?: number;
  } = {}): Promise<DocumentationPack[]> {
    const { 
      documentationType, 
      fiscalYear, 
      countryCode, 
      status, 
      language, 
      limit = 50 
    } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        documentation_type as "documentationType",
        fiscal_year as "fiscalYear",
        country_code as "countryCode",
        entity_id as "entityId",
        document_title as "documentTitle",
        document_content as "documentContent",
        document_metadata as "documentMetadata",
        supporting_documents as "supportingDocuments",
        methodology_description as "methodologyDescription",
        functional_analysis as "functionalAnalysis",
        benchmark_analysis as "benchmarkAnalysis",
        conclusions,
        status,
        approved_by as "approvedBy",
        approval_date as "approvalDate",
        version,
        language,
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM transfer_pricing_documentation
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (documentationType) {
      query += ` AND documentation_type = '${documentationType}'`;
    }
    
    if (fiscalYear) {
      query += ` AND fiscal_year = ${fiscalYear}`;
    }
    
    if (countryCode) {
      query += ` AND country_code = '${countryCode}'`;
    }
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    if (language) {
      query += ` AND language = '${language}'`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as DocumentationPack[];
  }

  // Snapshot Management
  async createSnapshot(data: z.infer<typeof SnapshotSchema>): Promise<TransferPricingSnapshot> {
    const validated = SnapshotSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO transfer_pricing_snapshots (
        id,
        business_account_id,
        snapshot_name,
        snapshot_description,
        snapshot_date,
        snapshot_data,
        includes_simulations,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.snapshotName}::varchar,
        ${validated.snapshotDescription || null}::text,
        ${validated.snapshotDate}::date,
        ${JSON.stringify(validated.snapshotData)}::jsonb,
        ${validated.includesSimulations}::boolean,
        ${validated.createdBy}::uuid
      ) RETURNING id
    `;
    
    const snapshotId = (result as any)[0]?.id;
    return this.getSnapshot(snapshotId);
  }

  async getSnapshot(snapshotId: string): Promise<TransferPricingSnapshot> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        snapshot_name as "snapshotName",
        snapshot_description as "snapshotDescription",
        snapshot_date as "snapshotDate",
        snapshot_data as "snapshotData",
        includes_simulations as "includesSimulations",
        is_read_only as "isReadOnly",
        created_by as "createdBy",
        created_at as "createdAt"
      FROM transfer_pricing_snapshots
      WHERE id = ${snapshotId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getSnapshots(businessAccountId: string, filters: {
    includesSimulations?: boolean;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<TransferPricingSnapshot[]> {
    const { includesSimulations, startDate, endDate, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        snapshot_name as "snapshotName",
        snapshot_description as "snapshotDescription",
        snapshot_date as "snapshotDate",
        snapshot_data as "snapshotData",
        includes_simulations as "includesSimulations",
        is_read_only as "isReadOnly",
        created_by as "createdBy",
        created_at as "createdAt"
      FROM transfer_pricing_snapshots
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (includesSimulations !== undefined) {
      query += ` AND includes_simulations = ${includesSimulations}`;
    }
    
    if (startDate) {
      query += ` AND snapshot_date >= '${startDate}'::date`;
    }
    
    if (endDate) {
      query += ` AND snapshot_date <= '${endDate}'::date`;
    }
    
    query += ` ORDER BY snapshot_date DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as TransferPricingSnapshot[];
  }

  // Compliance Report Generation
  async generateComplianceReport(
    businessAccountId: string,
    fiscalYear: number,
    language: 'en' | 'ar' = 'en'
  ): Promise<ComplianceReport> {
    // Get all documentation for the fiscal year
    const documents = await this.getDocumentationPacks(businessAccountId, {
      fiscalYear,
      language
    });
    
    // Calculate documentation completeness
    const requiredDocTypes = ['master_file', 'local_file', 'country_file', 'benchmark_study'];
    const documentationCompleteness = this.calculateDocumentationCompleteness(
      documents,
      requiredDocTypes
    );
    
    // Assess methodology compliance
    const methodologyCompliance = this.assessMethodologyCompliance(documents);
    
    // Evaluate benchmark adequacy
    const benchmarkAdequacy = this.evaluateBenchmarkAdequacy(documents);
    
    // Check audit readiness
    const auditReadiness = this.checkAuditReadiness(documents);
    
    // Generate risk assessment
    const riskAssessment = this.generateRiskAssessment(
      documentationCompleteness,
      methodologyCompliance,
      benchmarkAdequacy,
      language
    );
    
    // Generate recommendations
    const recommendations = this.generateComplianceRecommendations(
      documents,
      documentationCompleteness,
      methodologyCompliance,
      benchmarkAdequacy,
      language
    );
    
    // Identify missing documents
    const missingDocuments = this.identifyMissingDocuments(
      documents,
      requiredDocTypes,
      language
    );
    
    return {
      businessAccountId,
      fiscalYear,
      documentationCompleteness,
      methodologyCompliance,
      benchmarkAdequacy,
      auditReadiness,
      riskAssessment,
      recommendations,
      missingDocuments,
      lastUpdated: new Date(),
      language
    };
  }

  // Master File Generation
  async generateMasterFile(
    businessAccountId: string,
    fiscalYear: number,
    language: 'en' | 'ar' = 'en'
  ): Promise<DocumentationPack> {
    // Get all relevant data for master file
    const transactionsResult = await prisma.$queryRaw`
      SELECT 
        id,
        source_entity_id as "sourceEntityId",
        destination_entity_id as "destinationEntityId",
        transaction_type as "transactionType",
        transaction_date as "transactionDate",
        currency,
        transaction_amount as "transactionAmount",
        transfer_price as "transferPrice",
        pricing_method as "pricingMethod",
        compliance_score as "complianceScore"
      FROM intercompany_transactions
      WHERE business_account_id = ${businessAccountId}::uuid
        AND EXTRACT(YEAR FROM transaction_date) = ${fiscalYear}
    `;
    
    const transactions = transactionsResult as any[];
    
    const methodsResult = await prisma.$queryRaw`
      SELECT 
        method_name as "methodName",
        method_type as "methodType",
        description,
        applicable_transaction_types as "applicableTransactionTypes"
      FROM transfer_pricing_methods
      WHERE business_account_id = ${businessAccountId}::uuid
        AND is_active = true
    `;
    
    const methods = methodsResult as any[];
    
    const benchmarksResult = await prisma.$queryRaw`
      SELECT 
        transaction_type as "transactionType",
        price_range_median as "priceRangeMedian",
        margin_range_median as "marginRangeMedian",
        reliability_score as "reliabilityScore"
      FROM arms_length_benchmarks
      WHERE business_account_id = ${businessAccountId}::uuid
        AND EXTRACT(YEAR FROM benchmark_date) = ${fiscalYear}
    `;
    
    const benchmarks = benchmarksResult as any[];
    
    // Generate master file content
    const masterFileContent = this.generateMasterFileContent(
      transactions,
      methods,
      benchmarks,
      fiscalYear,
      language
    );
    
    const documentTitle = language === 'ar' ? 
      `الملف الرئيسي لتسعير التحويلات - ${fiscalYear}` : 
      `Transfer Pricing Master File - ${fiscalYear}`;
    
    return this.createDocumentationPack({
      businessAccountId,
      documentationType: 'master_file',
      fiscalYear,
      documentTitle,
      documentContent: masterFileContent.content,
      documentMetadata: masterFileContent.metadata,
      methodologyDescription: masterFileContent.methodologyDescription,
      functionalAnalysis: masterFileContent.functionalAnalysis,
      benchmarkAnalysis: masterFileContent.benchmarkAnalysis,
      conclusions: masterFileContent.conclusions,
      language,
      createdBy: 'system' // Would be actual user ID
    });
  }

  // Local File Generation
  async generateLocalFile(
    businessAccountId: string,
    fiscalYear: number,
    countryCode: string,
    entityId: string,
    language: 'en' | 'ar' = 'en'
  ): Promise<DocumentationPack> {
    // Get country-specific data
    const countryTransactionsResult = await prisma.$queryRaw`
      SELECT 
        id,
        source_entity_id as "sourceEntityId",
        destination_entity_id as "destinationEntityId",
        transaction_type as "transactionType",
        transaction_date as "transactionDate",
        currency,
        transaction_amount as "transactionAmount",
        transfer_price as "transferPrice",
        pricing_method as "pricingMethod",
        compliance_score as "complianceScore"
      FROM intercompany_transactions
      WHERE business_account_id = ${businessAccountId}::uuid
        AND EXTRACT(YEAR FROM transaction_date) = ${fiscalYear}
        AND (source_entity_id = ${entityId}::uuid OR destination_entity_id = ${entityId}::uuid)
    `;
    
    const transactions = countryTransactionsResult as any[];
    
    const cbcResult = await prisma.$queryRaw`
      SELECT 
        total_revenue as "totalRevenue",
        total_expenses as "totalExpenses",
        profit_before_tax as "profitBeforeTax",
        tax_paid as "taxPaid",
        effective_tax_rate as "effectiveTaxRate",
        employees,
        tangible_assets as "tangibleAssets"
      FROM cbc_profit_allocation
      WHERE business_account_id = ${businessAccountId}::uuid
        AND fiscal_year = ${fiscalYear}
        AND country_code = ${countryCode}
        AND entity_id = ${entityId}::uuid
    `;
    
    const cbcData = (cbcResult as any[])[0];
    
    // Generate local file content
    const localFileContent = this.generateLocalFileContent(
      transactions,
      cbcData,
      countryCode,
      fiscalYear,
      language
    );
    
    const documentTitle = language === 'ar' ? 
      `الملف المحلي لتسعير التحويلات - ${countryCode} - ${fiscalYear}` : 
      `Transfer Pricing Local File - ${countryCode} - ${fiscalYear}`;
    
    return this.createDocumentationPack({
      businessAccountId,
      documentationType: 'local_file',
      fiscalYear,
      countryCode,
      entityId,
      documentTitle,
      documentContent: localFileContent.content,
      documentMetadata: localFileContent.metadata,
      methodologyDescription: localFileContent.methodologyDescription,
      functionalAnalysis: localFileContent.functionalAnalysis,
      benchmarkAnalysis: localFileContent.benchmarkAnalysis,
      conclusions: localFileContent.conclusions,
      language,
      createdBy: 'system'
    });
  }

  // Audit Trail Management
  async logAuditTrail(
    businessAccountId: string,
    entityType: string,
    entityId: string,
    action: string,
    previousState: any,
    newState: any,
    reason: string,
    userId: string,
    ipAddress: string
  ): Promise<void> {
    // This would log to an audit trail table
    // For now, we'll just log to console
    console.log('Audit Trail:', {
      businessAccountId,
      entityType,
      entityId,
      action,
      previousState,
      newState,
      reason,
      userId,
      ipAddress,
      timestamp: new Date()
    });
  }

  // Helper Methods
  private calculateDocumentationCompleteness(
    documents: DocumentationPack[],
    requiredDocTypes: string[]
  ): number {
    const presentDocTypes = new Set(documents.map(d => d.documentationType));
    const presentRequiredTypes = requiredDocTypes.filter(type => presentDocTypes.has(type));
    
    return (presentRequiredTypes.length / requiredDocTypes.length) * 100;
  }

  private assessMethodologyCompliance(documents: DocumentationPack[]): number {
    const methodologyDocs = documents.filter(d => d.documentationType === 'methodology');
    
    if (methodologyDocs.length === 0) return 0;
    
    let totalScore = 0;
    for (const doc of methodologyDocs) {
      let score = 33; // Base score for having methodology doc
      
      if (doc.methodologyDescription) score += 25;
      if (doc.functionalAnalysis) score += 25;
      if (doc.benchmarkAnalysis) score += 17;
      
      totalScore += Math.min(100, score);
    }
    
    return totalScore / methodologyDocs.length;
  }

  private evaluateBenchmarkAdequacy(documents: DocumentationPack[]): number {
    const benchmarkDocs = documents.filter(d => d.documentationType === 'benchmark_study');
    
    if (benchmarkDocs.length === 0) return 0;
    
    let totalScore = 0;
    for (const doc of benchmarkDocs) {
      let score = 40; // Base score for having benchmark doc
      
      if (doc.benchmarkAnalysis && doc.benchmarkAnalysis.length > 500) score += 30;
      if (doc.supportingDocuments && doc.supportingDocuments.length > 0) score += 20;
      if (doc.documentMetadata && doc.documentMetadata.reliabilityScore > 3) score += 10;
      
      totalScore += Math.min(100, score);
    }
    
    return totalScore / benchmarkDocs.length;
  }

  private checkAuditReadiness(documents: DocumentationPack[]): number {
    const factors = [
      this.calculateDocumentationCompleteness(documents, ['master_file', 'local_file', 'country_file']),
      this.assessMethodologyCompliance(documents),
      this.evaluateBenchmarkAdequacy(documents)
    ];
    
    return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
  }

  private generateRiskAssessment(
    documentationCompleteness: number,
    methodologyCompliance: number,
    benchmarkAdequacy: number,
    language: 'en' | 'ar'
  ): string {
    const overallScore = (documentationCompleteness + methodologyCompliance + benchmarkAdequacy) / 3;
    
    if (overallScore >= 85) {
      return language === 'ar' ? 'منخفض' : 'low';
    } else if (overallScore >= 70) {
      return language === 'ar' ? 'متوسط' : 'medium';
    } else {
      return language === 'ar' ? 'مرتفع' : 'high';
    }
  }

  private generateComplianceRecommendations(
    documents: DocumentationPack[],
    documentationCompleteness: number,
    methodologyCompliance: number,
    benchmarkAdequacy: number,
    language: 'en' | 'ar'
  ): string[] {
    const recommendations = [];
    
    if (documentationCompleteness < 100) {
      recommendations.push(language === 'ar' ? 
        'إكمال جميع أنواع المستندات المطلوبة' : 
        'Complete all required document types'
      );
    }
    
    if (methodologyCompliance < 80) {
      recommendations.push(language === 'ar' ? 
        'تحسين توثيق المنهجيات والتحليل الوظيفي' : 
        'Improve methodology documentation and functional analysis'
      );
    }
    
    if (benchmarkAdequacy < 75) {
      recommendations.push(language === 'ar' ? 
        'تعزيز بيانات المعايير والوثائق الداعمة' : 
        'Enhance benchmark data and supporting documentation'
      );
    }
    
    const unapprovedDocs = documents.filter(d => d.status !== 'approved').length;
    if (unapprovedDocs > 0) {
      recommendations.push(language === 'ar' ? 
        `${unapprovedDocs} مستندات تنتظر الموافقة` : 
        `${unapprovedDocs} documents awaiting approval`
      );
    }
    
    return recommendations;
  }

  private identifyMissingDocuments(
    documents: DocumentationPack[],
    requiredDocTypes: string[],
    language: 'en' | 'ar'
  ): string[] {
    const presentDocTypes = new Set(documents.map(d => d.documentationType));
    const missingTypes = requiredDocTypes.filter(type => !presentDocTypes.has(type));
    
    return missingTypes.map(type => {
      const typeNames = {
        master_file: language === 'ar' ? 'الملف الرئيسي' : 'Master File',
        local_file: language === 'ar' ? 'الملف المحلي' : 'Local File',
        country_file: language === 'ar' ? 'ملف البلد' : 'Country File',
        benchmark_study: language === 'ar' ? 'دراسة المعايير' : 'Benchmark Study'
      };
      
      return typeNames[type as keyof typeof typeNames] || type;
    });
  }

  private generateMasterFileContent(
    transactions: any[],
    methods: any[],
    benchmarks: any[],
    fiscalYear: number,
    language: 'en' | 'ar'
  ): any {
    const title = language === 'ar' ? 
      `الملف الرئيسي لتسعير التحويلات - ${fiscalYear}` : 
      `Transfer Pricing Master File - ${fiscalYear}`;
    
    const content = language === 'ar' ? `
# ${title}

## ملخص التنظيم
هذا المستند يقدم نظرة عامة على مجموعة الشركة وهيكلها التنظيمي وأنشطتها.

## معاملات الشركات التابعة
إجمالي المعاملات: ${transactions.length}
إجمالي المبلغ: ${transactions.reduce((sum, t) => sum + t.transactionAmount, 0).toLocaleString()}

## مناهج التسعير
${methods.map(m => `- ${m.methodName}: ${m.description || 'لا يوجد وصف'}`).join('\n')}

## بيانات المعايير
${benchmarks.map(b => `- ${b.transactionType}: ${b.priceRangeMedian || 'N/A'}`).join('\n')}
    ` : `
# ${title}

## Organizational Overview
This document provides an overview of the MNE group structure, organization, and activities.

## Intercompany Transactions
Total Transactions: ${transactions.length}
Total Amount: ${transactions.reduce((sum, t) => sum + t.transactionAmount, 0).toLocaleString()}

## Pricing Methodologies
${methods.map(m => `- ${m.methodName}: ${m.description || 'No description'}`).join('\n')}

## Benchmark Data
${benchmarks.map(b => `- ${b.transactionType}: ${b.priceRangeMedian || 'N/A'}`).join('\n')}
    `;
    
    return {
      content,
      metadata: {
        fiscalYear,
        totalTransactions: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + t.transactionAmount, 0),
        methodsCount: methods.length,
        benchmarksCount: benchmarks.length,
        generatedAt: new Date().toISOString()
      },
      methodologyDescription: language === 'ar' ? 
        'تم استخدام مناهج التسعير المعتمدة من OECD بما في ذلك CUP، Cost Plus، TNMM، وغيرها' : 
        'OECD-approved pricing methodologies including CUP, Cost Plus, TNMM, and others',
      functionalAnalysis: language === 'ar' ? 
        'تحليل شامل للوظائف والأصول والمخاطر بين الكيانات' : 
        'Comprehensive analysis of functions, assets, and risks among entities',
      benchmarkAnalysis: language === 'ar' ? 
        'تحليل بيانات المعايير الخارجية ومقارنات التكافؤ' : 
        'External benchmark data analysis and arm\'s length comparisons',
      conclusions: language === 'ar' ? 
        'جميع معاملات الشركات التابعة تم تسعيرها وفقاً لمبادئ التكافؤ' : 
        'All intercompany transactions priced according to arm\'s length principles'
    };
  }

  private generateLocalFileContent(
    transactions: any[],
    cbcData: any,
    countryCode: string,
    fiscalYear: number,
    language: 'en' | 'ar'
  ): any {
    const title = language === 'ar' ? 
      `الملف المحلي لتسعير التحويلات - ${countryCode} - ${fiscalYear}` : 
      `Transfer Pricing Local File - ${countryCode} - ${fiscalYear}`;
    
    const content = language === 'ar' ? `
# ${title}

## معلومات الكيان
البلد: ${countryCode}
السنة المالية: ${fiscalYear}

## البيانات المالية
إجمالي الإيرادات: ${cbcData?.totalRevenue?.toLocaleString() || 'N/A'}
إجمالي المصروفات: ${cbcData?.totalExpenses?.toLocaleString() || 'N/A'}
الربح قبل الضريبة: ${cbcData?.profitBeforeTax?.toLocaleString() || 'N/A'}
الضريبة المدفوعة: ${cbcData?.taxPaid?.toLocaleString() || 'N/A'}

## معاملات الشركات التابعة
${transactions.map(t => `- ${t.transactionType}: ${t.transactionAmount.toLocaleString()}`).join('\n')}
    ` : `
# ${title}

## Entity Information
Country: ${countryCode}
Fiscal Year: ${fiscalYear}

## Financial Data
Total Revenue: ${cbcData?.totalRevenue?.toLocaleString() || 'N/A'}
Total Expenses: ${cbcData?.totalExpenses?.toLocaleString() || 'N/A'}
Profit Before Tax: ${cbcData?.profitBeforeTax?.toLocaleString() || 'N/A'}
Tax Paid: ${cbcData?.taxPaid?.toLocaleString() || 'N/A'}

## Intercompany Transactions
${transactions.map(t => `- ${t.transactionType}: ${t.transactionAmount.toLocaleString()}`).join('\n')}
    `;
    
    return {
      content,
      metadata: {
        countryCode,
        fiscalYear,
        totalTransactions: transactions.length,
        financialData: cbcData,
        generatedAt: new Date().toISOString()
      },
      methodologyDescription: language === 'ar' ? 
        'مناهج التسعير المطبقة على المعاملات في هذا الكيان' : 
        'Pricing methodologies applied to transactions in this entity',
      functionalAnalysis: language === 'ar' ? 
        'تحليل وظائف وأصول ومخاطر الكيان' : 
        'Functional, asset, and risk analysis of the entity',
      benchmarkAnalysis: language === 'ar' ? 
        'تحليل المعايير الخاصة بالكيان والبلد' : 
        'Entity and country-specific benchmark analysis',
      conclusions: language === 'ar' ? 
        'امتثال الكيان لمبادئ تسعير التحويلات' : 
        'Entity compliance with transfer pricing principles'
    };
  }
}
