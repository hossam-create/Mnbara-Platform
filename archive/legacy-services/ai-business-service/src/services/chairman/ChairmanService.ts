import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const ChairmanStrategicSnapshotSchema = z.object({
  periodType: z.enum(['monthly', 'quarterly', 'yearly']),
  periodStartDate: z.string().datetime(),
  periodEndDate: z.string().datetime(),
  businessAccountId: z.string().uuid(),
  createdBy: z.string().uuid()
});

const ChairmanStrategicRiskSchema = z.object({
  snapshotId: z.string().uuid(),
  businessAccountId: z.string().uuid(),
  riskRank: z.number().min(1).max(3),
  riskCategory: z.enum(['strategic', 'financial', 'operational', 'market', 'technology', 'regulatory']),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  riskTitle: z.string().min(1).max(200),
  riskImpactDescription: z.string().min(1),
  riskTrend: z.enum(['improving', 'stable', 'escalating', 'rapidly_escalating']),
  mitigationStatus: z.enum(['on_track', 'attention_needed', 'concerning', 'critical']),
  boardOversightRequired: z.boolean().default(false),
  riskHorizon: z.enum(['immediate', 'short_term', 'medium_term', 'long_term']),
  expectedImpactTimeline: z.string().max(50).optional(),
  createdBy: z.string().uuid()
});

const ChairmanStrategicOpportunitySchema = z.object({
  snapshotId: z.string().uuid(),
  businessAccountId: z.string().uuid(),
  opportunityRank: z.number().min(1).max(3),
  opportunityCategory: z.enum(['market_expansion', 'product_innovation', 'operational_excellence', 'strategic_partnership', 'technology_advantage', 'financial_optimization']),
  opportunityLevel: z.enum(['moderate', 'significant', 'transformational']),
  opportunityTitle: z.string().min(1).max(200),
  strategicValueDescription: z.string().min(1),
  readinessLevel: z.enum(['concept', 'planning', 'execution', 'scaling']),
  confidenceLevel: z.enum(['low', 'moderate', 'high', 'very_high']),
  resourceRequirementLevel: z.enum(['minimal', 'moderate', 'significant', 'substantial']),
  opportunityHorizon: z.enum(['immediate', 'short_term', 'medium_term', 'long_term']),
  expectedRealizationTimeline: z.string().max(50).optional(),
  createdBy: z.string().uuid()
});

const ChairmanBriefingDocumentSchema = z.object({
  snapshotId: z.string().uuid(),
  businessAccountId: z.string().uuid(),
  briefingType: z.enum(['strategic_snapshot', 'risk_focus', 'opportunity_focus', 'decision_support']),
  title: z.string().min(1).max(200),
  executiveSummary: z.string().min(1),
  keyInsights: z.array(z.string()),
  strategicRecommendations: z.array(z.string()),
  confidenceSignals: z.record(z.any()),
  riskSignals: z.record(z.any()),
  opportunitySignals: z.record(z.any()),
  language: z.enum(['en', 'ar']).default('en'),
  generatedBy: z.string().uuid()
});

const ChairmanAccessControlSchema = z.object({
  businessAccountId: z.string().uuid(),
  userId: z.string().uuid(),
  chairmanRole: z.enum(['chairman', 'acting_chairman']),
  canViewStrategicDashboard: z.boolean().default(true),
  canViewRiskHeatmap: z.boolean().default(true),
  canViewOpportunities: z.boolean().default(true),
  canDownloadBriefings: z.boolean().default(true),
  canViewChangeSummary: z.boolean().default(true),
  canViewConfidenceIndicators: z.boolean().default(true),
  accessEndDate: z.string().datetime().optional(),
  ipRestrictionEnabled: z.boolean().default(false),
  allowedIpRanges: z.array(z.string()).optional(),
  sessionTimeoutMinutes: z.number().default(30),
  requireMfa: z.boolean().default(true),
  deviceRestrictionEnabled: z.boolean().default(false),
  grantedBy: z.string().uuid()
});

