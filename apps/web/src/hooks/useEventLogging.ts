/**
 * Event Logging React Hooks
 * SECURITY: Frontend logging is informational only - backend enforces security
 */

import { useCallback, useEffect, useState } from 'react';
import {
  SecurityEvent,
  CreateSecurityEventRequest,
  EventQueryParams,
  EventStatistics,
  EventCategory,
  EventType,
  ActorType,
  TargetType,
  EventSeverity,
  EventStatus
} from '../types/eventLogging.types';
import { 
  eventLoggingService, 
  logAuthenticationEvent,
  logAuthorizationEvent,
  logPaymentEvent,
  logSecurityEvent 
} from '../services/eventLogging.service';
import { EventTaxonomyValidator, EventSecurityAnalyzer } from '../utils/eventValidation.utils';
import { useAuth } from './useAuth';

// Main event logging hook
export function useEventLogging() {
  const { user } = useAuth();
  const [isLogging, setIsLogging] = useState(false);
  const [lastEvent, setLastEvent] = useState<SecurityEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const logEvent = useCallback(async (eventData: CreateSecurityEventRequest) => {
    if (!user?.id) {
      console.warn('Cannot log event: User not authenticated');
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } };
    }

    setIsLogging(true);
    setError(null);

    try {
      // SECURITY: Validate event against strict taxonomy (cosmetic check)
      const validation = EventTaxonomyValidator.validateEvent(eventData);
      if (!validation.valid) {
        console.warn('Event validation warnings:', validation.warnings);
      }

      // Analyze event risk for additional context
      const riskAnalysis = EventSecurityAnalyzer.analyzeEventRisk(eventData);
      
      const enhancedEventData = {
        ...eventData,
        metadata: {
          ...eventData.metadata,
          risk_score: riskAnalysis.risk_score,
          risk_factors: riskAnalysis.risk_factors,
          user_role: user.role,
          validation_warnings: validation.warnings
        }
      };

      const response = await eventLoggingService.logEvent(enhancedEventData);
      
      if (response.success && response.event) {
        setLastEvent(response.event);
      } else {
        setError(response.error?.message || 'Failed to log event');
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      // Log the error as a security event
      await logSecurityEvent(
        EventType.API_ERROR,
        ActorType.SYSTEM,
        null,
        {
          error_type: 'event_logging_error',
          error_message: errorMessage,
          original_event: eventData.event_type
        }
      );

      return { 
        success: false, 
        error: { 
          code: 'LOGGING_ERROR', 
          message: errorMessage 
        } 
      };
    } finally {
      setIsLogging(false);
    }
  }, [user]);

  return {
    logEvent,
    isLogging,
    lastEvent,
    error,
    sessionId: eventLoggingService.getSessionId()
  };
}

// Authentication event logging hook
export function useAuthenticationEventLogging() {
  const { logEvent, isLogging } = useEventLogging();

  const logLoginAttempt = useCallback(async (email: string, ipAddress?: string) => {
    return logEvent({
      event_category: EventCategory.AUTHENTICATION,
      event_type: EventType.LOGIN_ATTEMPT,
      actor_type: ActorType.USER,
      actor_id: email, // Use email as temporary ID before authentication
      target_type: TargetType.USER,
      target_id: email,
      severity: EventSeverity.LOW,
      status: EventStatus.PENDING,
      security_level: 'LOW',
      metadata: {
        email,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      },
      frontend_timestamp: Date.now(),
      frontend_session_id: eventLoggingService.getSessionId()
    });
  }, [logEvent]);

  const logLoginSuccess = useCallback(async (userId: string, email: string, ipAddress?: string) => {
    return logEvent({
      event_category: EventCategory.AUTHENTICATION,
      event_type: EventType.LOGIN_SUCCESS,
      actor_type: ActorType.USER,
      actor_id: userId,
      target_type: TargetType.USER,
      target_id: userId,
      severity: EventSeverity.LOW,
      status: EventStatus.SUCCESS,
      security_level: 'LOW',
      metadata: {
        user_id: userId,
        email,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      },
      frontend_timestamp: Date.now(),
      frontend_session_id: eventLoggingService.getSessionId()
    });
  }, [logEvent]);

  const logLoginFailure = useCallback(async (email: string, reason: string, ipAddress?: string) => {
    return logEvent({
      event_category: EventCategory.AUTHENTICATION,
      event_type: EventType.LOGIN_FAILURE,
      actor_type: ActorType.USER,
      actor_id: email,
      target_type: TargetType.USER,
      target_id: email,
      severity: EventSeverity.MEDIUM,
      status: EventStatus.FAILED,
      security_level: 'MEDIUM',
      metadata: {
        email,
        failure_reason: reason,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      },
      frontend_timestamp: Date.now(),
      frontend_session_id: eventLoggingService.getSessionId()
    });
  }, [logEvent]);

  const logLogout = useCallback(async (userId: string) => {
    return logEvent({
      event_category: EventCategory.AUTHENTICATION,
      event_type: EventType.LOGOUT,
      actor_type: ActorType.USER,
      actor_id: userId,
      target_type: TargetType.USER,
      target_id: userId,
      severity: EventSeverity.LOW,
      status: EventStatus.SUCCESS,
      security_level: 'LOW',
      metadata: {
        user_id: userId,
        timestamp: new Date().toISOString()
      },
      frontend_timestamp: Date.now(),
      frontend_session_id: eventLoggingService.getSessionId()
    });
  }, [logEvent]);

  return {
    logLoginAttempt,
    logLoginSuccess,
    logLoginFailure,
    logLogout,
    isLogging
  };
}

