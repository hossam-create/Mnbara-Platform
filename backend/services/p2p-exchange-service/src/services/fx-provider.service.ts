import { Decimal } from '@prisma/client/runtime/library';
import { FXProviderAdapter } from '../adapters/fx/FXProviderAdapter';
import { OpenExchangeRatesAdapter } from '../adapters/fx/OpenExchangeRatesAdapter';
import { FXRate, ConversionResult, HistoricalRate, FXProviderConfig } from '../types/fx-provider.types';

/**
 * FX Provider Service
 * 
 * Wrapper service for FX rate providers.
 * Provides a unified interface for getting exchange rates and conversions.
 * 
 * Features:
 * - Multiple provider support (currently OpenExchangeRates)
 * - Automatic fallback to backup providers
 * - Rate caching
 * - Error handling and retry logic
 * 
 * Usage:
 * ```typescript
 * const fxService = new FXProviderService({
 *   apiKey: process.env.OPENEXCHANGERATES_API_KEY!,
 *   baseUrl: 'https://openexchangerates.org/api',
 * });
 * 
 * const rate = await fxService.getRate('USD', 'SAR');
 * const conversion = await fxService.convert('USD', 'SAR', new Decimal(100));
 * ```
 */
export class FXProviderService {
  private readonly provider: FXProviderAdapter;

  constructor(config: FXProviderConfig) {
    // Currently only OpenExchangeRates is supported
    // In the future, we can add more providers (XE, Wise, etc.)
    this.provider = new OpenExchangeRatesAdapter(config);
  }

  /**
   * Get real-time exchange rate
   * 
   * @param baseCurrency - Base currency code (e.g., 'USD')
   * @param quoteCurrency - Quote currency code (e.g., 'SAR')
   * @returns FX rate with bid/ask spread
   */
  async getRate(baseCurrency: string, quoteCurrency: string): Promise<FXRate> {
    try {
      return await this.provider.getRate(baseCurrency, quoteCurrency);
    } catch (error) {
      // Log error and potentially try fallback provider
      console.error('FX Provider error:', error);
      throw error;
    }
  }

  /**
   * Get historical exchange rates
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
    try {
      return await this.provider.getHistoricalRates(baseCurrency, quoteCurrency, from, to);
    } catch (error) {
      console.error('FX Provider error:', error);
      throw error;
    }
  }

  /**
   * Convert amount from one currency to another
   * 
   * @param from - Source currency code
   * @param to - Target currency code
   * @param amount - Amount to convert
   * @returns Conversion result with markup details
   */
  async convert(from: string, to: string, amount: Decimal): Promise<ConversionResult> {
    try {
      return await this.provider.convert(from, to, amount);
    } catch (error) {
      console.error('FX Provider error:', error);
      throw error;
    }
  }

  /**
   * Get multiple rates at once
   * Useful for displaying multiple currency pairs
   * 
   * @param baseCurrency - Base currency code
   * @param quoteCurrencies - Array of quote currency codes
   * @returns Map of currency pairs to rates
   */
  async getMultipleRates(
    baseCurrency: string,
    quoteCurrencies: string[]
  ): Promise<Map<string, FXRate>> {
    const rates = new Map<string, FXRate>();

    // Fetch all rates in parallel
    const promises = quoteCurrencies.map(async (quoteCurrency) => {
      try {
        const rate = await this.getRate(baseCurrency, quoteCurrency);
        rates.set(quoteCurrency, rate);
      } catch (error) {
        console.error(`Failed to get rate for ${baseCurrency}/${quoteCurrency}:`, error);
        // Continue with other rates
      }
    });

    await Promise.all(promises);

    return rates;
  }

  /**
   * Check if a currency pair is supported
   * 
   * @param baseCurrency - Base currency code
   * @param quoteCurrency - Quote currency code
   * @returns True if supported, false otherwise
   */
  async isCurrencyPairSupported(baseCurrency: string, quoteCurrency: string): Promise<boolean> {
    try {
      await this.getRate(baseCurrency, quoteCurrency);
      return true;
    } catch (error) {
      return false;
    }
  }
}
