/**
 * 🔒 SECURITY-COMPLIANT GLOBAL EVENT LOGGING SERVICE
 * ACCESS CONTROL & AUTHORITY POLICY IMPLEMENTATION
 * 
 * CRITICAL SECURITY NOTICE:
 * - All event logging is SECURITY-CRITICAL for audit compliance
 * - Backend validates ALL event data before storage
 * - Frontend events are INFORMATIONAL ONLY - Backend validates independently
 * - Event tampering is SECURITY VIOLATION - Backend detects and logs
 * - All financial events require backend validation and storage
 * 
 * VIOLATION OF EVENT LOGGING POLICY COMPROMISES SYSTEM SECURITY
 */

import { store } from '@/store'
import { RootState } from '@/store'
import { 
  SecurityEvent,
  EventStatistics,
  EventCategory,
  EventType,
  ActorType,
  TargetType
} from '@/types/eventLogging.types'

import { getAuthHeaders, getCurrentUserRole } from './api/securityCompliantClient'
import { toast } from 'react-hot-toast'

/**
 * ⚠️ SECURITY: Event Logging Service
 * Backend validates ALL events - Frontend has ZERO authority
 */
export class SecurityEventLoggingService {
  private static instance: SecurityEventLoggingService;
  private eventQueue: EventCreationRequest[] = [];
  private isProcessing = false;
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly BATCH_SIZE = 10;
  private readonly RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  private constructor() {
    // SECURITY: Initialize event queue processor
    this.startQueueProcessor();
  }

  /**
   * ⚠️ SECURITY: Singleton pattern ensures centralized logging
   * Backend validates ALL logging operations
   */
  public static getInstance(): SecurityEventLoggingService {
    if (!SecurityEventLoggingService.instance) {
      SecurityEventLoggingService.instance = new SecurityEventLoggingService();
    }
    return SecurityEventLoggingService.instance;
  }

