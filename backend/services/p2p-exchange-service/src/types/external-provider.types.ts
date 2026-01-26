// ============================================================
// External Provider Types
// ============================================================

import { Decimal } from 'decimal.js';
import { ProviderType } from './enums';

export interface ExternalEscrowProvider {
  id: number;
  name: string;
  type: ProviderType;
  country?: string | null;
  supportedCurrencies: string[];
  minAmount?: Decimal | null;
  maxAmount?: Decimal | null;
  feePercentage: Decimal;
  feeFixed?: Decimal | null;
  settlementTime: number; // Minutes
  apiEndpoint: string;
  apiKey?: string | null;
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProviderInput {
  name: string;
  type: ProviderType;
  country?: string;
  supportedCurrencies: string[];
  minAmount?: Decimal;
  maxAmount?: Decimal;
  feePercentage: Decimal;
  feeFixed?: Decimal;
  settlementTime: number;
  apiEndpoint: string;
  apiKey?: string;
  priority?: number;
}

export interface UpdateProviderInput {
  providerId: number;
  name?: string;
  type?: ProviderType;
  country?: string;
  supportedCurrencies?: string[];
  minAmount?: Decimal;
  maxAmount?: Decimal;
  feePercentage?: Decimal;
  feeFixed?: Decimal;
  settlementTime?: number;
  apiEndpoint?: string;
  apiKey?: string;
  isActive?: boolean;
  priority?: number;
}

export interface ProviderFilters {
  amount: Decimal;
  currency: string;
  country?: string;
  type?: ProviderType;
}

export interface ProviderWithFees extends ExternalEscrowProvider {
  calculatedFee: Decimal;
  totalCost: Decimal;
  recommended: boolean;
}

// FX Provider Types
export interface FXRate {
  baseCurrency: string;
  quoteCurrency: string;
  rate: Decimal;
  timestamp: Date;
  source: string;
}

export interface ConversionResult {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: Decimal;
  toAmount: Decimal;
  rate: Decimal;
  timestamp: Date;
}

export interface FXProviderConfig {
  apiKey: string;
  baseUrl: string;
  cacheTTL: number; // Seconds
}
