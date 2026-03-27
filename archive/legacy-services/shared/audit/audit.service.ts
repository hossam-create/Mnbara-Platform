import { PrismaClient, AuditAction, AuditSeverity, UserRole } from '@prisma/client';

/**
 * Audit Log Service
 * 
 * Provides centralized audit logging functionality for tracking all important
 * system actions, security events, and compliance-related activities.
 * 
 * Usage:
 * ```typescript
 * await AuditService.log({
 *   action: AuditAction.USER_SUSPENDED,
 *   actorId: adminUser.id,
 *   targetId: suspendedUser.id,
 *   description: 'User suspended for policy violation',
 *   metadata: { reason: 'spam', duration: '30d' }
 * });
 * ```
 */

export interface AuditLogInput {
  // Required fields
  action: AuditAction;
  description: string;
  
  // Actor information
  actorId?: number;
  actorEmail?: string;
  actorRole?: UserRole;
  actorIp?: string;
  
  // Target information
  targetId?: number;
  targetType?: string;
  targetEmail?: string;
  
  // Context
  severity?: AuditSeverity;
  metadata?: Record<string, any>;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
  
  // Changes (for update actions)
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  
  // Result
  success?: boolean;
  errorMessage?: string;
}

export class AuditService {
  private static prisma: PrismaClient;
  
  /**
   * Initialize the audit service with a Prisma client
   */
  static initialize(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  
  /**
   * Log an audit event
   */
  static async log(input: AuditLogInput): Promise<void> {
    try {
      if (!this.prisma) {
        console.error('AuditService not initialized. Call AuditService.initialize(prisma) first.');
        return;
      }
      
      await this.prisma.auditLog.create({
        data: {
          action: input.action,
          severity: input.severity || this.determineSeverity(input.action),
          actorId: input.actorId,
          actorEmail: input.actorEmail,
          actorRole: input.actorRole,
          actorIp: input.actorIp,
          targetId: input.targetId,
          targetType: input.targetType,
          targetEmail: input.targetEmail,
          description: input.description,
          metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
          userAgent: input.userAgent,
          requestId: input.requestId,
          sessionId: input.sessionId,
          oldValues: input.oldValues ? JSON.parse(JSON.stringify(input.oldValues)) : undefined,
          newValues: input.newValues ? JSON.parse(JSON.stringify(input.newValues)) : undefined,
          success: input.success !== undefined ? input.success : true,
          errorMessage: input.errorMessage,
        },
      });
    } catch (error) {
      // Never throw errors from audit logging to avoid breaking main application flow
      console.error('Failed to create audit log:', error);
    }
  }
  
  /**
   * Log a user management action
   */
  static async logUserAction(
    action: AuditAction,
    actorId: number,
    targetUserId: number,
    description: string,
    metadata?: Record<string, any>,
    actorIp?: string
  ): Promise<void> {
    await this.log({
      action,
      actorId,
      targetId: targetUserId,
      targetType: 'User',
      description,
      metadata,
      actorIp,
      severity: this.getUserActionSeverity(action),
    });
  }
  
  /**
   * Log a KYC action
   */
  static async logKycAction(
    action: AuditAction,
    actorId: number,
    targetUserId: number,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action,
      actorId,
      targetId: targetUserId,
      targetType: 'KycVerification',
      description,
      metadata,
      severity: AuditSeverity.INFO,
    });
  }
  
  /**
   * Log a dispute action
   */
  static async logDisputeAction(
    action: AuditAction,
    actorId: number,
    disputeId: number,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action,
      actorId,
      targetId: disputeId,
      targetType: 'Dispute',
      description,
      metadata,
      severity: AuditSeverity.WARNING,
    });
  }
  
  /**
   * Log an escrow action
   */
  static async logEscrowAction(
    action: AuditAction,
    actorId: number | undefined,
    escrowId: number,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action,
      actorId,
      targetId: escrowId,
      targetType: 'Escrow',
      description,
      metadata,
      severity: AuditSeverity.INFO,
    });
  }
  
  /**
   * Log a security event
   */
  static async logSecurityEvent(
    action: AuditAction,
    description: string,
    metadata?: Record<string, any>,
    actorIp?: string,
    actorId?: number
  ): Promise<void> {
    await this.log({
      action,
      actorId,
      actorIp,
      description,
      metadata,
      severity: AuditSeverity.CRITICAL,
    });
  }
  
  /**
   * Log an authentication event
   */
  static async logAuthEvent(
    action: AuditAction,
    userId: number | undefined,
    email: string,
    success: boolean,
    actorIp?: string,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      action,
      actorId: userId,
      actorEmail: email,
      description: success 
        ? `${action} successful for ${email}`
        : `${action} failed for ${email}`,
      success,
      errorMessage,
      actorIp,
      severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
    });
  }
  
  /**
   * Determine severity based on action type
   */
  private static determineSeverity(action: AuditAction): AuditSeverity {
    const criticalActions = [
      AuditAction.USER_BANNED,
      AuditAction.USER_DELETED,
      AuditAction.SUSPICIOUS_ACTIVITY_DETECTED,
      AuditAction.ACCOUNT_LOCKED,
      AuditAction.IP_BLOCKED,
      AuditAction.DATA_DELETION_COMPLETED,
    ];
    
    const warningActions = [
      AuditAction.USER_SUSPENDED,
      AuditAction.LOGIN_FAILED,
      AuditAction.KYC_REJECTED,
      AuditAction.DISPUTE_CREATED,
      AuditAction.TRANSACTION_FAILED,
      AuditAction.WITHDRAWAL_REJECTED,
    ];
    
    const errorActions = [
      AuditAction.TRANSACTION_FAILED,
    ];
    
    if (criticalActions.includes(action)) {
      return AuditSeverity.CRITICAL;
    } else if (errorActions.includes(action)) {
      return AuditSeverity.ERROR;
    } else if (warningActions.includes(action)) {
      return AuditSeverity.WARNING;
    }
    
    return AuditSeverity.INFO;
  }
  
  /**
   * Determine severity for user management actions
   */
  private static getUserActionSeverity(action: AuditAction): AuditSeverity {
    switch (action) {
      case AuditAction.USER_BANNED:
      case AuditAction.USER_DELETED:
        return AuditSeverity.CRITICAL;
      case AuditAction.USER_SUSPENDED:
        return AuditSeverity.WARNING;
      default:
        return AuditSeverity.INFO;
    }
  }
  
  /**
   * Query audit logs with filters
   */
  static async query(filters: {
    action?: AuditAction;
    actorId?: number;
    targetId?: number;
    targetType?: string;
    severity?: AuditSeverity;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    if (!this.prisma) {
      throw new Error('AuditService not initialized');
    }
    
    const where: any = {};
    
    if (filters.action) where.action = filters.action;
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.targetId) where.targetId = filters.targetId;
    if (filters.targetType) where.targetType = filters.targetType;
    if (filters.severity) where.severity = filters.severity;
    
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }
    
    return await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });
  }
}

export default AuditService;
