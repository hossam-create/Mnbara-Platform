/**
 * Event Logging Validation Utilities
 * SECURITY: Strict validation of event taxonomy and data integrity
 */

import {
  SecurityEvent,
  CreateSecurityEventRequest,
  EventCategory,
  EventType,
  ActorType,
  TargetType,
  EventSeverity,
  EventStatus,
  EventValidationRule
} from '../types/eventLogging.types';

// Event Taxonomy Validation Rules
export const EVENT_TAXONOMY_RULES: Record<EventCategory, {
  allowed_types: EventType[];
  required_actor_types: ActorType[];
  required_target_types: TargetType[];
  max_metadata_size: number;
  required_metadata_fields: string[];
}> = {
  [EventCategory.AUTHENTICATION]: {
    allowed_types: [
      EventType.LOGIN_ATTEMPT,
      EventType.LOGIN_SUCCESS,
      EventType.LOGIN_FAILURE,
      EventType.LOGOUT,
      EventType.TOKEN_REFRESH,
      EventType.PASSWORD_RESET_REQUEST,
      EventType.PASSWORD_RESET_SUCCESS,
      EventType.MFA_ENABLED,
      EventType.MFA_DISABLED
    ],
    required_actor_types: [ActorType.USER, ActorType.ADMIN, ActorType.OPS],
    required_target_types: [TargetType.USER],
    max_metadata_size: 1024, // 1KB
    required_metadata_fields: ['ip_address', 'user_agent']
  },
  
  [EventCategory.AUTHORIZATION]: {
    allowed_types: [
      EventType.PERMISSION_CHECK,
      EventType.PERMISSION_DENIED,
      EventType.ROLE_ASSIGNED,
      EventType.ROLE_REMOVED
    ],
    required_actor_types: [ActorType.USER, ActorType.ADMIN, ActorType.OPS],
    required_target_types: [TargetType.USER],
    max_metadata_size: 2048, // 2KB
    required_metadata_fields: ['permission', 'resource']
  },
  
  [EventCategory.PAYMENT]: {
    allowed_types: [
      EventType.PAYMENT_INTENT_CREATED,
      EventType.PAYMENT_INTENT_CONFIRMED,
      EventType.PAYMENT_INTENT_FAILED,
      EventType.PAYMENT_INTENT_CANCELLED,
      EventType.PAYMENT_STATUS_CHECK,
      EventType.PAYMENT_REFUND_REQUESTED,
      EventType.PAYMENT_REFUND_PROCESSED
    ],
    required_actor_types: [ActorType.USER, ActorType.ADMIN, ActorType.OPS],
    required_target_types: [TargetType.PAYMENT, TargetType.WALLET],
    max_metadata_size: 4096, // 4KB
    required_metadata_fields: ['amount', 'currency', 'payment_method']
  },
  
  [EventCategory.AUCTION]: {
    allowed_types: [
      EventType.AUCTION_CREATED,
      EventType.AUCTION_UPDATED,
      EventType.AUCTION_CANCELLED,
      EventType.AUCTION_COMPLETED,
      EventType.BID_PLACED,
      EventType.BID_CANCELLED,
      EventType.BID_ACCEPTED,
      EventType.BID_REJECTED
    ],
    required_actor_types: [ActorType.USER, ActorType.ADMIN, ActorType.OPS],
    required_target_types: [TargetType.AUCTION],
    max_metadata_size: 2048, // 2KB
    required_metadata_fields: ['auction_id']
  },
  
  [EventCategory.WALLET]: {
    allowed_types: [
      EventType.WALLET_CREATED,
      EventType.WALLET_BALANCE_CHECK,
      EventType.WALLET_DEPOSIT,
      EventType.WALLET_WITHDRAWAL,
      EventType.WALLET_FROZEN,
      EventType.WALLET_UNFROZEN
    ],
    required_actor_types: [ActorType.USER, ActorType.ADMIN, ActorType.OPS],
    required_target_types: [TargetType.WALLET],
    max_metadata_size: 2048, // 2KB
    required_metadata_fields: ['wallet_id']
  },
  
  [EventCategory.ESCROW]: {
    allowed_types: [
      EventType.ESCROW_CREATED,
      EventType.ESCROW_FUNDED,
      EventType.ESCROW_RELEASED,
      EventType.ESCROW_CANCELLED,
      EventType.ESCROW_DISPUTED
    ],
    required_actor_types: [ActorType.USER, ActorType.ADMIN, ActorType.OPS],
    required_target_types: [TargetType.ESCROW],
    max_metadata_size: 2048, // 2KB
    required_metadata_fields: ['escrow_id']
  },
  
  [EventCategory.DISPUTE]: {
    allowed_types: [
      EventType.DISPUTE_CREATED,
      EventType.DISPUTE_UPDATED,
      EventType.DISPUTE_RESOLVED,
      EventType.DISPUTE_ESCALATED,
      EventType.EVIDENCE_SUBMITTED
    ],
    required_actor_types: [ActorType.USER, ActorType.ADMIN, ActorType.OPS],
    required_target_types: [TargetType.DISPUTE],
    max_metadata_size: 4096, // 4KB
    required_metadata_fields: ['dispute_id']
  },
  
  [EventCategory.PAYOUT]: {
    allowed_types: [
      EventType.PAYOUT_REQUESTED,
      EventType.PAYOUT_PROCESSED,
      EventType.PAYOUT_FAILED,
      EventType.PAYOUT_CANCELLED
    ],
    required_actor_types: [ActorType.USER, ActorType.ADMIN, ActorType.OPS],
    required_target_types: [TargetType.PAYOUT],
    max_metadata_size: 2048, // 2KB
    required_metadata_fields: ['payout_id', 'amount']
  },
  
  [EventCategory.USER_MANAGEMENT]: {
    allowed_types: [
      EventType.USER_REGISTERED,
      EventType.USER_PROFILE_UPDATED,
      EventType.USER_VERIFIED,
      EventType.USER_SUSPENDED,
      EventType.USER_UNSUSPENDED,
      EventType.USER_DELETED
    ],
    required_actor_types: [ActorType.USER, ActorType.ADMIN, ActorType.OPS],
    required_target_types: [TargetType.USER],
    max_metadata_size: 1024, // 1KB
    required_metadata_fields: ['user_id']
  },
  
  [EventCategory.SYSTEM]: {
    allowed_types: [
      EventType.SYSTEM_STARTUP,
      EventType.SYSTEM_SHUTDOWN,
      EventType.SYSTEM_MAINTENANCE,
      EventType.BACKUP_CREATED,
      EventType.BACKUP_RESTORED
    ],
    required_actor_types: [ActorType.SYSTEM, ActorType.ADMIN],
    required_target_types: [TargetType.SYSTEM],
    max_metadata_size: 1024, // 1KB
    required_metadata_fields: ['system_component']
  },
  
  [EventCategory.SECURITY]: {
    allowed_types: [
      EventType.SECURITY_ALERT,
      EventType.SUSPICIOUS_ACTIVITY,
      EventType.RATE_LIMIT_EXCEEDED,
      EventType.INVALID_ACCESS_ATTEMPT,
      EventType.DATA_BREACH_ATTEMPT
    ],
    required_actor_types: [ActorType.USER, ActorType.ADMIN, ActorType.OPS, ActorType.SYSTEM],
    required_target_types: [TargetType.USER, TargetType.SYSTEM, TargetType.API],
    max_metadata_size: 4096, // 4KB
    required_metadata_fields: ['threat_level', 'description']
  },
  
  [EventCategory.API]: {
    allowed_types: [
      EventType.API_REQUEST,
      EventType.API_RESPONSE,
      EventType.API_ERROR,
      EventType.API_TIMEOUT
    ],
    required_actor_types: [ActorType.USER, ActorType.ADMIN, ActorType.OPS, ActorType.SYSTEM],
    required_target_types: [TargetType.API],
    max_metadata_size: 2048, // 2KB
    required_metadata_fields: ['endpoint', 'method']
  }
};