export interface ChairmanStrategicSnapshot {
  id: string;
  periodType: string;
  periodStartDate: Date;
  periodEndDate: Date;
  businessAccountId: string;
  overallFinancialHealthScore: number;
  financialHealthTrend: string;
  revenueDirection: string;
  revenueConfidenceScore: number;
  revenueGrowthSignal: string;
  profitabilityDirection: string;
  profitabilityConfidenceScore: number;
  profitabilityTrendSignal: string;
  cashRunwayStatus: string;
  cashPositionSignal: string;
  runwayMonths: number;
  cashBurnTrend: string;
  forecastReliabilityScore: number;
  forecastAccuracyTrend: string;
  forecastConfidenceLevel: string;
  managementExecutionConfidence: number;
  executionTrend: string;
  strategicAlignmentScore: number;
  marketPositionStrength: string;
  competitiveTrend: string;
  innovationPipelineHealth: string;
  customerSatisfactionTrend: string;
  employeeEngagementSignal: string;
  createdAt: Date;
  createdBy: string;
  snapshotHash: string;
  dataSources: any;
  calculationVersion: string;
}

export interface ChairmanStrategicRisk {
  id: string;
  snapshotId: string;
  businessAccountId: string;
  riskRank: number;
  riskCategory: string;
  riskLevel: string;
  riskTitle: string;
  riskImpactDescription: string;
  riskTrend: string;
  mitigationStatus: string;
  boardOversightRequired: boolean;
  riskHorizon: string;
  expectedImpactTimeline?: string;
  createdAt: Date;
  createdBy: string;
}

export interface ChairmanStrategicOpportunity {
  id: string;
  snapshotId: string;
  businessAccountId: string;
  opportunityRank: number;
  opportunityCategory: string;
  opportunityLevel: string;
  opportunityTitle: string;
  strategicValueDescription: string;
  readinessLevel: string;
  confidenceLevel: string;
  resourceRequirementLevel: string;
  opportunityHorizon: string;
  expectedRealizationTimeline?: string;
  createdAt: Date;
  createdBy: string;
}

export interface ChairmanBriefingDocument {
  id: string;
  snapshotId: string;
  businessAccountId: string;
  briefingType: string;
  title: string;
  executiveSummary: string;
  keyInsights: any[];
  strategicRecommendations: any[];
  confidenceSignals: any;
  riskSignals: any;
  opportunitySignals: any;
  filePath?: string;
  fileSizeBytes?: number;
  downloadCount: number;
  generatedAt: Date;
  generatedBy: string;
  generationDurationMs?: number;
  templateVersion: string;
  language: string;
  status: string;
}

export interface ChairmanAccessControl {
  id: string;
  businessAccountId: string;
  userId: string;
  chairmanRole: string;
  canViewStrategicDashboard: boolean;
  canViewRiskHeatmap: boolean;
  canViewOpportunities: boolean;
  canDownloadBriefings: boolean;
  canViewChangeSummary: boolean;
  canViewConfidenceIndicators: boolean;
  canViewFinancialDetails: boolean;
  canViewOperationalData: boolean;
  canViewTransactionalData: boolean;
  canViewEmployeeData: boolean;
  canViewCustomerData: boolean;
  canDrillDown: boolean;
  canExportRawData: boolean;
  accessStartDate: Date;
  accessEndDate?: Date;
  ipRestrictionEnabled: boolean;
  allowedIpRanges: string[];
  sessionTimeoutMinutes: number;
  requireMfa: boolean;
  deviceRestrictionEnabled: boolean;
  grantedAt: Date;
  grantedBy: string;
  revokedAt?: Date;
  revokedBy?: string;
  lastAccessedAt?: Date;
  accessCount: number;
}

