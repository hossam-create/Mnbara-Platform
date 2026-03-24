import { BaseEntity } from './common.types';

// Payment Method Type Enum
export enum PaymentMethodType {
  CARD = 'card',
  WALLET = 'wallet',
  BANK_TRANSFER = 'bank_transfer',
  CASH_ON_DELIVERY = 'cash_on_delivery',
  ESCROW = 'escrow',
  MOBILE_MONEY = 'mobile_money',
  CRYPTO = 'crypto'
}

// Payment Status Enum
export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  PAID = 'paid',
  PROCESSING = 'processing',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  DECLINED = 'declined'
}

// Payment Provider Enum
export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  SQUARE = 'square',
  INTERNAL_WALLET = 'internal_wallet',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
  ESCROW = 'escrow'
}

// Card Type Enum
export enum CardType {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMEX = 'amex',
  DISCOVER = 'discover',
  DINERS = 'diners',
  JCB = 'jcb',
  UNIONPAY = 'unionpay',
  UNKNOWN = 'unknown'
}

// Currency Enum
export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  SAR = 'SAR',
  AED = 'AED',
  EGP = 'EGP',
  JPY = 'JPY',
  CNY = 'CNY'
}

// Transaction Type Enum
export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  PAYOUT = 'payout',
  TRANSFER = 'transfer',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  FEE = 'fee',
  ADJUSTMENT = 'adjustment',
  CHARGEBACK = 'chargeback'
}

// Refund Status Enum
export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Payout Status Enum
export enum PayoutStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Card Information Interface
export interface CardInfo {
  brand: CardType;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  holderName?: string;
  country?: string;
  fingerprint?: string;
}

// Bank Account Interface
export interface BankAccount {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  routingNumber?: string;
  bankName: string;
  bankCode?: string;
  country: string;
  currency: Currency;
  accountType?: 'checking' | 'savings';
  isVerified: boolean;
  isDefault: boolean;
}

// Payment Method Interface
export interface PaymentMethod extends BaseEntity {
  userId: string;
  type: PaymentMethodType;
  provider: PaymentProvider;
  isDefault: boolean;
  isVerified: boolean;
  card?: CardInfo;
  bankAccount?: BankAccount;
  walletId?: string;
  metadata?: Record<string, unknown>;
}

// Payment Intent Interface
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  paymentMethodId?: string;
  customerId: string;
  orderId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  clientSecret?: string;
  createdAt: Date;
  expiresAt?: Date;
}

// Payment Transaction Interface
export interface PaymentTransaction extends BaseEntity {
  transactionId: string;
  type: TransactionType;
  status: PaymentStatus;
  amount: number;
  currency: Currency;
  fee?: number;
  netAmount: number;
  userId: string;
  orderId?: string;
  paymentMethodId?: string;
  provider: PaymentProvider;
  providerTransactionId?: string;
  description?: string;
  metadata?: PaymentMetadata;
  failureReason?: string;
  processedAt?: Date;
}

// Payment Metadata Interface
export interface PaymentMetadata {
  orderId?: string;
  orderNumber?: string;
  customerId?: string;
  sellerId?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  riskScore?: number;
  fraudCheck?: FraudCheckResult;
  customFields?: Record<string, unknown>;
}

// Fraud Check Result Interface
export interface FraudCheckResult {
  score: number;
  level: 'low' | 'medium' | 'high';
  passed: boolean;
  checks: Array<{
    type: string;
    passed: boolean;
    message?: string;
  }>;
  timestamp: Date;
}

// Payment Refund Interface
export interface PaymentRefund extends BaseEntity {
  refundId: string;
  paymentTransactionId: string;
  amount: number;
  currency: Currency;
  status: RefundStatus;
  reason: string;
  requestedBy: string;
  processedAt?: Date;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}

// Payment Payout Interface
export interface PaymentPayout extends BaseEntity {
  payoutId: string;
  userId: string;
  amount: number;
  currency: Currency;
  status: PayoutStatus;
  bankAccountId: string;
  provider: PaymentProvider;
  providerPayoutId?: string;
  description?: string;
  estimatedArrival?: Date;
  arrivedAt?: Date;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}

