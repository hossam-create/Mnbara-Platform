/**
 * Real-Time Bid Service
 * 
 * Handles real-time bidding with:
 * - Concurrency control (database locking)
 * - Anti-sniping (automatic time extension)
 * - Idempotency (duplicate prevention)
 * - WebSocket notifications
 * 
 * Adapted from: Real-Time-Bike-Auction-System-Backend/src/services/bidService.js
 */

import { Decimal } from '@prisma/client/runtime/library';
import { getPrismaClient } from '../lib/prisma';

// Anti-sniping configuration
const EXTENSION_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
const EXTENSION_TIME_MS = 2 * 60 * 1000;   // 2 minutes

interface PlaceBidDto {
  listingId: number;
  bidderId: number;
  amount: number;
  idempotencyKey?: string;
}

interface PlaceBidResult {
  bid: any;
  auction: any;
  extended: boolean;
  previousBidderId?: number;
  status: 'NEW' | 'EXISTING';
}

class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export class RealtimeBidService {
  private prisma = getPrismaClient();

  constructor() {}

  /**
   * Place a bid with real-time updates and anti-sniping
   * 
   * @param dto - Bid placement data
   * @returns Bid result with extension info
   */
  async placeBid(dto: PlaceBidDto): Promise<PlaceBidResult> {
    // 1. Idempotency Check
    if (dto.idempotencyKey) {
      const existingBid = await this.prisma.bid.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: {
          listing: true,
          bidder: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      if (existingBid) {
        console.log(`Idempotent bid detected: ${dto.idempotencyKey}`);
        return {
          bid: existingBid,
          auction: existingBid.listing,
          extended: false,
          status: 'EXISTING',
        };
      }
    }

    // 2. Transaction for Concurrency Safety
    return await this.prisma.$transaction(async (tx) => {
      // Lock the listing row to prevent race conditions
      const listing = await tx.listing.findUnique({
        where: { id: dto.listingId },
        include: {
          seller: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      if (!listing) {
        throw new BadRequestError('Auction not found');
      }

      const now = new Date();

      // 3. Validations
      // Check if auction
      if (!listing.isAuction) {
        throw new BadRequestError('This is not an auction listing');
      }

      // Check status
      if (listing.status !== 'ACTIVE') {
        throw new BadRequestError(
          `Auction is not active (Status: ${listing.status})`,
        );
      }

      // Check time window
      if (
        !listing.auctionStartsAt ||
        !listing.auctionEndsAt ||
        listing.auctionStartsAt > now ||
        listing.auctionEndsAt < now
      ) {
        throw new BadRequestError('Bidding window is closed');
      }

      // Check self-bidding
      if (listing.sellerId === dto.bidderId) {
        throw new BadRequestError(
          'Sellers cannot bid on their own auctions',
        );
      }

      // Check bid amount
      const bidCount = await tx.bid.count({
        where: {
          listingId: dto.listingId,
          status: 'ACTIVE',
        },
      });

      let minRequired: Decimal;
      if (bidCount === 0) {
        // First bid must be >= starting bid
        minRequired = listing.startingBid || new Decimal(0);
      } else {
        // Subsequent bids must be >= current + increment
        const currentBid = listing.currentBid || listing.startingBid || new Decimal(0);
        const increment = listing.minBidIncrement || new Decimal(1);
        minRequired = new Decimal(currentBid).add(increment);
      }

      if (new Decimal(dto.amount).lessThan(minRequired)) {
        throw new BadRequestError(
          `Bid too low. Minimum valid bid is ${minRequired.toString()}`,
        );
      }

      // Get previous highest bid for outbid notification
      const previousBid = await tx.bid.findFirst({
        where: {
          listingId: dto.listingId,
          status: 'ACTIVE',
        },
        orderBy: { amount: 'desc' },
        include: {
          bidder: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      // 4. Mark previous winning bid as not winning
      if (previousBid) {
        await tx.bid.update({
          where: { id: previousBid.id },
          data: { isWinning: false },
        });
      }

      // 5. Create new bid
      const newBid = await tx.bid.create({
        data: {
          amount: new Decimal(dto.amount),
          listingId: dto.listingId,
          bidderId: dto.bidderId,
          status: 'ACTIVE',
          idempotencyKey: dto.idempotencyKey,
          isWinning: true,
          triggeredExtension: false, // Will update if extension happens
        },
        include: {
          bidder: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });

      // 6. Update listing and check anti-sniping
      const updates: any = {
        currentBid: new Decimal(dto.amount),
      };

      let extended = false;
      let newEndTime = listing.auctionEndsAt;

      // Anti-Sniping check
      if (
        listing.autoExtendEnabled &&
        listing.auctionEndsAt &&
        listing.extensionCount < (listing.maxExtensions || 10)
      ) {
        const timeRemaining =
          listing.auctionEndsAt.getTime() - now.getTime();
        const threshold = listing.autoExtendThresholdMs || EXTENSION_WINDOW_MS;

        if (timeRemaining < threshold && timeRemaining > 0) {
          // Trigger extension
          const extensionDuration =
            listing.autoExtendDurationMs || EXTENSION_TIME_MS;
          newEndTime = new Date(
            listing.auctionEndsAt.getTime() + extensionDuration,
          );

          updates.auctionEndsAt = newEndTime;
          updates.extensionCount = (listing.extensionCount || 0) + 1;
          
          // Store original end time if first extension
          if (!listing.originalEndTime) {
            updates.originalEndTime = listing.auctionEndsAt;
          }

          extended = true;

          // Update bid to mark it triggered extension
          await tx.bid.update({
            where: { id: newBid.id },
            data: { triggeredExtension: true },
          });

          // Log extension
          await tx.auctionExtension.create({
            data: {
              listingId: dto.listingId,
              previousEndTime: listing.auctionEndsAt,
              newEndTime: newEndTime,
              extensionMs: extensionDuration,
              triggeredByBidId: newBid.id,
              extensionNumber: updates.extensionCount,
            },
          });

          console.log(
            `Anti-sniping triggered for auction ${dto.listingId}. ` +
            `Extended by ${extensionDuration}ms. ` +
            `Extension count: ${updates.extensionCount}`,
          );
        }
      }

      // Update listing
      const updatedListing = await tx.listing.update({
        where: { id: dto.listingId },
        data: updates,
        include: {
          _count: { select: { bids: true } },
        },
      });

      // 7. Return result (WebSocket notifications handled by controller)
      return {
        bid: newBid,
        auction: updatedListing,
        extended,
        previousBidderId: previousBid?.bidderId,
        status: 'NEW' as const,
      };
    });
  }

  /**
   * Get bid history for an auction
   * 
   * @param listingId - Auction ID
   * @returns List of bids
   */
  async getBidHistory(listingId: number) {
    return await this.prisma.bid.findMany({
      where: {
        listingId,
        status: 'ACTIVE',
      },
      orderBy: { amount: 'desc' },
      include: {
        bidder: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Get current winning bid
   * 
   * @param listingId - Auction ID
   * @returns Winning bid or null
   */
  async getWinningBid(listingId: number) {
    return await this.prisma.bid.findFirst({
      where: {
        listingId,
        status: 'ACTIVE',
        isWinning: true,
      },
      include: {
        bidder: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }
}
