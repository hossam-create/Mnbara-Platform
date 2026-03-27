/**
 * Payment Methods Configuration
 * READ-ONLY - Static rules for advisory only
 *
 * HARD RULES:
 * - No calls to banks
 * - No PSP SDKs
 * - No payment APIs
 * - Config only - no execution
 */

import { PaymentMethodConfig } from '../types/payment-advisory.types';

/**
 * Static payment method configurations
 * Used for comparison and advisory only
 */
export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'CARD_VISA_MC',
    name: 'Credit/Debit Card (Visa/Mastercard)',
    type: 'CARD',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'AED', 'EGP', 'SAR'],
    supportedCorridors: ['US_EG', 'US_AE', 'US_SA', 'UK_EG', 'UK_AE', 'DE_EG', 'FR_AE'],
    feeStructure: {
      fixedFee: 0.3,
      percentageFee: 2.9,
      currency: 'USD',
      minFee: 0.5,
      maxFee: 50,
    },
    processingTime: {
      minHours: 0,
      maxHours: 24,
      typical: 'Instant to 24 hours',
    },
    limits: {
      minAmount: 1,
      maxAmount: 10000,
      dailyLimit: 25000,
      currency: 'USD',
    },
    riskLevel: 'LOW',
    requiresKYC: false,
    available: true,
  },
  {
    id: 'BANK_TRANSFER_SWIFT',
    name: 'Bank Transfer (SWIFT)',
    type: 'BANK_TRANSFER',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'AED', 'EGP', 'SAR'],
    supportedCorridors: ['US_EG', 'US_AE', 'US_SA', 'UK_EG', 'UK_AE', 'DE_EG', 'FR_AE'],
    feeStructure: {
      fixedFee: 25,
      percentageFee: 0,
      currency: 'USD',
      minFee: 25,
      maxFee: 50,
    },
    processingTime: {
      minHours: 24,
      maxHours: 120,
      typical: '1-5 business days',
    },
    limits: {
      minAmount: 100,
      maxAmount: 100000,
      dailyLimit: 100000,
      currency: 'USD',
    },
    riskLevel: 'LOW',
    requiresKYC: true,
    available: true,
  },
  {
    id: 'WALLET_PAYPAL',
    name: 'PayPal',
    type: 'WALLET',
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    supportedCorridors: ['US_AE', 'UK_AE'],
    feeStructure: {
      fixedFee: 0.3,
      percentageFee: 3.49,
      currency: 'USD',
      minFee: 0.5,
      maxFee: 100,
    },
    processingTime: {
      minHours: 0,
      maxHours: 48,
      typical: 'Instant to 48 hours',
    },
    limits: {
      minAmount: 1,
      maxAmount: 10000,
      dailyLimit: 10000,
      currency: 'USD',
    },
    riskLevel: 'MEDIUM',
    requiresKYC: false,
    available: true,
  },
  {
    id: 'WALLET_PAYMOB',
    name: 'Paymob (Egypt)',
    type: 'WALLET',
    supportedCurrencies: ['EGP', 'USD'],
    supportedCorridors: ['US_EG', 'UK_EG', 'DE_EG'],
    feeStructure: {
      fixedFee: 0,
      percentageFee: 2.75,
      currency: 'EGP',
      minFee: 5,
      maxFee: 500,
    },
    processingTime: {
      minHours: 0,
      maxHours: 24,
      typical: 'Instant to 24 hours',
    },
    limits: {
      minAmount: 10,
      maxAmount: 50000,
      dailyLimit: 100000,
      currency: 'EGP',
    },
    riskLevel: 'LOW',
    requiresKYC: true,
    available: true,
  },
  {
    id: 'COD',
    name: 'Cash on Delivery',
    type: 'COD',
    supportedCurrencies: ['EGP', 'AED', 'SAR'],
    supportedCorridors: ['US_EG', 'US_AE', 'US_SA'],
    feeStructure: {
      fixedFee: 5,
      percentageFee: 3,
      currency: 'USD',
      minFee: 5,
      maxFee: 30,
    },
    processingTime: {
      minHours: 0,
      maxHours: 0,
      typical: 'At delivery',
    },
    limits: {
      minAmount: 1,
      maxAmount: 500,
      dailyLimit: 1000,
      currency: 'USD',
    },
    riskLevel: 'HIGH',
    requiresKYC: false,
    available: true,
  },
];

/**
 * FX Rate Snapshot Configuration
 * Static rates for advisory - NOT live rates
 * In production, these would be updated from external snapshot
 */
export interface FXSnapshotConfig {
  baseCurrency: string;
  rates: Record<string, number>;
  source: string;
  timestamp: string;
  validUntil: string;
}

export const FX_SNAPSHOT: FXSnapshotConfig = {
  baseCurrency: 'USD',
  rates: {
    EUR: 0.92,
    GBP: 0.79,
    EGP: 30.9,
    AED: 3.67,
    SAR: 3.75,
  },
  source: 'STATIC_SNAPSHOT',
  timestamp: new Date().toISOString(),
  validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

/**
 * Get payment methods for a corridor
 */
export function getMethodsForCorridor(corridorId: string): PaymentMethodConfig[] {
  return PAYMENT_METHODS.filter(
    (m) => m.available && m.supportedCorridors.includes(corridorId)
  );
}

/**
 * Get payment method by ID
 */
export function getMethodById(methodId: string): PaymentMethodConfig | null {
  return PAYMENT_METHODS.find((m) => m.id === methodId) || null;
}

/**
 * Calculate fee for a payment method
 * READ-ONLY calculation - no actual charges
 */
export function calculateFee(method: PaymentMethodConfig, amountUSD: number): number {
  const percentFee = amountUSD * (method.feeStructure.percentageFee / 100);
  const totalFee = method.feeStructure.fixedFee + percentFee;
  return Math.max(method.feeStructure.minFee, Math.min(method.feeStructure.maxFee, totalFee));
}

/**
 * Get FX rate from snapshot
 * READ-ONLY - no live API calls
 */
export function getFXRate(fromCurrency: string, toCurrency: string): number | null {
  if (fromCurrency === FX_SNAPSHOT.baseCurrency) {
    return FX_SNAPSHOT.rates[toCurrency] || null;
  }
  if (toCurrency === FX_SNAPSHOT.baseCurrency) {
    const rate = FX_SNAPSHOT.rates[fromCurrency];
    return rate ? 1 / rate : null;
  }
  // Cross rate
  const fromRate = FX_SNAPSHOT.rates[fromCurrency];
  const toRate = FX_SNAPSHOT.rates[toCurrency];
  if (fromRate && toRate) {
    return toRate / fromRate;
  }
  return null;
}
