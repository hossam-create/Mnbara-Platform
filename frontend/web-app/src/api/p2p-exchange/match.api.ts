// ============================================================
// P2P Exchange API Client - Match Endpoints
// ============================================================

import { apiClient, createFormData } from './base';
import type {
  ExchangeMatch,
  ProofOfPayment,
  UploadProofInput,
  ApiResponse,
} from '../../types/p2p-exchange.types';

// ============================================================
// MATCH API
// ============================================================

export class MatchAPI {
  /**
   * Get all matches (with pagination)
   * GET /api/v1/exchange/matches
   */
  static async getAll(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<ExchangeMatch[]>> {
    const response = await apiClient.get<ApiResponse<ExchangeMatch[]>>(
      '/matches',
      { params }
    );
    return response.data;
  }

  /**
   * Get match details by ID
   * GET /api/v1/exchange/matches/:id
   */
  static async getById(id: number): Promise<ApiResponse<ExchangeMatch>> {
    const response = await apiClient.get<ApiResponse<ExchangeMatch>>(
      `/matches/${id}`
    );
    return response.data;
  }

  /**
   * Get user's matches
   * GET /api/v1/exchange/matches
   */
  static async getUserMatches(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<ExchangeMatch[]>> {
    const response = await apiClient.get<ApiResponse<ExchangeMatch[]>>(
      '/matches',
      { params }
    );
    return response.data;
  }

  /**
   * Create a new match
   * POST /api/v1/exchange/matches
   */
  static async create(data: {
    requestId: number;
    counterRequestId: number;
  }): Promise<ApiResponse<ExchangeMatch>> {
    const response = await apiClient.post<ApiResponse<ExchangeMatch>>(
      '/matches',
      data
    );
    return response.data;
  }

  /**
   * Accept a match
   * POST /api/v1/exchange/matches/:id/accept
   */
  static async accept(id: number): Promise<ApiResponse<ExchangeMatch>> {
    const response = await apiClient.post<ApiResponse<ExchangeMatch>>(
      `/matches/${id}/accept`
    );
    return response.data;
  }

  /**
   * Initiate payment for a match
   * POST /api/v1/exchange/matches/:id/initiate-payment
   */
  static async initiatePayment(
    matchId: number
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/matches/${matchId}/initiate-payment`
    );
    return response.data;
  }

  /**
   * Upload proof of payment
   * POST /api/v1/exchange/matches/:id/upload-proof
   */
  static async uploadProof(
    matchId: number,
    data: UploadProofInput
  ): Promise<ApiResponse<ProofOfPayment>> {
    // Create FormData for file upload
    const formData = createFormData({
      photo: data.photo,
      video: data.video,
      referenceId: data.referenceId,
      recipientName: data.recipientName,
      paymentMethod: data.paymentMethod,
      metadata: data.metadata,
    });

    const response = await apiClient.post<ApiResponse<ProofOfPayment>>(
      `/matches/${matchId}/upload-proof`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Confirm receipt of payment
   * POST /api/v1/exchange/matches/:id/confirm-receipt
   */
  static async confirmReceipt(
    matchId: number
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/matches/${matchId}/confirm-receipt`
    );
    return response.data;
  }

  /**
   * Get match timeline/history
   * GET /api/v1/exchange/matches/:id/timeline
   */
  static async getMatchTimeline(
    matchId: number
  ): Promise<ApiResponse<Array<{
    event: string;
    timestamp: string;
    details: any;
  }>>> {
    const response = await apiClient.get(`/matches/${matchId}/timeline`);
    return response.data;
  }

  /**
   * Cancel match (if allowed)
   * POST /api/v1/exchange/matches/:id/cancel
   */
  static async cancelMatch(
    matchId: number,
    reason: string
  ): Promise<ApiResponse<{ message: string }>> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      `/matches/${matchId}/cancel`,
      { reason }
    );
    return response.data;
  }

  /**
   * Dispute match
   * POST /api/v1/exchange/matches/:id/dispute
   */
  static async disputeMatch(
    matchId: number,
    data: {
      reason: string;
      description: string;
      evidence?: File[];
    }
  ): Promise<ApiResponse<{ disputeId: number; message: string }>> {
    const formData = createFormData({
      reason: data.reason,
      description: data.description,
      evidence: data.evidence,
    });

    const response = await apiClient.post<ApiResponse<{ disputeId: number; message: string }>>(
      `/matches/${matchId}/dispute`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }
}

export default MatchAPI;
