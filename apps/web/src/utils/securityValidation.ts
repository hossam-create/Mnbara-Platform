/**
 * 🔒 SECURITY-FIRST VALIDATION UTILITIES
 * ACCESS CONTROL & AUTHORITY POLICY IMPLEMENTATION
 * 
 * CRITICAL SECURITY NOTICE:
 * - All validation is SECURITY-CRITICAL for input sanitization
 * - Backend validates ALL data - Frontend validation is COSMETIC ONLY
 * - Character limits prevent buffer overflow and injection attacks
 * - XSS/SQL injection patterns are BLOCKED at input level
 * - Malformed data is REJECTED before processing
 * 
 * VIOLATION OF INPUT VALIDATION POLICY COMPROMISES SYSTEM SECURITY
 * 
 * ARABIC SECURITY REQUIREMENTS IMPLEMENTATION:
 * ✅ Character Limits: Names max 100, Comments max 500
 * ✅ Client-side & Server-side validation
 * ✅ SQL Injection prevention
 * ✅ XSS prevention  
 * ✅ HTML/Script injection prevention
 * ✅ Malformed data rejection
 */

/**
 * ⚠️ SECURITY: Character Limits - Backend enforces independently
 * Frontend limits are COSMETIC ONLY - Backend validates final data
 */
export const SECURITY_CHARACTER_LIMITS = {
  // User Profile Fields
  FIRST_NAME: { min: 1, max: 50 },      // Security: Prevent injection
  LAST_NAME: { min: 1, max: 50 },       // Security: Prevent injection
  FULL_NAME: { min: 1, max: 100 },      // Security: Prevent injection
  
  // Authentication Fields
  EMAIL: { min: 5, max: 254 },          // Security: RFC 5321 compliant
  PASSWORD: { min: 8, max: 128 },       // Security: Prevent DoS
  USERNAME: { min: 3, max: 30 },        // Security: Prevent injection
  
  // Content Fields
  TITLE: { min: 1, max: 200 },          // Security: Prevent injection
  DESCRIPTION: { min: 1, max: 500 },    // Security: Prevent injection
  COMMENT: { min: 1, max: 500 },        // Security: Prevent injection
  BIO: { min: 0, max: 1000 },           // Security: Prevent injection
  
  // Address Fields
  ADDRESS_LINE: { min: 1, max: 200 },   // Security: Prevent injection
  CITY: { min: 1, max: 100 },           // Security: Prevent injection
  STATE: { min: 1, max: 100 },           // Security: Prevent injection
  ZIP_CODE: { min: 3, max: 20 },        // Security: Prevent injection
  COUNTRY: { min: 2, max: 100 },        // Security: ISO 3166 compliant
  
  // Financial Fields
  WALLET_NAME: { min: 1, max: 100 },    // Security: Prevent injection
  TRANSACTION_NOTE: { min: 0, max: 255 }, // Security: Prevent injection
  
  // System Fields
  SEARCH_QUERY: { min: 1, max: 200 },   // Security: Prevent DoS
  FILTER_VALUE: { min: 1, max: 100 },  // Security: Prevent injection
  TAG: { min: 1, max: 50 },              // Security: Prevent injection
  
  // Security Fields
  TOKEN: { min: 10, max: 1000 },        // Security: JWT token limits
  REFERENCE_ID: { min: 1, max: 100 },   // Security: Prevent injection
  SESSION_ID: { min: 10, max: 255 }     // Security: Session limits
} as const;

/**
 * ⚠️ SECURITY: Input Validation Patterns - Backend validates independently
 * Frontend patterns are COSMETIC ONLY - Backend validates final data
 */
