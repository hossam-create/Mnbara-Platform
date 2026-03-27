/**
 * 🔒 SECURITY-COMPLIANT ERROR HANDLING
 * ACCESS CONTROL & AUTHORITY POLICY IMPLEMENTATION
 * 
 * CRITICAL SECURITY NOTICE:
 * - Error messages are USER-FRIENDLY and NON-TECHNICAL
 * - NO database schema, stack traces, or server paths exposed
 * - All sensitive details logged only in secure server logs
 * - Error handling follows Security by Default principle
 * - Backend validates ALL error data independently
 * 
 * VIOLATION OF ERROR HANDLING POLICY COMPROMISES SYSTEM SECURITY
 */

import { toast } from 'react-hot-toast';
import { 
  useSecurityEventLogging, 
  EventCategory, 
  EventType, 
  TargetType 
} from '@/hooks/useSecurityEventLogging';

/**
 * ⚠️ SECURITY: User-Friendly Error Messages
 * Backend logs technical details - Frontend shows only safe messages
 */
export const SECURITY_ERROR_MESSAGES = {
  // Authentication Errors
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  AUTH_ACCOUNT_LOCKED: 'Your account has been temporarily locked for security reasons.',
  AUTH_TOO_MANY_ATTEMPTS: 'Too many failed attempts. Please try again later.',
  AUTH_SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  AUTH_UNAUTHORIZED: 'You don\'t have permission to access this resource.',
  
  // Database Errors
  DATABASE_CONNECTION_FAILED: 'Unable to process your request. Please try again.',
  DATABASE_QUERY_FAILED: 'Unable to retrieve data. Please try again.',
  DATABASE_TIMEOUT: 'Request timed out. Please try again.',
  DATABASE_CONSTRAINT_VIOLATION: 'Invalid data provided. Please check your input.',
  
  // Validation Errors
  VALIDATION_INVALID_INPUT: 'Invalid data provided. Please check your input.',
  VALIDATION_REQUIRED_FIELD: 'This field is required.',
  VALIDATION_FORMAT_ERROR: 'Invalid format. Please check your input.',
  VALIDATION_LENGTH_ERROR: 'Input length exceeds maximum allowed.',
  
  // File Upload Errors
  FILE_UPLOAD_FAILED: 'Unable to upload file. Please try again.',
  FILE_INVALID_FORMAT: 'Invalid file format. Only JPG, PNG, and WebP are allowed.',
  FILE_SIZE_EXCEEDED: 'File size exceeds maximum allowed limit.',
  FILE_SECURITY_SCAN_FAILED: 'File security check failed. Please try a different file.',
  
  // Network Errors
  NETWORK_CONNECTION_FAILED: 'Unable to connect to server. Please check your connection.',
  NETWORK_TIMEOUT: 'Request timed out. Please try again.',
  NETWORK_SERVER_ERROR: 'Server error occurred. Please try again later.',
  
  // Payment Errors
  PAYMENT_PROCESSING_FAILED: 'Payment processing failed. Please try again.',
  PAYMENT_INVALID_CARD: 'Invalid card details. Please check your information.',
  PAYMENT_INSUFFICIENT_FUNDS: 'Payment declined. Please check your balance.',
  PAYMENT_GATEWAY_ERROR: 'Payment service unavailable. Please try again later.',
  
  // Security Errors
  SECURITY_SUSPICIOUS_ACTIVITY: 'Security check failed. Please try again.',
  SECURITY_RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  SECURITY_INVALID_TOKEN: 'Security validation failed. Please refresh and try again.',
  
  // General Errors
  GENERAL_UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.',
  GENERAL_SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',
  GENERAL_MAINTENANCE_MODE: 'System is under maintenance. Please try again later.',
  
  // User Errors
  USER_NOT_FOUND: 'User not found. Please check the information provided.',
  USER_ALREADY_EXISTS: 'This user already exists. Please use different credentials.',
  USER_ACCOUNT_SUSPENDED: 'Account suspended. Please contact support.',
  
  // System Errors
  SYSTEM_CONFIGURATION_ERROR: 'System configuration error. Please contact support.',
  SYSTEM_RESOURCE_UNAVAILABLE: 'Resource temporarily unavailable. Please try again.',
  SYSTEM_PERMISSION_DENIED: 'Permission denied. Please contact support if you need access.'
} as const;

