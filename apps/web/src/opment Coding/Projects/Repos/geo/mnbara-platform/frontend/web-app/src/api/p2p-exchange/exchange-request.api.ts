// ============================================================
// P2P Exchange API Client - Exchange Request Endpoints
// ============================================================

import { apiClient, buildQueryString } from './base';
import type {
  ExchangeRequest,
  CreateExchangeRequestInput,
  UpdateExchangeRequestInput,
  ApiResponse,
} from '../../types/p2p-exchange.types';

// ============================================================
// EXCHANGE REQUEST API
// ============================================================

export class ExchangeRequestAPI {
  /**
   * Get all exchange requests
   * GET /api/v1/exchange/exchange-requests
   */
  static async getAll(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<ExchangeRequest[]>> {
    const queryString = params ? buildQueryString(params) : '';
    const response = await apiClient.get<ApiResponse<ExchangeRequest[]>>(
      `/exchange-requests${queryString}`
    );
    return response.data;
  }

  /**
   * Get exchange request by ID
   * GET /api/v1/exchange/exchange-requests/:id
   */
  static async getById(id: number): Promise<ApiResponse<ExchangeRequest>> {
    const response = await apiClient.get<ApiResponse<ExchangeRequest>>(
      `/exchange-requests/${id}`
    );
    return response.data;
  }

  /**
   * Create a new exchange request
   * POST /api/v1/exchange/exchange-requests
   */
  static async create(
    data: CreateExchangeRequestInput
  ): Promise<ApiResponse<ExchangeRequest>> {
    const response = await apiClient.post<ApiResponse<ExchangeRequest>>(
      '/exchange-requests',
      data
    );
    return response.data;
  }

  /**
   * Update exchange request
   * PATCH /api/v1/exchange/exchange-requests/:id
   */
  static async update(
    id: number,
    data: UpdateExchangeRequestInput
  ): Promise<ApiResponse<ExchangeRequest>> {
    const response = await apiClient.patch<ApiResponse<ExchangeRequest>>(
      `/exchange-requests/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Cancel exchange request
   * DELETE /api/v1/exchange/exchange-requests/:id
   */
  static async cancel(id: number): Promise<ApiResponse<ExchangeRequest>> {
    const response = await apiClient.delete<ApiResponse<ExchangeRequest>>(
      `/exchange-requests/${id}`
    );
    return response.data;
  }

  /**
   * Create a new exchange request (alias)
   * POST /api/v1/exchange/requests
   */
  static async createRequest(
    data: CreateExchangeRequestInput
  ): Promise<ApiResponse<ExchangeRequest>> {
    const response = await apiClient.post<ApiResponse<ExchangeRequest>>(
      '/requests',
      data
    );
    return response.data;
  }

  /**
   * Get exchange request by ID (alias)
   * GET /api/v1/exchange/requests/:id
   */
  static async getRequest(id: number): Promise<ApiResponse<ExchangeRequest>> {
    const response = await apiClient.get<ApiResponse<ExchangeRequest>>(
      `/requests/${id}`
    );
    return response.data;
  }

  /**
   * Get user's exchange requests
   * GET /api/v1/exchange/requests
   */
  static async getUserRequests(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<ExchangeRequest[]>> {
    const queryString = params ? buildQueryString(params) : '';
    const response = await apiClient.get<ApiResponse<ExchangeRequest[]>>(
      `/requests${queryString}`
    );
    return response.data;
  }

  /**
   * Update exchange request (alias)
   * PATCH /api/v1/exchange/requests/:id
   */
  static async updateRequest(
    id: number,
    data: UpdateExchangeRequestInput
  ): Promise<ApiResponse<ExchangeRequest>> {
    const response = await apiClient.patch<ApiResponse<ExchangeRequest>>(
      `/requests/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Cancel exchange request (alias)
   * DELETE /api/v1/exchange/requests/:id
   */
  static async cancelRequest(id: number): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/requests/${id}`
    );
    return response.data;
  }

  /**
   * Get request statistics
   * GET /api/v1/exchange/requests/stats
   */
  static async getRequestStats(): Promise<ApiResponse<{
    total: number;
    open: number;
    matched: number;
    completed: number;
    cancelled: number;
  }>> {
    const response = await apiClient.get('/requests/stats');
    return response.data;
  }
}

export default ExchangeRequestAPI;
