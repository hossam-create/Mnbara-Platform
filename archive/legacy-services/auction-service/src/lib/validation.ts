/**
 * Input Validation & Sanitization Framework
 * 
 * Comprehensive validation for all user inputs with strict character limits,
 * injection prevention, and type safety.
 * 
 * MANDATORY REQUIREMENTS:
 * - Client-side + Server-side validation
 * - Strict character limits enforcement
 * - SQL Injection prevention
 * - XSS prevention
 * - HTML/JS injection prevention
 * - Malformed data rejection
 */

import { ValidationError } from './errors';

// ============================================================
// CHARACTER LIMITS (MANDATORY)
// ============================================================

export const CHARACTER_LIMITS = {
  NAME: 100,
  EMAIL: 255,
  DESCRIPTION: 500,
  COMMENT: 500,
  TITLE: 200,
  URL: 2048,
  PHONE: 20,
  POSTAL_CODE: 20,
  CITY: 100,
  COUNTRY: 100,
  STREET: 200,
  DEFAULT_TEXT: 1000,
} as const;

// ============================================================
// INJECTION PATTERNS (MANDATORY DETECTION)
// ============================================================

const INJECTION_PATTERNS = {
  SQL: [
    /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|SCRIPT|JAVASCRIPT|ONERROR|ONLOAD)\b)/gi,
    /(-{2}|\/\*|\*\/|;|'|")/g,
    /(OR\s+1\s*=\s*1|OR\s+'1'\s*=\s*'1')/gi,
    /(UNION\s+ALL\s+SELECT)/gi,
    /(CAST\s*\(|CONVERT\s*\()/gi,
  ],
  XSS: [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onerror=, onclick=, etc.
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<img[^>]*on/gi,
    /<svg[^>]*on/gi,
  ],
  HTML_INJECTION: [
    /<[^>]*>/g, // Any HTML tag
    /&lt;|&gt;|&quot;|&#/g, // HTML entities
  ],
  COMMAND_INJECTION: [
    /[;&|`$(){}[\]<>]/g,
    /\$\{.*\}/g, // Template injection
    /\$\(.*\)/g, // Command substitution
  ],
};

// ============================================================
// VALIDATION RULES
// ============================================================

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'email' | 'url' | 'phone' | 'date' | 'enum';
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
  enum?: unknown[];
  custom?: (value: unknown) => boolean | string;
}

// ============================================================
// VALIDATOR CLASS
// ============================================================

export class InputValidator {
  /**
   * Validate input against rules
   */
  static validate(data: Record<string, unknown>, rules: ValidationRule[]): void {
    const errors: Record<string, string> = {};

    for (const rule of rules) {
      const value = data[rule.field];
      const error = this.validateField(value, rule);

      if (error) {
        errors[rule.field] = error;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  /**
   * Validate single field
   */
  private static validateField(value: unknown, rule: ValidationRule): string | null {
    // Check required
    if (rule.required && (value === null || value === undefined || value === '')) {
      return `${rule.field} is required`;
    }

    if (value === null || value === undefined || value === '') {
      return null;
    }

    // Type validation
    switch (rule.type) {
      case 'string':
        return this.validateString(value, rule);
      case 'number':
        return this.validateNumber(value, rule);
      case 'email':
        return this.validateEmail(value, rule);
      case 'url':
        return this.validateUrl(value, rule);
      case 'phone':
        return this.validatePhone(value, rule);
      case 'date':
        return this.validateDate(value, rule);
      case 'enum':
        return this.validateEnum(value, rule);
      default:
        return null;
    }
  }

  /**
   * Validate string field
   */
  private static validateString(value: unknown, rule: ValidationRule): string | null {
    if (typeof value !== 'string') {
      return `${rule.field} must be a string`;
    }

    // Check length
    if (rule.maxLength && value.length > rule.maxLength) {
      return `${rule.field} must not exceed ${rule.maxLength} characters`;
    }

    if (rule.minLength && value.length < rule.minLength) {
      return `${rule.field} must be at least ${rule.minLength} characters`;
    }

    // Check for injections
    const injectionError = this.checkInjections(value);
    if (injectionError) {
      return injectionError;
    }

    // Check pattern
    if (rule.pattern && !rule.pattern.test(value)) {
      return `${rule.field} format is invalid`;
    }

    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value);
      if (result !== true) {
        return typeof result === 'string' ? result : `${rule.field} is invalid`;
      }
    }

    return null;
  }

  /**
   * Validate number field
   */
  private static validateNumber(value: unknown, rule: ValidationRule): string | null {
    if (typeof value !== 'number' || isNaN(value)) {
      return `${rule.field} must be a number`;
    }

    if (rule.minLength && value < rule.minLength) {
      return `${rule.field} must be at least ${rule.minLength}`;
    }

    if (rule.maxLength && value > rule.maxLength) {
      return `${rule.field} must not exceed ${rule.maxLength}`;
    }

    return null;
  }

  /**
   * Validate email field
   */
  private static validateEmail(value: unknown, rule: ValidationRule): string | null {
    if (typeof value !== 'string') {
      return `${rule.field} must be a string`;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return `${rule.field} must be a valid email`;
    }

    if (value.length > CHARACTER_LIMITS.EMAIL) {
      return `${rule.field} must not exceed ${CHARACTER_LIMITS.EMAIL} characters`;
    }

    return null;
  }

  /**
   * Validate URL field
   */
  private static validateUrl(value: unknown, rule: ValidationRule): string | null {
    if (typeof value !== 'string') {
      return `${rule.field} must be a string`;
    }

    try {
      new URL(value);
    } catch {
      return `${rule.field} must be a valid URL`;
    }

    if (value.length > CHARACTER_LIMITS.URL) {
      return `${rule.field} must not exceed ${CHARACTER_LIMITS.URL} characters`;
    }

    return null;
  }

  /**
   * Validate phone field
   */
  private static validatePhone(value: unknown, rule: ValidationRule): string | null {
    if (typeof value !== 'string') {
      return `${rule.field} must be a string`;
    }

    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(value)) {
      return `${rule.field} must be a valid phone number`;
    }

    if (value.length > CHARACTER_LIMITS.PHONE) {
      return `${rule.field} must not exceed ${CHARACTER_LIMITS.PHONE} characters`;
    }

    return null;
  }

  /**
   * Validate date field
   */
  private static validateDate(value: unknown, rule: ValidationRule): string | null {
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return `${rule.field} must be a valid date`;
      }
      return null;
    }

    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        return `${rule.field} must be a valid date`;
      }
      return null;
    }

    return `${rule.field} must be a valid date`;
  }

  /**
   * Validate enum field
   */
  private static validateEnum(value: unknown, rule: ValidationRule): string | null {
    if (!rule.enum || !rule.enum.includes(value)) {
      return `${rule.field} must be one of: ${rule.enum?.join(', ')}`;
    }

    return null;
  }

  /**
   * Check for injection patterns (MANDATORY)
   */
  private static checkInjections(value: string): string | null {
    // SQL Injection check
    for (const pattern of INJECTION_PATTERNS.SQL) {
      if (pattern.test(value)) {
        console.warn('[SECURITY] SQL Injection attempt detected:', value);
        return 'Invalid characters detected in input';
      }
    }

    // XSS check
    for (const pattern of INJECTION_PATTERNS.XSS) {
      if (pattern.test(value)) {
        console.warn('[SECURITY] XSS attempt detected:', value);
        return 'Invalid characters detected in input';
      }
    }

    // Command injection check
    for (const pattern of INJECTION_PATTERNS.COMMAND_INJECTION) {
      if (pattern.test(value)) {
        console.warn('[SECURITY] Command injection attempt detected:', value);
        return 'Invalid characters detected in input';
      }
    }

    return null;
  }

  /**
   * Sanitize input (remove dangerous characters)
   */
  static sanitize(value: string, allowHtml: boolean = false): string {
    if (!allowHtml) {
      // Remove HTML tags
      value = value.replace(/<[^>]*>/g, '');
    }

    // Remove null bytes
    value = value.replace(/\0/g, '');

    // Trim whitespace
    value = value.trim();

    return value;
  }

  /**
   * Escape HTML entities
   */
  static escapeHtml(value: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };

    return value.replace(/[&<>"']/g, char => map[char]);
  }

  /**
   * Validate form submission (MANDATORY)
   */
  static validateFormSubmission(
    data: Record<string, unknown>,
    rules: ValidationRule[]
  ): Record<string, unknown> {
    // Validate all fields
    this.validate(data, rules);

    // Sanitize all string fields
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}

// ============================================================
// COMMON VALIDATION RULES
// ============================================================

export const COMMON_RULES = {
  name: (required = true): ValidationRule => ({
    field: 'name',
    type: 'string',
    required,
    maxLength: CHARACTER_LIMITS.NAME,
    minLength: 1,
  }),

  email: (required = true): ValidationRule => ({
    field: 'email',
    type: 'email',
    required,
  }),

  description: (required = false): ValidationRule => ({
    field: 'description',
    type: 'string',
    required,
    maxLength: CHARACTER_LIMITS.DESCRIPTION,
  }),

  comment: (required = false): ValidationRule => ({
    field: 'comment',
    type: 'string',
    required,
    maxLength: CHARACTER_LIMITS.COMMENT,
  }),

  title: (required = true): ValidationRule => ({
    field: 'title',
    type: 'string',
    required,
    maxLength: CHARACTER_LIMITS.TITLE,
    minLength: 1,
  }),

  amount: (required = true): ValidationRule => ({
    field: 'amount',
    type: 'number',
    required,
    minLength: 0.01,
  }),

  phone: (required = false): ValidationRule => ({
    field: 'phone',
    type: 'phone',
    required,
  }),

  url: (required = false): ValidationRule => ({
    field: 'url',
    type: 'url',
    required,
  }),
};