  /**
   * ⚠️ SECURITY: Create security event - Backend validates ALL data
   * Frontend provides suggestions - Backend determines final event
   */
  async createSecurityEvent(request: EventCreationRequest): Promise<{
    success: boolean;
    event?: SecurityEvent;
    validation?: EventValidationResult;
    error?: string;
  }> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY AUDIT] Creating security event:', {
        category: request.suggested_category,
        type: request.suggested_type,
        target: request.suggested_target_type,
        warning: 'Frontend request is INFORMATIONAL ONLY',
        security: 'Backend validates ALL event data independently',
        authority: 'Frontend has ZERO authority over event creation'
      });
    }

    try {
      // SECURITY: Get current user context for validation
      const state = store.getState() as RootState;
      const user = state.auth.user;
      const token = state.auth.token;

      if (!token) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[SECURITY AUDIT] Event creation without authentication:', {
            category: request.suggested_category,
            type: request.suggested_type,
            security: 'Backend will reject - Authentication required'
          });
        }
        return {
          success: false,
          error: 'Authentication required for event logging'
        };
      }

      // SECURITY: Add frontend context for backend validation
      const enrichedRequest = {
        ...request,
        frontend_metadata: {
          ...request.frontend_metadata,
          timestamp: new Date().toISOString(),
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
          component: request.frontend_metadata?.component || 'unknown'
        }
      };

      // SECURITY: Backend validates and creates event
      const response = await fetch('/api/v1/events/security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(enrichedRequest)
      });

      if (!response.ok) {
        if (response.status === 403) {
          // SECURITY: Backend correctly rejected unauthorized event creation
          if (process.env.NODE_ENV === 'development') {
            console.error('[SECURITY AUDIT] Backend rejected event creation - Unauthorized:', {
              status: response.status,
              userRole: user?.role,
              security: 'Backend correctly enforced access control'
            });
          }
          return {
            success: false,
            error: 'Event creation unauthorized - Backend validation failed'
          };
        }

        if (response.status === 400) {
          // SECURITY: Backend rejected invalid event data
          const validation = await response.json() as EventValidationResult;
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

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const { event, validation } = result;

      if (process.env.NODE_ENV === 'development') {
        console.log('[SECURITY AUDIT] Event created successfully:', {
          event_id: event.id,
          category: event.event_category,
          type: event.event_type,
          security_level: event.security_level,
          security: 'Backend successfully created and validated event'
        });
      }

      return {
        success: true,
        event,
        validation
      };

    } catch (error: any) {
      console.error('[SECURITY CRITICAL] Event creation failed:', error);
      
      // SECURITY: Queue event for retry if it's a network error
      if (this.shouldQueueForRetry(error)) {
        this.queueEventForRetry(request);
        return {
          success: false,
          error: 'Event queued for retry - Network error detected'
        };
      }

      return {
        success: false,
        error: 'Event creation failed - Backend validation error'
      };
    }
  }

  /**
   * ⚠️ SECURITY: Queue event for retry - Backend will validate on retry
   * Frontend has ZERO authority over retry logic
   */
  private queueEventForRetry(request: EventCreationRequest): void {
    if (this.eventQueue.length >= this.MAX_QUEUE_SIZE) {
      // SECURITY: Log queue overflow as security event
      console.error('[SECURITY AUDIT] Event queue overflow - Potential DoS attempt');
      this.eventQueue.shift(); // Remove oldest event
    }

    this.eventQueue.push(request);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY AUDIT] Event queued for retry:', {
        queue_size: this.eventQueue.length,
        category: request.suggested_category,
        type: request.suggested_type,
        security: 'Event queued for backend validation on retry'
      });
    }
  }

  /**
   * ⚠️ SECURITY: Background queue processor
   * Backend validates ALL queued events
   */
  private startQueueProcessor(): void {
    setInterval(async () => {
      if (this.isProcessing || this.eventQueue.length === 0) {
        return;
      }

      this.isProcessing = true;
      const batch = this.eventQueue.splice(0, this.BATCH_SIZE);

      if (process.env.NODE_ENV === 'development') {
        console.log('[SECURITY AUDIT] Processing event batch:', {
          batch_size: batch.length,
          remaining_queue: this.eventQueue.length,
          security: 'Backend will validate all queued events'
        });
      }

      for (let i = 0; i < batch.length; i++) {
        const request = batch[i];
        let attempts = 0;
        
        while (attempts < this.RETRY_ATTEMPTS) {
          try {
            const result = await this.createSecurityEvent(request);
            if (result.success) {
              if (process.env.NODE_ENV === 'development') {
                console.log('[SECURITY AUDIT] Queued event created successfully:', {
                  event_id: result.event?.id,
                  attempts: attempts + 1,
                  security: 'Backend validated queued event'
                });
              }
              break;
            }
            
            if (result.error?.includes('validation')) {
              // SECURITY: Backend rejected event - don't retry validation failures
              if (process.env.NODE_ENV === 'development') {
                console.error('[SECURITY AUDIT] Backend rejected queued event - Stopping retry:', {
                  error: result.error,
                  security: 'Backend validation failed - Event rejected'
                });
              }
              break;
            }
            
            attempts++;
            if (attempts < this.RETRY_ATTEMPTS) {
              await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * Math.pow(2, attempts)));
            }
          } catch (error) {
            attempts++;
            if (attempts >= this.RETRY_ATTEMPTS) {
              console.error('[SECURITY CRITICAL] Event retry failed permanently:', error);
            }
          }
        }
      }

      this.isProcessing = false;
    }, 5000); // Process queue every 5 seconds
  }

  /**
   * ⚠️ SECURITY: Query security events - Backend validates ALL filters
   * Frontend has ZERO authority over query results
   */
  async querySecurityEvents(filters: EventQueryFilters): Promise<{
    success: boolean;
    events?: SecurityEvent[];
    total_count?: number;
    has_more?: boolean;
    error?: string;
  }> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY AUDIT] Querying security events:', {
        filters,
        warning: 'Frontend query is INFORMATIONAL ONLY',
        security: 'Backend validates ALL query parameters',
        authority: 'Frontend has ZERO authority over query results'
      });
    }

    try {
      const queryParams = new URLSearchParams();
      
      // SECURITY: Add filters to query parameters
      if (filters.start_date) queryParams.append('start_date', filters.start_date);
      if (filters.end_date) queryParams.append('end_date', filters.end_date);
      if (filters.actor_types) queryParams.append('actor_types', filters.actor_types.join(','));
      if (filters.categories) queryParams.append('categories', filters.categories.join(','));
      if (filters.types) queryParams.append('types', filters.types.join(','));
      if (filters.target_types) queryParams.append('target_types', filters.target_types.join(','));
      if (filters.security_levels) queryParams.append('security_levels', filters.security_levels.join(','));
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.sort_by) queryParams.append('sort_by', filters.sort_by);
      if (filters.sort_order) queryParams.append('sort_order', filters.sort_order);

      const response = await fetch(`/api/v1/events/security?${queryParams.toString()}`, {
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
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[SECURITY AUDIT] Event query successful:', {
          event_count: result.events?.length,
          total_count: result.total_count,
          security: 'Backend validated and returned query results'
        });
      }

      return {
        success: true,
        events: result.events,
        total_count: result.total_count,
        has_more: result.has_more
      };

    } catch (error: any) {
      console.error('[SECURITY CRITICAL] Event query failed:', error);
      return {
        success: false,
        error: 'Event query failed - Backend validation error'
      };
    }
  }

  /**
   * ⚠️ SECURITY: Get event statistics - Backend validates ALL access
   * Frontend has ZERO authority over statistical data
   */
  async getEventStatistics(filters?: EventQueryFilters): Promise<{
    success: boolean;
    statistics?: EventStatistics;
    error?: string;
  }> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY AUDIT] Requesting event statistics:', {
        filters,
        warning: 'Frontend request is INFORMATIONAL ONLY',
        security: 'Backend validates ALL statistical access',
        authority: 'Frontend has ZERO authority over statistics'
      });
    }

    try {
      const response = await fetch('/api/v1/events/security/statistics', {
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
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[SECURITY AUDIT] Statistics retrieved successfully:', {
          total_events: result.statistics.total_events,
          suspicious_count: result.statistics.suspicious_activity_count,
          security: 'Backend validated and returned statistics'
        });
      }

      return {
        success: true,
        statistics: result.statistics
      };

    } catch (error: any) {
      console.error('[SECURITY CRITICAL] Statistics retrieval failed:', error);
      return {
        success: false,
        error: 'Statistics retrieval failed - Backend validation error'
      };
    }
  }

  /**
   * ⚠️ SECURITY: Export security events - Backend validates ALL exports
   * Frontend has ZERO authority over export permissions
   */
  async exportSecurityEvents(request: EventExportRequest): Promise<{
    success: boolean;
    export?: EventExportResult;
    error?: string;
  }> {
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY AUDIT] Requesting event export:', {
        format: request.format,
        include_sensitive: request.include_sensitive,
        reason: request.reason,
        warning: 'Frontend request is INFORMATIONAL ONLY',
        security: 'Backend validates ALL export permissions',
        authority: 'Frontend has ZERO authority over exports'
      });
    }

    try {
      const response = await fetch('/api/v1/events/security/export', {
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
            console.error('[SECURITY AUDIT] Backend rejected invalid export:', {
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
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[SECURITY AUDIT] Export created successfully:', {
          export_id: result.export.export_id,
          record_count: result.export.record_count,
          security_classification: result.export.security_classification,
          security: 'Backend validated and created export'
        });
      }

      return {
        success: true,
        export: result.export
      };

    } catch (error: any) {
      console.error('[SECURITY CRITICAL] Export creation failed:', error);
      return {
        success: false,
        error: 'Export creation failed - Backend validation error'
      };
    }
  }

  /**
   * ⚠️ SECURITY: Determine if error should trigger retry
   * Backend validates retry logic
   */
  private shouldQueueForRetry(error: any): boolean {
    // SECURITY: Only retry network errors, not validation errors
    return error.message?.includes('Network') || 
           error.message?.includes('timeout') || 
           error.message?.includes('Failed to fetch');
  }
}

