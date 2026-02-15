import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const InvestorSnapshotSchema = z.object({
  periodType: z.enum(['monthly', 'quarterly', 'yearly']),
  periodStartDate: z.string().datetime(),
  periodEndDate: z.string().datetime(),
  businessAccountId: z.string().uuid(),
  createdBy: z.string().uuid()
});

const InvestorRiskDisclosureSchema = z.object({
  snapshotId: z.string().uuid(),
  businessAccountId: z.string().uuid(),
  riskRank: z.number().min(1).max(5),
  riskCategory: z.enum(['market', 'financial', 'operational', 'regulatory', 'technology', 'competitive']),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  riskTitle: z.string().min(1).max(200),
  riskDescription: z.string().min(1),
  potentialImpact: z.string().min(1),
  mitigationStrategy: z.string().min(1),
  mitigationStatus: z.enum(['not_started', 'in_progress', 'completed', 'monitored']),
  disclosureLevel: z.enum(['public', 'confidential', 'restricted']).default('public'),
  regulatoryImpact: z.boolean().default(false),
  createdBy: z.string().uuid()
});

const InvestorAccessControlSchema = z.object({
  businessAccountId: z.string().uuid(),
  userId: z.string().uuid(),
  investorRole: z.enum(['lead_investor', 'institutional_investor', 'angel_investor', 'potential_investor']),
  canViewDashboard: z.boolean().default(true),
  canDownloadPacks: z.boolean().default(true),
  canViewDetailedMetrics: z.boolean().default(true),
  canViewUnitEconomics: z.boolean().default(true),
  canViewGrowthScenarios: z.boolean().default(true),
  canViewRiskDisclosures: z.boolean().default(true),
  canShareExternally: z.boolean().default(false),
  accessEndDate: z.string().datetime().optional(),
  ipRestrictionEnabled: z.boolean().default(false),
  allowedIpRanges: z.array(z.string()).optional(),
  sessionTimeoutMinutes: z.number().default(60),
  requireMfa: z.boolean().default(true),
  deviceRestrictionEnabled: z.boolean().default(false),
  maxHistoricalPeriods: z.number().default(12),
  canViewConfidentialData: z.boolean().default(false),
  canViewForecastDetails: z.boolean().default(false),
  grantedBy: z.string().uuid()
});

export interface InvestorSnapshot {
  id: string;
  periodType: string;
  periodStartDate: Date;
  periodEndDate: Date;
  businessAccountId: string;
  currentPeriodRevenue: number;
  previousPeriodRevenue: number;
  samePeriodLastYearRevenue: number;
  revenueGrowthQoQ: number;
  revenueGrowthYoY: number;
  revenueGrowthTrend: string;
  grossProfit: number;
  grossMarginPercentage: number;
  ebitda: number;
  ebitdaMarginPercentage: number;
  netProfit: number;
  netMarginPercentage: number;
  profitabilityTrend: string;
  cashPosition: number;
  monthlyBurnRate: number;
  runwayMonths: number;
  cashFlowFromOperations: number;
  cashFlowTrend: string;
  customerAcquisitionCost: number;
  lifetimeValue: number;
  ltvCacRatio: number;
  paybackPeriodMonths: number;
  unitEconomicsHealth: string;
  capitalRaised: number;
  capitalDeployed: number;
  capitalEfficiencyRatio: number;
  returnOnInvestedCapital: number;
  forecastRevenueNextPeriod: number;
  forecastGrowthRate: number;
  forecastConfidenceLevel: string;
  forecastScenario: string;
  overallPerformanceScore: number;
  investmentGrade: string;
  createdAt: Date;
  createdBy: string;
  snapshotHash: string;
  dataSources: any;
  calculationVersion: string;
}

