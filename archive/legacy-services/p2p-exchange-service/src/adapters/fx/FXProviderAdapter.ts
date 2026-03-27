import { Decimal } from '@prisma/client/runtime/library';
import { FXRate, ConversionResult, HistoricalRate } from '../../types/fx-provider.types';

/**
 * FX Provider Adapter Interface
 * 
 * Defines the contract for all FX rate providers.
 * Implementations must provide real-time rates, conversions, and historical data.
 */
export interface FXProviderAdapter {
  /**
   * Get real-time exchange rate between two currencies
   * 
   * @param baseCurrency - Base currency code (e.g., 'USD')
   * @param quoteCurrency - Quote currency code (e.g., 'SAR')
   * @returns FX rate with bid/ask spread
   * @throws Error if currencies are invalid or API fails
   */
  getRate(baseCurrency: string, quoteCurrency: string): Promise<FXRate>;

  /**
   * Get historical exchange rates for a date range
   * 
   * @param baseCurrency - Base currency code
   * @param quoteCurrency - Quote currency code
   * @param from - Start date
   * @param to - End date
   * @returns Array of historical rates
   * @throws Error if date range is invalid or API fails
   */
  getHistoricalRates(
    baseCurrency: string,
    quoteCurrency: string,
    from: Date,
    to: Date
  ): Promise<HistoricalRate[]>;

  /**
   * Convert amount from one currency to another
   * 
   * Applies platform markup (0.3%) on top of the exchange rate.
   * 
   * @param from - Source currency code
   * @param to - Target currency code
   * @param amount - Amount to convert
   * @returns Conversion result with markup details
   * @throws Error if currencies are invalid or API fails
   */
  convert(from: string, to: string, amount: Decimal): Promise<ConversionResult>;
}
