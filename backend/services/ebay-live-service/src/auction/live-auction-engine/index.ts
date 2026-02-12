import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { CustomError } from '@/utils/error-handler';
import { LiveAuction, AuctionItem, AuctionBid, AuctionStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export interface AuctionEngineConfig {
  minBidIncrement: number;
  autoExtendTime: number;
  reservePriceCheck: boolean;
  paymentTimeout: number;
  maxBidsPerUser: number;
  antiSnipeTime: number;
  enableProxyBidding: boolean;
  enableAutoRelist: boolean;
}

export interface BidValidation {
  valid: boolean;
  reason?: string;
  minBid?: number;
  currentBid?: number;
}

export interface AuctionResult {
  auction: LiveAuction;
  winner?: {
    userId: string;
    username: string;
    finalBid: number;
  };
  totalBids: number;
  finalPrice: number;
  endedAt: Date;
  status: 'sold' | 'reserve_not_met' | 'no_bids';
}

export class LiveAuctionEngine extends EventEmitter {
  private auctions: Map<string, LiveAuction> = new Map();
  private activeAuctions: Map<string, string> = new Map(); // streamId -> auctionId
  private bids: Map<string, AuctionBid[]> = new Map();
  private bidders: Map<string, Set<string>> = new Map(); // auctionId -> Set<userId>
  private paymentTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private config: AuctionEngineConfig;
  private running: boolean = false;

  constructor(config?: Partial<AuctionEngineConfig>) {
    super();
    
    this.config = {
      minBidIncrement: config?.minBidIncrement || 1.0,
      autoExtendTime: config?.autoExtendTime || 300000, // 5 minutes
      reservePriceCheck: config?.reservePriceCheck !== false,
      paymentTimeout: config?.paymentTimeout || 1800000, // 30 minutes
      maxBidsPerUser: config?.maxBidsPerUser || 10,
      antiSnipeTime: config?.antiSnipeTime || 60000, // 1 minute
      enableProxyBidding: config?.enableProxyBidding !== false,
      enableAutoRelist: config?.enableAutoRelist !== false
    };

    this.startAuctionMonitor();
  }

  public async createAuction(
    streamId: string,
    item: AuctionItem,
    startPrice: number,
    duration: number,
    options?: {
      reservePrice?: number;
      minBidIncrement?: number;
      startTime?: Date;
      sellerId?: string;
      sellerName?: string;
    }
  ): Promise<LiveAuction> {
    try {
      // Check if there's already an active auction for this stream
      if (this.activeAuctions.has(streamId)) {
        throw new CustomError('Active auction already exists for this stream', 409);
      }

      const auction: LiveAuction = {
        id: uuidv4(),
        streamId,
        item,
        status: AuctionStatus.SCHEDULED,
        startPrice,
        currentBid: startPrice,
        reservePrice: options?.reservePrice,
        minBidIncrement: options?.minBidIncrement || this.config.minBidIncrement,
        startTime: options?.startTime || new Date(Date.now() + 60000), // Start in 1 minute
        endTime: new Date((options?.startTime?.getTime() || Date.now()) + duration),
        duration,
        bidCount: 0,
        participantCount: 0,
        sellerId: options?.sellerId,
        sellerName: options?.sellerName,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.auctions.set(auction.id, auction);
      this.bids.set(auction.id, []);
      this.bidders.set(auction.id, new Set());

      logger.info(`Auction created: ${auction.id} for stream ${streamId}`);
      
      this.emit('auction-created', { auction });
      
      return auction;
    } catch (error) {
      logger.error('Failed to create auction:', error);
      throw error;
    }
  }

  public async startAuction(auctionId: string): Promise<LiveAuction> {
    try {
      const auction = this.auctions.get(auctionId);
      if (!auction) {
        throw new CustomError('Auction not found', 404);
      }

      if (auction.status !== AuctionStatus.SCHEDULED) {
        throw new CustomError('Auction is not in scheduled status', 400);
      }

      auction.status = AuctionStatus.ACTIVE;
      auction.startTime = new Date();
      auction.updatedAt = new Date();

      // Set as active auction for stream
      this.activeAuctions.set(auction.streamId, auction.id);

      logger.info(`Auction started: ${auctionId}`);
      
      this.emit('auction-started', { auction });
      
      return auction;
    } catch (error) {
      logger.error('Failed to start auction:', error);
      throw error;
    }
  }

  public async placeBid(
    auctionId: string,
    userId: string,
    username: string,
    amount: number,
    options?: {
      maxProxyBid?: number;
      autoBid?: boolean;
    }
  ): Promise<AuctionBid> {
    try {
      const auction = this.auctions.get(auctionId);
      if (!auction) {
        throw new CustomError('Auction not found', 404);
      }

      if (auction.status !== AuctionStatus.ACTIVE) {
        throw new CustomError('Auction is not active', 400);
      }

      if (auction.endTime && new Date() > auction.endTime) {
        throw new CustomError('Auction has ended', 400);
      }

      // Validate bid
      const validation = this.validateBid(auction, amount, userId);
      if (!validation.valid) {
        throw new CustomError(validation.reason || 'Invalid bid', 400);
      }

      // Check if user has exceeded max bids
      const userBids = this.bids.get(auctionId)?.filter(b => b.userId === userId) || [];
      if (userBids.length >= this.config.maxBidsPerUser) {
        throw new CustomError('Maximum bids per user exceeded', 400);
      }

      // Create bid
      const bid: AuctionBid = {
        id: uuidv4(),
        auctionId,
        userId,
        username,
        amount,
        maxProxyBid: options?.maxProxyBid,
        timestamp: new Date(),
        isWinning: true,
        isAutoBid: options?.autoBid || false,
        metadata: {}
      };

      // Update previous winning bid
      const previousBids = this.bids.get(auctionId) || [];
      previousBids.forEach(b => {
        b.isWinning = false;
      });

      // Add new bid
      previousBids.push(bid);
      this.bids.set(auctionId, previousBids);

      // Update auction
      auction.currentBid = amount;
      auction.bidCount++;
      auction.updatedAt = new Date();

      // Add user to bidders
      const bidders = this.bidders.get(auctionId) || new Set();
      bidders.add(userId);
      this.bidders.set(auctionId, bidders);
      auction.participantCount = bidders.size;

      // Handle anti-snipe
      this.handleAntiSnipe(auction);

      // Handle proxy bidding
      if (this.config.enableProxyBidding && options?.maxProxyBid) {
        await this.handleProxyBidding(auction, bid);
      }

      logger.info(`Bid placed: ${bid.id} for auction ${auctionId} - $${amount}`);
      
      this.emit('bid-placed', { bid, auction });
      
      return bid;
    } catch (error) {
      logger.error('Failed to place bid:', error);
      throw error;
    }
  }

  public async endAuction(auctionId: string): Promise<AuctionResult> {
    try {
      const auction = this.auctions.get(auctionId);
      if (!auction) {
        throw new CustomError('Auction not found', 404);
      }

      if (auction.status !== AuctionStatus.ACTIVE) {
        throw new CustomError('Auction is not active', 400);
      }

      auction.status = AuctionStatus.ENDED;
      auction.endTime = new Date();
      auction.updatedAt = new Date();

      // Remove from active auctions
      this.activeAuctions.delete(auction.streamId);

      // Determine result
      const bids = this.bids.get(auctionId) || [];
      const winningBid = bids.find(b => b.isWinning);
      
      let result: AuctionResult;
      
      if (!winningBid) {
        result = {
          auction,
          totalBids: bids.length,
          finalPrice: auction.startPrice,
          endedAt: auction.endTime,
          status: 'no_bids'
        };
      } else if (this.config.reservePriceCheck && auction.reservePrice && winningBid.amount < auction.reservePrice) {
        result = {
          auction,
          winner: {
            userId: winningBid.userId,
            username: winningBid.username,
            finalBid: winningBid.amount
          },
          totalBids: bids.length,
          finalPrice: winningBid.amount,
          endedAt: auction.endTime,
          status: 'reserve_not_met'
        };
      } else {
        result = {
          auction,
          winner: {
            userId: winningBid.userId,
            username: winningBid.username,
            finalBid: winningBid.amount
          },
          totalBids: bids.length,
          finalPrice: winningBid.amount,
          endedAt: auction.endTime,
          status: 'sold'
        };

        // Start payment timeout
        this.startPaymentTimeout(auctionId, winningBid.userId);
      }

      logger.info(`Auction ended: ${auctionId} - Status: ${result.status}`);
      
      this.emit('auction-ended', { result });
      
      return result;
    } catch (error) {
      logger.error('Failed to end auction:', error);
      throw error;
    }
  }

  public async cancelAuction(auctionId: string, reason?: string): Promise<LiveAuction> {
    try {
      const auction = this.auctions.get(auctionId);
      if (!auction) {
        throw new CustomError('Auction not found', 404);
      }

      if (auction.status === AuctionStatus.ENDED || auction.status === AuctionStatus.CANCELLED) {
        throw new CustomError('Auction cannot be cancelled', 400);
      }

      auction.status = AuctionStatus.CANCELLED;
      auction.updatedAt = new Date();

      // Remove from active auctions
      this.activeAuctions.delete(auction.streamId);

      // Clear payment timeout if exists
      const timeout = this.paymentTimeouts.get(auctionId);
      if (timeout) {
        clearTimeout(timeout);
        this.paymentTimeouts.delete(auctionId);
      }

      logger.info(`Auction cancelled: ${auctionId} - Reason: ${reason || 'No reason provided'}`);
      
      this.emit('auction-cancelled', { auction, reason });
      
      return auction;
    } catch (error) {
      logger.error('Failed to cancel auction:', error);
      throw error;
    }
  }

  public getAuction(auctionId: string): LiveAuction | undefined {
    return this.auctions.get(auctionId);
  }

  public getActiveAuction(streamId: string): LiveAuction | undefined {
    const auctionId = this.activeAuctions.get(streamId);
    return auctionId ? this.auctions.get(auctionId) : undefined;
  }

  public getBids(auctionId: string): AuctionBid[] {
    return this.bids.get(auctionId) || [];
  }

  public getWinningBid(auctionId: string): AuctionBid | undefined {
    const bids = this.bids.get(auctionId) || [];
    return bids.find(b => b.isWinning);
  }

  public getAuctionsByStream(streamId: string): LiveAuction[] {
    return Array.from(this.auctions.values()).filter(a => a.streamId === streamId);
  }

  public getAllActiveAuctions(): LiveAuction[] {
    return Array.from(this.auctions.values()).filter(a => a.status === AuctionStatus.ACTIVE);
  }

  private validateBid(auction: LiveAuction, amount: number, userId: string): BidValidation {
    if (amount <= 0) {
      return { valid: false, reason: 'Bid amount must be positive' };
    }

    if (amount < auction.startPrice) {
      return { valid: false, reason: 'Bid must be at least the starting price' };
    }

    if (amount <= auction.currentBid) {
      return { valid: false, reason: 'Bid must be higher than current bid' };
    }

    const minBid = auction.currentBid + auction.minBidIncrement;
    if (amount < minBid) {
      return { 
        valid: false, 
        reason: `Bid must be at least $${minBid.toFixed(2)}`,
        minBid
      };
    }

    return { valid: true };
  }

  private handleAntiSnipe(auction: LiveAuction): void {
    if (this.config.antiSnipeTime > 0) {
      const timeUntilEnd = auction.endTime.getTime() - Date.now();
      
      if (timeUntilEnd < this.config.antiSnipeTime) {
        // Extend auction
        auction.endTime = new Date(Date.now() + this.config.antiSnipeTime);
        auction.updatedAt = new Date();
        
        this.emit('auction-extended', { 
          auction, 
          extensionTime: this.config.antiSnipeTime 
        });
        
        logger.info(`Auction ${auction.id} extended by ${this.config.antiSnipeTime}ms due to anti-snipe`);
      }
    }
  }

  private async handleProxyBidding(auction: LiveAuction, currentBid: AuctionBid): Promise<void> {
    if (!this.config.enableProxyBidding || !currentBid.maxProxyBid) {
      return;
    }

    const bids = this.bids.get(auction.id) || [];
    const otherProxyBids = bids.filter(b => 
      b.id !== currentBid.id && 
      b.maxProxyBid && 
      b.userId !== currentBid.userId
    );

    // Sort by max proxy bid amount
    otherProxyBids.sort((a, b) => (a.maxProxyBid || 0) - (b.maxProxyBid || 0));

    for (const proxyBid of otherProxyBids) {
      if ((proxyBid.maxProxyBid || 0) > currentBid.amount) {
        // Auto-bid for proxy bidder
        const newAmount = Math.min(
          currentBid.amount + auction.minBidIncrement,
          proxyBid.maxProxyBid || 0
        );

        try {
          await this.placeBid(
            auction.id,
            proxyBid.userId,
            proxyBid.username,
            newAmount,
            { autoBid: true, maxProxyBid: proxyBid.maxProxyBid }
          );
        } catch (error) {
          logger.error('Proxy bidding failed:', error);
        }
      }
    }
  }

  private startPaymentTimeout(auctionId: string, userId: string): void {
    const timeout = setTimeout(() => {
      this.handlePaymentTimeout(auctionId, userId);
    }, this.config.paymentTimeout);

    this.paymentTimeouts.set(auctionId, timeout);
  }

  private handlePaymentTimeout(auctionId: string, userId: string): void {
    logger.warn(`Payment timeout for auction ${auctionId} by user ${userId}`);
    
    // Emit event for payment system to handle
    this.emit('payment-timeout', { auctionId, userId });
    
    // Could implement auto-relist or penalty system here
    if (this.config.enableAutoRelist) {
      // Auto-relist logic would go here
      logger.info(`Auto-relist would be triggered for auction ${auctionId}`);
    }
  }

  private startAuctionMonitor(): void {
    // Monitor for auction end times
    setInterval(() => {
      const now = new Date();
      
      for (const auction of this.auctions.values()) {
        if (auction.status === AuctionStatus.ACTIVE && auction.endTime && now > auction.endTime) {
          this.endAuction(auction.id).catch(error => {
            logger.error('Failed to auto-end auction:', error);
          });
        }
      }
    }, 1000); // Check every second
  }

  public async start(): Promise<void> {
    logger.info('Live auction engine started');
    this.running = true;
  }

  public async stop(): Promise<void> {
    logger.info('Live auction engine stopping...');
    this.running = false;
    
    // Clear all timeouts
    for (const timeout of this.paymentTimeouts.values()) {
      clearTimeout(timeout);
    }
    
    this.auctions.clear();
    this.activeAuctions.clear();
    this.bids.clear();
    this.bidders.clear();
    this.paymentTimeouts.clear();
  }

  public isRunning(): boolean {
    return this.running;
  }
}