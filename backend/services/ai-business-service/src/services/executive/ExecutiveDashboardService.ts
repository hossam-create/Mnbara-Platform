import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Types for Executive Dashboard Service
export interface CEODashboardData {
  businessAccountId: string;
  periodId: string;
  financialData: {
    revenue: number;
    expenses: number;
    profit: number;
    cashFlow: number;
  };
  alertsSummary: {
    criticalAlerts: number;
    warningAlerts: number;
    totalActive: number;
  };
  kpiMetrics: {
    revenueGrowthRate: number;
    profitMargin: number;
    cashPosition: number;
  };
  trends: {
    revenueTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
    profitabilityTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
    cashTrend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  };
  generatedAt: Date;
}

export interface CFODashboardData {
  businessAccountId: string;
  periodId: string;
  financialStatements: {
    incomeStatement: {
      revenue: number;
      expenses: number;
      grossProfit: number;
      operatingIncome: number;
      netIncome: number;
    };
    balanceSheet: {
      totalAssets: number;
      currentAssets: number;
      totalLiabilities: number;
      currentLiabilities: number;
      equity: number;
    };
    cashFlow: {
      operatingCashFlow: number;
      investingCashFlow: number;
      financingCashFlow: number;
      netCashFlow: number;
    };
  };
  ratios: Array<{
    ratioName: string;
    ratioValue: number;
    ratioType: string;
  }>;
  forecastComparison: Array<{
    metric: string;
    forecast: number;
    actual: number;
    variancePercentage: number;
    accuracy: string;
  }>;
  riskLevels: {
    liquidityRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    solvencyRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    profitabilityRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  generatedAt: Date;
}

export interface NarrativeReportRequest {
  businessAccountId: string;
  reportType: 'CEO_SUMMARY' | 'CFO_REPORT' | 'MONTHLY' | 'QUARTERLY';
  periodId?: string;
  language: 'en' | 'ar';
}

export interface NarrativeReport {
  businessAccountId: string;
  periodId: string;
  reportType: string;
  language: string;
  narrativeContent: {
    executiveSummary: string;
    financialPerformance: string;
    keyHighlights: string;
    challengesAndRisks: string;
    strategicRecommendations: string;
    outlook: string;
  };
  dataSources: string[];
  confidenceScore: number;
  generatedAt: Date;
}

export interface ExecutiveActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'FINANCIAL' | 'OPERATIONAL' | 'STRATEGIC' | 'COMPLIANCE';
  assignedTo?: string;
  dueDate?: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  progressPercentage: number;
  sourceType: string;
  sourceId?: string;
  createdAt: Date;
}

// Validation schemas
const NarrativeReportRequestSchema = z.object({
  businessAccountId: z.string().uuid(),
  reportType: z.enum(['CEO_SUMMARY', 'CFO_REPORT', 'MONTHLY', 'QUARTERLY']),
  periodId: z.string().uuid().optional(),
  language: z.enum(['en', 'ar'])
});

const CreateActionItemSchema = z.object({
  businessAccountId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  category: z.enum(['FINANCIAL', 'OPERATIONAL', 'STRATEGIC', 'COMPLIANCE']),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  sourceType: z.string(),
  sourceId: z.string().uuid().optional()
});