export interface InvestorRiskDisclosure {
  id: string;
  snapshotId: string;
  businessAccountId: string;
  riskRank: number;
  riskCategory: string;
  riskLevel: string;
  riskTitle: string;
  riskDescription: string;
  potentialImpact: string;
  mitigationStrategy: string;
  mitigationStatus: string;
  disclosureLevel: string;
  regulatoryImpact: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface InvestorAccessControl {
  id: string;
  businessAccountId: string;
  userId: string;
  investorRole: string;
  canViewDashboard: boolean;
  canDownloadPacks: boolean;
  canViewDetailedMetrics: boolean;
  canViewUnitEconomics: boolean;
  canViewGrowthScenarios: boolean;
  canViewRiskDisclosures: boolean;
  canShareExternally: boolean;
  accessStartDate: Date;
  accessEndDate?: Date;
  ipRestrictionEnabled: boolean;
  allowedIpRanges: string[];
  sessionTimeoutMinutes: number;
  requireMfa: boolean;
  deviceRestrictionEnabled: boolean;
  maxHistoricalPeriods: number;
  canViewConfidentialData: boolean;
  canViewForecastDetails: boolean;
  grantedAt: Date;
  grantedBy: string;
  revokedAt?: Date;
  revokedBy?: string;
  lastAccessedAt?: Date;
  accessCount: number;
}

export class InvestorService {
  // Investor Snapshot Management
  async generateInvestorSnapshot(data: z.infer<typeof InvestorSnapshotSchema>): Promise<InvestorSnapshot> {
    const validated = InvestorSnapshotSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT generate_investor_snapshot(
        ${validated.businessAccountId}::uuid,
        ${validated.periodType}::varchar,
        ${validated.periodStartDate}::date,
        ${validated.periodEndDate}::date,
        ${validated.createdBy}::uuid
      ) as snapshot_id
    `;
    
    const snapshotId = (result as any)[0]?.snapshot_id;
    
    // Calculate performance score
    await this.calculatePerformanceScore(snapshotId);
    
    return await this.getInvestorSnapshotById(snapshotId);
  }

  async getInvestorSnapshotById(snapshotId: string): Promise<InvestorSnapshot> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        period_type as "periodType",
        period_start_date as "periodStartDate",
        period_end_date as "periodEndDate",
        business_account_id as "businessAccountId",
        current_period_revenue as "currentPeriodRevenue",
        previous_period_revenue as "previousPeriodRevenue",
        same_period_last_year_revenue as "samePeriodLastYearRevenue",
        revenue_growth_qoq as "revenueGrowthQoQ",
        revenue_growth_yoy as "revenueGrowthYoY",
        revenue_growth_trend as "revenueGrowthTrend",
        gross_profit as "grossProfit",
        gross_margin_percentage as "grossMarginPercentage",
        ebitda as "ebitda",
        ebitda_margin_percentage as "ebitdaMarginPercentage",
        net_profit as "netProfit",
        net_margin_percentage as "netMarginPercentage",
        profitability_trend as "profitabilityTrend",
        cash_position as "cashPosition",
        monthly_burn_rate as "monthlyBurnRate",
        runway_months as "runwayMonths",
        cash_flow_from_operations as "cashFlowFromOperations",
        cash_flow_trend as "cashFlowTrend",
        customer_acquisition_cost as "customerAcquisitionCost",
        lifetime_value as "lifetimeValue",
        ltv_cac_ratio as "ltvCacRatio",
        payback_period_months as "paybackPeriodMonths",
        unit_economics_health as "unitEconomicsHealth",
        capital_raised as "capitalRaised",
        capital_deployed as "capitalDeployed",
        capital_efficiency_ratio as "capitalEfficiencyRatio",
        return_on_invested_capital as "returnOnInvestedCapital",
        forecast_revenue_next_period as "forecastRevenueNextPeriod",
        forecast_growth_rate as "forecastGrowthRate",
        forecast_confidence_level as "forecastConfidenceLevel",
        forecast_scenario as "forecastScenario",
        overall_performance_score as "overallPerformanceScore",
        investment_grade as "investmentGrade",
        created_at as "createdAt",
        created_by as "createdBy",
        snapshot_hash as "snapshotHash",
        data_sources as "dataSources",
        calculation_version as "calculationVersion"
      FROM investor_snapshots
      WHERE id = ${snapshotId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getInvestorSnapshots(businessAccountId: string, filters: {
    periodType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<InvestorSnapshot[]> {
    const { periodType, startDate, endDate, limit = 10 } = filters;
    
    let query = `
      SELECT 
        id,
        period_type as "periodType",
        period_start_date as "periodStartDate",
        period_end_date as "periodEndDate",
        business_account_id as "businessAccountId",
        current_period_revenue as "currentPeriodRevenue",
        previous_period_revenue as "previousPeriodRevenue",
        same_period_last_year_revenue as "samePeriodLastYearRevenue",
        revenue_growth_qoq as "revenueGrowthQoQ",
        revenue_growth_yoy as "revenueGrowthYoY",
        revenue_growth_trend as "revenueGrowthTrend",
        gross_profit as "grossProfit",
        gross_margin_percentage as "grossMarginPercentage",
        ebitda as "ebitda",
        ebitda_margin_percentage as "ebitdaMarginPercentage",
        net_profit as "netProfit",
        net_margin_percentage as "netMarginPercentage",
        profitability_trend as "profitabilityTrend",
        cash_position as "cashPosition",
        monthly_burn_rate as "monthlyBurnRate",
        runway_months as "runwayMonths",
        cash_flow_from_operations as "cashFlowFromOperations",
        cash_flow_trend as "cashFlowTrend",
        customer_acquisition_cost as "customerAcquisitionCost",
        lifetime_value as "lifetimeValue",
        ltv_cac_ratio as "ltvCacRatio",
        payback_period_months as "paybackPeriodMonths",
        unit_economics_health as "unitEconomicsHealth",
        capital_raised as "capitalRaised",
        capital_deployed as "capitalDeployed",
        capital_efficiency_ratio as "capitalEfficiencyRatio",
        return_on_invested_capital as "returnOnInvestedCapital",
        forecast_revenue_next_period as "forecastRevenueNextPeriod",
        forecast_growth_rate as "forecastGrowthRate",
        forecast_confidence_level as "forecastConfidenceLevel",
        forecast_scenario as "forecastScenario",
        overall_performance_score as "overallPerformanceScore",
        investment_grade as "investmentGrade",
        created_at as "createdAt",
        created_by as "createdBy",
        snapshot_hash as "snapshotHash",
        data_sources as "dataSources",
        calculation_version as "calculationVersion"
      FROM investor_snapshots
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (periodType) {
      query += ` AND period_type = '${periodType}'`;
    }
    
    if (startDate) {
      query += ` AND period_start_date >= '${startDate}'`;
    }
    
    if (endDate) {
      query += ` AND period_end_date <= '${endDate}'`;
    }
    
    query += ` ORDER BY period_end_date DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as InvestorSnapshot[];
  }

  // Investor Risk Disclosure Management
  async createRiskDisclosure(data: z.infer<typeof InvestorRiskDisclosureSchema>): Promise<InvestorRiskDisclosure> {
    const validated = InvestorRiskDisclosureSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO investor_risk_disclosures (
        id,
        snapshot_id,
        business_account_id,
        risk_rank,
        risk_category,
        risk_level,
        risk_title,
        risk_description,
        potential_impact,
        mitigation_strategy,
        mitigation_status,
        disclosure_level,
        regulatory_impact,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.snapshotId}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.riskRank}::integer,
        ${validated.riskCategory}::varchar,
        ${validated.riskLevel}::varchar,
        ${validated.riskTitle}::varchar,
        ${validated.riskDescription}::text,
        ${validated.potentialImpact}::varchar,
        ${validated.mitigationStrategy}::text,
        ${validated.mitigationStatus}::varchar,
        ${validated.disclosureLevel}::varchar,
        ${validated.regulatoryImpact}::boolean,
        ${validated.createdBy}::uuid
      ) RETURNING *
    `;
    
    return (result as any)[0];
  }