export const SECURITY_VALIDATION_PATTERNS = {
  // Email validation - RFC 5322 compliant
  EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  
  // Username validation - Alphanumeric with limited special chars
  USERNAME: /^[a-zA-Z0-9_-]{3,30}$/,
  
  // Phone validation - International format
  PHONE: /^\+?[1-9]\d{1,14}$/,
  
  // URL validation - Safe URL format
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  
  // Credit card validation - Luhn algorithm ready
  CREDIT_CARD: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
  
  // ZIP code validation - International formats
  ZIP_CODE: /^\d{3,10}([\s-]\d{3,10})?$/,
  
  // Alphanumeric validation - Safe characters only
  ALPHANUMERIC: /^[a-zA-Z0-9\s\-_.,!?]*$/,
  
  // Numeric validation - Numbers only
  NUMERIC: /^\d+$/,
  
  // Alphabetic validation - Letters and spaces only
  ALPHABETIC: /^[a-zA-Z\s\-']+$/,
  
  // UUID validation - Standard UUID format
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  
  // Base64 validation - Safe base64 format
  BASE64: /^[A-Za-z0-9+/]*={0,2}$/,
  
  // JWT validation - JWT token format
  JWT: /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*$/
} as const;

/**
 * ⚠️ SECURITY: Enhanced Dangerous Patterns - BLOCKED by frontend (cosmetic)
 * Backend validates independently - Frontend provides early warning
 * ARABIC SECURITY REQUIREMENTS: SQL Injection, XSS, HTML/Script injection prevention
 */
export const SECURITY_DANGEROUS_PATTERNS = {
  // SQL Injection patterns - CRITICAL SECURITY
  SQL_INJECTION: /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript)\b|--|\/\*|\*\/|xp_|sp_|@@|char|nchar|varchar|nvarchar|alter|begin|cast|declare|delete|drop|end|exec|execute|fetch|insert|kill|open|sys|sysobjects|syscolumns|table|update|waitfor|delay|benchmark|sleep|information_schema|pg_sleep|pg_stat_activity)\b/i,
  
  // XSS patterns - CRITICAL SECURITY
  XSS: /(<script|<iframe|<object|<embed|<form|<input|<body|<html|<style|<link|<meta|onload|onerror|onclick|ondblclick|onmouseover|onmouseout|onkeydown|onkeypress|onkeyup|onfocus|onblur|onchange|onsubmit|onreset|onselect|onabort|onunload|javascript:|vbscript:|data:text\/html|data:text\/javascript|data:text\/vbscript|data:text\/x-javascript|data:text\/ecmascript|data:text\/jscript|data:text\/livescript|data:text\/x-livescript|data:application\/x-javascript|data:application\/javascript|data:application\/ecmascript|data:application\/x-ecmascript|data:application\/jscript|data:application\/x-jscript|data:application\/livescript|data:application\/x-livescript)/i,
  
  // HTML injection patterns - HIGH SECURITY
  HTML_INJECTION: /(<|>|&lt;|&gt;|%3C|%3E|%253C|%253E|%25253C|%25253E)/,
  
  // Command injection patterns - CRITICAL SECURITY
  COMMAND_INJECTION: /(\||&&|\$\(|`|>|<|\n|\r|\t|\0x[0-9a-fA-F]{2}|%[0-9a-fA-F]{2}|\.{2,}|~\/|\/\/|\\\\|\*\*|\?\*|\[\]|\{\}|\(\)|&amp;|&lt;|&gt;|&quot;|&#x27;|&#x2F;)/i,
  
  // Path traversal patterns - HIGH SECURITY
  PATH_TRAVERSAL: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c|%252e%252e%252f|%252e%252e%255c|%2525252e%2525252e%2525252f|%2525252e%2525252e%2525255c|%c0%ae%c0%ae%2f|%c0%ae%c0%ae%5c|%252fc0%252e%252fc0%252e%252f|%252fc0%252e%252fc0%252e%5c)/i,
  
  // File inclusion patterns - CRITICAL SECURITY
  FILE_INCLUSION: /(file:\/\/|php:\/\/|data:\/\/|expect:\/\/|input:\/\/|ftp:\/\/|ssh:\/\/|telnet:\/\/|imap:\/\/|smtp:\/\/|pop3:\/\/|http:\/\/localhost|https:\/\/localhost)/i,
  
  // LDAP injection patterns - HIGH SECURITY
  LDAP_INJECTION: /(\*|\(|\)|\\|\/|&amp;|&lt;|&gt;|&quot;|&#x27;)/i,
  
  // NoSQL injection patterns - HIGH SECURITY
  NOSQL_INJECTION: /(\$ne|\$gt|\$gte|\$lt|\$lte|\$regex|\$where|\$exists|\$type|\$mod|\$geoWithin|\$center|\$centerSphere|\$near|\$nearSphere|\$polygon|\$box|\$geometry|\$maxDistance|\$minDistance|\$all|\$elemMatch|\$size|\$slice|\$elemMatch|\$comment|\$hint|\$maxScan|\$maxTimeMS|\$natural|\$orderby|\$query|\$showDiskLoc|\$snapshot)/i,
  
  // XML External Entity (XXE) patterns - CRITICAL SECURITY
  XXE: /(<!DOCTYPE|<!ENTITY|%[a-zA-Z]|SYSTEM|PUBLIC|&[a-zA-Z]+;)/i,
  
  // Server-side include patterns - MEDIUM SECURITY
  SSI_INJECTION: /(<!--#|#include|#exec|#echo|#config|#fsize|#flastmod)/i,
  
  // File upload security patterns - HIGH SECURITY
  MALICIOUS_EXTENSIONS: /\.(php|php3|php4|php5|phtml|asp|aspx|ascx|ashx|asmx|cer|swf|jar|exe|com|bat|cmd|vbs|vbe|js|jse|ws|wsc|wsf|wsh|ps1|ps1xml|ps2|ps2xml|psc1|psc2|msh|msh1|msh2|mshxml|msh1xml|msh2xml|scf|lnk|inf|reg|docm|dotm|xlsm|xltm|xlam|pptm|potm|ppam|ppsm|sldm)$/i,
  
  // Unicode homoglyph attacks - MEDIUM SECURITY
  UNICODE_HOMOGLYPHS: /[а-я]/i, // Cyrillic characters that look like Latin
  
  // Control characters - MEDIUM SECURITY
  CONTROL_CHARACTERS: /[\x00-\x1F\x7F-\x9F]/g,
  
  // Whitespace exploitation - MEDIUM SECURITY
  WHITESPACE_EXPLOITATION: /[\u200B\u200C\u200D\uFEFF]/g, // Zero-width characters
} as const;

/**
 * 🔒 SECURITY-CRITICAL: Input Validation Result
 * Backend validates ALL data - Frontend validation is COSMETIC ONLY
 */
export interface ValidationResult {
  is_valid: boolean;
  is_safe: boolean;
  errors: string[];
  warnings: string[];
  sanitized_value: string;
  original_value: string;
  security_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  validation_timestamp: string;
  validation_source: 'FRONTEND' | 'BACKEND';
}

/**
 * 🔒 SECURITY: Validate input length - Backend validates independently
 * Frontend checks are COSMETIC ONLY - Backend enforces final limits
 */
export function validateInputLength(
  value: string,
  fieldName: keyof typeof SECURITY_CHARACTER_LIMITS,
  source: 'FRONTEND' | 'BACKEND' = 'FRONTEND'
): ValidationResult {
  const limits = SECURITY_CHARACTER_LIMITS[fieldName];
  const trimmedValue = value.trim();
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // SECURITY: Check minimum length
  if (trimmedValue.length < limits.min) {
    errors.push(`Field must be at least ${limits.min} characters`);
  }
  
  // SECURITY: Check maximum length (prevent DoS)
  if (trimmedValue.length > limits.max) {
    errors.push(`Field must not exceed ${limits.max} characters`);
    warnings.push('Input truncated to prevent security issues');
  }
  
  // SECURITY: Truncate if exceeds maximum (prevent DoS)
  const sanitizedValue = trimmedValue.length > limits.max 
    ? trimmedValue.substring(0, limits.max).trim()
    : trimmedValue;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SECURITY AUDIT] Length validation (${source}):`, {
      field: fieldName,
      original_length: value.length,
      sanitized_length: sanitizedValue.length,
      is_valid: errors.length === 0,
      warning: 'Frontend validation is COSMETIC ONLY - Backend validates independently'
    });
  }
  
  return {
    is_valid: errors.length === 0,
    is_safe: errors.length === 0,
    errors,
    warnings,
    sanitized_value: sanitizedValue,
    original_value: value,
    security_level: errors.length > 0 ? 'HIGH' : 'LOW',
    validation_timestamp: new Date().toISOString(),
    validation_source: source
  };
}

