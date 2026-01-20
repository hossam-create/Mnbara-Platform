import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Zod schemas for validation
const BoardKPISnapshotSchema = z.object({
  periodType: z.enum(['monthly', 'quarterly', 'yearly']),
  periodStartDate: z.string().datetime(),
  periodEndDate: z.string().datetime(),
  businessAccountId: z.string().uuid(),
  createdBy: z.string().uuid()
});

const BoardRiskAssessmentSchema = z.object({
  snapshotId: z.string().uuid(),
  businessAccountId: z.string().uuid(),
  riskCategory: z.enum(['financial', 'operational', 'strategic', 'compliance', 'market']),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  riskTitle: z.string().min(1).max(200),
  riskDescription: z.string().min(1),
  probabilityScore: z.number().min(0).max(1),
  impactScore: z.number().min(0).max(1),
  mitigationStrategy: z.string().optional(),
  mitigationStatus: z.enum(['not_started', 'in_progress', 'completed', 'monitored']).default('not_started'),
  ownerRole: z.string().max(100).optional(),
  targetResolutionDate: z.string().datetime().optional(),
  createdBy: z.string().uuid()
});

const BoardStrategicAlertSchema = z.object({
  snapshotId: z.string().uuid(),
  businessAccountId: z.string().uuid(),
  alertType: z.enum(['kpi_deviation', 'trend_change', 'risk_escalation', 'opportunity', 'compliance']),
  severity: z.enum(['info', 'warning', 'critical']),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  kpiCategory: z.string().max(50).optional(),
  currentValue: z.number().optional(),
  targetValue: z.number().optional(),
  variancePercentage: z.number().optional(),
  trendDirection: z.enum(['improving', 'declining', 'stable', 'volatile']).optional(),
  actionRequired: z.boolean().default(false),
  actionDescription: z.string().optional(),
  responsibleRole: z.string().max(100).optional(),
  dueDate: z.string().datetime().optional(),
  createdBy: z.string().uuid()
});

const BoardPackDocumentSchema = z.object({
  snapshotId: z.string().uuid(),
  businessAccountId: z.string().uuid(),
  documentType: z.enum(['pdf', 'docx', 'html']),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  executiveSummary: z.string().min(1),
  financialHighlights: z.record(z.any()),
  riskSummary: z.record(z.any()),
  strategicRecommendations: z.record(z.any()),
  language: z.enum(['en', 'ar']).default('en'),
  generatedBy: z.string().uuid()
});

const BoardAccessControlSchema = z.object({
  businessAccountId: z.string().uuid(),
  userId: z.string().uuid(),
  accessLevel: z.enum(['board_member', 'chairman', 'secretary', 'observer']),
  canViewKpis: z.boolean().default(true),
  canViewRisks: z.boolean().default(true),
  canViewAlerts: z.boolean().default(true),
  canDownloadReports: z.boolean().default(true),
  canGenerateReports: z.boolean().default(false),
  accessEndDate: z.string().datetime().optional(),
  grantedBy: z.string().uuid()
});

export interface BoardKPISnapshot {
  id: string;
  periodType: string;
  periodStartDate: Date;
  periodEndDate: Date;
  businessAccountId: string;
  revenueCurrent: number;
  revenuePreviousPeriod: number;
  revenuePreviousYear: number;
  revenueGrowthQoQ: number;
  revenueGrowthYoY: number;
  ebitdaCurrent: number;
  ebitdaPreviousPeriod: number;
  ebitdaPreviousYear: number;
  ebitdaMarginCurrent: number;
  netProfitCurrent: number;
  netProfitPreviousPeriod: number;
  netProfitPreviousYear: number;
  netProfitMarginCurrent: number;
  cashPositionCurrent: number;
  cashPositionPreviousPeriod: number;
  monthlyBurnRate: number;
  cashRunwayMonths: number;
  forecastConfidenceScore: number;
  forecastAccuracyHistorical: number;
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  ltvCacRatio: number;
  grossMarginCurrent: number;
  operatingMarginCurrent: number;
  createdAt: Date;
  createdBy: string;
  snapshotHash: string;
  dataSources: any;
}