// Escrow Payment Interface
export interface EscrowPayment extends BaseEntity {
  escrowId: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: Currency;
  status: 'held' | 'released' | 'refunded' | 'disputed';
  heldAt: Date;
  releasedAt?: Date;
  releaseConditions?: string[];
  disputeId?: string;
  metadata?: Record<string, unknown>;
}

// Payment Gateway Configuration Interface
export interface PaymentGatewayConfig {
  provider: PaymentProvider;
  enabled: boolean;
  publicKey?: string;
  webhookSecret?: string;
  supportedCurrencies: Currency[];
  supportedPaymentMethods: PaymentMethodType[];
  fees: PaymentFeeConfig;
  settings?: Record<string, unknown>;
}

// Payment Fee Configuration Interface
export interface PaymentFeeConfig {
  fixedFee: number;
  percentageFee: number;
  currency: Currency;
  minFee?: number;
  maxFee?: number;
}

// Payment Invoice Interface
export interface PaymentInvoice extends BaseEntity {
  invoiceNumber: string;
  userId: string;
  orderId?: string;
  amount: number;
  currency: Currency;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidAt?: Date;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}

// Invoice Item Interface
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate?: number;
  taxAmount?: number;
}

// Payment Receipt Interface
export interface PaymentReceipt {
  receiptNumber: string;
  transactionId: string;
  paymentDate: Date;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethodType;
  customerName: string;
  customerEmail: string;
  items?: InvoiceItem[];
  subtotal?: number;
  tax?: number;
  total: number;
  metadata?: Record<string, unknown>;
}

// Payment Balance Interface
export interface PaymentBalance {
  userId: string;
  available: number;
  pending: number;
  reserved: number;
  total: number;
  currency: Currency;
  lastUpdated: Date;
}

// Payment Dispute Interface
export interface PaymentDispute extends BaseEntity {
  disputeId: string;
  transactionId: string;
  orderId?: string;
  amount: number;
  currency: Currency;
  status: 'open' | 'under_review' | 'resolved' | 'won' | 'lost';
  reason: string;
  evidence?: DisputeEvidence[];
  openedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
  metadata?: Record<string, unknown>;
}

