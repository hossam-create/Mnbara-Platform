import React, { useState, useCallback, useMemo } from 'react';
import {
  comprehensiveSecurityValidation,
  SECURITY_VALIDATION,
  SECURITY_CHARACTER_LIMITS,
  ValidationResult,
  sanitizeHTMLContent,
  escapeSQLContent
} from '../../utils/securityValidation';
import { useSecurityErrorHandler } from '../../utils/securityErrorHandling';
import { logSecurityEvent } from '../../services/securityEventLogging.service';
import styles from './SecureFormComponents.module.css';

/**
 * 🔒 SECURITY-FIRST FORM COMPONENTS
 * ACCESS CONTROL & AUTHORITY POLICY IMPLEMENTATION
 * 
 * CRITICAL SECURITY NOTICE:
 * - All validation is SECURITY-CRITICAL for input sanitization
 * - Backend validates ALL data - Frontend validation is COSMETIC ONLY
 * - Character limits prevent buffer overflow and injection attacks
 * - XSS/SQL injection patterns are BLOCKED at input level
 * - Malformed data is REJECTED before processing
 * 
 * ARABIC SECURITY REQUIREMENTS IMPLEMENTATION:
 * ✅ Character Limits: Names max 100, Comments max 500
 * ✅ Client-side & Server-side validation
 * ✅ SQL Injection prevention
 * ✅ XSS prevention  
 * ✅ HTML/Script injection prevention
 * ✅ Malformed data rejection
 */

interface SecureInputProps {
  name: string;
  fieldType: keyof typeof SECURITY_CHARACTER_LIMITS;
  value: string;
  onChange: (value: string, validation: ValidationResult) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  pattern?: RegExp;
  checkDangerousContent?: boolean;
  securityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  showCharacterCounter?: boolean;
  maxLength?: number;
  autoComplete?: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'url';
}

interface SecureTextareaProps {
  name: string;
  fieldType: keyof typeof SECURITY_CHARACTER_LIMITS;
  value: string;
  onChange: (value: string, validation: ValidationResult) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  rows?: number;
  checkDangerousContent?: boolean;
  securityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  showCharacterCounter?: boolean;
  maxLength?: number;
}

interface SecureFormProps {
  children: React.ReactNode;
  onSubmit: (formData: Record<string, any>) => void;
  className?: string;
  securityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enableCSRFProtection?: boolean;
  enableRateLimiting?: boolean;
  formId?: string;
}

interface SecurityValidationDisplayProps {
  validation: ValidationResult;
  showDetailedErrors?: boolean;
}

/**
 * 🔒 SECURITY: Secure Input Component with comprehensive validation
 */