/**
 * 🔒 SECURITY: Comprehensive Security Validation - Backend validates independently
 * Frontend validation is COSMETIC ONLY - Backend validates final data
 * ARABIC SECURITY REQUIREMENTS: Complete input validation system
 */
export function comprehensiveSecurityValidation(
  value: string,
  fieldType: keyof typeof SECURITY_CHARACTER_LIMITS,
  options: {
    required?: boolean;
    pattern?: RegExp;
    checkDangerousContent?: boolean;
    customValidation?: (value: string) => ValidationResult;
    allowHtmlTags?: boolean;
    allowedHtmlTags?: string[];
  } = {},
  source: 'FRONTEND' | 'BACKEND' = 'FRONTEND'
): ValidationResult {
  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  let sanitizedValue = value.trim();
  let securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  
  // SECURITY: Check if required
  if (options.required && !sanitizedValue) {
    errors.push('Field is required');
    return {
      is_valid: false,
      is_safe: false,
      errors,
      warnings,
      sanitized_value: sanitizedValue,
      original_value: value,
      security_level: 'HIGH',
      validation_timestamp: new Date().toISOString(),
      validation_source: source
    };
  }
  
  // SECURITY: Skip if empty and not required
  if (!options.required && !sanitizedValue) {
    return {
      is_valid: true,
      is_safe: true,
      errors,
      warnings,
      sanitized_value: sanitizedValue,
      original_value: value,
      security_level: 'LOW',
      validation_timestamp: new Date().toISOString(),
      validation_source: source
    };
  }
  
  // SECURITY: Validate length
  const lengthResult = validateInputLength(sanitizedValue, fieldType, source);
  if (!lengthResult.is_valid) {
    errors.push(...lengthResult.errors);
    warnings.push(...lengthResult.warnings);
    sanitizedValue = lengthResult.sanitized_value;
    securityLevel = lengthResult.security_level;
  }
  
  // SECURITY: Validate pattern if provided
  if (options.pattern) {
    const patternResult = validateInputPattern(sanitizedValue, options.pattern, fieldType, source);
    if (!patternResult.is_valid) {
      errors.push(...patternResult.errors);
      warnings.push(...patternResult.warnings);
      securityLevel = Math.max(securityLevel, patternResult.security_level) as any;
    }
  }
  
  // SECURITY: Check for dangerous content (enabled by default)
  if (options.checkDangerousContent !== false) {
    const dangerousResult = checkForDangerousContent(sanitizedValue, fieldType, source);
    if (!dangerousResult.is_safe) {
      errors.push(...dangerousResult.errors);
      warnings.push(...dangerousResult.warnings);
      sanitizedValue = dangerousResult.sanitized_value;
      securityLevel = Math.max(securityLevel, dangerousResult.security_level) as any;
    }
  }
  
  // SECURITY: Apply custom validation if provided
  if (options.customValidation) {
    const customResult = options.customValidation(sanitizedValue);
    if (!customResult.is_valid) {
      errors.push(...customResult.errors);
      warnings.push(...customResult.warnings);
      sanitizedValue = customResult.sanitized_value;
      securityLevel = Math.max(securityLevel, customResult.security_level) as any;
    }
  }
  
  // SECURITY: Apply HTML sanitization if needed
  if (SECURITY_DANGEROUS_PATTERNS.HTML_INJECTION.test(sanitizedValue) && !options.allowHtmlTags) {
    sanitizedValue = sanitizeHTMLContent(sanitizedValue);
    warnings.push('HTML content has been sanitized');
  }
  
  // SECURITY: Apply additional sanitization for high-risk content
  if (securityLevel === 'CRITICAL' || securityLevel === 'HIGH') {
    sanitizedValue = SECURITY_SANITIZATION.removeDangerousCharacters(sanitizedValue);
    sanitizedValue = SECURITY_SANITIZATION.normalizeUnicode(sanitizedValue);
    warnings.push('Content has been sanitized for security');
  }
  
  const processingTime = Date.now() - startTime;
  
  // SECURITY: Audit logging for validation attempts
  if (process.env.NODE_ENV === 'development') {
    console.warn('[SECURITY AUDIT] Comprehensive validation:', {
      field_type: fieldType,
      validation_source: source,
      security_level: securityLevel,
      is_valid: errors.length === 0,
      is_safe: errors.length === 0,
      error_count: errors.length,
      warning_count: warnings.length,
      processing_time_ms: processingTime,
      character_count: sanitizedValue.length,
      original_length: value.length,
      warning: 'Frontend validation is COSMETIC ONLY - Backend validates independently',
      security_policy: 'Backend has ZERO authority over validation results'
    });
  }
  
  return {
    is_valid: errors.length === 0,
    is_safe: errors.length === 0,
    errors,
    warnings,
    sanitized_value: sanitizedValue,
    original_value: value,
    security_level: securityLevel,
    validation_timestamp: new Date().toISOString(),
    validation_source: source
  };
}

