// ============================================================
// Phase 2: Internal Ledger Types
// Double-entry bookkeeping, matching, and compliance types
// ============================================================

import { Decimal } from 'decimal.js';

// ============================================================
// Double-Entry Ledger Types
// ============================================================

export interface LedgerEntry {
  id: string;
  transactionId: string;
  entryType: LedgerEntryType;
  accountType: AccountType;
  accountId: string;
  debitAmount: Decimal;
  creditAmount: Decimal;
  currency: string;
  runningBalance: Decimal;
  description: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: Date;
}

export enum LedgerEntryType {
  JOURNAL = 'JOURNAL',
  ADJUSTMENT = 'ADJUSTMENT',
  CORRECTION = 'CORRECTION',
  REVERSAL = 'REVERSAL',
}

export enum AccountType {
  WALLET_AVAILABLE = 'WALLET_AVAILABLE',
  WALLET_LOCKED = 'WALLET_LOCKED',
  PLATFORM_FEE = 'PLATFORM_FEE',
  PROCESSING_FEE = 'PROCESSING_FEE',
  ESCROW_HOLD = 'ESCROW_HOLD',
  SETTLEMENT_POOL = 'SETTLEMENT_POOL',
  HOLDING_ACCOUNT = 'HOLDING_ACCOUNT',
  FEE_REVERSAL = 'FEE_REVERSAL',
}

export interface CreateLedgerEntryInput {
  transactionId: string;
  entryType: LedgerEntryType;
  accountType: AccountType;
  accountId: string;
  debitAmount: Decimal;
  creditAmount: Decimal;
  currency: string;
  description: string;
  referenceType?: string;
  referenceId?: string;
}

export interface LedgerBalance {
  accountType: AccountType;
  accountId: string;
  totalDebits: Decimal;
  totalCredits: Decimal;
  balance: Decimal;
  currency: string;
}

// ============================================================
// Buyer/Seller Matching Types
// ============================================================

