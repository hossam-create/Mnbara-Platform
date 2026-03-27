/**
 * Shared Type Definitions
 * Re-exports from api.ts for API contract types
 */

// Re-export all API contract types
export * from './api';

// ============ LEGACY TYPES (for backward compatibility) ============

// Simple listing type (use ListingDetail from api.ts for full details)
export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  origin: string;
  destination: string;
  category: string;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  createdAt: string;
  updatedAt: string;
  images: string[];
  sellerId: string;
}

// Simple user type (use SellerProfile from api.ts for full details)
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  rating: number;
  reviews: number;
  verified: boolean;
  createdAt: string;
}

// Shopper request type
export interface ShopperRequest {
  id: string;
  title: string;
  description: string;
  budget: number;
  origin: string;
  destination: string;
  deadline: string;
  status: 'OPEN' | 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  buyerId: string;
  createdAt: string;
}

// Simple traveler offer (use OfferDetail from api.ts for full details)
export interface TravelerOffer {
  id: string;
  requestId: string;
  travelerId: string;
  price: number;
  deliveryDate: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
}

// Search filters (use SearchListingsRequest from api.ts)
export interface SearchFilters {
  query?: string;
  origin?: string;
  destination?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating';
}

// Pagination params
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// Legacy paginated response (use PaginationInfo from api.ts)
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
