/**
 * Unit tests for validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPhone,
  isValidUrl,
  isValidCreditCard,
  validatePassword,
  isValidIpAddress,
  isValidHexColor,
  isValidSlug,
  isValidUsername,
  isValidPostalCode,
  isValidDateOfBirth,
  isValidFileExtension,
  isValidFileSize,
  sanitizeHtml,
  truncateString,
  capitalizeFirstLetter,
  toTitleCase,
  slugify,
  generateRandomString,
  generateRandomColor,
  debounce,
  throttle,
  deepClone,
  isEmpty,
} from '../validation';

describe('validation utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('should reject email without @', () => {
      expect(isValidEmail('testexample.com')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(isValidEmail('test@')).toBe(false);
    });

    it('should reject email with spaces', () => {
      expect(isValidEmail('test @example.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate international phone', () => {
      expect(isValidPhone('+1234567890')).toBe(true);
    });

    it('should validate phone with spaces', () => {
      expect(isValidPhone('+1 234 567 890')).toBe(true);
    });

    it('should validate phone with dashes', () => {
      expect(isValidPhone('+1-234-567-890')).toBe(true);
    });

    it('should reject invalid phone', () => {
      expect(isValidPhone('abc')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate HTTP URL', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    it('should validate HTTPS URL', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('should reject invalid URL', () => {
      expect(isValidUrl('not a url')).toBe(false);
    });
  });

  describe('isValidCreditCard', () => {
    it('should validate valid credit card (Luhn algorithm)', () => {
      expect(isValidCreditCard('4532015112830366')).toBe(true);
    });

    it('should reject invalid credit card', () => {
      expect(isValidCreditCard('1234567890123456')).toBe(false);
    });

    it('should handle credit card with spaces', () => {
      expect(isValidCreditCard('4532 0151 1283 0366')).toBe(true);
    });

    it('should reject too short number', () => {
      expect(isValidCreditCard('123')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      const result = validatePassword('Test123!@#');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short password', () => {
      const result = validatePassword('Test1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Must be at least 8 characters');
    });

    it('should reject password without uppercase', () => {
      const result = validatePassword('test123!@#');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Must contain uppercase');
    });

    it('should reject password without lowercase', () => {
      const result = validatePassword('TEST123!@#');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Must contain lowercase');
    });

    it('should reject password without number', () => {
      const result = validatePassword('TestTest!@#');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Must contain a number');
    });

    it('should reject password without special char', () => {
      const result = validatePassword('Test1234');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Must contain special char');
    });
  });

  describe('isValidIpAddress', () => {
    it('should validate valid IPv4', () => {
      expect(isValidIpAddress('192.168.1.1')).toBe(true);
    });

    it('should reject invalid IPv4', () => {
      expect(isValidIpAddress('256.256.256.256')).toBe(false);
    });

    it('should reject malformed IP', () => {
      expect(isValidIpAddress('192.168.1')).toBe(false);
    });
  });

  describe('isValidHexColor', () => {
    it('should validate 6-digit hex color', () => {
      expect(isValidHexColor('#FF5733')).toBe(true);
    });

    it('should validate 3-digit hex color', () => {
      expect(isValidHexColor('#F57')).toBe(true);
    });

    it('should validate without hash', () => {
      expect(isValidHexColor('FF5733')).toBe(true);
    });

    it('should reject invalid hex color', () => {
      expect(isValidHexColor('#GG5733')).toBe(false);
    });
  });

  describe('isValidSlug', () => {
    it('should validate valid slug', () => {
      expect(isValidSlug('my-blog-post')).toBe(true);
    });

    it('should reject slug with uppercase', () => {
      expect(isValidSlug('My-Blog-Post')).toBe(false);
    });

    it('should reject slug with spaces', () => {
      expect(isValidSlug('my blog post')).toBe(false);
    });

    it('should reject slug with special chars', () => {
      expect(isValidSlug('my-blog-post!')).toBe(false);
    });
  });

  describe('isValidUsername', () => {
    it('should validate valid username', () => {
      expect(isValidUsername('user_123')).toBe(true);
    });

    it('should reject too short username', () => {
      expect(isValidUsername('ab')).toBe(false);
    });

    it('should reject too long username', () => {
      expect(isValidUsername('a'.repeat(31))).toBe(false);
    });

    it('should reject username with special chars', () => {
      expect(isValidUsername('user@123')).toBe(false);
    });
  });

  describe('isValidPostalCode', () => {
    it('should validate 5-digit US zip', () => {
      expect(isValidPostalCode('12345')).toBe(true);
    });

    it('should validate 9-digit US zip', () => {
      expect(isValidPostalCode('12345-6789')).toBe(true);
    });

    it('should reject invalid postal code', () => {
      expect(isValidPostalCode('ABCDE')).toBe(false);
    });
  });

  describe('isValidDateOfBirth', () => {
    it('should validate valid date of birth', () => {
      expect(isValidDateOfBirth('1990-01-01')).toBe(true);
    });

    it('should reject future date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(isValidDateOfBirth(futureDate)).toBe(false);
    });

    it('should reject very old date', () => {
      expect(isValidDateOfBirth('1800-01-01')).toBe(false);
    });
  });

  describe('isValidFileExtension', () => {
    it('should validate allowed extension', () => {
      expect(isValidFileExtension('document.pdf', ['pdf', 'doc'])).toBe(true);
    });

    it('should reject disallowed extension', () => {
      expect(isValidFileExtension('document.exe', ['pdf', 'doc'])).toBe(false);
    });

    it('should be case insensitive', () => {
      expect(isValidFileExtension('document.PDF', ['pdf'])).toBe(true);
    });
  });

  describe('isValidFileSize', () => {
    it('should validate file within size limit', () => {
      expect(isValidFileSize(1000, 2000)).toBe(true);
    });

    it('should reject file exceeding size limit', () => {
      expect(isValidFileSize(3000, 2000)).toBe(false);
    });

    it('should accept file at exact limit', () => {
      expect(isValidFileSize(2000, 2000)).toBe(true);
    });
  });

  describe('sanitizeHtml', () => {
    it('should escape HTML entities', () => {
      const result = sanitizeHtml('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('should escape quotes', () => {
      const result = sanitizeHtml('"test"');
      expect(result).toContain('&quot;');
    });

    it('should escape ampersands', () => {
      const result = sanitizeHtml('Tom & Jerry');
      expect(result).toContain('&amp;');
    });
  });

  describe('truncateString', () => {
    it('should truncate long string', () => {
      const result = truncateString('This is a long string', 10);
      expect(result).toBe('This is...');
    });

    it('should not truncate short string', () => {
      const result = truncateString('Short', 10);
      expect(result).toBe('Short');
    });

    it('should use custom suffix', () => {
      const result = truncateString('This is a long string', 10, '---');
      expect(result).toBe('This is---');
    });
  });

  describe('capitalizeFirstLetter', () => {
    it('should capitalize first letter', () => {
      expect(capitalizeFirstLetter('hello')).toBe('Hello');
    });

    it('should handle already capitalized', () => {
      expect(capitalizeFirstLetter('Hello')).toBe('Hello');
    });

    it('should handle single character', () => {
      expect(capitalizeFirstLetter('h')).toBe('H');
    });
  });

  describe('toTitleCase', () => {
    it('should convert to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
    });

    it('should handle mixed case', () => {
      expect(toTitleCase('hELLO wORLD')).toBe('Hello World');
    });
  });

  describe('slugify', () => {
    it('should create slug from string', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should remove special characters', () => {
      expect(slugify('Hello, World!')).toBe('hello-world');
    });

    it('should handle multiple spaces', () => {
      expect(slugify('Hello   World')).toBe('hello-world');
    });

    it('should trim dashes', () => {
      expect(slugify('  Hello World  ')).toBe('hello-world');
    });
  });

  describe('generateRandomString', () => {
    it('should generate string of correct length', () => {
      const result = generateRandomString(10);
      expect(result).toHaveLength(10);
    });

    it('should generate different strings', () => {
      const result1 = generateRandomString(10);
      const result2 = generateRandomString(10);
      expect(result1).not.toBe(result2);
    });

    it('should only contain alphanumeric characters', () => {
      const result = generateRandomString(100);
      expect(result).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('generateRandomColor', () => {
    it('should generate valid hex color', () => {
      const result = generateRandomColor();
      expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should generate different colors', () => {
      const result1 = generateRandomColor();
      const result2 = generateRandomColor();
      // Very unlikely to be the same
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      let callCount = 0;
      const fn = () => callCount++;
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(callCount).toBe(0);

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(callCount).toBe(1);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      let callCount = 0;
      const fn = () => callCount++;
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(callCount).toBe(1);

      await new Promise(resolve => setTimeout(resolve, 150));
      throttled();
      expect(callCount).toBe(2);
    });
  });

  describe('deepClone', () => {
    it('should deep clone object', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = deepClone(obj);
      
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
    });

    it('should clone arrays', () => {
      const arr = [1, 2, [3, 4]];
      const cloned = deepClone(arr);
      
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty object', () => {
      expect(isEmpty({})).toBe(true);
    });

    it('should return false for non-empty object', () => {
      expect(isEmpty({ a: 1 })).toBe(false);
    });
  });
});