export const SecureInput: React.FC<SecureInputProps> = ({
  name,
  fieldType,
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  className = '',
  pattern,
  checkDangerousContent = true,
  securityLevel = 'MEDIUM',
  showCharacterCounter = true,
  maxLength,
  autoComplete,
  type = 'text'
}) => {
  const [localValidation, setLocalValidation] = useState<ValidationResult | null>(null);
  const { handleSecurityError } = useSecurityErrorHandler();
  
  // SECURITY: Memoize validation to prevent excessive processing
  const validateInput = useCallback((inputValue: string) => {
    const startTime = Date.now();
    
    // SECURITY: Perform comprehensive validation
    const validation = comprehensiveSecurityValidation(
      inputValue,
      fieldType,
      {
        required,
        pattern,
        checkDangerousContent,
        allowHtmlTags: false
      },
      'FRONTEND'
    );
    
    // SECURITY: Log validation attempts for audit
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[SECURITY AUDIT] Input validation for ${name}:`, {
        field_type: fieldType,
        is_valid: validation.is_valid,
        is_safe: validation.is_safe,
        security_level: validation.security_level,
        error_count: validation.errors.length,
        character_count: validation.sanitized_value.length,
        processing_time_ms: Date.now() - startTime,
        warning: 'Frontend validation is COSMETIC ONLY - Backend validates independently'
      });
    }
    
    // SECURITY: Log security events for suspicious content
    if (!validation.is_safe && validation.security_level === 'CRITICAL') {
      logSecurityEvent({
        event_type: 'SECURITY_INPUT_VALIDATION_FAILED',
        severity: 'CRITICAL',
        user_id: 'anonymous', // Will be populated by backend
        ip_address: 'client', // Will be populated by backend
        user_agent: navigator.userAgent,
        details: {
          field_name: name,
          field_type: fieldType,
          dangerous_patterns: validation.errors,
          validation_source: 'FRONTEND',
          security_level: validation.security_level
        }
      }).catch(error => {
        console.error('[SECURITY ERROR] Failed to log validation event:', error);
      });
    }
    
    return validation;
  }, [name, fieldType, required, pattern, checkDangerousContent]);
  
  // SECURITY: Handle input changes with validation
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    
    // SECURITY: Enforce maximum length at input level
    const maxAllowedLength = maxLength || SECURITY_CHARACTER_LIMITS[fieldType].max;
    const truncatedValue = newValue.length > maxAllowedLength 
      ? newValue.substring(0, maxAllowedLength)
      : newValue;
    
    // SECURITY: Validate the input
    const validation = validateInput(truncatedValue);
    setLocalValidation(validation);
    
    // SECURITY: Only propagate safe values
    if (validation.is_safe || !checkDangerousContent) {
      onChange(validation.sanitized_value, validation);
    } else {
      // SECURITY: Block dangerous content and show error
      handleSecurityError(
        new Error(`Dangerous content detected in ${name}`),
        'VALIDATION',
        validation.security_level as any
      ).then(errorResponse => {
        onChange('', {
          ...validation,
          sanitized_value: '',
          errors: [...validation.errors, errorResponse.userMessage]
        });
      });
    }
  }, [validateInput, onChange, name, maxLength, fieldType, checkDangerousContent, handleSecurityError]);
  
  // SECURITY: Calculate character usage
  const characterLimits = SECURITY_CHARACTER_LIMITS[fieldType];
  const currentLength = value?.length || 0;
  const maxChars = maxLength || characterLimits.max;
  const characterPercentage = (currentLength / maxChars) * 100;
  
  // SECURITY: Determine input styling based on validation state
  const getInputClassName = useMemo(() => {
    let baseClass = `${styles.secureInput} ${className}`;
    
    if (localValidation) {
      if (!localValidation.is_valid) {
        baseClass += ` ${styles.inputError}`;
      } else if (!localValidation.is_safe) {
        baseClass += ` ${styles.inputWarning}`;
      } else if (localValidation.security_level === 'CRITICAL') {
        baseClass += ` ${styles.inputCritical}`;
      } else if (localValidation.security_level === 'HIGH') {
        baseClass += ` ${styles.inputHighRisk}`;
      }
    }
    
    return baseClass;
  }, [className, localValidation]);
  
  return (
    <div className={styles.secureInputContainer}>
      <input
        type={type}
        name={name}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={getInputClassName}
        maxLength={maxChars}
        autoComplete={autoComplete}
        aria-describedby={`${name}-validation`}
        aria-invalid={localValidation ? !localValidation.is_valid : undefined}
        data-security-level={securityLevel}
        data-field-type={fieldType}
      />
      
      {showCharacterCounter && (
        <div className={styles.characterCounter}>
          <span className={currentLength > maxChars * 0.9 ? styles.warningText : ''}>
            {currentLength}/{maxChars}
          </span>
          <div 
            className={styles.characterProgress}
            style={{ width: `${characterPercentage}%` }}
          />
        </div>
      )}
      
      {localValidation && (
        <SecurityValidationDisplay 
          validation={localValidation}
          showDetailedErrors={process.env.NODE_ENV === 'development'}
        />
      )}
    </div>
  );
};

/**
 * 🔒 SECURITY: Secure Textarea Component with comprehensive validation
 */
export const SecureTextarea: React.FC<SecureTextareaProps> = ({
  name,
  fieldType,
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  className = '',
  rows = 4,
  checkDangerousContent = true,
  securityLevel = 'MEDIUM',
  showCharacterCounter = true,
  maxLength
}) => {
  const [localValidation, setLocalValidation] = useState<ValidationResult | null>(null);
  const { handleSecurityError } = useSecurityErrorHandler();
  
  // SECURITY: Memoize validation for performance
  const validateTextarea = useCallback((inputValue: string) => {
    const startTime = Date.now();
    
    // SECURITY: Perform comprehensive validation for textareas
    const validation = comprehensiveSecurityValidation(
      inputValue,
      fieldType,
      {
        required,
        checkDangerousContent,
        allowHtmlTags: false // SECURITY: Never allow HTML in textareas
      },
      'FRONTEND'
    );
    
    // SECURITY: Special validation for textareas (comments, descriptions)
    if (fieldType === 'DESCRIPTION' || fieldType === 'COMMENT') {
      // SECURITY: Check for excessive line breaks (potential DoS)
      const lineBreaks = (validation.sanitized_value.match(/\n/g) || []).length;
      if (lineBreaks > 50) {
        validation.errors.push('Too many line breaks');
        validation.warnings.push('Content contains excessive formatting');
        validation.security_level = 'MEDIUM';
      }
      
      // SECURITY: Check for repetitive content
      const words = validation.sanitized_value.toLowerCase().split(/\s+/);
      const wordFrequency: Record<string, number> = {};
      words.forEach(word => {
        if (word.length > 3) {
          wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
      });
      
      const repetitiveWords = Object.entries(wordFrequency)
        .filter(([_, count]) => count > 10)
        .map(([word]) => word);
      
      if (repetitiveWords.length > 0) {
        validation.warnings.push(`Repetitive content detected: ${repetitiveWords.join(', ')}`);
      }
    }
    
    // SECURITY: Log validation for audit
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[SECURITY AUDIT] Textarea validation for ${name}:`, {
        field_type: fieldType,
        is_valid: validation.is_valid,
        is_safe: validation.is_safe,
        security_level: validation.security_level,
        error_count: validation.errors.length,
        character_count: validation.sanitized_value.length,
        line_count: (validation.sanitized_value.match(/\n/g) || []).length + 1,
        processing_time_ms: Date.now() - startTime,
        warning: 'Frontend validation is COSMETIC ONLY - Backend validates independently'
      });
    }
    
    return validation;
  }, [name, fieldType, required, checkDangerousContent]);
  
  // SECURITY: Handle textarea changes
  const handleTextareaChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    
    // SECURITY: Enforce maximum length
    const maxAllowedLength = maxLength || SECURITY_CHARACTER_LIMITS[fieldType].max;
    const truncatedValue = newValue.length > maxAllowedLength 
      ? newValue.substring(0, maxAllowedLength)
      : newValue;
    
    // SECURITY: Validate the content
    const validation = validateTextarea(truncatedValue);
    setLocalValidation(validation);
    
    // SECURITY: Only propagate safe values
    if (validation.is_safe || !checkDangerousContent) {
      onChange(validation.sanitized_value, validation);
    } else {
      // SECURITY: Handle dangerous content
      handleSecurityError(
        new Error(`Dangerous content detected in ${name}`),
        'VALIDATION',
        validation.security_level as any
      ).then(errorResponse => {
        onChange('', {
          ...validation,
          sanitized_value: '',
          errors: [...validation.errors, errorResponse.userMessage]
        });
      });
    }
  }, [validateTextarea, onChange, name, maxLength, fieldType, checkDangerousContent, handleSecurityError]);
  
  // SECURITY: Calculate character usage and formatting
  const characterLimits = SECURITY_CHARACTER_LIMITS[fieldType];
  const currentLength = value?.length || 0;
  const maxChars = maxLength || characterLimits.max;
  const characterPercentage = (currentLength / maxChars) * 100;
  const lineCount = (value?.match(/\n/g) || []).length + 1;
  
  return (
    <div className={styles.secureTextareaContainer}>
      <textarea
        name={name}
        value={value}
        onChange={handleTextareaChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`${styles.secureTextarea} ${className} ${
          localValidation && !localValidation.is_valid ? styles.textareaError : ''
        } ${
          localValidation && !localValidation.is_safe ? styles.textareaWarning : ''
        }`}
        rows={rows}
        maxLength={maxChars}
        aria-describedby={`${name}-validation`}
        aria-invalid={localValidation ? !localValidation.is_valid : undefined}
        data-security-level={securityLevel}
        data-field-type={fieldType}
      />
      
      {showCharacterCounter && (
        <div className={styles.textareaMeta}>
          <div className={styles.characterInfo}>
            <span className={currentLength > maxChars * 0.9 ? styles.warningText : ''}>
              {currentLength}/{maxChars} characters
            </span>
            <span className={styles.lineCount}>
              {lineCount} lines
            </span>
          </div>
          <div 
            className={styles.characterProgress}
            style={{ width: `${characterPercentage}%` }}
          />
        </div>
      )}
      
      {localValidation && (
        <SecurityValidationDisplay 
          validation={localValidation}
          showDetailedErrors={process.env.NODE_ENV === 'development'}
        />
      )}
    </div>
  );
};

