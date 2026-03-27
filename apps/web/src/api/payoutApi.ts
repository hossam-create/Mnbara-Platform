// Payout API Client
import axios from 'axios';
import { PayoutRequest, PayoutFilters, PayoutStats, WalletTransaction } from '../types/payout.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const payoutApi = {
  // Get pending payouts
  getPendingPayouts: async (filters?: PayoutFilters): Promise<PayoutRequest[]> => {
    const params = new URLSearchParams();
    if (filters?.minAmount) params.append('minAmount', filters.minAmount.toString());
    if (filters?.maxAmount) params.append('maxAmount', filters.maxAmount.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await api.get(`/api/admin/payouts/pending?${params.toString()}`);
    return response.data.data;
  },

  // Get all payouts with filters
  getAllPayouts: async (filters?: PayoutFilters): Promise<PayoutRequest[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.method) params.append('method', filters.method);
    if (filters?.fromDate) params.append('fromDate', filters.fromDate.toISOString());
    if (filters?.toDate) params.append('toDate', filters.toDate.toISOString());
    if (filters?.minAmount) params.append('minAmount', filters.minAmount.toString());
    if (filters?.maxAmount) params.append('maxAmount', filters.maxAmount.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await api.get(`/api/admin/payouts?${params.toString()}`);
    return response.data.data;
  },

  // Get payout details with decrypted account info
  getPayoutDetails: async (id: string): Promise<PayoutRequest> => {
    const response = await api.get(`/api/admin/payouts/${id}`);
    return response.data.data;
  },

  // Approve payout
  approvePayout: async (id: string): Promise<PayoutRequest> => {
    const response = await api.post(`/api/admin/payouts/${id}/approve`);
    return response.data.data;
  },

  // Reject payout
  rejectPayout: async (id: string, rejectionReason: string): Promise<PayoutRequest> => {
    const response = await api.post(`/api/admin/payouts/${id}/reject`, {
      rejectionReason,
    });
    return response.data.data;
  },

  // Mark as processing
  markAsProcessing: async (id: string): Promise<PayoutRequest> => {
    const response = await api.post(`/api/admin/payouts/${id}/process`);
    return response.data.data;
  },

  // Complete payout
  completePayout: async (id: string, notes?: string): Promise<PayoutRequest> => {
    const response = await api.post(`/api/admin/payouts/${id}/complete`, {
      notes,
    });
    return response.data.data;
  },

  // Get payout stats
  getPayoutStats: async (): Promise<PayoutStats> => {
    const response = await api.get('/api/admin/payouts/stats');
    return response.data.data;
  },

  // Get user wallet history
  getUserWalletHistory: async (userId: number): Promise<WalletTransaction[]> => {
    const response = await api.get(`/api/admin/wallets/${userId}/transactions`);
    return response.data.data;
  },
};
