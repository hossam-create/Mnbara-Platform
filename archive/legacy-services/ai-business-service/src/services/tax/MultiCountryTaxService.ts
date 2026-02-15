import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const CountryTaxConfigSchema = z.object({
  countryCode: z.string().length(2),
  countryName: z.string().min(1).max(100),
  taxJurisdiction: z.string().min(1).max(100),
  currency: z.string().length(3),
  taxYearStart: z.string().datetime(),
  taxYearEnd: z.string().datetime(),
  corporateTaxRate: z.number().min(0).max(1),
  vatRate: z.number().min(0).max(1).default(0),
  gstRate: z.number().min(0).max(1).default(0),
  withholdingTaxRates: z.record(z.number()).default({}),
  taxTreaties: z.record(z.any()).default({}),
  taxHolidays: z.record(z.any()).default({}),
  complianceRequirements: z.record(z.any()).default({}),
  filingFrequency: z.enum(['monthly', 'quarterly', 'annually', 'semi_annual']).default('quarterly'),
  paymentFrequency: z.enum(['monthly', 'quarterly', 'annually', 'semi_annual']).default('quarterly'),
  createdBy: z.string().uuid()
});

const TaxRuleSchema = z.object({
  countryId: z.string().uuid(),
  ruleName: z.string().min(1).max(200),
  ruleType: z.enum(['corporate_tax', 'vat', 'gst', 'withholding_tax', 'custom_duty', 'excise', 'other']),
  ruleDescription: z.string().optional(),
  applicableTransactions: z.array(z.any()).default([]),
  taxRate: z.number().min(0).max(1),
  taxBase: z.string().min(1).max(100),
  calculationMethod: z.enum(['percentage', 'fixed_amount', 'tiered', 'progressive', 'reverse_calculation']).default('percentage'),
  tierRates: z.array(z.any()).default([]),
  exemptions: z.array(z.any()).default([]),
  conditions: z.record(z.any()).default({}),
  effectiveDate: z.string().datetime(),
  expiryDate: z.string().datetime().optional(),
  priority: z.number().default(100),
  createdBy: z.string().uuid()
});

const TransactionTaxMappingSchema = z.object({
  businessAccountId: z.string().uuid(),
  transactionId: z.string().uuid(),
  countryId: z.string().uuid(),
  taxRuleId: z.string().uuid().optional(),
  transactionType: z.string().min(1).max(100),
  transactionCategory: z.string().min(1).max(100),
  taxType: z.enum(['corporate_tax', 'vat', 'gst', 'withholding_tax', 'custom_duty', 'excise', 'other']),
  taxableAmount: z.number().min(0),
  taxRate: z.number().min(0).max(1),
  calculatedTax: z.number().min(0),
  currency: z.string().length(3),
  exchangeRate: z.number().min(0).default(1),
  isCrossBorder: z.boolean().default(false),
  sourceCountry: z.string().length(2).optional(),
  destinationCountry: z.string().length(2).optional(),
  taxJurisdiction: z.string().max(100).optional(),
  calculationDetails: z.record(z.any()).default({}),
  createdBy: z.string().uuid()
});

