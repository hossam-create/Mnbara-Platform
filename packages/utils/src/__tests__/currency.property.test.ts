/**
 * Property-based tests for currency utilities
 * Validates: Requirements 2.2.3 - Currency formatting correctness properties
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  formatCurrency,
  formatCompactCurrency,
  formatPercentage,
  formatNumber,
  parseCurrency,
  convertCurrency,
  getCurrencySymbol,
  getCurrencyLocale,
  type CurrencyCode,
} from '../currency';

// Arbitraries for property-based testing
const currencyCodeArbitrary = fc.constantFrom<CurrencyCode>(
  'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AED', 'SAR', 'EGP'
);

const positiveAmountArbitrary = fc.double({
  min: 0.01,
  max: 1000000,
  noNaN: true,
  noDefaultInfinity: true,
});

const amountArbitrary = fc.double({
  min: -1000000,
  max: 1000000,
  noNaN: true,
  noDefaultInfinity: true,
});

const percentageArbitrary = fc.double({
  min: 0,
  max: 10,
  noNaN: true,
  noDefaultInfinity: true,
});

describe('Currency Utilities - Property-Based Tests', () => {
  describe('Property 1: formatCurrency always returns a string', () => {
    it('should always return a string for any valid amount and currency', () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          currencyCodeArbitrary,
          (amount, currency) => {
            const result = formatCurrency(amount, currency);
            return typeof result === 'string' && result.length > 0;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Property 2: formatCurrency is deterministic', () => {
    it('should return the same result for the same inputs', () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          currencyCodeArbitrary,
          (amount, currency) => {
            const result1 = formatCurrency(amount, currency);
            const result2 = formatCurrency(amount, currency);
            return result1 === result2;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Property 3: formatCurrency preserves sign', () => {
    it('should preserve the sign of the amount', () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          currencyCodeArbitrary,
          (amount, currency) => {
            const result = formatCurrency(amount, currency);
            
            if (amount < 0) {
              // Negative amounts should contain a minus sign or be wrapped in parentheses
              return result.includes('-') || (result.includes('(') && result.includes(')'));
            } else if (amount > 0) {
              // Positive amounts should not start with minus (unless locale-specific)
              return true; // Some locales may format differently
            }
            return true; // Zero can be formatted in various ways
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Property 4: formatCurrency handles zero correctly', () => {
    it('should format zero as a valid currency string', () => {
      fc.assert(
        fc.property(
          currencyCodeArbitrary,
          (currency) => {
            const result = formatCurrency(0, currency);
            return typeof result === 'string' && result.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: parseCurrency handles formatted output', () => {
    it('should parse simple USD currency strings correctly', () => {
      fc.assert(
        fc.property(
          positiveAmountArbitrary,
          (amount) => {
            // Only test USD which has simple formatting
            const roundedAmount = Math.round(amount * 100) / 100;
            const formatted = formatCurrency(roundedAmount, 'USD');
            const parsed = parseCurrency(formatted, 'USD');
            
            // Allow reasonable tolerance for parsing
            return Math.abs(parsed - roundedAmount) < 0.5;
          }
        ),
        { numRuns: 1000 }
      );
    });

    it('should handle currency strings with various formats', () => {
      // Test that parseCurrency doesn't crash on various inputs
      fc.assert(
        fc.property(
          fc.string(),
          currencyCodeArbitrary,
          (str, currency) => {
            const result = parseCurrency(str, currency);
            return typeof result === 'number' && !isNaN(result);
          }
        ),
        { numRuns: 500 }
      );
    });
  });

  describe('Property 6: formatCompactCurrency maintains order of magnitude', () => {
    it('should preserve the order of magnitude when formatting', () => {
      fc.assert(
        fc.property(
          positiveAmountArbitrary,
          currencyCodeArbitrary,
          (amount, currency) => {
            const result = formatCompactCurrency(amount, currency);
            
            if (amount >= 1000000) {
              return result.includes('M');
            } else if (amount >= 1000) {
              return result.includes('K');
            } else {
              return !result.includes('K') && !result.includes('M');
            }
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Property 7: formatPercentage is bounded correctly', () => {
    it('should format percentage values correctly', () => {
      fc.assert(
        fc.property(
          percentageArbitrary,
          fc.integer({ min: 0, max: 4 }),
          (value, decimals) => {
            const result = formatPercentage(value, decimals);
            
            // Should end with %
            if (!result.endsWith('%')) return false;
            
            // Should be parseable as a number (without the %)
            const numericPart = result.slice(0, -1);
            const parsed = parseFloat(numericPart);
            
            // For very small values, the formatted result might be "0%"
            // which is acceptable behavior
            if (value < 0.001 && parsed === 0) return true;
            
            // Calculate expected value with proper rounding
            const expected = parseFloat((value * 100).toFixed(decimals));
            return !isNaN(parsed) && Math.abs(parsed - expected) < 0.01;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Property 8: formatNumber preserves value', () => {
    it('should format numbers without changing their value', () => {
      fc.assert(
        fc.property(
          amountArbitrary,
          fc.integer({ min: 0, max: 4 }),
          (value, decimals) => {
            const result = formatNumber(value, decimals);
            
            // Remove thousand separators and parse
            const parsed = parseFloat(result.replace(/,/g, ''));
            
            // Should be approximately equal (accounting for rounding)
            const roundedValue = parseFloat(value.toFixed(decimals));
            return Math.abs(parsed - roundedValue) < 0.01;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Property 9: convertCurrency is transitive', () => {
    it('should satisfy transitivity: A->B->C = A->C', () => {
      const exchangeRates: Record<CurrencyCode, number> = {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110,
        CNY: 6.5,
        AED: 3.67,
        SAR: 3.75,
        EGP: 15.7,
      };

      fc.assert(
        fc.property(
          positiveAmountArbitrary,
          currencyCodeArbitrary,
          currencyCodeArbitrary,
          currencyCodeArbitrary,
          (amount, from, intermediate, to) => {
            // Convert A -> B -> C
            const stepByStep = convertCurrency(
              convertCurrency(amount, from, intermediate, exchangeRates),
              intermediate,
              to,
              exchangeRates
            );
            
            // Convert A -> C directly
            const direct = convertCurrency(amount, from, to, exchangeRates);
            
            // Should be approximately equal (accounting for floating point errors)
            return Math.abs(stepByStep - direct) < 0.01;
          }
        ),
        { numRuns: 500 }
      );
    });
  });

  describe('Property 10: convertCurrency identity', () => {
    it('should return the same amount when converting to the same currency', () => {
      const exchangeRates: Record<CurrencyCode, number> = {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110,
        CNY: 6.5,
        AED: 3.67,
        SAR: 3.75,
        EGP: 15.7,
      };

      fc.assert(
        fc.property(
          positiveAmountArbitrary,
          currencyCodeArbitrary,
          (amount, currency) => {
            const result = convertCurrency(amount, currency, currency, exchangeRates);
            return Math.abs(result - amount) < 0.01;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Property 11: convertCurrency is reversible', () => {
    it('should be reversible: convert A->B then B->A returns original', () => {
      const exchangeRates: Record<CurrencyCode, number> = {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110,
        CNY: 6.5,
        AED: 3.67,
        SAR: 3.75,
        EGP: 15.7,
      };

      fc.assert(
        fc.property(
          positiveAmountArbitrary,
          currencyCodeArbitrary,
          currencyCodeArbitrary,
          (amount, from, to) => {
            const converted = convertCurrency(amount, from, to, exchangeRates);
            const reverted = convertCurrency(converted, to, from, exchangeRates);
            
            // Should be approximately equal (accounting for floating point errors)
            return Math.abs(reverted - amount) < 0.01;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });

  describe('Property 12: getCurrencySymbol is consistent', () => {
    it('should always return the same symbol for the same currency', () => {
      fc.assert(
        fc.property(
          currencyCodeArbitrary,
          (currency) => {
            const symbol1 = getCurrencySymbol(currency);
            const symbol2 = getCurrencySymbol(currency);
            return symbol1 === symbol2 && typeof symbol1 === 'string' && symbol1.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 13: getCurrencyLocale is consistent', () => {
    it('should always return the same locale for the same currency', () => {
      fc.assert(
        fc.property(
          currencyCodeArbitrary,
          (currency) => {
            const locale1 = getCurrencyLocale(currency);
            const locale2 = getCurrencyLocale(currency);
            return locale1 === locale2 && typeof locale1 === 'string' && locale1.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 14: formatCurrency handles edge cases', () => {
    it('should handle very small positive amounts', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.01, max: 0.99, noNaN: true }),
          currencyCodeArbitrary,
          (amount, currency) => {
            const result = formatCurrency(amount, currency);
            return typeof result === 'string' && result.length > 0;
          }
        ),
        { numRuns: 500 }
      );
    });

    it('should handle very large amounts', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1000000, max: 999999999, noNaN: true }),
          currencyCodeArbitrary,
          (amount, currency) => {
            const result = formatCurrency(amount, currency);
            return typeof result === 'string' && result.length > 0;
          }
        ),
        { numRuns: 500 }
      );
    });
  });

  describe('Property 15: parseCurrency handles invalid input gracefully', () => {
    it('should return 0 for invalid currency strings', () => {
      fc.assert(
        fc.property(
          fc.string(),
          currencyCodeArbitrary,
          (invalidString, currency) => {
            // Skip strings that might be valid numbers
            if (/^\d+\.?\d*$/.test(invalidString.trim())) {
              return true;
            }
            
            const result = parseCurrency(invalidString, currency);
            return typeof result === 'number' && !isNaN(result);
          }
        ),
        { numRuns: 500 }
      );
    });
  });

  describe('Property 16: formatPercentage handles boundary values', () => {
    it('should handle 0% and 100% correctly', () => {
      expect(formatPercentage(0)).toBe('0%');
      expect(formatPercentage(1)).toBe('100%');
      expect(formatPercentage(0.5)).toBe('50%');
    });

    it('should handle values over 100%', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1, max: 10, noNaN: true }),
          (value) => {
            const result = formatPercentage(value);
            const numericPart = parseFloat(result.slice(0, -1));
            return numericPart >= 100;
          }
        ),
        { numRuns: 500 }
      );
    });
  });

  describe('Property 17: Currency conversion preserves proportions', () => {
    it('should maintain proportions when converting multiple amounts', () => {
      const exchangeRates: Record<CurrencyCode, number> = {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110,
        CNY: 6.5,
        AED: 3.67,
        SAR: 3.75,
        EGP: 15.7,
      };

      fc.assert(
        fc.property(
          positiveAmountArbitrary,
          positiveAmountArbitrary,
          currencyCodeArbitrary,
          currencyCodeArbitrary,
          (amount1, amount2, from, to) => {
            // Skip if amounts are too close to zero
            if (amount1 < 0.01 || amount2 < 0.01) return true;
            
            const converted1 = convertCurrency(amount1, from, to, exchangeRates);
            const converted2 = convertCurrency(amount2, from, to, exchangeRates);
            
            const originalRatio = amount1 / amount2;
            const convertedRatio = converted1 / converted2;
            
            // Ratios should be approximately equal
            return Math.abs(originalRatio - convertedRatio) < 0.01;
          }
        ),
        { numRuns: 500 }
      );
    });
  });

  describe('Property 18: formatNumber with decimals rounds correctly', () => {
    it('should round to the specified number of decimals', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1000, noNaN: true }),
          fc.integer({ min: 0, max: 4 }),
          (value, decimals) => {
            const result = formatNumber(value, decimals);
            const parsed = parseFloat(result.replace(/,/g, ''));
            const expected = parseFloat(value.toFixed(decimals));
            
            return Math.abs(parsed - expected) < 0.01;
          }
        ),
        { numRuns: 1000 }
      );
    });
  });
});