export interface BuyRequest {
  id: string;
  userId: number;
  currency: string;
  amount: Decimal;
  maxPricePerUnit: Decimal;
  totalMaxAmount: Decimal;
  status: BuyRequestStatus;
  priority: number;
  matchedAmount: Decimal;
  matchedOfferIds: string[];
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum BuyRequestStatus {
  OPEN = 'OPEN',
  PARTIALLY_MATCHED = 'PARTIALLY_MATCHED',
  FULLY_MATCHED = 'FULLY_MATCHED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface SellOffer {
  id: string;
  userId: number;
  currency: string;
  amount: Decimal;
  minPricePerUnit: Decimal;
  totalMinAmount: Decimal;
  status: SellOfferStatus;
  priority: number;
  matchedAmount: Decimal;
  matchedRequestIds: string[];
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum SellOfferStatus {
  OPEN = 'OPEN',
  PARTIALLY_MATCHED = 'PARTIALLY_MATCHED',
  FULLY_MATCHED = 'FULLY_MATCHED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface CreateBuyRequestInput {
  userId: number;
  currency: string;
  amount: Decimal;
  maxPricePerUnit: Decimal;
  priority?: number;
  expiresAt?: Date;
}

export interface CreateSellOfferInput {
  userId: number;
  currency: string;
  amount: Decimal;
  minPricePerUnit: Decimal;
  priority?: number;
  expiresAt?: Date;
}

// ============================================================
// Settlement Types
// ============================================================

export interface MatchingSettlement {
  id: string;
  buyerId: number;
  sellerId: number;
  buyRequestId: string;
  sellOfferId: string;
  currency: string;
  amount: Decimal;
  pricePerUnit: Decimal;
  totalAmount: Decimal;
  platformFee: Decimal;
  processingFee: Decimal;
  totalFees: Decimal;
  status: SettlementStatus;
  processedAt?: Date;
  completedAt?: Date;
  settlementRef?: string;
}

export enum SettlementStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK',
}

export interface CreateSettlementInput {
  buyerId: number;
  sellerId: number;
  buyRequestId: string;
  sellOfferId: string;
  currency: string;
  amount: Decimal;
  pricePerUnit: Decimal;
  platformFeeRate?: Decimal;
  processingFeeRate?: Decimal;
}

export interface SettlementResult {
  settlement: MatchingSettlement;
  buyerLedgerEntries: LedgerEntry[];
  sellerLedgerEntries: LedgerEntry[];
  feeLedgerEntries: LedgerEntry[];
}

// ============================================================
// Fee Calculation Types
// ============================================================

export interface FeeCalculation {
  platformFee: Decimal;
  processingFee: Decimal;
  totalFees: Decimal;
  netAmount: Decimal;
  breakdown: FeeBreakdown[];
}

export interface FeeBreakdown {
  feeType: string;
  rate: Decimal;
  amount: Decimal;
  description: string;
}

export interface FeeConfig {
  platformFeeRate: Decimal;       // e.g., 0.02 = 2%
  processingFeeRate: Decimal;     // e.g., 0.029 = 2.9%
  processingFeeFixed: Decimal;    // e.g., 0.30 = $0.30
  minPlatformFee: Decimal;
  maxPlatformFee: Decimal;
  feeExemptUserIds: number[];
}

// ============================================================
// Compliance Types
// ============================================================

export interface ComplianceCheck {
  id: string;
  checkType: ComplianceCheckType;
  userId?: number;
  transactionId?: string;
  settlementId?: string;
  status: ComplianceStatus;
  riskLevel?: RiskLevel;
  riskScore?: number;
  passedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  checkData?: Record<string, unknown>;
  createdAt: Date;
  expiresAt?: Date;
}

export enum ComplianceCheckType {
  IDENTITY_VERIFICATION = 'IDENTITY_VERIFICATION',
  ADDRESS_VERIFICATION = 'ADDRESS_VERIFICATION',
  WATCHLIST_SCREENING = 'WATCHLIST_SCREENING',
  TRANSACTION_MONITORING = 'TRANSACTION_MONITORING',
  SANCTIONS_CHECK = 'SANCTIONS_CHECK',
  PEP_SCREENING = 'PEP_SCREENING',
  SOURCE_OF_FUNDS = 'SOURCE_OF_FUNDS',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
}

export enum ComplianceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  REVIEW_REQUIRED = 'REVIEW_REQUIRED',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface TransactionLimit {
  id: string;
  userId: number;
  limitType: LimitType;
  maxAmount: Decimal;
  period: LimitPeriod;
  usedAmount: Decimal;
  remainingAmount: Decimal;
  isActive: boolean;
  resetAt?: Date;
}

export enum LimitType {
  DAILY_DEPOSIT = 'DAILY_DEPOSIT',
  DAILY_WITHDRAWAL = 'DAILY_WITHDRAWAL',
  DAILY_TRANSACTION = 'DAILY_TRANSACTION',
  WEEKLY_TRANSACTION = 'WEEKLY_TRANSACTION',
  MONTHLY_TRANSACTION = 'MONTHLY_TRANSACTION',
  SINGLE_TRANSACTION = 'SINGLE_TRANSACTION',
  ESCROW_HOLD = 'ESCROW_HOLD',
}

export enum LimitPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  LIFETIME = 'LIFETIME',
}

export interface LimitCheckResult {
  allowed: boolean;
  limitType: LimitType;
  requestedAmount: Decimal;
  currentUsage: Decimal;
  remainingAmount: Decimal;
  failureReason?: string;
}

// ============================================================
// Audit Trail Types
// ============================================================

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId?: number;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  changes?: Record<string, { from: unknown; to: unknown }>;
  description?: string;
  metadata?: Record<string, unknown>;
  isVerified: boolean;
  verifiedBy?: number;
  verifiedAt?: Date;
  createdAt: Date;
}

export interface CreateAuditLogInput {
  action: string;
  entityType: string;
  entityId: string;
  userId?: number;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  description?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================
// Rollback Types
// ============================================================

export interface RollbackRecord {
  id: string;
  originalTransactionId: string;
  entityType: string;
  entityId: string;
  reason: string;
  status: RollbackStatus;
  triggeredBy?: number;
  triggerType: TriggerType;
  processedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  compensationData?: Record<string, unknown>;
  createdAt: Date;
}

export enum RollbackStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum TriggerType {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
  COMPLIANCE = 'COMPLIANCE',
  FRAUD_DETECTION = 'FRAUD_DETECTION',
  USER_REQUEST = 'USER_REQUEST',
}

export interface CreateRollbackInput {
  originalTransactionId: string;
  entityType: string;
  entityId: string;
  reason: string;
  triggeredBy?: number;
  triggerType: TriggerType;
  compensationData?: Record<string, unknown>;
}

export interface RollbackResult {
  success: boolean;
  rollbackRecord: RollbackRecord;
  compensatingTransactions: LedgerEntry[];
  error?: string;
}