export class ChairmanService {
  // Chairman Strategic Snapshot Management
  async generateStrategicSnapshot(data: z.infer<typeof ChairmanStrategicSnapshotSchema>): Promise<ChairmanStrategicSnapshot> {
    const validated = ChairmanStrategicSnapshotSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT generate_chairman_strategic_snapshot(
        ${validated.businessAccountId}::uuid,
        ${validated.periodType}::varchar,
        ${validated.periodStartDate}::date,
        ${validated.periodEndDate}::date,
        ${validated.createdBy}::uuid
      ) as snapshot_id
    `;
    
    const snapshotId = (result as any)[0]?.snapshot_id;
    
    return await this.getStrategicSnapshotById(snapshotId);
  }

  async getStrategicSnapshotById(snapshotId: string): Promise<ChairmanStrategicSnapshot> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        period_type as "periodType",
        period_start_date as "periodStartDate",
        period_end_date as "periodEndDate",
        business_account_id as "businessAccountId",
        overall_financial_health_score as "overallFinancialHealthScore",
        financial_health_trend as "financialHealthTrend",
        revenue_direction as "revenueDirection",
        revenue_confidence_score as "revenueConfidenceScore",
        revenue_growth_signal as "revenueGrowthSignal",
        profitability_direction as "profitabilityDirection",
        profitability_confidence_score as "profitabilityConfidenceScore",
        profitability_trend_signal as "profitabilityTrendSignal",
        cash_runway_status as "cashRunwayStatus",
        cash_position_signal as "cashPositionSignal",
        runway_months as "runwayMonths",
        cash_burn_trend as "cashBurnTrend",
        forecast_reliability_score as "forecastReliabilityScore",
        forecast_accuracy_trend as "forecastAccuracyTrend",
        forecast_confidence_level as "forecastConfidenceLevel",
        management_execution_confidence as "managementExecutionConfidence",
        execution_trend as "executionTrend",
        strategic_alignment_score as "strategicAlignmentScore",
        market_position_strength as "marketPositionStrength",
        competitive_trend as "competitiveTrend",
        innovation_pipeline_health as "innovationPipelineHealth",
        customer_satisfaction_trend as "customerSatisfactionTrend",
        employee_engagement_signal as "employeeEngagementSignal",
        created_at as "createdAt",
        created_by as "createdBy",
        snapshot_hash as "snapshotHash",
        data_sources as "dataSources",
        calculation_version as "calculationVersion"
      FROM chairman_strategic_snapshots
      WHERE id = ${snapshotId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getStrategicSnapshots(businessAccountId: string, filters: {
    periodType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<ChairmanStrategicSnapshot[]> {
    const { periodType, startDate, endDate, limit = 10 } = filters;
    
    let query = `
      SELECT 
        id,
        period_type as "periodType",
        period_start_date as "periodStartDate",
        period_end_date as "periodEndDate",
        business_account_id as "businessAccountId",
        overall_financial_health_score as "overallFinancialHealthScore",
        financial_health_trend as "financialHealthTrend",
        revenue_direction as "revenueDirection",
        revenue_confidence_score as "revenueConfidenceScore",
        revenue_growth_signal as "revenueGrowthSignal",
        profitability_direction as "profitabilityDirection",
        profitability_confidence_score as "profitabilityConfidenceScore",
        profitability_trend_signal as "profitabilityTrendSignal",
        cash_runway_status as "cashRunwayStatus",
        cash_position_signal as "cashPositionSignal",
        runway_months as "runwayMonths",
        cash_burn_trend as "cashBurnTrend",
        forecast_reliability_score as "forecastReliabilityScore",
        forecast_accuracy_trend as "forecastAccuracyTrend",
        forecast_confidence_level as "forecastConfidenceLevel",
        management_execution_confidence as "managementExecutionConfidence",
        execution_trend as "executionTrend",
        strategic_alignment_score as "strategicAlignmentScore",
        market_position_strength as "marketPositionStrength",
        competitive_trend as "competitiveTrend",
        innovation_pipeline_health as "innovationPipelineHealth",
        customer_satisfaction_trend as "customerSatisfactionTrend",
        employee_engagement_signal as "employeeEngagementSignal",
        created_at as "createdAt",
        created_by as "createdBy",
        snapshot_hash as "snapshotHash",
        data_sources as "dataSources",
        calculation_version as "calculationVersion"
      FROM chairman_strategic_snapshots
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
    return result as ChairmanStrategicSnapshot[];
  }

