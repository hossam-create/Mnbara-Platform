// Live Auction Manager
// Handles real-time auction functionality

import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';

interface AuctionData {
  streamId: string;
  title: string;
  description?: string;
  startingPrice: number;
  reservePrice?: number;
  minBidIncrement: number;
  duration: number; // minutes
  sellerId: string;
  productId?: string;
}

interface BidData {
  auctionId: string;
  amount: number;
  userId: string;
  userName?: string;
}

interface AuctionFilters {
  status?: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  sellerId?: string;
  streamId?: string;
  limit?: number;
  offset?: number;
}

export class LiveAuctionManager extends EventEmitter {
  private activeAuctions: Map<string, any> = new Map();
  private auctionTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private prisma: PrismaClient,
    private logger: Logger
  ) {
    super();
    this.loadActiveAuctions();
  }

  /**
   * Load active auctions from database
   */
  private async loadActiveAuctions(): Promise<void> {
    try {
      const activeAuctions = await this.prisma.liveAuction.findMany({
        where: { status: 'ACTIVE' }
      });

      for (const auction of activeAuctions) {
        this.activeAuctions.set(auction.id, auction);
        this.scheduleAuctionEnd(auction.id, auction.endTime);
      }

      this.logger.info(`Loaded ${activeAuctions.length} active auctions`);
    } catch (error) {
      this.logger.error('Failed to load active auctions', error);
    }
  }

  /**
   * Create a new auction
   */
  async createAuction(data: AuctionData): Promise<any> {
    try {
      const endTime = new Date(Date.now() + data.duration * 60 * 1000);
      
      const auction = await this.prisma.liveAuction.create({
        data: {
          streamId: data.streamId,
          title: data.title,
          description: data.description,
          startingPrice: data.startingPrice,
          reservePrice: data.reservePrice,
          minBidIncrement: data.minBidIncrement,
          currentPrice: data.startingPrice,
          endTime,
          sellerId: data.sellerId,
          productId: data.productId,
          status: 'SCHEDULED'
        },
        include: {
          seller: {
            select: { id: true, name: true, avatar: true }
          },
          bids: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      this.logger.info(`Created auction: ${auction.id} for stream: ${data.streamId}`);
      this.emit('auction-created', auction);

      return auction;
    } catch (error) {
      this.logger.error('Failed to create auction', error);
      throw new Error('Failed to create auction');
    }
  }

  /**
   * Start an auction
   */
  async startAuction(auctionId: string): Promise<any> {
    try {
      const auction = await this.prisma.liveAuction.update({
        where: { id: auctionId },
        data: { status: 'ACTIVE' },
        include: {
          seller: {
            select: { id: true, name: true, avatar: true }
          },
          bids: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      this.activeAuctions.set(auctionId, auction);
      this.scheduleAuctionEnd(auctionId, auction.endTime);

      this.logger.info(`Started auction: ${auctionId}`);
      this.emit('auction-started', auction);

      return auction;
    } catch (error) {
      this.logger.error('Failed to start auction', error);
      throw new Error('Failed to start auction');
    }
  }

  /**
   * Place a bid
   */
  async placeBid(data: BidData): Promise<any> {
    const { auctionId, amount, userId, userName } = data;

    try {
      const auction = await this.prisma.liveAuction.findUnique({
        where: { id: auctionId },
        include: { bids: { orderBy: { amount: 'desc' }, take: 1 } }
      });

      if (!auction) {
        throw new Error('Auction not found');
      }

      if (auction.status !== 'ACTIVE') {
        throw new Error('Auction is not active');
      }

      if (auction.endTime < new Date()) {
        throw new Error('Auction has ended');
      }

      // Validate bid amount
      const minBid = auction.currentPrice + auction.minBidIncrement;
      if (amount < minBid) {
        throw new Error(`Bid must be at least ${minBid}`);
      }

      // Create bid
      const bid = await this.prisma.liveBid.create({
        data: {
          auctionId,
          amount,
          userId,
          userName
        },
        include: {
          user: {
            select: { id: true, name: true, avatar: true }
          }
        }
      });

      // Update auction current price
      await this.prisma.liveAuction.update({
        where: { id: auctionId },
        data: { currentPrice: amount }
      });

      // Update active auction
      const activeAuction = this.activeAuctions.get(auctionId);
      if (activeAuction) {
        activeAuction.currentPrice = amount;
        activeAuction.bids = [bid];
      }

      this.logger.info(`Bid placed: ${amount} on auction ${auctionId} by user ${userId}`);
      this.emit('bid-placed', { auctionId, bid });

      return bid;
    } catch (error) {
      this.logger.error('Failed to place bid', error);
      throw error;
    }
  }

  /**
   * Get auction by ID
   */
  async getAuction(auctionId: string): Promise<any> {
    try {
      const auction = await this.prisma.liveAuction.findUnique({
        where: { id: auctionId },
        include: {
          seller: {
            select: { id: true, name: true, avatar: true }
          },
          bids: {
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: { id: true, name: true, avatar: true }
              }
            }
          },
          stream: {
            select: { id: true, title: true, status: true }
          }
        }
      });

      if (!auction) {
        throw new Error('Auction not found');
      }

      return auction;
    } catch (error) {
      this.logger.error('Failed to get auction', error);
      throw new Error('Failed to get auction');
    }
  }

  /**
   * List auctions with filters
   */
  async listAuctions(filters: AuctionFilters = {}): Promise<any[]> {
    try {
      const where: any = {};
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.sellerId) {
        where.sellerId = filters.sellerId;
      }
      
      if (filters.streamId) {
        where.streamId = filters.streamId;
      }

      const auctions = await this.prisma.liveAuction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
        include: {
          seller: {
            select: { id: true, name: true, avatar: true }
          },
          bids: {
            orderBy: { amount: 'desc' },
            take: 1
          }
        }
      });

      return auctions;
    } catch (error) {
      this.logger.error('Failed to list auctions', error);
      throw new Error('Failed to list auctions');
    }
  }

  /**
   * End an auction
   */
  async endAuction(auctionId: string): Promise<any> {
    try {
      const auction = await this.prisma.liveAuction.findUnique({
        where: { id: auctionId },
        include: {
          bids: {
            orderBy: { amount: 'desc' },
            take: 1
          }
        }
      });

      if (!auction) {
        throw new Error('Auction not found');
      }

      let status = 'ENDED';
      let winnerId = null;

      if (auction.bids.length > 0) {
        const highestBid = auction.bids[0];
        
        if (auction.reservePrice && highestBid.amount >= auction.reservePrice) {
          status = 'ENDED';
          winnerId = highestBid.userId;
        } else if (!auction.reservePrice) {
          status = 'ENDED';
          winnerId = highestBid.userId;
        }
      }

      const endedAuction = await this.prisma.liveAuction.update({
        where: { id: auctionId },
        data: { status, winnerId, endTime: new Date() },
        include: {
          seller: {
            select: { id: true, name: true, avatar: true }
          },
          bids: {
            orderBy: { amount: 'desc' },
            take: 1,
            include: {
              user: {
                select: { id: true, name: true, avatar: true }
              }
            }
          }
        }
      });

      this.activeAuctions.delete(auctionId);
      this.clearAuctionTimer(auctionId);

      this.logger.info(`Ended auction: ${auctionId}, winner: ${winnerId}`);
      this.emit('auction-ended', endedAuction);

      return endedAuction;
    } catch (error) {
      this.logger.error('Failed to end auction', error);
      throw new Error('Failed to end auction');
    }
  }

  /**
   * Cancel an auction
   */
  async cancelAuction(auctionId: string): Promise<any> {
    try {
      const auction = await this.prisma.liveAuction.update({
        where: { id: auctionId },
        data: { status: 'CANCELLED' },
        include: {
          seller: {
            select: { id: true, name: true, avatar: true }
          }
        }
      });

      this.activeAuctions.delete(auctionId);
      this.clearAuctionTimer(auctionId);

      this.logger.info(`Cancelled auction: ${auctionId}`);
      this.emit('auction-cancelled', auction);

      return auction;
    } catch (error) {
      this.logger.error('Failed to cancel auction', error);
      throw new Error('Failed to cancel auction');
    }
  }

  /**
   * Get auction statistics
   */
  async getAuctionStats(auctionId: string): Promise<any> {
    try {
      const [totalBids, uniqueBidders, bidHistory] = await Promise.all([
        this.prisma.liveBid.count({ where: { auctionId } }),
        this.prisma.liveBid.groupBy({
          by: ['userId'],
          where: { auctionId },
          _count: { userId: true }
        }),
        this.prisma.liveBid.findMany({
          where: { auctionId },
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        })
      ]);

      const priceProgression = bidHistory.map((bid, index) => ({
        bidNumber: index + 1,
        amount: bid.amount,
        timestamp: bid.createdAt,
        userName: bid.user.name
      }));

      return {
        totalBids,
        uniqueBidders: uniqueBidders.length,
        bidHistory,
        priceProgression
      };
    } catch (error) {
      this.logger.error('Failed to get auction stats', error);
      throw new Error('Failed to get auction stats');
    }
  }

  /**
   * Schedule auction end
   */
  private scheduleAuctionEnd(auctionId: string, endTime: Date): void {
    const now = new Date();
    const timeUntilEnd = endTime.getTime() - now.getTime();

    if (timeUntilEnd > 0) {
      const timer = setTimeout(async () => {
        try {
          await this.endAuction(auctionId);
        } catch (error) {
          this.logger.error(`Failed to auto-end auction ${auctionId}`, error);
        }
      }, timeUntilEnd);

      this.auctionTimers.set(auctionId, timer);
    }
  }

  /**
   * Clear auction timer
   */
  private clearAuctionTimer(auctionId: string): void {
    const timer = this.auctionTimers.get(auctionId);
    if (timer) {
      clearTimeout(timer);
      this.auctionTimers.delete(auctionId);
    }
  }

  /**
   * Get active auctions for a stream
   */
  async getStreamAuctions(streamId: string): Promise<any[]> {
    try {
      const auctions = await this.prisma.liveAuction.findMany({
        where: {
          streamId,
          status: 'ACTIVE'
        },
        include: {
          seller: {
            select: { id: true, name: true, avatar: true }
          },
          bids: {
            orderBy: { amount: 'desc' },
            take: 1
          }
        }
      });

      return auctions;
    } catch (error) {
      this.logger.error('Failed to get stream auctions', error);
      throw new Error('Failed to get stream auctions');
    }
  }
}