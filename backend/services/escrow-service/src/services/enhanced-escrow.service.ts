/**
 * Enhanced Escrow Service
 * Advanced escrow system with hold/release logic, disputes, and 72-hour release window
 * Inspired by smart contract patterns from EscrowContract.sol
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Constants
const DEFAULT_RELEASE_WINDOW_HOURS = 72; // 72-hour release window
const DISPUTE_COOLDOWN_HOURS = 24;

// Define types locally to avoid Prisma type issues
type EscrowStatus = 'CREATED' | 'SIGNED' | 'LOCKED' | 'RELEASED' | 'DISPUTED' | 'RESOLVED' | 'CANCELLED';
type DisputeStatus = 'NONE' | 'INITIATED' | 'UNDER_REVIEW' | 'RESOLVED';
type EscrowType = 'STANDARD' | 'AUCTION' | 'TRAVEL' | 'P2P';

export interface CreateEscrowInput {
  buyerId: string;
  sellerId: string;
  arbitratorId?: string;
  amount: number;
  currency?: string;
  description?: string;
  orderId?: string;
  tripId?: string;
  escrowType?: EscrowType;
  metadata?: Record<string, any>;
}

export interface EscrowReleaseInput {
  escrowId: string;
  releasedBy: 'buyer' | 'seller' | 'auto';
  reason?: string;
}

export interface InitiateDisputeInput {
  escrowId: string;
  initiatorId: string;
  reason: string;
  evidence?: Record<string, any>;
  desiredResolution?: 'full_refund' | 'partial_refund' | 'release_to_seller' | 'split';
  amountDisputed?: number;
}

export interface ResolveDisputeInput {
  escrowId: string;
  resolverId: string;
  resolution: 'buyer_wins' | 'seller_wins' | 'split' | 'mutual_agreement';
  buyerAmount?: number;
  sellerAmount?: number;
  reason?: string;
}

export interface RefundApprovalInput {
  escrowId: string;
  requestedBy: string;
  reason: string;
  amount?: number;
  approverRole: 'admin' | 'system' | 'arbitrator';
}

export interface EscrowWithTimeline {
  id: string;
  transactionId: string;
  buyerId: string;
  sellerId: string;
  arbitratorId?: string;
  amount: number;
  currency: string;
  status: EscrowStatus;
  disputeStatus: DisputeStatus;
  createdAt: Date;
  heldAt?: Date;
  releasedAt?: Date;
  expiredAt?: Date;
  releaseWindowHours: number;
  autoReleaseAt?: Date;
  disputeDeadline?: Date;
  timeline: {
    phase: string;
    startedAt: Date;
    expiresAt?: Date;
    remainingMs?: number;
    isExpired: boolean;
  }[];
}

export class EnhancedEscrowService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create new escrow with atomic transaction
   * Implements: Hold funds, create escrow record, log event atomically
   */
  async createEscrow(input: CreateEscrowInput): Promise<any> {
    const releaseWindowHours = DEFAULT_RELEASE_WINDOW_HOURS;
    
    return await this.prisma.$transaction(async (tx: any) => {
      // Generate unique transaction ID
      const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Calculate auto-release date (72 hours from now by default)
      const autoReleaseAt = new Date();
      autoReleaseAt.setHours(autoReleaseAt.getHours() + releaseWindowHours);

      // Create escrow with all related records atomically
      const escrow = await tx.escrow.create({
        data: {
          transactionId,
          buyerId: input.buyerId,
          sellerId: input.sellerId,
          arbitratorId: input.arbitratorId,
          amount: input.amount,
          currency: input.currency || 'USD',
          status: 'CREATED',
          disputeStatus: 'NONE',
          escrowType: input.escrowType || 'STANDARD',
          orderId: input.orderId,
          tripId: input.tripId,
          releaseWindowHours,
          autoReleaseAt,
          metadata: input.metadata,
        },
      });

      // Create audit trail entry
      await tx.escrowEvent.create({
        data: {
          escrowId: escrow.id,
          eventType: 'ESCROW_CREATED',
          triggeredBy: input.buyerId,
          eventData: {
            transactionId,
            amount: input.amount,
            currency: input.currency,
            releaseWindowHours,
            description: input.description,
          },
        },
      });

      // Create timeline entry
      await tx.escrowTimeline.create({
        data: {
          escrowId: escrow.id,
          phase: 'CREATED',
          startedAt: new Date(),
          expiresAt: autoReleaseAt,
          metadata: { releaseWindowHours, description: input.description },
        },
      });

      logger.info(`Enhanced escrow created: ${escrow.id} with ${releaseWindowHours}h release window`);
      return this.mapToEscrowWithTimeline(escrow);
    });
  }

  /**
   * Hold funds in escrow
   * Locks buyer funds and changes status to LOCKED
   */
  async holdFunds(escrowId: string, heldBy: string): Promise<any> {
    return await this.prisma.$transaction(async (tx: any) => {
      const escrow = await tx.escrow.findUnique({
        where: { id: escrowId },
      });

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status !== 'CREATED' && escrow.status !== 'SIGNED') {
        throw new Error('Escrow must be in CREATED or SIGNED status to hold funds');
      }

      // Update escrow status
      const updatedEscrow = await tx.escrow.update({
        where: { id: escrowId },
        data: {
          status: 'LOCKED',
          lockedAt: new Date(),
        },
      });

      // Create audit event
      await tx.escrowEvent.create({
        data: {
          escrowId: escrow.id,
          eventType: 'FUNDS_HELD',
          triggeredBy: heldBy,
          eventData: {
            amount: Number(escrow.amount),
            currency: escrow.currency,
            heldAt: new Date(),
          },
        },
      });

      // Create timeline entry
      await tx.escrowTimeline.create({
        data: {
          escrowId: escrow.id,
          phase: 'HELD',
          startedAt: new Date(),
          expiresAt: escrow.autoReleaseAt,
          metadata: { autoReleaseAt: escrow.autoReleaseAt },
        },
      });

      logger.info(`Funds held for escrow: ${escrowId}`);
      return this.mapToEscrowWithTimeline(updatedEscrow);
    });
  }

  /**
   * Release escrow to seller
   * Can be triggered by buyer, seller (if conditions met), or auto after timeout
   */
  async releaseEscrow(input: EscrowReleaseInput): Promise<any> {
    const { escrowId, releasedBy, reason } = input;

    return await this.prisma.$transaction(async (tx: any) => {
      const escrow = await tx.escrow.findUnique({
        where: { id: escrowId },
      });

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status !== 'LOCKED') {
        throw new Error('Escrow must be LOCKED to be released');
      }

      if (escrow.disputeStatus === 'INITIATED') {
        throw new Error('Cannot release escrow while dispute is active');
      }

      // Validate release authorization
      if (releasedBy === 'buyer') {
        // Buyer can release anytime
      } else if (releasedBy === 'seller') {
        // Seller can only release after conditions met
        const lockedAt = escrow.lockedAt;
        if (lockedAt) {
          const elapsedHours = (Date.now() - new Date(lockedAt).getTime()) / (1000 * 60 * 60);
          if (elapsedHours < 24) {
            throw new Error('Seller can only release after 24 hours from hold');
          }
        }
      } else if (releasedBy === 'auto') {
        // Auto-release only after release window expires
        if (escrow.autoReleaseAt && new Date() < new Date(escrow.autoReleaseAt)) {
          throw new Error('Auto-release only available after release window');
        }
      }

      // Update escrow status
      const updatedEscrow = await tx.escrow.update({
        where: { id: escrowId },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
        },
      });

      // Create audit event
      await tx.escrowEvent.create({
        data: {
          escrowId: escrow.id,
          eventType: 'ESCROW_RELEASED',
          triggeredBy: releasedBy,
          eventData: {
            releasedBy,
            reason,
            releasedAt: new Date(),
            amount: Number(escrow.amount),
          },
        },
      });

      // Create timeline entry
      await tx.escrowTimeline.create({
        data: {
          escrowId: escrow.id,
          phase: 'RELEASED',
          startedAt: new Date(),
          expiresAt: null,
          metadata: { releasedBy, reason },
        },
      });

      logger.info(`Escrow released: ${escrowId} by ${releasedBy}`);
      return this.mapToEscrowWithTimeline(updatedEscrow);
    });
  }

  /**
   * Initiate dispute
   * Places escrow in dispute state with evidence collection
   */
  async initiateDispute(input: InitiateDisputeInput): Promise<any> {
    const { escrowId, initiatorId, reason, evidence, desiredResolution, amountDisputed } = input;

    return await this.prisma.$transaction(async (tx: any) => {
      const escrow = await tx.escrow.findUnique({
        where: { id: escrowId },
      });

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      // Only buyer or seller can initiate dispute
      if (initiatorId !== escrow.buyerId && initiatorId !== escrow.sellerId) {
        throw new Error('Only buyer or seller can initiate dispute');
      }

      if (escrow.status !== 'LOCKED') {
        throw new Error('Only LOCKED escrows can be disputed');
      }

      if (escrow.disputeStatus === 'INITIATED') {
        throw new Error('Dispute already in progress');
      }

      // Calculate dispute deadline (24 hours from now)
      const disputeDeadline = new Date();
      disputeDeadline.setHours(disputeDeadline.getHours() + DISPUTE_COOLDOWN_HOURS);

      // Update escrow to disputed
      const updatedEscrow = await tx.escrow.update({
        where: { id: escrowId },
        data: {
          status: 'DISPUTED',
          disputeStatus: 'INITIATED',
          disputeReason: reason,
          disputeReasonIPFS: evidence ? JSON.stringify(evidence) : undefined,
          desiredResolution,
          amountDisputed: amountDisputed || escrow.amount,
          disputeDeadline,
          disputedAt: new Date(),
        },
      });

      // Create dispute record
      const dispute = await tx.dispute.create({
        data: {
          escrowId: escrow.id,
          initiatorId,
          reason,
          evidence: evidence || {},
          desiredResolution,
          amountDisputed: amountDisputed || Number(escrow.amount),
          status: 'OPEN',
          deadline: disputeDeadline,
        },
      });

      // Create audit event
      await tx.escrowEvent.create({
        data: {
          escrowId: escrow.id,
          eventType: 'DISPUTE_INITIATED',
          triggeredBy: initiatorId,
          eventData: {
            disputeId: dispute.id,
            reason,
            evidence,
            desiredResolution,
            disputeDeadline,
          },
        },
      });

      // Create timeline entry
      await tx.escrowTimeline.create({
        data: {
          escrowId: escrow.id,
          phase: 'DISPUTED',
          startedAt: new Date(),
          expiresAt: disputeDeadline,
          metadata: { disputeId: dispute.id, disputeDeadline },
        },
      });

      logger.info(`Dispute initiated for escrow: ${escrowId} by ${initiatorId}`);
      return {
        escrow: this.mapToEscrowWithTimeline(updatedEscrow),
        dispute,
      };
    });
  }

  /**
   * Resolve dispute with flexible resolution options
   */
  async resolveDispute(input: ResolveDisputeInput): Promise<any> {
    const { escrowId, resolverId, resolution, buyerAmount, sellerAmount, reason } = input;

    return await this.prisma.$transaction(async (tx: any) => {
      const escrow = await tx.escrow.findUnique({
        where: { id: escrowId },
      });

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      // Validate resolver (arbitrator, admin, or system)
      if (resolverId !== escrow.arbitratorId && resolverId !== 'system') {
        throw new Error('Only arbitrator or system can resolve disputes');
      }

      if (escrow.status !== 'DISPUTED') {
        throw new Error('Escrow must be DISPUTED to resolve');
      }

      // Calculate amounts based on resolution type
      let finalBuyerAmount = 0;
      let finalSellerAmount = 0;

      switch (resolution) {
        case 'buyer_wins':
          finalBuyerAmount = Number(escrow.amount);
          finalSellerAmount = 0;
          break;
        case 'seller_wins':
          finalBuyerAmount = 0;
          finalSellerAmount = Number(escrow.amount);
          break;
        case 'split':
          finalBuyerAmount = buyerAmount || Number(escrow.amount) / 2;
          finalSellerAmount = sellerAmount || Number(escrow.amount) / 2;
          break;
        case 'mutual_agreement':
          finalBuyerAmount = buyerAmount || 0;
          finalSellerAmount = sellerAmount || 0;
          break;
      }

      // Update escrow
      const updatedEscrow = await tx.escrow.update({
        where: { id: escrowId },
        data: {
          status: resolution === 'buyer_wins' ? 'RESOLVED' : 'RELEASED',
          disputeStatus: 'RESOLVED',
          resolution: resolution.toUpperCase(),
          resolvedBy: resolverId,
          resolvedAt: new Date(),
          disputeReason: reason,
          buyerAmount: finalBuyerAmount,
          sellerAmount: finalSellerAmount,
        },
      });

      // Update dispute
      await tx.dispute.updateMany({
        where: { escrowId: escrow.id, status: 'OPEN' },
        data: {
          status: 'RESOLVED',
          resolution,
          resolutionReason: reason,
          buyerAmount: finalBuyerAmount,
          sellerAmount: finalSellerAmount,
          resolvedAt: new Date(),
        },
      });

      // Create audit event
      await tx.escrowEvent.create({
        data: {
          escrowId: escrow.id,
          eventType: 'DISPUTE_RESOLVED',
          triggeredBy: resolverId,
          eventData: {
            resolution,
            buyerAmount: finalBuyerAmount,
            sellerAmount: finalSellerAmount,
            reason,
            resolvedAt: new Date(),
          },
        },
      });

      // Create timeline entry
      await tx.escrowTimeline.create({
        data: {
          escrowId: escrow.id,
          phase: 'RESOLVED',
          startedAt: new Date(),
          expiresAt: null,
          metadata: { resolution, buyerAmount: finalBuyerAmount, sellerAmount: finalSellerAmount },
        },
      });

      logger.info(`Dispute resolved for escrow: ${escrowId} - Resolution: ${resolution}`);
      return this.mapToEscrowWithTimeline(updatedEscrow);
    });
  }

  /**
   * Request refund with approval workflow
   */
  async requestRefund(input: RefundApprovalInput): Promise<any> {
    const { escrowId, requestedBy, reason, amount, approverRole } = input;

    return await this.prisma.$transaction(async (tx: any) => {
      const escrow = await tx.escrow.findUnique({
        where: { id: escrowId },
      });

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      // Only buyer can request refund
      if (requestedBy !== escrow.buyerId) {
        throw new Error('Only buyer can request refund');
      }

      // Create refund request
      const refundRequest = await tx.refundRequest.create({
        data: {
          escrowId: escrow.id,
          requestedBy,
          amount: amount || escrow.amount,
          reason,
          status: 'PENDING',
          approverRole,
        },
      });

      // Create audit event
      await tx.escrowEvent.create({
        data: {
          escrowId: escrow.id,
          eventType: 'REFUND_REQUESTED',
          triggeredBy: requestedBy,
          eventData: {
            refundRequestId: refundRequest.id,
            amount: Number(refundRequest.amount),
            reason,
            approverRole,
          },
        },
      });

      logger.info(`Refund requested for escrow: ${escrowId} by ${requestedBy}`);
      return refundRequest;
    });
  }

  /**
   * Approve refund
   */
  async approveRefund(refundRequestId: string, approvedBy: string): Promise<any> {
    return await this.prisma.$transaction(async (tx: any) => {
      const refundRequest = await tx.refundRequest.findUnique({
        where: { id: refundRequestId },
      });

      if (!refundRequest) {
        throw new Error('Refund request not found');
      }

      if (refundRequest.status !== 'PENDING') {
        throw new Error('Refund request already processed');
      }

      // Update refund request
      const updatedRefund = await tx.refundRequest.update({
        where: { id: refundRequestId },
        data: {
          status: 'APPROVED',
          approvedBy,
          approvedAt: new Date(),
        },
      });

      // Update escrow status
      const updatedEscrow = await tx.escrow.update({
        where: { id: refundRequest.escrowId },
        data: {
          status: 'RESOLVED',
          releasedAt: new Date(),
          refundReason: refundRequest.reason,
        },
      });

      // Create audit event
      await tx.escrowEvent.create({
        data: {
          escrowId: refundRequest.escrowId,
          eventType: 'REFUND_APPROVED',
          triggeredBy: approvedBy,
          eventData: {
            refundRequestId: updatedRefund.id,
            amount: Number(updatedRefund.amount),
            approvedBy,
            approvedAt: new Date(),
          },
        },
      });

      logger.info(`Refund approved for escrow: ${refundRequest.escrowId} by ${approvedBy}`);
      return {
        refund: updatedRefund,
        escrow: this.mapToEscrowWithTimeline(updatedEscrow),
      };
    });
  }

  /**
   * Get escrow with timeline information
   */
  async getEscrowWithTimeline(escrowId: string): Promise<EscrowWithTimeline | null> {
    const prisma = this.prisma as any;
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      return null;
    }

    const timelines = await prisma.escrowTimeline.findMany({
      where: { escrowId },
      orderBy: { startedAt: 'asc' },
    });

    return this.mapToEscrowWithTimeline(escrow, timelines);
  }

  /**
   * Auto-process expired release windows
   * Called by scheduler to release escrows after 72-hour window
   */
  async autoProcessExpiredEscrows(): Promise<{ released: number; errors: number }> {
    const prisma = this.prisma as any;
    const now = new Date();
    const released: string[] = [];
    const errors: string[] = [];

    const expiredEscrows = await prisma.escrow.findMany({
      where: {
        status: 'LOCKED',
        disputeStatus: 'NONE',
        autoReleaseAt: { lte: now },
      },
    });

    for (const escrow of expiredEscrows) {
      try {
        await this.releaseEscrow({
          escrowId: escrow.id,
          releasedBy: 'auto',
          reason: 'Auto-release after release window expired',
        });
        released.push(escrow.id);
      } catch (error: any) {
        logger.error(`Failed to auto-release escrow ${escrow.id}: ${error.message}`);
        errors.push(escrow.id);
      }
    }

    logger.info(`Auto-processed ${released.length} expired escrows, ${errors.length} errors`);
    return { released: released.length, errors: errors.length };
  }

  /**
   * Get escrows nearing release window expiration
   */
  async getEscrowsNearingExpiration(hoursRemaining: number = 24): Promise<any[]> {
    const prisma = this.prisma as any;
    const threshold = new Date();
    threshold.setHours(threshold.getHours() + hoursRemaining);

    return await prisma.escrow.findMany({
      where: {
        status: 'LOCKED',
        disputeStatus: 'NONE',
        autoReleaseAt: {
          gte: new Date(),
          lte: threshold,
        },
      },
    });
  }

  /**
   * Map escrow to timeline view
   */
  private mapToEscrowWithTimeline(escrow: any, timelines?: any[]): EscrowWithTimeline {
    const phases = timelines || [];
    
    return {
      id: escrow.id,
      transactionId: escrow.transactionId,
      buyerId: escrow.buyerId,
      sellerId: escrow.sellerId,
      arbitratorId: escrow.arbitratorId,
      amount: Number(escrow.amount),
      currency: escrow.currency,
      status: escrow.status as EscrowStatus,
      disputeStatus: escrow.disputeStatus as DisputeStatus,
      createdAt: escrow.createdAt,
      heldAt: escrow.lockedAt,
      releasedAt: escrow.releasedAt,
      expiredAt: escrow.expiredAt,
      releaseWindowHours: escrow.releaseWindowHours,
      autoReleaseAt: escrow.autoReleaseAt,
      disputeDeadline: escrow.disputeDeadline,
      timeline: phases.map((p: any) => ({
        phase: p.phase,
        startedAt: p.startedAt,
        expiresAt: p.expiresAt,
        remainingMs: p.expiresAt ? new Date(p.expiresAt).getTime() - Date.now() : undefined,
        isExpired: p.expiresAt ? new Date() > new Date(p.expiresAt) : false,
      })),
    };
  }
}

export const enhancedEscrowService = new EnhancedEscrowService();
