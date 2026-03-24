/**
 * 🔒 SECURITY-COMPLIANT EVENT LOGGING HOOKS
 * ACCESS CONTROL & AUTHORITY POLICY IMPLEMENTATION
 * 
 * CRITICAL SECURITY NOTICE:
 * - All event logging is SECURITY-CRITICAL for audit compliance
 * - Hooks provide COSMETIC convenience - Backend validates ALL events
 * - Frontend event creation is INFORMATIONAL ONLY - Backend validates independently
 * - Event data integrity is maintained through backend validation
 * - Financial events require additional backend validation and approval
 * 
 * VIOLATION OF EVENT LOGGING POLICY COMPROMISES SYSTEM SECURITY
 */

import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { 
  SecurityEvent, 
  EventQueryFilters, 
  EventStatistics,
  EventExportRequest,
  EventExportResult,
  EventCategory,
  EventType,
  TargetType
} from '@/types/eventLogging.types';
import { securityEventLogger, logAuthenticationEvent, logAuthorizationEvent, logFinancialEvent } from '@/services/securityEventLogging.service';
import { eventLoggingAPI } from '@/services/eventLoggingAPI.service';

/**
 * ⚠️ SECURITY: Main event logging hook
 * Backend validates ALL events - Frontend has ZERO authority
 */
export function useSecurityEventLogging() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * ⚠️ SECURITY: Create security event - Backend validates ALL data
   * Frontend provides suggestions - Backend determines final event
   */
  const createSecurityEvent = useCallback(async (
    category: EventCategory,
    type: EventType,
    targetType: TargetType,
    targetId: string,
    context?: {
      amount?: number;
      currency?: string;
      previous_status?: string;
      new_status?: string;
      reference_id?: string;
      reference_type?: string;
      metadata?: Record<string, any>;
    },
    component?: string
  ) => {
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[SECURITY AUDIT] Event creation attempted without authentication');
      }
      setError('Authentication required for event logging');
      return { success: false, error: 'Authentication required' };
    }

    setIsLogging(true);
    setError(null);

    try {
      const request = {
        suggested_category: category,
        suggested_type: type,
        suggested_target_type: targetType,
        suggested_target_id: targetId,
        suggested_context: {
          ...context,
          is_sensitive: this.isSensitiveEvent(category, type),
          requires_audit: this.requiresAudit(category, type)
        },
        frontend_metadata: {
          component: component || 'useSecurityEventLogging',
          action: type,
          timestamp: new Date().toISOString(),
          user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
        }
      };

      const result = await securityEventLogger.createSecurityEvent(request);
      
      if (!result.success) {
        setError(result.error || 'Event creation failed');
        if (process.env.NODE_ENV === 'development') {
          console.error('[SECURITY AUDIT] Event creation failed:', result.error);
        }
      }

      return result;
    } catch (error: any) {
      setError(error.message || 'Event creation error');
      if (process.env.NODE_ENV === 'development') {
        console.error('[SECURITY CRITICAL] Event creation error:', error);
      }
      return { success: false, error: error.message };
    } finally {
      setIsLogging(false);
    }
  }, [user]);

  /**
   * ⚠️ SECURITY: Determine if event is sensitive
   * Backend makes final determination - Frontend provides suggestion
   */
  const isSensitiveEvent = (category: EventCategory, type: EventType): boolean => {
    // Frontend suggestion - Backend validates independently
    const sensitiveCategories = [
      EventCategory.FINANCIAL,
      EventCategory.PAYMENT,
      EventCategory.ESCROW,
      EventCategory.PAYOUT,
      EventCategory.SECURITY,
      EventCategory.AUTHORIZATION
    ];
    
    const sensitiveTypes = [
      EventType.LOGIN_FAILURE,
      EventType.ACCESS_DENIED,
      EventType.PAYMENT_FAILED,
      EventType.ESCROW_DISPUTED,
      EventType.SECURITY_ALERT,
      EventType.SYSTEM_ERROR
    ];

    return sensitiveCategories.includes(category) || sensitiveTypes.includes(type);
  };

  /**
   * ⚠️ SECURITY: Determine if event requires audit
   * Backend makes final determination - Frontend provides suggestion
   */
  const requiresAudit = (category: EventCategory, type: EventType): boolean => {
    // Frontend suggestion - Backend validates independently
    const auditRequiredCategories = [
      EventCategory.FINANCIAL,
      EventCategory.PAYMENT,
      EventCategory.ESCROW,
      EventCategory.PAYOUT,
      EventCategory.AUTHORIZATION,
      EventCategory.SECURITY,
      EventCategory.USER_MANAGEMENT,
      EventCategory.ROLE_CHANGE
    ];
    
    const auditRequiredTypes = [
      EventType.LOGIN_FAILURE,
      EventType.ACCESS_DENIED,
      EventType.PAYMENT_SUCCESSFUL,
      EventType.PAYMENT_FAILED,
      EventType.ESCROW_CREATED,
      EventType.ESCROW_RELEASED,
      EventType.PAYOUT_PROCESSED,
      EventType.ROLE_ASSIGNED,
      EventType.ROLE_REMOVED,
      EventType.SECURITY_ALERT
    ];

    return auditRequiredCategories.includes(category) || auditRequiredTypes.includes(type);
  };

  return {
    createSecurityEvent,
    isLogging,
    error
  };
}

