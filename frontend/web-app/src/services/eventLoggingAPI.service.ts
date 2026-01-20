/**
 * 🔒 SECURITY-COMPLIANT EVENT LOGGING API INTEGRATION
 * ACCESS CONTROL & AUTHORITY POLICY IMPLEMENTATION
 * 
 * CRITICAL SECURITY NOTICE:
 * - ALL event logging is SECURITY-CRITICAL for audit compliance
 * - Backend validates and stores ALL events - Frontend has ZERO authority
 * - Event data integrity is maintained through backend hash signatures
 * - Unauthorized event access is SECURITY VIOLATION - Backend detects and logs
 * - Financial events require additional backend validation and approval
 * 
 * VIOLATION OF EVENT LOGGING POLICY COMPROMISES SYSTEM SECURITY
 */

import { 
  SecurityEvent, 
  EventCreationRequest, 
  EventQueryFilters, 
  EventStatistics,
  EventExportRequest,
  EventExportResult,
  EventCategory,
  EventType,
  ActorType,
  TargetType
} from '@/types/eventLogging.types'
import { getAuthHeaders, getCurrentUserRole } from './api/securityCompliantClient'
import { store } from '@/store'
import { RootState } from '@/store'

/**
 * ⚠️ SECURITY: Event Logging API Service
 * Backend validates ALL event operations - Frontend has ZERO authority
 */
export class EventLoggingAPIService {
  private static instance: EventLoggingAPIService;
  private readonly API_BASE_URL = '/api/v1/events';
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  private constructor() {}

  /**
   * ⚠️ SECURITY: Singleton pattern ensures centralized API access
   * Backend validates ALL API operations
   */
  public static getInstance(): EventLoggingAPIService {
    if (!EventLoggingAPIService.instance) {
      EventLoggingAPIService.instance = new EventLoggingAPIService();
    }
    return EventLoggingAPIService.instance;
  }

