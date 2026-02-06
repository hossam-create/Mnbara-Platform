// Security Audit Logging Service
// Service de journalisation d'audit de sécurité

import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { logger, securityLogger } from '../utils/logger';
import { PrismaClient, AuditLogEntry, AuditEventType, ActorType, AuditResult, RiskLevel } from '@prisma/client';

const prisma = new PrismaClient();

export class AuditService {
  /**
   * Log a security event
   */
  async log(entry: AuditLogEntry): Promise<string> {
    const eventId = uuidv4();
    
    try {
      // Determine risk level if not provided
      const riskLevel = entry.riskLevel || this.calculateRiskLevel(entry);

      await prisma.securityAuditLog.create({
        data: {
          eventId,
          eventType: entry.eventType as any,
          eventCategory: entry.eventCategory,
          actorId: entry.actor?.id,
          actorType: entry.actor?.type as any || ActorType.USER,
          actorName: entry.actor?.name,
          actorEmail: entry.actor?.email,
          actorIP: entry.metadata?.ipAddress as string || entry.ipAddress,
          actorUserAgent: entry.metadata?.userAgent as string || entry.userAgent,
          targetId: entry.target?.id,
          targetType: entry.target?.type,
          targetName: entry.target?.name,
          action: entry.action,
          description: entry.description,
          result: entry.result as any,
          resultMessage: entry.metadata?.resultMessage as string,
          riskLevel: riskLevel as any,
          riskScore: entry.metadata?.riskScore as number,
          ipAddress: entry.metadata?.ipAddress as string || entry.ipAddress,
          userAgent: entry.metadata?.userAgent as string || entry.userAgent,
          sessionId: entry.metadata?.sessionId as string,
          requestId: entry.metadata?.requestId as string,
          country: entry.location?.country,
          city: entry.location?.city,
          metadata: entry.metadata as any,
          complianceFlags: entry.metadata?.complianceFlags as string[] || [],
          regulationRefs: entry.metadata?.regulationRefs as string[] || [],
          timestamp: new Date()
        }
      });

      // Log to file for backup
      securityLogger.audit(entry.eventType, {
        eventId,
        actor: entry.actor?.id,
        target: entry.target?.id,
        action: entry.action,
        result: entry.result,
        riskLevel
      });

      // Alert on high/critical events
      if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
        await this.triggerSecurityAlert(entry, eventId);
      }

      return eventId;
    } catch (error) {
      logger.error('Failed to log audit event', { error, entry });
      throw error;
    }
  }

  /**
   * Log from Express request
   */
  async logFromRequest(
    req: Request,
    eventType: AuditEventType,
    action: string,
    description: string,
    result: AuditResult = AuditResult.SUCCESS,
    metadata?: Record<string, unknown>
  ): Promise<string> {
    const entry: AuditLogEntry = {
      eventType,
      eventCategory: this.categorizeEvent(eventType),
      actor: {
        id: (req.user as any)?.id || 'anonymous',
        type: (req.user as any)?.id ? ActorType.USER : ActorType.ANONYMOUS,
        name: (req.user as any)?.name,
        email: (req.user as any)?.email
      },
      action,
      description,
      result,
      riskLevel: this.determineDefaultRisk(eventType),
      metadata: {
        ...metadata,
        ipAddress: this.getClientIP(req),
        userAgent: req.get('User-Agent'),
        sessionId: (req.session as any)?.id,
        requestId: (req as any)?.id
      },
      location: await this.getLocationFromIP(this.getClientIP(req))
    };

    return this.log(entry);
  }

  /**
   * Get audit logs with filtering
   */
  async getLogs(filters: {
    eventType?: AuditEventType;
    actorId?: string;
    targetId?: string;
    riskLevel?: RiskLevel;
    result?: AuditResult;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.targetId) where.targetId = filters.targetId;
    if (filters.riskLevel) where.riskLevel = filters.riskLevel;
    if (filters.result) where.result = filters.result;
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.securityAuditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit
      }),
      prisma.securityAuditLog.count({ where })
    ]);

    return {
      items: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get security dashboard metrics
   */
  async getDashboardMetrics(timeRange: { start: Date; end: Date }) {
    const [
      totalEvents,
      byType,
      byRisk,
      byResult,
      failedLogins,
      accessDenied,
      suspiciousActivity
    ] = await Promise.all([
      prisma.securityAuditLog.count({
        where: { timestamp: { gte: timeRange.start, lte: timeRange.end } }
      }),
      prisma.securityAuditLog.groupBy({
        by: ['eventType'],
        where: { timestamp: { gte: timeRange.start, lte: timeRange.end } },
        _count: true
      }),
      prisma.securityAuditLog.groupBy({
        by: ['riskLevel'],
        where: { timestamp: { gte: timeRange.start, lte: timeRange.end } },
        _count: true
      }),
      prisma.securityAuditLog.groupBy({
        by: ['result'],
        where: { timestamp: { gte: timeRange.start, lte: timeRange.end } },
        _count: true
      }),
      prisma.securityAuditLog.count({
        where: {
          eventType: AuditEventType.LOGIN_FAILURE,
          timestamp: { gte: timeRange.start, lte: timeRange.end }
        }
      }),
      prisma.securityAuditLog.count({
        where: {
          eventType: AuditEventType.ACCESS_DENIED,
          timestamp: { gte: timeRange.start, lte: timeRange.end }
        }
      }),
      prisma.securityAuditLog.count({
        where: {
          eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
          timestamp: { gte: timeRange.start, lte: timeRange.end }
        }
      })
    ]);

    return {
      totalEvents,
      byType: byType.reduce((acc, item) => {
        acc[item.eventType] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byRisk: byRisk.reduce((acc, item) => {
        acc[item.riskLevel] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byResult: byResult.reduce((acc, item) => {
        acc[item.result] = item._count;
        return acc;
      }, {} as Record<string, number>),
      failedLogins,
      accessDenied,
      suspiciousActivity,
      timeRange
    };
  }

  /**
   * Export audit logs
   */
  async exportLogs(filters: {
    startDate: Date;
    endDate: Date;
    format: 'json' | 'csv';
    eventTypes?: AuditEventType[];
  }) {
    const where: any = {
      timestamp: {
        gte: filters.startDate,
        lte: filters.endDate
      }
    };

    if (filters.eventTypes?.length) {
      where.eventType = { in: filters.eventTypes };
    }

    const logs = await prisma.securityAuditLog.findMany({
      where,
      orderBy: { timestamp: 'asc' }
    });

    if (filters.format === 'csv') {
      return this.convertToCSV(logs);
    }

    return logs;
  }

  /**
   * Get compliance report
   */
  async getComplianceReport(regulation: string) {
    // Filter logs relevant to specific compliance frameworks
    const relevantEvents = await prisma.securityAuditLog.findMany({
      where: {
        OR: [
          { complianceFlags: { has: regulation } },
          { regulationRefs: { has: regulation } }
        ]
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    return {
      regulation,
      totalRelevantEvents: relevantEvents.length,
      events: relevantEvents,
      generatedAt: new Date()
    };
  }

  // Private helper methods

  private calculateRiskLevel(entry: AuditLogEntry): RiskLevel {
    // Map event types to risk levels
    const highRiskEvents = [
      AuditEventType.SUSPICIOUS_ACTIVITY,
      AuditEventType.BRUTE_FORCE_DETECTED,
      AuditEventType.INTRUSION_ATTEMPT,
      AuditEventType.FIREWALL_BLOCK,
      AuditEventType.DATA_EXPORT,
      AuditEventType.CONFIG_CHANGE
    ];

    const mediumRiskEvents = [
      AuditEventType.LOGIN_FAILURE,
      AuditEventType.ACCESS_DENIED,
      AuditEventType.PERMISSION_CHANGE,
      AuditEventType.ROLE_ASSIGN,
      AuditEventType.API_KEY_CREATE,
      AuditEventType.USER_DELETE
    ];

    if (highRiskEvents.includes(entry.eventType)) return RiskLevel.HIGH;
    if (mediumRiskEvents.includes(entry.eventType)) return RiskLevel.MEDIUM;
    if (entry.result === AuditResult.ERROR) return RiskLevel.MEDIUM;
    if (entry.result === AuditResult.DENIED) return RiskLevel.LOW;

    return RiskLevel.LOW;
  }

  private categorizeEvent(eventType: AuditEventType): string {
    if (eventType.startsWith('LOGIN') || eventType.startsWith('LOGOUT')) return 'Authentication';
    if (eventType.startsWith('ACCESS') || eventType.startsWith('PERMISSION') || eventType.startsWith('ROLE')) return 'Authorization';
    if (eventType.startsWith('DATA')) return 'Data Access';
    if (eventType.startsWith('SECURITY') || eventType.startsWith('BRUTE') || eventType.startsWith('SUSPICIOUS')) return 'Security Monitoring';
    if (eventType.startsWith('CONFIG') || eventType.startsWith('USER') || eventType.startsWith('API')) return 'System Changes';
    if (eventType.startsWith('SCAN') || eventType.startsWith('VULNERABILITY') || eventType.startsWith('PATCH')) return 'Security Operations';
    return 'Other';
  }

  private determineDefaultRisk(eventType: AuditEventType): RiskLevel {
    const event = AuditEventType[eventType as keyof typeof AuditEventType];
    return this.calculateRiskLevel({
      eventType: event,
      eventCategory: '',
      actor: { id: '', type: ActorType.USER },
      action: '',
      description: '',
      result: AuditResult.SUCCESS,
      riskLevel: RiskLevel.LOW
    });
  }

  private async triggerSecurityAlert(entry: AuditLogEntry, eventId: string): Promise<void> {
    // TODO: Send webhook, email, or other notifications
    securityLogger.alert('Security alert triggered', {
      eventId,
      eventType: entry.eventType,
      actor: entry.actor?.id,
      action: entry.action
    });
  }

  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           (req.headers['x-real-ip'] as string) ||
           req.socket?.remoteAddress ||
           '';
  }

  private async getLocationFromIP(ip: string): Promise<{ country?: string; city?: string } | undefined> {
    // TODO: Implement IP geolocation lookup
    return undefined;
  }

  private convertToCSV(logs: any[]): string {
    if (logs.length === 0) return '';

    const headers = Object.keys(logs[0]);
    const csvRows = [headers.join(',')];

    for (const log of logs) {
      const values = headers.map(header => {
        const value = log[header];
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value ?? '');
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}

export const auditService = new AuditService();
