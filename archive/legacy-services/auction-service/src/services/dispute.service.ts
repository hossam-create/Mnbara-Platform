// ============================================================
// PHASE 5.2 — Auction Disputes & Bid Invalidations Service
// 
// CRITICAL RULES:
// ❌ No deleting bids
// ❌ No editing bid amounts
// ❌ No editing ledger rows
// ❌ No reordering history
// ❌ No auto-resolving disputes based on UI
// ❌ No invalidating a bid AFTER settlement
// ❌ No changing auction outcome silently
// 
// ✅ All bids remain immutable
// ✅ Disputes are additive records
// ✅ Invalidation is explicit and logged
// ✅ Escrow reversal ONLY via ledger entry
// ✅ Settlement logic must re-compute winners safely
// ============================================================

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Enums (matching Prisma schema)
export enum DisputeReason {
  FRAUD_SUSPECTED = 'FRAUD_SUSPECTED',
  DUPLICATE_BID = 'DUPLICATE_BID',
  BOT_ACTIVITY = 'BOT_ACTIVITY',
  ESCROW_FAILURE_POST_ACCEPT = 'ESCROW_FAILURE_POST_ACCEPT',
  RULE_VIOLATION = 'RULE_VIOLATION',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
}

export enum ResolutionType {
  DISMISS = 'DISMISS',
  INVALIDATE = 'INVALIDATE',
  ESCALATE = 'ESCALATE',
}

export enum BidStatus {
  ACTIVE = 'ACTIVE',
  OUTBID = 'OUTBID',
  WINNING = 'WINNING',
  WON = 'WON',
  CANCELLED = 'CANCELLED',
  INVALIDATED = 'INVALIDATED',
  SETTLED = 'SETTLED',
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  SOLD = 'SOLD',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  DELETED = 'DELETED',
}

// Type for Prisma transaction client
type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

// Valid dispute reasons (NO custom free-text allowed)
const VALID_DISPUTE_REASONS = Object.values(DisputeReason);

// ============================================================
// INTERFACES
// ============================================================

export interface CreateDisputeParams {
  auctionId: number;
  bidId: number;
  reason: DisputeReason;
  createdBy: string; // System rule ID or Admin ID
}

export interface ResolveDisputeParams {
  disputeId: number;
  resolution: ResolutionType;
  resolutionNote?: string;
  resolvedBy: string;
}

export interface InvalidateBidParams {
  bidId: number;
  reason: DisputeReason;
  disputeId?: number;
  actorId: string;
  // Escrow service callback for releasing hold
  releaseEscrowCallback?: (bidId: number, auctionId: number) => Promise<string | null>;
}

export interface DisputeResult {
  dispute: any;
  auction: any;
  bid: any;
}

export interface InvalidationResult {
  bid: any;
  auction: any;
  escrowReleased: boolean;
  escrowEntryId?: string;
  invalidationLog: any;
}

export interface SettlementValidation {
  canSettle: boolean;
  openDisputes: number;
  invalidatedBids: number;
  highestValidBid: any | null;
  errors: string[];
}

// ============================================================
// DISPUTE SERVICE
// ============================================================

