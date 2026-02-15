import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const StrategyScenarioSchema = z.object({
  businessAccountId: z.string().uuid(),
  scenarioName: z.string().min(1).max(200),
  scenarioDescription: z.string().optional(),
  scenarioType: z.enum(['growth', 'expansion', 'cost_optimization', 'funding', 'market_entry', 'product_launch', 'acquisition', 'ipo_preparation', 'risk_assessment', 'custom']),
  timeHorizonYears: z.number().int().min(1).max(20).default(10),
  baseYear: z.number().int(),
  currency: z.string().length(3).default('USD'),
  createdBy: z.string().uuid()
});

const StrategyAssumptionSchema = z.object({
  scenarioId: z.string().uuid(),
  assumptionCategory: z.enum(['revenue_growth', 'cost_structure', 'pricing', 'market_size', 'customer_acquisition', 'operational_efficiency', 'capital_expenditure', 'working_capital', 'funding', 'macro_economic', 'competitive', 'regulatory', 'technology', 'custom']),
  assumptionName: z.string().min(1).max(200),
  assumptionValue: z.number(),
  assumptionUnit: z.string().optional(),
  assumptionRangeMin: z.number().optional(),
  assumptionRangeMax: z.number().optional(),
  confidenceLevel: z.number().int().min(1).max(5).default(3),
  dataSource: z.string().optional(),
  justification: z.string().optional(),
  createdBy: z.string().uuid()
});

const FinancialProjectionSchema = z.object({
  scenarioId: z.string().uuid(),
  projectionYear: z.number().int(),
  projectionQuarter: z.number().int().min(1).max(4).optional(),
  revenue: z.number().default(0),
  costOfGoodsSold: z.number().default(0),
  grossProfit: z.number().default(0),
  operatingExpenses: z.number().default(0),
  operatingIncome: z.number().default(0),
  ebitda: z.number().default(0),
  netIncome: z.number().default(0),
  earningsPerShare: z.number().default(0),
  totalAssets: z.number().default(0),
  workingCapital: z.number().default(0),
  capitalExpenditures: z.number().default(0),
  freeCashFlow: z.number().default(0),
  cashAtEnd: z.number().default(0),
  currency: z.string().length(3).default('USD'),
  projectionType: z.enum(['pessimistic', 'base', 'optimistic', 'stretch']).default('base'),
  createdBy: z.string().uuid()
});

const DecisionImpactModelSchema = z.object({
  scenarioId: z.string().uuid(),
  decisionType: z.enum(['pricing', 'investment', 'expansion', 'hiring', 'technology', 'product', 'market', 'funding', 'acquisition', 'exit_strategy', 'custom']),
  decisionName: z.string().min(1).max(200),
  decisionDescription: z.string().optional(),
  financialImpact: z.number().default(0),
  strategicImpactScore: z.number().int().min(1).max(100).default(50),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  confidenceLevel: z.number().int().min(1).max(5).default(3),
  timeToImpactMonths: z.number().int().default(12),
  dependencies: z.array(z.any()).default([]),
  successMetrics: z.record(z.any()).default({}),
  createdBy: z.string().uuid()
});