export interface CountryTaxConfig {
  id: string;
  countryCode: string;
  countryName: string;
  taxJurisdiction: string;
  currency: string;
  taxYearStart: Date;
  taxYearEnd: Date;
  corporateTaxRate: number;
  vatRate: number;
  gstRate: number;
  withholdingTaxRates: Record<string, number>;
  taxTreaties: Record<string, any>;
  taxHolidays: Record<string, any>;
  complianceRequirements: Record<string, any>;
  filingFrequency: string;
  paymentFrequency: string;
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxRule {
  id: string;
  countryId: string;
  ruleName: string;
  ruleType: string;
  ruleDescription?: string;
  applicableTransactions: any[];
  taxRate: number;
  taxBase: string;
  calculationMethod: string;
  tierRates: any[];
  exemptions: any[];
  conditions: Record<string, any>;
  effectiveDate: Date;
  expiryDate?: Date;
  priority: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionTaxMapping {
  id: string;
  businessAccountId: string;
  transactionId: string;
  countryId: string;
  taxRuleId?: string;
  transactionType: string;
  transactionCategory: string;
  taxType: string;
  taxableAmount: number;
  taxRate: number;
  calculatedTax: number;
  currency: string;
  exchangeRate: number;
  isCrossBorder: boolean;
  sourceCountry?: string;
  destinationCountry?: string;
  taxJurisdiction?: string;
  calculationDetails: Record<string, any>;
  status: string;
  errorDetails?: any;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrossBorderRevenueAllocation {
  id: string;
  businessAccountId: string;
  transactionId: string;
  totalRevenue: number;
  currency: string;
  allocationMethod: string;
  allocations: any[];
  sourceCountry: string;
  destinationCountries: string[];
  allocationDate: Date;
  exchangeRates: Record<string, number>;
  allocationRules: Record<string, any>;
  isFinal: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxExposureAnalysis {
  id: string;
  businessAccountId: string;
  countryId: string;
  analysisPeriodStart: Date;
  analysisPeriodEnd: Date;
  totalRevenue: number;
  totalExpenses: number;
  taxableIncome: number;
  estimatedTaxLiability: number;
  paidTax: number;
  outstandingTaxLiability: number;
  taxExposureScore: number;
  riskLevel: string;
  exposureFactors: Record<string, any>;
  mitigationStrategies: any[];
  nextFilingDate?: Date;
  nextPaymentDate?: Date;
  currency: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MultiCountryTaxService {
  // Country Tax Configuration Management
  async createCountryTaxConfig(data: z.infer<typeof CountryTaxConfigSchema>): Promise<CountryTaxConfig> {
    const validated = CountryTaxConfigSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT create_country_tax_config(
        ${validated.countryCode}::varchar,
        ${validated.countryName}::varchar,
        ${validated.taxJurisdiction}::varchar,
        ${validated.currency}::varchar,
        ${validated.taxYearStart}::date,
        ${validated.taxYearEnd}::date,
        ${validated.corporateTaxRate}::decimal,
        ${validated.vatRate}::decimal,
        ${validated.gstRate}::decimal,
        ${JSON.stringify(validated.withholdingTaxRates)}::jsonb,
        ${JSON.stringify(validated.taxTreaties)}::jsonb,
        ${JSON.stringify(validated.taxHolidays)}::jsonb,
        ${JSON.stringify(validated.complianceRequirements)}::jsonb,
        ${validated.filingFrequency}::varchar,
        ${validated.paymentFrequency}::varchar,
        ${validated.createdBy}::uuid
      ) as config_id
    `;
    
    const configId = (result as any)[0]?.config_id;
    return this.getCountryTaxConfig(configId);
  }

  async getCountryTaxConfig(configId: string): Promise<CountryTaxConfig> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        country_code as "countryCode",
        country_name as "countryName",
        tax_jurisdiction as "taxJurisdiction",
        currency,
        tax_year_start as "taxYearStart",
        tax_year_end as "taxYearEnd",
        corporate_tax_rate as "corporateTaxRate",
        vat_rate as "vatRate",
        gst_rate as "gstRate",
        withholding_tax_rates as "withholdingTaxRates",
        tax_treaties as "taxTreaties",
        tax_holidays as "taxHolidays",
        compliance_requirements as "complianceRequirements",
        filing_frequency as "filingFrequency",
        payment_frequency as "paymentFrequency",
        status,
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM country_tax_configurations
      WHERE id = ${configId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getCountryTaxConfigs(filters: {
    countryCode?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<CountryTaxConfig[]> {
    const { countryCode, status, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        country_code as "countryCode",
        country_name as "countryName",
        tax_jurisdiction as "taxJurisdiction",
        currency,
        tax_year_start as "taxYearStart",
        tax_year_end as "taxYearEnd",
        corporate_tax_rate as "corporateTaxRate",
        vat_rate as "vatRate",
        gst_rate as "gstRate",
        withholding_tax_rates as "withholdingTaxRates",
        tax_treaties as "taxTreaties",
        tax_holidays as "taxHolidays",
        compliance_requirements as "complianceRequirements",
        filing_frequency as "filingFrequency",
        payment_frequency as "paymentFrequency",
        status,
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM country_tax_configurations
      WHERE 1=1
    `;
    
    if (countryCode) {
      query += ` AND country_code = '${countryCode}'`;
    }
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    query += ` ORDER BY country_code ASC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as CountryTaxConfig[];
  }

  // Tax Rules Management
  async createTaxRule(data: z.infer<typeof TaxRuleSchema>): Promise<TaxRule> {
    const validated = TaxRuleSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT create_tax_rule(
        ${validated.countryId}::uuid,
        ${validated.ruleName}::varchar,
        ${validated.ruleType}::varchar,
        ${validated.ruleDescription || null}::text,
        ${JSON.stringify(validated.applicableTransactions)}::jsonb,
        ${validated.taxRate}::decimal,
        ${validated.taxBase}::varchar,
        ${validated.calculationMethod}::varchar,
        ${JSON.stringify(validated.tierRates)}::jsonb,
        ${JSON.stringify(validated.exemptions)}::jsonb,
        ${JSON.stringify(validated.conditions)}::jsonb,
        ${validated.effectiveDate}::date,
        ${validated.expiryDate || null}::date,
        ${validated.priority}::integer,
        ${validated.createdBy}::uuid
      ) as rule_id
    `;
    
    const ruleId = (result as any)[0]?.rule_id;
    return this.getTaxRule(ruleId);
  }

  async getTaxRule(ruleId: string): Promise<TaxRule> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        country_id as "countryId",
        rule_name as "ruleName",
        rule_type as "ruleType",
        rule_description as "ruleDescription",
        applicable_transactions as "applicableTransactions",
        tax_rate as "taxRate",
        tax_base as "taxBase",
        calculation_method as "calculationMethod",
        tier_rates as "tierRates",
        exemptions,
        conditions,
        effective_date as "effectiveDate",
        expiry_date as "expiryDate",
        priority,
        is_active as "isActive",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM tax_rules
      WHERE id = ${ruleId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getTaxRules(countryId: string, filters: {
    ruleType?: string;
    isActive?: boolean;
    limit?: number;
  } = {}): Promise<TaxRule[]> {
    const { ruleType, isActive, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        country_id as "countryId",
        rule_name as "ruleName",
        rule_type as "ruleType",
        rule_description as "ruleDescription",
        applicable_transactions as "applicableTransactions",
        tax_rate as "taxRate",
        tax_base as "taxBase",
        calculation_method as "calculationMethod",
        tier_rates as "tierRates",
        exemptions,
        conditions,
        effective_date as "effectiveDate",
        expiry_date as "expiryDate",
        priority,
        is_active as "isActive",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM tax_rules
      WHERE country_id = ${countryId}::uuid
    `;
    
    if (ruleType) {
      query += ` AND rule_type = '${ruleType}'`;
    }
    
    if (isActive !== undefined) {
      query += ` AND is_active = ${isActive}`;
    }
    
    query += ` ORDER BY priority ASC, effective_date DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as TaxRule[];
  }

  // Transaction Tax Mapping
  async calculateTransactionTax(data: z.infer<typeof TransactionTaxMappingSchema>): Promise<TransactionTaxMapping> {
    const validated = TransactionTaxMappingSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT calculate_transaction_tax(
        ${validated.businessAccountId}::uuid,
        ${validated.transactionId}::uuid,
        ${validated.countryId}::uuid,
        ${validated.taxType}::varchar,
        ${validated.taxableAmount}::decimal,
        ${validated.currency}::varchar,
        ${validated.exchangeRate}::decimal,
        ${validated.isCrossBorder}::boolean,
        ${validated.sourceCountry || null}::varchar,
        ${validated.destinationCountry || null}::varchar,
        ${validated.createdBy}::uuid
      ) as mapping_id
    `;
    
    const mappingId = (result as any)[0]?.mapping_id;
    return this.getTransactionTaxMapping(mappingId);
  }

  async getTransactionTaxMapping(mappingId: string): Promise<TransactionTaxMapping> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        transaction_id as "transactionId",
        country_id as "countryId",
        tax_rule_id as "taxRuleId",
        transaction_type as "transactionType",
        transaction_category as "transactionCategory",
        tax_type as "taxType",
        taxable_amount as "taxableAmount",
        tax_rate as "taxRate",
        calculated_tax as "calculatedTax",
        currency,
        exchange_rate as "exchangeRate",
        is_cross_border as "isCrossBorder",
        source_country as "sourceCountry",
        destination_country as "destinationCountry",
        tax_jurisdiction as "taxJurisdiction",
        calculation_details as "calculationDetails",
        status,
        error_details as "errorDetails",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM transaction_tax_mappings
      WHERE id = ${mappingId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getTransactionTaxMappings(businessAccountId: string, filters: {
    countryId?: string;
    taxType?: string;
    isCrossBorder?: boolean;
    status?: string;
    limit?: number;
  } = {}): Promise<TransactionTaxMapping[]> {
    const { countryId, taxType, isCrossBorder, status, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        transaction_id as "transactionId",
        country_id as "countryId",
        tax_rule_id as "taxRuleId",
        transaction_type as "transactionType",
        transaction_category as "transactionCategory",
        tax_type as "taxType",
        taxable_amount as "taxableAmount",
        tax_rate as "taxRate",
        calculated_tax as "calculatedTax",
        currency,
        exchange_rate as "exchangeRate",
        is_cross_border as "isCrossBorder",
        source_country as "sourceCountry",
        destination_country as "destinationCountry",
        tax_jurisdiction as "taxJurisdiction",
        calculation_details as "calculationDetails",
        status,
        error_details as "errorDetails",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM transaction_tax_mappings
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (countryId) {
      query += ` AND country_id = ${countryId}::uuid`;
    }
    
    if (taxType) {
      query += ` AND tax_type = '${taxType}'`;
    }
    
    if (isCrossBorder !== undefined) {
      query += ` AND is_cross_border = ${isCrossBorder}`;
    }
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as TransactionTaxMapping[];
  }

  // Cross-Border Revenue Allocation
  async allocateCrossBorderRevenue(data: {
    businessAccountId: string;
    transactionId: string;
    totalRevenue: number;
    currency: string;
    allocationMethod: string;
    allocations: any[];
    sourceCountry: string;
    destinationCountries: string[];
    exchangeRates: Record<string, number>;
    allocationRules: Record<string, any>;
    createdBy: string;
  }): Promise<CrossBorderRevenueAllocation> {
    const result = await prisma.$queryRaw`
      INSERT INTO cross_border_revenue_allocation (
        id,
        business_account_id,
        transaction_id,
        total_revenue,
        currency,
        allocation_method,
        allocations,
        source_country,
        destination_countries,
        allocation_date,
        exchange_rates,
        allocation_rules,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${data.businessAccountId}::uuid,
        ${data.transactionId}::uuid,
        ${data.totalRevenue}::decimal,
        ${data.currency}::varchar,
        ${data.allocationMethod}::varchar,
        ${JSON.stringify(data.allocations)}::jsonb,
        ${data.sourceCountry}::varchar,
        ${JSON.stringify(data.destinationCountries)}::jsonb,
        CURRENT_TIMESTAMP::date,
        ${JSON.stringify(data.exchangeRates)}::jsonb,
        ${JSON.stringify(data.allocationRules)}::jsonb,
        ${data.createdBy}::uuid
      ) RETURNING id
    `;
    
    const allocationId = (result as any)[0]?.id;
    return this.getCrossBorderRevenueAllocation(allocationId);
  }

  async getCrossBorderRevenueAllocation(allocationId: string): Promise<CrossBorderRevenueAllocation> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        transaction_id as "transactionId",
        total_revenue as "totalRevenue",
        currency,
        allocation_method as "allocationMethod",
        allocations,
        source_country as "sourceCountry",
        destination_countries as "destinationCountries",
        allocation_date as "allocationDate",
        exchange_rates as "exchangeRates",
        allocation_rules as "allocationRules",
        is_final as "isFinal",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM cross_border_revenue_allocation
      WHERE id = ${allocationId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getCrossBorderRevenueAllocations(businessAccountId: string, filters: {
    sourceCountry?: string;
    destinationCountry?: string;
    allocationDate?: string;
    limit?: number;
  } = {}): Promise<CrossBorderRevenueAllocation[]> {
    const { sourceCountry, destinationCountry, allocationDate, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        transaction_id as "transactionId",
        total_revenue as "totalRevenue",
        currency,
        allocation_method as "allocationMethod",
        allocations,
        source_country as "sourceCountry",
        destination_countries as "destinationCountries",
        allocation_date as "allocationDate",
        exchange_rates as "exchangeRates",
        allocation_rules as "allocationRules",
        is_final as "isFinal",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM cross_border_revenue_allocation
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (sourceCountry) {
      query += ` AND source_country = '${sourceCountry}'`;
    }
    
    if (destinationCountry) {
      query += ` AND destination_countries @> '${destinationCountry}'::jsonb`;
    }
    
    if (allocationDate) {
      query += ` AND allocation_date >= '${allocationDate}'`;
    }
    
    query += ` ORDER BY allocation_date DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as CrossBorderRevenueAllocation[];
  }

  // Tax Exposure Analysis
  async analyzeTaxExposure(data: {
    businessAccountId: string;
    countryId: string;
    analysisPeriodStart: string;
    analysisPeriodEnd: string;
    totalRevenue: number;
    totalExpenses: number;
    taxableIncome: number;
    estimatedTaxLiability: number;
    paidTax: number;
    exposureFactors: Record<string, any>;
    mitigationStrategies: any[];
    nextFilingDate?: string;
    nextPaymentDate?: string;
    currency: string;
    createdBy: string;
  }): Promise<TaxExposureAnalysis> {
    const outstandingTaxLiability = data.estimatedTaxLiability - data.paidTax;
    const taxExposureScore = this.calculateTaxExposureScore(
      data.totalRevenue,
      data.estimatedTaxLiability,
      outstandingTaxLiability,
      data.exposureFactors
    );
    const riskLevel = this.determineRiskLevel(taxExposureScore);

    const result = await prisma.$queryRaw`
      INSERT INTO tax_exposure_analysis (
        id,
        business_account_id,
        country_id,
        analysis_period_start,
        analysis_period_end,
        total_revenue,
        total_expenses,
        taxable_income,
        estimated_tax_liability,
        paid_tax,
        outstanding_tax_liability,
        tax_exposure_score,
        risk_level,
        exposure_factors,
        mitigation_strategies,
        next_filing_date,
        next_payment_date,
        currency,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${data.businessAccountId}::uuid,
        ${data.countryId}::uuid,
        ${data.analysisPeriodStart}::date,
        ${data.analysisPeriodEnd}::date,
        ${data.totalRevenue}::decimal,
        ${data.totalExpenses}::decimal,
        ${data.taxableIncome}::decimal,
        ${data.estimatedTaxLiability}::decimal,
        ${data.paidTax}::decimal,
        ${outstandingTaxLiability}::decimal,
        ${taxExposureScore}::decimal,
        ${riskLevel}::varchar,
        ${JSON.stringify(data.exposureFactors)}::jsonb,
        ${JSON.stringify(data.mitigationStrategies)}::jsonb,
        ${data.nextFilingDate || null}::date,
        ${data.nextPaymentDate || null}::date,
        ${data.currency}::varchar,
        ${data.createdBy}::uuid
      ) RETURNING id
    `;
    
    const analysisId = (result as any)[0]?.id;
    return this.getTaxExposureAnalysis(analysisId);
  }

  async getTaxExposureAnalysis(analysisId: string): Promise<TaxExposureAnalysis> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        country_id as "countryId",
        analysis_period_start as "analysisPeriodStart",
        analysis_period_end as "analysisPeriodEnd",
        total_revenue as "totalRevenue",
        total_expenses as "totalExpenses",
        taxable_income as "taxableIncome",
        estimated_tax_liability as "estimatedTaxLiability",
        paid_tax as "paidTax",
        outstanding_tax_liability as "outstandingTaxLiability",
        tax_exposure_score as "taxExposureScore",
        risk_level as "riskLevel",
        exposure_factors as "exposureFactors",
        mitigation_strategies as "mitigationStrategies",
        next_filing_date as "nextFilingDate",
        next_payment_date as "nextPaymentDate",
        currency,
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM tax_exposure_analysis
      WHERE id = ${analysisId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getTaxExposureAnalyses(businessAccountId: string, filters: {
    countryId?: string;
    riskLevel?: string;
    limit?: number;
  } = {}): Promise<TaxExposureAnalysis[]> {
    const { countryId, riskLevel, limit = 20 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        country_id as "countryId",
        analysis_period_start as "analysisPeriodStart",
        analysis_period_end as "analysisPeriodEnd",
        total_revenue as "totalRevenue",
        total_expenses as "totalExpenses",
        taxable_income as "taxableIncome",
        estimated_tax_liability as "estimatedTaxLiability",
        paid_tax as "paidTax",
        outstanding_tax_liability as "outstandingTaxLiability",
        tax_exposure_score as "taxExposureScore",
        risk_level as "riskLevel",
        exposure_factors as "exposureFactors",
        mitigation_strategies as "mitigationStrategies",
        next_filing_date as "nextFilingDate",
        next_payment_date as "nextPaymentDate",
        currency,
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM tax_exposure_analysis
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (countryId) {
      query += ` AND country_id = ${countryId}::uuid`;
    }
    
    if (riskLevel) {
      query += ` AND risk_level = '${riskLevel}'`;
    }
    
    query += ` ORDER BY analysis_period_end DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as TaxExposureAnalysis[];
  }

  // Analytics and Summary
  async getTaxComplianceDashboard(businessAccountId: string): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT * FROM tax_compliance_dashboard
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    return result as any[];
  }

  async getTaxExposureSummary(businessAccountId: string): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT * FROM tax_exposure_summary
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    return result as any[];
  }

  async getCrossBorderTaxSummary(businessAccountId: string): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT * FROM cross_border_tax_summary
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    return result as any[];
  }

  // Materialized View Refresh
  async refreshTaxAnalytics(): Promise<void> {
    await prisma.$queryRaw`SELECT refresh_tax_materialized_views()`;
  }

  // Helper Methods
  private calculateTaxExposureScore(
    totalRevenue: number,
    estimatedTaxLiability: number,
    outstandingTaxLiability: number,
    exposureFactors: Record<string, any>
  ): number {
    let score = 0;
    
    // Base score from outstanding liability ratio
    if (estimatedTaxLiability > 0) {
      score += (outstandingTaxLiability / estimatedTaxLiability) * 50;
    }
    
    // Add exposure factors
    if (exposureFactors.crossBorderRisk) {
      score += exposureFactors.crossBorderRisk * 20;
    }
    
    if (exposureFactors.complexityRisk) {
      score += exposureFactors.complexityRisk * 15;
    }
    
    if (exposureFactors.regulatoryRisk) {
      score += exposureFactors.regulatoryRisk * 15;
    }
    
    return Math.min(score, 100);
  }

  private determineRiskLevel(score: number): string {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  // Activity Logging
  async logActivity(data: {
    businessAccountId: string;
    countryId: string;
    activityType: string;
    activityDescription: string;
    entityType?: string;
    entityId?: string;
    entityName?: string;
    previousValues?: Record<string, any>;
    newValues?: Record<string, any>;
    changeReason?: string;
    performedBy?: string;
    userRole?: string;
    userEmail?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    complianceImpact?: string;
    requiresReview?: boolean;
  }): Promise<void> {
    await prisma.$queryRaw`
      INSERT INTO tax_audit_logs (
        id,
        business_account_id,
        country_id,
        activity_type,
        activity_description,
        entity_type,
        entity_id,
        entity_name,
        previous_values,
        new_values,
        change_reason,
        performed_by,
        user_role,
        user_email,
        session_id,
        ip_address,
        user_agent,
        compliance_impact,
        requires_review,
        performed_at
      ) VALUES (
        ${uuidv4()}::uuid,
        ${data.businessAccountId}::uuid,
        ${data.countryId}::uuid,
        ${data.activityType}::varchar,
        ${data.activityDescription}::text,
        ${data.entityType || null}::varchar,
        ${data.entityId || null}::uuid,
        ${data.entityName || null}::varchar,
        ${JSON.stringify(data.previousValues || {})}::jsonb,
        ${JSON.stringify(data.newValues || {})}::jsonb,
        ${data.changeReason || null}::text,
        ${data.performedBy || null}::uuid,
        ${data.userRole || null}::varchar,
        ${data.userEmail || null}::varchar,
        ${data.sessionId || null}::varchar,
        ${data.ipAddress || null}::inet,
        ${data.userAgent || null}::text,
        ${data.complianceImpact || 'none'}::varchar,
        ${data.requiresReview || false}::boolean,
        CURRENT_TIMESTAMP::timestamp
      )
    `;
  }
}