// Payment event logging hook
export function usePaymentEventLogging() {
  const { logEvent, isLogging } = useEventLogging();

  const logPaymentIntentCreated = useCallback(async (
    userId: string, 
    paymentIntentId: string, 
    amount: number, 
    currency: string
  ) => {
    return logEvent({
      event_category: EventCategory.PAYMENT,
      event_type: EventType.PAYMENT_INTENT_CREATED,
      actor_type: ActorType.USER,
      actor_id: userId,
      target_type: TargetType.PAYMENT,
      target_id: paymentIntentId,
      severity: EventSeverity.LOW,
      status: EventStatus.SUCCESS,
      security_level: 'LOW',
      metadata: {
        payment_intent_id: paymentIntentId,
        amount,
        currency,
        timestamp: new Date().toISOString()
      },
      frontend_timestamp: Date.now(),
      frontend_session_id: eventLoggingService.getSessionId()
    });
  }, [logEvent]);

  const logPaymentStatusCheck = useCallback(async (
    userId: string, 
    paymentIntentId: string, 
    status: string
  ) => {
    return logEvent({
      event_category: EventCategory.PAYMENT,
      event_type: EventType.PAYMENT_STATUS_CHECK,
      actor_type: ActorType.USER,
      actor_id: userId,
      target_type: TargetType.PAYMENT,
      target_id: paymentIntentId,
      severity: EventSeverity.LOW,
      status: EventStatus.SUCCESS,
      security_level: 'LOW',
      metadata: {
        payment_intent_id: paymentIntentId,
        payment_status: status,
        timestamp: new Date().toISOString()
      },
      frontend_timestamp: Date.now(),
      frontend_session_id: eventLoggingService.getSessionId()
    });
  }, [logEvent]);

  const logPaymentFailed = useCallback(async (
    userId: string, 
    paymentIntentId: string, 
    error: string
  ) => {
    return logEvent({
      event_category: EventCategory.PAYMENT,
      event_type: EventType.PAYMENT_INTENT_FAILED,
      actor_type: ActorType.USER,
      actor_id: userId,
      target_type: TargetType.PAYMENT,
      target_id: paymentIntentId,
      severity: EventSeverity.HIGH,
      status: EventStatus.FAILED,
      security_level: 'HIGH',
      metadata: {
        payment_intent_id: paymentIntentId,
        error_message: error,
        timestamp: new Date().toISOString()
      },
      frontend_timestamp: Date.now(),
      frontend_session_id: eventLoggingService.getSessionId()
    });
  }, [logEvent]);

  return {
    logPaymentIntentCreated,
    logPaymentStatusCheck,
    logPaymentFailed,
    isLogging
  };
}

