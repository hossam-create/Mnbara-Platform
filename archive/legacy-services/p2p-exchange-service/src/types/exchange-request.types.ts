// ============================================================
// Exchange Request Types
// ============================================================

import { Decimal } from 'decimal.js';
import { ExchangeStatus } from './enums';

export interface ExchangeRequest {
  id: number;
  userId: number;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: Decimal;
  toAmount: Decimal;
  desiredRate: Decimal;
  actualRate?: Decimal | null;
  platformFee: Decimal;
  protectionFee?: Decimal | null;
  status: ExchangeStatus;
  trustLevel: number;
  securityDeposit: Decimal;
  expiresAt: Date;
  matchedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExchangeRequestInput {
  userId: number;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: Decimal;
  desiredRate?: Decimal; // Optional, use market rate if not provided
  expiresIn: number; // Hours
  useExternalEscrow?: boolean; // Optional, for amounts < $1000
}

export interface UpdateExchangeRequestInput {
  requestId: number;
  status?: ExchangeStatus;
  actualRate?: Decimal;
  matchedAt?: Date;
  completedAt?: Date;
}

export interface RequestFilters {
  status?: ExchangeStatus;
  fromCurrency?: string;
  toCurrency?: string;
  minAmount?: Decimal;
  maxAmount?: Decimal;
  minRate?: Decimal;
  maxRate?: Decimal;
  minTrustLevel?: number;
  userId?: number;
  page?: number;
  limit?: number;
  sortBy?: 'rate' | 'amount' | 'reputation' | 'time';
  sortOrder?: 'asc' | 'desc';
}

export interface ExchangeRequestWithUser extends ExchangeRequest {
  userReputation: number;
  estimatedCompletionTime: number; // Minutes
}

export interface CreateRequestResult {
  request: ExchangeRequest;
  estimatedMatchTime: number; // Minutes
}