/**
 * ⚠️ SECURITY: Authentication event logging hook
 * Backend validates ALL authentication events
 */
export function useAuthenticationEventLogging() {
  const user = useSelector((state: RootState) => state.auth.user);

  /**
   * ⚠️ SECURITY: Log authentication event - Backend validates
   */
  const logAuthEvent = useCallback(async (
    type: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'TOKEN_REFRESH',
    metadata?: Record<string, any>
  ) => {
    if (!user?.id) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[SECURITY AUDIT] Authentication event logging attempted without user ID');
      }
      return { success: false, error: 'User ID required for authentication events' };
    }

    try {
      await logAuthenticationEvent(type, user.id, metadata);
      return { success: true };
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[SECURITY CRITICAL] Authentication event logging failed:', error);
      }
      return { success: false, error: error.message };
    }
  }, [user]);

  return { logAuthEvent };
}

/**
 * ⚠️ SECURITY: Authorization event logging hook
 * Backend validates ALL authorization events
 */
export function useAuthorizationEventLogging() {
  const user = useSelector((state: RootState) => state.auth.user);

  /**
   * ⚠️ SECURITY: Log authorization event - Backend validates
   */
  const logAuthzEvent = useCallback(async (
    type: 'ACCESS_GRANTED' | 'ACCESS_DENIED' | 'PERMISSION_CHECK',
    targetType: TargetType,
    targetId: string,
    permission?: string,
    metadata?: Record<string, any>
  ) => {
    if (!user?.id) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[SECURITY AUDIT] Authorization event logging attempted without user ID');
      }
      return { success: false, error: 'User ID required for authorization events' };
    }

    try {
      await logAuthorizationEvent(type, user.id, targetType, targetId, permission, metadata);
      return { success: true };
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[SECURITY CRITICAL] Authorization event logging failed:', error);
      }
      return { success: false, error: error.message };
    }
  }, [user]);

  return { logAuthzEvent };
}

/**
 * ⚠️ SECURITY: Financial event logging hook
 * Backend validates ALL financial events - CRITICAL SECURITY
 */
export function useFinancialEventLogging() {
  const user = useSelector((state: RootState) => state.auth.user);

  /**
   * ⚠️ SECURITY: Log financial event - Backend validates CRITICAL data
   */
  const logFinEvent = useCallback(async (
    type: 'PAYMENT_SUCCESSFUL' | 'PAYMENT_FAILED' | 'ESCROW_CREATED' | 'ESCROW_RELEASED' | 'PAYOUT_PROCESSED',
    targetType: TargetType,
    targetId: string,
    amount?: number,
    currency?: string,
    metadata?: Record<string, any>
  ) => {
    if (!user?.id) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[SECURITY AUDIT] Financial event logging attempted without user ID');
      }
      return { success: false, error: 'User ID required for financial events' };
    }

    try {
      await logFinancialEvent(type, user.id, targetType, targetId, amount, currency, metadata);
      return { success: true };
    } catch (error: any) {
      // SECURITY: Financial event logging failure is CRITICAL
      console.error('[SECURITY CRITICAL] Financial event logging failed:', error);
      
      // SECURITY: Alert administrators of financial logging failure
      if (typeof window !== 'undefined') {
        // This would typically integrate with your alerting system
        console.error('[SECURITY ALERT] Financial event logging failure - Administrator notification required');
      }
      
      return { success: false, error: error.message };
    }
  }, [user]);

  return { logFinEvent };
}

/**
 * ⚠️ SECURITY: Event query hook
 * Backend validates ALL queries - Frontend has ZERO authority
 */
