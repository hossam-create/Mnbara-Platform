// ============================================================
// Exchange Match Types
// ============================================================

import { Decimal } from 'decimal.js';
import { MatchType, MatchStatus, SettlementMethod } from './enums';

// ============================================================
// Core Types
// ============================================================

export interface ExchangeMatch {
  id: number;
  requestId: number;
  counterRequestId: number;
  matchType: MatchType;
  matchScore: Decimal;
  status: MatchStatus;
  escrowHoldId: number | null;
  externalEscrowId: string | null;
  settlementMethod: SettlementMethod;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompatibleRequest {
  id: number;
  userId: number;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: Decimal;
  toAmount: Decimal;
  desiredRate: Decimal;
  trustLevel: number;
  securityDeposit: Decimal;
  createdAt: Date;
}

export interface MatchScore {
  total: Decimal;
  rateScore: Decimal;
  amountScore: Decimal;
  trustScore: Decimal;
  timeScore: Decimal;
}

// ============================================================
// Input Types
// ============================================================

export interface ManualAcceptInput {
  userId: number;
  requestId: number;
  counterRequestId: number;
}

export interface UpdateMatchStatusInput {
  matchId: number;
  status: MatchStatus;
  escrowHoldId?: number;
  externalEscrowId?: string;
}

// ============================================================
// Result Types
// ============================================================

export interface MatchResult {
  match: ExchangeMatch;
  estimatedSettlementTime: number; // minutes
}

export interface MatchingStats {
  totalMatches: number;
  automaticMatches: number;
  manualMatches: number;
  averageMatchTime: number; // minutes
  averageMatchScore: Decimal;
}