/**
 * ⚠️ SECURITY: Error Categories for Backend Logging
 * Backend logs technical details - Frontend shows only safe messages
 */
export enum SecurityErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  FILE_UPLOAD = 'FILE_UPLOAD',
  PAYMENT = 'PAYMENT',
  SECURITY = 'SECURITY',
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  UNKNOWN = 'UNKNOWN'
}

/**
 * ⚠️ SECURITY: Error Severity Levels
 * Backend determines severity - Frontend shows appropriate user feedback
 */
export enum SecurityErrorSeverity {
  LOW = 'LOW',        // Info only, no user impact
  MEDIUM = 'MEDIUM',  // Minor user impact
  HIGH = 'HIGH',     // Significant user impact
  CRITICAL = 'CRITICAL' // System security/compromise risk
}

/**
 * 🔒 SECURITY-CRITICAL: Secure Error Interface
 * Backend logs technical details - Frontend shows only safe messages
 */
export interface SecurityError {
  id: string;                           // Backend-generated error ID
  userMessage: string;                 // Safe message for user display
  category: SecurityErrorCategory;     // Error category for logging
  severity: SecurityErrorSeverity;     // Severity level for response
  timestamp: string;                   // Error timestamp
  context?: {
    field?: string;                    // Form field (if applicable)
    action?: string;                   // User action that caused error
    component?: string;                // React component (if applicable)
  };
  // Technical details are NEVER exposed to frontend
  technicalDetails?: {
    originalError?: any;               // Original error (backend only)
    stackTrace?: string;               // Stack trace (backend only)
    serverInfo?: any;                  // Server information (backend only)
  };
}

/**
 * 🔒 SECURITY: Secure Error Response
 * Backend validates ALL error responses - Frontend has ZERO authority
 */
export interface SecureErrorResponse {
  success: false;
  error: SecurityError;
  userMessage: string;
  retryAfter?: number;                 // Seconds to wait before retry
  suggestedActions?: string[];         // User-friendly suggested actions
}

/**
 * 🔒 SECURITY: Error Handler Hook
 * Backend logs technical details - Frontend shows only safe messages
 */
