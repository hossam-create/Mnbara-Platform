/**
 * Listing Types - منصة منبرة
 * 
 * TypeScript types for Listing Service integration
 */

export enum ListingStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum ListingCondition {
  NEW = 'NEW',
  LIKE_NEW = 'LIKE_NEW',
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
}

export enum ListingType {
  FIXED_PRICE = 'FIXED_PRICE',
  AUCTION = 'AUCTION',
  NEGOTIABLE = 'NEGOTIABLE',
}

export interface ListingImage {
  id: number;
  url: string;
  thumbnailUrl?: string;
  order: number;
  alt?: string;
}

export interface Category {
  id: number;
  name: string;
  nameAr: string;
  slug: string;
  level: number;
  parentId: number | null;
  isActive: boolean;
  description?: string;
  icon?: string;
  children?: Category[];
}

export interface CategoryStats {
  categoryId: number;
  totalListings: number;
  activeListings: number;
  soldListings: number;
  averagePrice: number;
}

export interface Listing {
  id: number;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  price: number;
  currency: string;
  condition: ListingCondition;
  status: ListingStatus;
  type: ListingType;
  categoryId: number;
  category?: Category;
  sellerId: number;
  seller?: {
    id: number;
    name: string;
    avatar?: string;
    rating?: number;
    totalSales?: number;
  };
  images: ListingImage[];
  location?: {
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  specifications?: Record<string, any>;
  tags?: string[];
  views: number;
  favorites: number;
  isFeatured: boolean;
  isNegotiable: boolean;
  quantity: number;
  sku?: string;
  brand?: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  soldAt?: string;
}

export interface CreateListingInput {
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  price: number;
  currency?: string;
  condition: ListingCondition;
  type: ListingType;
  categoryId: number;
  location?: {
    city: string;
    country: string;
  };
  specifications?: Record<string, any>;
  tags?: string[];
  isNegotiable?: boolean;
  quantity?: number;
  sku?: string;
  brand?: string;
  model?: string;
}

export interface UpdateListingInput extends Partial<CreateListingInput> {
  status?: ListingStatus;
}

export interface ListingFilters {
  categoryId?: number;
  status?: ListingStatus;
  condition?: ListingCondition;
  type?: ListingType;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: number;
  search?: string;
  tags?: string[];
  city?: string;
  country?: string;
  isFeatured?: boolean;
  sortBy?: 'price' | 'createdAt' | 'views' | 'favorites';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ListingsPaginatedResponse {
  listings: Listing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface BulkUploadResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

export interface FeeCalculation {
  listingFee: number;
  commissionFee: number;
  paymentProcessingFee: number;
  totalFees: number;
  sellerReceives: number;
}
