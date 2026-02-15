import axios, { AxiosInstance } from 'axios';
import { Decimal } from '@prisma/client/runtime/library';
import { FXProviderAdapter } from './FXProviderAdapter';
import {
  FXRate,
  ConversionResult,
  HistoricalRate,
  FXProviderConfig,
  CacheEntry,
  OpenExchangeRatesResponse,
  OpenExchangeRatesHistoricalResponse,
} from '../../types/fx-provider.types';

/**
 * OpenExchangeRates.org API Adapter
 * 
 * Provides real-time and historical FX rates from OpenExchangeRates.org.
 * Implements caching to reduce API calls and improve performance.
 * 
 * Features:
 * - Real-time exchange rates
 * - Historical rates
 * - Currency conversion with platform markup
 * - In-memory caching (60s TTL)
 * - Bid/ask spread calculation (0.1%)
 * - Platform markup (0.3%)
 * 
 * API Documentation: https://docs.openexchangerates.org/
 */
export class OpenExchangeRatesAdapter implements FXProviderAdapter {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly cacheTTL: number;
  private readonly timeout: number;
  private readonly client: AxiosInstance;
  private readonly cache: Map<string, CacheEntry<FXRate>>;

  /**
   * Platform FX markup percentage (0.3%)
   * Applied on top of the exchange rate
   */
  private readonly PLATFORM_MARKUP = 0.003;

  /**
   * Bid/ask spread percentage (0.1%)
   * Simulates market spread
   */
  private readonly SPREAD = 0.001;

  constructor(config: FXProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://openexchangerates.org/api';
    this.cacheTTL = (config.cacheTTL || 60) * 1000; // Convert to milliseconds
    this.timeout = config.timeout || 5000;
    this.cache = new Map();

    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get real-time exchange rate
   * 
   * Checks cache first, then fetches from API if needed.
   * Caches result for 60 seconds (configurable).
   * 
   * @param baseCurrency - Base currency code (e.g., 'USD')
   * @param quoteCurrency - Quote currency code (e.g., 'SAR')
   * @returns FX rate with bid/ask spread
   */
  async getRate(baseCurrency: string, quoteCurrency: string): Promise<FXRate> {
    // Validate currencies
    this.validateCurrency(baseCurrency);
    this.validateCurrency(quoteCurrency);

    // Check cache
    const cacheKey = `${baseCurrency}:${quoteCurrency}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.expiresAt > new Date()) {
      return cached.data;
    }

    // Fetch from API
    try {
      const response = await this.client.get<OpenExchangeRatesResponse>('/latest.json', {
        params: {
          app_id: this.apiKey,
          base: baseCurrency,
          symbols: quoteCurrency,
        },
      });

      // Extract rate from response
      const rateValue = response.data.rates[quoteCurrency];
      if (!rateValue) {
        throw new Error(`Rate not found for ${quoteCurrency}`);
      }

      // Calculate bid/ask spread
      const rate = new Decimal(rateValue);
      const bid = rate.mul(1 - this.SPREAD); // 0.1% below mid
      const ask = rate.mul(1 + this.SPREAD); // 0.1% above mid

      const fxRate: FXRate = {
        baseCurrency,
        quoteCurrency,
        rate,
        bid,
        ask,
        timestamp: new Date(response.data.timestamp * 1000),
        source: 'OpenExchangeRates',
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: fxRate,
        expiresAt: new Date(Date.now() + this.cacheTTL),
      });

      return fxRate;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `OpenExchangeRates API error: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Get historical exchange rates
   * 
   * Fetches historical rates for each day in the date range.
   * Note: OpenExchangeRates free plan only supports daily historical data.
   * 
   * @param baseCurrency - Base currency code
   * @param quoteCurrency - Quote currency code
   * @param from - Start date
   * @param to - End date
   * @returns Array of historical rates
   */
  async getHistoricalRates(
    baseCurrency: string,
    quoteCurrency: string,
    from: Date,
    to: Date
  ): Promise<HistoricalRate[]> {
    // Validate inputs
    this.validateCurrency(baseCurrency);
    this.validateCurrency(quoteCurrency);
    
    if (from > to) {
      throw new Error('Start date must be before end date');
    }

    const rates: HistoricalRate[] = [];
    const currentDate = new Date(from);

    try {
      // Fetch rate for each day
      while (currentDate <= to) {
        const dateStr = this.formatDate(currentDate);
        
        const response = await this.client.get<OpenExchangeRatesHistoricalResponse>(
          `/historical/${dateStr}.json`,
          {
            params: {
              app_id: this.apiKey,
              base: baseCurrency,
              symbols: quoteCurrency,
            },
          }
        );

        const rateValue = response.data.rates[quoteCurrency];
        if (rateValue) {
          rates.push({
            date: new Date(currentDate),
            rate: new Decimal(rateValue),
            baseCurrency,
            quoteCurrency,
          });
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return rates;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `OpenExchangeRates API error: ${error.response?.data?.message || error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Convert amount from one currency to another
   * 
   * Uses ask rate (user pays spread) and applies platform markup (0.3%).
   * 
   * @param from - Source currency code
   * @param to - Target currency code
   * @param amount - Amount to convert
   * @returns Conversion result with markup details
   */
  async convert(from: string, to: string, amount: Decimal): Promise<ConversionResult> {
    // Validate amount
    if (amount.lte(0)) {
      throw new Error('Amount must be greater than zero');
    }

    // Get current rate
    const rate = await this.getRate(from, to);

    // Use ask rate (user pays spread)
    const convertedAmount = amount.mul(rate.ask);

    // Apply platform markup (0.3%)
    const markupAmount = convertedAmount.mul(this.PLATFORM_MARKUP);
    const finalAmount = convertedAmount.minus(markupAmount);

    return {
      from: {
        currency: from,
        amount,
      },
      to: {
        currency: to,
        amount: finalAmount,
        beforeMarkup: convertedAmount,
      },
      rate: rate.ask,
      markup: {
        amount: markupAmount,
        currency: to,
        percentage: this.PLATFORM_MARKUP * 100, // Convert to percentage
      },
      timestamp: new Date(),
    };
  }

  /**
   * Validate currency code format
   * 
   * @param currency - Currency code to validate
   * @throws Error if currency code is invalid
   */
  private validateCurrency(currency: string): void {
    if (!currency || currency.length !== 3) {
      throw new Error(`Invalid currency code: ${currency}`);
    }
    
    // Currency codes should be uppercase
    if (currency !== currency.toUpperCase()) {
      throw new Error(`Currency code must be uppercase: ${currency}`);
    }
  }

  /**
   * Format date as YYYY-MM-DD for API requests
   * 
   * @param date - Date to format
   * @returns Formatted date string
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Clear the cache
   * Useful for testing or forcing fresh data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * Useful for monitoring and debugging
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
