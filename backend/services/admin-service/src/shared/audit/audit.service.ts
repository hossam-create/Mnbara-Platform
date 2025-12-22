import { PrismaClient, AuditAction, AuditSeverity, UserRole } from '@prisma/client';

export interface AuditLogData {
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

export class AuditService {
  private static prisma: PrismaClient;

  static initialize(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  static async log(data: AuditLogData): Promise<void> {
    if (!this.prisma) {
      throw new Error('AuditService not initialized. Call initialize() first.');
    }

    try {
      await this.prisma.auditLog.create({
        data: {
          action: data.action,
          description: data.description,
          actorId: data.actorId,
          actorEmail: data.actorEmail,
          actorRole: data.actorRole,
          actorIp: data.actorIp,
          targetId: data.targetId,
          targetType: data.targetType,
          targetEmail: data.targetEmail,
          severity: data.severity || AuditSeverity.INFO,
          metadata: data.metadata || {},
          userAgent: data.userAgent,
          requestId: data.requestId,
          sessionId: data.sessionId,
          oldValues: data.oldValues || {},
          newValues: data.newValues || {},
          success: data.success ?? true,
          errorMessage: data.errorMessage,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw to avoid breaking the main operation
      // Consider implementing a fallback logging mechanism
    }
  }

  static async queryEvents(filters: {
    action?: AuditAction;
    severity?: AuditSeverity;
    actorId?: number;
    targetId?: number;
    targetType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    if (!this.prisma) {
      throw new Error('AuditService not initialized. Call initialize() first.');
    }

    const {
      action,
      severity,
      actorId,
      targetId,
      targetType,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    const where: any = {};
    
    if (action) where.action = action;
    if (severity) where.severity = severity;
    if (actorId) where.actorId = actorId;
    if (targetId) where.targetId = targetId;
    if (targetType) where.targetType = targetType;
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const skip = (page - 1) * limit;
    
    const [events, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: {
          actor: {
            select: { id: true, email: true, role: true }
          }
        }
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return {
      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Helper methods for common audit actions
  static async logUserLogin(userId: number, userEmail: string, success: boolean, errorMessage?: string, ip?: string, userAgent?: string) {
    await this.log({
      action: AuditAction.USER_LOGIN,
      description: success ? 'User logged in successfully' : 'User login failed',
      actorId: userId,
      actorEmail: userEmail,
      severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
      actorIp: ip,
      userAgent,
      success,
      errorMessage: success ? undefined : errorMessage,
    });
  }

  static async logKycSubmission(userId: number, userEmail: string, status: string, ip?: string) {
    await this.log({
      action: AuditAction.KYC_SUBMISSION,
      description: `KYC submission ${status.toLowerCase()}`,
      actorId: userId,
      actorEmail: userEmail,
      targetId: userId,
      targetType: 'user',
      severity: status === 'APPROVED' ? AuditSeverity.INFO : AuditSeverity.WARNING,
      actorIp: ip,
      metadata: { status },
      success: status === 'APPROVED',
    });
  }

  static async logTripCreation(tripId: number, userId: number, userEmail: string, ip?: string) {
    await this.log({
      action: AuditAction.TRIP_CREATED,
      description: 'User created a new trip',
      actorId: userId,
      actorEmail: userEmail,
      targetId: tripId,
      targetType: 'trip',
      severity: AuditSeverity.INFO,
      actorIp: ip,
      success: true,
    });
  }
}