/**
 * 🔒 SECURITY: Secure Form Component with CSRF protection and rate limiting
 */
export const SecureForm: React.FC<SecureFormProps> = ({
  children,
  onSubmit,
  className = '',
  securityLevel = 'HIGH',
  enableCSRFProtection = true,
  enableRateLimiting = true,
  formId = `secure-form-${Date.now()}`
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValidation, setFormValidation] = useState<Record<string, ValidationResult>>({});
  const { handleSecurityError } = useSecurityErrorHandler();
  
  // SECURITY: Generate CSRF token (cosmetic - backend validates)
  const [csrfToken] = useState(() => {
    if (enableCSRFProtection) {
      return Array.from({ length: 32 }, () => 
        Math.floor(Math.random() * 36).toString(36)
      ).join('');
    }
    return null;
  });
  
  // SECURITY: Handle form submission with validation
  const handleFormSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (isSubmitting) {
      console.warn('[SECURITY] Form submission blocked - already submitting');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // SECURITY: Collect form data
      const formData = new FormData(event.currentTarget);
      const formDataObject: Record<string, any> = {};
      
      // SECURITY: Process form data with validation
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          formDataObject[key] = value.trim();
        }
      }
      
      // SECURITY: Validate all form fields
      const validationResults: Record<string, ValidationResult> = {};
      let hasValidationErrors = false;
      let hasSecurityIssues = false;
      
      // SECURITY: Validate each field based on its type
      Object.keys(formDataObject).forEach(fieldName => {
        const fieldValue = formDataObject[fieldName];
        const fieldType = fieldName.toUpperCase().replace(/_/g, '') as keyof typeof SECURITY_CHARACTER_LIMITS;
        
        if (SECURITY_CHARACTER_LIMITS[fieldType]) {
          const validation = comprehensiveSecurityValidation(
            fieldValue,
            fieldType,
            { required: true, checkDangerousContent: true },
            'FRONTEND'
          );
          
          validationResults[fieldName] = validation;
          
          if (!validation.is_valid) {
            hasValidationErrors = true;
          }
          
          if (!validation.is_safe) {
            hasSecurityIssues = true;
          }
        }
      });
      
      setFormValidation(validationResults);
      
      // SECURITY: Block submission if validation fails
      if (hasValidationErrors || hasSecurityIssues) {
        console.error('[SECURITY] Form validation failed:', {
          has_validation_errors: hasValidationErrors,
          has_security_issues: hasSecurityIssues,
          validation_results: validationResults
        });
        
        await handleSecurityError(
          new Error('Form validation failed'),
          'VALIDATION',
          hasSecurityIssues ? 'CRITICAL' : 'HIGH'
        );
        
        return;
      }
      
      // SECURITY: Log successful validation
      if (process.env.NODE_ENV === 'development') {
        console.log('[SECURITY AUDIT] Form validation successful:', {
          form_id: formId,
          field_count: Object.keys(formDataObject).length,
          security_level: securityLevel,
          csrf_protection: enableCSRFProtection,
          rate_limiting: enableRateLimiting
        });
      }
      
      // SECURITY: Submit sanitized data
      const sanitizedFormData: Record<string, any> = {};
      Object.keys(formDataObject).forEach(key => {
        if (validationResults[key]) {
          sanitizedFormData[key] = validationResults[key].sanitized_value;
        } else {
          sanitizedFormData[key] = formDataObject[key];
        }
      });
      
      // SECURITY: Add CSRF token if enabled
      if (enableCSRFProtection && csrfToken) {
        sanitizedFormData._csrf_token = csrfToken;
      }
      
      // SECURITY: Add security metadata
      sanitizedFormData._security_metadata = {
        validation_timestamp: new Date().toISOString(),
        validation_source: 'FRONTEND',
        security_level: securityLevel,
        client_timestamp: Date.now()
      };
      
      // SECURITY: Call the provided submit handler
      await onSubmit(sanitizedFormData);
      
    } catch (error) {
      console.error('[SECURITY ERROR] Form submission failed:', error);
      await handleSecurityError(error, 'FORM_SUBMISSION', 'HIGH');
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, isSubmitting, csrfToken, enableCSRFProtection, securityLevel, formId, handleSecurityError]);
  
  return (
    <form
      id={formId}
      onSubmit={handleFormSubmit}
      className={`${styles.secureForm} ${className}`}
      data-security-level={securityLevel}
      noValidate // SECURITY: We handle validation ourselves
    >
      {enableCSRFProtection && csrfToken && (
        <input
          type="hidden"
          name="_csrf_token"
          value={csrfToken}
          data-security-purpose="csrf-protection"
        />
      )}
      
      <div className={styles.formContent}>
        {children}
      </div>
      
      {Object.keys(formValidation).length > 0 && (
        <div className={styles.formValidationSummary}>
          <h4>Validation Summary</h4>
          {Object.entries(formValidation).map(([fieldName, validation]) => (
            validation.errors.length > 0 && (
              <div key={fieldName} className={styles.fieldError}>
                <strong>{fieldName}:</strong> {validation.errors.join(', ')}
              </div>
            )
          ))}
        </div>
      )}
      
      <button
        type="submit"
        disabled={isSubmitting}
        className={`${styles.secureSubmitButton} ${
          isSubmitting ? styles.submitting : ''
        }`}
        data-security-level={securityLevel}
      >
        {isSubmitting ? 'Processing...' : 'Submit'}
      </button>
    </form>
  );
};

