/**
 * Auction Service
 * Client-side auction state engine with mock data
 * NO PAYMENTS - UI and state management only
 */

import {
  Auction,
  AuctionState,
  AuctionStatus,
  AuctionPhase,
  Bid,
  BidStatus,
  AuctionFilter,
  AuctionList,
  AuctionRules,
  PlaceBidRequest,
  PlaceBidResult,
  BidHistory,
  AuctionExtension
} from '../types/auction.types';
import { apiService } from './api.service';


// Mock data removed - using real API via auctionAPI


export const auctionService = {
  /**
   * Get auction by ID from backend API
   * Returns raw backend data without frontend calculations
   */
  async getAuction(auctionId: string | number): Promise<Auction | null> {
    try {
      const response = await apiService.auction.getById(auctionId.toString());
      return response.data.data;
    } catch (error) {
      console.error('Error fetching auction:', error);
      return null;
    }
  },

  /**
   * Get list of auctions with filters from backend API
   */
  async getAuctions(filter: AuctionFilter = {}): Promise<AuctionList> {
    try {
      const response = await apiService.auction.getActive(filter);
      return response.data.data;
    } catch (error) {
       console.error('Error fetching auctions:', error);
       return {
         auctions: [],
         totalCount: 0,
         currentPage: 1,
         totalPages: 0,
         hasNextPage: false,
         hasPrevPage: false
       };
    }
  },

  /**
   * Get auction state from backend API
   * Backend decides auction phase and bidding eligibility
   */
  async getAuctionState(auctionId: string | number, userId?: string | number): Promise<AuctionState | null> {
    try {
      // Get auction details from backend
      const auctionResponse = await apiService.auction.getById(auctionId.toString());
      const auction = auctionResponse.data.data;
      
      if (!auction) return null;
      
      // Get bid history from backend
      const bidHistoryResponse = await apiService.auction.getBids(auctionId.toString(), { limit: 10 });
      const bidHistory = bidHistoryResponse.data.data;
      
      // Get extensions from backend
      const extensionsResponse = await apiService.auction.getExtensions(auctionId.toString());
      const extensions = extensionsResponse.data.data;
      
      // Backend determines auction phase
      const now = new Date();
      const endsAt = new Date(auction.endsAt);
      const timeRemainingMs = Math.max(0, endsAt.getTime() - now.getTime());
      
      let phase: AuctionPhase;
      if (timeRemainingMs === 0) {
        phase = AuctionPhase.ENDED;
      } else if (extensions && extensions.length > 0 && timeRemainingMs < 120000) {
        phase = AuctionPhase.EXTENDED;
      } else {
        phase = AuctionPhase.LIVE;
      }
      
      // Find user's bid status (if userId provided)
      let userBidStatus: BidStatus | undefined;
      let userHighestBid: number | undefined;
      
      if (userId && bidHistory.bids) {
        const userBids = bidHistory.bids.filter((b: Bid) => b.bidderId === userId);
        if (userBids.length > 0) {
          userHighestBid = Math.max(...userBids.map((b: Bid) => b.amount));
          const latestUserBid = userBids.sort((a: Bid, b: Bid) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
          userBidStatus = latestUserBid.status;
        }
      }
      
      // Backend determines if user can bid
      const canBid = auction.status === 'ACTIVE' && timeRemainingMs > 0;
      
      return {
        auction,
        currentBid: auction.currentBid,
        highestBidder: bidHistory.bids?.[0]?.bidderId,
        highestBidderName: bidHistory.bids?.[0]?.bidderName,
        timeRemainingMs,
        isEnding: timeRemainingMs > 0 && timeRemainingMs < 120000,
        hasEnded: timeRemainingMs === 0,
        bidCount: bidHistory.totalCount || 0,
        recentBids: bidHistory.bids?.slice(0, 10) || [],
        extensionCount: auction.extensionCount || 0,
        autoExtendEnabled: auction.autoExtendEnabled || false,
        canBid,
        userBidStatus,
        userHighestBid,
        phase,
        extensions
      };
    } catch (error) {
      console.error('Error fetching auction state:', error);
      return null;
    }
  },

  /**
   * Get bid history for an auction from backend API
   */
  async getBidHistory(auctionId: string | number, page: number = 1, limit: number = 50): Promise<BidHistory> {
    try {
      const response = await apiService.auction.getBids(auctionId.toString(), { limit, offset: (page - 1) * limit });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching bid history:', error);
      return {
        bids: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      };
    }
  },

  /**
   * Place a bid via backend API
   * Backend handles all validation and anti-sniping logic
   */
  async placeBid(request: PlaceBidRequest): Promise<PlaceBidResult> {
    try {
      const response = await apiService.auction.placeBid(request.auctionId.toString(), request.amount);
      return response.data.data;
    } catch (error: any) {
      console.error('Error placing bid:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to place bid'
      };
    }
  },

  /**
   * Get auction rules
   */
  async getAuctionRules(auctionId: string | number): Promise<AuctionRules | null> {
    try {
      const response = await auctionAPI.getRules(auctionId);
      return response.data;
    } catch (error) {
      console.error('Error fetching auction rules:', error);
      return null;
    }
  },

  /**
   * Compute remaining time in milliseconds for an auction based on its end date.
   * Returns 0 when the auction has ended or if the timestamp is invalid.
   */
  getAuctionTimeRemaining(auction: Partial<Pick<Auction, 'endsAt' | 'auctionEndsAt'>>): number {
    const rawEndsAt = auction?.endsAt ?? auction?.auctionEndsAt;
    const endsAt = rawEndsAt ? new Date(rawEndsAt).getTime() : 0;
    if (!endsAt) return 0;
    const now = Date.now();
    return Math.max(0, endsAt - now);
  },

  /**
   * Format currency for display
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },

  /**
   * Subscribe to auction updates (mock WebSocket)
   */
  subscribeToAuction(auctionId: string | number, callback: (state: AuctionState) => void): () => void {
    // Mock WebSocket subscription
    console.log(`Subscribed to auction ${auctionId} updates`);
    
    // Simulate real-time updates
    const interval = setInterval(async () => {
      const state = await this.getAuctionState(auctionId);
      if (state) {
        callback(state);
      }
    }, 5000); // Update every 5 seconds
    
    // Return unsubscribe function
    return () => {
      clearInterval(interval);
      console.log(`Unsubscribed from auction ${auctionId} updates`);
    };
  }
};

// Helper function for bid validation
function isValidBidAmount(amount: number, currentBid: number, minIncrement: number): boolean {
  return amount >= currentBid + minIncrement;
}
