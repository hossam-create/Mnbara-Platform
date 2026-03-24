/**
 * Wallet Types for Mnbara Platform
 * Comprehensive type definitions for wallet, payments, and escrow functionality
 */

// Currency types
export type Currency = 'USD' | 'EUR' | 'GBP' | 'EGP' | 'AED' | 'SAR';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  decimals: number;
}

// Wallet types
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  pendingBalance: number;
  currency: Currency;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletBalance {
  available: number;
  pending: number;
  currency: Currency;
  lastUpdated: string;
}

// Transaction types
export type TransactionType = 
  | 'deposit'
  | 'withdrawal'
  | 'purchase'
  | 'sale'
  | 'refund'
  | 'escrow_release'
  | 'escrow_hold'
  | 'dispute_refund'
  | 'fee'
  | 'transfer_in'
  | 'transfer_out';

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: Currency;
  fee: number;
  netAmount: number;
  description: string;
  referenceId?: string;
  relatedTransactionId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilters {
  types?: TransactionType[];
  status?: TransactionStatus[];
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  totalFees: number;
  transactionCount: number;
  period: {
    start: string;
    end: string;
  };
}

// Deposit types
export type PaymentMethod = 'card' | 'bank_transfer' | 'paypal' | 'paymob';

export interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  icon: string;
  description: string;
  currencies: Currency[];
  minAmount: number;
  maxAmount: number;
  processingTime: string;
  fees: {
    percentage: number;
    fixed: number;
  };
}

export interface DepositRequest {
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  returnUrl: string;
  cancelUrl: string;
}

export interface Deposit {
  id: string;
  walletId: string;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  providerReference?: string;
  providerUrl?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepositConfirmation {
  depositId: string;
  amount: number;
  currency: Currency;
  paymentMethod: string;
  status: TransactionStatus;
  timestamp: string;
}

// Withdrawal types
export type WithdrawalStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'failed';

export interface BankAccount {
  id: string;
  userId: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  iban?: string;
  swiftCode?: string;
  country: string;
  isDefault: boolean;
  verified: boolean;
  createdAt: string;
}

export interface WithdrawalLimit {
  daily: number;
  weekly: number;
  monthly: number;
  remaining: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface WithdrawalRequest {
  amount: number;
  currency: Currency;
  bankAccountId: string;
  description?: string;
}

export interface Withdrawal {
  id: string;
  walletId: string;
  bankAccountId: string;
  amount: number;
  currency: Currency;
  fee: number;
  netAmount: number;
  status: WithdrawalStatus;
  rejectionReason?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Escrow types
export type EscrowStatus = 'active' | 'pending_release' | 'released' | 'disputed' | 'refunded' | 'cancelled';

export interface Escrow {
  id: string;
  transactionId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: Currency;
  fee: number;
  netAmount: number;
  status: EscrowStatus;
  description: string;
  releaseConditions?: string;
  disputeDetails?: DisputeDetails;
  timeline: EscrowTimelineEvent[];
  createdAt: string;
  updatedAt: string;
  releaseDeadline?: string;
}

export interface EscrowTimelineEvent {
  id: string;
  escrowId: string;
  event: string;
  description: string;
  timestamp: string;
  actorId?: string;
  actorType?: 'buyer' | 'seller' | 'system' | 'admin';
}

export interface DisputeDetails {
  id: string;
  reason: string;
  description: string;
  filedBy: 'buyer' | 'seller';
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  resolution?: string;
  filedAt: string;
  resolvedAt?: string;
}

export interface EscrowFilters {
  status?: EscrowStatus[];
  buyerId?: string;
  sellerId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Payment types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: Currency;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: PaymentMethod;
  returnUrl: string;
  cancelUrl: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
}

export interface PaymentProvider {
  id: string;
  name: string;
  type: 'card' | 'bank' | 'wallet' | 'local';
  supportedMethods: PaymentMethod[];
  supportedCurrencies: Currency[];
  isActive: boolean;
  logo?: string;
}

// API Response types
export interface WalletApiResponse {
  success: boolean;
  data?: Wallet;
  error?: {
    code: string;
    message: string;
  };
}

export interface TransactionApiResponse {
  success: boolean;
  data?: Transaction | Transaction[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface DepositApiResponse {
  success: boolean;
  data?: Deposit;
  paymentUrl?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface WithdrawalApiResponse {
  success: boolean;
  data?: Withdrawal;
  error?: {
    code: string;
    message: string;
  };
}

export interface EscrowApiResponse {
  success: boolean;
  data?: Escrow | Escrow[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
  };
}