/**
 * 🔒 SECURITY: Quick validation functions for common scenarios
 * Backend validates ALL validation - Frontend validation is COSMETIC ONLY
 */
export const SECURITY_VALIDATION = {
  /**
   * ⚠️ SECURITY: Validate name fields (max 100 characters)
   */
  validateName: (input: string, fieldType: 'FIRST_NAME' | 'LAST_NAME' | 'FULL_NAME' = 'FULL_NAME'): ValidationResult => {
    return comprehensiveSecurityValidation(input, fieldType, {
      required: true,
      checkDangerousContent: true,
      allowHtmlTags: false
    });
  },
  
  /**
   * ⚠️ SECURITY: Validate email addresses
   */
  validateEmail: (input: string): ValidationResult => {
    return comprehensiveSecurityValidation(input, 'EMAIL', {
      required: true,
      pattern: SECURITY_VALIDATION_PATTERNS.EMAIL,
      checkDangerousContent: true,
      allowHtmlTags: false
    });
  },
  
  /**
   * ⚠️ SECURITY: Validate passwords
   */
  validatePassword: (input: string): ValidationResult => {
    return comprehensiveSecurityValidation(input, 'PASSWORD', {
      required: true,
      checkDangerousContent: true,
      customValidation: (value) => {
        const errors: string[] = [];
        if (value.length < 8) errors.push('Password must be at least 8 characters');
        if (!/[A-Z]/.test(value)) errors.push('Password must contain uppercase letter');
        if (!/[a-z]/.test(value)) errors.push('Password must contain lowercase letter');
        if (!/[0-9]/.test(value)) errors.push('Password must contain number');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) errors.push('Password must contain special character');
        
        return {
          is_valid: errors.length === 0,
          is_safe: errors.length === 0,
          errors,
          warnings: [],
          sanitized_value: value,
          original_value: value,
          security_level: errors.length > 0 ? 'HIGH' : 'LOW',
          validation_timestamp: new Date().toISOString(),
          validation_source: 'FRONTEND'
        };
      }
    });
  },
  
  /**
   * ⚠️ SECURITY: Validate descriptions and comments (max 500 characters)
   */
  validateDescription: (input: string, fieldType: 'DESCRIPTION' | 'COMMENT' = 'DESCRIPTION'): ValidationResult => {
    return comprehensiveSecurityValidation(input, fieldType, {
      required: true,
      checkDangerousContent: true,
      allowHtmlTags: false
    });
  },
  
  /**
   * ⚠️ SECURITY: Validate phone numbers
   */
  validatePhone: (input: string): ValidationResult => {
    return comprehensiveSecurityValidation(input, 'PHONE', {
      required: true,
      pattern: SECURITY_VALIDATION_PATTERNS.PHONE,
      checkDangerousContent: true,
      allowHtmlTags: false
    });
  },
  
  /**
   * ⚠️ SECURITY: Validate file names
   */
  validateFileName: (input: string): ValidationResult => {
    const result = validateFileName(input);
    return result;
  },
  
  /**
   * ⚠️ SECURITY: Validate wallet addresses
   */
  validateWalletAddress: (input: string): ValidationResult => {
    // Basic validation for BTC/ETH addresses
    const walletPattern = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$|^(0x)?[0-9a-fA-F]{40}$/;
    return comprehensiveSecurityValidation(input, 'WALLET_NAME', {
      required: true,
      pattern: walletPattern,
      checkDangerousContent: true,
      allowHtmlTags: false
    });
  },
  
  /**
   * ⚠️ SECURITY: Validate search queries
   */
  validateSearchQuery: (input: string): ValidationResult => {
    return comprehensiveSecurityValidation(input, 'SEARCH_QUERY', {
      required: false,
      checkDangerousContent: true,
      allowHtmlTags: false
    });
  },
  
  /**
   * ⚠️ SECURITY: Validate addresses
   */
  validateAddress: (input: string, fieldType: 'ADDRESS_LINE' | 'CITY' | 'STATE' | 'ZIP_CODE' | 'COUNTRY' = 'ADDRESS_LINE'): ValidationResult => {
    return comprehensiveSecurityValidation(input, fieldType, {
      required: true,
      checkDangerousContent: true,
      allowHtmlTags: false
    });
  }
};

