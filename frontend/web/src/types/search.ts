export enum ProductCondition {
  new = 'new',           // جديد
  used = 'used',         // مستعمل
  refurbished = 'refurbished', // مجدد
  parts = 'parts'        // قطع غيار
}

export enum ShippingOption {
  free = 'free',          // شحن مجاني
  local = 'local',        // شحن محلي
  international = 'international', // شحن دولي
  express = 'express'     // شحن سريع
}

export enum SortBy {
  relevance = 'relevance',   // الأكثر صلة
  priceLow = 'priceLow',     // السعر: من الأقل
  priceHigh = 'priceHigh',   // السعر: من الأعلى
  newest = 'newest',         // الأحدث
  rating = 'rating',         // الأعلى تقييماً
  popularity = 'popularity', // الأكثر شعبية
  distance = 'distance'     // الأقرب
}

export interface SearchFilters {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ProductCondition;
  freeShipping?: boolean;
  shippingOption?: ShippingOption;
  location?: string;
  radiusKm?: number;
  brand?: string;
  color?: string;
  size?: string;
  inStockOnly?: boolean;
  withDiscount?: boolean;
  minRating?: number;
  sortBy?: SortBy;
  page?: number;
  limit?: number;
}

export interface SearchResults<T> {
  results: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  filters: SearchFilters;
}

export interface SearchSuggestion {
  text: string;
  type: 'product' | 'category' | 'brand' | 'store';
  count?: number;
  image?: string;
}

export interface SearchHistoryItem {
  query: string;
  timestamp: string;
  resultCount?: number;
  filters?: Partial<SearchFilters>;
}

export interface VoiceSearchResult {
  text: string;
  confidence: number;
  intent: 'search' | 'navigate' | 'add_to_cart' | 'compare' | 'filter';
  entities: {
    product?: string;
    category?: string;
    brand?: string;
    price?: number;
    location?: string;
  };
}