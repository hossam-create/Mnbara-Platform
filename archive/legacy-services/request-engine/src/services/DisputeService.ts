// ============================================
// Dispute Service
// Core service for managing disputes
// ============================================

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  Dispute,
  DisputeReason,
  DisputeStatus,
  DisputeParty,
  DisputeFilters,
  CreateDisputeInput,
  DisputeListResponse
} from '../types/dispute.types';
import {
  DuplicateDisputeError,
  DisputeNotFoundError,
  UnauthorizedDisputeAccessError,
  InvalidDisputeStatusError,
  RequestNotEligibleForDisputeError,
  DisputeWindowExpiredError
} from '../errors/DisputeErrors';
import { EvidenceService } from './EvidenceService';

const prisma = new PrismaClient();

const DISPUTE_WINDOW_HOURS = 48; // 48 hours to open a dispute
const MAX_EVIDENCE_FILES = 10;

// Define the dispute model type
interface DisputeRecord {
  id: string;
  requestId: number;
  openedBy: string;
  reason: string;
  description: string;
  status: string;
  resolution: string | null;
  resolutionPercentage: number | null;
  adminNotes: string | null;
  openedAt: Date;
  reviewedAt: Date | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
  reviewedByAdminId: number | null;
  resolvedByAdminId: number | null;
  stripeRefundId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class DisputeService {
  private evidenceService: EvidenceService;

  constructor() {
    this.evidenceService = new EvidenceService();
  }

  /**
   * Open a new dispute for a request
   */
  async openDispute(input: CreateDisputeInput, userId: string, userRole: DisputeParty): Promise<Dispute> {
    // Validate request exists and is eligible
    const request = await prisma.request.findUnique({
      where: { id: input.requestId }
    });

    if (!request) {
      throw new RequestNotEligibleForDisputeError(input.requestId, 'Request not found');
    }

    // Check if request is delivered
    if (request.status !== 'DELIVERED') {
      throw new RequestNotEligibleForDisputeError(input.requestId, 
        `Request status is ${request.status}. Only DELIVERED requests can be disputed.`);
    }

    // Check if request belongs to the user
    if (userRole === DisputeParty.BUYER && request.buyerId !== userId) {
      throw new UnauthorizedDisputeAccessError(userId, input.requestId.toString());
    }
    if (userRole === DisputeParty.SELLER && request.sellerId !== userId) {
      throw new UnauthorizedDisputeAccessError(userId, input.requestId.toString());
    }

    // Check for existing dispute
    const existingDispute = await prisma.dispute.findFirst({
      where: { requestId: input.requestId }
    });

    if (existingDispute) {
      throw new DuplicateDisputeError(input.requestId);
    }

    // Check 48-hour window
    const deliveredAt = request.updatedAt;
    const now = new Date();
    const hoursSinceDelivery = (now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceDelivery > DISPUTE_WINDOW_HOURS) {
      throw new DisputeWindowExpiredError(input.requestId.toString());
    }

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        id: uuidv4(),
        requestId: input.requestId,
        openedBy: userRole,
        reason: input.reason,
        description: input.description,
        status: DisputeStatus.OPEN
      }
    });

    // Upload evidence files if provided
    if (input.evidenceFiles && input.evidenceFiles.length > 0) {
      await this.evidenceService.uploadEvidence(
        dispute.id,
        userRole,
        input.evidenceFiles
      );
    }

    // Update request status
    await prisma.request.update({
      where: { id: input.requestId },
      data: { status: 'DISPUTED' }
    });

    return this.mapDisputeToInterface(dispute);
  }

  /**
   * Get dispute by ID
   */
  async getDisputeById(disputeId: string, userId: string, userRole?: string): Promise<Dispute> {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId }
    });

    if (!dispute) {
      throw new DisputeNotFoundError(disputeId);
    }

    // Check authorization for non-admin users
    if (userRole !== 'ADMIN') {
      const request = await prisma.request.findUnique({
        where: { id: dispute.requestId }
      });

      if (request && request.buyerId !== userId && request.sellerId !== userId) {
        throw new UnauthorizedDisputeAccessError(userId, disputeId);
      }
    }

    return this.mapDisputeToInterface(dispute);
  }

  /**
   * Get disputes for a user
   */
  async getUserDisputes(userId: string, userRole: DisputeParty, filters?: DisputeFilters): Promise<DisputeListResponse> {
    const where: any = {};

    if (userRole === DisputeParty.BUYER) {
      where.request = { buyerId: userId };
    } else if (userRole === DisputeParty.SELLER) {
      where.request = { sellerId: userId };
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.reason) {
      where.reason = filters.reason;
    }

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
        orderBy: { openedAt: 'desc' }
      }),
      prisma.dispute.count({ where })
    ]);

    return {
      disputes: disputes.map((d: DisputeRecord) => this.mapDisputeToInterface(d)),
      total,
      limit: filters?.limit || 20,
      offset: filters?.offset || 0
    };
  }

  /**
   * Get all disputes (admin)
   */
  async getAllDisputes(filters?: DisputeFilters): Promise<DisputeListResponse> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.reason) {
      where.reason = filters.reason;
    }

    if (filters?.openedBy) {
      where.openedBy = filters.openedBy;
    }

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: { openedAt: 'desc' }
      }),
      prisma.dispute.count({ where })
    ]);

    return {
      disputes: disputes.map((d: DisputeRecord) => this.mapDisputeToInterface(d)),
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0
    };
  }

  /**
   * Add evidence to a dispute
   */
  async addEvidence(
    disputeId: string,
    submittedBy: DisputeParty,
    files: any[],
    userId: string
  ): Promise<void> {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { request: true }
    });

    if (!dispute) {
      throw new DisputeNotFoundError(disputeId);
    }

    // Check authorization
    if (dispute.request.buyerId !== userId && dispute.request.sellerId !== userId) {
      throw new UnauthorizedDisputeAccessError(userId, disputeId);
    }

    // Check dispute status
    if (dispute.status !== DisputeStatus.OPEN && dispute.status !== DisputeStatus.UNDER_REVIEW) {
      throw new InvalidDisputeStatusError(dispute.status, [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW]);
    }

    // Check evidence count limit
    const currentEvidenceCount = await this.evidenceService.getEvidenceCount(disputeId, submittedBy);
    if (currentEvidenceCount + files.length > MAX_EVIDENCE_FILES) {
      throw new Error(`Maximum ${MAX_EVIDENCE_FILES} files allowed per party`);
    }

    // Upload evidence
    await this.evidenceService.uploadEvidence(disputeId, submittedBy, files);
  }

  /**
   * Mark dispute as under review
   */
  async markUnderReview(disputeId: string, adminId: string): Promise<Dispute> {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId }
    });

    if (!dispute) {
      throw new DisputeNotFoundError(disputeId);
    }

    if (dispute.status !== DisputeStatus.OPEN) {
      throw new InvalidDisputeStatusError(dispute.status, [DisputeStatus.OPEN]);
    }

    const updated = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.UNDER_REVIEW,
        reviewedAt: new Date(),
        reviewedByAdminId: parseInt(adminId)
      }
    });

    return this.mapDisputeToInterface(updated);
  }

  /**
   * Get dispute statistics
   */
  async getDisputeStats(): Promise<any> {
    const [
      totalDisputes,
      openDisputes,
      underReviewDisputes,
      resolvedDisputes,
      byReason
    ] = await Promise.all([
      prisma.dispute.count(),
      prisma.dispute.count({ where: { status: DisputeStatus.OPEN } }),
      prisma.dispute.count({ where: { status: DisputeStatus.UNDER_REVIEW } }),
      prisma.dispute.count({ where: { status: DisputeStatus.RESOLVED } }),
      prisma.dispute.groupBy({
        by: ['reason'],
        _count: true
      })
    ]);

    return {
      total: totalDisputes,
      open: openDisputes,
      underReview: underReviewDisputes,
      resolved: resolvedDisputes,
      byReason: byReason.reduce((acc: any, item: any) => {
        acc[item.reason] = item._count;
        return acc;
      }, {})
    };
  }

  /**
   * Map Prisma model to interface
   */
  private mapDisputeToInterface(dispute: DisputeRecord): Dispute {
    return {
      id: dispute.id,
      requestId: dispute.requestId,
      openedBy: dispute.openedBy as DisputeParty,
      reason: dispute.reason as DisputeReason,
      description: dispute.description,
      evidenceUrls: [],
      status: dispute.status as DisputeStatus,
      resolution: dispute.resolution as any,
      resolutionPercentage: dispute.resolutionPercentage || undefined,
      adminNotes: dispute.adminNotes || undefined,
      openedAt: dispute.openedAt,
      reviewedAt: dispute.reviewedAt || undefined,
      resolvedAt: dispute.resolvedAt || undefined,
      closedAt: dispute.closedAt || undefined,
      reviewedByAdminId: dispute.reviewedByAdminId || undefined,
      resolvedByAdminId: dispute.resolvedByAdminId || undefined,
      stripeRefundId: dispute.stripeRefundId || undefined,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt
    };
  }
}
