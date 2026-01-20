/**
 * PHASE 5.0 — AUCTION SERVICE
 * 
 * eBay-style auction engine with ZERO payment integration
 * 
 * ABSOLUTE RULES:
 * - NO wallet debits
 * - NO escrow creation
 * - NO payment processing
 * - Bids are append-only
 * - Winner determination ≠ settlement
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// TYPES
// ============================================================

export interface CreateAuctionParams {
  title: string;
  description: string;
  sellerId: string;
  sellerName?: string;
  startingBid: number;          // In minor units (e.g., 10000 = 100.00 EGP)
  reservePrice?: number;
  buyNowPrice?: number;
  startsAt: Date;
  endsAt: Date;
  currency?: string;
  category?: string;
  images?: string[];
  tags?: string[];
  minBidIncrement?: number;
  autoExtendConfig?: {
    enabled?: boolean;
    thresholdMs?: number;
    durationMs?: number;
    maxExtensions?: number;
  };
}

export interface PlaceBidParams {
  auctionId: string;
  bidderId: string;
  bidderName?: string;
  amount: number;               // In minor units
}

export interface PlaceBidResult {
  success: boolean;
  bid?: any;
  auction?: any;
  error?: string;
  wasExtended?: boolean;
  extensionInfo?: {
    previousEndTime: Date;
    newEndTime: Date;
    extensionNumber: number;
  };
}

// ============================================================
// AUCTION SERVICE
// ============================================================

export class AuctionService {
  
  /**
   * Create a new auction
   * 
   * Lifecycle: DRAFT → (publish) → SCHEDULED → (startsAt) → ACTIVE
   */
  async createAuction(params: CreateAuctionParams) {
    const {
      title,
      description,
      sellerId,
      sellerName,
      startingBid,
      reservePrice,
      buyNowPrice,
      startsAt,
      endsAt,
      currency = 'EGP',
      category,
      images = [],
      tags = [],
      minBidIncrement = 100,  // Default: 1.00 EGP
      autoExtendConfig = {}
    } = params;

    // Validation
    if (startingBid <= 0) {
      throw new Error('Starting bid must be greater than 0');
    }

    if (endsAt <= startsAt) {
      throw new Error('End time must be after start time');
    }

    if (startsAt <= new Date()) {
      throw new Error('Start time must be in the future');
    }

    if (reservePrice && reservePrice < startingBid) {
      throw new Error('Reserve price must be >= starting bid');
    }

    // Determine initial status
    const status = 'DRAFT'; // Seller must explicitly publish

    const auction = await prisma.auction.create({
      data: {
        title,
        description,
        sellerId,
        sellerName,
        startingBid: BigInt(startingBid),
        reservePrice: reservePrice ? BigInt(reservePrice) : null,
        buyNowPrice: buyNowPrice ? BigInt(buyNowPrice) : null,
        currentBid: BigInt(0),
        currency,
        startsAt,
        endsAt,
        originalEndsAt: endsAt,
        status,
        category,
        images,
        tags,
        minBidIncrement: BigInt(minBidIncrement),
        autoExtendEnabled: autoExtendConfig.enabled ?? true,
        autoExtendThresholdMs: autoExtendConfig.thresholdMs ?? 120000,
        autoExtendDurationMs: autoExtendConfig.durationMs ?? 120000,
        maxExtensions: autoExtendConfig.maxExtensions ?? 10,
      }
    });

    return this.serializeAuction(auction);
  }

  /**
   * Publish auction (DRAFT → SCHEDULED)
   */
  async publishAuction(auctionId: string) {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId }
    });

    if (!auction) {
      throw new Error('Auction not found');
    }

    if (auction.status !== 'DRAFT') {
      throw new Error('Only DRAFT auctions can be published');
    }

    const updated = await prisma.auction.update({
      where: { id: auctionId },
      data: { status: 'SCHEDULED' }
    });

    return this.serializeAuction(updated);
  }

  /**
   * Get auction by ID with bid count and time remaining
   */
  async getAuction(auctionId: string) {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        bids: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: { bids: true }
        }
      }
    });

    if (!auction) {
      return null;
    }

    const now = new Date();
    const timeRemainingMs = Math.max(0, auction.endsAt.getTime() - now.getTime());

    return {
      ...this.serializeAuction(auction),
      bidCount: auction._count.bids,
      timeRemainingMs,
      isEnding: timeRemainingMs > 0 && timeRemainingMs < 120000,
      hasEnded: timeRemainingMs === 0,
      highestBid: auction.bids[0] ? this.serializeBid(auction.bids[0]) : null
    };
  }

  /**
   * Get active auctions with filters
   */
  async getActiveAuctions(filters: {
    category?: string;
    status?: string[];
    endingSoon?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    const {
      category,
      status = ['ACTIVE'],
      endingSoon = false,
      limit = 20,
      offset = 0
    } = filters;

    const where: any = {
      status: { in: status }
    };

    if (category) {
      where.category = category;
    }

    if (endingSoon) {
      const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
      where.endsAt = {
        lte: twoHoursFromNow,
        gte: new Date()
      };
    }

    const auctions = await prisma.auction.findMany({
      where,
      orderBy: { endsAt: 'asc' },
      take: limit,
      skip: offset,
      include: {
        _count: {
          select: { bids: true }
        }
      }
    });

    return auctions.map(auction => ({
      ...this.serializeAuction(auction),
      bidCount: auction._count.bids
    }));
  }

  /**
   * Place a bid on an auction
   * 
   * PHASE 5.0: NO payment processing
   * - Validates bid amount
   * - Creates bid record
   * - Updates auction state
   * - Handles auto-extend
   * - Returns bid result
   * 
   * DOES NOT:
   * - Debit wallet
   * - Create escrow
   * - Process payment
   */
  async placeBid(params: PlaceBidParams): Promise<PlaceBidResult> {
    const { auctionId, bidderId, bidderName, amount } = params;

    return await prisma.$transaction(async (tx) => {
      // 1. Get auction with lock
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        include: {
          bids: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!auction) {
        return { success: false, error: 'Auction not found' };
      }

      // 2. Validate auction state
      if (auction.status !== 'ACTIVE') {
        return { success: false, error: 'Auction is not active' };
      }

      const now = new Date();
      if (now < auction.startsAt) {
        return { success: false, error: 'Auction has not started yet' };
      }

      if (now >= auction.endsAt) {
        return { success: false, error: 'Auction has ended' };
      }

      // 3. Validate bidder
      if (bidderId === auction.sellerId) {
        return { success: false, error: 'Seller cannot bid on their own auction' };
      }

      // 4. Validate bid amount
      const currentBid = Number(auction.currentBid);
      const minBidIncrement = Number(auction.minBidIncrement);
      const requiredBid = currentBid === 0 
        ? Number(auction.startingBid)
        : currentBid + minBidIncrement;

      if (amount < requiredBid) {
        return {
          success: false,
          error: `Bid must be at least ${requiredBid / 100} ${auction.currency}`
        };
      }

      // 5. Check if auto-extend should trigger
      let wasExtended = false;
      let extensionInfo: any = null;
      let newEndsAt = auction.endsAt;

      if (auction.autoExtendEnabled && auction.extensionCount < auction.maxExtensions) {
        const timeRemaining = auction.endsAt.getTime() - now.getTime();
        
        if (timeRemaining <= auction.autoExtendThresholdMs) {
          // Trigger extension
          const previousEndTime = auction.endsAt;
          newEndsAt = new Date(auction.endsAt.getTime() + auction.autoExtendDurationMs);
          wasExtended = true;

          extensionInfo = {
            previousEndTime,
            newEndTime: newEndsAt,
            extensionNumber: auction.extensionCount + 1
          };

          // Create extension record
          await tx.auctionExtension.create({
            data: {
              auctionId,
              previousEndTime,
              newEndTime: newEndsAt,
              extensionMs: auction.autoExtendDurationMs,
              extensionNumber: auction.extensionCount + 1,
              triggeredByUserId: bidderId
            }
          });
        }
      }

      // 6. Mark previous bids as OUTBID
      if (auction.bids.length > 0) {
        await tx.bid.updateMany({
          where: {
            auctionId,
            status: 'ACTIVE'
          },
          data: {
            status: 'OUTBID'
          }
        });
      }

      // 7. Create new bid
      const bid = await tx.bid.create({
        data: {
          auctionId,
          bidderId,
          bidderName,
          amount: BigInt(amount),
          status: 'ACTIVE',
          triggeredExtension: wasExtended
        }
      });

      // 8. Update auction
      const updatedAuction = await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentBid: BigInt(amount),
          endsAt: newEndsAt,
          extensionCount: wasExtended ? auction.extensionCount + 1 : auction.extensionCount
        }
      });

      // 9. Return result (NO payment processing)
      return {
        success: true,
        bid: this.serializeBid(bid),
        auction: this.serializeAuction(updatedAuction),
        wasExtended,
        extensionInfo
      };
    });
  }

  /**
   * Get bid history for an auction
   */
  async getBidHistory(auctionId: string, limit = 50, offset = 0) {
    const bids = await prisma.bid.findMany({
      where: { auctionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const totalCount = await prisma.bid.count({
      where: { auctionId }
    });

    return {
      bids: bids.map(bid => this.serializeBid(bid)),
      totalCount,
      page: Math.floor(offset / limit) + 1,
      limit
    };
  }

  /**
   * Start scheduled auctions (cron job)
   * SCHEDULED → ACTIVE when startsAt is reached
   */
  async startScheduledAuctions() {
    const now = new Date();

    const auctions = await prisma.auction.findMany({
      where: {
        status: 'SCHEDULED',
        startsAt: { lte: now }
      }
    });

    for (const auction of auctions) {
      await prisma.auction.update({
        where: { id: auction.id },
        data: { status: 'ACTIVE' }
      });
    }

    return auctions.length;
  }

  /**
   * End expired auctions (cron job)
   * ACTIVE → ENDED when endsAt is reached
   * 
   * PHASE 5.0: Only determines winner, NO payment processing
   */
  async endExpiredAuctions() {
    const now = new Date();

    const auctions = await prisma.auction.findMany({
      where: {
        status: 'ACTIVE',
        endsAt: { lte: now }
      },
      include: {
        bids: {
          where: { status: 'ACTIVE' },
          orderBy: { amount: 'desc' },
          take: 1
        }
      }
    });

    for (const auction of auctions) {
      const highestBid = auction.bids[0];

      // Determine winner
      let winnerId: string | null = null;
      let winnerName: string | null = null;
      let finalPrice: bigint | null = null;

      if (highestBid) {
        // Check if reserve price was met
        const reserveMet = !auction.reservePrice || 
                          highestBid.amount >= auction.reservePrice;

        if (reserveMet) {
          winnerId = highestBid.bidderId;
          winnerName = highestBid.bidderName;
          finalPrice = highestBid.amount;

          // Mark winning bid
          await prisma.bid.update({
            where: { id: highestBid.id },
            data: { status: 'WINNING' }
          });
        }
      }

      // Update auction status
      await prisma.auction.update({
        where: { id: auction.id },
        data: {
          status: 'ENDED',
          winnerId,
          winnerName,
          finalPrice
        }
      });
    }

    return auctions.length;
  }

  /**
   * Cancel auction (seller/admin only)
   */
  async cancelAuction(auctionId: string, reason?: string) {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        _count: {
          select: { bids: true }
        }
      }
    });

    if (!auction) {
      throw new Error('Auction not found');
    }

    if (auction.status === 'ENDED' || auction.status === 'CANCELLED') {
      throw new Error('Auction cannot be cancelled');
    }

    // If there are bids, require admin approval (future)
    if (auction._count.bids > 0) {
      // TODO: Implement admin approval workflow
      throw new Error('Auctions with bids require admin approval to cancel');
    }

    // Cancel all bids
    await prisma.bid.updateMany({
      where: { auctionId },
      data: { status: 'CANCELLED' }
    });

    // Cancel auction
    const updated = await prisma.auction.update({
      where: { id: auctionId },
      data: { status: 'CANCELLED' }
    });

    return this.serializeAuction(updated);
  }

  /**
   * Get extension history for an auction
   */
  async getExtensionHistory(auctionId: string) {
    const extensions = await prisma.auctionExtension.findMany({
      where: { auctionId },
      orderBy: { createdAt: 'asc' }
    });

    return extensions;
  }

  // ============================================================
  // SERIALIZATION HELPERS
  // Convert BigInt to number for JSON serialization
  // ============================================================

  private serializeAuction(auction: any) {
    return {
      ...auction,
      startingBid: Number(auction.startingBid),
      reservePrice: auction.reservePrice ? Number(auction.reservePrice) : null,
      buyNowPrice: auction.buyNowPrice ? Number(auction.buyNowPrice) : null,
      currentBid: Number(auction.currentBid),
      minBidIncrement: Number(auction.minBidIncrement),
      finalPrice: auction.finalPrice ? Number(auction.finalPrice) : null
    };
  }

  private serializeBid(bid: any) {
    return {
      ...bid,
      amount: Number(bid.amount),
      maxAmount: bid.maxAmount ? Number(bid.maxAmount) : null
    };
  }
}

// ============================================================
// EXPORT
// ============================================================

export default new AuctionService();
