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
    duration: number;
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
export declare class LiveAuctionManager extends EventEmitter {
    private prisma;
    private logger;
    private activeAuctions;
    private auctionTimers;
    constructor(prisma: PrismaClient, logger: Logger);
    /**
     * Load active auctions from database
     */
    private loadActiveAuctions;
    /**
     * Create a new auction
     */
    createAuction(data: AuctionData): Promise<any>;
    /**
     * Start an auction
     */
    startAuction(auctionId: string): Promise<any>;
    /**
     * Place a bid
     */
    placeBid(data: BidData): Promise<any>;
    /**
     * Get auction by ID
     */
    getAuction(auctionId: string): Promise<any>;
    /**
     * List auctions with filters
     */
    listAuctions(filters?: AuctionFilters): Promise<any[]>;
    /**
     * End an auction
     */
    endAuction(auctionId: string): Promise<any>;
    /**
     * Cancel an auction
     */
    cancelAuction(auctionId: string): Promise<any>;
    /**
     * Get auction statistics
     */
    getAuctionStats(auctionId: string): Promise<any>;
    /**
     * Schedule auction end
     */
    private scheduleAuctionEnd;
    /**
     * Clear auction timer
     */
    private clearAuctionTimer;
    /**
     * Get active auctions for a stream
     */
    getStreamAuctions(streamId: string): Promise<any[]>;
}
export {};
//# sourceMappingURL=LiveAuctionManager.d.ts.map