// Security event logging hook
export function useSecurityEventLogging() {
  const { logEvent, isLogging } = useEventLogging();

  const logSuspiciousActivity = useCallback(async (
    userId: string | null,
    description: string,
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ) => {
    return logEvent({
      event_category: EventCategory.SECURITY,
      event_type: EventType.SUSPICIOUS_ACTIVITY,
      actor_type: userId ? ActorType.USER : ActorType.SYSTEM,
      actor_id: userId,
      target_type: TargetType.USER,
      target_id: userId || undefined,
      severity: EventSeverity.HIGH,
      status: EventStatus.SUCCESS,
      security_level: threatLevel,
      metadata: {
        description,
        threat_level: threatLevel,
        timestamp: new Date().toISOString()
      },
      frontend_timestamp: Date.now(),
      frontend_session_id: eventLoggingService.getSessionId()
    });
  }, [logEvent]);

  const logRateLimitExceeded = useCallback(async (
    userId: string | null,
    endpoint: string,
    limit: number
  ) => {
    return logEvent({
      event_category: EventCategory.SECURITY,
      event_type: EventType.RATE_LIMIT_EXCEEDED,
      actor_type: userId ? ActorType.USER : ActorType.SYSTEM,
      actor_id: userId,
      target_type: TargetType.API,
      severity: EventSeverity.MEDIUM,
      status: EventStatus.SUCCESS,
      security_level: 'MEDIUM',
      metadata: {
        endpoint,
        limit,
        timestamp: new Date().toISOString()
      },
      frontend_timestamp: Date.now(),
      frontend_session_id: eventLoggingService.getSessionId()
    });
  }, [logEvent]);

  const logInvalidAccessAttempt = useCallback(async (
    userId: string | null,
    resource: string,
    reason: string
  ) => {
    return logEvent({
      event_category: EventCategory.SECURITY,
      event_type: EventType.INVALID_ACCESS_ATTEMPT,
      actor_type: userId ? ActorType.USER : ActorType.SYSTEM,
      actor_id: userId,
      target_type: TargetType.API,
      target_id: resource,
      severity: EventSeverity.MEDIUM,
      status: EventStatus.FAILED,
      security_level: 'MEDIUM',
      metadata: {
        resource,
        reason,
        timestamp: new Date().toISOString()
      },
      frontend_timestamp: Date.now(),
      frontend_session_id: eventLoggingService.getSessionId()
    });
  }, [logEvent]);

  return {
    logSuspiciousActivity,
    logRateLimitExceeded,
    logInvalidAccessAttempt,
    isLogging
  };
}

// Event query hook
export function useEventQuery(params?: EventQueryParams) {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const queryEvents = useCallback(async (queryParams: EventQueryParams) => {
    setLoading(true);
    setError(null);

    try {
      const result = await eventLoggingService.queryEvents(queryParams);
      setEvents(result);
      setTotalCount(result.length); // Backend should provide total count
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to query events';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshEvents = useCallback(() => {
    if (params) {
      queryEvents(params);
    }
  }, [params, queryEvents]);

  useEffect(() => {
    if (params) {
      queryEvents(params);
    }
  }, [params, queryEvents]);

  return {
    events,
    loading,
    error,
    totalCount,
    queryEvents,
    refreshEvents
  };
}

// Event statistics hook
export function useEventStatistics() {
  const [statistics, setStatistics] = useState<EventStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const stats = await eventLoggingService.getEventStatistics();
      setStatistics(stats);
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get statistics';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatistics();
  }, [refreshStatistics]);

  return {
    statistics,
    loading,
    error,
    refreshStatistics
  };
}

// Auto-logging hook for component lifecycle events
export function useAutoEventLogging(componentName: string, metadata?: Record<string, any>) {
  const { logEvent } = useEventLogging();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      logEvent({
        event_category: EventCategory.API,
        event_type: EventType.API_REQUEST,
        actor_type: ActorType.USER,
        actor_id: user.id,
        target_type: TargetType.API,
        severity: EventSeverity.LOW,
        status: EventStatus.SUCCESS,
        security_level: 'LOW',
        metadata: {
          component: componentName,
          action: 'component_mounted',
          user_role: user.role,
          ...metadata
        },
        frontend_timestamp: Date.now(),
        frontend_session_id: eventLoggingService.getSessionId()
      });
    }

    return () => {
      if (user?.id) {
        logEvent({
          event_category: EventCategory.API,
          event_type: EventType.API_REQUEST,
          actor_type: ActorType.USER,
          actor_id: user.id,
          target_type: TargetType.API,
          severity: EventSeverity.LOW,
          status: EventStatus.SUCCESS,
          security_level: 'LOW',
          metadata: {
            component: componentName,
            action: 'component_unmounted',
            user_role: user.role,
            ...metadata
          },
          frontend_timestamp: Date.now(),
          frontend_session_id: eventLoggingService.getSessionId()
        });
      }
    };
  }, [componentName, user, metadata, logEvent]);
}