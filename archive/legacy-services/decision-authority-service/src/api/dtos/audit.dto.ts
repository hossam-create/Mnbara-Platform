import { DecisionStatus } from '@prisma/client';

/**
 * Request DTOs - Input validation only
 */

export interface QueryAuditLogsDto {
  decisionId?: number;
  action?: string;
  actorId?: string;
  actorType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

/**
 * Response DTOs - Shape only, no transformation
 */

export interface AuditLogResponseDto {
  id: number;
  decisionId: number;
  action: string;
  previousStatus: DecisionStatus | null;
  newStatus: DecisionStatus | null;
  actorId: string;
  actorType: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface ListAuditLogsResponseDto {
  auditLogs: AuditLogResponseDto[];
  total: number;
}