export class ExecutiveDashboardService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate CEO Dashboard data
   */
  async getCEODashboard(businessAccountId: string, periodId?: string): Promise<CEODashboardData> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT * FROM generate_ceo_dashboard_data(${businessAccountId}, ${periodId || null})
      ` as any[];

      const data = result[0];
      
      // Calculate trends
      const trends = await this.calculateCEOTrends(businessAccountId, periodId);

      return {
        businessAccountId,
        periodId: data.period_id,
        financialData: data.financial_data,
        alertsSummary: data.alerts_summary,
        kpiMetrics: data.kpi_metrics,
        trends,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating CEO dashboard:', error);
      throw new Error('Failed to generate CEO dashboard data');
    }
  }

  /**
   * Generate CFO Dashboard data
   */
  async getCFODashboard(businessAccountId: string, periodId?: string): Promise<CFODashboardData> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT * FROM generate_cfo_dashboard_data(${businessAccountId}, ${periodId || null})
      ` as any[];

      const data = result[0];
      
      // Calculate risk levels
      const riskLevels = await this.calculateRiskLevels(data.ratios, data.financial_statements);

      return {
        businessAccountId,
        periodId: data.period_id,
        financialStatements: data.financial_statements,
        ratios: data.ratios || [],
        forecastComparison: data.forecast_comparison || [],
        riskLevels,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating CFO dashboard:', error);
      throw new Error('Failed to generate CFO dashboard data');
    }
  }

  /**
   * Calculate CEO trends
   */
  private async calculateCEOTrends(businessAccountId: string, periodId?: string): Promise<any> {
    try {
      // Get last 3 periods of data for trend analysis
      const trends = await this.prisma.$queryRaw`
        WITH period_data AS (
          SELECT 
            fp.id as period_id,
            fp.name as period_name,
            fp.end_date,
            fs.revenue,
            fs.profit,
            fs.cash_flow
          FROM fiscal_periods fp
          LEFT JOIN financial_statements fs ON fp.id = fs.fiscal_period_id
          WHERE fp.business_account_id = ${businessAccountId}
          ORDER BY fp.end_date DESC
          LIMIT 3
        )
        SELECT
          period_name,
          revenue,
          profit,
          cash_flow,
          CASE 
            WHEN LAG(revenue) OVER (ORDER BY end_date) IS NOT NULL THEN
              CASE 
                WHEN revenue > LAG(revenue) OVER (ORDER BY end_date) THEN 'INCREASING'
                WHEN revenue < LAG(revenue) OVER (ORDER BY end_date) THEN 'DECREASING'
                ELSE 'STABLE'
              END
            ELSE 'STABLE'
          END as revenue_trend,
          CASE 
            WHEN LAG(profit) OVER (ORDER BY end_date) IS NOT NULL THEN
              CASE 
                WHEN profit > LAG(profit) OVER (ORDER BY end_date) THEN 'INCREASING'
                WHEN profit < LAG(profit) OVER (ORDER BY end_date) THEN 'DECREASING'
                ELSE 'STABLE'
              END
            ELSE 'STABLE'
          END as profit_trend,
          CASE 
            WHEN LAG(cash_flow) OVER (ORDER BY end_date) IS NOT NULL THEN
              CASE 
                WHEN cash_flow > LAG(cash_flow) OVER (ORDER BY end_date) THEN 'IMPROVING'
                WHEN cash_flow < LAG(cash_flow) OVER (ORDER BY end_date) THEN 'DECLINING'
                ELSE 'STABLE'
              END
            ELSE 'STABLE'
          END as cash_trend
        FROM period_data
        ORDER BY end_date DESC
        LIMIT 1
      ` as any[];

      const latestTrend = trends[0] || {};

      return {
        revenueTrend: latestTrend.revenue_trend || 'STABLE',
        profitabilityTrend: latestTrend.profit_trend || 'STABLE',
        cashTrend: latestTrend.cash_trend || 'STABLE'
      };
    } catch (error) {
      console.error('Error calculating CEO trends:', error);
      return {
        revenueTrend: 'STABLE',
        profitabilityTrend: 'STABLE',
        cashTrend: 'STABLE'
      };
    }
  }

  /**
   * Calculate risk levels for CFO dashboard
   */
  private async calculateRiskLevels(ratios: any[], financialStatements: any): Promise<any> {
    try {
      const ratioMap = new Map();
      ratios.forEach((ratio: any) => {
        ratioMap.set(ratio.ratio_name, ratio.ratio_value);
      });

      const currentRatio = ratioMap.get('current_ratio') || 0;
      const debtToEquity = ratioMap.get('debt_to_equity') || 0;
      const netMargin = ratioMap.get('net_profit_margin') || 0;
      const cashBalance = financialStatements?.cash_flow?.net_cash_flow || 0;

      // Calculate risk levels
      const liquidityRisk = 
        currentRatio < 1.0 ? 'CRITICAL' :
        currentRatio < 1.5 ? 'HIGH' :
        currentRatio < 2.0 ? 'MEDIUM' : 'LOW';

      const solvencyRisk = 
        debtToEquity > 2.0 ? 'CRITICAL' :
        debtToEquity > 1.5 ? 'HIGH' :
        debtToEquity > 1.0 ? 'MEDIUM' : 'LOW';

      const profitabilityRisk = 
        netMargin < 0 ? 'CRITICAL' :
        netMargin < 5 ? 'HIGH' :
        netMargin < 10 ? 'MEDIUM' : 'LOW';

      return {
        liquidityRisk,
        solvencyRisk,
        profitabilityRisk
      };
    } catch (error) {
      console.error('Error calculating risk levels:', error);
      return {
        liquidityRisk: 'MEDIUM',
        solvencyRisk: 'MEDIUM',
        profitabilityRisk: 'MEDIUM'
      };
    }
  }

  /**
   * Generate narrative report
   */
  async generateNarrativeReport(request: NarrativeReportRequest, userId: string): Promise<NarrativeReport> {
    try {
      const validated = NarrativeReportRequestSchema.parse(request);

      const result = await this.prisma.$queryRaw`
        SELECT * FROM generate_narrative_report(
          ${validated.businessAccountId},
          ${validated.reportType},
          ${validated.periodId || null},
          ${validated.language}
        )
      ` as any[];

      const reportData = result[0];

      // Save report to database
      const savedReport = await this.saveNarrativeReport(reportData, userId);

      return {
        businessAccountId: validated.businessAccountId,
        periodId: reportData.period_id,
        reportType: validated.reportType,
        language: validated.language,
        narrativeContent: reportData.narrative_content,
        dataSources: reportData.data_sources,
        confidenceScore: reportData.confidence_score,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating narrative report:', error);
      throw new Error('Failed to generate narrative report');
    }
  }

  /**
   * Save narrative report to database
   */
  private async saveNarrativeReport(reportData: any, userId: string): Promise<any> {
    try {
      const result = await this.prisma.$queryRaw`
        INSERT INTO executive_narrative_reports (
          business_account_id, report_type, period_id, language,
          executive_summary, financial_performance, key_highlights,
          challenges_and_risks, strategic_recommendations, outlook,
          generated_by, ai_model_version, data_sources, confidence_score
        ) VALUES (
          ${reportData.business_account_id},
          ${reportData.report_type},
          ${reportData.period_id},
          ${reportData.language},
          ${reportData.narrative_content->>'executive_summary'},
          ${reportData.narrative_content->>'financial_performance'},
          ${reportData.narrative_content->>'key_highlights'},
          ${reportData.narrative_content->>'challenges_and_risks'},
          ${reportData.narrative_content->>'strategic_recommendations'},
          ${reportData.narrative_content->>'outlook'},
          ${userId},
          'v1.0',
          ${JSON.stringify(reportData.data_sources)},
          ${reportData.confidence_score}
        )
        RETURNING id, generated_at
      ` as any[];

      // Save report sections
      const sections = [
        { section_name: 'executive_summary', section_title: 'Executive Summary', section_content: reportData.narrative_content->>'executive_summary', section_order: 1 },
        { section_name: 'financial_performance', section_title: 'Financial Performance', section_content: reportData.narrative_content->>'financial_performance', section_order: 2 },
        { section_name: 'key_highlights', section_title: 'Key Highlights', section_content: reportData.narrative_content->>'key_highlights', section_order: 3 },
        { section_name: 'challenges_and_risks', section_title: 'Challenges and Risks', section_content: reportData.narrative_content->>'challenges_and_risks', section_order: 4 },
        { section_name: 'strategic_recommendations', section_title: 'Strategic Recommendations', section_content: reportData.narrative_content->>'strategic_recommendations', section_order: 5 },
        { section_name: 'outlook', section_title: 'Outlook', section_content: reportData.narrative_content->>'outlook', section_order: 6 }
      ];

      for (const section of sections) {
        await this.prisma.$queryRaw`
          INSERT INTO narrative_report_sections (
            report_id, section_name, section_title, section_content, section_order
          ) VALUES (
            ${result[0].id},
            ${section.section_name},
            ${section.section_title},
            ${section.section_content},
            ${section.section_order}
          )
        `;
      }

      return result[0];
    } catch (error) {
      console.error('Error saving narrative report:', error);
      throw new Error('Failed to save narrative report');
    }
  }

  /**
   * Get narrative reports
   */
  async getNarrativeReports(businessAccountId: string, filters: {
    reportType?: string;
    language?: string;
    periodId?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    try {
      let query = `
        SELECT 
          enr.id, report_type, period_id, language, executive_summary,
          financial_performance, key_highlights, challenges_and_risks,
          strategic_recommendations, outlook, report_period, generated_at,
          generated_by, confidence_score, version
        FROM executive_narrative_reports enr
        WHERE enr.business_account_id = $1
      `;

      const params: any[] = [businessAccountId];
      let paramIndex = 2;

      if (filters.reportType) {
        query += ` AND enr.report_type = $${paramIndex++}`;
        params.push(filters.reportType);
      }

      if (filters.language) {
        query += ` AND enr.language = $${paramIndex++}`;
        params.push(filters.language);
      }

      if (filters.periodId) {
        query += ` AND enr.period_id = $${paramIndex++}`;
        params.push(filters.periodId);
      }

      query += ` ORDER BY enr.generated_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      const reports = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      return reports;
    } catch (error) {
      console.error('Error getting narrative reports:', error);
      throw new Error('Failed to retrieve narrative reports');
    }
  }

  /**
   * Get narrative report by ID
   */
  async getNarrativeReportById(reportId: string): Promise<any> {
    try {
      const report = await this.prisma.$queryRaw`
        SELECT 
          enr.*,
          fp.name as period_name
        FROM executive_narrative_reports enr
        JOIN fiscal_periods fp ON enr.period_id = fp.id
        WHERE enr.id = ${reportId}
      ` as any[];

      if (report.length === 0) {
        throw new Error('Report not found');
      }

      // Get report sections
      const sections = await this.prisma.$queryRaw`
        SELECT section_name, section_title, section_content, section_order
        FROM narrative_report_sections
        WHERE report_id = ${reportId}
        ORDER BY section_order ASC
      ` as any[];

      return {
        ...report[0],
        sections
      };
    } catch (error) {
      console.error('Error getting narrative report:', error);
      throw new Error('Failed to retrieve narrative report');
    }
  }

  /**
   * Create executive action item
   */
  async createActionItem(request: any, userId: string): Promise<ExecutiveActionItem> {
    try {
      const validated = CreateActionItemSchema.parse(request);

      const result = await this.prisma.$queryRaw`
        INSERT INTO executive_action_items (
          business_account_id, title, description, priority, category,
          assigned_to, due_date, status, source_type, source_id, created_by
        ) VALUES (
          ${validated.businessAccountId},
          ${validated.title},
          ${validated.description || null},
          ${validated.priority},
          ${validated.category},
          ${validated.assignedTo || null},
          ${validated.dueDate ? new Date(validated.dueDate) : null},
          'PENDING',
          ${validated.sourceType},
          ${validated.sourceId || null},
          ${userId}
        )
        RETURNING id, title, priority, status, created_at
      ` as any[];

      return {
        id: result[0].id,
        title: validated.title,
        description: validated.description,
        priority: validated.priority,
        category: validated.category,
        assignedTo: validated.assignedTo,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
        status: 'PENDING',
        progressPercentage: 0,
        sourceType: validated.sourceType,
        sourceId: validated.sourceId,
        createdAt: result[0].created_at
      };
    } catch (error) {
      console.error('Error creating action item:', error);
      throw new Error('Failed to create action item');
    }
  }

  /**
   * Get executive action items
   */
  async getActionItems(businessAccountId: string, filters: {
    priority?: string;
    status?: string;
    category?: string;
    assignedTo?: string;
    limit?: number;
  } = {}): Promise<ExecutiveActionItem[]> {
    try {
      let query = `
        SELECT 
          id, title, description, priority, category, assigned_to, due_date,
          status, progress_percentage, completion_date, source_type, source_id,
          created_by, created_at, updated_at
        FROM executive_action_items 
        WHERE business_account_id = $1
      `;

      const params: any[] = [businessAccountId];
      let paramIndex = 2;

      if (filters.priority) {
        query += ` AND priority = $${paramIndex++}`;
        params.push(filters.priority);
      }

      if (filters.status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(filters.status);
      }

      if (filters.category) {
        query += ` AND category = $${paramIndex++}`;
        params.push(filters.category);
      }

      if (filters.assignedTo) {
        query += ` AND assigned_to = $${paramIndex++}`;
        params.push(filters.assignedTo);
      }

      query += ` ORDER BY priority DESC, created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      const items = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      return items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        priority: item.priority,
        category: item.category,
        assignedTo: item.assigned_to,
        dueDate: item.due_date,
        status: item.status,
        progressPercentage: item.progress_percentage,
        sourceType: item.source_type,
        sourceId: item.source_id,
        createdAt: item.created_at
      }));
    } catch (error) {
      console.error('Error getting action items:', error);
      throw new Error('Failed to retrieve action items');
    }
  }

  /**
   * Update action item status
   */
  async updateActionItemStatus(
    actionItemId: string,
    status: string,
    progressPercentage?: number,
    notes?: string
  ): Promise<void> {
    try {
      let updateFields = `
        status = $2,
        updated_at = NOW()
      `;
      const params: any[] = [actionItemId, status];
      let paramIndex = 3;

      if (progressPercentage !== undefined) {
        updateFields += `, progress_percentage = $${paramIndex++}`;
        params.push(progressPercentage);
      }

      if (status === 'COMPLETED') {
        updateFields += `, completion_date = NOW()`;
      }

      await this.prisma.$queryRawUnsafe(`
        UPDATE executive_action_items 
        SET ${updateFields}
        WHERE id = $1
      `, ...params);
    } catch (error) {
      console.error('Error updating action item status:', error);
      throw new Error('Failed to update action item status');
    }
  }

  /**
   * Get executive summary for dashboard
   */
  async getExecutiveSummary(businessAccountId: string): Promise<any> {
    try {
      const summary = await this.prisma.$queryRaw`
        SELECT 
          -- CEO Dashboard Summary
          (SELECT jsonb_build_object(
            'revenue_growth_rate', COALESCE(cds.revenue_growth_rate, 0),
            'profit_margin', COALESCE(cds.profit_margin, 0),
            'cash_position', COALESCE(cds.cash_position, 0),
            'critical_alerts', COALESCE(cds.critical_alerts_count, 0),
            'total_alerts', COALESCE(cds.total_active_alerts, 0)
          ) FROM ceo_dashboard_summary cds 
          JOIN fiscal_periods fp ON cds.period_id = fp.id 
          WHERE cds.business_account_id = ${businessAccountId} 
          AND fp.is_current = true 
          LIMIT 1) as ceo_summary,
          
          -- CFO Dashboard Summary
          (SELECT jsonb_build_object(
            'total_revenue', COALESCE(cfs.total_revenue, 0),
            'net_income', COALESCE(cfs.net_income, 0),
            'current_ratio', COALESCE(cfs.current_ratio, 0),
            'debt_to_equity', COALESCE(cfs.debt_to_equity, 0),
            'cash_balance', COALESCE(cfs.cash_balance, 0)
          ) FROM cfo_dashboard_summary cfs 
          JOIN fiscal_periods fp ON cfs.period_id = fp.id 
          WHERE cfs.business_account_id = ${businessAccountId} 
          AND fp.is_current = true 
          LIMIT 1) as cfo_summary,
          
          -- Recent Reports
          (SELECT jsonb_agg(
            jsonb_build_object(
              'id', enr.id,
              'report_type', enr.report_type,
              'language', enr.language,
              'generated_at', enr.generated_at,
              'confidence_score', enr.confidence_score
            )
          ) FROM executive_narrative_reports enr 
          WHERE enr.business_account_id = ${businessAccountId} 
          ORDER BY enr.generated_at DESC 
          LIMIT 5) as recent_reports,
          
          -- Action Items Summary
          (SELECT jsonb_build_object(
            'total_items', COUNT(*),
            'critical_items', COUNT(*) FILTER (WHERE priority = 'CRITICAL'),
            'pending_items', COUNT(*) FILTER (WHERE status = 'PENDING'),
            'in_progress_items', COUNT(*) FILTER (WHERE status = 'IN_PROGRESS')
          ) FROM executive_action_items 
          WHERE business_account_id = ${businessAccountId}) as action_items_summary
      ` as any[];

      return summary[0] || {
        ceo_summary: {},
        cfo_summary: {},
        recent_reports: [],
        action_items_summary: {}
      };
    } catch (error) {
      console.error('Error getting executive summary:', error);
      throw new Error('Failed to retrieve executive summary');
    }
  }

  /**
   * Refresh executive views
   */
  async refreshExecutiveViews(): Promise<void> {
    try {
      await this.prisma.$queryRaw`SELECT refresh_executive_views()`;
    } catch (error) {
      console.error('Error refreshing executive views:', error);
      throw new Error('Failed to refresh executive views');
    }
  }
}