export interface StrategyScenario {
  id: string;
  businessAccountId: string;
  scenarioName: string;
  scenarioDescription?: string;
  scenarioType: string;
  timeHorizonYears: number;
  baseYear: number;
  currency: string;
  status: string;
  isLocked: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StrategyAssumption {
  id: string;
  scenarioId: string;
  assumptionCategory: string;
  assumptionName: string;
  assumptionValue: number;
  assumptionUnit?: string;
  assumptionRangeMin?: number;
  assumptionRangeMax?: number;
  confidenceLevel: number;
  dataSource?: string;
  justification?: string;
  sensitivityAnalysis: any;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialProjection {
  id: string;
  scenarioId: string;
  projectionYear: number;
  projectionQuarter?: number;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingIncome: number;
  ebitda: number;
  netIncome: number;
  earningsPerShare: number;
  totalAssets: number;
  workingCapital: number;
  capitalExpenditures: number;
  freeCashFlow: number;
  cashAtEnd: number;
  currency: string;
  projectionType: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DecisionImpactModel {
  id: string;
  scenarioId: string;
  decisionType: string;
  decisionName: string;
  decisionDescription?: string;
  financialImpact: number;
  strategicImpactScore: number;
  riskLevel: string;
  confidenceLevel: number;
  timeToImpactMonths: number;
  dependencies: any[];
  successMetrics: any;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScenarioComparison {
  id: string;
  businessAccountId: string;
  comparisonName: string;
  comparisonDescription?: string;
  scenarioIds: string[];
  comparisonMetrics: any;
  comparisonResults: any;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScenarioSnapshot {
  id: string;
  scenarioId: string;
  snapshotName: string;
  snapshotDescription?: string;
  snapshotData: any;
  isReadOnly: boolean;
  createdBy: string;
  createdAt: Date;
}

export class StrategySimulationEngine {
  // Strategy Scenario Management
  async createScenario(data: z.infer<typeof StrategyScenarioSchema>): Promise<StrategyScenario> {
    const validated = StrategyScenarioSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO strategy_scenarios (
        id,
        business_account_id,
        scenario_name,
        scenario_description,
        scenario_type,
        time_horizon_years,
        base_year,
        currency,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.scenarioName}::varchar,
        ${validated.scenarioDescription || null}::text,
        ${validated.scenarioType}::varchar,
        ${validated.timeHorizonYears}::integer,
        ${validated.baseYear}::integer,
        ${validated.currency}::varchar,
        ${validated.createdBy}::uuid
      ) RETURNING id
    `;
    
    const scenarioId = (result as any)[0]?.id;
    return this.getScenario(scenarioId);
  }

  async getScenario(scenarioId: string): Promise<StrategyScenario> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        scenario_name as "scenarioName",
        scenario_description as "scenarioDescription",
        scenario_type as "scenarioType",
        time_horizon_years as "timeHorizonYears",
        base_year as "baseYear",
        currency,
        status,
        is_locked as "isLocked",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM strategy_scenarios
      WHERE id = ${scenarioId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getScenarios(businessAccountId: string, filters: {
    scenarioType?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<StrategyScenario[]> {
    const { scenarioType, status, limit = 20 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        scenario_name as "scenarioName",
        scenario_description as "scenarioDescription",
        scenario_type as "scenarioType",
        time_horizon_years as "timeHorizonYears",
        base_year as "baseYear",
        currency,
        status,
        is_locked as "isLocked",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM strategy_scenarios
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (scenarioType) {
      query += ` AND scenario_type = '${scenarioType}'`;
    }
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as StrategyScenario[];
  }

  async updateScenario(scenarioId: string, updates: Partial<StrategyScenario>): Promise<StrategyScenario> {
    const setClause = [];
    const values = [];
    
    if (updates.scenarioName) {
      setClause.push('scenario_name = $' + (values.length + 1));
      values.push(updates.scenarioName);
    }
    
    if (updates.scenarioDescription) {
      setClause.push('scenario_description = $' + (values.length + 1));
      values.push(updates.scenarioDescription);
    }
    
    if (updates.status) {
      setClause.push('status = $' + (values.length + 1));
      values.push(updates.status);
    }
    
    if (updates.isLocked !== undefined) {
      setClause.push('is_locked = $' + (values.length + 1));
      values.push(updates.isLocked);
    }
    
    if (setClause.length > 0) {
      values.push(scenarioId);
      await prisma.$queryRawUnsafe(`
        UPDATE strategy_scenarios 
        SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${values.length}::uuid
      `, ...values);
    }
    
    return this.getScenario(scenarioId);
  }

  // Strategy Assumptions Management
  async addAssumption(data: z.infer<typeof StrategyAssumptionSchema>): Promise<StrategyAssumption> {
    const validated = StrategyAssumptionSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO strategy_assumptions (
        id,
        scenario_id,
        assumption_category,
        assumption_name,
        assumption_value,
        assumption_unit,
        assumption_range_min,
        assumption_range_max,
        confidence_level,
        data_source,
        justification,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.scenarioId}::uuid,
        ${validated.assumptionCategory}::varchar,
        ${validated.assumptionName}::varchar,
        ${validated.assumptionValue}::decimal,
        ${validated.assumptionUnit || null}::varchar,
        ${validated.assumptionRangeMin || null}::decimal,
        ${validated.assumptionRangeMax || null}::decimal,
        ${validated.confidenceLevel}::integer,
        ${validated.dataSource || null}::varchar,
        ${validated.justification || null}::text,
        ${validated.createdBy}::uuid
      ) RETURNING id
    `;
    
    const assumptionId = (result as any)[0]?.id;
    return this.getAssumption(assumptionId);
  }

  async getAssumption(assumptionId: string): Promise<StrategyAssumption> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        scenario_id as "scenarioId",
        assumption_category as "assumptionCategory",
        assumption_name as "assumptionName",
        assumption_value as "assumptionValue",
        assumption_unit as "assumptionUnit",
        assumption_range_min as "assumptionRangeMin",
        assumption_range_max as "assumptionRangeMax",
        confidence_level as "confidenceLevel",
        data_source as "dataSource",
        justification,
        sensitivity_analysis as "sensitivityAnalysis",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM strategy_assumptions
      WHERE id = ${assumptionId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getAssumptions(scenarioId: string, filters: {
    assumptionCategory?: string;
    confidenceLevel?: number;
    limit?: number;
  } = {}): Promise<StrategyAssumption[]> {
    const { assumptionCategory, confidenceLevel, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        scenario_id as "scenarioId",
        assumption_category as "assumptionCategory",
        assumption_name as "assumptionName",
        assumption_value as "assumptionValue",
        assumption_unit as "assumptionUnit",
        assumption_range_min as "assumptionRangeMin",
        assumption_range_max as "assumptionRangeMax",
        confidence_level as "confidenceLevel",
        data_source as "dataSource",
        justification,
        sensitivity_analysis as "sensitivityAnalysis",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM strategy_assumptions
      WHERE scenario_id = ${scenarioId}::uuid
    `;
    
    if (assumptionCategory) {
      query += ` AND assumption_category = '${assumptionCategory}'`;
    }
    
    if (confidenceLevel) {
      query += ` AND confidence_level = ${confidenceLevel}`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as StrategyAssumption[];
  }

  // Financial Projections Management
  async createProjection(data: z.infer<typeof FinancialProjectionSchema>): Promise<FinancialProjection> {
    const validated = FinancialProjectionSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO financial_projections (
        id,
        scenario_id,
        projection_year,
        projection_quarter,
        revenue,
        cost_of_goods_sold,
        gross_profit,
        operating_expenses,
        operating_income,
        ebitda,
        net_income,
        earnings_per_share,
        total_assets,
        working_capital,
        capital_expenditures,
        free_cash_flow,
        cash_at_end,
        currency,
        projection_type,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.scenarioId}::uuid,
        ${validated.projectionYear}::integer,
        ${validated.projectionQuarter || null}::integer,
        ${validated.revenue}::decimal,
        ${validated.costOfGoodsSold}::decimal,
        ${validated.grossProfit}::decimal,
        ${validated.operatingExpenses}::decimal,
        ${validated.operatingIncome}::decimal,
        ${validated.ebitda}::decimal,
        ${validated.netIncome}::decimal,
        ${validated.earningsPerShare}::decimal,
        ${validated.totalAssets}::decimal,
        ${validated.workingCapital}::decimal,
        ${validated.capitalExpenditures}::decimal,
        ${validated.freeCashFlow}::decimal,
        ${validated.cashAtEnd}::decimal,
        ${validated.currency}::varchar,
        ${validated.projectionType}::varchar,
        ${validated.createdBy}::uuid
      ) RETURNING id
    `;
    
    const projectionId = (result as any)[0]?.id;
    return this.getProjection(projectionId);
  }

  async getProjection(projectionId: string): Promise<FinancialProjection> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        scenario_id as "scenarioId",
        projection_year as "projectionYear",
        projection_quarter as "projectionQuarter",
        revenue,
        cost_of_goods_sold as "costOfGoodsSold",
        gross_profit as "grossProfit",
        operating_expenses as "operatingExpenses",
        operating_income as "operatingIncome",
        ebitda,
        net_income as "netIncome",
        earnings_per_share as "earningsPerShare",
        total_assets as "totalAssets",
        working_capital as "workingCapital",
        capital_expenditures as "capitalExpenditures",
        free_cash_flow as "freeCashFlow",
        cash_at_end as "cashAtEnd",
        currency,
        projection_type as "projectionType",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM financial_projections
      WHERE id = ${projectionId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getProjections(scenarioId: string, filters: {
    projectionType?: string;
    startYear?: number;
    endYear?: number;
    limit?: number;
  } = {}): Promise<FinancialProjection[]> {
    const { projectionType, startYear, endYear, limit = 100 } = filters;
    
    let query = `
      SELECT 
        id,
        scenario_id as "scenarioId",
        projection_year as "projectionYear",
        projection_quarter as "projectionQuarter",
        revenue,
        cost_of_goods_sold as "costOfGoodsSold",
        gross_profit as "grossProfit",
        operating_expenses as "operatingExpenses",
        operating_income as "operatingIncome",
        ebitda,
        net_income as "netIncome",
        earnings_per_share as "earningsPerShare",
        total_assets as "totalAssets",
        working_capital as "workingCapital",
        capital_expenditures as "capitalExpenditures",
        free_cash_flow as "freeCashFlow",
        cash_at_end as "cashAtEnd",
        currency,
        projection_type as "projectionType",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM financial_projections
      WHERE scenario_id = ${scenarioId}::uuid
    `;
    
    if (projectionType) {
      query += ` AND projection_type = '${projectionType}'`;
    }
    
    if (startYear) {
      query += ` AND projection_year >= ${startYear}`;
    }
    
    if (endYear) {
      query += ` AND projection_year <= ${endYear}`;
    }
    
    query += ` ORDER BY projection_year ASC, projection_quarter ASC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as FinancialProjection[];
  }

  // Decision Impact Models Management
  async createDecisionImpact(data: z.infer<typeof DecisionImpactModelSchema>): Promise<DecisionImpactModel> {
    const validated = DecisionImpactModelSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO decision_impact_models (
        id,
        scenario_id,
        decision_type,
        decision_name,
        decision_description,
        financial_impact,
        strategic_impact_score,
        risk_level,
        confidence_level,
        time_to_impact_months,
        dependencies,
        success_metrics,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.scenarioId}::uuid,
        ${validated.decisionType}::varchar,
        ${validated.decisionName}::varchar,
        ${validated.decisionDescription || null}::text,
        ${validated.financialImpact}::decimal,
        ${validated.strategicImpactScore}::integer,
        ${validated.riskLevel}::varchar,
        ${validated.confidenceLevel}::integer,
        ${validated.timeToImpactMonths}::integer,
        ${JSON.stringify(validated.dependencies)}::jsonb,
        ${JSON.stringify(validated.successMetrics)}::jsonb,
        ${validated.createdBy}::uuid
      ) RETURNING id
    `;
    
    const decisionId = (result as any)[0]?.id;
    return this.getDecisionImpact(decisionId);
  }

  async getDecisionImpact(decisionId: string): Promise<DecisionImpactModel> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        scenario_id as "scenarioId",
        decision_type as "decisionType",
        decision_name as "decisionName",
        decision_description as "decisionDescription",
        financial_impact as "financialImpact",
        strategic_impact_score as "strategicImpactScore",
        risk_level as "riskLevel",
        confidence_level as "confidenceLevel",
        time_to_impact_months as "timeToImpactMonths",
        dependencies,
        success_metrics as "successMetrics",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM decision_impact_models
      WHERE id = ${decisionId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getDecisionImpacts(scenarioId: string, filters: {
    decisionType?: string;
    riskLevel?: string;
    limit?: number;
  } = {}): Promise<DecisionImpactModel[]> {
    const { decisionType, riskLevel, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        scenario_id as "scenarioId",
        decision_type as "decisionType",
        decision_name as "decisionName",
        decision_description as "decisionDescription",
        financial_impact as "financialImpact",
        strategic_impact_score as "strategicImpactScore",
        risk_level as "riskLevel",
        confidence_level as "confidenceLevel",
        time_to_impact_months as "timeToImpactMonths",
        dependencies,
        success_metrics as "successMetrics",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM decision_impact_models
      WHERE scenario_id = ${scenarioId}::uuid
    `;
    
    if (decisionType) {
      query += ` AND decision_type = '${decisionType}'`;
    }
    
    if (riskLevel) {
      query += ` AND risk_level = '${riskLevel}'`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as DecisionImpactModel[];
  }

  // Scenario Comparison Management
  async createComparison(businessAccountId: string, comparisonName: string, scenarioIds: string[], comparisonMetrics: any, createdBy: string): Promise<ScenarioComparison> {
    const result = await prisma.$queryRaw`
      INSERT INTO scenario_comparisons (
        id,
        business_account_id,
        comparison_name,
        comparison_description,
        scenario_ids,
        comparison_metrics,
        comparison_results,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${businessAccountId}::uuid,
        ${comparisonName}::varchar,
        null::text,
        ${JSON.stringify(scenarioIds)}::jsonb,
        ${JSON.stringify(comparisonMetrics)}::jsonb,
        ${JSON.stringify({})}::jsonb,
        ${createdBy}::uuid
      ) RETURNING id
    `;
    
    const comparisonId = (result as any)[0]?.id;
    return this.getComparison(comparisonId);
  }

  async getComparison(comparisonId: string): Promise<ScenarioComparison> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        comparison_name as "comparisonName",
        comparison_description as "comparisonDescription",
        scenario_ids as "scenarioIds",
        comparison_metrics as "comparisonMetrics",
        comparison_results as "comparisonResults",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM scenario_comparisons
      WHERE id = ${comparisonId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getComparisons(businessAccountId: string, limit: number = 20): Promise<ScenarioComparison[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        comparison_name as "comparisonName",
        comparison_description as "comparisonDescription",
        scenario_ids as "scenarioIds",
        comparison_metrics as "comparisonMetrics",
        comparison_results as "comparisonResults",
        created_by as "createdBy",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM scenario_comparisons
      WHERE business_account_id = ${businessAccountId}::uuid
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    
    return result as ScenarioComparison[];
  }

  // Scenario Snapshots Management
  async createSnapshot(scenarioId: string, snapshotName: string, snapshotDescription: string, createdBy: string): Promise<ScenarioSnapshot> {
    // Get complete scenario data
    const scenario = await this.getScenario(scenarioId);
    const assumptions = await this.getAssumptions(scenarioId);
    const projections = await this.getProjections(scenarioId);
    const decisions = await this.getDecisionImpacts(scenarioId);
    
    const snapshotData = {
      scenario,
      assumptions,
      projections,
      decisions,
      timestamp: new Date().toISOString()
    };
    
    const result = await prisma.$queryRaw`
      INSERT INTO scenario_snapshots (
        id,
        scenario_id,
        snapshot_name,
        snapshot_description,
        snapshot_data,
        is_read_only,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${scenarioId}::uuid,
        ${snapshotName}::varchar,
        ${snapshotDescription}::text,
        ${JSON.stringify(snapshotData)}::jsonb,
        true::boolean,
        ${createdBy}::uuid
      ) RETURNING id
    `;
    
    const snapshotId = (result as any)[0]?.id;
    return this.getSnapshot(snapshotId);
  }

  async getSnapshot(snapshotId: string): Promise<ScenarioSnapshot> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        scenario_id as "scenarioId",
        snapshot_name as "snapshotName",
        snapshot_description as "snapshotDescription",
        snapshot_data as "snapshotData",
        is_read_only as "isReadOnly",
        created_by as "createdBy",
        created_at as "createdAt"
      FROM scenario_snapshots
      WHERE id = ${snapshotId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getSnapshots(scenarioId: string, limit: number = 20): Promise<ScenarioSnapshot[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        scenario_id as "scenarioId",
        snapshot_name as "snapshotName",
        snapshot_description as "snapshotDescription",
        snapshot_data as "snapshotData",
        is_read_only as "isReadOnly",
        created_by as "createdBy",
        created_at as "createdAt"
      FROM scenario_snapshots
      WHERE scenario_id = ${scenarioId}::uuid
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    
    return result as ScenarioSnapshot[];
  }

  // Analytics and Dashboard Methods
  async getStrategySummaryDashboard(businessAccountId: string): Promise<any> {
    const result = await prisma.$queryRaw`
      SELECT * FROM strategy_summary_dashboard
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    return result;
  }

  async getScenarioPerformanceComparison(scenarioId: string): Promise<any> {
    const result = await prisma.$queryRaw`
      SELECT * FROM scenario_performance_comparison
      WHERE scenario_id = ${scenarioId}::uuid
      ORDER BY year ASC
    `;
    
    return result;
  }

  async refreshStrategyMaterializedViews(): Promise<void> {
    await prisma.$queryRaw`SELECT refresh_strategy_materialized_views()`;
  }

  // Helper Methods for Financial Calculations
  async calculateCashRunway(scenarioId: string): Promise<number> {
    const projections = await this.getProjections(scenarioId, { projectionType: 'base' });
    
    let cashRunway = 0;
    let cashBalance = 0;
    
    for (const projection of projections) {
      if (projection.projectionQuarter === 1 || projection.projectionQuarter === undefined) {
        cashBalance += projection.freeCashFlow;
        if (cashBalance < 0) {
          break;
        }
        cashRunway++;
      }
    }
    
    return cashRunway;
  }

  async calculateSolvencyRatio(scenarioId: string): Promise<number> {
    const projections = await this.getProjections(scenarioId, { projectionType: 'base' });
    
    if (projections.length === 0) return 0;
    
    const latestProjection = projections[projections.length - 1];
    
    if (latestProjection.totalAssets === 0) return 0;
    
    return latestProjection.workingCapital / latestProjection.totalAssets;
  }

  async calculateROI(scenarioId: string): Promise<number> {
    const projections = await this.getProjections(scenarioId, { projectionType: 'base' });
    
    if (projections.length < 2) return 0;
    
    const firstProjection = projections[0];
    const latestProjection = projections[projections.length - 1];
    
    const totalInvestment = firstProjection.totalAssets;
    const totalReturn = latestProjection.totalAssets - totalInvestment;
    
    if (totalInvestment === 0) return 0;
    
    return (totalReturn / totalInvestment) * 100;
  }

  async generateExecutiveSummary(scenarioId: string, language: 'en' | 'ar' = 'en'): Promise<any> {
    const scenario = await this.getScenario(scenarioId);
    const assumptions = await this.getAssumptions(scenarioId);
    const projections = await this.getProjections(scenarioId);
    const decisions = await this.getDecisionImpacts(scenarioId);
    
    const cashRunway = await this.calculateCashRunway(scenarioId);
    const solvencyRatio = await this.calculateSolvencyRatio(scenarioId);
    const roi = await this.calculateROI(scenarioId);
    
    const latestProjection = projections[projections.length - 1];
    
    return {
      scenario: {
        name: scenario.scenarioName,
        type: scenario.scenarioType,
        timeHorizon: scenario.timeHorizonYears,
        currency: scenario.currency
      },
      keyMetrics: {
        cashRunway,
        solvencyRatio,
        roi,
        projectedRevenue: latestProjection?.revenue || 0,
        projectedEBITDA: latestProjection?.ebitda || 0,
        projectedNetIncome: latestProjection?.netIncome || 0,
        projectedCashFlow: latestProjection?.freeCashFlow || 0
      },
      assumptions: assumptions.map(a => ({
        category: a.assumptionCategory,
        name: a.assumptionName,
        value: a.assumptionValue,
        confidence: a.confidenceLevel
      })),
      keyDecisions: decisions.map(d => ({
        type: d.decisionType,
        name: d.decisionName,
        impact: d.financialImpact,
        risk: d.riskLevel,
        confidence: d.confidenceLevel
      })),
      recommendations: this.generateRecommendations(scenario, projections, decisions, language),
      generatedAt: new Date().toISOString(),
      language
    };
  }

  private generateRecommendations(scenario: StrategyScenario, projections: FinancialProjection[], decisions: DecisionImpactModel[], language: 'en' | 'ar'): string[] {
    const recommendations = [];
    
    const cashRunway = this.calculateCashRunway(scenario.id);
    const solvencyRatio = this.calculateSolvencyRatio(scenario.id);
    
    if (cashRunway < 12) {
      recommendations.push(language === 'ar' ? 
        'تحسين إدارة التدفق النقدي - مدة التشغيل النقدية أقل من 12 شهرًا' : 
        'Improve cash flow management - Cash runway is less than 12 months'
      );
    }
    
    if (solvencyRatio < 0.2) {
      recommendations.push(language === 'ar' ? 
        'زيادة رأس المال العامل - نسبة السيولة منخفضة' : 
        'Increase working capital - Solvency ratio is low'
      );
    }
    
    const highRiskDecisions = decisions.filter(d => d.riskLevel === 'high' || d.riskLevel === 'critical');
    if (highRiskDecisions.length > 0) {
      recommendations.push(language === 'ar' ? 
        'مراجعة القرارات عالية المخاطر وتطبيق استراتيجيات التخفيف' : 
        'Review high-risk decisions and implement mitigation strategies'
      );
    }
    
    const latestProjection = projections[projections.length - 1];
    if (latestProjection && latestProjection.netIncome < 0) {
      recommendations.push(language === 'ar' ? 
        'تحسين هيكل التكاليف لتحقيق الربحية' : 
        'Improve cost structure to achieve profitability'
      );
    }
    
    return recommendations;
  }
}
