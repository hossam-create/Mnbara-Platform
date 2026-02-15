/**
 * Financial Dashboard Types
 * 
 * Type definitions for admin financial overview dashboard.
 */

// ============================================================================
// Overview Metrics
// ============================================================================

export interface FinancialOverviewMetrics {
  totalEscrowHeld: number;
  pendingPayoutsAmount: number;
  platformRevenue: number;
  todayTransactions: {
    count: number;
    value: number;
  };
}

// ============================================================================
// Chart Data
// ============================================================================

export interface DailyTransactionVolume {
  date: string;
  count: number;
  value: number;
}

export interface FeesByCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface PayoutsByStatus {
  status: string;
  count: number;
  amount: number;
}

// ============================================================================
// Escrow Holds
// ============================================================================

export interface EscrowHold {
  id: number;
  requestId: number;
  buyerId: number;
  buyerName: string;
  sellerId: number;
  sellerName: string;
  amount: number;
  fee: number;
  status: string;
  heldDate: Date;
  expectedReleaseDate: Date;
}

export interface EscrowHoldsResponse {
  holds: EscrowHold[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// Transactions
// ============================================================================

export interface WalletTransaction {
  id: number;
  userId: number;
  userName: string;
  type: string;
  amount: number;
  status: string;
  timestamp: Date;
  description?: string;
}

export interface TransactionsResponse {
  transactions: WalletTransaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// Pending Payouts
// ============================================================================

export interface PendingPayout {
  id: string; // UUID from PayoutRequest
  userId: number;
  userName: string;
  amount: number;
  requestedDate: Date;
  status: string;
}

export interface PendingPayoutsResponse {
  payouts: PendingPayout[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// Filters
// ============================================================================

export interface FinancialFilters {
  startDate?: Date;
  endDate?: Date;
  currency?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

// ============================================================================
// Dashboard Response
// ============================================================================

export interface FinancialDashboardData {
  metrics: FinancialOverviewMetrics;
  charts: {
    dailyVolume: DailyTransactionVolume[];
    feesByCategory: FeesByCategory[];
    payoutsByStatus: PayoutsByStatus[];
  };
  recentEscrowHolds: EscrowHold[];
  recentTransactions: WalletTransaction[];
  pendingPayouts: PendingPayout[];
}
