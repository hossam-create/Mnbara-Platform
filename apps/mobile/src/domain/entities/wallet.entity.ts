// Wallet Entity - Domain Model
// Payments and wallet management

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'payment'
  | 'refund'
  | 'earning'
  | 'commission'
  | 'bonus';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export type PaymentMethodType = 'card' | 'bank_account' | 'apple_pay' | 'google_pay';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  description: string;
  referenceId?: string;
  paymentMethodId?: string;
  fee?: number;
  netAmount?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  completedAt?: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  availableBalance: number;
  pendingBalance: number;
  currency: string;
  isFrozen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
  isDefault: boolean;
  verified: boolean;
}

// Payment Intent DTO
export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, any>;
}

// Payment Intent Response
export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

// Withdrawal Request DTO
export interface WithdrawalRequest {
  amount: number;
  paymentMethodId: string;
}

// Add Payment Method DTO
export interface AddPaymentMethodRequest {
  type: PaymentMethodType;
  tokenId: string;
  setAsDefault: boolean;
}

// Wallet Statistics
export interface WalletStats {
  totalEarnings: number;
  totalSpent: number;
  totalWithdrawn: number;
  pendingBalance: number;
  monthlyEarnings: number;
  monthlySpent: number;
}

// Top-up Request DTO
export interface TopUpRequest {
  amount: number;
  paymentMethodId: string;
}

// Transaction Filter
export interface TransactionFilter {
  type?: TransactionType[];
  status?: TransactionStatus[];
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Wallet Response
export interface WalletResponse {
  data: Wallet;
  success: boolean;
}

// Transaction Response
export interface TransactionResponse {
  data: Transaction;
  success: boolean;
}

// Transaction List Response
export interface TransactionListResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