export interface BoardRiskAssessment {
  id: string;
  snapshotId: string;
  businessAccountId: string;
  riskCategory: string;
  riskLevel: string;
  riskTitle: string;
  riskDescription: string;
  probabilityScore: number;
  impactScore: number;
  riskScore: number;
  mitigationStrategy?: string;
  mitigationStatus: string;
  ownerRole?: string;
  identifiedDate: Date;
  targetResolutionDate?: Date;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface BoardStrategicAlert {
  id: string;
  snapshotId: string;
  businessAccountId: string;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  kpiCategory?: string;
  currentValue?: number;
  targetValue?: number;
  variancePercentage?: number;
  trendDirection?: string;
  actionRequired: boolean;
  actionDescription?: string;
  responsibleRole?: string;
  dueDate?: Date;
  status: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy?: string;
}

export interface BoardPackDocument {
  id: string;
  snapshotId: string;
  businessAccountId: string;
  documentType: string;
  title: string;
  description?: string;
  executiveSummary: string;
  financialHighlights: any;
  riskSummary: any;
  strategicRecommendations: any;
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

export interface BoardAccessControl {
  id: string;
  businessAccountId: string;
  userId: string;
  accessLevel: string;
  canViewKpis: boolean;
  canViewRisks: boolean;
  canViewAlerts: boolean;
  canDownloadReports: boolean;
  canGenerateReports: boolean;
  accessStartDate: Date;
  accessEndDate?: Date;
  grantedAt: Date;
  grantedBy: string;
  revokedAt?: Date;
  revokedBy?: string;
}

export class BoardReportingService {
  // Board KPI Snapshot Management
  async generateKPISnapshot(data: z.infer<typeof BoardKPISnapshotSchema>): Promise<BoardKPISnapshot> {
    const validated = BoardKPISnapshotSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      SELECT generate_board_kpi_snapshot(
        ${validated.businessAccountId}::uuid,
        ${validated.periodType}::varchar,
        ${validated.periodStartDate}::date,
        ${validated.periodEndDate}::date,
        ${validated.createdBy}::uuid
      ) as snapshot_id
    `;
    
    const snapshotId = (result as any)[0]?.snapshot_id;
    
    return await this.getKPISnapshotById(snapshotId);
  }

  async getKPISnapshotById(snapshotId: string): Promise<BoardKPISnapshot> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        period_type as "periodType",
        period_start_date as "periodStartDate",
        period_end_date as "periodEndDate",
        business_account_id as "businessAccountId",
        revenue_current as "revenueCurrent",
        revenue_previous_period as "revenuePreviousPeriod",
        revenue_previous_year as "revenuePreviousYear",
        revenue_growth_qoq as "revenueGrowthQoQ",
        revenue_growth_yoy as "revenueGrowthYoY",
        ebitda_current as "ebitdaCurrent",
        ebitda_previous_period as "ebitdaPreviousPeriod",
        ebitda_previous_year as "ebitdaPreviousYear",
        ebitda_margin_current as "ebitdaMarginCurrent",
        net_profit_current as "netProfitCurrent",
        net_profit_previous_period as "netProfitPreviousPeriod",
        net_profit_previous_year as "netProfitPreviousYear",
        net_profit_margin_current as "netProfitMarginCurrent",
        cash_position_current as "cashPositionCurrent",
        cash_position_previous_period as "cashPositionPreviousPeriod",
        monthly_burn_rate as "monthlyBurnRate",
        cash_runway_months as "cashRunwayMonths",
        forecast_confidence_score as "forecastConfidenceScore",
        forecast_accuracy_historical as "forecastAccuracyHistorical",
        customer_acquisition_cost as "customerAcquisitionCost",
        customer_lifetime_value as "customerLifetimeValue",
        ltv_cac_ratio as "ltvCacRatio",
        gross_margin_current as "grossMarginCurrent",
        operating_margin_current as "operatingMarginCurrent",
        created_at as "createdAt",
        created_by as "createdBy",
        snapshot_hash as "snapshotHash",
        data_sources as "dataSources"
      FROM board_kpi_snapshots
      WHERE id = ${snapshotId}::uuid
    `;
    
    return (result as any)[0];
  }

