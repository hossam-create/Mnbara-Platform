// ============================================
// 🏪 Seller Service - API for Seller Dashboard
// ============================================

import api from './api';
import type { ApiResponse, SearchResult, Order, ListingType, ProductCondition, Currency } from '../types';

// ============ SELLER TYPES ============
export interface SellerStats {
  totalProducts: number;
  activeListings: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  avgRating: number;
  views: number;
  conversionRate: number;
}

export interface SellerListing {
  id: string;
  productId: string;
  title: string;
  images: string[];
  price: number;
  currency: Currency;
  listingType: ListingType;
  condition: ProductCondition;
  stock: number;
  status: 'draft' | 'active' | 'paused' | 'sold' | 'expired';
  views: number;
  watchers: number;
  createdAt: string;
  updatedAt: string;
  // Auction specific
  startPrice?: number;
  reservePrice?: number;
  buyNowPrice?: number;
  currentBid?: number;
  bidsCount?: number;
  auctionEndTime?: string;
}

export interface ListingFormData {
  title: string;
  description: string;
  categoryId: string;
  subcategoryId?: string;
  condition: ProductCondition;
  listingType: ListingType;
  price: number;
  currency: Currency;
  stock: number;
  brand?: string;
  tags: string[];
  originCountry: string;
  images: File[];
  // Auction specific
  startPrice?: number;
  reservePrice?: number;
  buyNowPrice?: number;
  auctionDuration?: number; // in days
  autoExtend?: boolean;
}

export interface SellerOrder extends Order {
  buyerName: string;
  buyerEmail: string;
  productTitle: string;
  productImage: string;
  shippingLabel?: string;
  escrow: boolean;
}

export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  image: string;
  sales: number;
  revenue: number;
}

export interface PendingAction {
  id: string;
  type: 'order_pending' | 'review_pending' | 'question_pending' | 'return_request';
  title: string;
  description: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

// ============ SELLER API ============
export const sellerApi = {
  // Dashboard Stats
  getStats: () =>
    api.get<ApiResponse<SellerStats>>('/seller/stats'),

  getSalesData: (period: 'week' | 'month' | 'year' = 'week') =>
    api.get<ApiResponse<SalesDataPoint[]>>('/seller/sales', { params: { period } }),

  getTopProducts: (limit = 5) =>
    api.get<ApiResponse<TopProduct[]>>('/seller/top-products', { params: { limit } }),

  getPendingActions: () =>
    api.get<ApiResponse<PendingAction[]>>('/seller/pending-actions'),

  // Listings Management
  getListings: (params?: { status?: string; page?: number; pageSize?: number; search?: string }) =>
    api.get<ApiResponse<SearchResult<SellerListing>>>('/seller/listings', { params }),

  getListing: (id: string) =>
    api.get<ApiResponse<SellerListing>>(`/seller/listings/${id}`),

  createListing: (data: Partial<ListingFormData>) =>
    api.post<ApiResponse<SellerListing>>('/seller/listings', data),

  updateListing: (id: string, data: Partial<ListingFormData>) =>
    api.put<ApiResponse<SellerListing>>(`/seller/listings/${id}`, data),

  deleteListing: (id: string) =>
    api.delete<ApiResponse<void>>(`/seller/listings/${id}`),

  pauseListing: (id: string) =>
    api.post<ApiResponse<SellerListing>>(`/seller/listings/${id}/pause`),

  activateListing: (id: string) =>
    api.post<ApiResponse<SellerListing>>(`/seller/listings/${id}/activate`),

  uploadImages: (files: FormData) =>
    api.post<ApiResponse<string[]>>('/seller/images/upload', files, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Orders Management
  getOrders: (params?: { status?: string; page?: number; pageSize?: number; search?: string }) =>
    api.get<ApiResponse<SearchResult<SellerOrder>>>('/seller/orders', { params }),

  getOrder: (id: string) =>
    api.get<ApiResponse<SellerOrder>>(`/seller/orders/${id}`),

  updateOrderStatus: (id: string, status: string, trackingNumber?: string, carrier?: string) =>
    api.put<ApiResponse<SellerOrder>>(`/seller/orders/${id}/status`, { status, trackingNumber, carrier }),

  generateShippingLabel: (orderId: string) =>
    api.post<ApiResponse<{ labelUrl: string; trackingNumber: string }>>(`/seller/orders/${orderId}/shipping-label`),

  // Analytics
  getAnalytics: (period: 'week' | 'month' | 'year' = 'month') =>
    api.get<ApiResponse<{
      revenue: SalesDataPoint[];
      orders: SalesDataPoint[];
      views: SalesDataPoint[];
      conversionRate: number;
    }>>('/seller/analytics', { params: { period } }),
};

export default sellerApi;
