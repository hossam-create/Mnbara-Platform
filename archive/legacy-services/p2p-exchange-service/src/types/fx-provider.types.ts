import { Decimal } from '@prisma/client/runtime/library';

/**
 * FX Rate data structure
 */
export interface FXRate {
  baseCurrency: string;
  quoteCurrency: string;
  rate: Decimal;
  bid: Decimal;
  ask: Decimal;
  timestamp: Date;
  source: string;
}

/**
 * Currency conversion result
 */
export interface ConversionResult {
  from: {
    currency: string;
    amount: Decimal;
  };
  to: {
    currency: string;
    amount: Decimal;
    beforeMarkup: Decimal;
  };
  rate: Decimal;
  markup: {
    amount: Decimal;
    currency: string;
    percentage: number;
  };
  timestamp: Date;
}

/**
 * Historical rate data point
 */
export interface HistoricalRate {
  date: Date;
  rate: Decimal;
  baseCurrency: string;
  quoteCurrency: string;
}

/**
 * FX Provider configuration
 */
export interface FXProviderConfig {
  apiKey: string;
  baseUrl: string;
  cacheTTL?: number; // seconds
  timeout?: number; // milliseconds
}

/**
 * FX Provider adapter interface
 */
export interface FXProviderAdapter {
  /**
   * Get real-time exchange rate
   */
  getRate(baseCurrency: string, quoteCurrency: string): Promise<FXRate>;

  /**
   * Get historical exchange rates
   */
  getHistoricalRates(
    baseCurrency: string,
    quoteCurrency: string,
    from: Date,
    to: Date
  ): Promise<HistoricalRate[]>;

  /**
   * Convert amount from one currency to another
   */
  convert(from: string, to: string, amount: Decimal): Promise<ConversionResult>;
}

/**
 * Cache entry structure
 */
export interface CacheEntry<T> {
  data: T;
  expiresAt: Date;
}

/**
 * OpenExchangeRates API response
 */
export interface OpenExchangeRatesResponse {
  disclaimer: string;
  license: string;
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}

/**
 * OpenExchangeRates historical API response
 */
export interface OpenExchangeRatesHistoricalResponse {
  disclaimer: string;
  license: string;
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}
