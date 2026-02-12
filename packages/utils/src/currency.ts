/**
 * Currency formatting utilities
 */

// Currency codes
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'AED' | 'SAR' | 'EGP';

// Currency symbols
const currencySymbols: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  AED: 'د.إ',
  SAR: '﷼',
  EGP: '£',
};

// Currency locales
const currencyLocales: Record<CurrencyCode, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
  AED: 'ar-AE',
  SAR: 'ar-SA',
  EGP: 'ar-EG',
};

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'USD',
  options?: Intl.NumberFormatOptions
): string {
  const locale = currencyLocales[currency] || 'en-US';
  const symbol = currencySymbols[currency] || currency;
  
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  };

  return new Intl.NumberFormat(locale, defaultOptions).format(amount);
}

/**
 * Format a number as a compact currency (e.g., $1.5K, $2.3M)
 */
export function formatCompactCurrency(
  amount: number,
  currency: CurrencyCode = 'USD'
): string {
  if (amount >= 1000000) {
    return formatCurrency(amount / 1000000, currency) + 'M';
  }
  if (amount >= 1000) {
    return formatCurrency(amount / 1000, currency) + 'K';
  }
  return formatCurrency(amount, currency);
}

/**
 * Format a percentage
 */
export function formatPercentage(
  value: number,
  decimals: number = 0
): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(
  value: number,
  decimals: number = 0
): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Parse a currency string to a number
 */
export function parseCurrency(
  value: string,
  currency: CurrencyCode = 'USD'
): number {
  // Remove currency symbol and thousand separators
  const symbol = currencySymbols[currency] || currency;
  const cleaned = value
    .replace(new RegExp(`\\${symbol}`, 'g'), '')
    .replace(/,/g, '')
    .trim();
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Convert between currencies
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  exchangeRates: Record<CurrencyCode, number>
): number {
  const rate = exchangeRates[toCurrency] / exchangeRates[fromCurrency];
  return amount * rate;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  return currencySymbols[currency] || currency;
}

/**
 * Get currency locale
 */
export function getCurrencyLocale(currency: CurrencyCode): string {
  return currencyLocales[currency] || 'en-US';
}