// Event Validation Result
export interface EventValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitized_metadata?: Record<string, any>;
}

// Event Taxonomy Validator
export class EventTaxonomyValidator {
  static validateEvent(event: CreateSecurityEventRequest): EventValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate category exists
    const categoryRule = EVENT_TAXONOMY_RULES[event.event_category];
    if (!categoryRule) {
      errors.push(`Invalid event category: ${event.event_category}`);
      return { valid: false, errors, warnings };
    }
    
    // Validate event type for category
    if (!categoryRule.allowed_types.includes(event.event_type)) {
      errors.push(`Event type ${event.event_type} not allowed for category ${event.event_category}`);
    }
    
    // Validate actor type
    if (!categoryRule.required_actor_types.includes(event.actor_type)) {
      errors.push(`Actor type ${event.actor_type} not allowed for category ${event.event_category}`);
    }
    
    // Validate target type
    if (!categoryRule.required_target_types.includes(event.target_type)) {
      errors.push(`Target type ${event.target_type} not allowed for category ${event.event_category}`);
    }
    
    // Validate metadata
    let sanitizedMetadata = event.metadata;
    if (event.metadata) {
      // Check metadata size
      const metadataSize = JSON.stringify(event.metadata).length;
      if (metadataSize > categoryRule.max_metadata_size) {
        errors.push(`Metadata size ${metadataSize} exceeds maximum ${categoryRule.max_metadata_size}`);
      }
      
      // Validate required metadata fields
      for (const field of categoryRule.required_metadata_fields) {
        if (!(field in event.metadata)) {
          errors.push(`Required metadata field missing: ${field}`);
        }
      }
      
      // Sanitize metadata
      sanitizedMetadata = this.sanitizeMetadata(event.metadata);
      
      // Check for suspicious patterns in metadata
      const suspiciousPatterns = this.detectSuspiciousPatterns(event.metadata);
      if (suspiciousPatterns.length > 0) {
        warnings.push(`Suspicious patterns detected in metadata: ${suspiciousPatterns.join(', ')}`);
      }
    } else if (categoryRule.required_metadata_fields.length > 0) {
      errors.push(`Metadata is required for category ${event.event_category}`);
    }
    
