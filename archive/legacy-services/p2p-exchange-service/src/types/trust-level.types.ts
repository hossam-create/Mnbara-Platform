// ============================================================
// Trust Level Types
// ============================================================

import { Decimal } from 'decimal.js';

export interface TrustLevel {
  id: number;
  userId: number;
  level: number;
  maxTransactionAmount: Decimal;
  successfulExchanges: number;
  totalVolume: Decimal;
  disputeCount: number;
  timeoutCount: number;
  lastLevelUpAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTrustLevelInput {
  userId: number;
  level?: number;
  maxTransactionAmount?: Decimal;
}

export interface UpdateTrustLevelInput {
  userId: number;
  level?: number;
  maxTransactionAmount?: Decimal;
  successfulExchanges?: number;
  totalVolume?: Decimal;
  disputeCount?: number;
  timeoutCount?: number;
  lastLevelUpAt?: Date;
}

export interface TrustLevelRequirements {
  level: number;
  maxTransactionAmount: Decimal;
  requiredExchanges: number;
  requiredVolume: Decimal;
  maxDisputes: number;
  maxTimeouts: number;
}

export interface NextLevelRequirements {
  currentLevel: number;
  nextLevel: number;
  exchangesNeeded: number;
  volumeNeeded: Decimal;
  canUpgrade: boolean;
}

export interface TrustLevelCheck {
  canPerformExchange: boolean;
  reason?: string;
  maxAllowedAmount: Decimal;
}