/**
 * 🔒 SECURITY: Export all validation utilities
 * Backend validates ALL utilities - Frontend utilities are COSMETIC ONLY
 * ARABIC SECURITY REQUIREMENTS: Complete security validation system
 */
export default {
  SECURITY_CHARACTER_LIMITS,
  SECURITY_VALIDATION_PATTERNS,
  SECURITY_DANGEROUS_PATTERNS,
  SECURITY_SANITIZATION,
  SECURITY_VALIDATION,
  validateInputLength,
  validateInputPattern,
  checkForDangerousContent,
  validateInputSecurity,
  sanitizeHTMLContent,
  escapeSQLContent,
  validateFileName,
  comprehensiveSecurityValidation
};

/**
 * 🔒 SECURITY: Validate input pattern - Backend validates independently
 * Frontend patterns are COSMETIC ONLY - Backend validates final format
 */
export function validateInputPattern(
  value: string,
  pattern: RegExp,
  fieldName: string,
  source: 'FRONTEND' | 'BACKEND' = 'FRONTEND'
): ValidationResult {
  const trimmedValue = value.trim();
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // SECURITY: Check pattern match
  if (!pattern.test(trimmedValue)) {
    errors.push(`Invalid ${fieldName} format`);
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SECURITY AUDIT] Pattern validation (${source}):`, {
      field: fieldName,
      pattern: pattern.source,
      is_valid: errors.length === 0,
      warning: 'Frontend validation is COSMETIC ONLY - Backend validates independently'
    });
  }
  
  return {
    is_valid: errors.length === 0,
    is_safe: errors.length === 0,
    errors,
    warnings,
    sanitized_value: trimmedValue,
    original_value: value,
    security_level: errors.length > 0 ? 'MEDIUM' : 'LOW',
    validation_timestamp: new Date().toISOString(),
    validation_source: source
  };
}

/**
 * 🔒 SECURITY: Check for dangerous content - Backend validates independently
 * Frontend detection is COSMETIC ONLY - Backend validates final safety
 */
export function checkForDangerousContent(
  value: string,
  fieldName: string,
  source: 'FRONTEND' | 'BACKEND' = 'FRONTEND'
): ValidationResult {
  const trimmedValue = value.trim();
  const errors: string[] = [];
  const warnings: string[] = [];
  let securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  
  // SECURITY: Check for SQL injection patterns
  if (SECURITY_DANGEROUS_PATTERNS.SQL_INJECTION.test(trimmedValue)) {
    errors.push('Potential SQL injection detected');
    warnings.push('Content contains SQL injection patterns');
    securityLevel = 'CRITICAL';
  }
  
  // SECURITY: Check for XSS patterns
  if (SECURITY_DANGEROUS_PATTERNS.XSS.test(trimmedValue)) {
    errors.push('Potential XSS attack detected');
    warnings.push('Content contains XSS patterns');
    securityLevel = 'CRITICAL';
  }
  
  // SECURITY: Check for HTML injection
  if (SECURITY_DANGEROUS_PATTERNS.HTML_INJECTION.test(trimmedValue)) {
    errors.push('Potential HTML injection detected');
    warnings.push('Content contains HTML injection patterns');
    securityLevel = 'HIGH';
  }
  
  // SECURITY: Check for command injection
  if (SECURITY_DANGEROUS_PATTERNS.COMMAND_INJECTION.test(trimmedValue)) {
    errors.push('Potential command injection detected');
    warnings.push('Content contains command injection patterns');
    securityLevel = 'CRITICAL';
  }
  
  // SECURITY: Check for path traversal
  if (SECURITY_DANGEROUS_PATTERNS.PATH_TRAVERSAL.test(trimmedValue)) {
    errors.push('Potential path traversal detected');
    warnings.push('Content contains path traversal patterns');
    securityLevel = 'CRITICAL';
  }
  
  // SECURITY: Sanitize dangerous content
  let sanitizedValue = trimmedValue;
  if (errors.length > 0) {
    sanitizedValue = sanitizedValue
      .replace(SECURITY_DANGEROUS_PATTERNS.SQL_INJECTION, '[BLOCKED]')
      .replace(SECURITY_DANGEROUS_PATTERNS.XSS, '[BLOCKED]')
      .replace(SECURITY_DANGEROUS_PATTERNS.HTML_INJECTION, '[BLOCKED]')
      .replace(SECURITY_DANGEROUS_PATTERNS.COMMAND_INJECTION, '[BLOCKED]')
      .replace(SECURITY_DANGEROUS_PATTERNS.PATH_TRAVERSAL, '[BLOCKED]');
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SECURITY AUDIT] Dangerous content check (${source}):`, {
      field: fieldName,
      is_safe: errors.length === 0,
      security_level: securityLevel,
      error_count: errors.length,
      warning: 'Frontend detection is COSMETIC ONLY - Backend validates final safety'
    });
  }
  
  return {
    is_valid: errors.length === 0,
    is_safe: errors.length === 0,
    errors,
    warnings,
    sanitized_value: sanitizedValue,
    original_value: value,
    security_level: securityLevel,
    validation_timestamp: new Date().toISOString(),
    validation_source: source
  };
}