    // Validate severity and status consistency
    const consistencyIssues = this.validateSeverityStatusConsistency(event);
    if (consistencyIssues.length > 0) {
      warnings.push(...consistencyIssues);
    }
    
    // Validate security level consistency
    const securityLevelIssues = this.validateSecurityLevelConsistency(event);
    if (securityLevelIssues.length > 0) {
      warnings.push(...securityLevelIssues);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      sanitized_metadata: sanitizedMetadata
    };
  }
  
  private static sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      // Remove potentially dangerous characters from keys
      const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '');
      
      // Sanitize values based on type
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value);
      } else if (typeof value === 'number') {
        sanitized[sanitizedKey] = value;
      } else if (typeof value === 'boolean') {
        sanitized[sanitizedKey] = value;
      } else if (Array.isArray(value)) {
        sanitized[sanitizedKey] = value.map(item => 
          typeof item === 'string' ? this.sanitizeString(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[sanitizedKey] = this.sanitizeMetadata(value);
      } else {
        sanitized[sanitizedKey] = null;
      }
    }
    
    return sanitized;
  }
  
  private static sanitizeString(value: string): string {
    // Remove potential XSS patterns
    return value
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/onload=/gi, '')
      .replace(/onerror=/gi, '')
      .replace(/onclick=/gi, '')
      .trim()
      .substring(0, 1000); // Limit string length
  }
  
  private static detectSuspiciousPatterns(metadata: Record<string, any>): string[] {
    const suspicious: string[] = [];
    const metadataString = JSON.stringify(metadata).toLowerCase();
    
    // SQL Injection patterns
    const sqlPatterns = [
      /\b(union|select|insert|update|delete|drop|create|alter|exec)\b/i,
      /--/,
      /\/\*/,
      /\*\//,
      /xp_/i,
      /sp_/i
    ];
    
    // XSS patterns
    const xssPatterns = [
      /<script/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<form/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i
    ];
    
    // Check for SQL injection patterns
    sqlPatterns.forEach((pattern, index) => {
      if (pattern.test(metadataString)) {
        suspicious.push(`SQL injection pattern ${index + 1}`);
      }
    });
    
    // Check for XSS patterns
    xssPatterns.forEach((pattern, index) => {
      if (pattern.test(metadataString)) {
        suspicious.push(`XSS pattern ${index + 1}`);
      }
    });
    
    // Check for excessive length
    if (metadataString.length > 10000) {
      suspicious.push('Excessive metadata length');
    }
    
    return suspicious;
  }
  
  private static validateSeverityStatusConsistency(event: CreateSecurityEventRequest): string[] {
    const warnings: string[] = [];
    
    // Check for inconsistent severity/status combinations
    if (event.status === EventStatus.FAILED && event.severity === EventSeverity.LOW) {
      warnings.push('Failed events should typically have MEDIUM or higher severity');
    }
    
    if (event.status === EventStatus.SUCCESS && event.severity === EventSeverity.CRITICAL) {
      warnings.push('Critical severity for successful events is unusual');
    }
    
    return warnings;
  }
  
  private static validateSecurityLevelConsistency(event: CreateSecurityEventRequest): string[] {
    const warnings: string[] = [];
    
    // Map severity to expected security level ranges
    const expectedSecurityLevel = {
      [EventSeverity.LOW]: ['LOW'],
      [EventSeverity.MEDIUM]: ['LOW', 'MEDIUM'],
      [EventSeverity.HIGH]: ['MEDIUM', 'HIGH'],
      [EventSeverity.CRITICAL]: ['HIGH', 'CRITICAL']
    };
    
    const allowedLevels = expectedSecurityLevel[event.severity];
    if (!allowedLevels.includes(event.security_level)) {
      warnings.push(`Security level ${event.security_level} is inconsistent with severity ${event.severity}`);
    }
    
    return warnings;
  }
}

