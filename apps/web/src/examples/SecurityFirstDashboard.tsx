import React, { useState, useCallback } from 'react';
import {
  SecureInput,
  SecureTextarea,
  SecureForm,
  SecurityValidationDisplay,
  SecureFormUtils
} from '../components/forms/SecureFormComponents';
import {
  comprehensiveSecurityValidation,
  SECURITY_VALIDATION,
  SECURITY_CHARACTER_LIMITS
} from '../utils/securityValidation';
import { SecureImageUpload } from '../components/forms/SecureImageUpload';
import { validateImageFile } from '../components/forms/SecureImageUpload';
import { useSecurityRateLimiting } from '../services/securityRateLimiting.service';
import { useSecurityErrorHandler } from '../utils/securityErrorHandling';
import { logSecurityEvent } from '../services/securityEventLogging.service';
import { AdminGuard } from '../components/guards/SecurityRoleGuards';
import { SecurityEventLoggingDemo } from './SecurityEventLoggingDemo';
import styles from './SecurityFirstDashboard.module.css';

/**
 * 🔒 SECURITY-FIRST DASHBOARD DEMONSTRATION
 * ACCESS CONTROL & AUTHORITY POLICY IMPLEMENTATION
 * 
 * CRITICAL SECURITY NOTICE:
 * - This dashboard demonstrates ALL security requirements
 * - Backend validates ALL data - Frontend validation is COSMETIC ONLY
 * - All security features work together as a comprehensive system
 * 
 * ARABIC SECURITY REQUIREMENTS IMPLEMENTATION:
 * ✅ Input validation with character limits
 * ✅ Image upload security with format restrictions
 * ✅ Database cleanup jobs
 * ✅ Rate limiting and anti-bot protection
 * ✅ Secure error handling
 * ✅ Security by Default principle
 */

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  description: string;
  comment: string;
  profileImage: File | null;
}

interface ValidationState {
  firstName: ValidationResult | null;
  lastName: ValidationResult | null;
  email: ValidationResult | null;
  phone: ValidationResult | null;
  description: ValidationResult | null;
  comment: ValidationResult | null;
}

