// Re-export all types
export * from './navigation';

// User types
export interface User {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  role: 'buyer' | 'seller' | 'traveler' | 'admin';
  kycStatus: 'none' | 'pending' | 'verified' | 'rejected';
  ratingAvg: number;
  avatarUrl?: string;
  createdAt: string;
}

// Product types
export interface Product {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  categoryId: string;
  price: number;
  currency: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  images: string[];
  attributes: Record<string, string>;
  status: 'draft' | 'active' | 'sold' | 'archived';
}

// Auction types
export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidder: { id: string; name: string; rating: number };
  amount: number;
  isProxy: boolean;
  createdAt: string;
}

export interface Auction {
  id: string;
  productId: string;
  product: Product;
  type: 'auction';
  startPrice: number;
  reservePrice?: number;
  buyItNowPrice?: number;
  currentPrice: number;
  startAt: string;
  endAt: string;
  status: 'scheduled' | 'active' | 'ended' | 'sold';
  viewsCount: number;
  bidsCount: number;
  highestBid?: Bid;
  bids: Bid[];
  autoExtend: boolean;
  extensionMinutes: number;
}

// Order types
export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  pricePaid: number;
  currency: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'disputed' | 'refunded';
  escrow: boolean;
  escrowStatus?: 'held' | 'released' | 'refunded';
  trackingNumber?: string;
  createdAt: string;
}

// Traveler types
export interface Trip {
  id: string;
  travelerId: string;
  origin: string;
  destination: string;
  departAt: string;
  arriveAt: string;
  capacityKg: number;
  availableKg: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface TravelRequest {
  id: string;
  buyerId: string;
  productId: string;
  product: Product;
  destination: string;
  deadline: string;
  budget: number;
  status: 'open' | 'matched' | 'in_progress' | 'completed' | 'cancelled';
  distanceKm?: number;
}

export interface TravelMatch {
  id: string;
  tripId: string;
  requestId: string;
  trip: Trip;
  request: TravelRequest;
  status: 'proposed' | 'accepted' | 'picked_up' | 'delivered' | 'completed' | 'cancelled';
  pickupEvidence?: Evidence;
  deliveryEvidence?: Evidence;
}

export interface Evidence {
  photoUrl: string;
  timestamp: string;
  location?: { lat: number; lon: number };
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