  async getRiskDisclosures(snapshotId: string): Promise<InvestorRiskDisclosure[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        snapshot_id as "snapshotId",
        business_account_id as "businessAccountId",
        risk_rank as "riskRank",
        risk_category as "riskCategory",
        risk_level as "riskLevel",
        risk_title as "riskTitle",
        risk_description as "riskDescription",
        potential_impact as "potentialImpact",
        mitigation_strategy as "mitigationStrategy",
        mitigation_status as "mitigationStatus",
        disclosure_level as "disclosureLevel",
        regulatory_impact as "regulatoryImpact",
        created_at as "createdAt",
        created_by as "createdBy"
      FROM investor_risk_disclosures
      WHERE snapshot_id = ${snapshotId}::uuid
      ORDER BY risk_rank ASC
    `;
    
    return result as InvestorRiskDisclosure[];
  }

  // Investor Access Control Management
  async grantInvestorAccess(data: z.infer<typeof InvestorAccessControlSchema>): Promise<InvestorAccessControl> {
    const validated = InvestorAccessControlSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO investor_access_control (
        id,
        business_account_id,
        user_id,
        investor_role,
        can_view_dashboard,
        can_download_packs,
        can_view_detailed_metrics,
        can_view_unit_economics,
        can_view_growth_scenarios,
        can_view_risk_disclosures,
        can_share_externally,
        access_start_date,
        access_end_date,
        ip_restriction_enabled,
        allowed_ip_ranges,
        session_timeout_minutes,
        require_mfa,
        device_restriction_enabled,
        max_historical_periods,
        can_view_confidential_data,
        can_view_forecast_details,
        granted_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.userId}::uuid,
        ${validated.investorRole}::varchar,
        ${validated.canViewDashboard}::boolean,
        ${validated.canDownloadPacks}::boolean,
        ${validated.canViewDetailedMetrics}::boolean,
        ${validated.canViewUnitEconomics}::boolean,
        ${validated.canViewGrowthScenarios}::boolean,
        ${validated.canViewRiskDisclosures}::boolean,
        ${validated.canShareExternally}::boolean,
        CURRENT_DATE::date,
        ${validated.accessEndDate || null}::date,
        ${validated.ipRestrictionEnabled}::boolean,
        ${JSON.stringify(validated.allowedIpRanges || [])}::jsonb,
        ${validated.sessionTimeoutMinutes}::integer,
        ${validated.requireMfa}::boolean,
        ${validated.deviceRestrictionEnabled}::boolean,
        ${validated.maxHistoricalPeriods}::integer,
        ${validated.canViewConfidentialData}::boolean,
        ${validated.canViewForecastDetails}::boolean,
        ${validated.grantedBy}::uuid
      ) RETURNING *
    `;
    
    return (result as any)[0];
  }

