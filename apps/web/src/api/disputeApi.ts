// ============================================
// Dispute API Client
// ============================================

import {
  Dispute,
  DisputeListResponse,
  CreateDisputeInput,
  DisputeFilters,
  AdminDisputeStats
} from '../types/dispute.types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

class DisputeApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    return response.json();
  }

  // User endpoints
  async createDispute(input: CreateDisputeInput): Promise<Dispute> {
    const formData = new FormData();
    formData.append('reason', input.reason);
    formData.append('description', input.description);
    formData.append('requestId', input.requestId.toString());

    if (input.evidenceFiles) {
      input.evidenceFiles.forEach((file) => {
        formData.append('evidence', file);
      });
    }

    const response = await fetch(
      `${this.baseUrl}/requests/${input.requestId}/dispute`,
      {
        method: 'POST',
        body: formData
      }
    );

    const result: ApiResponse<Dispute> = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create dispute');
    }
    return result.data!;
  }

  async getMyDisputes(filters?: DisputeFilters): Promise<DisputeListResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await this.fetch<ApiResponse<DisputeListResponse>>(
      `/disputes/my-disputes${query}`
    );
    return response.data!;
  }

  async getDisputeById(disputeId: string): Promise<Dispute> {
    const response = await this.fetch<ApiResponse<Dispute>>(
      `/disputes/${disputeId}`
    );
    return response.data!;
  }

  async addEvidence(disputeId: string, files: File[]): Promise<void> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('evidence', file);
    });

    await fetch(`${this.baseUrl}/disputes/${disputeId}/add-evidence`, {
      method: 'POST',
      body: formData
    });
  }

  // Admin endpoints
  async getAllDisputes(filters?: DisputeFilters): Promise<DisputeListResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.reason) params.append('reason', filters.reason);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await this.fetch<ApiResponse<DisputeListResponse>>(
      `/admin/disputes${query}`
    );
    return response.data!;
  }

  async getDisputeDetails(disputeId: string): Promise<Dispute> {
    const response = await this.fetch<ApiResponse<Dispute>>(
      `/admin/disputes/${disputeId}`
    );
    return response.data!;
  }

  async markUnderReview(disputeId: string): Promise<Dispute> {
    const response = await this.fetch<ApiResponse<Dispute>>(
      `/admin/disputes/${disputeId}/review`,
      { method: 'POST' }
    );
    return response.data!;
  }

  async resolveDispute(
    disputeId: string,
    resolution: string,
    resolutionPercentage?: number,
    adminNotes?: string
  ): Promise<Dispute> {
    const response = await this.fetch<ApiResponse<Dispute>>(
      `/admin/disputes/${disputeId}/resolve`,
      {
        method: 'POST',
        body: JSON.stringify({
          resolution,
          resolutionPercentage,
          adminNotes
        })
      }
    );
    return response.data!;
  }

  async getDisputeStats(): Promise<AdminDisputeStats> {
    return this.fetch<AdminDisputeStats>('/admin/disputes/stats');
  }

  async closeDispute(disputeId: string): Promise<void> {
    await fetch(`${this.baseUrl}/admin/disputes/${disputeId}/close`, {
      method: 'POST'
    });
  }
}

// Export singleton instance
export const disputeApi = new DisputeApiClient();

// Export helper functions
export const disputesApi = {
  create: (input: CreateDisputeInput) => disputeApi.createDispute(input),
  getMyDisputes: (filters?: DisputeFilters) => disputeApi.getMyDisputes(filters),
  getById: (id: string) => disputeApi.getDisputeById(id),
  addEvidence: (id: string, files: File[]) => disputeApi.addEvidence(id, files),
  
  // Admin
  getAll: (filters?: DisputeFilters) => disputeApi.getAllDisputes(filters),
  getDetails: (id: string) => disputeApi.getDisputeDetails(id),
  markUnderReview: (id: string) => disputeApi.markUnderReview(id),
  resolve: (id: string, resolution: string, percentage?: number, notes?: string) =>
    disputeApi.resolveDispute(id, resolution, percentage, notes),
  getStats: () => disputeApi.getDisputeStats(),
  close: (id: string) => disputeApi.closeDispute(id)
};
