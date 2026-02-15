import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const MnaReadinessSnapshotSchema = z.object({
  businessAccountId: z.string().uuid(),
  snapshotName: z.string().min(1).max(200),
  snapshotDescription: z.string().optional(),
  snapshotPeriodStart: z.string().datetime(),
  snapshotPeriodEnd: z.string().datetime(),
  valuationDate: z.string().datetime(),
  currency: z.string().default('USD'),
  exchangeRate: z.number().default(1.0),
  status: z.enum(['draft', 'final', 'archived']).default('draft'),
  createdBy: z.string().uuid()
});

const MnaNormalizedStatementSchema = z.object({
  snapshotId: z.string().uuid(),
  statementType: z.enum(['income_statement', 'balance_sheet', 'cash_flow']),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  currency: z.string().default('USD'),
  reportedRevenue: z.number(),
  normalizedRevenue: z.number(),
  revenueAdjustments: z.array(z.any()).default([]),
  reportedExpenses: z.number(),
  normalizedExpenses: z.number(),
  expenseAdjustments: z.array(z.any()).default([]),
  reportedEbitda: z.number(),
  adjustedEbitda: z.number(),
  ebitdaAdjustments: z.array(z.any()).default([]),
  reportedNetIncome: z.number(),
  normalizedNetIncome: z.number(),
  netIncomeAdjustments: z.array(z.any()).default([]),
  totalAssets: z.number().optional(),
  totalLiabilities: z.number().optional(),
  equity: z.number().optional(),
  workingCapital: z.number().optional(),
  operatingCashFlow: z.number().optional(),
  investingCashFlow: z.number().optional(),
  financingCashFlow: z.number().optional(),
  freeCashFlow: z.number().optional()
});

const MnaNonRecurringItemSchema = z.object({
  snapshotId: z.string().uuid(),
  itemName: z.string().min(1).max(200),
  itemType: z.enum(['revenue', 'expense', 'gain', 'loss']),
  itemCategory: z.string().min(1).max(50),
  amount: z.number(),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  description: z.string().optional(),
  justification: z.string().optional(),
  supportingDocuments: z.array(z.any()).default([]),
  classification: z.enum(['one_time', 'extraordinary', 'discontinued', 'restructuring', 'other']),
  impactOnEbitda: z.number(),
  impactOnNetIncome: z.number(),
  createdBy: z.string().uuid()
});

const MnaScenarioSchema = z.object({
  snapshotId: z.string().uuid(),
  scenarioName: z.string().min(1).max(200),
  scenarioType: z.enum(['base_case', 'optimistic', 'conservative', 'custom']),
  scenarioDescription: z.string().optional(),
  timeHorizonYears: z.number().default(5),
  revenueGrowthRates: z.array(z.number()),
  revenueDrivers: z.record(z.any()).default({}),
  expenseGrowthRates: z.array(z.number()),
  expenseEfficiencyImprovements: z.record(z.any()).default({}),
  capexAssumptions: z.record(z.any()).default({}),
  workingCapitalAssumptions: z.record(z.any()).default({}),
  discountRate: z.number().optional(),
  terminalGrowthRate: z.number().optional(),
  multiples: z.record(z.any()).default({}),
  createdBy: z.string().uuid()
});

const MnaSynergyAnalysisSchema = z.object({
  snapshotId: z.string().uuid(),
  analysisName: z.string().min(1).max(200),
  targetCompanyProfile: z.record(z.any()).default({}),
  synergyCategories: z.array(z.any()),
  crossSellingOpportunities: z.array(z.any()).default([]),
  marketExpansionOpportunities: z.array(z.any()).default([]),
  pricingPowerImprovements: z.array(z.any()).default([]),
  revenueSynergyValue: z.number().default(0),
  operationalEfficiencies: z.array(z.any()).default([]),
  procurementSavings: z.array(z.any()).default([]),
  overheadReduction: z.array(z.any()).default([]),
  costSynergyValue: z.number().default(0),
  implementationTimeline: z.record(z.any()).default({}),
  realizationRates: z.record(z.any()).default({}),
  createdBy: z.string().uuid()
});