export function useSecurityEventQuery() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  /**
   * ⚠️ SECURITY: Query security events - Backend validates ALL filters
   */
  const queryEvents = useCallback(async (filters: EventQueryFilters) => {
    setLoading(true);
    setError(null);

    try {
      const result = await eventLoggingAPI.querySecurityEvents(filters);
      
      if (result.success) {
        setEvents(result.events || []);
        setTotalCount(result.total_count || 0);
        setHasMore(result.has_more || false);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[SECURITY AUDIT] Event query successful:', {
            event_count: result.events?.length,
            total_count: result.total_count,
            filters
          });
        }
      } else {
        setError(result.error || 'Event query failed');
        if (process.env.NODE_ENV === 'development') {
          console.error('[SECURITY AUDIT] Event query failed:', result.error);
        }
      }
    } catch (error: any) {
      setError(error.message || 'Event query error');
      if (process.env.NODE_ENV === 'development') {
        console.error('[SECURITY CRITICAL] Event query error:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    events,
    loading,
    error,
    totalCount,
    hasMore,
    queryEvents
  };
}

/**
 * ⚠️ SECURITY: Event statistics hook
 * Backend validates ALL statistics - Frontend has ZERO authority
 */
export function useSecurityEventStatistics() {
  const [statistics, setStatistics] = useState<EventStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * ⚠️ SECURITY: Get event statistics - Backend validates ALL access
   */
  const getStatistics = useCallback(async (filters?: EventQueryFilters) => {
    setLoading(true);
    setError(null);

    try {
      const result = await eventLoggingAPI.getEventStatistics(filters);
      
      if (result.success) {
        setStatistics(result.statistics || null);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[SECURITY AUDIT] Statistics retrieval successful:', {
            total_events: result.statistics?.total_events,
            suspicious_count: result.statistics?.suspicious_activity_count
          });
        }
      } else {
        setError(result.error || 'Statistics retrieval failed');
        if (process.env.NODE_ENV === 'development') {
          console.error('[SECURITY AUDIT] Statistics retrieval failed:', result.error);
        }
      }
    } catch (error: any) {
      setError(error.message || 'Statistics retrieval error');
      if (process.env.NODE_ENV === 'development') {
        console.error('[SECURITY CRITICAL] Statistics retrieval error:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    statistics,
    loading,
    error,
    getStatistics
  };
}

/**
 * ⚠️ SECURITY: Event export hook
 * Backend validates ALL exports - Frontend has ZERO authority
 */
export function useSecurityEventExport() {
  const [exportResult, setExportResult] = useState<EventExportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * ⚠️ SECURITY: Export security events - Backend validates ALL permissions
   */
  const exportEvents = useCallback(async (request: EventExportRequest) => {
    setLoading(true);
    setError(null);

    try {
      const result = await eventLoggingAPI.exportSecurityEvents(request);
      
      if (result.success) {
        setExportResult(result.export || null);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[SECURITY AUDIT] Export creation successful:', {
            export_id: result.export?.export_id,
            record_count: result.export?.record_count,
            security_classification: result.export?.security_classification
          });
        }
      } else {
        setError(result.error || 'Export creation failed');
        if (process.env.NODE_ENV === 'development') {
          console.error('[SECURITY AUDIT] Export creation failed:', result.error);
        }
      }
    } catch (error: any) {
      setError(error.message || 'Export creation error');
      if (process.env.NODE_ENV === 'development') {
        console.error('[SECURITY CRITICAL] Export creation error:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    exportResult,
    loading,
    error,
    exportEvents
  };
}

/**
 * ⚠️ SECURITY: Auto-logging hook for component lifecycle
 * Backend validates ALL automatically logged events
 */
export function useAutoSecurityEventLogging(
  componentName: string,
  targetType?: TargetType,
  targetId?: string
) {
  const { createSecurityEvent } = useSecurityEventLogging();
  const user = useSelector((state: RootState) => state.auth.user);

  /**
   * ⚠️ SECURITY: Log component mount event
   */
  useEffect(() => {
    if (user?.id && targetType && targetId) {
      createSecurityEvent(
        EventCategory.SYSTEM,
        EventType.SYSTEM_STARTUP,
        targetType,
        targetId,
        { metadata: { component: componentName, action: 'component_mount' } },
        componentName
      );
    }
  }, [user?.id, componentName, targetType, targetId, createSecurityEvent]);

  /**
   * ⚠️ SECURITY: Log component unmount event
   */
  useEffect(() => {
    return () => {
      if (user?.id && targetType && targetId) {
        createSecurityEvent(
          EventCategory.SYSTEM,
          EventType.SYSTEM_SHUTDOWN,
          targetType,
          targetId,
          { metadata: { component: componentName, action: 'component_unmount' } },
          componentName
        );
      }
    };
  }, [user?.id, componentName, targetType, targetId, createSecurityEvent]);

  return { componentName, targetType, targetId };
}