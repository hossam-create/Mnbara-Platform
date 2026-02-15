import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const IntercompanyTransactionSchema = z.object({
  businessAccountId: z.string().uuid(),
  transactionId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  expenseId: z.string().uuid().optional(),
  sourceEntityId: z.string().uuid(),
  destinationEntityId: z.string().uuid(),
  transactionType: z.enum(['sale', 'service', 'loan', 'royalty', 'license', 'interest', 'rental', 'management_fee', 'other']),
  transactionDate: z.string().date(),
  currency: z.string().length(3),
  transactionAmount: z.number(),
  transferPrice: z.number(),
  pricingMethod: z.enum(['cup', 'cost_plus', 'tnmm', 'resale_minus', 'profit_split', 'transactional_net_margin', 'cost_method', 'other']),
  justification: z.string().optional(),
  createdBy: z.string().uuid()
});

const TransferPricingMethodSchema = z.object({
  businessAccountId: z.string().uuid(),
  methodName: z.string().min(1).max(100),
  methodType: z.enum(['cup', 'cost_plus', 'tnmm', 'resale_minus', 'profit_split', 'transactional_net_margin', 'cost_method', 'other']),
  description: z.string().optional(),
  applicableTransactionTypes: z.array(z.string()).default([]),
  marginRange: z.record(z.any()).default({}),
  markupRange: z.record(z.any()).default({}),
  costBase: z.enum(['full_cost', 'variable_cost', 'standard_cost', 'actual_cost']).optional(),
  profitLevelIndicator: z.string().optional(),
  benchmarkSources: z.array(z.any()).default([]),
  documentationRequirements: z.array(z.any()).default([]),
  createdBy: z.string().uuid()
});

const ArmsLengthBenchmarkSchema = z.object({
  businessAccountId: z.string().uuid(),
  transactionType: z.string(),
  industryCode: z.string().optional(),
  countryCode: z.string().length(2).optional(),
  currency: z.string().length(3),
  benchmarkDate: z.string().date(),
  priceRangeLow: z.number().optional(),
  priceRangeHigh: z.number().optional(),
  priceRangeMedian: z.number().optional(),
  marginRangeLow: z.number().optional(),
  marginRangeHigh: z.number().optional(),
  marginRangeMedian: z.number().optional(),
  markupRangeLow: z.number().optional(),
  markupRangeHigh: z.number().optional(),
  markupRangeMedian: z.number().optional(),
  sampleSize: z.number().optional(),
  dataSources: z.array(z.any()).default([]),
  reliabilityScore: z.number().int().min(1).max(5).default(3),
  confidenceLevel: z.number().int().min(1).max(5).default(3),
  createdBy: z.string().uuid()
});

const TransferPricingAdjustmentSchema = z.object({
  businessAccountId: z.string().uuid(),
  intercompanyTransactionId: z.string().uuid(),
  adjustmentType: z.enum(['price_increase', 'price_decrease', 'margin_adjustment', 'markup_adjustment', 'method_change', 'correction']),
  originalPrice: z.number(),
  adjustedPrice: z.number(),
  adjustmentReason: z.string().min(1),
  justification: z.string().optional(),
  effectiveDate: z.string().date(),
  isSimulation: z.boolean().default(false),
  createdBy: z.string().uuid()
});