/**
 * 🔒 SECURITY: Comprehensive input validation - Backend validates independently
 * Frontend validation is COSMETIC ONLY - Backend validates final data
 */
export function validateInputSecurity(
  value: string,
  fieldName: keyof typeof SECURITY_CHARACTER_LIMITS,
  options: {
    required?: boolean;
    pattern?: RegExp;
    checkDangerousContent?: boolean;
    customValidation?: (value: string) => ValidationResult;
  } = {},
  source: 'FRONTEND' | 'BACKEND' = 'FRONTEND'
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let finalSanitizedValue = value.trim();
  let securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  
  // SECURITY: Check if required
  if (options.required && !finalSanitizedValue) {
    errors.push('Field is required');
    return {
      is_valid: false,
      is_safe: false,
      errors,
      warnings,
      sanitized_value: finalSanitizedValue,
      original_value: value,
      security_level: 'HIGH',
      validation_timestamp: new Date().toISOString(),
      validation_source: source
    };
  }
  
  // SECURITY: Skip validation if empty and not required
  if (!options.required && !finalSanitizedValue) {
    return {
      is_valid: true,
      is_safe: true,
      errors,
      warnings,
      sanitized_value: finalSanitizedValue,
      original_value: value,
      security_level: 'LOW',
      validation_timestamp: new Date().toISOString(),
      validation_source: source
    };
  }
  
  // SECURITY: Validate length
  const lengthResult = validateInputLength(finalSanitizedValue, fieldName, source);
  if (!lengthResult.is_valid) {
    errors.push(...lengthResult.errors);
    warnings.push(...lengthResult.warnings);
    finalSanitizedValue = lengthResult.sanitized_value;
    securityLevel = lengthResult.security_level;
  }
  
  // SECURITY: Validate pattern if provided
  if (options.pattern) {
    const patternResult = validateInputPattern(finalSanitizedValue, options.pattern, fieldName, source);
    if (!patternResult.is_valid) {
      errors.push(...patternResult.errors);
      warnings.push(...patternResult.warnings);
      securityLevel = Math.max(securityLevel, patternResult.security_level) as any;
    }
  }
  
  // SECURITY: Check for dangerous content if requested
  if (options.checkDangerousContent !== false) {
    const dangerousResult = checkForDangerousContent(finalSanitizedValue, fieldName, source);
    if (!dangerousResult.is_safe) {
      errors.push(...dangerousResult.errors);
      warnings.push(...dangerousResult.warnings);
      finalSanitizedValue = dangerousResult.sanitized_value;
      securityLevel = Math.max(securityLevel, dangerousResult.security_level) as any;
    }
  }
  
  // SECURITY: Apply custom validation if provided
  if (options.customValidation) {
    const customResult = options.customValidation(finalSanitizedValue);
    if (!customResult.is_valid) {
      errors.push(...customResult.errors);
      warnings.push(...customResult.warnings);
      finalSanitizedValue = customResult.sanitized_value;
      securityLevel = Math.max(securityLevel, customResult.security_level) as any;
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SECURITY AUDIT] Comprehensive validation (${source}):`, {
      field: fieldName,
      is_valid: errors.length === 0,
      is_safe: errors.length === 0,
      security_level: securityLevel,
      error_count: errors.length,
      warning: 'Frontend validation is COSMETIC ONLY - Backend validates independently'
    });
  }
  
  return {
    is_valid: errors.length === 0,
    is_safe: errors.length === 0,
    errors,
    warnings,
    sanitized_value: finalSanitizedValue,
    original_value: value,
    security_level: securityLevel,
    validation_timestamp: new Date().toISOString(),
    validation_source: source
  };
}

/**
 * 🔒 SECURITY: Enhanced Sanitization Functions - Backend validates independently
 * Frontend sanitization is COSMETIC ONLY - Backend validates final content
 * ARABIC SECURITY REQUIREMENTS: Comprehensive input sanitization
 */
export const SECURITY_SANITIZATION = {
  /**
   * ⚠️ SECURITY: Remove dangerous characters - Backend validates ALL removals
   */
  removeDangerousCharacters: (input: string): string => {
    // SECURITY: Remove control characters and dangerous Unicode
    return input
      .replace(SECURITY_DANGEROUS_PATTERNS.CONTROL_CHARACTERS, '')
      .replace(SECURITY_DANGEROUS_PATTERNS.WHITESPACE_EXPLOITATION, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
  },
  
  /**
   * ⚠️ SECURITY: Escape HTML entities - Backend validates ALL escaping
   */
  escapeHtmlEntities: (input: string): string => {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;',
    };
    
    return input.replace(/[&<>"'`=\/]/g, (match) => htmlEscapes[match]);
  },
  
  /**
   * ⚠️ SECURITY: Normalize Unicode - Backend validates ALL normalization
   */
  normalizeUnicode: (input: string): string => {
    // SECURITY: Normalize to NFC form and remove dangerous Unicode
    return input
      .normalize('NFC')
      .replace(SECURITY_DANGEROUS_PATTERNS.UNICODE_HOMOGLYPHS, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '');
  },
  
  /**
   * ⚠️ SECURITY: Truncate to safe length - Backend validates ALL truncation
   */
  truncateToSafeLength: (input: string, maxLength: number): string => {
    if (input.length <= maxLength) return input;
    
    // SECURITY: Truncate without breaking Unicode characters
    const truncated = input.substring(0, maxLength);
    
    // SECURITY: Ensure we don't break in the middle of a Unicode sequence
    const lastChar = truncated.charCodeAt(truncated.length - 1);
    if (lastChar >= 0xD800 && lastChar <= 0xDBFF) {
      // We're in the middle of a surrogate pair, remove the last character
      return truncated.substring(0, truncated.length - 1);
    }
    
    return truncated;
  },
  
  /**
   * ⚠️ SECURITY: Remove HTML tags - Backend validates ALL removal
   */
  removeHtmlTags: (input: string, allowedTags: string[] = []): string => {
    if (allowedTags.length === 0) {
      // SECURITY: Remove ALL HTML tags
      return input.replace(/<[^>]*>/g, '');
    }
    
    // SECURITY: Remove only disallowed HTML tags
    const allowedPattern = allowedTags.map(tag => `<\/?${tag}[^>]*>`).join('|');
    const disallowedPattern = new RegExp(`<(?!${allowedPattern})[^>]*>`, 'gi');
    return input.replace(disallowedPattern, '');
  },
};

