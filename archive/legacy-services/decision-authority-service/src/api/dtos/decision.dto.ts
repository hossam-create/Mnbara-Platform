import { AssetType, DecisionStatus } from '@prisma/client';

/**
 * Request DTOs - Input validation only
 */

export interface CreateDecisionRequestDto {
  assetType: AssetType;
  assetId: string;
  metadata?: Record<string, any>;
}

export interface ListDecisionsQueryDto {
  assetType?: AssetType;
  assetId?: string;
  status?: DecisionStatus;
  decisionSource?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Response DTOs - Shape only, no transformation
 */

export interface DecisionResponseDto {
  id: number;
  assetType: AssetType;
  assetId: string;
  decisionId: string;
  status: DecisionStatus;
  decisionRef: string | null;
  reason: string | null;
  decisionSource: string;
  requestedAt: Date;
  decidedAt: Date | null;
  expiresAt: Date | null;
  metadata: Record<string, any>;
  auditLogs?: AuditLogResponseDto[];
}

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

export interface ListDecisionsResponseDto {
  decisions: DecisionResponseDto[];
  total: number;
  limit: number;
  offset: number;
}

export interface ErrorResponseDto {
  error: string;
  message: string;
  statusCode: number;
}
