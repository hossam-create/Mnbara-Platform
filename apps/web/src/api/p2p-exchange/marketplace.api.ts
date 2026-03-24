// ============================================================
// P2P Exchange API Client - Marketplace Endpoints
// ============================================================

import { apiClient, buildQueryString } from './base';
import type {
  ExchangeRequest,
  MarketplaceFilters,
  ApiResponse,
  PaginatedResponse,
} from '../../types/p2p-exchange.types';

// ============================================================
// MARKETPLACE API
// ============================================================

export class MarketplaceAPI {
  /**
   * Get marketplace with filters
   * GET /api/v1/exchange/marketplace
   */
  static async getMarketplace(
    filters?: MarketplaceFilters
  ): Promise<PaginatedResponse<ExchangeRequest>> {
    const queryString = filters ? buildQueryString(filters) : '';
    const response = await apiClient.get<PaginatedResponse<ExchangeRequest>>(
      `/marketplace${queryString}`
    );
    return response.data;
  }

  /**
   * Browse marketplace with filters (alias)
   * GET /api/v1/exchange/marketplace
   */
  static async browseMarketplace(
    filters?: MarketplaceFilters
  ): Promise<PaginatedResponse<ExchangeRequest>> {
    const queryString = filters ? buildQueryString(filters) : '';
    const response = await apiClient.get<PaginatedResponse<ExchangeRequest>>(
      `/marketplace${queryString}`
    );
    return response.data;
  }

  /**
   * Accept a marketplace request
   * POST /api/v1/exchange/marketplace/accept
   */
  static async acceptRequest(
    requestId: number
  ): Promise<ApiResponse<ExchangeRequest>> {
    const response = await apiClient.post<ApiResponse<ExchangeRequest>>(
      `/marketplace/accept`,
      { requestId }
    );
    return response.data;
  }

  /**
   * Get marketplace statistics
   * GET /api/v1/exchange/marketplace/stats
   */
  static async getMarketplaceStats(): Promise<ApiResponse<{
    totalRequests: number;
    totalVolume: string;
    averageRate: string;
    topCurrencyPairs: Array<{
      from: string;
      to: string;
      count: number;
    }>;
  }>> {
    const response = await apiClient.get('/marketplace/stats');
    return response.data;
  }

  /**
   * Get available currency pairs
   * GET /api/v1/exchange/marketplace/currency-pairs
   */
  static async getCurrencyPairs(): Promise<ApiResponse<Array<{
    from: string;
    to: string;
    count: number;
    avgRate: string;
  }>>> {
    const response = await apiClient.get('/marketplace/currency-pairs');
    return response.data;
  }

  /**
   * Get best rates for a currency pair
   * GET /api/v1/exchange/marketplace/best-rates
   */
  static async getBestRates(params: {
    fromCurrency: string;
    toCurrency: string;
    limit?: number;
  }): Promise<ApiResponse<ExchangeRequest[]>> {
    const queryString = buildQueryString(params);
    const response = await apiClient.get<ApiResponse<ExchangeRequest[]>>(
      `/marketplace/best-rates${queryString}`
    );
    return response.data;
  }
}

export default MarketplaceAPI;