  async getKPISnapshots(businessAccountId: string, filters: {
    periodType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}): Promise<BoardKPISnapshot[]> {
    const { periodType, startDate, endDate, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        period_type as "periodType",
        period_start_date as "periodStartDate",
        period_end_date as "periodEndDate",
        business_account_id as "businessAccountId",
        revenue_current as "revenueCurrent",
        revenue_previous_period as "revenuePreviousPeriod",
        revenue_previous_year as "revenuePreviousYear",
        revenue_growth_qoq as "revenueGrowthQoQ",
        revenue_growth_yoy as "revenueGrowthYoY",
        ebitda_current as "ebitdaCurrent",
        ebitda_previous_period as "ebitdaPreviousPeriod",
        ebitda_previous_year as "ebitdaPreviousYear",
        ebitda_margin_current as "ebitdaMarginCurrent",
        net_profit_current as "netProfitCurrent",
        net_profit_previous_period as "netProfitPreviousPeriod",
        net_profit_previous_year as "netProfitPreviousYear",
        net_profit_margin_current as "netProfitMarginCurrent",
        cash_position_current as "cashPositionCurrent",
        cash_position_previous_period as "cashPositionPreviousPeriod",
        monthly_burn_rate as "monthlyBurnRate",
        cash_runway_months as "cashRunwayMonths",
        forecast_confidence_score as "forecastConfidenceScore",
        forecast_accuracy_historical as "forecastAccuracyHistorical",
        customer_acquisition_cost as "customerAcquisitionCost",
        customer_lifetime_value as "customerLifetimeValue",
        ltv_cac_ratio as "ltvCacRatio",
        gross_margin_current as "grossMarginCurrent",
        operating_margin_current as "operatingMarginCurrent",
        created_at as "createdAt",
        created_by as "createdBy",
        snapshot_hash as "snapshotHash",
        data_sources as "dataSources"
      FROM board_kpi_snapshots
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
    return result as BoardKPISnapshot[];
  }

  // Board Risk Assessment Management
  async createRiskAssessment(data: z.infer<typeof BoardRiskAssessmentSchema>): Promise<BoardRiskAssessment> {
    const validated = BoardRiskAssessmentSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO board_risk_assessments (
        id,
        snapshot_id,
        business_account_id,
        risk_category,
        risk_level,
        risk_title,
        risk_description,
        probability_score,
        impact_score,
        risk_score,
        mitigation_strategy,
        mitigation_status,
        owner_role,
        target_resolution_date,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.snapshotId}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.riskCategory}::varchar,
        ${validated.riskLevel}::varchar,
        ${validated.riskTitle}::varchar,
        ${validated.riskDescription}::text,
        ${validated.probabilityScore}::decimal,
        ${validated.impactScore}::decimal,
        ${validated.probabilityScore * validated.impactScore}::decimal,
        ${validated.mitigationStrategy || null}::text,
        ${validated.mitigationStatus}::varchar,
        ${validated.ownerRole || null}::varchar,
        ${validated.targetResolutionDate || null}::date,
        ${validated.createdBy}::uuid
      ) RETURNING *
    `;
    
    return (result as any)[0];
  }

  async getRiskAssessments(snapshotId: string): Promise<BoardRiskAssessment[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        snapshot_id as "snapshotId",
        business_account_id as "businessAccountId",
        risk_category as "riskCategory",
        risk_level as "riskLevel",
        risk_title as "riskTitle",
        risk_description as "riskDescription",
        probability_score as "probabilityScore",
        impact_score as "impactScore",
        risk_score as "riskScore",
        mitigation_strategy as "mitigationStrategy",
        mitigation_status as "mitigationStatus",
        owner_role as "ownerRole",
        identified_date as "identifiedDate",
        target_resolution_date as "targetResolutionDate",
        created_at as "createdAt",
        created_by as "createdBy",
        updated_at as "updatedAt",
        updated_by as "updatedBy"
      FROM board_risk_assessments
      WHERE snapshot_id = ${snapshotId}::uuid
      ORDER BY risk_score DESC, risk_level DESC
    `;
    
    return result as BoardRiskAssessment[];
  }