export interface MnaReadinessSnapshot {
  id: string;
  businessAccountId: string;
  snapshotName: string;
  snapshotDescription?: string;
  snapshotPeriodStart: Date;
  snapshotPeriodEnd: Date;
  valuationDate: Date;
  currency: string;
  exchangeRate: number;
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MnaNormalizedStatement {
  id: string;
  snapshotId: string;
  statementType: string;
  periodStart: Date;
  periodEnd: Date;
  currency: string;
  reportedRevenue: number;
  normalizedRevenue: number;
  revenueAdjustments: any[];
  reportedExpenses: number;
  normalizedExpenses: number;
  expenseAdjustments: any[];
  reportedEbitda: number;
  adjustedEbitda: number;
  ebitdaAdjustments: any[];
  reportedNetIncome: number;
  normalizedNetIncome: number;
  netIncomeAdjustments: any[];
  totalAssets?: number;
  totalLiabilities?: number;
  equity?: number;
  workingCapital?: number;
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  freeCashFlow?: number;
  verificationStatus: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  notes?: string;
  createdAt: Date;
}

export interface MnaNonRecurringItem {
  id: string;
  snapshotId: string;
  itemName: string;
  itemType: string;
  itemCategory: string;
  amount: number;
  periodStart: Date;
  periodEnd: Date;
  description?: string;
  justification?: string;
  supportingDocuments: any[];
  classification: string;
  impactOnEbitda: number;
  impactOnNetIncome: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MnaScenario {
  id: string;
  snapshotId: string;
  scenarioName: string;
  scenarioType: string;
  scenarioDescription?: string;
  timeHorizonYears: number;
  revenueGrowthRates: number[];
  revenueDrivers: any;
  expenseGrowthRates: number[];
  expenseEfficiencyImprovements: any;
  capexAssumptions: any;
  workingCapitalAssumptions: any;
  discountRate?: number;
  terminalGrowthRate?: number;
  multiples: any;
  projectedRevenue: any;
  projectedEbitda: any;
  projectedCashFlow: any;
  valuationResults: any;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MnaSynergyAnalysis {
  id: string;
  snapshotId: string;
  analysisName: string;
  targetCompanyProfile: any;
  synergyCategories: any[];
  crossSellingOpportunities: any[];
  marketExpansionOpportunities: any[];
  pricingPowerImprovements: any[];
  revenueSynergyValue: number;
  operationalEfficiencies: any[];
  procurementSavings: any[];
  overheadReduction: any[];
  costSynergyValue: number;
  implementationTimeline: any;
  realizationRates: any;
  totalSynergyValue: number;
  npvOfSynergies?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class MnaReadinessService {
  // M&A Readiness Snapshot Management
  async createReadinessSnapshot(data: z.infer<typeof MnaReadinessSnapshotSchema>): Promise<MnaReadinessSnapshot> {
    const validated = MnaReadinessSnapshotSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT generate_mna_readiness_snapshot(
        ${validated.businessAccountId}::uuid,
        ${validated.snapshotName}::varchar,
        ${validated.snapshotPeriodStart}::date,
        ${validated.snapshotPeriodEnd}::date,
        ${validated.createdBy}::uuid
      ) as snapshot_id
    `;
    
    const snapshotId = (result as any)[0]?.snapshot_id;
    
    // Update additional fields
    await prisma.$queryRaw`
      UPDATE mna_readiness_snapshots 
      SET 
        snapshot_description = ${validated.snapshotDescription || null}::text,
        valuation_date = ${validated.valuationDate}::date,
        currency = ${validated.currency}::varchar,
        exchange_rate = ${validated.exchangeRate}::decimal,
        status = ${validated.status}::varchar
      WHERE id = ${snapshotId}::uuid
    `;
    
    return this.getReadinessSnapshot(snapshotId);
  }

  async getReadinessSnapshot(snapshotId: string): Promise<MnaReadinessSnapshot> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        snapshot_name as "snapshotName",
        snapshot_description as "snapshotDescription",
        snapshot_period_start as "snapshotPeriodStart",
        snapshot_period_end as "snapshotPeriodEnd",
        valuation_date as "valuationDate",
        currency,
        exchange_rate as "exchangeRate",
        status,
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM mna_readiness_snapshots
      WHERE id = ${snapshotId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getReadinessSnapshots(businessAccountId: string, filters: {
    status?: string;
    limit?: number;
  } = {}): Promise<MnaReadinessSnapshot[]> {
    const { status, limit = 20 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        snapshot_name as "snapshotName",
        snapshot_description as "snapshotDescription",
        snapshot_period_start as "snapshotPeriodStart",
        snapshot_period_end as "snapshotPeriodEnd",
        valuation_date as "valuationDate",
        currency,
        exchange_rate as "exchangeRate",
        status,
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM mna_readiness_snapshots
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as MnaReadinessSnapshot[];
  }

  // Normalized Financial Statements Management
  async createNormalizedStatement(data: z.infer<typeof MnaNormalizedStatementSchema>): Promise<MnaNormalizedStatement> {
    const validated = MnaNormalizedStatementSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT create_normalized_statement(
        ${validated.snapshotId}::uuid,
        ${validated.statementType}::varchar,
        ${validated.periodStart}::date,
        ${validated.periodEnd}::date,
        ${validated.reportedRevenue}::decimal,
        ${validated.normalizedRevenue}::decimal,
        ${validated.reportedEbitda}::decimal,
        ${validated.adjustedEbitda}::decimal,
        ${validated.reportedNetIncome}::decimal,
        ${validated.normalizedNetIncome}::decimal,
        ${validated.createdBy}::uuid
      ) as statement_id
    `;
    
    const statementId = (result as any)[0]?.statement_id;
    
    // Update additional fields
    await prisma.$queryRaw`
      UPDATE mna_normalized_statements 
      SET 
        currency = ${validated.currency}::varchar,
        revenue_adjustments = ${JSON.stringify(validated.revenueAdjustments)}::jsonb,
        reported_expenses = ${validated.reportedExpenses}::decimal,
        normalized_expenses = ${validated.normalizedExpenses}::decimal,
        expense_adjustments = ${JSON.stringify(validated.expenseAdjustments)}::jsonb,
        ebitda_adjustments = ${JSON.stringify(validated.ebitdaAdjustments)}::jsonb,
        net_income_adjustments = ${JSON.stringify(validated.netIncomeAdjustments)}::jsonb,
        total_assets = ${validated.totalAssets || null}::decimal,
        total_liabilities = ${validated.totalLiabilities || null}::decimal,
        equity = ${validated.equity || null}::decimal,
        working_capital = ${validated.workingCapital || null}::decimal,
        operating_cash_flow = ${validated.operatingCashFlow || null}::decimal,
        investing_cash_flow = ${validated.investingCashFlow || null}::decimal,
        financing_cash_flow = ${validated.financingCashFlow || null}::decimal,
        free_cash_flow = ${validated.freeCashFlow || null}::decimal
      WHERE id = ${statementId}::uuid
    `;
    
    return this.getNormalizedStatement(statementId);
  }

  async getNormalizedStatement(statementId: string): Promise<MnaNormalizedStatement> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        snapshot_id as "snapshotId",
        statement_type as "statementType",
        period_start as "periodStart",
        period_end as "periodEnd",
        currency,
        reported_revenue as "reportedRevenue",
        normalized_revenue as "normalizedRevenue",
        revenue_adjustments as "revenueAdjustments",
        reported_expenses as "reportedExpenses",
        normalized_expenses as "normalizedExpenses",
        expense_adjustments as "expenseAdjustments",
        reported_ebitda as "reportedEbitda",
        adjusted_ebitda as "adjustedEbitda",
        ebitda_adjustments as "ebitdaAdjustments",
        reported_net_income as "reportedNetIncome",
        normalized_net_income as "normalizedNetIncome",
        net_income_adjustments as "netIncomeAdjustments",
        total_assets as "totalAssets",
        total_liabilities as "totalLiabilities",
        equity,
        working_capital as "workingCapital",
        operating_cash_flow as "operatingCashFlow",
        investing_cash_flow as "investingCashFlow",
        financing_cash_flow as "financingCashFlow",
        free_cash_flow as "freeCashFlow",
        verification_status as "verificationStatus",
        verified_by as "verifiedBy",
        verified_at as "verifiedAt",
        notes,
        created_at as "createdAt"
      FROM mna_normalized_statements
      WHERE id = ${statementId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getNormalizedStatements(snapshotId: string): Promise<MnaNormalizedStatement[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        snapshot_id as "snapshotId",
        statement_type as "statementType",
        period_start as "periodStart",
        period_end as "periodEnd",
        currency,
        reported_revenue as "reportedRevenue",
        normalized_revenue as "normalizedRevenue",
        revenue_adjustments as "revenueAdjustments",
        reported_expenses as "reportedExpenses",
        normalized_expenses as "normalizedExpenses",
        expense_adjustments as "expenseAdjustments",
        reported_ebitda as "reportedEbitda",
        adjusted_ebitda as "adjustedEbitda",
        ebitda_adjustments as "ebitdaAdjustments",
        reported_net_income as "reportedNetIncome",
        normalized_net_income as "normalizedNetIncome",
        net_income_adjustments as "netIncomeAdjustments",
        total_assets as "totalAssets",
        total_liabilities as "totalLiabilities",
        equity,
        working_capital as "workingCapital",
        operating_cash_flow as "operatingCashFlow",
        investing_cash_flow as "investingCashFlow",
        financing_cash_flow as "financingCashFlow",
        free_cash_flow as "freeCashFlow",
        verification_status as "verificationStatus",
        verified_by as "verifiedBy",
        verified_at as "verifiedAt",
        notes,
        created_at as "createdAt"
      FROM mna_normalized_statements
      WHERE snapshot_id = ${snapshotId}::uuid
      ORDER BY period_start DESC
    `;
    
    return result as MnaNormalizedStatement[];
  }

  // Non-Recurring Items Management
  async createNonRecurringItem(data: z.infer<typeof MnaNonRecurringItemSchema>): Promise<MnaNonRecurringItem> {
    const validated = MnaNonRecurringItemSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO mna_non_recurring_items (
        id,
        snapshot_id,
        item_name,
        item_type,
        item_category,
        amount,
        period_start,
        period_end,
        description,
        justification,
        supporting_documents,
        classification,
        impact_on_ebitda,
        impact_on_net_income,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.snapshotId}::uuid,
        ${validated.itemName}::varchar,
        ${validated.itemType}::varchar,
        ${validated.itemCategory}::varchar,
        ${validated.amount}::decimal,
        ${validated.periodStart}::date,
        ${validated.periodEnd}::date,
        ${validated.description || null}::text,
        ${validated.justification || null}::text,
        ${JSON.stringify(validated.supportingDocuments)}::jsonb,
        ${validated.classification}::varchar,
        ${validated.impactOnEbitda}::decimal,
        ${validated.impactOnNetIncome}::decimal,
        ${validated.createdBy}::uuid
      ) RETURNING *
    `;
    
    return (result as any)[0];
  }

  async getNonRecurringItems(snapshotId: string): Promise<MnaNonRecurringItem[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        snapshot_id as "snapshotId",
        item_name as "itemName",
        item_type as "itemType",
        item_category as "itemCategory",
        amount,
        period_start as "periodStart",
        period_end as "periodEnd",
        description,
        justification,
        supporting_documents as "supportingDocuments",
        classification,
        impact_on_ebitda as "impactOnEbitda",
        impact_on_net_income as "impactOnNetIncome",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM mna_non_recurring_items
      WHERE snapshot_id = ${snapshotId}::uuid
      ORDER BY period_start DESC
    `;
    
    return result as MnaNonRecurringItem[];
  }

  // Scenario Analysis Management
  async createScenario(data: z.infer<typeof MnaScenarioSchema>): Promise<MnaScenario> {
    const validated = MnaScenarioSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT create_mna_scenario(
        ${validated.snapshotId}::uuid,
        ${validated.scenarioName}::varchar,
        ${validated.scenarioType}::varchar,
        ${validated.timeHorizonYears}::integer,
        ${JSON.stringify(validated.revenueGrowthRates)}::jsonb,
        ${JSON.stringify(validated.expenseGrowthRates)}::jsonb,
        ${validated.discountRate || null}::decimal,
        ${validated.terminalGrowthRate || null}::decimal,
        ${validated.createdBy}::uuid
      ) as scenario_id
    `;
    
    const scenarioId = (result as any)[0]?.scenario_id;
    
    // Update additional fields
    await prisma.$queryRaw`
      UPDATE mna_scenarios 
      SET 
        scenario_description = ${validated.scenarioDescription || null}::text,
        revenue_drivers = ${JSON.stringify(validated.revenueDrivers)}::jsonb,
        expense_efficiency_improvements = ${JSON.stringify(validated.expenseEfficiencyImprovements)}::jsonb,
        capex_assumptions = ${JSON.stringify(validated.capexAssumptions)}::jsonb,
        working_capital_assumptions = ${JSON.stringify(validated.workingCapitalAssumptions)}::jsonb,
        multiples = ${JSON.stringify(validated.multiples)}::jsonb
      WHERE id = ${scenarioId}::uuid
    `;
    
    return this.getScenario(scenarioId);
  }

  async getScenario(scenarioId: string): Promise<MnaScenario> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        snapshot_id as "snapshotId",
        scenario_name as "scenarioName",
        scenario_type as "scenarioType",
        scenario_description as "scenarioDescription",
        time_horizon_years as "timeHorizonYears",
        revenue_growth_rates as "revenueGrowthRates",
        revenue_drivers as "revenueDrivers",
        expense_growth_rates as "expenseGrowthRates",
        expense_efficiency_improvements as "expenseEfficiencyImprovements",
        capex_assumptions as "capexAssumptions",
        working_capital_assumptions as "workingCapitalAssumptions",
        discount_rate as "discountRate",
        terminal_growth_rate as "terminalGrowthRate",
        multiples,
        projected_revenue as "projectedRevenue",
        projected_ebitda as "projectedEbitda",
        projected_cash_flow as "projectedCashFlow",
        valuation_results as "valuationResults",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM mna_scenarios
      WHERE id = ${scenarioId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getScenarios(snapshotId: string): Promise<MnaScenario[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        snapshot_id as "snapshotId",
        scenario_name as "scenarioName",
        scenario_type as "scenarioType",
        scenario_description as "scenarioDescription",
        time_horizon_years as "timeHorizonYears",
        revenue_growth_rates as "revenueGrowthRates",
        revenue_drivers as "revenueDrivers",
        expense_growth_rates as "expenseGrowthRates",
        expense_efficiency_improvements as "expenseEfficiencyImprovements",
        capex_assumptions as "capexAssumptions",
        working_capital_assumptions as "workingCapitalAssumptions",
        discount_rate as "discountRate",
        terminal_growth_rate as "terminalGrowthRate",
        multiples,
        projected_revenue as "projectedRevenue",
        projected_ebitda as "projectedEbitda",
        projected_cash_flow as "projectedCashFlow",
        valuation_results as "valuationResults",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM mna_scenarios
      WHERE snapshot_id = ${snapshotId}::uuid
      ORDER BY created_at DESC
    `;
    
    return result as MnaScenario[];
  }

  // Synergy Analysis Management
  async createSynergyAnalysis(data: z.infer<typeof MnaSynergyAnalysisSchema>): Promise<MnaSynergyAnalysis> {
    const validated = MnaSynergyAnalysisSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO mna_synergy_analysis (
        id,
        snapshot_id,
        analysis_name,
        target_company_profile,
        synergy_categories,
        cross_selling_opportunities,
        market_expansion_opportunities,
        pricing_power_improvements,
        revenue_synergy_value,
        operational_efficiencies,
        procurement_savings,
        overhead_reduction,
        cost_synergy_value,
        implementation_timeline,
        realization_rates,
        total_synergy_value,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.snapshotId}::uuid,
        ${validated.analysisName}::varchar,
        ${JSON.stringify(validated.targetCompanyProfile)}::jsonb,
        ${JSON.stringify(validated.synergyCategories)}::jsonb,
        ${JSON.stringify(validated.crossSellingOpportunities)}::jsonb,
        ${JSON.stringify(validated.marketExpansionOpportunities)}::jsonb,
        ${JSON.stringify(validated.pricingPowerImprovements)}::jsonb,
        ${validated.revenueSynergyValue}::decimal,
        ${JSON.stringify(validated.operationalEfficiencies)}::jsonb,
        ${JSON.stringify(validated.procurementSavings)}::jsonb,
        ${JSON.stringify(validated.overheadReduction)}::jsonb,
        ${validated.costSynergyValue}::decimal,
        ${JSON.stringify(validated.implementationTimeline)}::jsonb,
        ${JSON.stringify(validated.realizationRates)}::jsonb,
        ${validated.revenueSynergyValue + validated.costSynergyValue}::decimal,
        ${validated.createdBy}::uuid
      ) RETURNING *
    `;
    
    return (result as any)[0];
  }

  async getSynergyAnalysis(snapshotId: string): Promise<MnaSynergyAnalysis[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        snapshot_id as "snapshotId",
        analysis_name as "analysisName",
        target_company_profile as "targetCompanyProfile",
        synergy_categories as "synergyCategories",
        cross_selling_opportunities as "crossSellingOpportunities",
        market_expansion_opportunities as "marketExpansionOpportunities",
        pricing_power_improvements as "pricingPowerImprovements",
        revenue_synergy_value as "revenueSynergyValue",
        operational_efficiencies as "operationalEfficiencies",
        procurement_savings as "procurementSavings",
        overhead_reduction as "overheadReduction",
        cost_synergy_value as "costSynergyValue",
        implementation_timeline as "implementationTimeline",
        realization_rates as "realizationRates",
        total_synergy_value as "totalSynergyValue",
        npv_of_synergies as "npvOfSynergies",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM mna_synergy_analysis
      WHERE snapshot_id = ${snapshotId}::uuid
      ORDER BY created_at DESC
    `;
    
    return result as MnaSynergyAnalysis[];
  }

  // Analytics and Summary
  async getReadinessSummary(businessAccountId: string): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT * FROM mna_readiness_summary
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    return result as any[];
  }

  async getNormalizationSummary(snapshotId: string): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT * FROM mna_normalization_summary
      WHERE snapshot_id = ${snapshotId}::uuid
      ORDER BY period_start DESC
    `;
    
    return result as any[];
  }

  async getScenarioSummary(snapshotId: string): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT * FROM mna_scenario_summary
      WHERE snapshot_id = ${snapshotId}::uuid
      ORDER BY scenario_type, created_at DESC
    `;
    
    return result as any[];
  }

  // Materialized View Refresh
  async refreshMnaAnalytics(): Promise<void> {
    await prisma.$queryRaw`SELECT refresh_mna_materialized_views()`;
  }

  // Activity Logging
  async logActivity(data: {
    businessAccountId: string;
    activityType: string;
    activityDescription: string;
    entityType?: string;
    entityId?: string;
    entityName?: string;
    performedBy?: string;
    userRole?: string;
    userEmail?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    activityDurationMs?: number;
    dataVolumeBytes?: number;
    additionalData?: any;
  }): Promise<void> {
    await prisma.$queryRaw`
      INSERT INTO mna_activity_log (
        id,
        business_account_id,
        activity_type,
        activity_description,
        entity_type,
        entity_id,
        entity_name,
        performed_by,
        user_role,
        user_email,
        session_id,
        ip_address,
        user_agent,
        activity_duration_ms,
        data_volume_bytes,
        additional_data,
        performed_at
      ) VALUES (
        ${uuidv4()}::uuid,
        ${data.businessAccountId}::uuid,
        ${data.activityType}::varchar,
        ${data.activityDescription}::text,
        ${data.entityType || null}::varchar,
        ${data.entityId || null}::uuid,
        ${data.entityName || null}::varchar,
        ${data.performedBy || null}::uuid,
        ${data.userRole || null}::varchar,
        ${data.userEmail || null}::varchar,
        ${data.sessionId || null}::varchar,
        ${data.ipAddress || null}::inet,
        ${data.userAgent || null}::text,
        ${data.activityDurationMs || null}::integer,
        ${data.dataVolumeBytes || null}::integer,
        ${JSON.stringify(data.additionalData || {})}::jsonb,
        CURRENT_TIMESTAMP::timestamp
      )
    `;
  }
}
