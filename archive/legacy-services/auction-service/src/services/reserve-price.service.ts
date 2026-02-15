// ============================================================
// PHASE 5.3 — Reserve Price & Hidden Minimums Service
// 
// CRITICAL RULES:
// ❌ FORBIDDEN: Revealing reserve price to frontend
// ❌ FORBIDDEN: Editing reserve after auction starts
// ❌ FORBIDDEN: Auto-raising bids to meet reserve
// ❌ FORBIDDEN: Fake system bids
// ❌ FORBIDDEN: Allowing settlement below reserve
// ❌ FORBIDDEN: Cancelling escrow silently
// ❌ FORBIDDEN: Using reserve to reorder bids
// 
// ✅ REQUIRED: Reserve evaluated ONLY at settlement
// ✅ REQUIRED: All bids remain valid regardless of reserve
// ✅ REQUIRED: Escrow HOLDs remain intact until resolution
// ✅ REQUIRED: Failure to meet reserve = NO SALE
// ✅ REQUIRED: Full audit logging
// ============================================================

import { PrismaClient, Prisma } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Enums
export enum AuctionEndReason {
  NORMAL = 'NORMAL',
  RESERVE_NOT_MET = 'RESERVE_NOT_MET',
  CANCELLED = 'CANCELLED',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  ENDED_UNMET_RESERVE = 'ENDED_UNMET_RESERVE',
  ENDED_AWAITING_SETTLEMENT = 'ENDED_AWAITING_SETTLEMENT',
  SETTLED = 'SETTLED',
  CANCELLED = 'CANCELLED',
  DELETED = 'DELETED',
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

// Type for Prisma transaction client
type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

// ============================================================
// INTERFACES
// ============================================================

export interface SetReservePriceParams {
  auctionId: number;
  reservePrice: number;
  encryptionKey: string; // From environment
}

export interface SettlementValidationParams {
  auctionId: number;
  highestValidBidAmount: number | null;
  highestValidBidId: number | null;
}

export interface SettlementOutcome {
  auctionId: number;
  reserveMet: boolean;
  endedReason: AuctionEndReason;
  winnerId: number | null;
  finalPrice: number | null;
  escrowsToRelease: Array<{
    bidId: number;
    bidderId: number;
    amount: number;
  }>;
}

export interface ReleaseEscrowParams {
  auctionId: number;
  bidId: number;
  bidderId: number;
  escrowAmount: number;
  releaseReason: string;
  ledgerEntryId?: string;
  releasedBy: string;
}

// ============================================================
// RESERVE PRICE SERVICE
// ============================================================

export class ReservePriceService {
  private encryptionKey: string;

  constructor(encryptionKey?: string) {
    this.encryptionKey = encryptionKey || process.env.RESERVE_ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  // ============================================================
  // ENCRYPT RESERVE PRICE
  // Store encrypted at rest
  // ============================================================
  private encryptReservePrice(reservePrice: number): { encrypted: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey.padEnd(32, '0').slice(0, 32)),
      iv
    );

    let encrypted = cipher.update(reservePrice.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
    };
  }

