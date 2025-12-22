import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from '../../../shared/audit/audit.service';
import { PrismaClient, AuditAction, AuditSeverity } from '@prisma/client';

interface AuditEventRequest {
  action: AuditAction;
  description: string;
  actorId?: number;
  actorEmail?: string;
  actorRole?: string;
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

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
    AuditService.initialize(this.prisma);
  }

  /**
   * POST /api/audit/event
   * Log an audit event
   */
  @Post('event')
  async logEvent(@Body() eventData: AuditEventRequest) {
    try {
      await AuditService.log({
        action: eventData.action,
        description: eventData.description,
        actorId: eventData.actorId,
        actorEmail: eventData.actorEmail,
        actorRole: eventData.actorRole as any,
        actorIp: eventData.actorIp,
        targetId: eventData.targetId,
        targetType: eventData.targetType,
        targetEmail: eventData.targetEmail,
        severity: eventData.severity,
        metadata: eventData.metadata,
        userAgent: eventData.userAgent,
        requestId: eventData.requestId,
        sessionId: eventData.sessionId,
        oldValues: eventData.oldValues,
        newValues: eventData.newValues,
        success: eventData.success,
        errorMessage: eventData.errorMessage,
      });

      return { 
        success: true, 
        message: 'Audit event logged successfully' 
      };
    } catch (error) {
      console.error('Failed to log audit event:', error);
      return { 
        success: false, 
        message: 'Failed to log audit event',
        error: error.message 
      };
    }
  }

  /**
   * GET /api/audit/events
   * Query audit events with filters
   */
  @Get('events')
  async getEvents(
    @Query('action') action?: AuditAction,
    @Query('severity') severity?: AuditSeverity,
    @Query('actorId') actorId?: number,
    @Query('targetId') targetId?: number,
    @Query('targetType') targetType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50
  ) {
    try {
      const where: any = {};
      
      if (action) where.action = action;
      if (severity) where.severity = severity;
      if (actorId) where.actorId = actorId;
      if (targetId) where.targetId = targetId;
      if (targetType) where.targetType = targetType;
      
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;
      
      const [events, total] = await Promise.all([
        AuditService['prisma'].auditLog.findMany({
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
        AuditService['prisma'].auditLog.count({ where })
      ]);

      return {
        success: true,
        data: events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Failed to fetch audit events:', error);
      return { 
        success: false, 
        message: 'Failed to fetch audit events',
        error: error.message 
      };
    }
  }
}