  // Board Strategic Alerts Management
  async createStrategicAlert(data: z.infer<typeof BoardStrategicAlertSchema>): Promise<BoardStrategicAlert> {
    const validated = BoardStrategicAlertSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO board_strategic_alerts (
        id,
        snapshot_id,
        business_account_id,
        alert_type,
        severity,
        title,
        description,
        kpi_category,
        current_value,
        target_value,
        variance_percentage,
        trend_direction,
        action_required,
        action_description,
        responsible_role,
        due_date,
        created_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.snapshotId}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.alertType}::varchar,
        ${validated.severity}::varchar,
        ${validated.title}::varchar,
        ${validated.description}::text,
        ${validated.kpiCategory || null}::varchar,
        ${validated.currentValue || null}::decimal,
        ${validated.targetValue || null}::decimal,
        ${validated.variancePercentage || null}::decimal,
        ${validated.trendDirection || null}::varchar,
        ${validated.actionRequired}::boolean,
        ${validated.actionDescription || null}::text,
        ${validated.responsibleRole || null}::varchar,
        ${validated.dueDate || null}::date,
        ${validated.createdBy}::uuid
      ) RETURNING *
    `;
    
    return (result as any)[0];
  }

  async getStrategicAlerts(businessAccountId: string, filters: {
    severity?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<BoardStrategicAlert[]> {
    const { severity, status, limit = 100 } = filters;
    
    let query = `
      SELECT 
        id,
        snapshot_id as "snapshotId",
        business_account_id as "businessAccountId",
        alert_type as "alertType",
        severity,
        title,
        description,
        kpi_category as "kpiCategory",
        current_value as "currentValue",
        target_value as "targetValue",
        variance_percentage as "variancePercentage",
        trend_direction as "trendDirection",
        action_required as "actionRequired",
        action_description as "actionDescription",
        responsible_role as "responsibleRole",
        due_date as "dueDate",
        status,
        created_at as "createdAt",
        created_by as "createdBy",
        updated_at as "updatedAt",
        updated_by as "updatedBy"
      FROM board_strategic_alerts
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (severity) {
      query += ` AND severity = '${severity}'`;
    }
    
    if (status) {
      query += ` AND status = '${status}'`;
    }
    
    query += ` ORDER BY severity DESC, created_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as BoardStrategicAlert[];
  }

  // Board Pack Document Management
  async createBoardPackDocument(data: z.infer<typeof BoardPackDocumentSchema>): Promise<BoardPackDocument> {
    const validated = BoardPackDocumentSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO board_pack_documents (
        id,
        snapshot_id,
        business_account_id,
        document_type,
        title,
        description,
        executive_summary,
        financial_highlights,
        risk_summary,
        strategic_recommendations,
        language,
        generated_by,
        template_version,
        status
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.snapshotId}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.documentType}::varchar,
        ${validated.title}::varchar,
        ${validated.description || null}::text,
        ${validated.executiveSummary}::text,
        ${JSON.stringify(validated.financialHighlights)}::jsonb,
        ${JSON.stringify(validated.riskSummary)}::jsonb,
        ${JSON.stringify(validated.strategicRecommendations)}::jsonb,
        ${validated.language}::varchar,
        ${validated.generatedBy}::uuid,
        '1.0'::varchar,
        'completed'::varchar
      ) RETURNING *
    `;
    