  /**
   * ⚠️ SECURITY: Create security event via backend API
   * Backend validates ALL event data before storage
   */
  async createSecurityEvent(request: EventCreationRequest): Promise<{
    success: boolean;
    event?: SecurityEvent;
    validation?: any;
    error?: string;
  }> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY AUDIT] Creating security event via API:', {
        category: request.suggested_category,
        type: request.suggested_type,
        target: request.suggested_target_type,
        warning: 'API request is INFORMATIONAL ONLY',
        security: 'Backend validates ALL event data before storage',
        authority: 'Frontend has ZERO authority over event creation'
      });
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/security`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        if (response.status === 403) {
          // SECURITY: Backend rejected event creation - unauthorized
          if (process.env.NODE_ENV === 'development') {
            console.error('[SECURITY AUDIT] Backend rejected event creation - Unauthorized:', {
              status: response.status,
              security: 'Backend correctly enforced event creation permissions'
            });
          }
          return {
            success: false,
            error: 'Event creation unauthorized - Insufficient permissions'
          };
        }

        if (response.status === 400) {
          // SECURITY: Backend rejected invalid event data
          const validation = await response.json();
          if (process.env.NODE_ENV === 'development') {
            console.error('[SECURITY AUDIT] Backend rejected invalid event data:', {
              validation_errors: validation.validation_errors,
              security_warnings: validation.security_warnings,
              security: 'Backend correctly validated event data'
            });
          }
          return {
            success: false,
            validation,
            error: 'Event validation failed - Backend rejected'
          };
        }

        if (response.status === 429) {
          // SECURITY: Rate limiting enforced by backend
          if (process.env.NODE_ENV === 'development') {
            console.error('[SECURITY AUDIT] Event creation rate limited:', {
              status: response.status,
              security: 'Backend correctly enforced rate limiting'
            });
          }
          return {
            success: false,
            error: 'Event creation rate limited - Too many requests'
          };
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const { event, validation } = result;

      if (process.env.NODE_ENV === 'development') {
        console.log('[SECURITY AUDIT] Security event created successfully:', {
          event_id: event.id,
          category: event.event_category,
          type: event.event_type,
          security_level: event.security_level,
          is_valid: event.is_valid,
          security: 'Backend successfully created and validated event'
        });
      }

      return {
        success: true,
        event,
        validation
      };

    } catch (error: any) {
      console.error('[SECURITY CRITICAL] Event creation API failed:', error);
      
      // SECURITY: Log system error as critical security event
      if (typeof window !== 'undefined') {
        // Attempt to log the system error (may also fail, but worth trying)
        this.logSystemError('EVENT_CREATION_FAILED', error.message);
      }

      return {
        success: false,
        error: 'Event creation failed - Backend API error'
      };
    }
  }

  /**
   * ⚠️ SECURITY: Query security events via backend API
   * Backend validates ALL query parameters and results
   */
  async querySecurityEvents(filters: EventQueryFilters): Promise<{
    success: boolean;
    events?: SecurityEvent[];
    total_count?: number;
    has_more?: boolean;
    error?: string;
  }> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY AUDIT] Querying security events via API:', {
        filters,
        warning: 'API query is INFORMATIONAL ONLY',
        security: 'Backend validates ALL query parameters and results',
        authority: 'Frontend has ZERO authority over query results'
      });
    }

    try {
      const queryParams = new URLSearchParams();
      
      // SECURITY: Add validated filters to query parameters
      if (filters.start_date) queryParams.append('start_date', filters.start_date);
      if (filters.end_date) queryParams.append('end_date', filters.end_date);
      if (filters.actor_types) queryParams.append('actor_types', filters.actor_types.join(','));
      if (filters.categories) queryParams.append('categories', filters.categories.join(','));
      if (filters.types) queryParams.append('types', filters.types.join(','));
      if (filters.target_types) queryParams.append('target_types', filters.target_types.join(','));
      if (filters.target_ids) queryParams.append('target_ids', filters.target_ids.join(','));
      if (filters.security_levels) queryParams.append('security_levels', filters.security_levels.join(','));
      if (filters.is_sensitive !== undefined) queryParams.append('is_sensitive', filters.is_sensitive.toString());
      if (filters.requires_audit !== undefined) queryParams.append('requires_audit', filters.requires_audit.toString());
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', Math.min(filters.limit, 1000).toString()); // Backend enforces max limit
      if (filters.sort_by) queryParams.append('sort_by', filters.sort_by);
      if (filters.sort_order) queryParams.append('sort_order', filters.sort_order);

      const response = await fetch(`${this.API_BASE_URL}/security?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          // SECURITY: Backend rejected query - insufficient permissions
          if (process.env.NODE_ENV === 'development') {
            console.error('[SECURITY AUDIT] Backend rejected event query - Unauthorized:', {
              status: response.status,
              security: 'Backend correctly enforced query permissions'
            });
          }
          return {
            success: false,
            error: 'Event query unauthorized - Insufficient permissions'
          };
        }

        if (response.status === 400) {
          // SECURITY: Backend rejected invalid query parameters
          const error = await response.json();
          if (process.env.NODE_ENV === 'development') {
            console.error('[SECURITY AUDIT] Backend rejected invalid query parameters:', {
              error: error.message,
              security: 'Backend correctly validated query parameters'
            });
          }
          return {
            success: false,
            error: error.message || 'Invalid query parameters - Backend validation failed'
          };
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const { events, total_count, has_more } = result;

      if (process.env.NODE_ENV === 'development') {
        console.log('[SECURITY AUDIT] Event query successful:', {
          event_count: events.length,
          total_count,
          has_more,
          security: 'Backend validated and returned query results'
        });
      }

      return {
        success: true,
        events,
        total_count,
        has_more
      };

    } catch (error: any) {
      console.error('[SECURITY CRITICAL] Event query API failed:', error);
      return {
        success: false,
        error: 'Event query failed - Backend API error'
      };
    }
  }

  /**
   * ⚠️ SECURITY: Get event statistics via backend API
   * Backend validates ALL statistical access
   */
  async getEventStatistics(filters?: EventQueryFilters): Promise<{
    success: boolean;
    statistics?: EventStatistics;
    error?: string;
  }> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY AUDIT] Requesting event statistics via API:', {
        filters,
        warning: 'API request is INFORMATIONAL ONLY',
        security: 'Backend validates ALL statistical access',
        authority: 'Frontend has ZERO authority over statistics'
      });
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/security/statistics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ filters })
      });

      if (!response.ok) {
        if (response.status === 403) {
          // SECURITY: Backend rejected statistics access
          if (process.env.NODE_ENV === 'development') {
            console.error('[SECURITY AUDIT] Backend rejected statistics access:', {
              status: response.status,
              security: 'Backend correctly enforced statistics permissions'
            });
          }
          return {
            success: false,
            error: 'Statistics access denied - Insufficient permissions'
          };
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const { statistics } = result;

      if (process.env.NODE_ENV === 'development') {
        console.log('[SECURITY AUDIT] Statistics retrieved successfully:', {
          total_events: statistics.total_events,
          suspicious_count: statistics.suspicious_activity_count,
          validation_failures: statistics.validation_failure_count,
          security: 'Backend validated and returned statistics'
        });
      }

      return {
        success: true,
        statistics
      };

    } catch (error: any) {
      console.error('[SECURITY CRITICAL] Statistics retrieval API failed:', error);
      return {
        success: false,
        error: 'Statistics retrieval failed - Backend API error'
      };
    }
  }

  /**
   * ⚠️ SECURITY: Export security events via backend API
   * Backend validates ALL export permissions and data
   */
  async exportSecurityEvents(request: EventExportRequest): Promise<{
    success: boolean;
    export?: EventExportResult;
    error?: string;
  }> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY AUDIT] Requesting event export via API:', {
        format: request.format,
        include_sensitive: request.include_sensitive,
        reason: request.reason,
        warning: 'API request is INFORMATIONAL ONLY',
        security: 'Backend validates ALL export permissions and data',
        authority: 'Frontend has ZERO authority over exports'
      });
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/security/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        if (response.status === 403) {
          // SECURITY: Backend rejected export - insufficient permissions
          if (process.env.NODE_ENV === 'development') {
            console.error('[SECURITY AUDIT] Backend rejected export request:', {
              status: response.status,
              include_sensitive: request.include_sensitive,
              security: 'Backend correctly enforced export permissions'
            });
          }
          return {
            success: false,
            error: 'Export unauthorized - Insufficient permissions for sensitive data'
          };
        }

        if (response.status === 400) {
          // SECURITY: Backend rejected invalid export request
          const error = await response.json();
          if (process.env.NODE_ENV === 'development') {
            console.error('[SECURITY AUDIT] Backend rejected invalid export request:', {
              error: error.message,
              security: 'Backend correctly validated export request'
            });
          }
          return {
            success: false,
            error: error.message || 'Export request invalid - Backend validation failed'
          };
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const { export: exportResult } = result;

      if (process.env.NODE_ENV === 'development') {
        console.log('[SECURITY AUDIT] Export created successfully:', {
          export_id: exportResult.export_id,
          record_count: exportResult.record_count,
          security_classification: exportResult.security_classification,
          security: 'Backend validated and created export'
        });
      }

      return {
        success: true,
        export: exportResult
      };

    } catch (error: any) {
      console.error('[SECURITY CRITICAL] Export creation API failed:', error);
      return {
        success: false,
        error: 'Export creation failed - Backend API error'
      };
    }
  }

  /**
   * ⚠️ SECURITY: Log system error as security event
   * Backend validates system error events
   */
  private async logSystemError(errorType: string, errorMessage: string): Promise<void> {
    try {
      const state = store.getState() as RootState;
      const user = state.auth.user;
      
      const systemErrorRequest: EventCreationRequest = {
        suggested_category: EventCategory.SYSTEM,
        suggested_type: EventType.SYSTEM_ERROR,
        suggested_target_type: TargetType.USER,
        suggested_target_id: user?.id || 'system',
        suggested_context: {
          previous_status: errorType,
          new_status: 'LOGGED',
          metadata: {
            error_message: errorMessage,
            user_role: user?.role || 'unauthenticated',
            timestamp: new Date().toISOString()
          },
          is_sensitive: true,
          requires_audit: true
        },
        frontend_metadata: {
          component: 'SystemErrorHandler',
          action: 'LOG_SYSTEM_ERROR',
          timestamp: new Date().toISOString()
        }
      };

      // Attempt to log system error (may fail silently to prevent infinite loops)
      await this.createSecurityEvent(systemErrorRequest);
      
    } catch (error) {
      // Silent fail to prevent infinite error loops
      console.error('[SECURITY CRITICAL] Failed to log system error:', error);
    }
  }
}