export const SecurityFirstDashboard: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    description: '',
    comment: '',
    profileImage: null
  });
  
  const [validationState, setValidationState] = useState<ValidationState>({
    firstName: null,
    lastName: null,
    email: null,
    phone: null,
    description: null,
    comment: null
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  
  // SECURITY: Initialize security services
  const { handleSecurityError } = useSecurityErrorHandler();
  const { checkRateLimit, getRateLimitStatus } = useSecurityRateLimiting();
  
  // SECURITY: Handle input changes with validation
  const handleInputChange = useCallback((fieldName: keyof FormData, value: string, validation: ValidationResult) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    setValidationState(prev => ({ ...prev, [fieldName]: validation }));
    
    // SECURITY: Log validation events for audit
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[SECURITY AUDIT] Field validation:`, {
        field: fieldName,
        value_length: value.length,
        is_valid: validation.is_valid,
        is_safe: validation.is_safe,
        security_level: validation.security_level,
        error_count: validation.errors.length,
        warning: 'Frontend validation is COSMETIC ONLY - Backend validates independently'
      });
    }
    
    // SECURITY: Log critical security events
    if (!validation.is_safe && validation.security_level === 'CRITICAL') {
      logSecurityEvent({
        event_type: 'SECURITY_INPUT_VALIDATION_CRITICAL',
        severity: 'CRITICAL',
        user_id: 'anonymous',
        ip_address: 'client',
        user_agent: navigator.userAgent,
        details: {
          field_name: fieldName,
          field_value_length: value.length,
          dangerous_patterns: validation.errors,
          security_level: validation.security_level,
          validation_source: 'FRONTEND'
        }
      }).catch(error => {
        console.error('[SECURITY ERROR] Failed to log critical validation event:', error);
      });
    }
  }, []);
  
  // SECURITY: Handle image upload
  const handleImageUpload = useCallback((file: File | null) => {
    setFormData(prev => ({ ...prev, profileImage: file }));
    
    // SECURITY: Log image upload events
    if (file) {
      logSecurityEvent({
        event_type: 'SECURITY_IMAGE_UPLOAD_ATTEMPT',
        severity: 'INFO',
        user_id: 'anonymous',
        ip_address: 'client',
        user_agent: navigator.userAgent,
        details: {
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          validation_source: 'FRONTEND'
        }
      }).catch(error => {
        console.error('[SECURITY ERROR] Failed to log image upload event:', error);
      });
    }
  }, []);
  
  // SECURITY: Handle form submission with comprehensive validation
  const handleFormSubmit = useCallback(async (formData: Record<string, any>) => {
    try {
      setIsSubmitting(true);
      setSubmitResult(null);
      
      // SECURITY: Check rate limiting
      const rateLimitCheck = await checkRateLimit('FORM_SUBMISSION');
      if (!rateLimitCheck.allowed) {
        throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(rateLimitCheck.retryAfter / 1000)} seconds.`);
      }
      
      // SECURITY: Validate all fields comprehensively
      const validationResults = SecureFormUtils.validateFormData({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        description: formData.description,
        comment: formData.comment
      });
      
      // SECURITY: Check for security issues
      if (SecureFormUtils.hasSecurityIssues(validationResults)) {
        console.error('[SECURITY] Form submission blocked due to security issues:', validationResults);
        throw new Error('Security validation failed. Please review your input.');
      }
      
      // SECURITY: Get sanitized form data
      const sanitizedData = SecureFormUtils.getSanitizedFormData(validationResults);
      
      // SECURITY: Validate image if provided
      if (formData.profileImage) {
        const imageValidation = await validateImageFile(formData.profileImage);
        if (!imageValidation.isValid) {
          throw new Error(`Image validation failed: ${imageValidation.errors.join(', ')}`);
        }
      }
      
      // SECURITY: Log successful validation
      logSecurityEvent({
        event_type: 'SECURITY_FORM_VALIDATION_SUCCESS',
        severity: 'INFO',
        user_id: 'anonymous',
        ip_address: 'client',
        user_agent: navigator.userAgent,
        details: {
          form_fields: Object.keys(sanitizedData),
          has_image: !!formData.profileImage,
          validation_source: 'FRONTEND',
          security_level: 'HIGH'
        }
      }).catch(error => {
        console.error('[SECURITY ERROR] Failed to log form validation success:', error);
      });
      
      // SECURITY: Simulate API submission (backend would validate independently)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // SECURITY: Log successful submission
      logSecurityEvent({
        event_type: 'SECURITY_FORM_SUBMISSION_SUCCESS',
        severity: 'INFO',
        user_id: 'anonymous',
        ip_address: 'client',
        user_agent: navigator.userAgent,
        details: {
          form_data_length: JSON.stringify(sanitizedData).length,
          has_image: !!formData.profileImage,
          submission_source: 'FRONTEND'
        }
      }).catch(error => {
        console.error('[SECURITY ERROR] Failed to log form submission success:', error);
      });
      
      setSubmitResult('✅ Form submitted successfully! Backend will validate independently.');
      
      // SECURITY: Reset form after successful submission
      setTimeout(() => {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          description: '',
          comment: '',
          profileImage: null
        });
        setValidationState({
          firstName: null,
          lastName: null,
          email: null,
          phone: null,
          description: null,
          comment: null
        });
      }, 3000);
      
    } catch (error) {
      console.error('[SECURITY ERROR] Form submission failed:', error);
      
      // SECURITY: Handle security errors
      const errorResponse = await handleSecurityError(error, 'FORM_SUBMISSION', 'HIGH');
      setSubmitResult(`❌ ${errorResponse.userMessage}`);
      
      // SECURITY: Log submission failure
      logSecurityEvent({
        event_type: 'SECURITY_FORM_SUBMISSION_FAILED',
        severity: 'HIGH',
        user_id: 'anonymous',
        ip_address: 'client',
        user_agent: navigator.userAgent,
        details: {
          error_message: error.message,
          error_category: 'FORM_SUBMISSION',
          validation_source: 'FRONTEND'
        }
      }).catch(logError => {
        console.error('[SECURITY ERROR] Failed to log form submission failure:', logError);
      });
      
    } finally {
      setIsSubmitting(false);
    }
  }, [checkRateLimit, handleSecurityError]);
  
  // SECURITY: Test dangerous input patterns
  const testDangerousInput = useCallback(() => {
    const dangerousInputs = [
      "<script>alert('XSS')</script>",
      "'; DROP TABLE users; --",
      "javascript:alert('XSS')",
      "../../../etc/passwd",
      "<iframe src='javascript:alert(1)'></iframe>",
      "SELECT * FROM users WHERE 1=1",
      "<body onload=alert('XSS')>",
      "'; EXEC xp_cmdshell 'dir'; --"
    ];
    
    const randomInput = dangerousInputs[Math.floor(Math.random() * dangerousInputs.length)];
    
    // SECURITY: Test validation with dangerous input
    const validation = comprehensiveSecurityValidation(
      randomInput,
      'DESCRIPTION',
      { required: true, checkDangerousContent: true },
      'FRONTEND'
    );
    
    console.warn('[SECURITY TEST] Dangerous input validation:', {
      input: randomInput,
      is_valid: validation.is_valid,
      is_safe: validation.is_safe,
      security_level: validation.security_level,
      errors: validation.errors,
      sanitized_value: validation.sanitized_value,
      warning: 'Frontend validation is COSMETIC ONLY - Backend validates independently'
    });
    
    // SECURITY: Log test event
    logSecurityEvent({
      event_type: 'SECURITY_TEST_DANGEROUS_INPUT',
      severity: 'MEDIUM',
      user_id: 'anonymous',
      ip_address: 'client',
      user_agent: navigator.userAgent,
      details: {
        test_input_length: randomInput.length,
        validation_result: validation.is_safe ? 'SAFE' : 'UNSAFE',
        security_level: validation.security_level,
        test_purpose: 'DEMONSTRATION'
      }
    }).catch(error => {
      console.error('[SECURITY ERROR] Failed to log test event:', error);
    });
  }, []);
  
  // SECURITY: Get current rate limit status
  const rateLimitStatus = getRateLimitStatus('FORM_SUBMISSION');
  
  return (
    <div className={styles.securityFirstDashboard}>
      <div className={styles.dashboardHeader}>
        <h1>🔒 Security-First Application Dashboard</h1>
        <p className={styles.securityNotice}>
          ⚠️ CRITICAL: Frontend validation is COSMETIC ONLY - Backend validates ALL data independently
        </p>
      </div>
      
      <div className={styles.dashboardContent}>
        {/* Security Requirements Summary */}
        <div className={styles.securitySummary}>
          <h2>✅ Arabic Security Requirements Implementation</h2>
          <div className={styles.requirementsGrid}>
            <div className={styles.requirementItem}>
              <h3>📝 Input Validation</h3>
              <ul>
                <li>✅ Names: max 100 characters</li>
                <li>✅ Comments: max 500 characters</li>
                <li>✅ Client & Server validation</li>
                <li>✅ SQL Injection prevention</li>
                <li>✅ XSS prevention</li>
              </ul>
            </div>
            
            <div className={styles.requirementItem}>
              <h3>🖼️ Image Upload Security</h3>
              <ul>
                <li>✅ JPG, PNG, WebP formats only</li>
                <li>✅ 2MB preferred, 5MB max</li>
                <li>✅ MIME type validation</li>
                <li>✅ Security scanning</li>
              </ul>
            </div>
            
            <div className={styles.requirementItem}>
              <h3>🧹 Database Cleanup</h3>
              <ul>
                <li>✅ Logs: 30 days retention</li>
                <li>✅ Sessions cleanup</li>
                <li>✅ Failed login cleanup</li>
                <li>✅ Temporary records cleanup</li>
              </ul>
            </div>
            
            <div className={styles.requirementItem}>
              <h3>🛡️ Rate Limiting & Anti-Bot</h3>
              <ul>
                <li>✅ Cloudflare Turnstile</li>
                <li>✅ Google reCAPTCHA</li>
                <li>✅ Brute force protection</li>
                <li>✅ Spam prevention</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Security Demo Form */}
        <div className={styles.demoSection}>
          <h2>🧪 Security Demo Form</h2>
          <p className={styles.demoDescription}>
            This form demonstrates comprehensive security validation. Try entering dangerous content to see security in action.
          </p>
          
          <SecureForm
            onSubmit={handleFormSubmit}
            securityLevel="HIGH"
            enableCSRFProtection={true}
            enableRateLimiting={true}
          >
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label htmlFor="firstName">First Name *</label>
                <SecureInput
                  name="firstName"
                  fieldType="FIRST_NAME"
                  value={formData.firstName}
                  onChange={(value, validation) => handleInputChange('firstName', value, validation)}
                  placeholder="Enter your first name"
                  required={true}
                  showCharacterCounter={true}
                />
              </div>
              
              <div className={styles.formField}>
                <label htmlFor="lastName">Last Name *</label>
                <SecureInput
                  name="lastName"
                  fieldType="LAST_NAME"
                  value={formData.lastName}
                  onChange={(value, validation) => handleInputChange('lastName', value, validation)}
                  placeholder="Enter your last name"
                  required={true}
                  showCharacterCounter={true}
                />
              </div>
              
              <div className={styles.formField}>
                <label htmlFor="email">Email *</label>
                <SecureInput
                  name="email"
                  fieldType="EMAIL"
                  value={formData.email}
                  onChange={(value, validation) => handleInputChange('email', value, validation)}
                  placeholder="Enter your email address"
                  required={true}
                  type="email"
                  showCharacterCounter={true}
                />
              </div>
              
              <div className={styles.formField}>
                <label htmlFor="phone">Phone</label>
                <SecureInput
                  name="phone"
                  fieldType="PHONE"
                  value={formData.phone}
                  onChange={(value, validation) => handleInputChange('phone', value, validation)}
                  placeholder="Enter your phone number"
                  required={false}
                  type="tel"
                  showCharacterCounter={true}
                />
              </div>
            </div>
            
            <div className={styles.formField}>
              <label htmlFor="description">Description * (max 500 characters)</label>
              <SecureTextarea
                name="description"
                fieldType="DESCRIPTION"
                value={formData.description}
                onChange={(value, validation) => handleInputChange('description', value, validation)}
                placeholder="Enter a description (max 500 characters)"
                required={true}
                rows={4}
                showCharacterCounter={true}
              />
            </div>
            
            <div className={styles.formField}>
              <label htmlFor="comment">Comment * (max 500 characters)</label>
              <SecureTextarea
                name="comment"
                fieldType="COMMENT"
                value={formData.comment}
                onChange={(value, validation) => handleInputChange('comment', value, validation)}
                placeholder="Enter your comment (max 500 characters)"
                required={true}
                rows={3}
                showCharacterCounter={true}
              />
            </div>
            
            <div className={styles.formField}>
              <label htmlFor="profileImage">Profile Image</label>
              <SecureImageUpload
                onImageUpload={handleImageUpload}
                maxFileSize={2 * 1024 * 1024} // 2MB
                allowedFormats={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
                currentImage={formData.profileImage}
              />
            </div>
          </SecureForm>
          
          {/* Rate Limiting Status */}
          {rateLimitStatus && (
            <div className={styles.rateLimitStatus}>
              <h4>Rate Limiting Status</h4>
              <p>Form submissions: {rateLimitStatus.remaining}/{rateLimitStatus.total} remaining</p>
              <p>Reset in: {Math.ceil(rateLimitStatus.resetTime / 1000)} seconds</p>
            </div>
          )}
          
          {/* Submit Result */}
          {submitResult && (
            <div className={styles.submitResult}>
              <p>{submitResult}</p>
            </div>
          )}
        </div>
        
        {/* Security Testing Section */}
        <div className={styles.testingSection}>
          <h2>🧪 Security Testing</h2>
          <p>Test the security validation with dangerous input patterns:</p>
          
          <button
            onClick={testDangerousInput}
            className={styles.testButton}
            disabled={isSubmitting}
          >
            Test Dangerous Input Validation
          </button>
          
          <div className={styles.securityInfo}>
            <h4>🔒 Security Features Active:</h4>
            <ul>
              <li>✅ Character limit enforcement (Names: 100, Comments: 500)</li>
              <li>✅ SQL injection pattern detection</li>
              <li>✅ XSS attack pattern detection</li>
              <li>✅ HTML/script injection prevention</li>
              <li>✅ Malformed data rejection</li>
              <li>✅ Real-time validation feedback</li>
              <li>✅ Security event logging</li>
              <li>✅ Rate limiting protection</li>
              <li>✅ CSRF protection</li>
            </ul>
          </div>
        </div>
        
        {/* Admin-Only Security Controls */}
        <AdminGuard>
          <div className={styles.adminSection}>
            <h2>🔐 Admin Security Controls</h2>
            <p>Administrative security features (visible only to ADMIN role)</p>
            
            <div className={styles.adminControls}>
              <button className={styles.adminButton}>
                View Security Audit Logs
              </button>
              <button className={styles.adminButton}>
                Manage Rate Limiting Rules
              </button>
              <button className={styles.adminButton}>
                Configure Anti-Bot Protection
              </button>
              <button className={styles.adminButton}>
                Run Database Cleanup
              </button>
            </div>
          </div>

          {/* Security Event Logging Demo - Admin Only */}
          <div className={styles.eventLoggingSection}>
            <h2>📋 Global Event Logging System</h2>
            <p>Comprehensive event logging with strict taxonomy and backend validation</p>
            <SecurityEventLoggingDemo />
          </div>
        </AdminGuard>
      </div>
      
      {/* Security Footer */}
      <div className={styles.securityFooter}>
        <p>
          <strong>⚠️ SECURITY NOTICE:</strong> This frontend implements comprehensive security validation 
          as specified in the Arabic requirements. All validation is COSMETIC ONLY - the backend 
          validates ALL data independently and has ZERO authority over security decisions.
        </p>
        <p>
          <strong>🔒 Security by Default:</strong> Every feature is validated, rate-limited, and logged safely.
          Never trust user input - always validate server-side.
        </p>
      </div>
    </div>
  );
};

export default SecurityFirstDashboard;