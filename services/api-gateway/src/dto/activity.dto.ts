/**
 * Unified Activity DTO
 * Standardized activity format across all domains (wallet, traveler, marketplace)
 */

export type ActivityDomain = 'wallet' | 'traveler' | 'marketplace';

export type ActivityStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface UnifiedActivityDTO {
  id: string;
  domain: ActivityDomain;
  title: string;
  description: string;
  date: string; // ISO 8601 format
  amount?: number;
  currency?: string;
  status?: ActivityStatus;
  metadata?: Record<string, unknown>;
}

export interface AggregatedActivityResponse {
  data: UnifiedActivityDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    cursor?: string;
    partial: boolean;
    failedDomains: ActivityDomain[];
    cached: boolean;
    cachedAt?: string;
  };
}

export interface ActivityQueryParams {
  domain?: ActivityDomain | 'all';
  limit?: number;
  cursor?: string;
  startDate?: string;
  endDate?: string;
}

// Raw response types from downstream services
export interface WalletActivityResponseItem {
  id: string;
  type: string;
  description?: string;
  createdAt: string;
  amount?: number;
  currency?: string;
  status?: ActivityStatus;
  metadata?: Record<string, unknown>;
}

export interface TravelerActivityResponseItem {
  id: string;
  action: string;
  details?: string;
  createdAt: string;
  status?: ActivityStatus;
  metadata?: Record<string, unknown>;
}

export interface MarketplaceActivityResponseItem {
  id: string;
  event: string;
  summary?: string;
  createdAt: string;
  amount?: number;
  currency?: string;
  status?: ActivityStatus;
  metadata?: Record<string, unknown>;
}
