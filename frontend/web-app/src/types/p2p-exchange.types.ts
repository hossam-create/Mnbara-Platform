// ============================================================
// P2P Exchange Marketplace - TypeScript Type Definitions
// Frontend types matching backend models
// ============================================================

// ============================================================
// ENUMS
// ============================================================

export enum ExchangeStatus {
  OPEN = 'OPEN',
  MATCHED = 'MATCHED',
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PROOF_UPLOADED = 'PROOF_UPLOADED',
  CONFIRMING = 'CONFIRMING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  DISPUTED = 'DISPUTED',
  REFUNDED = 'REFUNDED',
}

export enum MatchType {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
}

export enum MatchStatus {
  PENDING = 'PENDING',
  ESCROWED = 'ESCROWED',
  SETTLING = 'SETTLING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  DISPUTED = 'DISPUTED',
}

export enum SettlementMethod {
  INTERNAL = 'INTERNAL',
  EXTERNAL_OPTIONAL = 'EXTERNAL_OPTIONAL',
  EXTERNAL_MANDATORY = 'EXTERNAL_MANDATORY',
}

export enum SettlementStatus {
  PENDING = 'PENDING',
  PSP_PROCESSING = 'PSP_PROCESSING',
  ESCROW_RELEASING = 'ESCROW_RELEASING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
}

export enum DepositSource {
  TRANSACTION_HISTORY = 'TRANSACTION_HISTORY',
  PLATFORM_FEES = 'PLATFORM_FEES',
  CASH_DEPOSIT = 'CASH_DEPOSIT',
  INITIAL_DEPOSIT = 'INITIAL_DEPOSIT',
}

export enum DepositStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  DEDUCTED = 'DEDUCTED',
  REFUNDED = 'REFUNDED',
}

export enum ProviderType {
  BLOCKCHAIN = 'BLOCKCHAIN',
  MOBILE_WALLET = 'MOBILE_WALLET',
  BANK = 'BANK',
  PAYMENT_PROCESSOR = 'PAYMENT_PROCESSOR',
}

// ============================================================
// EXCHANGE REQUEST
// ============================================================

export interface ExchangeRequest {
  id: number;
  userId: number;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: string;
  toAmount: string;
  desiredRate: string;
  actualRate: string | null;
  platformFee: string;
  protectionFee: string | null;
  status: ExchangeStatus;
  trustLevel: number;
  securityDeposit: string;
  useExternalEscrow: boolean;
  expiresAt: string;
  matchedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExchangeRequestInput {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  desiredRate: number;
  useExternalEscrow?: boolean;
}

export interface UpdateExchangeRequestInput {
  desiredRate?: number;
  useExternalEscrow?: boolean;
}

// ============================================================
// EXCHANGE MATCH
// ============================================================

export interface ExchangeMatch {
  id: number;
  requestId: number;
  counterRequestId: number;
  matchType: MatchType;
  matchScore: string;
  status: MatchStatus;
  escrowHoldId: number | null;
  externalEscrowId: string | null;
  settlementMethod: SettlementMethod;
  createdAt: string;
  updatedAt: string;
  request?: ExchangeRequest;
  counterRequest?: ExchangeRequest;
  settlement?: Settlement;
}

export interface AcceptMatchInput {
  requestId: number;
}

// ============================================================
// SETTLEMENT
// ============================================================

export interface Settlement {
  id: number;
  matchId: number;
  method: SettlementMethod;
  pspProvider: string | null;
  pspTransactionId: string | null;
  pspStatus: string | null;
  externalEscrowProvider: string | null;
  externalEscrowId: string | null;
  status: SettlementStatus;
  initiatedAt: string;
  completedAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  retryCount: number;
}

// ============================================================
// PROOF OF PAYMENT
// ============================================================

export interface ProofOfPayment {
  id: number;
  requestId: number;
  userId: number;
  photoUrl: string;
  videoUrl: string | null;
  timestamp: string;
  referenceId: string;
  recipientName: string;
  paymentMethod: string;
  metadata: Record<string, any> | null;
  verificationStatus: VerificationStatus;
  verifiedBy: number | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface UploadProofInput {
  photo: File;
  video?: File;
  referenceId: string;
  recipientName: string;
  paymentMethod: string;
  metadata?: Record<string, any>;
}

// ============================================================
// SECURITY DEPOSIT
// ============================================================

export interface SecurityDeposit {
  id: number;
  userId: number;
  amount: string;
  currency: string;
  source: DepositSource;
  status: DepositStatus;
  frozenAmount: string;
  frozenReason: string | null;
  frozenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AddDepositInput {
  amount: number;
  currency: string;
  source: DepositSource;
}

// ============================================================
// TRUST LEVEL
// ============================================================

export interface TrustLevel {
  id: number;
  userId: number;
  level: number;
  maxTransactionAmount: string;
  successfulExchanges: number;
  totalVolume: string;
  disputeCount: number;
  timeoutCount: number;
  lastLevelUpAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// COMMUNICATION
// ============================================================

export interface CommunicationLog {
  id: number;
  matchId: number;
  senderId: number;
  recipientId: number;
  message: string;
  flagged: boolean;
  flagReason: string | null;
  createdAt: string;
}

export interface SendMessageInput {
  matchId: number;
  message: string;
}

// ============================================================
// EXTERNAL ESCROW PROVIDER
// ============================================================

export interface ExternalEscrowProvider {
  id: number;
  name: string;
  type: ProviderType;
  country: string | null;
  supportedCurrencies: string[];
  minAmount: string | null;
  maxAmount: string | null;
  feePercentage: string;
  feeFixed: string | null;
  settlementTime: number;
  isActive: boolean;
  enabled: boolean;
  priority: number;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================
// MARKETPLACE FILTERS
// ============================================================

export interface MarketplaceFilters {
  fromCurrency?: string;
  toCurrency?: string;
  minAmount?: number;
  maxAmount?: number;
  minRate?: number;
  maxRate?: number;
  minTrustLevel?: number;
  sortBy?: 'rate' | 'amount' | 'reputation' | 'time';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ============================================================
// ADMIN TYPES
// ============================================================

export interface AdminProofVerificationInput {
  proofId: number;
  status: VerificationStatus;
  rejectionReason?: string;
}

export interface AdminDepositAction {
  userId: number;
  action: 'freeze' | 'unfreeze' | 'deduct';
  amount?: number;
  reason?: string;
}

// ============================================================
// UTILITY TYPES
// ============================================================

export type Currency = 'USD' | 'SAR' | 'AED' | 'EGP' | 'EUR' | 'GBP';

export interface CurrencyPair {
  from: Currency;
  to: Currency;
}

export interface ExchangeRate {
  pair: CurrencyPair;
  rate: number;
  timestamp: string;
}
