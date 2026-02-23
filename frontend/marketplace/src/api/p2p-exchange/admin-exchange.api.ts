import { apiClient } from './base';
import type {
  ExchangeRequest,
  ExchangeMatch,
  ProofOfPayment,
  VerificationStatus,
  ApiResponse,
} from '../../types/p2p-exchange.types';

interface AdminStatistics {
  totalRequests: number;
  activeMatches: number;
  pendingProofs: number;
  completedToday: number;
  totalVolume: number;
  averageMatchTime: number;
}

interface VerifyProofRequest {
  status: VerificationStatus;
  reason?: string;
  notes?: string;
}

// ============================================================
// ADMIN EXCHANGE API - Named Exports
// ============================================================

export async function fetchExchanges(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<ExchangeRequest[]>> {
  const response = await apiClient.get<ApiResponse<ExchangeRequest[]>>(
    '/admin/exchanges',
    { params }
  );
  return response.data;
}

export async function getExchangeById(
  id: string | number
): Promise<ApiResponse<ExchangeRequest>> {
  const response = await apiClient.get<ApiResponse<ExchangeRequest>>(
    `/admin/exchanges/${id}`
  );
  return response.data;
}

export async function approveExchange(
  id: string | number
): Promise<ApiResponse<ExchangeRequest>> {
  const response = await apiClient.post<ApiResponse<ExchangeRequest>>(
    `/admin/exchanges/${id}/approve`
  );
  return response.data;
}

export async function rejectExchange(
  id: string | number,
  reason: string
): Promise<ApiResponse<ExchangeRequest>> {
  const response = await apiClient.post<ApiResponse<ExchangeRequest>>(
    `/admin/exchanges/${id}/reject`,
    { reason }
  );
  return response.data;
}

export async function approveProof(
  proofId: string
): Promise<ApiResponse<ProofOfPayment>> {
  const response = await apiClient.post<ApiResponse<ProofOfPayment>>(
    `/admin/proofs/${proofId}/approve`
  );
  return response.data;
}

export async function rejectProof(
  proofId: string,
  reason: string
): Promise<ApiResponse<ProofOfPayment>> {
  const response = await apiClient.post<ApiResponse<ProofOfPayment>>(
    `/admin/proofs/${proofId}/reject`,
    { reason }
  );
  return response.data;
}

// Generic verify proof helper for admin actions
export async function verifyProof(
  proofId: string,
  data: VerifyProofRequest
): Promise<ApiResponse<ProofOfPayment>> {
  if (data.status === 'VERIFIED') {
    return approveProof(proofId);
  }
  return rejectProof(proofId, data.reason || 'rejected');
}

export async function getPendingProofs(): Promise<ApiResponse<ProofOfPayment[]>> {
  const response = await apiClient.get<ApiResponse<ProofOfPayment[]>>(
    '/admin/proofs/pending'
  );
  return response.data;
}

export async function getDisputes(): Promise<ApiResponse<any[]>> {
  const response = await apiClient.get<ApiResponse<any[]>>(
    '/admin/disputes'
  );
  return response.data;
}

export async function resolveDispute(
  disputeId: string,
  resolution: string
): Promise<ApiResponse<any>> {
  const response = await apiClient.post<ApiResponse<any>>(
    `/admin/disputes/${disputeId}/resolve`,
    { resolution }
  );
  return response.data;
}

export async function getDashboardStats(): Promise<ApiResponse<AdminStatistics>> {
  const response = await apiClient.get<ApiResponse<AdminStatistics>>(
    '/admin/stats/dashboard'
  );
  return response.data;
}

export async function exportExchanges(
  format: 'csv' | 'json'
): Promise<any> {
  const response = await apiClient.get(
    `/admin/exchanges/export/${format}`
  );
  return response.data;
}

// Convenience wrapper for UI components expecting a single API object
export const adminExchangeApi = {
  getStatistics: async () => {
    const res = await getDashboardStats();
    return res.data;
  },
  getRecentRequests: async (limit = 10) => {
    const res = await fetchExchanges({ limit });
    return res.data;
  },
  getActiveMatches: async () => {
    const res = await fetchExchanges({ status: 'MATCHED' });
    return res.data;
  },
  getPendingProofs: async () => {
    const res = await getPendingProofs();
    return res.data;
  },
  verifyProof: async (proofId: string, data: VerifyProofRequest) => {
    const res = await verifyProof(proofId, data);
    return res.data;
  },
  approveProof,
  rejectProof,
  resolveDispute,
};
