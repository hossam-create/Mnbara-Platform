// ============================================================
// Settlement Types
// ============================================================

import { SettlementMethod, SettlementStatus } from './enums';

// ============================================================
// Core Types
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
  initiatedAt: Date;
  completedAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  retryCount: number;
}

// ============================================================
// Input Types
// ============================================================

export interface InitiateSettlementInput {
  matchId: number;
  externalEscrowProvider?: string;
}

export interface PSPWebhookPayload {
  transactionId: string;
  status: string;
  amount?: number;
  currency?: string;
  metadata?: {
    matchId?: number;
    failureReason?: string;
    [key: string]: any;
  };
}

export interface ExternalEscrowWebhookPayload {
  escrowId: string;
  status: string;
  amount?: number;
  currency?: string;
  metadata?: {
    matchId?: number;
    [key: string]: any;
  };
}

// ============================================================
// Result Types
// ============================================================

export interface SettlementResult {
  settlement: Settlement;
  estimatedCompletionTime: number; // minutes
}

export interface SettlementStats {
  totalSettlements: number;
  completedSettlements: number;
  failedSettlements: number;
  averageSettlementTime: number; // minutes
  successRate: number; // percentage
}