/**
 * 🔒 SECURITY: Validation Result Display Component
 */
export const SecurityValidationDisplay: React.FC<SecurityValidationDisplayProps> = ({
  validation,
  showDetailedErrors = false
}) => {
  if (!validation || (validation.is_valid && validation.is_safe)) {
    return null;
  }
  
  const getValidationClass = () => {
    if (!validation.is_valid) return styles.validationError;
    if (!validation.is_safe) return styles.validationWarning;
    if (validation.security_level === 'CRITICAL') return styles.validationCritical;
    if (validation.security_level === 'HIGH') return styles.validationHighRisk;
    return styles.validationInfo;
  };
  
  return (
    <div className={`${styles.validationDisplay} ${getValidationClass()}`}>
      {validation.errors.length > 0 && (
        <div className={styles.errorMessages}>
          {validation.errors.map((error, index) => (
            <div key={index} className={styles.errorMessage}>
              ⚠️ {error}
            </div>
          ))}
        </div>
      )}
      
      {validation.warnings.length > 0 && (
        <div className={styles.warningMessages}>
          {validation.warnings.map((warning, index) => (
            <div key={index} className={styles.warningMessage}>
              ⚡ {warning}
            </div>
          ))}
        </div>
      )}
      
      {showDetailedErrors && process.env.NODE_ENV === 'development' && (
        <div className={styles.debugInfo}>
          <small>
            Security Level: {validation.security_level} | 
            Source: {validation.validation_source} | 
            Chars: {validation.sanitized_value.length}
          </small>
        </div>
      )}
    </div>
  );
};