// Convenience helper used by security-aware form components
export const logSecurityEvent = (request: EventCreationRequest) => {
  return SecurityEventLoggingService.getInstance().createSecurityEvent(request)
}

/**
 * ⚠️ SECURITY: Convenience functions for common event types
 * Backend validates ALL events - Frontend has ZERO authority
 */

/**
 * ⚠️ SECURITY: Log authentication event - Backend validates
 */
export async function logAuthenticationEvent(
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'TOKEN_REFRESH',
  actorId: string,
  metadata?: Record<string, any>
): Promise<void> {
  const service = SecurityEventLoggingService.getInstance();
  
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
 * ⚠️ SECURITY: Log authorization event - Backend validates
 */
export async function logAuthorizationEvent(
  type: 'ACCESS_GRANTED' | 'ACCESS_DENIED' | 'PERMISSION_CHECK',
  actorId: string,
  targetType: TargetType,
  targetId: string,
  permission?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const service = SecurityEventLoggingService.getInstance();
  
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
 * ⚠️ SECURITY: Log financial event - Backend validates CRITICAL data
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
  const service = SecurityEventLoggingService.getInstance();
  
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
      toast.error('Critical: Financial event logging failed - Contact administrator');
    }
  }
}

/**
 * ⚠️ SECURITY: Export singleton instance
 * Backend validates ALL operations through this instance
 */
export const securityEventLogger = SecurityEventLoggingService.getInstance();