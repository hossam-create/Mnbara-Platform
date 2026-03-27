/**
 * AdminRuleResultsService - Admin UI for Rule Results
 * SECURITY-CRITICAL: Bank-facing infrastructure
 * 
 * ABSOLUTE RULES:
 * - Admin can SEE flags (read-only)
 * - Admin can ACKNOWLEDGE flags (audit trail)
 * - Admin can OVERRIDE flags (audit trail)
 * - NO auto-execution (manual review only)
 * - All actions logged (APPEND-ONLY)
 */

import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Flag status
 */
export enum FlagStatus {
  PENDING = 'PENDING',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  OVERRIDDEN = 'OVERRIDDEN',
  RESOLVED = 'RESOLVED',
}

/**
 * Override action
 */
export enum OverrideAction {
  DISMISS = 'DISMISS',
  ESCALATE = 'ESCALATE',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
}

/**
 * Audit action
 */
export enum AuditAction {
  CREATED = 'CREATED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  OVERRIDDEN = 'OVERRIDDEN',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
}

/**
 * Rule flag
 */
export interface RuleFlag {
  flag_id: string;
  rule_id: string;
  rule_name: string;
  output_type: string;
  severity: string;
  reason: string;
  user_id?: string;
  actor_type?: string;
  auction_id?: string;
  traveler_id?: string;
  status: FlagStatus;
  created_at: Date;
}

/**
 * Flag acknowledgment
 */
export interface FlagAcknowledgment {
  acknowledgment_id: string;
  flag_id: string;
  acknowledged_by: string;
  acknowledged_at: Date;
  notes?: string;
}

/**
 * Flag override
 */
export interface FlagOverride {
  override_id: string;
  flag_id: string;
  override_action: OverrideAction;
  override_reason: string;
  overridden_by: string;
  overridden_at: Date;
  requires_approval: boolean;
  approved_by?: string;
  approved_at?: Date;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  audit_id: string;
  flag_id: string;
  action: AuditAction;
  actor_id: string;
  actor_type: string;
  details?: Record<string, any>;
  created_at: Date;
}

/**
 * Simple logger for Express environment
 */
class Logger {
  constructor(private context: string) {}

  debug(message: string) {
    console.debug(`[${this.context}] ${message}`);
  }

  info(message: string) {
    console.info(`[${this.context}] ${message}`);
  }

  error(message: string) {
    console.error(`[${this.context}] ${message}`);
  }
}

/**
 * AdminRuleResultsService - Manages rule flags for admin UI
 */
