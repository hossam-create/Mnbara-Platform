/**
 * Centralized Enum Definitions
 * 
 * Single source of truth for all enums used across the auction service.
 * This prevents duplication and ensures consistency.
 */

// ============================================================
// LISTING & AUCTION ENUMS
// ============================================================

export enum ListingStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  SOLD = 'SOLD',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  DELETED = 'DELETED',
}

export enum BidStatus {
  ACTIVE = 'ACTIVE',
  OUTBID = 'OUTBID',
  WINNING = 'WINNING',
  WON = 'WON',
  CANCELLED = 'CANCELLED',
  INVALIDATED = 'INVALIDATED',
  SETTLED = 'SETTLED',
}

// ============================================================
// DISPUTE ENUMS
// ============================================================

export enum DisputeReason {
  FRAUD_SUSPECTED = 'FRAUD_SUSPECTED',
  DUPLICATE_BID = 'DUPLICATE_BID',
  BOT_ACTIVITY = 'BOT_ACTIVITY',
  ESCROW_FAILURE_POST_ACCEPT = 'ESCROW_FAILURE_POST_ACCEPT',
  RULE_VIOLATION = 'RULE_VIOLATION',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
}

export enum ResolutionType {
  DISMISS = 'DISMISS',
  INVALIDATE = 'INVALIDATE',
  ESCALATE = 'ESCALATE',
}

// ============================================================
// TRUST SYSTEM ENUMS
// ============================================================

export enum TrustScoreLevel {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  WATCH = 'WATCH',
  RESTRICTED = 'RESTRICTED',
}

export enum TrustActionType {
  TEMPORARY_SUSPENSION = 'TEMPORARY_SUSPENSION',
  PERMANENT_BAN = 'PERMANENT_BAN',
  ESCROW_HOLD = 'ESCROW_HOLD',
  RATE_LIMIT = 'RATE_LIMIT',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
}

export enum TrustSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum SafeguardType {
  RATE_LIMIT = 'RATE_LIMIT',
  ESCROW_HOLD = 'ESCROW_HOLD',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
  TEMPORARY_SUSPENSION = 'TEMPORARY_SUSPENSION',
  PERMANENT_BAN = 'PERMANENT_BAN',
}

export enum SafeguardScope {
  USER = 'USER',
  AUCTION = 'AUCTION',
  GLOBAL = 'GLOBAL',
}

// ============================================================
// APPEAL ENUMS
// ============================================================

export enum AppealStatus {
  OPEN = 'OPEN',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ESCALATED = 'ESCALATED',
}

export enum AppealReason {
  DISPUTE_UNFAIR = 'DISPUTE_UNFAIR',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  EVIDENCE_FOUND = 'EVIDENCE_FOUND',
  POLICY_VIOLATION = 'POLICY_VIOLATION',
}

// ============================================================
// ANALYTICS ENUMS
// ============================================================

export enum AuctionEndReason {
  SOLD = 'SOLD',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  RESERVE_NOT_MET = 'RESERVE_NOT_MET',
}

export enum AnalyticsEventType {
  AUCTION_CREATED = 'AUCTION_CREATED',
  AUCTION_STARTED = 'AUCTION_STARTED',
  AUCTION_ENDED = 'AUCTION_ENDED',
  BID_PLACED = 'BID_PLACED',
  BID_INVALIDATED = 'BID_INVALIDATED',
  DISPUTE_CREATED = 'DISPUTE_CREATED',
  DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',
  APPEAL_CREATED = 'APPEAL_CREATED',
  APPEAL_RESOLVED = 'APPEAL_RESOLVED',
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get all values of an enum
 */
export function getEnumValues<T extends Record<string, string>>(enumObj: T): string[] {
  return Object.values(enumObj);
}

/**
 * Check if a value is valid for an enum
 */
export function isValidEnumValue<T extends Record<string, string>>(
  enumObj: T,
  value: unknown
): value is T[keyof T] {
  return Object.values(enumObj).includes(value as string);
}

/**
 * Get enum key from value
 */
export function getEnumKey<T extends Record<string, string>>(
  enumObj: T,
  value: string
): keyof T | undefined {
  return Object.keys(enumObj).find(key => enumObj[key as keyof T] === value) as keyof T | undefined;
}