// Dispute Evidence Interface
export interface DisputeEvidence {
  id: string;
  type: 'document' | 'image' | 'text' | 'tracking';
  content: string;
  description?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

// Payment Webhook Event Interface
export interface PaymentWebhookEvent {
  id: string;
  type: string;
  provider: PaymentProvider;
  data: Record<string, unknown>;
  receivedAt: Date;
  processed: boolean;
  processedAt?: Date;
  error?: string;
}

// Create Payment DTO
export interface CreatePaymentDto {
  amount: number;
  currency: Currency;
  paymentMethodId: string;
  orderId?: string;
  customerId: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

// Create Payment Method DTO
export interface CreatePaymentMethodDto {
  userId: string;
  type: PaymentMethodType;
  provider: PaymentProvider;
  cardToken?: string;
  bankAccountDetails?: {
    accountHolderName: string;
    accountNumber: string;
    routingNumber?: string;
    bankName: string;
    country: string;
  };
  isDefault?: boolean;
}

// Update Payment Method DTO
export interface UpdatePaymentMethodDto {
  isDefault?: boolean;
  card?: Partial<CardInfo>;
  bankAccount?: Partial<BankAccount>;
}

// Create Refund DTO
export interface CreateRefundDto {
  transactionId: string;
  amount: number;
  reason: string;
  notifyCustomer?: boolean;
}

// Create Payout DTO
export interface CreatePayoutDto {
  userId: string;
  amount: number;
  currency: Currency;
  bankAccountId: string;
  description?: string;
}

// Payment Search Filters Interface
export interface PaymentSearchFilters {
  userId?: string;
  orderId?: string;
  status?: PaymentStatus[];
  type?: TransactionType[];
  provider?: PaymentProvider[];
  minAmount?: number;
  maxAmount?: number;
  currency?: Currency;
  createdAfter?: Date;
  createdBefore?: Date;
  searchQuery?: string;
}

// Payment List Response Interface
export interface PaymentListResponse {
  payments: PaymentTransaction[];
  total: number;
  page: number;
  limit: number;
}

// Payment Statistics Interface
export interface PaymentStatistics {
  totalTransactions: number;
  totalAmount: number;
  successfulPayments: number;
  failedPayments: number;
  refundedPayments: number;
  averageTransactionValue: number;
  currency: Currency;
  period: {
    from: Date;
    to: Date;
  };
}

// Payment Analytics Interface
export interface PaymentAnalytics {
  period: 'day' | 'week' | 'month' | 'year';
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  successRate: number;
  refundRate: number;
  chargebackRate: number;
  transactionsByMethod: Record<PaymentMethodType, number>;
  transactionsByStatus: Record<PaymentStatus, number>;
  revenueByDay: Array<{
    date: Date;
    revenue: number;
    transactionCount: number;
  }>;
  topCustomers: Array<{
    userId: string;
    customerName: string;
    totalSpent: number;
    transactionCount: number;
  }>;
}

// Payment Verification Result Interface
export interface PaymentVerificationResult {
  verified: boolean;
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  currency: Currency;
  verifiedAt: Date;
  message?: string;
}

// Payment Idempotency Key Interface
export interface PaymentIdempotencyKey {
  key: string;
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  expiresAt: Date;
}

// Recurring Payment Interface
export interface RecurringPayment extends BaseEntity {
  subscriptionId: string;
  userId: string;
  amount: number;
  currency: Currency;
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  paymentMethodId: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  nextPaymentDate: Date;
  lastPaymentDate?: Date;
  startDate: Date;
  endDate?: Date;
  failedAttempts: number;
  metadata?: Record<string, unknown>;
}

// Payment Settlement Interface
export interface PaymentSettlement extends BaseEntity {
  settlementId: string;
  userId: string;
  amount: number;
  currency: Currency;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionIds: string[];
  bankAccountId: string;
  scheduledDate: Date;
  completedDate?: Date;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}

// Payment Authorization Interface
export interface PaymentAuthorization {
  authorizationId: string;
  amount: number;
  currency: Currency;
  status: 'authorized' | 'captured' | 'voided' | 'expired';
  paymentMethodId: string;
  authorizedAt: Date;
  expiresAt: Date;
  capturedAt?: Date;
  capturedAmount?: number;
  voidedAt?: Date;
  metadata?: Record<string, unknown>;
}

// Payment Chargeback Interface
export interface PaymentChargeback extends BaseEntity {
  chargebackId: string;
  transactionId: string;
  amount: number;
  currency: Currency;
  status: 'pending' | 'under_review' | 'won' | 'lost';
  reason: string;
  reasonCode?: string;
  evidence?: DisputeEvidence[];
  dueDate?: Date;
  resolvedAt?: Date;
  resolution?: string;
  metadata?: Record<string, unknown>;
}

// Payment Fee Breakdown Interface
export interface PaymentFeeBreakdown {
  subtotal: number;
  platformFee: number;
  processingFee: number;
  tax: number;
  total: number;
  currency: Currency;
  feePercentage: number;
}

// Payment Link Interface
export interface PaymentLink extends BaseEntity {
  linkId: string;
  userId: string;
  amount: number;
  currency: Currency;
  description?: string;
  status: 'active' | 'paid' | 'expired' | 'cancelled';
  url: string;
  expiresAt?: Date;
  paidAt?: Date;
  transactionId?: string;
  metadata?: Record<string, unknown>;
}

// Payment Notification Preferences Interface
export interface PaymentNotificationPreferences {
  userId: string;
  emailOnPayment: boolean;
  emailOnRefund: boolean;
  emailOnPayout: boolean;
  smsOnPayment: boolean;
  smsOnRefund: boolean;
  pushOnPayment: boolean;
  pushOnRefund: boolean;
}
