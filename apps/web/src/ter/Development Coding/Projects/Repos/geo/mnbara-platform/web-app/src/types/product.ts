/**
 * Product Types for Mnbara Platform
 */

// Product condition enum
export enum ProductCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

// Product status enum
export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  SOLD = 'sold',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

// Product category type
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  icon?: string;
  image?: string;
  subcategories?: ProductCategory[];
}

// Product image type
export interface ProductImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  alt?: string;
  isPrimary: boolean;
  sortOrder: number;
}

// Product location type
export interface ProductLocation {
  country: string;
  city: string;
  address?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

// Product seller type
export interface ProductSeller {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  memberSince: string;
}

// Product type
export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  currency: string;
  condition: ProductCondition;
  status: ProductStatus;
  categoryId: string;
  category?: ProductCategory;
  sellerId: string;
  seller?: ProductSeller;
  images: ProductImage[];
  location: ProductLocation;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  favoriteCount: number;
  isFavorite: boolean;
  // Auction specific fields
  auction?: AuctionDetails;
  // Buy It Now fields
  buyItNowPrice?: number;
  hasBuyItNow: boolean;
  // Make Offer fields
  allowsOffers: boolean;
  minOfferPrice?: number;
}

// Auction specific details
export interface AuctionDetails {
  id: string;
  productId: string;
  startingPrice: number;
  currentPrice: number;
  reservePrice?: number;
  hasReserve: boolean;
  startTime: string;
  endTime: string;
  status: AuctionStatus;
  bidCount: number;
  bidIncrement: number;
  watchersCount: number;
  autoExtendEnabled: boolean;
  autoExtendMinutes: number;
  extendThresholdMinutes: number;
  winnerId?: string;
  winner?: ProductSeller;
}

// Auction status enum
export enum AuctionStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
  RESERVE_NOT_MET = 'reserve_not_met',
}

// Bid type
export interface Bid {
  id: string;
  auctionId: string;
  productId: string;
  bidderId: string;
  bidderName: string;
  bidderAvatar?: string;
  amount: number;
  currency: string;
  isWinningBid: boolean;
  isAutoBid: boolean;
  createdAt: string;
  timestamp: string;
}

// Bid history entry
export interface BidHistoryEntry {
  bid: Bid;
  isCurrentUser: boolean;
  position: number;
}

// Place bid request
export interface PlaceBidRequest {
  auctionId: string;
  productId: string;
  amount: number;
  isAutoBid?: boolean;
  maxAutoBidAmount?: number;
}

// Place bid response
export interface PlaceBidResponse {
  success: boolean;
  bid?: Bid;
  message: string;
  newPrice?: number;
  isOutbid?: boolean;
}

// Search and filter types
export interface ProductFilters {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ProductCondition[];
  location?: {
    country?: string;
    city?: string;
    radius?: number;
  };
  sortBy?: ProductSortOption;
  page?: number;
  limit?: number;
}

export enum ProductSortOption {
  NEWEST = 'newest',
  PRICE_LOW_HIGH = 'price_low_high',
  PRICE_HIGH_LOW = 'price_high_low',
  MOST_BIDS = 'most_bids',
  ENDING_SOON = 'ending_soon',
  BEST_MATCH = 'best_match',
}

// Search suggestions/autocomplete
export interface SearchSuggestion {
  id: string;
  type: 'product' | 'category' | 'recent_search';
  text: string;
  image?: string;
  url?: string;
  categoryName?: string;
}

// Product listing response
export interface ProductListingResponse {
  products: Product[];
  totalCount: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

// Make offer types
export interface MakeOfferRequest {
  productId: string;
  offerPrice: number;
  message?: string;
}

export interface MakeOfferResponse {
  success: boolean;
  offerId?: string;
  message: string;
  sellerResponse?: 'accepted' | 'declined' | 'countered' | 'pending';
}

// Watchlist types
export interface WatchlistItem {
  productId: string;
  product: Product;
  addedAt: string;
  notificationsEnabled: boolean;
}