export interface IntercompanyTransaction {
  id: string;
  businessAccountId: string;
  transactionId?: string;
  invoiceId?: string;
  expenseId?: string;
  sourceEntityId: string;
  destinationEntityId: string;
  transactionType: string;
  transactionDate: Date;
  currency: string;
  transactionAmount: number;
  transferPrice: number;
  armLengthPrice?: number;
  pricingMethod: string;
  adjustmentAmount: number;
  adjustmentReason?: string;
  benchmarkData: any;
  justification?: string;
  status: string;
  riskLevel?: string;
  complianceScore?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransferPricingMethod {
  id: string;
  businessAccountId: string;
  methodName: string;
  methodType: string;
  description?: string;
  applicableTransactionTypes: string[];
  marginRange: any;
  markupRange: any;
  costBase?: string;
  profitLevelIndicator?: string;
  benchmarkSources: any[];
  documentationRequirements: any[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArmsLengthBenchmark {
  id: string;
  businessAccountId: string;
  transactionType: string;
  industryCode?: string;
  countryCode?: string;
  currency: string;
  benchmarkDate: Date;
  priceRangeLow?: number;
  priceRangeHigh?: number;
  priceRangeMedian?: number;
  marginRangeLow?: number;
  marginRangeHigh?: number;
  marginRangeMedian?: number;
  markupRangeLow?: number;
  markupRangeHigh?: number;
  markupRangeMedian?: number;
  sampleSize?: number;
  dataSources: any[];
  reliabilityScore: number;
  confidenceLevel: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransferPricingAdjustment {
  id: string;
  businessAccountId: string;
  intercompanyTransactionId: string;
  adjustmentType: string;
  originalPrice: number;
  adjustedPrice: number;
  adjustmentAmount: number;
  adjustmentPercentage: number;
  adjustmentReason: string;
  justification?: string;
  supportingDocuments: any[];
  approvedBy?: string;
  approvalDate?: Date;
  effectiveDate: Date;
  isSimulation: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CBCProfitAllocation {
  id: string;
  businessAccountId: string;
  fiscalYear: number;
  countryCode: string;
  entityId?: string;
  totalRevenue: number;
  totalExpenses: number;
  profitBeforeTax: number;
  taxPaid: number;
  profitAfterTax: number;
  intercompanyRevenue: number;
  intercompanyExpenses: number;
  transferPricingAdjustments: number;
  allocatedProfit: number;
  effectiveTaxRate: number;
  employees: number;
  tangibleAssets: number;
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransferPricingDocumentation {
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

export class TransferPricingEngine {
  // Intercompany Transactions Management
  async createIntercompanyTransaction(data: z.infer<typeof IntercompanyTransactionSchema>): Promise<IntercompanyTransaction> {
    const validated = IntercompanyTransactionSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT create_intercompany_transaction(
        ${validated.businessAccountId}::uuid,
        ${validated.transactionId || null}::uuid,
        ${validated.invoiceId || null}::uuid,
        ${validated.expenseId || null}::uuid,
        ${validated.sourceEntityId}::uuid,
        ${validated.destinationEntityId}::uuid,
        ${validated.transactionType}::varchar,
        ${validated.transactionDate}::date,
        ${validated.currency}::varchar,
        ${validated.transactionAmount}::decimal,
        ${validated.transferPrice}::decimal,
        ${validated.pricingMethod}::varchar,
        ${validated.justification || null}::text,
        ${validated.createdBy}::uuid
      ) as transaction_id
    `;
    
    const transactionId = (result as any)[0]?.transaction_id;
    return this.getIntercompanyTransaction(transactionId);
  }

  async getIntercompanyTransaction(transactionId: string): Promise<IntercompanyTransaction> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        transaction_id as "transactionId",
        invoice_id as "invoiceId",
        expense_id as "expenseId",
        source_entity_id as "sourceEntityId",
        destination_entity_id as "destinationEntityId",
        transaction_type as "transactionType",
        transaction_date as "transactionDate",
        currency,
        transaction_amount as "transactionAmount",
        transfer_price as "transferPrice",
        arm_length_price as "armLengthPrice",
        pricing_method as "pricingMethod",
        adjustment_amount as "adjustmentAmount",
        adjustment_reason as "adjustmentReason",
        benchmark_data as "benchmarkData",
        justification,
        status,
        risk_level as "riskLevel",
        compliance_score as "complianceScore",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM intercompany_transactions
      WHERE id = ${transactionId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getIntercompanyTransactions(businessAccountId: string, filters: {
    sourceEntityId?: string;
    destinationEntityId?: string;
    transactionType?: string;
    pricingMethod?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<IntercompanyTransaction[]> {
    const { 
      sourceEntityId, 
      destinationEntityId, 
      transactionType, 
      pricingMethod, 
      status, 
      startDate, 
      endDate, 
      limit = 50 
    } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        transaction_id as "transactionId",
        invoice_id as "invoiceId",
        expense_id as "expenseId",
        source_entity_id as "sourceEntityId",
        destination_entity_id as "destinationEntityId",
        transaction_type as "transactionType",
        transaction_date as "transactionDate",
        currency,
        transaction_amount as "transactionAmount",
        transfer_price as "transferPrice",
        arm_length_price as "armLengthPrice",
        pricing_method as "pricingMethod",
        adjustment_amount as "adjustmentAmount",
        adjustment_reason as "adjustmentReason",
        benchmark_data as "benchmarkData",
        justification,
        status,
        risk_level as "riskLevel",
        compliance_score as "complianceScore",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM intercompany_transactions
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (sourceEntityId) {
      query += ` AND source_entity_id = '${sourceEntityId}'`;
    }
    
    if (destinationEntityId) {
      query += ` AND destination_entity_id = '${destinationEntityId}'`;
    }
    
    if (transactionType) {
      query += ` AND transaction_type = '${transactionType}'`;
    }
    
    if (pricingMethod) {
      query += ` AND pricing_method = '${pricingMethod}'`;
    }
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    if (startDate) {
      query += ` AND transaction_date >= '${startDate}'::date`;
    }
    
    if (endDate) {
      query += ` AND transaction_date <= '${endDate}'::date`;
    }
    
    query += ` ORDER BY transaction_date DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as IntercompanyTransaction[];
  }

  // Transfer Pricing Methods Management
  async createTransferPricingMethod(data: z.infer<typeof TransferPricingMethodSchema>): Promise<TransferPricingMethod> {
    const validated = TransferPricingMethodSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO transfer_pricing_methods (
        id,
        business_account_id,
        method_name,
        method_type,
        description,
        applicable_transaction_types,
        margin_range,
        markup_range,
        cost_base,
        profit_level_indicator,
        benchmark_sources,
        documentation_requirements,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.methodName}::varchar,
        ${validated.methodType}::varchar,
        ${validated.description || null}::text,
        ${JSON.stringify(validated.applicableTransactionTypes)}::jsonb,
        ${JSON.stringify(validated.marginRange)}::jsonb,
        ${JSON.stringify(validated.markupRange)}::jsonb,
        ${validated.costBase || null}::varchar,
        ${validated.profitLevelIndicator || null}::varchar,
        ${JSON.stringify(validated.benchmarkSources)}::jsonb,
        ${JSON.stringify(validated.documentationRequirements)}::jsonb,
        ${validated.createdBy}::uuid
      ) RETURNING id
    `;
    
    const methodId = (result as any)[0]?.id;
    return this.getTransferPricingMethod(methodId);
  }

  async getTransferPricingMethod(methodId: string): Promise<TransferPricingMethod> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        method_name as "methodName",
        method_type as "methodType",
        description,
        applicable_transaction_types as "applicableTransactionTypes",
        margin_range as "marginRange",
        markup_range as "markupRange",
        cost_base as "costBase",
        profit_level_indicator as "profitLevelIndicator",
        benchmark_sources as "benchmarkSources",
        documentation_requirements as "documentationRequirements",
        is_active as "isActive",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM transfer_pricing_methods
      WHERE id = ${methodId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getTransferPricingMethods(businessAccountId: string, filters: {
    methodType?: string;
    isActive?: boolean;
    limit?: number;
  } = {}): Promise<TransferPricingMethod[]> {
    const { methodType, isActive, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        method_name as "methodName",
        method_type as "methodType",
        description,
        applicable_transaction_types as "applicableTransactionTypes",
        margin_range as "marginRange",
        markup_range as "markupRange",
        cost_base as "costBase",
        profit_level_indicator as "profitLevelIndicator",
        benchmark_sources as "benchmarkSources",
        documentation_requirements as "documentationRequirements",
        is_active as "isActive",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM transfer_pricing_methods
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (methodType) {
      query += ` AND method_type = '${methodType}'`;
    }
    
    if (isActive !== undefined) {
      query += ` AND is_active = ${isActive}`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as TransferPricingMethod[];
  }

  // Arms Length Benchmarks Management
  async createArmsLengthBenchmark(data: z.infer<typeof ArmsLengthBenchmarkSchema>): Promise<ArmsLengthBenchmark> {
    const validated = ArmsLengthBenchmarkSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO arms_length_benchmarks (
        id,
        business_account_id,
        transaction_type,
        industry_code,
        country_code,
        currency,
        benchmark_date,
        price_range_low,
        price_range_high,
        price_range_median,
        margin_range_low,
        margin_range_high,
        margin_range_median,
        markup_range_low,
        markup_range_high,
        markup_range_median,
        sample_size,
        data_sources,
        reliability_score,
        confidence_level,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.transactionType}::varchar,
        ${validated.industryCode || null}::varchar,
        ${validated.countryCode || null}::varchar,
        ${validated.currency}::varchar,
        ${validated.benchmarkDate}::date,
        ${validated.priceRangeLow || null}::decimal,
        ${validated.priceRangeHigh || null}::decimal,
        ${validated.priceRangeMedian || null}::decimal,
        ${validated.marginRangeLow || null}::decimal,
        ${validated.marginRangeHigh || null}::decimal,
        ${validated.marginRangeMedian || null}::decimal,
        ${validated.markupRangeLow || null}::decimal,
        ${validated.markupRangeHigh || null}::decimal,
        ${validated.markupRangeMedian || null}::decimal,
        ${validated.sampleSize || null}::integer,
        ${JSON.stringify(validated.dataSources)}::jsonb,
        ${validated.reliabilityScore}::integer,
        ${validated.confidenceLevel}::integer,
        ${validated.createdBy}::uuid
      ) RETURNING id
    `;
    
    const benchmarkId = (result as any)[0]?.id;
    return this.getArmsLengthBenchmark(benchmarkId);
  }

  async getArmsLengthBenchmark(benchmarkId: string): Promise<ArmsLengthBenchmark> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        transaction_type as "transactionType",
        industry_code as "industryCode",
        country_code as "countryCode",
        currency,
        benchmark_date as "benchmarkDate",
        price_range_low as "priceRangeLow",
        price_range_high as "priceRangeHigh",
        price_range_median as "priceRangeMedian",
        margin_range_low as "marginRangeLow",
        margin_range_high as "marginRangeHigh",
        margin_range_median as "marginRangeMedian",
        markup_range_low as "markupRangeLow",
        markup_range_high as "markupRangeHigh",
        markup_range_median as "markupRangeMedian",
        sample_size as "sampleSize",
        data_sources as "dataSources",
        reliability_score as "reliabilityScore",
        confidence_level as "confidenceLevel",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM arms_length_benchmarks
      WHERE id = ${benchmarkId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getArmsLengthBenchmarks(businessAccountId: string, filters: {
    transactionType?: string;
    industryCode?: string;
    countryCode?: string;
    currency?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<ArmsLengthBenchmark[]> {
    const { 
      transactionType, 
      industryCode, 
      countryCode, 
      currency, 
      startDate, 
      endDate, 
      limit = 50 
    } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        transaction_type as "transactionType",
        industry_code as "industryCode",
        country_code as "countryCode",
        currency,
        benchmark_date as "benchmarkDate",
        price_range_low as "priceRangeLow",
        price_range_high as "priceRangeHigh",
        price_range_median as "priceRangeMedian",
        margin_range_low as "marginRangeLow",
        margin_range_high as "marginRangeHigh",
        margin_range_median as "marginRangeMedian",
        markup_range_low as "markupRangeLow",
        markup_range_high as "markupRangeHigh",
        markup_range_median as "markupRangeMedian",
        sample_size as "sampleSize",
        data_sources as "dataSources",
        reliability_score as "reliabilityScore",
        confidence_level as "confidenceLevel",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM arms_length_benchmarks
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (transactionType) {
      query += ` AND transaction_type = '${transactionType}'`;
    }
    
    if (industryCode) {
      query += ` AND industry_code = '${industryCode}'`;
    }
    
    if (countryCode) {
      query += ` AND country_code = '${countryCode}'`;
    }
    
    if (currency) {
      query += ` AND currency = '${currency}'`;
    }
    
    if (startDate) {
      query += ` AND benchmark_date >= '${startDate}'::date`;
    }
    
    if (endDate) {
      query += ` AND benchmark_date <= '${endDate}'::date`;
    }
    
    query += ` ORDER BY benchmark_date DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as ArmsLengthBenchmark[];
  }

  // Transfer Pricing Adjustments Management
  async createTransferPricingAdjustment(data: z.infer<typeof TransferPricingAdjustmentSchema>): Promise<TransferPricingAdjustment> {
    const validated = TransferPricingAdjustmentSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT create_transfer_pricing_adjustment(
        ${validated.businessAccountId}::uuid,
        ${validated.intercompanyTransactionId}::uuid,
        ${validated.adjustmentType}::varchar,
        ${validated.originalPrice}::decimal,
        ${validated.adjustedPrice}::decimal,
        ${validated.adjustmentReason}::text,
        ${validated.justification || null}::text,
        ${validated.effectiveDate}::date,
        ${validated.isSimulation}::boolean,
        ${validated.createdBy}::uuid
      ) as adjustment_id
    `;
    
    const adjustmentId = (result as any)[0]?.adjustment_id;
    return this.getTransferPricingAdjustment(adjustmentId);
  }

  async getTransferPricingAdjustment(adjustmentId: string): Promise<TransferPricingAdjustment> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        intercompany_transaction_id as "intercompanyTransactionId",
        adjustment_type as "adjustmentType",
        original_price as "originalPrice",
        adjusted_price as "adjustedPrice",
        adjustment_amount as "adjustmentAmount",
        adjustment_percentage as "adjustmentPercentage",
        adjustment_reason as "adjustmentReason",
        justification,
        supporting_documents as "supportingDocuments",
        approved_by as "approvedBy",
        approval_date as "approvalDate",
        effective_date as "effectiveDate",
        is_simulation as "isSimulation",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM transfer_pricing_adjustments
      WHERE id = ${adjustmentId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getTransferPricingAdjustments(businessAccountId: string, filters: {
    adjustmentType?: string;
    isSimulation?: boolean;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<TransferPricingAdjustment[]> {
    const { 
      adjustmentType, 
      isSimulation, 
      startDate, 
      endDate, 
      limit = 50 
    } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        intercompany_transaction_id as "intercompanyTransactionId",
        adjustment_type as "adjustmentType",
        original_price as "originalPrice",
        adjusted_price as "adjustedPrice",
        adjustment_amount as "adjustmentAmount",
        adjustment_percentage as "adjustmentPercentage",
        adjustment_reason as "adjustmentReason",
        justification,
        supporting_documents as "supportingDocuments",
        approved_by as "approvedBy",
        approval_date as "approvalDate",
        effective_date as "effectiveDate",
        is_simulation as "isSimulation",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM transfer_pricing_adjustments
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (adjustmentType) {
      query += ` AND adjustment_type = '${adjustmentType}'`;
    }
    
    if (isSimulation !== undefined) {
      query += ` AND is_simulation = ${isSimulation}`;
    }
    
    if (startDate) {
      query += ` AND effective_date >= '${startDate}'::date`;
    }
    
    if (endDate) {
      query += ` AND effective_date <= '${endDate}'::date`;
    }
    
    query += ` ORDER BY effective_date DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as TransferPricingAdjustment[];
  }

  // Analytics and Dashboard Methods
  async getTransferPricingSummary(businessAccountId: string): Promise<any> {
    const result = await prisma.$queryRaw`
      SELECT * FROM transfer_pricing_summary
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    return result;
  }

  async getTransferPricingMethodAnalysis(businessAccountId: string): Promise<any> {
    const result = await prisma.$queryRaw`
      SELECT * FROM transfer_pricing_method_analysis
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    return result;
  }

  async getCBCProfitSummary(businessAccountId: string): Promise<any> {
    const result = await prisma.$queryRaw`
      SELECT * FROM cbc_profit_summary
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    return result;
  }

  async refreshMaterializedViews(): Promise<void> {
    await prisma.$queryRaw`SELECT refresh_transfer_pricing_materialized_views()`;
  }

  // Helper Methods for Transfer Pricing Logic
  async calculateArmsLengthPrice(
    businessAccountId: string,
    transactionType: string,
    industryCode?: string,
    countryCode?: string,
    currency: string,
    transactionDate: string
  ): Promise<number> {
    const result = await prisma.$queryRaw`
      SELECT calculate_arms_length_price(
        ${businessAccountId}::uuid,
        ${transactionType}::varchar,
        ${industryCode || null}::varchar,
        ${countryCode || null}::varchar,
        ${currency}::varchar,
        ${transactionDate}::date
      ) as arms_length_price
    `;
    
    return (result as any)[0]?.arms_length_price || 0;
  }

  async applyTransferPricingMethod(
    transactionAmount: number,
    methodType: string,
    costBase?: number,
    marginRange?: { min: number; max: number },
    markupRange?: { min: number; max: number }
  ): Promise<number> {
    switch (methodType) {
      case 'cost_plus':
        if (!costBase || !markupRange) {
          throw new Error('Cost base and markup range required for cost plus method');
        }
        return costBase * (1 + (markupRange.min + markupRange.max) / 2 / 100);
      
      case 'resale_minus':
        if (!costBase || !marginRange) {
          throw new Error('Cost base and margin range required for resale minus method');
        }
        return costBase / (1 - (marginRange.min + marginRange.max) / 2 / 100);
      
      case 'tnmm':
        if (!costBase || !marginRange) {
          throw new Error('Cost base and margin range required for TNMM method');
        }
        return costBase * (1 + (marginRange.min + marginRange.max) / 2 / 100);
      
      case 'cup':
        // For CUP method, we would use external benchmark data
        return transactionAmount; // Placeholder - would use actual CUP data
      
      default:
        return transactionAmount;
    }
  }

  async calculateComplianceScore(transaction: IntercompanyTransaction): Promise<number> {
    let score = 100;
    
    // Check if arm's length price is available
    if (!transaction.armLengthPrice) {
      score -= 20;
    } else {
      // Check deviation from arm's length price
      const deviation = Math.abs(transaction.transferPrice - transaction.armLengthPrice) / transaction.armLengthPrice;
      if (deviation > 0.1) score -= 30;
      else if (deviation > 0.05) score -= 15;
      else if (deviation > 0.02) score -= 5;
    }
    
    // Check if justification is provided
    if (!transaction.justification) {
      score -= 10;
    }
    
    // Check if benchmark data is available
    if (!transaction.benchmarkData || Object.keys(transaction.benchmarkData).length === 0) {
      score -= 15;
    }
    
    // Check risk level
    if (transaction.riskLevel === 'critical') score -= 25;
    else if (transaction.riskLevel === 'high') score -= 15;
    else if (transaction.riskLevel === 'medium') score -= 5;
    
    return Math.max(0, score);
  }

  async generateTransferPricingReport(
    businessAccountId: string,
    fiscalYear: number,
    language: 'en' | 'ar' = 'en'
  ): Promise<any> {
    const transactions = await this.getIntercompanyTransactions(businessAccountId, {
      startDate: `${fiscalYear}-01-01`,
      endDate: `${fiscalYear}-12-31`
    });

    const adjustments = await this.getTransferPricingAdjustments(businessAccountId, {
      startDate: `${fiscalYear}-01-01`,
      endDate: `${fiscalYear}-12-31`
    });

    const methodAnalysis = await this.getTransferPricingMethodAnalysis(businessAccountId);

    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + t.transactionAmount, 0);
    const totalAdjustments = adjustments.reduce((sum, a) => sum + a.adjustmentAmount, 0);
    const averageComplianceScore = transactions.reduce((sum, t) => sum + (t.complianceScore || 0), 0) / totalTransactions;

    return {
      summary: language === 'ar' ? {
        reportTitle: 'تقرير تسعير التحويلات',
        fiscalYear,
        totalTransactions,
        totalAmount,
        totalAdjustments,
        averageComplianceScore,
        generatedAt: new Date().toISOString()
      } : {
        reportTitle: 'Transfer Pricing Report',
        fiscalYear,
        totalTransactions,
        totalAmount,
        totalAdjustments,
        averageComplianceScore,
        generatedAt: new Date().toISOString()
      },
      transactions: transactions.map(t => ({
        id: t.id,
        sourceEntity: t.sourceEntityId,
        destinationEntity: t.destinationEntityId,
        type: t.transactionType,
        amount: t.transactionAmount,
        transferPrice: t.transferPrice,
        armLengthPrice: t.armLengthPrice,
        method: t.pricingMethod,
        complianceScore: t.complianceScore
      })),
      adjustments: adjustments.map(a => ({
        id: a.id,
        transactionId: a.intercompanyTransactionId,
        type: a.adjustmentType,
        originalPrice: a.originalPrice,
        adjustedPrice: a.adjustedPrice,
        adjustmentAmount: a.adjustmentAmount,
        reason: a.adjustmentReason
      })),
      methodAnalysis,
      recommendations: this.generateTransferPricingRecommendations(transactions, adjustments, language)
    };
  }

  private generateTransferPricingRecommendations(
    transactions: IntercompanyTransaction[],
    adjustments: TransferPricingAdjustment[],
    language: 'en' | 'ar'
  ): string[] {
    const recommendations = [];
    
    const lowComplianceTransactions = transactions.filter(t => (t.complianceScore || 0) < 70);
    if (lowComplianceTransactions.length > 0) {
      recommendations.push(language === 'ar' ? 
        `${lowComplianceTransactions.length} معاملات لديها درجة امتثال منخفضة - راجع منهجية التسعير` : 
        `${lowComplianceTransactions.length} transactions have low compliance scores - review pricing methodology`
      );
    }
    
    const highAdjustmentCount = adjustments.length;
    if (highAdjustmentCount > transactions.length * 0.2) {
      recommendations.push(language === 'ar' ? 
        `نسبة عالية من التعديلات (${highAdjustmentCount}) - راجع سياسات التسعير الأولية` : 
        `High adjustment ratio (${highAdjustmentCount}) - review initial pricing policies`
      );
    }
    
    const missingArmLengthPrices = transactions.filter(t => !t.armLengthPrice).length;
    if (missingArmLengthPrices > 0) {
      recommendations.push(language === 'ar' ? 
        `${missingArmLengthPrices} معاملات تفتقر إلى أسعار التكافؤ - قم بتحديث بيانات المعايير` : 
        `${missingArmLengthPrices} transactions missing arm's length prices - update benchmark data`
      );
    }
    
    return recommendations;
  }
}
