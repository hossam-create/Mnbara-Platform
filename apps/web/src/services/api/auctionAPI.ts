import { api } from './client'
import { Auction, AuctionList, Bid, BidHistory, PlaceBidRequest, PlaceBidResult } from '../../types/auction.types'

// Define API response types if they differ from domain types
export interface AuctionAPIResponse {
  data: Auction
}

export interface AuctionListAPIResponse {
  data: AuctionList
}

export interface BidHistoryAPIResponse {
  data: BidHistory
}

export const auctionAPI = {
  // Get active auctions with filters
  getAuctions: (params: any) => 
    api.get<AuctionList>('/auctions', { params }),

  // Get single auction by ID
  getAuction: (id: string | number) => 
    api.get<Auction>(`/auctions/${id}`),

  // Get bid history
  getBids: (id: string | number, params?: any) => 
    api.get<BidHistory>(`/auctions/${id}/bids`, { params }),

  // Place a bid
  placeBid: (id: string | number, amount: number) => 
    api.post<PlaceBidResult>(`/auctions/${id}/bid`, { amount }),

  // Create an auction (if needed for sellers)
  createAuction: (data: any) => 
    api.post<Auction>('/auctions', data),
    
  // Get auction rules
  getRules: (id: string | number) =>
    api.get(`/auctions/${id}/rules`)
}