export class DisputeService {
  // ============================================================
  // CREATE DISPUTE
  // State: -> OPEN
  // Auction is temporarily locked from settlement
  // ============================================================
  async createDispute(params: CreateDisputeParams): Promise<DisputeResult> {
    const { auctionId, bidId, reason, createdBy } = params;

    // Validate reason is from allowed enum (NO custom free-text)
    if (!VALID_DISPUTE_REASONS.includes(reason)) {
      throw new Error(`Invalid dispute reason. Must be one of: ${VALID_DISPUTE_REASONS.join(', ')}`);
    }

    return await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Lock auction row for update
      const auction = await tx.listing.findUnique({
        where: { id: auctionId },
        include: {
          bids: {
            where: { id: bidId },
          },
        },
      });

      if (!auction) {
        throw new Error('Auction not found');
      }

      if (!auction.isAuction) {
        throw new Error('Listing is not an auction');
      }

      // 2. Validate bid exists and belongs to this auction
      const bid = auction.bids[0];
      if (!bid) {
        throw new Error('Bid not found or does not belong to this auction');
      }

      // 3. ❌ FORBIDDEN: Cannot dispute a bid AFTER settlement
      if (auction.status === ListingStatus.SOLD) {
        throw new Error('FORBIDDEN: Cannot create dispute for settled auction. Settlement is final.');
      }

      // 4. Check if bid is already invalidated
      if (bid.status === BidStatus.INVALIDATED) {
        throw new Error('Bid is already invalidated');
      }

      // 5. Check for existing OPEN dispute on this bid
      const existingDispute = await tx.auctionDispute.findFirst({
        where: {
          bidId,
          status: DisputeStatus.OPEN,
        },
      });

      if (existingDispute) {
        throw new Error('An open dispute already exists for this bid');
      }

      // 6. Create dispute record (IMMUTABLE)
      const dispute = await tx.auctionDispute.create({
        data: {
          auctionId,
          bidId,
          reason,
          status: DisputeStatus.OPEN,
          createdBy,
        },
      });

      // 7. Log the creation
      await tx.disputeResolutionLog.create({
        data: {
          disputeId: dispute.id,
          action: 'DISPUTE_CREATED',
          newStatus: DisputeStatus.OPEN,
          actorId: createdBy,
          metadata: { reason },
        },
      });

      // 8. Update auction to mark it has open disputes (blocks settlement)
      const updatedAuction = await tx.listing.update({
        where: { id: auctionId },
        data: { hasOpenDisputes: true },
      });

      return {
        dispute,
        auction: updatedAuction,
        bid,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 10000,
    });
  }

  // ============================================================
  // RESOLVE DISPUTE
  // State: OPEN -> RESOLVED | ESCALATED
  // ============================================================
  async resolveDispute(params: ResolveDisputeParams): Promise<DisputeResult> {
    const { disputeId, resolution, resolutionNote, resolvedBy } = params;

    return await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Get dispute with lock
      const dispute = await tx.auctionDispute.findUnique({
        where: { id: disputeId },
        include: {
          auction: true,
          bid: true,
        },
      });

      if (!dispute) {
        throw new Error('Dispute not found');
      }

      // 2. Validate state transition
      if (dispute.status !== DisputeStatus.OPEN) {
        throw new Error(`Cannot resolve dispute from status: ${dispute.status}`);
      }

      // 3. ❌ FORBIDDEN: Cannot resolve if auction is already settled
      if (dispute.auction.status === ListingStatus.SOLD) {
        throw new Error('FORBIDDEN: Cannot resolve dispute for settled auction. Settlement is final.');
      }

      // 4. Determine new status based on resolution
      let newStatus: DisputeStatus;
      if (resolution === ResolutionType.ESCALATE) {
        newStatus = DisputeStatus.ESCALATED;
      } else {
        newStatus = DisputeStatus.RESOLVED;
      }

      // 5. Update dispute (APPEND resolution, don't delete)
      const updatedDispute = await tx.auctionDispute.update({
        where: { id: disputeId },
        data: {
          status: newStatus,
          resolution,
          resolutionNote,
          resolvedBy,
          resolvedAt: new Date(),
        },
      });

      // 6. Log the resolution
      await tx.disputeResolutionLog.create({
        data: {
          disputeId,
          action: 'DISPUTE_RESOLVED',
          previousStatus: DisputeStatus.OPEN,
          newStatus,
          actorId: resolvedBy,
          metadata: { resolution, resolutionNote },
        },
      });

      // 7. Check if there are any remaining open disputes for this auction
      const remainingOpenDisputes = await tx.auctionDispute.count({
        where: {
          auctionId: dispute.auctionId,
          status: DisputeStatus.OPEN,
        },
      });

      // 8. Update auction's hasOpenDisputes flag
      const updatedAuction = await tx.listing.update({
        where: { id: dispute.auctionId },
        data: { hasOpenDisputes: remainingOpenDisputes > 0 },
      });

      return {
        dispute: updatedDispute,
        auction: updatedAuction,
        bid: dispute.bid,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 10000,
    });
  }

  // ============================================================
  // INVALIDATE BID
  // Controlled action that:
  // - Removes bid from ranking/settlement
  // - Does NOT erase history
  // - Does NOT mutate ledger
  // - Safely unwinds escrow HOLD if allowed
  // ============================================================
  async invalidateBid(params: InvalidateBidParams): Promise<InvalidationResult> {
    const { bidId, reason, disputeId, actorId, releaseEscrowCallback } = params;

    // Validate reason
    if (!VALID_DISPUTE_REASONS.includes(reason)) {
      throw new Error(`Invalid invalidation reason. Must be one of: ${VALID_DISPUTE_REASONS.join(', ')}`);
    }

    return await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Get bid with auction (with lock)
      const bid = await tx.bid.findUnique({
        where: { id: bidId },
        include: {
          listing: true,
        },
      });

      if (!bid) {
        throw new Error('Bid not found');
      }

      const auction = bid.listing;

      // 2. ❌ FORBIDDEN: Cannot invalidate bid AFTER settlement
      if (auction.status === ListingStatus.SOLD) {
        throw new Error('FORBIDDEN: Cannot invalidate bid after auction settlement. Settlement is final.');
      }

      // 3. Check if bid is already invalidated
      if (bid.status === BidStatus.INVALIDATED) {
        throw new Error('Bid is already invalidated');
      }

      // 4. Store previous status for audit
      const previousStatus = bid.status;

      // 5. Update bid status to INVALIDATED (bid remains in DB, immutable history)
      const updatedBid = await tx.bid.update({
        where: { id: bidId },
        data: { status: BidStatus.INVALIDATED },
      });

      // 6. Handle escrow based on auction state
      let escrowAction: string | null = null;
      let escrowEntryId: string | null = null;

      if (auction.status === ListingStatus.ACTIVE || auction.status === ListingStatus.ENDED) {
        // Auction still OPEN or CLOSED but not settled: RELEASE escrow HOLD safely
        if (releaseEscrowCallback) {
          try {
            escrowEntryId = await releaseEscrowCallback(bidId, auction.id);
            escrowAction = escrowEntryId ? 'RELEASED' : 'NO_ESCROW';
          } catch (error) {
            // Log but don't fail - escrow release is best effort
            console.error(`Failed to release escrow for bid ${bidId}:`, error);
            escrowAction = 'RELEASE_FAILED';
          }
        }
      }

      // 7. Create invalidation log (APPEND-ONLY audit trail)
      const invalidationLog = await tx.bidInvalidationLog.create({
        data: {
          bidId,
          auctionId: auction.id,
          disputeId,
          reason,
          previousStatus: previousStatus as any,
          escrowAction,
          escrowEntryId,
          actorId,
        },
      });

      // 8. Recompute auction ranking if needed
      // If the invalidated bid was the WINNING bid, find next highest valid bid
      let updatedAuction = auction;
      if (previousStatus === BidStatus.WINNING) {
        // Find next highest valid bid
        const nextHighestBid = await tx.bid.findFirst({
          where: {
            listingId: auction.id,
            status: { in: [BidStatus.ACTIVE, BidStatus.OUTBID] },
          },
          orderBy: { amount: 'desc' },
        });

        if (nextHighestBid) {
          // Update next highest bid to WINNING
          await tx.bid.update({
            where: { id: nextHighestBid.id },
            data: { status: BidStatus.WINNING },
          });

          // Update auction's current bid
          updatedAuction = await tx.listing.update({
            where: { id: auction.id },
            data: { currentBid: nextHighestBid.amount },
          });
        } else {
          // No valid bids remaining, reset to starting bid
          updatedAuction = await tx.listing.update({
            where: { id: auction.id },
            data: { currentBid: auction.startingBid },
          });
        }
      }

      // 9. ❌ Extension logic NOT re-triggered (per spec)

      return {
        bid: updatedBid,
        auction: updatedAuction,
        escrowReleased: escrowAction === 'RELEASED',
        escrowEntryId: escrowEntryId || undefined,
        invalidationLog,
      };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 10000,
    });
  }


  // ============================================================
  // VALIDATE SETTLEMENT
  // Settlement engine MUST call this before settling
  // ============================================================
  async validateSettlement(auctionId: number): Promise<SettlementValidation> {
    const errors: string[] = [];

    // 1. Get auction with all bids and disputes
    const auction = await prisma.listing.findUnique({
      where: { id: auctionId },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
        },
        disputes: {
          where: { status: DisputeStatus.OPEN },
        },
      },
    });

    if (!auction) {
      return {
        canSettle: false,
        openDisputes: 0,
        invalidatedBids: 0,
        highestValidBid: null,
        errors: ['Auction not found'],
      };
    }

    // 2. Check for OPEN disputes - BLOCKS settlement
    const openDisputes = auction.disputes.length;
    if (openDisputes > 0) {
      errors.push(`Cannot settle: ${openDisputes} open dispute(s) exist`);
    }

    // 3. Count invalidated bids
    const invalidatedBids = auction.bids.filter(
      (b) => b.status === BidStatus.INVALIDATED
    ).length;

    // 4. Find highest VALID bid (ignore INVALIDATED)
    const validBids = auction.bids.filter(
      (b) => b.status !== BidStatus.INVALIDATED && b.status !== BidStatus.CANCELLED
    );
    const highestValidBid = validBids.length > 0 ? validBids[0] : null;

    // 5. Verify auction state
    if (auction.status === ListingStatus.SOLD) {
      errors.push('Auction is already settled');
    }

    if (auction.status !== ListingStatus.ACTIVE && auction.status !== ListingStatus.ENDED) {
      errors.push(`Invalid auction status for settlement: ${auction.status}`);
    }

    return {
      canSettle: errors.length === 0,
      openDisputes,
      invalidatedBids,
      highestValidBid,
      errors,
    };
  }

  // ============================================================
  // GET DISPUTE
  // ============================================================
  async getDispute(disputeId: number) {
    return prisma.auctionDispute.findUnique({
      where: { id: disputeId },
      include: {
        auction: true,
        bid: {
          include: {
            bidder: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        resolutionLogs: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  // ============================================================
  // GET DISPUTES FOR AUCTION
  // ============================================================
  async getDisputesForAuction(auctionId: number, status?: DisputeStatus) {
    const where: any = { auctionId };
    if (status) {
      where.status = status;
    }

    return prisma.auctionDispute.findMany({
      where,
      include: {
        bid: {
          include: {
            bidder: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
        resolutionLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================================
  // GET INVALIDATION HISTORY FOR BID
  // ============================================================
  async getInvalidationHistory(bidId: number) {
    return prisma.bidInvalidationLog.findMany({
      where: { bidId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================================
  // GET ESCROW IMPACT PREVIEW
  // For Control Center - shows what would happen if bid is invalidated
  // ============================================================
  async getEscrowImpactPreview(bidId: number): Promise<{
    bidId: number;
    auctionId: number;
    bidAmount: string;
    bidStatus: string;
    auctionStatus: string;
    canInvalidate: boolean;
    escrowWouldBeReleased: boolean;
    warnings: string[];
  }> {
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { listing: true },
    });

    if (!bid) {
      throw new Error('Bid not found');
    }

    const warnings: string[] = [];
    let canInvalidate = true;
    let escrowWouldBeReleased = false;

    // Check if auction is settled
    if (bid.listing.status === ListingStatus.SOLD) {
      canInvalidate = false;
      warnings.push('BLOCKED: Auction is already settled. Invalidation forbidden.');
    }

    // Check if bid is already invalidated
    if (bid.status === BidStatus.INVALIDATED) {
      canInvalidate = false;
      warnings.push('Bid is already invalidated.');
    }

    // Check if bid is the winning bid
    if (bid.status === BidStatus.WINNING) {
      warnings.push('This is the current winning bid. Invalidation will recompute auction ranking.');
    }

    // Escrow would be released if auction is still open or ended but not settled
    if (bid.listing.status === ListingStatus.ACTIVE || bid.listing.status === ListingStatus.ENDED) {
      escrowWouldBeReleased = true;
    }

    return {
      bidId: bid.id,
      auctionId: bid.listingId,
      bidAmount: bid.amount.toString(),
      bidStatus: bid.status,
      auctionStatus: bid.listing.status,
      canInvalidate,
      escrowWouldBeReleased,
      warnings,
    };
  }

  // ============================================================
  // CHECK OPEN DISPUTES
  // Quick check for settlement engine
  // ============================================================
  async hasOpenDisputes(auctionId: number): Promise<boolean> {
    const count = await prisma.auctionDispute.count({
      where: {
        auctionId,
        status: DisputeStatus.OPEN,
      },
    });
    return count > 0;
  }

  // ============================================================
  // GET ALL OPEN DISPUTES (Admin/Control Center)
  // ============================================================
  async getAllOpenDisputes(limit: number = 50, offset: number = 0) {
    const [disputes, total] = await Promise.all([
      prisma.auctionDispute.findMany({
        where: { status: DisputeStatus.OPEN },
        include: {
          auction: {
            select: {
              id: true,
              title: true,
              status: true,
              auctionEndsAt: true,
            },
          },
          bid: {
            include: {
              bidder: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' }, // Oldest first
        take: limit,
        skip: offset,
      }),
      prisma.auctionDispute.count({
        where: { status: DisputeStatus.OPEN },
      }),
    ]);

    return {
      disputes,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + disputes.length < total,
      },
    };
  }
}

// Export singleton instance
export const disputeService = new DisputeService();
