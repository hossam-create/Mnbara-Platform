// ============================================================
// PHASE 4.1 — Money Utilities
// All money operations use integer minor units
// ============================================================

/**
 * Currency configuration
 */
interface CurrencyConfig {
  code: string;
  symbol: string;
  decimalPlaces: number;
  name: string;
  nameAr: string;
}

const CURRENCY_CONFIG: Record<string, CurrencyConfig> = {
  EGP: {
    code: 'EGP',
    symbol: 'ج.م',
    decimalPlaces: 2,
    name: 'Egyptian Pound',
    nameAr: 'جنيه مصري',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    decimalPlaces: 2,
    name: 'US Dollar',
    nameAr: 'دولار أمريكي',
  },
  SAR: {
    code: 'SAR',
    symbol: 'ر.س',
    decimalPlaces: 2,
    name: 'Saudi Riyal',
    nameAr: 'ريال سعودي',
  },
};

/**
 * Convert major units (e.g., 10.50) to minor units (e.g., 1050)
 */
export function toMinorUnits(amount: number, currency: string = 'EGP'): bigint {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.EGP;
  const multiplier = Math.pow(10, config.decimalPlaces);
  // Round to avoid floating point issues
  return BigInt(Math.round(amount * multiplier));
}

/**
 * Convert minor units (e.g., 1050) to major units (e.g., 10.50)
 */
export function toMajorUnits(minorUnits: bigint, currency: string = 'EGP'): number {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.EGP;
  const divisor = Math.pow(10, config.decimalPlaces);
  return Number(minorUnits) / divisor;
}

/**
 * Format minor units to human-readable string
 * e.g., 1050 EGP → "10.50 ج.م"
 */
export function formatMoney(minorUnits: bigint, currency: string = 'EGP'): string {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.EGP;
  const majorUnits = toMajorUnits(minorUnits, currency);
  return `${majorUnits.toFixed(config.decimalPlaces)} ${config.symbol}`;
}

/**
 * Format minor units to plain decimal string
 * e.g., 1050 → "10.50"
 */
export function formatDecimal(minorUnits: bigint, currency: string = 'EGP'): string {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.EGP;
  const majorUnits = toMajorUnits(minorUnits, currency);
  return majorUnits.toFixed(config.decimalPlaces);
}

/**
 * Validate amount is positive
 */
export function isPositiveAmount(amount: bigint): boolean {
  return amount > BigInt(0);
}

/**
 * Check if debit would cause negative balance
 */
export function wouldCauseNegativeBalance(currentBalance: bigint, debitAmount: bigint): boolean {
  return currentBalance < debitAmount;
}

/**
 * Generate idempotency key for ledger entry
 */
export function generateIdempotencyKey(
  operation: string,
  referenceId: string,
  amount: bigint
): string {
  return `${operation}:${referenceId}:${amount.toString()}`;
}

/**
 * Parse amount string to bigint (handles both integer and decimal strings)
 */
export function parseAmount(amountStr: string, currency: string = 'EGP'): bigint {
  const num = parseFloat(amountStr);
  if (isNaN(num)) {
    throw new Error(`Invalid amount: ${amountStr}`);
  }
  // If it's already an integer string, treat as minor units
  if (Number.isInteger(num) && !amountStr.includes('.')) {
    return BigInt(amountStr);
  }
  // Otherwise convert from major units
  return toMinorUnits(num, currency);
}

/**
 * Get currency configuration
 */
export function getCurrencyConfig(currency: string): CurrencyConfig | null {
  return CURRENCY_CONFIG[currency] || null;
}

/**
 * Check if currency is supported
 */
export function isSupportedCurrency(currency: string): boolean {
  return currency in CURRENCY_CONFIG;
}
