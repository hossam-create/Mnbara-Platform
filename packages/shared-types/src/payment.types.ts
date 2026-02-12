// Payment Status Enum
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

// Payment Method Enum
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet',
  CASH = 'cash',
  CRYPTO = 'crypto'
}

// Payment Type Enum
export enum PaymentType {
  ORDER_PAYMENT = 'order_payment',
  REFUND = 'refund',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
  FEE = 'fee',
  TIP = 'tip'
}

// Transaction Type Enum
export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit'
}

// Payment Interface
export interface Payment {
  id: string;
  transactionId: string;
  orderId?: string;
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  type: PaymentType;
  status: PaymentStatus;
  metadata?: PaymentMetadata;
  paymentGatewayId?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Metadata Interface
export interface PaymentMetadata {
  cardLast4?: string;
  cardBrand?: string;
  bankName?: string;
  walletProvider?: string;
  cryptoCurrency?: string;
  cryptoAddress?: string;
}

// Payment Request Interface
export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  customerId: string;
  vendorId: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

// Refund Interface
export interface Refund {
  id: string;
  paymentId: string;
  orderId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  processedBy?: string;
  processedAt?: Date;
  createdAt: Date;
}

// Refund Status Enum
export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REJECTED = 'rejected'
}

// Wallet Interface
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  frozenBalance: number;
  pendingTransactions: number;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction Interface
export interface Transaction {
  id: string;
  walletId: string;
  paymentId?: string;
  type: TransactionType;
  amount: number;
  currency: string;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// Payout Interface
export interface Payout {
  id: string;
  vendorId: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  method: PaymentMethod;
  bankAccount?: BankAccountInfo;
  scheduledAt: Date;
  processedAt?: Date;
  createdAt: Date;
}

// Payout Status Enum
export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Bank Account Info Interface
export interface BankAccountInfo {
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
  accountType: 'checking' | 'savings';
}

// Payment Filter Interface
export interface PaymentFilter {
  userId?: string;
  orderId?: string;
  status?: PaymentStatus[];
  method?: PaymentMethod[];
  type?: PaymentType[];
  dateFrom?: Date;
  dateTo?: Date;
}

// Payment Pagination Params
export interface PaymentPaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: PaymentFilter;
}