  // ============================================================
  // DECRYPT RESERVE PRICE
  // Only for internal settlement logic
  // ============================================================
  private decryptReservePrice(encrypted: string, iv: string): number {
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.encryptionKey.padEnd(32, '0').slice(0, 32)),
      Buffer.from(iv, 'hex')
    );

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return parseFloat(decrypted);
  }

  // ============================================================
  // SET RESERVE PRICE
  // ONLY at auction creation (DRAFT state)
  // ❌ FORBIDDEN: Editing after LIVE
  // ============================================================
  async setReservePrice(params: SetReservePriceParams): Promise<void> {
    const { auctionId, reservePrice, encryptionKey } = params;

    // Validate reserve price
    if (!Number.isFinite(reservePrice) || reservePrice <= 0) {
      throw new Error('Invalid reserve price');
    }

    // Get auction
    const auction = await prisma.listing.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      throw new Error('Auction not found');
    }

    // ❌ FORBIDDEN: Cannot edit reserve after auction goes LIVE
    if (auction.status !== ListingStatus.DRAFT && auction.status !== ListingStatus.SCHEDULED) {
      throw new Error(
        `FORBIDDEN: Cannot set reserve price after auction is ${auction.status}. ` +
        `Reserve price must be set at creation time.`
      );
    }

    // Encrypt reserve price
    const { encrypted, iv } = this.encryptReservePrice(reservePrice);

    // Store encrypted
    await prisma.listing.update({
      where: { id: auctionId },
      data: {
        reservePriceEncrypted: encrypted,
        reservePriceIV: iv,
        reserveSetAt: new Date(),
      },
    });
  }

  // ============================================================
  // GET RESERVE PRICE (INTERNAL ONLY)
  // Never expose to frontend
  // ============================================================
  async getReservePriceInternal(auctionId: number): Promise<number | null> {
    const auction = await prisma.listing.findUnique({
      where: { id: auctionId },
      select: {
        reservePriceEncrypted: true,
        reservePriceIV: true,
      },
    });

    if (!auction || !auction.reservePriceEncrypted || !auction.reservePriceIV) {
      return null;
    }

    try {
      return this.decryptReservePrice(auction.reservePriceEncrypted, auction.reservePriceIV);
    } catch (error) {
      console.error(`Failed to decrypt reserve price for auction ${auctionId}:`, error);
      return null;
    }
  }

  // ============================================================
  // VALIDATE SETTLEMENT
  // Check if highest bid meets reserve
  // ============================================================
  async validateSettlement(params: SettlementValidationParams): Promise<{
    reserveMet: boolean;
    reservePrice: number | null;
    highestValidBidAmount: number | null;
  }> {
    const { auctionId, highestValidBidAmount } = params;

    // Get reserve price (internal only)
    const reservePrice = await this.getReservePriceInternal(auctionId);

    // If no reserve set, auction always meets reserve
    if (reservePrice === null) {
      return {
        reserveMet: true,
        reservePrice: null,
        highestValidBidAmount,
      };
    }

    // If no valid bids, reserve not met
    if (highestValidBidAmount === null) {
      return {
        reserveMet: false,
        reservePrice,
        highestValidBidAmount: null,
      };
    }

    // Compare highest bid to reserve
    const reserveMet = highestValidBidAmount >= reservePrice;

    return {
      reserveMet,
      reservePrice,
      highestValidBidAmount,
    };
  }

  // ============================================================
  // COMPUTE SETTLEMENT OUTCOME
  // Determine winner and escrow handling
  // ============================================================
  async computeSettlementOutcome(
    auctionId: number,
    highestValidBidId: number | null,
    highestValidBidAmount: number | null
  ): Promise<SettlementOutcome> {
    // Validate settlement
    const validation = await this.validateSettlement({
      auctionId,
      highestValidBidAmount,
      highestValidBidId,
    });

    // Get all bids for escrow handling
    const allBids = await prisma.bid.findMany({
      where: { listingId: auctionId },
      include: { bidder: true },
    });

    // Determine escrows to release
    const escrowsToRelease: SettlementOutcome['escrowsToRelease'] = [];

    if (!validation.reserveMet) {
      // ❌ Reserve NOT met: Release ALL escrows
      for (const bid of allBids) {
        if (bid.status !== BidStatus.CANCELLED && bid.status !== BidStatus.INVALIDATED) {
          escrowsToRelease.push({
            bidId: bid.id,
            bidderId: bid.bidderId,
            amount: Number(bid.amount),
          });
        }
      }
    } else {
      // ✅ Reserve met: Release only loser escrows
      for (const bid of allBids) {
        // Skip winner, cancelled, and invalidated bids
        if (bid.id === highestValidBidId || bid.status === BidStatus.CANCELLED || bid.status === BidStatus.INVALIDATED) {
          continue;
        }
        escrowsToRelease.push({
          bidId: bid.id,
          bidderId: bid.bidderId,
          amount: Number(bid.amount),
        });
      }
    }

    return {
      auctionId,
      reserveMet: validation.reserveMet,
      endedReason: validation.reserveMet ? AuctionEndReason.NORMAL : AuctionEndReason.RESERVE_NOT_MET,
      winnerId: validation.reserveMet && highestValidBidId ? allBids.find((b) => b.id === highestValidBidId)?.bidderId || null : null,
      finalPrice: validation.reserveMet && highestValidBidAmount ? highestValidBidAmount : null,
      escrowsToRelease,
    };
  }

  // ============================================================
  // LOG SETTLEMENT OUTCOME
  // APPEND-ONLY audit trail
  // ============================================================
  async logSettlementOutcome(
    auctionId: number,
    outcome: SettlementOutcome,
    tx?: TransactionClient
  ): Promise<void> {
    const reservePrice = await this.getReservePriceInternal(auctionId);

    const logData = {
      auctionId,
      highestValidBidId: outcome.escrowsToRelease.length > 0 ? outcome.escrowsToRelease[0]?.bidId || null : null,
      highestValidBidAmount: outcome.finalPrice,
      reservePrice,
      reserveMet: outcome.reserveMet,
      endedReason: outcome.endedReason,
      winnerId: outcome.winnerId,
      finalPrice: outcome.finalPrice,
      invalidatedBidsCount: 0, // Would be computed from disputes
      totalBidsCount: (await prisma.bid.count({ where: { listingId: auctionId } })),
      escrowsReleasedCount: outcome.escrowsToRelease.length,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };

    if (tx) {
      await tx.settlementOutcomeLog.create({ data: logData });
    } else {
      await prisma.settlementOutcomeLog.create({ data: logData });
    }
  }

  // ============================================================
  // RELEASE ESCROW
  // APPEND-ONLY escrow release log
  // ============================================================
  async releaseEscrow(params: ReleaseEscrowParams, tx?: TransactionClient): Promise<void> {
    const { auctionId, bidId, bidderId, escrowAmount, releaseReason, ledgerEntryId, releasedBy } = params;

    const logData = {
      auctionId,
      bidId,
      bidderId,
      escrowAmount,
      releaseReason,
      ledgerEntryId,
      releasedBy,
    };

    if (tx) {
      await tx.escrowReleaseLog.create({ data: logData });
    } else {
      await prisma.escrowReleaseLog.create({ data: logData });
    }
  }

  // ============================================================
  // GET SETTLEMENT OUTCOME LOG
  // For audit and control center
  // ============================================================
  async getSettlementOutcomeLog(auctionId: number) {
    return prisma.settlementOutcomeLog.findFirst({
      where: { auctionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================================
  // GET ESCROW RELEASE LOGS
  // For audit trail
  // ============================================================
  async getEscrowReleaseLogs(auctionId: number) {
    return prisma.escrowReleaseLog.findMany({
      where: { auctionId },
      orderBy: { releasedAt: 'asc' },
    });
  }

  // ============================================================
  // RESTART AUCTION
  // Create new auction with same details but new ID
  // ============================================================
  async restartAuction(auctionId: number, restartedBy: string): Promise<number> {
    return await prisma.$transaction(async (tx: TransactionClient) => {
      // Get original auction
      const original = await tx.listing.findUnique({
        where: { id: auctionId },
      });

      if (!original) {
        throw new Error('Auction not found');
      }

      if (original.status !== ListingStatus.ENDED_UNMET_RESERVE) {
        throw new Error(
          `Cannot restart auction with status ${original.status}. ` +
          `Only ENDED_UNMET_RESERVE auctions can be restarted.`
        );
      }

      // Create new auction with same details
      const newAuction = await tx.listing.create({
        data: {
          title: original.title,
          description: original.description,
          sellerId: original.sellerId,
          price: original.price,
          currency: original.currency,
          isAuction: true,
          startingBid: original.startingBid,
          reservePriceEncrypted: original.reservePriceEncrypted, // Copy encrypted reserve
          reservePriceIV: original.reservePriceIV,
          buyNowPrice: original.buyNowPrice,
          currentBid: original.startingBid,
          auctionEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          auctionStartsAt: new Date(),
          autoExtendEnabled: original.autoExtendEnabled,
          autoExtendThresholdMs: original.autoExtendThresholdMs,
          autoExtendDurationMs: original.autoExtendDurationMs,
          maxExtensions: original.maxExtensions,
          minBidIncrement: original.minBidIncrement,
          status: ListingStatus.ACTIVE,
        },
      });

      // Log restart
      console.log(`[RESTART] Auction ${auctionId} restarted as new auction ${newAuction.id} by ${restartedBy}`);

      return newAuction.id;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 10000,
    });
  }

  // ============================================================
  // VERIFY NO RESERVE LEAKS
  // Security check - ensure reserve not exposed
  // ============================================================
  async verifyNoReserveLeaks(auctionId: number): Promise<boolean> {
    const auction = await prisma.listing.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      return true; // Auction doesn't exist, no leak
    }

    // Check that reserve is encrypted
    if (auction.reservePriceEncrypted && !auction.reservePriceIV) {
      console.warn(`[SECURITY] Auction ${auctionId} has encrypted reserve but missing IV`);
      return false;
    }

    // Check that reserve is not in plaintext
    // (This would be caught by schema validation, but double-check)
    if ((auction as any).reservePrice !== undefined) {
      console.warn(`[SECURITY] Auction ${auctionId} has plaintext reserve price field`);
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const reservePriceService = new ReservePriceService();