export class AdminRuleResultsService {
  private readonly logger = new Logger(AdminRuleResultsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all pending flags
   * 
   * @param limit - Maximum number of flags to return
   * @param offset - Offset for pagination
   * @returns Array of pending flags
   */
  async getPendingFlags(limit: number = 50, offset: number = 0): Promise<RuleFlag[]> {
    try {
      this.logger.info(`Getting pending flags (limit: ${limit}, offset: ${offset})`);

      const flags = await this.prisma.ruleFlag.findMany({
        where: { status: FlagStatus.PENDING },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      });

      return flags;
    } catch (error) {
      this.logger.error(`Failed to get pending flags: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get flags for a user
   * 
   * @param userId - User ID
   * @param limit - Maximum number of flags to return
   * @returns Array of flags for user
   */
  async getUserFlags(userId: string, limit: number = 50): Promise<RuleFlag[]> {
    try {
      this.logger.info(`Getting flags for user: ${userId}`);

      const flags = await this.prisma.ruleFlag.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: limit,
      });

      return flags;
    } catch (error) {
      this.logger.error(`Failed to get user flags: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get flags for an auction
   * 
   * @param auctionId - Auction ID
   * @param limit - Maximum number of flags to return
   * @returns Array of flags for auction
   */
  async getAuctionFlags(auctionId: string, limit: number = 50): Promise<RuleFlag[]> {
    try {
      this.logger.info(`Getting flags for auction: ${auctionId}`);

      const flags = await this.prisma.ruleFlag.findMany({
        where: { auction_id: auctionId },
        orderBy: { created_at: 'desc' },
        take: limit,
      });

      return flags;
    } catch (error) {
      this.logger.error(`Failed to get auction flags: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get flags by status
   * 
   * @param status - Flag status
   * @param limit - Maximum number of flags to return
   * @returns Array of flags with given status
   */
  async getFlagsByStatus(status: FlagStatus, limit: number = 50): Promise<RuleFlag[]> {
    try {
      this.logger.info(`Getting flags with status: ${status}`);

      const flags = await this.prisma.ruleFlag.findMany({
        where: { status },
        orderBy: { created_at: 'desc' },
        take: limit,
      });

      return flags;
    } catch (error) {
      this.logger.error(`Failed to get flags by status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get flags by severity
   * 
   * @param severity - Severity level
   * @param limit - Maximum number of flags to return
   * @returns Array of flags with given severity
   */
  async getFlagsBySeverity(severity: string, limit: number = 50): Promise<RuleFlag[]> {
    try {
      this.logger.info(`Getting flags with severity: ${severity}`);

      const flags = await this.prisma.ruleFlag.findMany({
        where: { severity },
        orderBy: { created_at: 'desc' },
        take: limit,
      });

      return flags;
    } catch (error) {
      this.logger.error(`Failed to get flags by severity: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get flag details
   * 
   * @param flagId - Flag ID
   * @returns Flag details with acknowledgments and overrides
   */
  async getFlagDetails(flagId: string): Promise<any> {
    try {
      this.logger.info(`Getting flag details: ${flagId}`);

      const flag = await this.prisma.ruleFlag.findUnique({
        where: { flag_id: flagId },
      });

      if (!flag) {
        throw new Error(`Flag not found: ${flagId}`);
      }

      const acknowledgments = await this.prisma.ruleFlagAcknowledgment.findMany({
        where: { flag_id: flagId },
        orderBy: { acknowledged_at: 'desc' },
      });

      const overrides = await this.prisma.ruleFlagOverride.findMany({
        where: { flag_id: flagId },
        orderBy: { overridden_at: 'desc' },
      });

      const auditLogs = await this.prisma.ruleFlagAuditLog.findMany({
        where: { flag_id: flagId },
        orderBy: { created_at: 'asc' },
      });

      return {
        flag,
        acknowledgments,
        overrides,
        auditLogs,
      };
    } catch (error) {
      this.logger.error(`Failed to get flag details: ${error.message}`);
      throw error;
    }
  }

  /**
   * Acknowledge a flag
   * 
   * @param flagId - Flag ID
   * @param adminUserId - Admin user ID
   * @param notes - Optional notes
   * @returns Acknowledgment record
   */
  async acknowledgeFlag(
    flagId: string,
    adminUserId: string,
    notes?: string
  ): Promise<FlagAcknowledgment> {
    try {
      this.logger.info(`Acknowledging flag: ${flagId} by admin: ${adminUserId}`);

      // Verify flag exists
      const flag = await this.prisma.ruleFlag.findUnique({
        where: { flag_id: flagId },
      });

      if (!flag) {
        throw new Error(`Flag not found: ${flagId}`);
      }

      // Create acknowledgment
      const acknowledgment = await this.prisma.ruleFlagAcknowledgment.create({
        data: {
          acknowledgment_id: uuidv4(),
          flag_id: flagId,
          acknowledged_by: adminUserId,
          notes,
        },
      });

      // Update flag status
      await this.prisma.ruleFlag.update({
        where: { flag_id: flagId },
        data: { status: FlagStatus.ACKNOWLEDGED },
      });

      // Create audit log
      await this.createAuditLog(
        flagId,
        AuditAction.ACKNOWLEDGED,
        adminUserId,
        'ADMIN',
        { notes }
      );

      this.logger.info(`Flag acknowledged: ${flagId}`);

      return acknowledgment;
    } catch (error) {
      this.logger.error(`Failed to acknowledge flag: ${error.message}`);
      throw error;
    }
  }

  /**
   * Override a flag
   * 
   * @param flagId - Flag ID
   * @param adminUserId - Admin user ID
   * @param action - Override action
   * @param reason - Override reason
   * @param requiresApproval - Whether override requires approval
   * @returns Override record
   */
  async overrideFlag(
    flagId: string,
    adminUserId: string,
    action: OverrideAction,
    reason: string,
    requiresApproval: boolean = false
  ): Promise<FlagOverride> {
    try {
      this.logger.info(
        `Overriding flag: ${flagId} by admin: ${adminUserId} with action: ${action}`
      );

      // Verify flag exists
      const flag = await this.prisma.ruleFlag.findUnique({
        where: { flag_id: flagId },
      });

      if (!flag) {
        throw new Error(`Flag not found: ${flagId}`);
      }

      // Create override
      const override = await this.prisma.ruleFlagOverride.create({
        data: {
          override_id: uuidv4(),
          flag_id: flagId,
          override_action: action,
          override_reason: reason,
          overridden_by: adminUserId,
          requires_approval: requiresApproval,
        },
      });

      // Update flag status
      await this.prisma.ruleFlag.update({
        where: { flag_id: flagId },
        data: { status: FlagStatus.OVERRIDDEN },
      });

      // Create audit log
      await this.createAuditLog(
        flagId,
        AuditAction.OVERRIDDEN,
        adminUserId,
        'ADMIN',
        { action, reason, requiresApproval }
      );

      this.logger.info(`Flag overridden: ${flagId}`);

      return override;
    } catch (error) {
      this.logger.error(`Failed to override flag: ${error.message}`);
      throw error;
    }
  }

  /**
   * Approve an override
   * 
   * @param overrideId - Override ID
   * @param adminUserId - Admin user ID (approver)
   * @returns Updated override record
   */
  async approveOverride(overrideId: string, adminUserId: string): Promise<FlagOverride> {
    try {
      this.logger.info(`Approving override: ${overrideId} by admin: ${adminUserId}`);

      // Get override
      const override = await this.prisma.ruleFlagOverride.findUnique({
        where: { override_id: overrideId },
      });

      if (!override) {
        throw new Error(`Override not found: ${overrideId}`);
      }

      if (!override.requires_approval) {
        throw new Error(`Override does not require approval: ${overrideId}`);
      }

      if (override.approved_by) {
        throw new Error(`Override already approved: ${overrideId}`);
      }

      // Update override with approval
      const updated = await this.prisma.ruleFlagOverride.update({
        where: { override_id: overrideId },
        data: {
          approved_by: adminUserId,
          approved_at: new Date(),
        },
      });

      // Create audit log
      await this.createAuditLog(
        override.flag_id,
        AuditAction.ESCALATED,
        adminUserId,
        'ADMIN',
        { overrideId, action: 'APPROVED' }
      );

      this.logger.info(`Override approved: ${overrideId}`);

      return updated;
    } catch (error) {
      this.logger.error(`Failed to approve override: ${error.message}`);
      throw error;
    }
  }

  /**
   * Resolve a flag
   * 
   * @param flagId - Flag ID
   * @param adminUserId - Admin user ID
   * @returns Updated flag
   */
  async resolveFlag(flagId: string, adminUserId: string): Promise<RuleFlag> {
    try {
      this.logger.info(`Resolving flag: ${flagId} by admin: ${adminUserId}`);

      // Verify flag exists
      const flag = await this.prisma.ruleFlag.findUnique({
        where: { flag_id: flagId },
      });

      if (!flag) {
        throw new Error(`Flag not found: ${flagId}`);
      }

      // Update flag status
      const updated = await this.prisma.ruleFlag.update({
        where: { flag_id: flagId },
        data: { status: FlagStatus.RESOLVED },
      });

      // Create audit log
      await this.createAuditLog(
        flagId,
        AuditAction.RESOLVED,
        adminUserId,
        'ADMIN',
        {}
      );

      this.logger.info(`Flag resolved: ${flagId}`);

      return updated;
    } catch (error) {
      this.logger.error(`Failed to resolve flag: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get audit logs for a flag
   * 
   * @param flagId - Flag ID
   * @returns Array of audit logs
   */
  async getAuditLogs(flagId: string): Promise<AuditLogEntry[]> {
    try {
      this.logger.info(`Getting audit logs for flag: ${flagId}`);

      const logs = await this.prisma.ruleFlagAuditLog.findMany({
        where: { flag_id: flagId },
        orderBy: { created_at: 'asc' },
      });

      return logs;
    } catch (error) {
      this.logger.error(`Failed to get audit logs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get statistics
   * 
   * @param timeWindowMinutes - Time window for statistics
   * @returns Statistics
   */
  async getStatistics(timeWindowMinutes: number = 1440): Promise<any> {
    try {
      const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

      const [
        totalFlags,
        pendingFlags,
        acknowledgedFlags,
        overriddenFlags,
        resolvedFlags,
        flagsBySeverity,
        flagsByOutputType,
      ] = await Promise.all([
        this.prisma.ruleFlag.count({
          where: { created_at: { gte: since } },
        }),
        this.prisma.ruleFlag.count({
          where: {
            created_at: { gte: since },
            status: FlagStatus.PENDING,
          },
        }),
        this.prisma.ruleFlag.count({
          where: {
            created_at: { gte: since },
            status: FlagStatus.ACKNOWLEDGED,
          },
        }),
        this.prisma.ruleFlag.count({
          where: {
            created_at: { gte: since },
            status: FlagStatus.OVERRIDDEN,
          },
        }),
        this.prisma.ruleFlag.count({
          where: {
            created_at: { gte: since },
            status: FlagStatus.RESOLVED,
          },
        }),
        this.prisma.ruleFlag.groupBy({
          by: ['severity'],
          where: { created_at: { gte: since } },
          _count: true,
        }),
        this.prisma.ruleFlag.groupBy({
          by: ['output_type'],
          where: { created_at: { gte: since } },
          _count: true,
        }),
      ]);

      return {
        time_window_minutes: timeWindowMinutes,
        total_flags: totalFlags,
        pending_flags: pendingFlags,
        acknowledged_flags: acknowledgedFlags,
        overridden_flags: overriddenFlags,
        resolved_flags: resolvedFlags,
        flags_by_severity: flagsBySeverity,
        flags_by_output_type: flagsByOutputType,
        since,
      };
    } catch (error) {
      this.logger.error(`Failed to get statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create audit log entry (APPEND-ONLY)
   * 
   * @param flagId - Flag ID
   * @param action - Audit action
   * @param actorId - Actor ID
   * @param actorType - Actor type
   * @param details - Additional details
   */
  private async createAuditLog(
    flagId: string,
    action: AuditAction,
    actorId: string,
    actorType: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await this.prisma.ruleFlagAuditLog.create({
        data: {
          audit_id: uuidv4(),
          flag_id: flagId,
          action,
          actor_id: actorId,
          actor_type: actorType,
          details: details || {},
        },
      });

      this.logger.debug(`Audit log created for flag: ${flagId}, action: ${action}`);
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`);
      throw error;
    }
  }
}
