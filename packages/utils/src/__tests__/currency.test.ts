/**
 * Unit tests for currency utilities
 */

import { describe, it, expect } from 'vitest';
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

describe('currency utilities', () => {
  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      const result = formatCurrency(1234.56, 'USD');
      expect(result).toContain('1,234.56');
    });

    it('should format EUR correctly', () => {
      const result = formatCurrency(1234.56, 'EUR');
      expect(result).toContain('1');
      expect(result).toContain('234');
      expect(result).toContain('56');
    });

    it('should format with default currency (USD)', () => {
      const result = formatCurrency(100);
      expect(result).toContain('100');
    });

    it('should handle zero amount', () => {
      const result = formatCurrency(0, 'USD');
      expect(result).toContain('0');
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-100, 'USD');
      expect(result).toContain('100');
    });

    it('should respect custom options', () => {
      const result = formatCurrency(1234.567, 'USD', { maximumFractionDigits: 3 });
      expect(result).toContain('1,234.567');
    });
  });

  describe('formatCompactCurrency', () => {
    it('should format thousands with K suffix', () => {
      const result = formatCompactCurrency(1500, 'USD');
      expect(result).toContain('1');
      expect(result).toContain('K');
    });

    it('should format millions with M suffix', () => {
      const result = formatCompactCurrency(2500000, 'USD');
      expect(result).toContain('2');
      expect(result).toContain('M');
    });

    it('should not add suffix for amounts under 1000', () => {
      const result = formatCompactCurrency(999, 'USD');
      expect(result).not.toContain('K');
      expect(result).not.toContain('M');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with default decimals', () => {
      expect(formatPercentage(0.5)).toBe('50%');
    });

    it('should format percentage with custom decimals', () => {
      expect(formatPercentage(0.12345, 2)).toBe('12.35%');
    });

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0%');
    });

    it('should handle values over 1', () => {
      expect(formatPercentage(1.5)).toBe('150%');
    });
  });

  describe('formatNumber', () => {
    it('should format number with thousand separators', () => {
      const result = formatNumber(1234567);
      expect(result).toBe('1,234,567');
    });

    it('should format with decimals', () => {
      const result = formatNumber(1234.567, 2);
      expect(result).toBe('1,234.57');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('parseCurrency', () => {
    it('should parse USD currency string', () => {
      expect(parseCurrency('$1,234.56', 'USD')).toBe(1234.56);
    });

    it('should parse currency without symbol', () => {
      expect(parseCurrency('1,234.56', 'USD')).toBe(1234.56);
    });

    it('should handle invalid input', () => {
      expect(parseCurrency('invalid', 'USD')).toBe(0);
    });

    it('should handle empty string', () => {
      expect(parseCurrency('', 'USD')).toBe(0);
    });
  });

  describe('convertCurrency', () => {
    it('should convert between currencies', () => {
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
      
      const result = convertCurrency(100, 'USD', 'EUR', exchangeRates);
      expect(result).toBeCloseTo(85, 1);
    });

    it('should handle same currency conversion', () => {
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
      
      const result = convertCurrency(100, 'USD', 'USD', exchangeRates);
      expect(result).toBe(100);
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return correct symbol for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
    });

    it('should return correct symbol for EUR', () => {
      expect(getCurrencySymbol('EUR')).toBe('€');
    });

    it('should return correct symbol for GBP', () => {
      expect(getCurrencySymbol('GBP')).toBe('£');
    });
  });

  describe('getCurrencyLocale', () => {
    it('should return correct locale for USD', () => {
      expect(getCurrencyLocale('USD')).toBe('en-US');
    });

    it('should return correct locale for EUR', () => {
      expect(getCurrencyLocale('EUR')).toBe('de-DE');
    });

    it('should return correct locale for AED', () => {
      expect(getCurrencyLocale('AED')).toBe('ar-AE');
    });
  });
});
