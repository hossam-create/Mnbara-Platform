/**
 * Admin Service
 * API service for admin dashboard operations
 * Requirements: 11.1, 11.2, 11.3, 11.4 - Admin user management
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'buyer' | 'seller' | 'traveler' | 'admin';
  status: 'active' | 'suspended' | 'banned';
  kycStatus: 'none' | 'pending' | 'verified' | 'rejected';
  ratingAvg: number;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
  lastLoginCountry?: string;
  lastLoginDevice?: string;
}

export interface UserDetail extends User {
  totalOrders: number;
  totalSpent: number;
  totalEarnings: number;
  walletBalance: number;
  rewardsBalance: number;
  transactions: Transaction[];
  orders: Order[];
  kycDocuments?: KYCDocument[];
}

export interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'withdrawal' | 'deposit' | 'escrow_hold' | 'escrow_release';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  description?: string;
}

export interface Order {
  id: string;
  listingTitle: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface KYCDocument {
  id: string;
  type: 'passport' | 'drivers_license' | 'national_id';
  frontImageUrl: string;
  backImageUrl?: string;
  selfieUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface KYCSubmission {
  id: string;
  userId: string;
  user: User;
  documents: KYCDocument[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingKYC: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  usersByRole: {
    buyer: number;
    seller: number;
    traveler: number;
    admin: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  kycStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Admin Service
export const adminService = {
  // User Management
  getUsers: async (filters: UserFilters = {}): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get('/admin/users', { params: filters });
    return response.data;
  },

  getUser: async (userId: string): Promise<UserDetail> => {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  },

  getUserStats: async (): Promise<UserStats> => {
    const response = await apiClient.get('/admin/users/stats');
    return response.data;
  },

  updateUserStatus: async (
    userId: string,
    status: 'active' | 'suspended' | 'banned',
    reason?: string
  ): Promise<User> => {
    const response = await apiClient.patch(`/admin/users/${userId}/status`, {
      status,
      reason,
    });
    return response.data;
  },

  updateUserRole: async (userId: string, role: string): Promise<User> => {
    const response = await apiClient.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  // KYC Management
  getKYCSubmissions: async (
    filters: { page?: number; limit?: number; status?: string } = {}
  ): Promise<PaginatedResponse<KYCSubmission>> => {
    const response = await apiClient.get('/admin/kyc', { params: filters });
    return response.data;
  },

  getKYCSubmission: async (submissionId: string): Promise<KYCSubmission> => {
    const response = await apiClient.get(`/admin/kyc/${submissionId}`);
    return response.data;
  },

  approveKYC: async (submissionId: string): Promise<KYCSubmission> => {
    const response = await apiClient.post(`/admin/kyc/${submissionId}/approve`);
    return response.data;
  },

  rejectKYC: async (submissionId: string, reason: string): Promise<KYCSubmission> => {
    const response = await apiClient.post(`/admin/kyc/${submissionId}/reject`, { reason });
    return response.data;
  },

  getKYCStats: async (): Promise<{ pending: number; approved: number; rejected: number }> => {
    const response = await apiClient.get('/admin/kyc/stats');
    return response.data;
  },

  // Dispute Management
  getDisputes: async (filters: { page?: number; limit?: number; status?: string } = {}): Promise<PaginatedResponse<Dispute>> => {
    const response = await apiClient.get('/admin/disputes', { params: filters });
    return response.data;
  },

  getDisputeStats: async (): Promise<{ open: number; resolved: number; escalated: number }> => {
    const response = await apiClient.get('/admin/disputes/stats');
    return response.data;
  },

  // Audit Logs
  getUserAuditLogs: async (
    userId: string,
    filters: { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<any>> => {
    const response = await apiClient.get(`/admin/users/${userId}/audit-logs`, {
      params: filters,
    });
    return response.data;
  },

  // Dashboard
  getDashboardStats: async (): Promise<{
    kyc: { pending: number; approved: number; rejected: number };
    disputes: { open: number; resolved: number; escalated: number };
    guarantees: { active: number; completed: number; disputed: number };
  }> => {
    const response = await apiClient.get('/admin/dashboard/stats');
    return response.data;
  },

  // Audit & Logging
  logDeviceEvent: async (userId: string, event: any): Promise<void> => {
    await apiClient.post('/audit/event', {
      action: 'SECURITY_AUDIT',
      description: `Device event for user ${userId}`,
      actorId: parseInt(userId),
      metadata: event,
      severity: 'INFO',
    });
  },

  logManualDecision: async (action: string, metadata: any): Promise<void> => {
    await apiClient.post('/audit/event', {
      action: 'ADMIN_ACTION',
      description: `Manual decision: ${action}`,
      metadata: metadata,
      severity: 'MEDIUM',
      actorRole: 'admin',
    });
  },

  // Payments & Trust
  getPaymentIntent: async (intentId: string): Promise<any> => {
    const response = await apiClient.get(`/payments/intent/${intentId}`);
    return response.data;
  },
};

export default adminService;

// Analytics Types
export interface DashboardKPIs {
  gmv: number;
  gmvChange: number;
  totalUsers: number;
  usersChange: number;
  totalOrders: number;
  ordersChange: number;
  activeAuctions: number;
  auctionsChange: number;
  pendingDisputes: number;
  pendingKYC: number;
  escrowHeld: number;
  crowdshipDeliveries: number;
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  createdAt: string;
  link?: string;
}

export interface PendingAction {
  id: string;
  type: 'kyc' | 'dispute' | 'withdrawal' | 'report';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  link: string;
}

export interface TransactionTrend {
  date: string;
  transactions: number;
  volume: number;
  orders: number;
}

export interface AuctionActivity {
  date: string;
  activeAuctions: number;
  bidsPlaced: number;
  auctionsCompleted: number;
  avgBidAmount: number;
}

export interface CrowdshipMetrics {
  date: string;
  deliveriesCompleted: number;
  deliveriesInProgress: number;
  avgDeliveryTime: number;
  travelerEarnings: number;
}

export interface ReportExportParams {
  type: 'transactions' | 'users' | 'orders' | 'auctions' | 'crowdship';
  startDate: string;
  endDate: string;
  format: 'csv' | 'excel';
}

// Analytics Service Methods
export const analyticsService = {
  /**
   * Get dashboard KPIs with comparison to previous period
   * Requirements: 13.1 - Display key metrics: GMV, active users, listings, completed orders
   */
  getDashboardKPIs: async (period: string = '7d'): Promise<DashboardKPIs> => {
    const response = await apiClient.get('/admin/analytics/kpis', { params: { period } });
    return response.data;
  },

  /**
   * Get key alerts for the dashboard
   * Requirements: 13.1 - Display key alerts
   */
  getAlerts: async (): Promise<Alert[]> => {
    const response = await apiClient.get('/admin/analytics/alerts');
    return response.data;
  },

  /**
   * Get pending actions requiring admin attention
   * Requirements: 13.1 - Display pending actions
   */
  getPendingActions: async (): Promise<PendingAction[]> => {
    const response = await apiClient.get('/admin/analytics/pending-actions');
    return response.data;
  },

  /**
   * Get transaction trends over time
   * Requirements: 13.2 - Create transaction trends chart
   */
  getTransactionTrends: async (
    startDate: string,
    endDate: string
  ): Promise<TransactionTrend[]> => {
    const response = await apiClient.get('/admin/analytics/transactions/trends', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  /**
   * Get auction activity metrics
   * Requirements: 13.2, 13.3 - Add auction activity chart, display real-time auction monitoring
   */
  getAuctionActivity: async (
    startDate: string,
    endDate: string
  ): Promise<AuctionActivity[]> => {
    const response = await apiClient.get('/admin/analytics/auctions/activity', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  /**
   * Get crowdship delivery metrics
   * Requirements: 13.2 - Create crowdship delivery metrics chart
   */
  getCrowdshipMetrics: async (
    startDate: string,
    endDate: string
  ): Promise<CrowdshipMetrics[]> => {
    const response = await apiClient.get('/admin/analytics/crowdship/metrics', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  /**
   * Export report data as CSV or Excel
   * Requirements: 13.4 - Provide export functionality for reports
   */
  exportReport: async (params: ReportExportParams): Promise<Blob> => {
    const response = await apiClient.get('/admin/analytics/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get real-time auction statistics
   * Requirements: 13.3 - Display real-time auction monitoring with active bid counts
   */
  getRealTimeAuctionStats: async (): Promise<{
    activeAuctions: number;
    totalBidsToday: number;
    highestBidToday: number;
    endingSoon: number;
  }> => {
    const response = await apiClient.get('/admin/analytics/auctions/realtime');
    return response.data;
  },
};


// Dispute Types
export interface Dispute {
  id: string;
  orderId: string;
  order: {
    id: string;
    listingTitle: string;
    amount: number;
    buyerId: string;
    sellerId: string;
  };
  raisedBy: 'buyer' | 'seller';
  raisedByUser: User;
  reason: string;
  description: string;
  status: 'open' | 'under_review' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high';
  evidence: DisputeEvidence[];
  messages: DisputeMessage[];
  resolution?: {
    outcome: 'refund_buyer' | 'release_seller' | 'partial_refund' | 'no_action';
    amount?: number;
    notes: string;
    resolvedBy: string;
    resolvedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DisputeEvidence {
  id: string;
  type: 'image' | 'document' | 'text';
  url?: string;
  content?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface DisputeMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'buyer' | 'seller' | 'admin';
  message: string;
  createdAt: string;
}

export interface DisputeFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
}

// Resolution result interface for escrow operations
export interface DisputeResolutionResult {
  dispute: Dispute;
  escrowAction?: {
    type: 'release' | 'refund' | 'partial_refund' | 'none';
    amount?: number;
    transactionId?: string;
    status: 'success' | 'failed' | 'pending';
    message?: string;
  };
  auditLogId?: string;
}

// Dispute Service Methods
export const disputeService = {
  getDisputes: async (filters: DisputeFilters = {}): Promise<PaginatedResponse<Dispute>> => {
    const response = await apiClient.get('/admin/disputes', { params: filters });
    return response.data;
  },

  getDispute: async (disputeId: string): Promise<Dispute> => {
    const response = await apiClient.get(`/admin/disputes/${disputeId}`);
    return response.data;
  },

  updateDisputeStatus: async (disputeId: string, status: string): Promise<Dispute> => {
    const response = await apiClient.patch(`/admin/disputes/${disputeId}/status`, { status });
    return response.data;
  },

  /**
   * Resolve a dispute with escrow action
   * Requirements: 12.3, 12.4, 17.3 - Implement dispute resolution with escrow release/refund
   * 
   * This method:
   * 1. Validates the resolution outcome
   * 2. Triggers appropriate escrow action (release/refund)
   * 3. Logs the resolution action for audit
   * 4. Updates the dispute status to resolved
   */
  resolveDispute: async (
    disputeId: string,
    resolution: {
      outcome: 'refund_buyer' | 'release_seller' | 'partial_refund' | 'no_action';
      amount?: number;
      notes: string;
    }
  ): Promise<DisputeResolutionResult> => {
    const response = await apiClient.post(`/admin/disputes/${disputeId}/resolve`, resolution);
    return response.data;
  },

  /**
   * Trigger escrow release to seller
   * Requirements: 12.3 - Implement escrow release trigger
   */
  triggerEscrowRelease: async (
    disputeId: string,
    orderId: string
  ): Promise<{ success: boolean; transactionId?: string; message: string }> => {
    const response = await apiClient.post(`/admin/disputes/${disputeId}/escrow/release`, {
      orderId,
    });
    return response.data;
  },

  /**
   * Trigger escrow refund to buyer
   * Requirements: 12.3 - Implement escrow refund trigger
   */
  triggerEscrowRefund: async (
    disputeId: string,
    orderId: string,
    amount?: number
  ): Promise<{ success: boolean; transactionId?: string; message: string }> => {
    const response = await apiClient.post(`/admin/disputes/${disputeId}/escrow/refund`, {
      orderId,
      amount,
    });
    return response.data;
  },

  /**
   * Get dispute resolution audit logs
   * Requirements: 12.4 - Log resolution action for audit
   */
  getResolutionAuditLogs: async (
    disputeId: string
  ): Promise<{
    logs: Array<{
      id: string;
      action: string;
      actorId: string;
      actorName: string;
      description: string;
      metadata: Record<string, any>;
      createdAt: string;
    }>;
  }> => {
    const response = await apiClient.get(`/admin/disputes/${disputeId}/audit-logs`);
    return response.data;
  },

  addMessage: async (disputeId: string, message: string): Promise<DisputeMessage> => {
    const response = await apiClient.post(`/admin/disputes/${disputeId}/messages`, { message });
    return response.data;
  },
};