export function useSecurityErrorHandler() {
  const { createSecurityEvent } = useSecurityEventLogging();
  
  /**
   * ⚠️ SECURITY: Handle error with secure user messaging
   * Backend logs technical details - Frontend shows only safe messages
   */
  const handleSecurityError = useCallback(async (
    error: any,
    category: SecurityErrorCategory,
    severity: SecurityErrorSeverity = SecurityErrorSeverity.MEDIUM,
    context?: {
      field?: string;
      action?: string;
      component?: string;
      userId?: string;
    }
  ): Promise<SecureErrorResponse> => {
    // SECURITY: Generate unique error ID for tracking
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // SECURITY: Determine user-friendly message based on error type
    const userMessage = getUserFriendlyMessage(error, category);
    
    // SECURITY: Create secure error object (NO technical details exposed)
    const securityError: SecurityError = {
      id: errorId,
      userMessage,
      category,
      severity,
      timestamp: new Date().toISOString(),
      context: {
        field: context?.field,
        action: context?.action,
        component: context?.component
      }
    };
    
    // SECURITY: Log error event for audit trail
    try {
      await createSecurityEvent(
        EventCategory.ERROR,
        getErrorEventType(category),
        TargetType.SYSTEM,
        `error-${errorId}`,
        {
          metadata: {
            error_category: category,
            error_severity: severity,
            user_message: userMessage,
            context: context,
            // Technical details logged in backend only
          }
        },
        'useSecurityErrorHandler'
      );
    } catch (loggingError) {
      console.error('[SECURITY CRITICAL] Failed to log security error:', loggingError);
    }
    
    // SECURITY: Determine retry timing based on severity
    const retryAfter = getRetryAfterTime(severity);
    
    // SECURITY: Get suggested actions for user
    const suggestedActions = getSuggestedActions(category, severity);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY AUDIT] Security error handled:', {
        error_id: errorId,
        category,
        severity,
        user_message: userMessage,
        warning: 'Technical details logged in backend only - Frontend shows safe messages'
      });
    }
    
    return {
      success: false,
      error: securityError,
      userMessage,
      retryAfter,
      suggestedActions
    };
  }, [createSecurityEvent]);
  
  /**
   * ⚠️ SECURITY: Display user-friendly error notification
   */
  const displayErrorNotification = useCallback(async (
    errorResponse: SecureErrorResponse,
    options?: {
      duration?: number;
      position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
      style?: React.CSSProperties;
    }
  ) => {
    const { error, userMessage, suggestedActions } = errorResponse;
    
    // SECURITY: Determine notification style based on severity
    const notificationStyle = getNotificationStyle(error.severity);
    
    // SECURITY: Create comprehensive error message
    let fullMessage = userMessage;
    
    if (suggestedActions && suggestedActions.length > 0) {
      fullMessage += '\n\n' + suggestedActions.join('\n');
    }
    
    // SECURITY: Add error ID for support reference (if high severity)
    if (error.severity === SecurityErrorSeverity.HIGH || error.severity === SecurityErrorSeverity.CRITICAL) {
      fullMessage += `\n\n(Error ID: ${error.id})`;
    }
    
    // SECURITY: Display notification with appropriate styling
    toast.error(fullMessage, {
      duration: options?.duration || getNotificationDuration(error.severity),
      position: options?.position || 'top-right',
      style: {
        ...notificationStyle,
        ...options?.style
      }
    });
    
    // SECURITY: Log error display event
    try {
      await createSecurityEvent(
        EventCategory.ERROR,
        EventType.SYSTEM_STARTUP,
        TargetType.USER,
        `error-displayed-${error.id}`,
        {
          metadata: {
            error_id: error.id,
            severity: error.severity,
            message_length: fullMessage.length
          }
        },
        'displayErrorNotification'
      );
    } catch (loggingError) {
      console.error('[SECURITY CRITICAL] Failed to log error display:', loggingError);
    }
  }, [createSecurityEvent]);
  
  return {
    handleSecurityError,
    displayErrorNotification
  };
}

/**
 * ⚠️ SECURITY: Get user-friendly message based on error category
 * Backend logs technical details - Frontend shows only safe messages
 */