/**
 * 🔒 SECURITY: Enhanced HTML Sanitization - Backend validates independently
 */
export function sanitizeHTMLContent(content: string): string {
  if (!content) return '';
  
  // SECURITY: Remove dangerous HTML tags and attributes
  let sanitized = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/<input\b[^<]*(?:(?!<\/input>)<[^<]*)*\/?>/gi, '')
    .replace(/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi, '')
    .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '')
    .replace(/<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi, '')
    .replace(/<option\b[^<]*(?:(?!<\/option>)<[^<]*)*<\/option>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/data:text\/javascript/gi, '')
    .replace(/data:text\/vbscript/gi, '');
  
  // SECURITY: Remove event handlers
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["']?[^"'>]*["']?/gi, '');
  
  // SECURITY: Escape remaining HTML entities
  sanitized = SECURITY_SANITIZATION.escapeHtmlEntities(sanitized);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY AUDIT] HTML sanitization:', {
      original_length: content.length,
      sanitized_length: sanitized.length,
      warning: 'Frontend sanitization is COSMETIC ONLY - Backend validates independently'
    });
  }
  
  return sanitized;
}

/**
 * 🔒 SECURITY: Enhanced SQL escaping - Backend validates independently
 * Frontend escaping is COSMETIC ONLY - Backend validates final queries
 * ARABIC SECURITY REQUIREMENTS: SQL injection prevention
 */
