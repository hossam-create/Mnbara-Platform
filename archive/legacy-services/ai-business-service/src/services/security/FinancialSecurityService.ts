import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

export interface FinancialPeriodStatus {
  id: string;
  businessAccountId: string;
  fiscalYear: number;
  fiscalQuarter?: number;
  fiscalMonth?: number;
  periodStatus: 'OPEN' | 'LOCKED' | 'CLOSED' | 'FINAL';
  lockedAt?: Date;
  lockedBy?: string;
  closedAt?: Date;
  closedBy?: string;
  finalAt?: Date;
  finalizedBy?: string;
  closingNotes?: string;
  closingAdjustments?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssumptionVersion {
  id: string;
  businessAccountId: string;
  assumptionKey: string;
  versionNumber: number;
  versionStatus: 'DRAFT' | 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED';
  effectiveFrom: Date;
  effectiveTo?: Date;
  assumptionValue: number;
  previousValue?: number;
  changeReason: string;
  createdBy?: string;
  approvedBy?: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedAt?: Date;
  approvalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialCloseEvent {
  id: string;
  businessAccountId: string;
  closeType: 'MONTHLY_CLOSE' | 'QUARTERLY_CLOSE' | 'YEARLY_CLOSE' | 'ADJUSTING_ENTRY';
  closeStatus: 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  fiscalYear: number;
  fiscalQuarter?: number;
  fiscalMonth?: number;
  closeDate: Date;
  initiatedBy?: string;
  completedBy?: string;
  totalRevenue?: number;
  totalExpenses?: number;
  netIncome?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  totalEquity?: number;
  adjustingEntries?: any[];
  correctionNotes?: string;
  closeSummary?: string;
  auditTrail?: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityAuditEvent {
  id: string;
  businessAccountId: string;
  eventType: 'DATA_ACCESS' | 'PERMISSION_CHANGE' | 'CLOSE_ATTEMPT' | 'DATA_MODIFICATION' | 'SYSTEM_CONFIG_CHANGE';
  eventSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  eventDescription: string;
  userId?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  oldValue?: any;
  newValue?: any;
  affectedRecords?: any[];
  sessionId?: string;
  requestId?: string;
  apiEndpoint?: string;
  resolutionStatus: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialRolePermission {
  id: string;
  businessAccountId: string;
  roleName: 'FINANCIAL_ADMIN' | 'FINANCIAL_MANAGER' | 'FINANCIAL_VIEWER' | 'AUDITOR';
  permissions: string[];
  isActive: boolean;
  description?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataChangeRecord {
  id: string;
  businessAccountId: string;
  tableName: string;
  recordId: string;
  operationType: 'INSERT' | 'UPDATE' | 'DELETE';
  fieldName: string;
  oldValue?: any;
  newValue?: any;
  changedBy?: string;
  changeReason: string;
  changeCategory: 'CORRECTION' | 'ADJUSTMENT' | 'SYSTEM_UPDATE' | 'USER_ACTION';
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CloseApproval {
  id: string;
  businessAccountId: string;
  closeEventId: string;
  approverRole: 'PRIMARY_APPROVER' | 'SECONDARY_APPROVER' | 'FINAL_APPROVER';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvalLevel: number;
  approvalComments?: string;
  approvedBy?: string;
  delegatedBy?: string;
  approvalTimestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class FinancialSecurityService {
  constructor(private prisma: PrismaClient) {}

  async lockFinancialPeriod(
    businessAccountId: string,
    fiscalYear: number,
    fiscalQuarter?: number,
    fiscalMonth?: number,
    userId: string,
    reason?: string
  ): Promise<string> {
    try {
      logger.info(`Locking financial period for business ${businessAccountId}, year ${fiscalYear}`);

      const result = await this.prisma.$queryRaw`
        SELECT lock_financial_period(
          ${businessAccountId},
          ${fiscalYear},
          ${fiscalQuarter || null},
          ${fiscalMonth || null},
          ${userId},
          ${reason || null}
        )
      `;

      const periodId = (result as any[])[0]?.lock_financial_period;
      
      logger.info(`Financial period locked: ${periodId}`);
      return periodId;
    } catch (error) {
      logger.error('Failed to lock financial period:', error);
      throw error;
    }
  }

  async closeFinancialPeriod(
    businessAccountId: string,
    fiscalYear: number,
    fiscalQuarter?: number,
    fiscalMonth?: number,
    userId: string,
    closingData?: Record<string, any>,
    finalNotes?: string
  ): Promise<string> {
    try {
      logger.info(`Closing financial period for business ${businessAccountId}, year ${fiscalYear}`);

      const result = await this.prisma.$queryRaw`
        SELECT close_financial_period(
          ${businessAccountId},
          ${fiscalYear},
          ${fiscalQuarter || null},
          ${fiscalMonth || null},
          ${userId},
          ${JSON.stringify(closingData || {})},
          ${finalNotes || null}
        )
      `;

      const closeEventId = (result as any[])[0]?.close_financial_period;
      
      logger.info(`Financial period close initiated: ${closeEventId}`);
      return closeEventId;
    } catch (error) {
      logger.error('Failed to close financial period:', error);
      throw error;
    }
  }

  async finalizeFinancialPeriod(
    businessAccountId: string,
    fiscalYear: number,
    fiscalQuarter?: number,
    fiscalMonth?: number,
    userId: string,
    finalNotes?: string
  ): Promise<string> {
    try {
      logger.info(`Finalizing financial period for business ${businessAccountId}, year ${fiscalYear}`);

      const result = await this.prisma.$queryRaw`
        SELECT finalize_financial_period(
          ${businessAccountId},
          ${fiscalYear},
          ${fiscalQuarter || null},
          ${fiscalMonth || null},
          ${userId},
          ${finalNotes || null}
        )
      `;

      const periodId = (result as any[])[0]?.finalize_financial_period;
      
      logger.info(`Financial period finalized: ${periodId}`);
      return periodId;
    } catch (error) {
      logger.error('Failed to finalize financial period:', error);
      throw error;
    }
  }

  async createAssumptionVersion(
    businessAccountId: string,
    assumptionKey: string,
    versionNumber: number,
    assumptionValue: number,
    changeReason: string,
    userId: string,
    approvalRequired: boolean = false
  ): Promise<string> {
    try {
      logger.info(`Creating assumption version for business ${businessAccountId}, key ${assumptionKey}`);

      const result = await this.prisma.$queryRaw`
        SELECT create_assumption_version(
          ${businessAccountId},
          ${assumptionKey},
          ${versionNumber},
          ${assumptionValue},
          ${changeReason},
          ${userId},
          ${approvalRequired}
        )
      `;

      const versionId = (result as any[])[0]?.create_assumption_version;
      
      logger.info(`Assumption version created: ${versionId}`);
      return versionId;
    } catch (error) {
      logger.error('Failed to create assumption version:', error);
      throw error;
    }
  }

  async approveAssumptionVersion(
    businessAccountId: string,
    versionId: string,
    userId: string,
    approvalNotes?: string
  ): Promise<void> {
    try {
      logger.info(`Approving assumption version ${versionId} for business ${businessAccountId}`);

      await this.prisma.$queryRaw`
        SELECT approve_assumption_version(
          ${versionId},
          ${userId},
          ${approvalNotes || null}
        )
      `;

      logger.info(`Assumption version approved: ${versionId}`);
    } catch (error) {
      logger.error('Failed to approve assumption version:', error);
      throw error;
    }
  }

  async checkFinancialPermission(
    userId: string,
    businessAccountId: string,
    requiredPermission: string
  ): Promise<boolean> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT check_financial_permission(
          ${userId},
          ${businessAccountId},
          ${requiredPermission}
        )
      `;

      const hasPermission = (result as any[])[0]?.check_financial_permission;
      
      logger.info(`Permission check for user ${userId}, permission ${requiredPermission}: ${hasPermission}`);
      return hasPermission;
    } catch (error) {
      logger.error('Failed to check financial permission:', error);
      throw error;
    }
  }

  async logDataChange(
    businessAccountId: string,
    tableName: string,
    recordId: string,
    operationType: 'INSERT' | 'UPDATE' | 'DELETE',
    fieldName: string,
    oldValue?: any,
    newValue?: any,
    userId: string,
    changeReason: string,
    requiresApproval: boolean = false
  ): Promise<string> {
    try {
      logger.info(`Logging data change for ${tableName} ${operationType} on ${fieldName}`);

      const result = await this.prisma.$queryRaw`
        SELECT log_financial_data_change(
          ${businessAccountId},
          ${tableName},
          ${recordId},
          ${operationType},
          ${fieldName},
          ${JSON.stringify(oldValue || {})},
          ${JSON.stringify(newValue || {})},
          ${userId},
          ${changeReason},
          ${requiresApproval}
        )
      `;

      const changeId = (result as any[])[0]?.log_financial_data_change;
      
      logger.info(`Data change logged: ${changeId}`);
      return changeId;
    } catch (error) {
      logger.error('Failed to log data change:', error);
      throw error;
    }
  }

  async getFinancialPeriodStatus(
    businessAccountId: string,
    fiscalYear?: number,
    filters?: {
      periodStatus?: string;
      fiscalQuarter?: number;
      fiscalMonth?: number
    }
  ): Promise<FinancialPeriodStatus[]> {
    try {
      const whereClause = ['business_account_id = $1'];
      const params = [businessAccountId];

      if (fiscalYear) {
        whereClause.push('fiscal_year = $' + (params.length + 1));
        params.push(fiscalYear);
      }

      if (filters?.periodStatus) {
        whereClause.push('period_status = $' + (params.length + 1));
        params.push(filters.periodStatus);
      }

      if (filters?.fiscalQuarter) {
        whereClause.push('fiscal_quarter = $' + (params.length + 1));
        params.push(filters.fiscalQuarter);
      }

      if (filters?.fiscalMonth) {
        whereClause.push('fiscal_month = $' + (params.length + 1));
        params.push(filters.fiscalMonth);
      }

      const periods = await this.prisma.$queryRaw`
        SELECT 
          id,
          business_account_id as "businessAccountId",
          fiscal_year as "fiscalYear",
          fiscal_quarter as "fiscalQuarter",
          fiscal_month as "fiscalMonth",
          period_status as "periodStatus",
          locked_at as "lockedAt",
          locked_by as "lockedBy",
          closed_at as "closedAt",
          closed_by as "closedBy",
          final_at as "finalAt",
          finalized_by as "finalizedBy",
          closing_notes as "closingNotes",
          closing_adjustments as "closingAdjustments",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM financial_period_status
        WHERE ${whereClause.join(' AND ')}
        ORDER BY fiscal_year DESC, fiscal_quarter DESC, fiscal_month DESC
      `;

      return periods.map((period: any) => ({
        id: period.id,
        businessAccountId: period.businessAccountId,
        fiscalYear: period.fiscalYear,
        fiscalQuarter: period.fiscalQuarter,
        fiscalMonth: period.fiscalMonth,
        periodStatus: period.periodStatus,
        lockedAt: period.lockedAt,
        lockedBy: period.lockedBy,
        closedAt: period.closedAt,
        closedBy: period.closedBy,
        finalAt: period.finalAt,
        finalizedBy: period.finalizedBy,
        closingNotes: period.closingNotes,
        closingAdjustments: period.closingAdjustments,
        createdAt: period.createdAt,
        updatedAt: period.updatedAt
      }));
    } catch (error) {
      logger.error('Failed to get financial period status:', error);
      throw error;
    }
  }

  async getAssumptionVersions(
    businessAccountId: string,
    assumptionKey?: string,
    filters?: {
      versionStatus?: string;
      effectiveDate?: string
    }
  ): Promise<AssumptionVersion[]> {
    try {
      const whereClause = ['business_account_id = $1'];
      const params = [businessAccountId];

      if (assumptionKey) {
        whereClause.push('assumption_key = $' + (params.length + 1));
        params.push(assumptionKey);
      }

      if (filters?.versionStatus) {
        whereClause.push('version_status = $' + (params.length + 1));
        params.push(filters.versionStatus);
      }

      const versions = await this.prisma.$queryRaw`
        SELECT 
          id,
          business_account_id as "businessAccountId",
          assumption_key as "assumptionKey",
          version_number as "versionNumber",
          version_status as "versionStatus",
          effective_from as "effectiveFrom",
          effective_to as "effectiveTo",
          assumption_value as "assumptionValue",
          previous_value as "previousValue",
          change_reason as "changeReason",
          created_by as "createdBy",
          approved_by as "approvedBy",
          approval_status as "approvalStatus",
          approved_at as "approvedAt",
          approval_notes as "approvalNotes",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM financial_assumption_versions
        WHERE ${whereClause.join(' AND ')}
        ORDER BY assumption_key, version_number DESC
      `;

      return versions.map((version: any) => ({
        id: version.id,
        businessAccountId: version.businessAccountId,
        assumptionKey: version.assumptionKey,
        versionNumber: version.versionNumber,
        versionStatus: version.versionStatus,
        effectiveFrom: version.effectiveFrom,
        effectiveTo: version.effectiveTo,
        assumptionValue: version.assumption_value,
        previousValue: version.previous_value,
        changeReason: version.changeReason,
        createdBy: version.createdBy,
        approvedBy: version.approvedBy,
        approvalStatus: version.approvalStatus,
        approvedAt: version.approvedAt,
        approvalNotes: version.approvalNotes,
        createdAt: version.createdAt,
        updatedAt: version.updatedAt
      }));
    } catch (error) {
      logger.error('Failed to get assumption versions:', error);
      throw error;
    }
  }

  async getSecurityAuditLog(
    businessAccountId: string,
    filters?: {
      eventType?: string;
      eventSeverity?: string;
      startDate?: string;
      endDate?: string;
      userId?: string;
      limit?: number
    }
  ): Promise<SecurityAuditEvent[]> {
    try {
      const whereClause = ['business_account_id = $1'];
      const params = [businessAccountId];

      if (filters?.eventType) {
        whereClause.push('event_type = $' + (params.length + 1));
        params.push(filters.eventType);
      }

      if (filters?.eventSeverity) {
        whereClause.push('event_severity = $' + (params.length + 1));
        params.push(filters.eventSeverity);
      }

      if (filters?.startDate) {
        whereClause.push('created_at >= $' + (params.length + 1));
        params.push(filters.startDate);
      }

      if (filters?.endDate) {
        whereClause.push('created_at <= $' + (params.length + 1));
        params.push(filters.endDate);
      }

      if (filters?.userId) {
        whereClause.push('user_id = $' + (params.length + 1));
        params.push(filters.userId);
      }

      if (filters?.limit) {
        whereClause.push('LIMIT $' + (params.length + 1));
        params.push(filters.limit);
      }

      const events = await this.prisma.$queryRaw`
        SELECT 
          id,
          business_account_id as "businessAccountId",
          event_type as "eventType",
          event_severity as "eventSeverity",
          event_description as "eventDescription",
          user_id as "userId",
          user_role as "userRole",
          ip_address as "ipAddress",
          user_agent as "userAgent",
          old_value as "oldValue",
          new_value as "newValue",
          affected_records as "affectedRecords",
          session_id as "sessionId",
          request_id as "requestId",
          api_endpoint as "apiEndpoint",
          resolution_status as "resolutionStatus",
          resolved_by as "resolvedBy",
          resolved_at as "resolvedAt",
          resolution_notes as "resolutionNotes",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM financial_security_audit
        WHERE ${whereClause.join(' AND ')}
        ORDER BY created_at DESC
      `;

      return events.map((event: any) => ({
        id: event.id,
        businessAccountId: event.businessAccountId,
        eventType: event.eventType,
        eventSeverity: event.eventSeverity,
        eventDescription: event.eventDescription,
        userId: event.userId,
        userRole: event.userRole,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        oldValue: event.oldValue,
        newValue: event.newValue,
        affectedRecords: event.affectedRecords,
        sessionId: event.sessionId,
        requestId: event.requestId,
        apiEndpoint: event.apiEndpoint,
        resolutionStatus: event.resolutionStatus,
        resolvedBy: event.resolvedBy,
        resolvedAt: event.resolvedAt,
        resolutionNotes: event.resolutionNotes,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      }));
    } catch (error) {
      logger.error('Failed to get security audit log:', error);
      throw error;
    }
  }

  async getFinancialRolePermissions(
    businessAccountId: string
  ): Promise<FinancialRolePermission[]> {
    try {
      const permissions = await this.prisma.financialRolePermissions.findMany({
        where: {
          businessAccountId
        },
        orderBy: { createdAt: 'desc' }
      });

      return permissions.map((permission: any) => ({
        id: permission.id,
        businessAccountId: permission.businessAccountId,
        roleName: permission.roleName,
        permissions: permission.permissions,
        isActive: permission.isActive,
        description: permission.description,
        createdBy: permission.createdBy,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt
      }));
    } catch (error) {
      logger.error('Failed to get financial role permissions:', error);
      throw error;
    }
  }

  async refreshSecurityViews(): Promise<void> {
    try {
      await this.prisma.$executeRaw`SELECT refresh_financial_security_views()`;
      logger.info('Financial security views refreshed');
    } catch (error) {
      logger.error('Failed to refresh security views:', error);
      throw error;
    }
  }

  async getFinancialCloseEvents(
    businessAccountId: string,
    filters?: {
      closeType?: string;
      closeStatus?: string;
      fiscalYear?: number;
      limit?: number
    }
  ): Promise<FinancialCloseEvent[]> {
    try {
      const whereClause = ['business_account_id = $1'];
      const params = [businessAccountId];

      if (filters?.closeType) {
        whereClause.push('close_type = $' + (params.length + 1));
        params.push(filters.closeType);
      }

      if (filters?.closeStatus) {
        whereClause.push('close_status = $' + (params.length + 1));
        params.push(filters.closeStatus);
      }

      if (filters?.fiscalYear) {
        whereClause.push('fiscal_year = $' + (params.length + 1));
        params.push(filters.fiscalYear);
      }

      if (filters?.limit) {
        whereClause.push('LIMIT $' + (params.length + 1));
        params.push(filters.limit);
      }

      const events = await this.prisma.$queryRaw`
        SELECT 
          id,
          business_account_id as "businessAccountId",
          close_type as "closeType",
          close_status as "closeStatus",
          fiscal_year as "fiscalYear",
          fiscal_quarter as "fiscalQuarter",
          fiscal_month as "fiscalMonth",
          close_date as "closeDate",
          initiated_by as "initiatedBy",
          completed_by as "completedBy",
          total_revenue as "totalRevenue",
          total_expenses as "totalExpenses",
          net_income as "netIncome",
          total_assets as "totalAssets",
          total_liabilities as "totalLiabilities",
          total_equity as "totalEquity",
          adjusting_entries as "adjustingEntries",
          correction_notes as "correctionNotes",
          close_summary as "closeSummary",
          audit_trail as "auditTrail",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM financial_close_events
        WHERE ${whereClause.join(' AND ')}
        ORDER BY created_at DESC
      `;

      return events.map((event: any) => ({
        id: event.id,
        businessAccountId: event.businessAccountId,
        closeType: event.closeType,
        closeStatus: event.closeStatus,
        fiscalYear: event.fiscalYear,
        fiscalQuarter: event.fiscalQuarter,
        fiscalMonth: event.fiscalMonth,
        closeDate: event.closeDate,
        initiatedBy: event.initiatedBy,
        completedBy: event.completedBy,
        totalRevenue: event.total_revenue,
        totalExpenses: event.total_expenses,
        netIncome: event.net_income,
        totalAssets: event.total_assets,
        totalLiabilities: event.total_liabilities,
        totalEquity: event.total_equity,
        adjustingEntries: event.adjusting_entries,
        correctionNotes: event.correction_notes,
        closeSummary: event.closeSummary,
        auditTrail: event.audit_trail,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt
      }));
    } catch (error) {
      logger.error('Failed to get financial close events:', error);
      throw error;
    }
  }
}