  async getInvestorAccess(userId: string, businessAccountId: string): Promise<InvestorAccessControl | null> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        user_id as "userId",
        investor_role as "investorRole",
        can_view_dashboard as "canViewDashboard",
        can_download_packs as "canDownloadPacks",
        can_view_detailed_metrics as "canViewDetailedMetrics",
        can_view_unit_economics as "canViewUnitEconomics",
        can_view_growth_scenarios as "canViewGrowthScenarios",
        can_view_risk_disclosures as "canViewRiskDisclosures",
        can_share_externally as "canShareExternally",
        access_start_date as "accessStartDate",
        access_end_date as "accessEndDate",
        ip_restriction_enabled as "ipRestrictionEnabled",
        allowed_ip_ranges as "allowedIpRanges",
        session_timeout_minutes as "sessionTimeoutMinutes",
        require_mfa as "requireMfa",
        device_restriction_enabled as "deviceRestrictionEnabled",
        max_historical_periods as "maxHistoricalPeriods",
        can_view_confidential_data as "canViewConfidentialData",
        can_view_forecast_details as "canViewForecastDetails",
        granted_at as "grantedAt",
        granted_by as "grantedBy",
        revoked_at as "revokedAt",
        revoked_by as "revokedBy",
        last_accessed_at as "lastAccessedAt",
        access_count as "accessCount"
      FROM investor_access_control
      WHERE user_id = ${userId}::uuid
        AND business_account_id = ${businessAccountId}::uuid
        AND (revoked_at IS NULL)
        AND (access_end_date IS NULL OR access_end_date >= CURRENT_DATE)
    `;
    
    return (result as any)[0] || null;
  }

  // Share Link Management
  async generateShareLink(
    businessAccountId: string,
    snapshotId: string,
    packDocumentId: string,
    accessLevel: string,
    expiresHours: number,
    createdBy: string
  ): Promise<string> {
    const result = await prisma.$queryRaw`
      SELECT generate_investor_share_token(
        ${businessAccountId}::uuid,
        ${snapshotId}::uuid,
        ${packDocumentId}::uuid,
        ${accessLevel}::varchar,
        ${expiresHours}::integer,
        ${createdBy}::uuid
      ) as share_token
    `;
    
    return (result as any)[0]?.share_token;
  }

  // Performance Score Calculation
  async calculatePerformanceScore(snapshotId: string): Promise<void> {
    await prisma.$queryRaw`
      SELECT calculate_investor_performance_score(${snapshotId}::uuid)
    `;
  }

  // Update last accessed timestamp
  async updateLastAccessed(userId: string, businessAccountId: string): Promise<void> {
    await prisma.$queryRaw`
      UPDATE investor_access_control 
      SET 
        last_accessed_at = CURRENT_TIMESTAMP,
        access_count = access_count + 1
      WHERE user_id = ${userId}::uuid
        AND business_account_id = ${businessAccountId}::uuid
        AND (revoked_at IS NULL)
    `;
  }
}