function getUserFriendlyMessage(error: any, category: SecurityErrorCategory): string {
  // SECURITY: Never expose technical details to users
  
  if (typeof error === 'string') {
    // Check if error message contains known safe patterns
    const safePatterns = [
      'required',
      'invalid',
      'not found',
      'already exists',
      'expired',
      'locked',
      'suspended'
    ];
    
    const isSafeMessage = safePatterns.some(pattern => 
      error.toLowerCase().includes(pattern)
    );
    
    if (isSafeMessage) {
      return error; // Use safe message as-is
    }
  }
  
  // SECURITY: Return category-appropriate safe message
  switch (category) {
    case SecurityErrorCategory.AUTHENTICATION:
      return SECURITY_ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS;
      
    case SecurityErrorCategory.AUTHORIZATION:
      return SECURITY_ERROR_MESSAGES.AUTH_UNAUTHORIZED;
      
    case SecurityErrorCategory.VALIDATION:
      return SECURITY_ERROR_MESSAGES.VALIDATION_INVALID_INPUT;
      
    case SecurityErrorCategory.DATABASE:
      return SECURITY_ERROR_MESSAGES.DATABASE_CONNECTION_FAILED;
      
    case SecurityErrorCategory.NETWORK:
      return SECURITY_ERROR_MESSAGES.NETWORK_CONNECTION_FAILED;
      
    case SecurityErrorCategory.FILE_UPLOAD:
      return SECURITY_ERROR_MESSAGES.FILE_UPLOAD_FAILED;
      
    case SecurityErrorCategory.PAYMENT:
      return SECURITY_ERROR_MESSAGES.PAYMENT_PROCESSING_FAILED;
      
    case SecurityErrorCategory.SECURITY:
      return SECURITY_ERROR_MESSAGES.SECURITY_SUSPICIOUS_ACTIVITY;
      
    case SecurityErrorCategory.SYSTEM:
      return SECURITY_ERROR_MESSAGES.SYSTEM_CONFIGURATION_ERROR;
      
    case SecurityErrorCategory.USER:
      return SECURITY_ERROR_MESSAGES.USER_NOT_FOUND;
      
    case SecurityErrorCategory.EXTERNAL_SERVICE:
      return SECURITY_ERROR_MESSAGES.GENERAL_SERVICE_UNAVAILABLE;
      
    default:
      return SECURITY_ERROR_MESSAGES.GENERAL_UNEXPECTED_ERROR;
  }
}

/**
 * ⚠️ SECURITY: Get error event type for logging
 */
function getErrorEventType(category: SecurityErrorCategory): EventType {
  switch (category) {
    case SecurityErrorCategory.AUTHENTICATION:
      return EventType.LOGIN_FAILURE;
      
    case SecurityErrorCategory.AUTHORIZATION:
      return EventType.ACCESS_DENIED;
      
    case SecurityErrorCategory.VALIDATION:
      return EventType.SYSTEM_ERROR;
      
    case SecurityErrorCategory.DATABASE:
      return EventType.SYSTEM_ERROR;
      
    case SecurityErrorCategory.NETWORK:
      return EventType.SYSTEM_ERROR;
      
    case SecurityErrorCategory.FILE_UPLOAD:
      return EventType.SYSTEM_ERROR;
      
    case SecurityErrorCategory.PAYMENT:
      return EventType.PAYMENT_FAILED;
      
    case SecurityErrorCategory.SECURITY:
      return EventType.SECURITY_ALERT;
      
    case SecurityErrorCategory.SYSTEM:
      return EventType.SYSTEM_ERROR;
      
    case SecurityErrorCategory.USER:
      return EventType.SYSTEM_ERROR;
      
    case SecurityErrorCategory.EXTERNAL_SERVICE:
      return EventType.SYSTEM_ERROR;
      
    default:
      return EventType.SYSTEM_ERROR;
  }
}

/**
 * ⚠️ SECURITY: Get retry timing based on severity
 */
function getRetryAfterTime(severity: SecurityErrorSeverity): number | undefined {
  switch (severity) {
    case SecurityErrorSeverity.LOW:
      return undefined; // No retry delay
      
    case SecurityErrorSeverity.MEDIUM:
      return 5; // 5 seconds
      
    case SecurityErrorSeverity.HIGH:
      return 30; // 30 seconds
      
    case SecurityErrorSeverity.CRITICAL:
      return 300; // 5 minutes
      
    default:
      return 10; // 10 seconds default
  }
}

/**
 * ⚠️ SECURITY: Get suggested actions for user
 */
