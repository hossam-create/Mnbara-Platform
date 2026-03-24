// ============================================================
// PHASE 4.1 — Wallet & Ledger Type Definitions
// ============================================================

/**
 * Wallet owner types
 */
export enum OwnerType {
  USER = 'USER',
  SELLER = 'SELLER',
  TRAVELER = 'TRAVELER',
  SYSTEM = 'SYSTEM',
}

/**
 * Wallet status
 */
export enum WalletStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  CLOSED = 'CLOSED',
}

/**
 * Ledger entry direction
 */
export enum EntryType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

/**
 * Business reason for ledger entry
 */
export enum LedgerReason {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  PURCHASE_HOLD = 'PURCHASE_HOLD',
  PURCHASE_RELEASE = 'PURCHASE_RELEASE',
  REFUND = 'REFUND',
  PAYOUT = 'PAYOUT',
  FEE = 'FEE',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  AUCTION_BID = 'AUCTION_BID',
  AUCTION_RELEASE = 'AUCTION_RELEASE',
}

/**
 * Reference type for audit trail
 */
export enum ReferenceType {
  ORDER = 'ORDER',
  ESCROW = 'ESCROW',
  TRANSFER = 'TRANSFER',
  MANUAL = 'MANUAL',
  SYSTEM = 'SYSTEM',
  AUCTION = 'AUCTION',
}

/**
 * Wallet entity (without balance - derived from ledger)
 */
export interface Wallet {
  id: string;
  ownerType: OwnerType;
  ownerId: string;
  currency: string;
  status: WalletStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Wallet with computed balance
 */
export interface WalletWithBalance extends Wallet {
  balance: bigint;
}

/**
 * Ledger entry entity
 */
export interface LedgerEntry {
  id: string;
  walletId: string;
  entryType: EntryType;
  amount: bigint;
  reason: LedgerReason;
  description: string | null;
  referenceType: ReferenceType;
  referenceId: string | null;
  idempotencyKey: string;
  balanceAfter: bigint;
  createdAt: Date;
  createdBy: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Ledger filter options
 */
export interface LedgerFilterOptions extends PaginationOptions {
  entryType?: EntryType;
  reason?: LedgerReason;
  referenceType?: ReferenceType;
  referenceId?: string;
  fromDate?: Date;
  toDate?: Date;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    messageAr?: string;
  };
}
