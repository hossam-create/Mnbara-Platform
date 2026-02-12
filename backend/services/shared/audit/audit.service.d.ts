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
    action: AuditAction;
    description: string;
    actorId?: number;
    actorEmail?: string;
    actorRole?: UserRole;
    actorIp?: string;
    targetId?: number;
    targetType?: string;
    targetEmail?: string;
    severity?: AuditSeverity;
    metadata?: Record<string, any>;
    userAgent?: string;
    requestId?: string;
    sessionId?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    success?: boolean;
    errorMessage?: string;
}
export declare class AuditService {
    private static prisma;
    /**
     * Initialize the audit service with a Prisma client
     */
    static initialize(prisma: PrismaClient): void;
    /**
     * Log an audit event
     */
    static log(input: AuditLogInput): Promise<void>;
    /**
     * Log a user management action
     */
    static logUserAction(action: AuditAction, actorId: number, targetUserId: number, description: string, metadata?: Record<string, any>, actorIp?: string): Promise<void>;
    /**
     * Log a KYC action
     */
    static logKycAction(action: AuditAction, actorId: number, targetUserId: number, description: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Log a dispute action
     */
    static logDisputeAction(action: AuditAction, actorId: number, disputeId: number, description: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Log an escrow action
     */
    static logEscrowAction(action: AuditAction, actorId: number | undefined, escrowId: number, description: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Log a security event
     */
    static logSecurityEvent(action: AuditAction, description: string, metadata?: Record<string, any>, actorIp?: string, actorId?: number): Promise<void>;
    /**
     * Log an authentication event
     */
    static logAuthEvent(action: AuditAction, userId: number | undefined, email: string, success: boolean, actorIp?: string, errorMessage?: string): Promise<void>;
    /**
     * Determine severity based on action type
     */
    private static determineSeverity;
    /**
     * Determine severity for user management actions
     */
    private static getUserActionSeverity;
    /**
     * Query audit logs with filters
     */
    static query(filters: {
        action?: AuditAction;
        actorId?: number;
        targetId?: number;
        targetType?: string;
        severity?: AuditSeverity;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<any>;
}
export default AuditService;
//# sourceMappingURL=audit.service.d.ts.map