import { PrismaClient, AssetType, DecisionStatus } from '@prisma/client';
import { DecisionSourceFactory } from '../sources/DecisionSourceFactory';
import { AuditLogService } from './AuditLogService';
import { 
  DecisionNotFoundError, 
  InvalidDecisionStateError, 
  ValidationError,
  DecisionSourceError 
} from '../utils/errors';
import { DecisionRequest, DecisionResponse } from '../interfaces/IDecisionSource';

/**
 * DecisionAuthorityService - Core business logic for decision management
 * 
 * Responsibilities:
 * - Request decisions from configured source
 * - Persist decisions to database
 * - Manage decision state machine
 * - Validate state transitions
 * - Query decisions
 * 
 * State Machine Rules:
 * - PENDING → APPROVED (from Decision Source only)
 * - PENDING → REJECTED (from Decision Source only)
 * - PENDING → EXPIRED (system-driven only)
 * - PENDING → CANCELLED (system-driven only)
 * - No other transitions allowed
 */
export class DecisionAuthorityService {
  private prisma: PrismaClient;
  private auditLogService: AuditLogService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.auditLogService = new AuditLogService(prisma);
  }

  /**
   * Request a decision for an asset
   * 
   * Creates a decision record and requests decision from configured source.
   * Initial status is always PENDING unless source immediately approves/rejects.
   */
  async requestDecision(request: {
    assetType: AssetType;
    assetId: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    // Validate request
    this.validateDecisionRequest(request);

    // Get decision source
    const decisionSource = DecisionSourceFactory.getDecisionSource();

    try {
      // Request decision from source
      const sourceResponse: DecisionResponse = await decisionSource.requestDecision({
        assetType: request.assetType,
        assetId: request.assetId,
        metadata: request.metadata || {}
      });

      // Create decision record in database
      const decision = await this.prisma.assetDecisionRecord.create({
        data: {
          assetType: request.assetType,
          assetId: request.assetId,
          decisionId: sourceResponse.decisionId,
          status: sourceResponse.status,
          decisionRef: sourceResponse.decisionRef,
          reason: sourceResponse.reason,
          decisionSource: decisionSource.getSourceName(),
          requestedAt: new Date(),
          decidedAt: sourceResponse.decidedAt,
          expiresAt: sourceResponse.expiresAt,
          metadata: request.metadata || {}
        }
      });

      // Log decision creation
      await this.auditLogService.logDecisionCreated(
        decision.id,
        'SYSTEM',
        'SYSTEM',
        {
          source: decisionSource.getSourceName(),
          initialStatus: sourceResponse.status
        }
      );

      return decision;
    } catch (error) {
      throw new DecisionSourceError(`Failed to request decision: ${error}`);
    }
  }

  /**
   * Get decision by ID
   */
  async getDecision(id: number) {
    const decision = await this.prisma.assetDecisionRecord.findUnique({
      where: { id },
      include: {
        auditLogs: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!decision) {
      throw new DecisionNotFoundError(id.toString());
    }

    return decision;
  }

  /**
   * Get decision by decision ID (from source)
   */
  async getDecisionByDecisionId(decisionId: string) {
    const decision = await this.prisma.assetDecisionRecord.findUnique({
      where: { decisionId },
      include: {
        auditLogs: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!decision) {
      throw new DecisionNotFoundError(decisionId);
    }

    return decision;
  }

  /**
   * Get decisions for an asset
   */
  async getDecisionsByAsset(assetType: AssetType, assetId: string) {
    return this.prisma.assetDecisionRecord.findMany({
      where: {
        assetType,
        assetId
      },
      orderBy: { requestedAt: 'desc' },
      include: {
        auditLogs: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  /**
   * List decisions with filters
   */
  async listDecisions(filters: {
    assetType?: AssetType;
    assetId?: string;
    status?: DecisionStatus;
    decisionSource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.assetType) {
      where.assetType = filters.assetType;
    }

    if (filters.assetId) {
      where.assetId = filters.assetId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.decisionSource) {
      where.decisionSource = filters.decisionSource;
    }

    if (filters.startDate || filters.endDate) {
      where.requestedAt = {};
      if (filters.startDate) {
        where.requestedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.requestedAt.lte = filters.endDate;
      }
    }

    const [decisions, total] = await Promise.all([
      this.prisma.assetDecisionRecord.findMany({
        where,
        orderBy: { requestedAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
        include: {
          auditLogs: {
            orderBy: { createdAt: 'asc' }
          }
        }
      }),
      this.prisma.assetDecisionRecord.count({ where })
    ]);

    return {
      decisions,
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0
    };
  }

  /**
   * Update decision status from source
   * 
   * This is called when receiving updates from the decision source.
   * Only APPROVED and REJECTED statuses are allowed from source.
   */
  async updateDecisionFromSource(
    decisionId: string,
    newStatus: DecisionStatus,
    reason?: string,
    decidedAt?: Date
  ): Promise<any> {
    // Validate that only APPROVED or REJECTED can come from source
    if (newStatus !== DecisionStatus.APPROVED && newStatus !== DecisionStatus.REJECTED) {
      throw new InvalidDecisionStateError(
        `Invalid status from source: ${newStatus}. Only APPROVED or REJECTED allowed.`
      );
    }

    const decision = await this.getDecisionByDecisionId(decisionId);

    // Validate state transition
    this.validateStateTransition(decision.status, newStatus, 'SOURCE');

    // Update decision
    const updated = await this.prisma.assetDecisionRecord.update({
      where: { id: decision.id },
      data: {
        status: newStatus,
        reason,
        decidedAt: decidedAt || new Date()
      }
    });

    // Log status change
    await this.auditLogService.logStatusChange(
      decision.id,
      decision.status,
      newStatus,
      'DECISION_SOURCE',
      'SOURCE',
      { reason }
    );

    return updated;
  }

  /**
   * Expire a decision (system-driven only)
   * 
   * Called by system when a PENDING decision exceeds its expiry time.
   */
  async expireDecision(id: number): Promise<any> {
    const decision = await this.getDecision(id);

    // Validate state transition
    this.validateStateTransition(decision.status, DecisionStatus.EXPIRED, 'SYSTEM');

    // Update decision
    const updated = await this.prisma.assetDecisionRecord.update({
      where: { id },
      data: {
        status: DecisionStatus.EXPIRED
      }
    });

    // Log expiry
    await this.auditLogService.logDecisionExpired(
      id,
      decision.status,
      { expiresAt: decision.expiresAt }
    );

    return updated;
  }

  /**
   * Cancel a decision (system-driven only)
   * 
   * Called by system when a PENDING decision needs to be cancelled.
   */
  async cancelDecision(id: number, reason?: string): Promise<any> {
    const decision = await this.getDecision(id);

    // Validate state transition
    this.validateStateTransition(decision.status, DecisionStatus.CANCELLED, 'SYSTEM');

    // Update decision
    const updated = await this.prisma.assetDecisionRecord.update({
      where: { id },
      data: {
        status: DecisionStatus.CANCELLED,
        reason: reason || decision.reason
      }
    });

    // Log cancellation
    await this.auditLogService.logDecisionCancelled(
      id,
      decision.status,
      'SYSTEM',
      'SYSTEM',
      { reason }
    );

    return updated;
  }

  /**
   * Validate decision request
   */
  private validateDecisionRequest(request: {
    assetType: AssetType;
    assetId: string;
  }): void {
    if (!request.assetType) {
      throw new ValidationError('assetType is required');
    }

    if (!request.assetId || request.assetId.trim() === '') {
      throw new ValidationError('assetId is required and cannot be empty');
    }

    // Validate assetType is valid enum value
    if (!Object.values(AssetType).includes(request.assetType)) {
      throw new ValidationError(`Invalid assetType: ${request.assetType}`);
    }
  }

  /**
   * Validate state transition
   * 
   * State Machine Rules:
   * - PENDING → APPROVED (from Source only)
   * - PENDING → REJECTED (from Source only)
   * - PENDING → EXPIRED (from System only)
   * - PENDING → CANCELLED (from System only)
   * - No other transitions allowed
   */
  private validateStateTransition(
    currentStatus: DecisionStatus,
    newStatus: DecisionStatus,
    actor: 'SOURCE' | 'SYSTEM'
  ): void {
    // Only PENDING decisions can transition
    if (currentStatus !== DecisionStatus.PENDING) {
      throw new InvalidDecisionStateError(
        `Cannot transition from ${currentStatus}. Only PENDING decisions can change status.`
      );
    }

    // Validate actor permissions
    if (actor === 'SOURCE') {
      if (newStatus !== DecisionStatus.APPROVED && newStatus !== DecisionStatus.REJECTED) {
        throw new InvalidDecisionStateError(
          `Source can only set status to APPROVED or REJECTED, not ${newStatus}`
        );
      }
    } else if (actor === 'SYSTEM') {
      if (newStatus !== DecisionStatus.EXPIRED && newStatus !== DecisionStatus.CANCELLED) {
        throw new InvalidDecisionStateError(
          `System can only set status to EXPIRED or CANCELLED, not ${newStatus}`
        );
      }
    }
  }
}