  // Chairman Strategic Risk Management
  async createStrategicRisk(data: z.infer<typeof ChairmanStrategicRiskSchema>): Promise<ChairmanStrategicRisk> {
    const validated = ChairmanStrategicRiskSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO chairman_strategic_risks (
        id,
        snapshot_id,
        business_account_id,
        risk_rank,
        risk_category,
        risk_level,
        risk_title,
        risk_impact_description,
        risk_trend,
        mitigation_status,
        board_oversight_required,
        risk_horizon,
        expected_impact_timeline,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.snapshotId}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.riskRank}::integer,
        ${validated.riskCategory}::varchar,
        ${validated.riskLevel}::varchar,
        ${validated.riskTitle}::varchar,
        ${validated.riskImpactDescription}::text,
        ${validated.riskTrend}::varchar,
        ${validated.mitigationStatus}::varchar,
        ${validated.boardOversightRequired}::boolean,
        ${validated.riskHorizon}::varchar,
        ${validated.expectedImpactTimeline || null}::varchar,
        ${validated.createdBy}::uuid
      ) RETURNING *
    `;
    
    return (result as any)[0];
  }

  async getStrategicRisks(snapshotId: string): Promise<ChairmanStrategicRisk[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        snapshot_id as "snapshotId",
        business_account_id as "businessAccountId",
        risk_rank as "riskRank",
        risk_category as "riskCategory",
        risk_level as "riskLevel",
        risk_title as "riskTitle",
        risk_impact_description as "riskImpactDescription",
        risk_trend as "riskTrend",
        mitigation_status as "mitigationStatus",
        board_oversight_required as "boardOversightRequired",
        risk_horizon as "riskHorizon",
        expected_impact_timeline as "expectedImpactTimeline",
        created_at as "createdAt",
        created_by as "createdBy"
      FROM chairman_strategic_risks
      WHERE snapshot_id = ${snapshotId}::uuid
      ORDER BY risk_rank ASC
    `;
    
    return result as ChairmanStrategicRisk[];
  }

  // Chairman Strategic Opportunity Management
  async createStrategicOpportunity(data: z.infer<typeof ChairmanStrategicOpportunitySchema>): Promise<ChairmanStrategicOpportunity> {
    const validated = ChairmanStrategicOpportunitySchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO chairman_strategic_opportunities (
        id,
        snapshot_id,
        business_account_id,
        opportunity_rank,
        opportunity_category,
        opportunity_level,
        opportunity_title,
        strategic_value_description,
        readiness_level,
        confidence_level,
        resource_requirement_level,
        opportunity_horizon,
        expected_realization_timeline,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.snapshotId}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.opportunityRank}::integer,
        ${validated.opportunityCategory}::varchar,
        ${validated.opportunityLevel}::varchar,
        ${validated.opportunityTitle}::varchar,
        ${validated.strategicValueDescription}::text,
        ${validated.readinessLevel}::varchar,
        ${validated.confidenceLevel}::varchar,
        ${validated.resourceRequirementLevel}::varchar,
        ${validated.opportunityHorizon}::varchar,
        ${validated.expectedRealizationTimeline || null}::varchar,
        ${validated.createdBy}::uuid
      ) RETURNING *
    `;
    
    return (result as any)[0];
  }

  async getStrategicOpportunities(snapshotId: string): Promise<ChairmanStrategicOpportunity[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        snapshot_id as "snapshotId",
        business_account_id as "businessAccountId",
        opportunity_rank as "opportunityRank",
        opportunity_category as "opportunityCategory",
        opportunity_level as "opportunityLevel",
        opportunity_title as "opportunityTitle",
        strategic_value_description as "strategicValueDescription",
        readiness_level as "readinessLevel",
        confidence_level as "confidenceLevel",
        resource_requirement_level as "resourceRequirementLevel",
        opportunity_horizon as "opportunityHorizon",
        expected_realization_timeline as "expectedRealizationTimeline",
        created_at as "createdAt",
        created_by as "createdBy"
      FROM chairman_strategic_opportunities
      WHERE snapshot_id = ${snapshotId}::uuid
      ORDER BY opportunity_rank ASC
    `;
    
    return result as ChairmanStrategicOpportunity[];
  }

  // Chairman Briefing Document Management
  async createBriefingDocument(data: z.infer<typeof ChairmanBriefingDocumentSchema>): Promise<ChairmanBriefingDocument> {
    const validated = ChairmanBriefingDocumentSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO chairman_briefing_documents (
        id,
        snapshot_id,
        business_account_id,
        briefing_type,
        title,
        executive_summary,
        key_insights,
        strategic_recommendations,
        confidence_signals,
        risk_signals,
        opportunity_signals,
        language,
        generated_by,
        template_version,
        status
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.snapshotId}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.briefingType}::varchar,
        ${validated.title}::varchar,
        ${validated.executiveSummary}::text,
        ${JSON.stringify(validated.keyInsights)}::jsonb,
        ${JSON.stringify(validated.strategicRecommendations)}::jsonb,
        ${JSON.stringify(validated.confidenceSignals)}::jsonb,
        ${JSON.stringify(validated.riskSignals)}::jsonb,
        ${JSON.stringify(validated.opportunitySignals)}::jsonb,
        ${validated.language}::varchar,
        ${validated.generatedBy}::uuid,
        '1.0'::varchar,
        'completed'::varchar
      ) RETURNING *
    `;
    
    return (result as any)[0];
  }

  async getBriefingDocuments(businessAccountId: string, filters: {
    briefingType?: string;
    language?: string;
    limit?: number;
  } = {}): Promise<ChairmanBriefingDocument[]> {
    const { briefingType, language, limit = 20 } = filters;
    
    let query = `
      SELECT 
        id,
        snapshot_id as "snapshotId",
        business_account_id as "businessAccountId",
        briefing_type as "briefingType",
        title,
        executive_summary as "executiveSummary",
        key_insights as "keyInsights",
        strategic_recommendations as "strategicRecommendations",
        confidence_signals as "confidenceSignals",
        risk_signals as "riskSignals",
        opportunity_signals as "opportunitySignals",
        file_path as "filePath",
        file_size_bytes as "fileSizeBytes",
        download_count as "downloadCount",
        generated_at as "generatedAt",
        generated_by as "generatedBy",
        generation_duration_ms as "generationDurationMs",
        template_version as "templateVersion",
        language,
        status
      FROM chairman_briefing_documents
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (briefingType) {
      query += ` AND briefing_type = '${briefingType}'`;
    }
    
    if (language) {
      query += ` AND language = '${language}'`;
    }
    
    query += ` ORDER BY generated_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as ChairmanBriefingDocument[];
  }

  // Chairman Access Control Management
  async grantChairmanAccess(data: z.infer<typeof ChairmanAccessControlSchema>): Promise<ChairmanAccessControl> {
    const validated = ChairmanAccessControlSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO chairman_access_control (
        id,
        business_account_id,
        user_id,
        chairman_role,
        can_view_strategic_dashboard,
        can_view_risk_heatmap,
        can_view_opportunities,
        can_download_briefings,
        can_view_change_summary,
        can_view_confidence_indicators,
        can_view_financial_details,
        can_view_operational_data,
        can_view_transactional_data,
        can_view_employee_data,
        can_view_customer_data,
        can_drill_down,
        can_export_raw_data,
        access_start_date,
        access_end_date,
        ip_restriction_enabled,
        allowed_ip_ranges,
        session_timeout_minutes,
        require_mfa,
        device_restriction_enabled,
        granted_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.userId}::uuid,
        ${validated.chairmanRole}::varchar,
        ${validated.canViewStrategicDashboard}::boolean,
        ${validated.canViewRiskHeatmap}::boolean,
        ${validated.canViewOpportunities}::boolean,
        ${validated.canDownloadBriefings}::boolean,
        ${validated.canViewChangeSummary}::boolean,
        ${validated.canViewConfidenceIndicators}::boolean,
        false::boolean,
        false::boolean,
        false::boolean,
        false::boolean,
        false::boolean,
        false::boolean,
        false::boolean,
        CURRENT_DATE::date,
        ${validated.accessEndDate || null}::date,
        ${validated.ipRestrictionEnabled}::boolean,
        ${JSON.stringify(validated.allowedIpRanges || [])}::jsonb,
        ${validated.sessionTimeoutMinutes}::integer,
        ${validated.requireMfa}::boolean,
        ${validated.deviceRestrictionEnabled}::boolean,
        ${validated.grantedBy}::uuid
      ) RETURNING *
    `;
    
    return (result as any)[0];
  }

  async getChairmanAccess(userId: string, businessAccountId: string): Promise<ChairmanAccessControl | null> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        user_id as "userId",
        chairman_role as "chairmanRole",
        can_view_strategic_dashboard as "canViewStrategicDashboard",
        can_view_risk_heatmap as "canViewRiskHeatmap",
        can_view_opportunities as "canViewOpportunities",
        can_download_briefings as "canDownloadBriefings",
        can_view_change_summary as "canViewChangeSummary",
        can_view_confidence_indicators as "canViewConfidenceIndicators",
        can_view_financial_details as "canViewFinancialDetails",
        can_view_operational_data as "canViewOperationalData",
        can_view_transactional_data as "canViewTransactionalData",
        can_view_employee_data as "canViewEmployeeData",
        can_view_customer_data as "canViewCustomerData",
        can_drill_down as "canDrillDown",
        can_export_raw_data as "canExportRawData",
        access_start_date as "accessStartDate",
        access_end_date as "accessEndDate",
        ip_restriction_enabled as "ipRestrictionEnabled",
        allowed_ip_ranges as "allowedIpRanges",
        session_timeout_minutes as "sessionTimeoutMinutes",
        require_mfa as "requireMfa",
        device_restriction_enabled as "deviceRestrictionEnabled",
        granted_at as "grantedAt",
        granted_by as "grantedBy",
        revoked_at as "revokedAt",
        revoked_by as "revokedBy",
        last_accessed_at as "lastAccessedAt",
        access_count as "accessCount"
      FROM chairman_access_control
      WHERE user_id = ${userId}::uuid
        AND business_account_id = ${businessAccountId}::uuid
        AND (revoked_at IS NULL)
        AND (access_end_date IS NULL OR access_end_date >= CURRENT_DATE)
    `;
    
    return (result as any)[0] || null;
  }

  // Chairman Analytics and Trends
  async getStrategicTrends(businessAccountId: string, periodType: string = 'quarterly'): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        business_account_id as "businessAccountId",
        period_type as "periodType",
        quarter,
        avg_financial_health as "avgFinancialHealth",
        avg_forecast_reliability as "avgForecastReliability",
        avg_execution_confidence as "avgExecutionConfidence",
        snapshot_count as "snapshotCount",
        dominant_financial_trend as "dominantFinancialTrend",
        dominant_revenue_direction as "dominantRevenueDirection",
        dominant_cash_status as "dominantCashStatus"
      FROM chairman_strategic_trends
      WHERE business_account_id = ${businessAccountId}::uuid
        AND period_type = ${periodType}::varchar
      ORDER BY quarter DESC
      LIMIT 8
    `;
    
    return result as any[];
  }

  async getRiskHeatmap(businessAccountId: string): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        business_account_id as "businessAccountId",
        risk_category as "riskCategory",
        risk_level as "riskLevel",
        risk_count as "riskCount",
        top_risk_percentage as "topRiskPercentage",
        latest_identification as "latestIdentification",
        dominant_risk_trend as "dominantRiskTrend",
        dominant_mitigation_status as "dominantMitigationStatus"
      FROM chairman_risk_heatmap
      WHERE business_account_id = ${businessAccountId}::uuid
      ORDER BY risk_level DESC, risk_count DESC
    `;
    
    return result as any[];
  }

  async getOpportunityPipeline(businessAccountId: string): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        business_account_id as "businessAccountId",
        opportunity_category as "opportunityCategory",
        opportunity_level as "opportunityLevel",
        opportunity_count as "opportunityCount",
        top_opportunity_percentage as "topOpportunityPercentage",
        latest_identification as "latestIdentification",
        dominant_readiness as "dominantReadiness",
        dominant_confidence as "dominantConfidence",
        avg_resource_intensity as "avgResourceIntensity"
      FROM chairman_opportunity_pipeline
      WHERE business_account_id = ${businessAccountId}::uuid
      ORDER BY opportunity_level DESC, opportunity_count DESC
    `;
    
    return result as any[];
  }

  // Materialized View Refresh
  async refreshChairmanAnalytics(): Promise<void> {
    await prisma.$queryRaw`SELECT refresh_chairman_materialized_views()`;
  }

  // Chairman Audit Log
  async getChairmanAuditLog(businessAccountId: string, filters: {
    actionType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    const { actionType, startDate, endDate, limit = 100 } = filters;
    
    let query = `
      SELECT 
        id,
        business_account_id as "businessAccountId",
        action_type as "actionType",
        action_description as "actionDescription",
        entity_type as "entityType",
        entity_id as "entityId",
        performed_by as "performedBy",
        user_role as "userRole",
        session_id as "sessionId",
        ip_address as "ipAddress",
        user_agent as "userAgent",
        device_fingerprint as "deviceFingerprint",
        mfa_verified as "mfaVerified",
        action_duration_ms as "actionDurationMs",
        data_volume_bytes as "dataVolumeBytes",
        performed_at as "performedAt",
        additional_data as "additionalData"
      FROM chairman_audit_log
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (actionType) {
      query += ` AND action_type = '${actionType}'`;
    }
    
    if (startDate) {
      query += ` AND performed_at >= '${startDate}'`;
    }
    
    if (endDate) {
      query += ` AND performed_at <= '${endDate}'`;
    }
    
    query += ` ORDER BY performed_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as any[];
  }

  // Update last accessed timestamp
  async updateLastAccessed(userId: string, businessAccountId: string): Promise<void> {
    await prisma.$queryRaw`
      UPDATE chairman_access_control 
      SET 
        last_accessed_at = CURRENT_TIMESTAMP,
        access_count = access_count + 1
      WHERE user_id = ${userId}::uuid
        AND business_account_id = ${businessAccountId}::uuid
        AND (revoked_at IS NULL)
    `;
  }
}