// Event Data Validator
export class EventDataValidator {
  static validateEventData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data || typeof data !== 'object') {
      errors.push('Event data must be an object');
      return { valid: false, errors };
    }
    
    // Required fields validation
    const requiredFields = [
      'event_category',
      'event_type',
      'actor_type',
      'target_type',
      'severity',
      'status',
      'security_level',
      'frontend_timestamp',
      'frontend_session_id'
    ];
    
    for (const field of requiredFields) {
      if (!(field in data)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    // Type validation
    if (data.actor_id !== null && data.actor_id !== undefined && typeof data.actor_id !== 'string') {
      errors.push('actor_id must be string or null');
    }
    
    if (data.target_id !== undefined && typeof data.target_id !== 'string') {
      errors.push('target_id must be string or undefined');
    }
    
    if (data.metadata !== undefined && typeof data.metadata !== 'object') {
      errors.push('metadata must be object or undefined');
    }
    
    // Frontend timestamp validation
    if (typeof data.frontend_timestamp !== 'number' || data.frontend_timestamp <= 0) {
      errors.push('frontend_timestamp must be a positive number');
    }
    
    // Session ID validation
    if (typeof data.frontend_session_id !== 'string' || data.frontend_session_id.length < 10) {
      errors.push('frontend_session_id must be a string with minimum length of 10');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Event Security Analyzer
export class EventSecurityAnalyzer {
  static analyzeEventRisk(event: CreateSecurityEventRequest): {
    risk_score: number;
    risk_factors: string[];
    recommended_actions: string[];
  } {
    let riskScore = 0;
    const riskFactors: string[] = [];
    const recommendedActions: string[] = [];
    
    // Severity-based risk
    switch (event.severity) {
      case EventSeverity.CRITICAL:
        riskScore += 40;
        riskFactors.push('Critical severity event');
        break;
      case EventSeverity.HIGH:
        riskScore += 25;
        riskFactors.push('High severity event');
        break;
      case EventSeverity.MEDIUM:
        riskScore += 10;
        break;
      case EventSeverity.LOW:
        riskScore += 5;
        break;
    }
    
    // Security level-based risk
    switch (event.security_level) {
      case 'CRITICAL':
        riskScore += 30;
        riskFactors.push('Critical security level');
        break;
      case 'HIGH':
        riskScore += 20;
        riskFactors.push('High security level');
        break;
      case 'MEDIUM':
        riskScore += 10;
        break;
      case 'LOW':
        riskScore += 5;
        break;
    }
    
    // Category-based risk
    switch (event.event_category) {
      case EventCategory.SECURITY:
        riskScore += 25;
        riskFactors.push('Security category event');
        recommendedActions.push('Review security policies and access controls');
        break;
      case EventCategory.PAYMENT:
        riskScore += 20;
        riskFactors.push('Payment-related event');
        recommendedActions.push('Verify payment integrity and audit trail');
        break;
      case EventCategory.AUTHORIZATION:
        riskScore += 15;
        riskFactors.push('Authorization event');
        recommendedActions.push('Review permission assignments');
        break;
    }
    
    // Status-based risk
    if (event.status === EventStatus.FAILED) {
      riskScore += 10;
      riskFactors.push('Failed event status');
    }
    
    // Actor-based risk
    if (event.actor_type === ActorType.SYSTEM) {
      riskScore += 5;
      riskFactors.push('System actor');
    }
    
    // Metadata-based risk analysis
    if (event.metadata) {
      const metadataString = JSON.stringify(event.metadata).toLowerCase();
      
      // Check for sensitive data exposure
      const sensitivePatterns = [
        /password/i,
        /secret/i,
        /key/i,
        /token/i,
        /credit.*card/i,
        /ssn/i,
        /social.*security/i
      ];
      
      sensitivePatterns.forEach(pattern => {
        if (pattern.test(metadataString)) {
          riskScore += 15;
          riskFactors.push('Potential sensitive data in metadata');
          recommendedActions.push('Review metadata for sensitive information');
        }
      });
    }
    
    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);
    
    return {
      risk_score: riskScore,
      risk_factors: riskFactors,
      recommended_actions: recommendedActions
    };
  }
}