/**
 * ⚠️ SECURITY: Convenience functions for common event logging
 * Backend validates ALL events through API service
 */

/**
 * ⚠️ SECURITY: Log authentication event via backend API
 */
export async function logAuthenticationEvent(
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'TOKEN_REFRESH',
  actorId: string,
  metadata?: Record<string, any>
): Promise<void> {
  const service = EventLoggingAPIService.getInstance();
  
  const request: EventCreationRequest = {
    suggested_category: EventCategory.AUTHENTICATION,
    suggested_type: type as EventType,
    suggested_target_type: TargetType.USER,
    suggested_target_id: actorId,
    suggested_context: {
      metadata,
      is_sensitive: type === 'LOGIN_FAILURE',
      requires_audit: true
    },
    frontend_metadata: {
      component: 'Authentication',
      action: type,
      timestamp: new Date().toISOString()
    }
  };

  const result = await service.createSecurityEvent(request);
  
  if (!result.success && process.env.NODE_ENV === 'development') {
    console.error('[SECURITY AUDIT] Authentication event logging failed:', result.error);
  }
}

/**
 * ⚠️ SECURITY: Log authorization event via backend API
 */
export async function logAuthorizationEvent(
  type: 'ACCESS_GRANTED' | 'ACCESS_DENIED' | 'PERMISSION_CHECK',
  actorId: string,
  targetType: TargetType,
  targetId: string,
  permission?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const service = EventLoggingAPIService.getInstance();
  
  const request: EventCreationRequest = {
    suggested_category: EventCategory.AUTHORIZATION,
    suggested_type: type as EventType,
    suggested_target_type: targetType,
    suggested_target_id: targetId,
    suggested_context: {
      previous_status: permission,
      metadata,
      is_sensitive: type === 'ACCESS_DENIED',
      requires_audit: true
    },
    frontend_metadata: {
      component: 'Authorization',
      action: type,
      timestamp: new Date().toISOString()
    }
  };

  const result = await service.createSecurityEvent(request);
  
  if (!result.success && process.env.NODE_ENV === 'development') {
    console.error('[SECURITY AUDIT] Authorization event logging failed:', result.error);
  }
}

