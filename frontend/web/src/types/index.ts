// ============================================
// 🌍 Mnbara Platform - TypeScript Types
// ============================================

// ============ USER TYPES ============
export interface User {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  kycVerified: boolean;
  rating: number;
  totalReviews: number;
  createdAt: string;
}

export type UserRole = 'buyer' | 'seller' | 'traveler' | 'admin';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// ============ PRODUCT TYPES ============
export interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  currency: Currency;
  category: Category;
  subcategory?: string;
  condition: ProductCondition;
  listingType: ListingType;
  seller: User;
  originCountry: string;
  brand?: string;
  tags: string[];
  stock: number;
  rating: number;
  totalReviews: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export type ProductCondition = 'new' | 'open_box' | 'used' | 'refurbished' | 'for_parts';
export type ListingType = 'buy_now' | 'auction' | 'make_offer';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'EGP' | 'SAR' | 'AED';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  parentId: string;
}

// ============ AUCTION TYPES ============
export interface Auction {
  id: string;
  product: Product;
  startPrice: number;
  currentPrice: number;
  reservePrice?: number;
  buyNowPrice?: number;
  startTime: string;
  endTime: string;
  autoExtendEnabled: boolean;
  autoExtendMinutes: number;
  status: AuctionStatus;
  bids: Bid[];
  totalBids: number;
  highestBidder?: User;
  watchers: number;
}

export type AuctionStatus = 'scheduled' | 'live' | 'ending_soon' | 'ended' | 'sold' | 'cancelled';

export interface Bid {
  id: string;
  auctionId: string;
  bidder: User;
  amount: number;
  placedAt: string;
  isWinning: boolean;
}

// ============ ORDER TYPES ============
export interface Order {
  id: string;
  orderNumber: string;
  buyer: User;
  seller: User;
  traveler?: User;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  total: number;
  currency: Currency;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  escrowStatus: EscrowStatus;
  deliveryMethod: DeliveryMethod;
  shippingAddress: Address;
  trackingInfo?: TrackingInfo;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  product: Product;
  quantity: number;
  price: number;
  total: number;
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'in_transit' 
  | 'delivered' 
  | 'cancelled' 
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type EscrowStatus = 'held' | 'released' | 'refunded' | 'disputed';
export type DeliveryMethod = 'traveler' | 'courier' | 'pickup';

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
  isDefault: boolean;
}

export interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  estimatedDelivery: string;
  currentLocation?: string;
  status: string;
  updates: TrackingUpdate[];
}

export interface TrackingUpdate {
  timestamp: string;
  location: string;
  status: string;
  description: string;
}

// ============ TRAVELER TYPES ============
export interface Trip {
  id: string;
  traveler: User;
  originCountry: string;
  originCity: string;
  originAirport?: string;
  destinationCountry: string;
  destinationCity: string;
  destinationAirport?: string;
  departureDate: string;
  arrivalDate: string;
  availableWeight: number; // in kg
  categories: string[];
  status: TripStatus;
  deliveriesCount: number;
  createdAt: string;
}

export type TripStatus = 'planned' | 'active' | 'completed' | 'cancelled';

export interface TripSearchResult {
  data: Trip[];
  meta: {
    total: number;
    page: number;
    totalPages: number;
    [key: string]: unknown;
  };
}

export interface BuyerRequest {
  id: string;
  buyer: User;
  productName: string;
  productUrl?: string;
  productDescription: string;
  category: string;
  originCountry: string;
  locationHint?: string;
  maxPrice: number;
  deliveryReward: number;
  urgency: 'low' | 'medium' | 'high';
  status: RequestStatus;
  matchedTrips: Trip[];
  createdAt: string;
  expiresAt: string;
}

export type RequestStatus = 'open' | 'matched' | 'accepted' | 'in_progress' | 'delivered' | 'cancelled';

// ============ REVIEW TYPES ============
export interface Review {
  id: string;
  reviewer: User;
  reviewedUser: User;
  orderId: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  helpful: number;
  response?: ReviewResponse;
  createdAt: string;
}

export interface ReviewResponse {
  content: string;
  createdAt: string;
}

// ============ REWARDS TYPES ============
export interface RewardsAccount {
  userId: string;
  points: number;
  tier: RewardsTier;
  lifetimePoints: number;
  pointsExpiringSoon: number;
  expirationDate?: string;
}

export type RewardsTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface RewardsTransaction {
  id: string;
  type: 'earn' | 'redeem' | 'expire';
  points: number;
  description: string;
  orderId?: string;
  createdAt: string;
}

// ============ NOTIFICATION TYPES ============
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export type NotificationType = 
  | 'order_update'
  | 'bid_outbid'
  | 'bid_won'
  | 'auction_ending'
  | 'new_match'
  | 'message'
  | 'review'
  | 'reward'
  | 'system';

// ============ SEARCH & FILTER TYPES ============
export interface ProductFilters {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ProductCondition[];
  listingType?: ListingType[];
  originCountry?: string;
  brand?: string;
  rating?: number;
  sortBy?: SortOption;
}

export type SortOption = 
  | 'relevance'
  | 'price_low'
  | 'price_high'
  | 'newest'
  | 'popularity'
  | 'rating';

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============ API RESPONSE TYPES ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

// ============ COMPONENT PROP TYPES ============
export interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
  onAddToWishlist?: () => void;
  showQuickView?: boolean;
}

export interface AuctionCardProps {
  auction: Auction;
  onBid?: (amount: number) => void;
  onWatch?: () => void;
}
