import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuditLogService } from '../../services/AuditLogService';
import { QueryAuditLogsDto } from '../dtos/audit.dto';
import { mapServiceErrorToHttp } from '../utils/errorMapper';

/**
 * AuditLogController - Thin REST layer
 * 
 * Rules:
 * - NO business logic
 * - NO state transitions
 * - 100% delegation to AuditLogService
 * - Input validation only
 * - Error mapping only
 */
export class AuditLogController {
  private auditLogService: AuditLogService;

  constructor(prisma: PrismaClient) {
    this.auditLogService = new AuditLogService(prisma);
  }

  /**
   * GET /api/v1/audit-logs/decision/:decisionId
   * Get audit logs for a decision
   */
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const decisionId = parseInt(req.params.decisionId, 10);

      const auditLogs = await this.auditLogService.getAuditLogs(decisionId);

      res.status(200).json({ auditLogs });
    } catch (error) {
      const { statusCode, body } = mapServiceErrorToHttp(error);
      res.status(statusCode).json(body);
    }
  }

  /**
   * GET /api/v1/audit-logs
   * Query audit logs with filters
   */
  async queryAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const query: QueryAuditLogsDto = req.query;

      const filters = {
        decisionId: query.decisionId ? parseInt(query.decisionId.toString(), 10) : undefined,
        action: query.action,
        actorId: query.actorId,
        actorType: query.actorType,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        limit: query.limit ? parseInt(query.limit.toString(), 10) : undefined
      };

      const auditLogs = await this.auditLogService.queryAuditLogs(filters);

      res.status(200).json({ auditLogs, total: auditLogs.length });
    } catch (error) {
      const { statusCode, body } = mapServiceErrorToHttp(error);
      res.status(statusCode).json(body);
    }
  }
}