/**
 * ⚠️ SECURITY: Log financial event via backend API
 * Financial events are CRITICAL SECURITY - Backend validates thoroughly
 */
export async function logFinancialEvent(
  type: 'PAYMENT_SUCCESSFUL' | 'PAYMENT_FAILED' | 'ESCROW_CREATED' | 'ESCROW_RELEASED' | 'PAYOUT_PROCESSED',
  actorId: string,
  targetType: TargetType,
  targetId: string,
  amount?: number,
  currency?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const service = EventLoggingAPIService.getInstance();
  
  const request: EventCreationRequest = {
    suggested_category: EventCategory.FINANCIAL,
    suggested_type: type as EventType,
    suggested_target_type: targetType,
    suggested_target_id: targetId,
    suggested_context: {
      amount,
      currency,
      metadata,
      is_sensitive: true,
      requires_audit: true
    },
    frontend_metadata: {
      component: 'Financial',
      action: type,
      timestamp: new Date().toISOString()
    }
  };

  const result = await service.createSecurityEvent(request);
  
  if (!result.success) {
    // SECURITY: Financial event logging failure is CRITICAL
    console.error('[SECURITY CRITICAL] Financial event logging failed:', result.error);
    
    // SECURITY: Alert administrators of financial logging failure
    if (typeof window !== 'undefined') {
      // This would typically integrate with your alerting system
      console.error('[SECURITY ALERT] Financial event logging failure - Administrator notification required');
    }
  }
}

/**
 * ⚠️ SECURITY: Export singleton instance
 * Backend validates ALL operations through this instance
 */
export const eventLoggingAPI = EventLoggingAPIService.getInstance();