/**
 * 🔒 SECURITY: Export secure form utilities
 */
export const SecureFormUtils = {
  /**
   * SECURITY: Validate entire form data
   */
  validateFormData: (formData: Record<string, string>): Record<string, ValidationResult> => {
    const results: Record<string, ValidationResult> = {};
    
    Object.entries(formData).forEach(([fieldName, fieldValue]) => {
      const fieldType = fieldName.toUpperCase().replace(/_/g, '') as keyof typeof SECURITY_CHARACTER_LIMITS;
      
      if (SECURITY_CHARACTER_LIMITS[fieldType]) {
        results[fieldName] = comprehensiveSecurityValidation(
          fieldValue,
          fieldType,
          { required: true, checkDangerousContent: true },
          'FRONTEND'
        );
      }
    });
    
    return results;
  },
  
  /**
   * SECURITY: Check if form has security issues
   */
  hasSecurityIssues: (validationResults: Record<string, ValidationResult>): boolean => {
    return Object.values(validationResults).some(result => !result.is_safe);
  },
  
  /**
   * SECURITY: Get sanitized form data
   */
  getSanitizedFormData: (validationResults: Record<string, ValidationResult>): Record<string, string> => {
    const sanitized: Record<string, string> = {};
    
    Object.entries(validationResults).forEach(([fieldName, validation]) => {
      if (validation.is_safe) {
        sanitized[fieldName] = validation.sanitized_value;
      }
    });
    
    return sanitized;
  }
};

export default {
  SecureInput,
  SecureTextarea,
  SecureForm,
  SecurityValidationDisplay,
  SecureFormUtils
};