export function escapeSQLContent(content: string): string {
  if (!content) return '';
  
  // SECURITY: Escape SQL special characters with comprehensive protection
  const escaped = content
    .replace(/'/g, "''")
    .replace(/"/g, '""')
    .replace(/\\/g, '\\\\')
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z')
    .replace(/\x00/g, '') // Remove null bytes
    .replace(/\x08/g, '') // Remove backspace
    .replace(/\x09/g, '') // Remove tab
    .replace(/\x0B/g, '') // Remove vertical tab
    .replace(/\x0C/g, ''); // Remove form feed
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY AUDIT] SQL escaping:', {
      original_length: content.length,
      escaped_length: escaped.length,
      warning: 'Frontend escaping is COSMETIC ONLY - Backend validates independently'
    });
  }
  
  return escaped;
}

/**
 * 🔒 SECURITY: Validate file upload name - Backend validates independently
 * Frontend validation is COSMETIC ONLY - Backend validates final file
 */
export function validateFileName(fileName: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // SECURITY: Check for path traversal
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    errors.push('File name contains invalid path characters');
    warnings.push('Potential path traversal attack detected');
  }
  
  // SECURITY: Check for dangerous extensions
  const dangerousExtensions = ['.php', '.asp', '.jsp', '.exe', '.bat', '.cmd', '.sh', '.js', '.vbs'];
  const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  if (dangerousExtensions.includes(fileExtension)) {
    errors.push('File type is not allowed for security reasons');
    warnings.push('Dangerous file extension detected');
  }
  
  // SECURITY: Sanitize file name
  const sanitizedFileName = fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY AUDIT] File name validation:', {
      original_name: fileName,
      sanitized_name: sanitizedFileName,
      is_valid: errors.length === 0,
      warning: 'Frontend validation is COSMETIC ONLY - Backend validates independently'
    });
  }
  
  return {
    is_valid: errors.length === 0,
    is_safe: errors.length === 0,
    errors,
    warnings,
    sanitized_value: sanitizedFileName,
    original_value: fileName,
    security_level: errors.length > 0 ? 'CRITICAL' : 'LOW',
    validation_timestamp: new Date().toISOString(),
    validation_source: 'FRONTEND'
  };
}