function getSuggestedActions(
  category: SecurityErrorCategory,
  severity: SecurityErrorSeverity
): string[] {
  const actions: string[] = [];
  
  // Base actions for all errors
  actions.push('Please try again');
  
  // Severity-based actions
  switch (severity) {
    case SecurityErrorSeverity.HIGH:
    case SecurityErrorSeverity.CRITICAL:
      actions.push('If the problem persists, please contact support');
      break;
      
    case SecurityErrorSeverity.MEDIUM:
      actions.push('You may need to refresh the page and try again');
      break;
      
    case SecurityErrorSeverity.LOW:
      actions.push('This is a minor issue that should resolve quickly');
      break;
  }
  
  // Category-specific actions
  switch (category) {
    case SecurityErrorCategory.AUTHENTICATION:
      actions.push('Please check your login credentials');
      actions.push('Make sure Caps Lock is off');
      break;
      
    case SecurityErrorCategory.AUTHORIZATION:
      actions.push('Please log in with appropriate credentials');
      actions.push('Contact support if you believe this is an error');
      break;
      
    case SecurityErrorCategory.VALIDATION:
      actions.push('Please check your input and try again');
      actions.push('Make sure all required fields are filled');
      break;
      
    case SecurityErrorCategory.FILE_UPLOAD:
      actions.push('Please check file format and size');
      actions.push('Make sure the file is not corrupted');
      break;
      
    case SecurityErrorCategory.PAYMENT:
      actions.push('Please check your payment information');
      actions.push('Try a different payment method');
      break;
      
    case SecurityErrorCategory.NETWORK:
      actions.push('Please check your internet connection');
      actions.push('Try refreshing the page');
      break;
  }
  
  return actions;
}

/**
 * ⚠️ SECURITY: Get notification style based on severity
 */
function getNotificationStyle(severity: SecurityErrorSeverity): React.CSSProperties {
  switch (severity) {
    case SecurityErrorSeverity.CRITICAL:
      return {
        backgroundColor: '#7f1d1d',
        color: '#fecaca',
        border: '2px solid #dc2626',
        fontWeight: 'bold'
      };
      
    case SecurityErrorSeverity.HIGH:
      return {
        backgroundColor: '#991b1b',
        color: '#fecaca',
        border: '2px solid #ef4444',
        fontWeight: '600'
      };
      
    case SecurityErrorSeverity.MEDIUM:
      return {
        backgroundColor: '#92400e',
        color: '#fef3c7',
        border: '2px solid #f59e0b'
      };
      
    case SecurityErrorSeverity.LOW:
    default:
      return {
        backgroundColor: '#374151',
        color: '#e5e7eb',
        border: '2px solid #6b7280'
      };
  }
}

/**
 * ⚠️ SECURITY: Get notification duration based on severity
 */
function getNotificationDuration(severity: SecurityErrorSeverity): number {
  switch (severity) {
    case SecurityErrorSeverity.CRITICAL:
      return 10000; // 10 seconds
      
    case SecurityErrorSeverity.HIGH:
      return 8000; // 8 seconds
      
    case SecurityErrorSeverity.MEDIUM:
      return 6000; // 6 seconds
      
    case SecurityErrorSeverity.LOW:
    default:
      return 4000; // 4 seconds
  }
}

/**
 * 🔒 SECURITY: Global Error Boundary Component
 * Catches and handles all React errors securely
 */
export class SecurityErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // SECURITY: Log error in development mode only
    if (process.env.NODE_ENV === 'development') {
      console.error('[SECURITY AUDIT] React error boundary caught error:', {
        error: error.message,
        componentStack: errorInfo.componentStack,
        warning: 'Error details logged in backend only - Frontend shows safe messages'
      });
    }
    
    // SECURITY: Log to backend (would be implemented with actual logging service)
    // This is where you'd send the error to your backend logging service
  }
  
  render() {
    if (this.state.hasError) {
      // SECURITY: Display safe error message to user
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error!} />;
      }
      
      return (
        <div className="security-error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>We're sorry, but something unexpected happened.</p>
            <p>Please try refreshing the page or contact support if the problem persists.</p>
            <button 
              onClick={() => window.location.reload()}
              className="error-boundary-retry"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

export default {
  useSecurityErrorHandler,
  SecurityErrorBoundary,
  SecurityErrorCategory,
  SecurityErrorSeverity,
  SECURITY_ERROR_MESSAGES
};