    return (result as any)[0];
  }

  async getBoardPackDocuments(businessAccountId: string, filters: {
    documentType?: string;
    language?: string;
    limit?: number;
  } = {}): Promise<BoardPackDocument[]> {
    const { documentType, language, limit = 50 } = filters;
    
    let query = `
      SELECT 
        id,
        snapshot_id as "snapshotId",
        business_account_id as "businessAccountId",
        document_type as "documentType",
        title,
        description,
        executive_summary as "executiveSummary",
        financial_highlights as "financialHighlights",
        risk_summary as "riskSummary",
        strategic_recommendations as "strategicRecommendations",
        file_path as "filePath",
        file_size_bytes as "fileSizeBytes",
        download_count as "downloadCount",
        generated_at as "generatedAt",
        generated_by as "generatedBy",
        generation_duration_ms as "generationDurationMs",
        template_version as "templateVersion",
        language,
        status
      FROM board_pack_documents
      WHERE business_account_id = ${businessAccountId}::uuid
    `;
    
    if (documentType) {
      query += ` AND document_type = '${documentType}'`;
    }
    
    if (language) {
      query += ` AND language = '${language}'`;
    }
    
    query += ` ORDER BY generated_at DESC LIMIT ${limit}`;
    
    const result = await prisma.$queryRawUnsafe(query);
    return result as BoardPackDocument[];
  }

  // Board Access Control Management
  async grantBoardAccess(data: z.infer<typeof BoardAccessControlSchema>): Promise<BoardAccessControl> {
    const validated = BoardAccessControlSchema.parse(data);
    
    const result = await prisma.$queryRaw`
      INSERT INTO board_access_control (
        id,
        business_account_id,
        user_id,
        access_level,
        can_view_kpis,
        can_view_risks,
        can_view_alerts,
        can_download_reports,
        can_generate_reports,
        access_start_date,
        access_end_date,
        granted_by
      ) VALUES (
        ${uuidv4()}::uuid,
        ${validated.businessAccountId}::uuid,
        ${validated.userId}::uuid,
        ${validated.accessLevel}::varchar,
        ${validated.canViewKpis}::boolean,
        ${validated.canViewRisks}::boolean,
        ${validated.canViewAlerts}::boolean,
        ${validated.canDownloadReports}::boolean,
        ${validated.canGenerateReports}::boolean,
        CURRENT_DATE::date,
        ${validated.accessEndDate || null}::date,
        ${validated.grantedBy}::uuid
      ) RETURNING *
    `;
    
    return (result as any)[0];
  }

  async getBoardAccess(userId: string, businessAccountId: string): Promise<BoardAccessControl | null> {
    const result = await prisma.$queryRaw`
      SELECT 
        id,
        business_account_id as "businessAccountId",
        user_id as "userId",
        access_level as "accessLevel",
        can_view_kpis as "canViewKpis",
        can_view_risks as "canViewRisks",
        can_view_alerts as "canViewAlerts",
        can_download_reports as "canDownloadReports",
        can_generate_reports as "canGenerateReports",
        access_start_date as "accessStartDate",
        access_end_date as "accessEndDate",
        granted_at as "grantedAt",
        granted_by as "grantedBy",
        revoked_at as "revokedAt",
        revoked_by as "revokedBy"
      FROM board_access_control
      WHERE user_id = ${userId}::uuid
        AND business_account_id = ${businessAccountId}::uuid
        AND (revoked_at IS NULL)
        AND (access_end_date IS NULL OR access_end_date >= CURRENT_DATE)
    `;
    
    return (result as any)[0] || null;
  }

  // Board Analytics and Trends
  async getBoardKPITrends(businessAccountId: string, periodType: string = 'quarterly'): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        business_account_id as "businessAccountId",
        period_type as "periodType",
        quarter,
        avg_revenue_growth_qoq as "avgRevenueGrowthQoQ",
        avg_ebitda_margin as "avgEbitdaMargin",
        avg_net_profit_margin as "avgNetProfitMargin",
        avg_forecast_confidence as "avgForecastConfidence",
        avg_cash_runway as "avgCashRunway",
        snapshot_count as "snapshotCount"
      FROM board_kpi_trends
      WHERE business_account_id = ${businessAccountId}::uuid
        AND period_type = ${periodType}::varchar
      ORDER BY quarter DESC
      LIMIT 12
    `;
    
    return result as any[];
  }

  async getBoardRiskSummary(businessAccountId: string): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        business_account_id as "businessAccountId",
        risk_category as "riskCategory",
        risk_level as "riskLevel",
        risk_count as "riskCount",
        avg_risk_score as "avgRiskScore",
        latest_identification as "latestIdentification"
      FROM board_risk_summary
      WHERE business_account_id = ${businessAccountId}::uuid
      ORDER BY risk_level DESC, risk_category
    `;
    
    return result as any[];
  }

  async getBoardAlertTrends(businessAccountId: string): Promise<any[]> {
    const result = await prisma.$queryRaw`
      SELECT 
        business_account_id as "businessAccountId",
        alert_type as "alertType",
        severity,
        month,
        alert_count as "alertCount",
        resolved_count as "resolvedCount",
        avg_resolution_days as "avgResolutionDays"
      FROM board_alert_trends
      WHERE business_account_id = ${businessAccountId}::uuid
      ORDER BY month DESC, severity DESC
      LIMIT 24
    `;
    
    return result as any[];
  }

  // Materialized View Refresh
  async refreshBoardAnalytics(): Promise<void> {
    await prisma.$queryRaw`SELECT refresh_board_materialized_views()`;
  }

  // Board Audit Log
  async getBoardAuditLog(businessAccountId: string, filters: {
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
        ip_address as "ipAddress",
        user_agent as "userAgent",
        performed_at as "performedAt",
        additional_data as "additionalData"
      FROM board_audit_log
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
}
