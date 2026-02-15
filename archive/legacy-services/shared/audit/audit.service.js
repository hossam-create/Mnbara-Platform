"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const client_1 = require("@prisma/client");
class AuditService {
    /**
     * Initialize the audit service with a Prisma client
     */
    static initialize(prisma) {
        this.prisma = prisma;
    }
    /**
     * Log an audit event
     */
    static async log(input) {
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
        }
        catch (error) {
            // Never throw errors from audit logging to avoid breaking main application flow
            console.error('Failed to create audit log:', error);
        }
    }
    /**
     * Log a user management action
     */
    static async logUserAction(action, actorId, targetUserId, description, metadata, actorIp) {
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
    static async logKycAction(action, actorId, targetUserId, description, metadata) {
        await this.log({
            action,
            actorId,
            targetId: targetUserId,
            targetType: 'KycVerification',
            description,
            metadata,
            severity: client_1.AuditSeverity.INFO,
        });
    }
    /**
     * Log a dispute action
     */
    static async logDisputeAction(action, actorId, disputeId, description, metadata) {
        await this.log({
            action,
            actorId,
            targetId: disputeId,
            targetType: 'Dispute',
            description,
            metadata,
            severity: client_1.AuditSeverity.WARNING,
        });
    }
    /**
     * Log an escrow action
     */
    static async logEscrowAction(action, actorId, escrowId, description, metadata) {
        await this.log({
            action,
            actorId,
            targetId: escrowId,
            targetType: 'Escrow',
            description,
            metadata,
            severity: client_1.AuditSeverity.INFO,
        });
    }
    /**
     * Log a security event
     */
    static async logSecurityEvent(action, description, metadata, actorIp, actorId) {
        await this.log({
            action,
            actorId,
            actorIp,
            description,
            metadata,
            severity: client_1.AuditSeverity.CRITICAL,
        });
    }
    /**
     * Log an authentication event
     */
    static async logAuthEvent(action, userId, email, success, actorIp, errorMessage) {
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
            severity: success ? client_1.AuditSeverity.INFO : client_1.AuditSeverity.WARNING,
        });
    }
    /**
     * Determine severity based on action type
     */
    static determineSeverity(action) {
        const criticalActions = [
            client_1.AuditAction.USER_BANNED,
            client_1.AuditAction.USER_DELETED,
            client_1.AuditAction.SUSPICIOUS_ACTIVITY_DETECTED,
            client_1.AuditAction.ACCOUNT_LOCKED,
            client_1.AuditAction.IP_BLOCKED,
            client_1.AuditAction.DATA_DELETION_COMPLETED,
        ];
        const warningActions = [
            client_1.AuditAction.USER_SUSPENDED,
            client_1.AuditAction.LOGIN_FAILED,
            client_1.AuditAction.KYC_REJECTED,
            client_1.AuditAction.DISPUTE_CREATED,
            client_1.AuditAction.TRANSACTION_FAILED,
            client_1.AuditAction.WITHDRAWAL_REJECTED,
        ];
        const errorActions = [
            client_1.AuditAction.TRANSACTION_FAILED,
        ];
        if (criticalActions.includes(action)) {
            return client_1.AuditSeverity.CRITICAL;
        }
        else if (errorActions.includes(action)) {
            return client_1.AuditSeverity.ERROR;
        }
        else if (warningActions.includes(action)) {
            return client_1.AuditSeverity.WARNING;
        }
        return client_1.AuditSeverity.INFO;
    }
    /**
     * Determine severity for user management actions
     */
    static getUserActionSeverity(action) {
        switch (action) {
            case client_1.AuditAction.USER_BANNED:
            case client_1.AuditAction.USER_DELETED:
                return client_1.AuditSeverity.CRITICAL;
            case client_1.AuditAction.USER_SUSPENDED:
                return client_1.AuditSeverity.WARNING;
            default:
                return client_1.AuditSeverity.INFO;
        }
    }
    /**
     * Query audit logs with filters
     */
    static async query(filters) {
        if (!this.prisma) {
            throw new Error('AuditService not initialized');
        }
        const where = {};
        if (filters.action)
            where.action = filters.action;
        if (filters.actorId)
            where.actorId = filters.actorId;
        if (filters.targetId)
            where.targetId = filters.targetId;
        if (filters.targetType)
            where.targetType = filters.targetType;
        if (filters.severity)
            where.severity = filters.severity;
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate)
                where.createdAt.gte = filters.startDate;
            if (filters.endDate)
                where.createdAt.lte = filters.endDate;
        }
        return await this.prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: filters.limit || 100,
            skip: filters.offset || 0,
        });
    }
}
exports.AuditService = AuditService;
exports.default = AuditService;
//# sourceMappingURL=audit.service.js.map