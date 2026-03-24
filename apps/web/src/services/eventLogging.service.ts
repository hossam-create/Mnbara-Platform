/**
 * Global Event Logging Service
 * SECURITY: All events must be validated and logged via backend API
 * Frontend logging is informational only - backend enforces security
 */

import {
  SecurityEvent,
  CreateSecurityEventRequest,
  SecurityEventResponse,
  EventQueryParams,
  EventStatistics,
  EventValidationRule,
  EventCategory,
  EventType,
  ActorType,
  TargetType,
  EventSeverity,
  EventStatus
} from '../types/eventLogging.types';
import { getAuthHeaders } from './api/auth.service';

// Event Validation Rules - Strict taxonomy enforcement
const EVENT_VALIDATION_RULES: EventValidationRule[] = [
  // Authentication Events
  {
    category: EventCategory.AUTHENTICATION,
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
    required_fields: ['ip_address', 'user_agent']
  },
  
  // Authorization Events
  {
    category: EventCategory.AUTHORIZATION,
    allowed_types: [
      EventType.PERMISSION_CHECK,
      EventType.PERMISSION_DENIED,
      EventType.ROLE_ASSIGNED,
      EventType.ROLE_REMOVED
    ],
    required_actor_types: [ActorType.USER, ActorType.ADMIN, ActorType.OPS],
    required_target_types: [TargetType.USER],
    max_metadata_size: 2048, // 2KB
    required_fields: ['permission', 'resource']
  },
  
  // Payment Events
  {
    category: EventCategory.PAYMENT,
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
    required_fields: ['amount', 'currency', 'payment_method']
  },
  
  // Auction Events
  {
    category: EventCategory.AUCTION,
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
    required_fields: ['auction_id', 'bid_amount']
  },
  
  // Security Events
  {
    category: EventCategory.SECURITY,
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
    required_fields: ['threat_level', 'description']
  }
];

class EventLoggingService {
  private static instance: EventLoggingService;
  private sessionId: string;
  private eventQueue: CreateSecurityEventRequest[] = [];
  private isProcessingQueue = false;
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly BATCH_SIZE = 10;
  private readonly RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.startQueueProcessor();
  }

  static getInstance(): EventLoggingService {
    if (!EventLoggingService.instance) {
      EventLoggingService.instance = new EventLoggingService();
    }
    return EventLoggingService.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async startQueueProcessor(): Promise<void> {
    setInterval(async () => {
      if (this.eventQueue.length > 0 && !this.isProcessingQueue) {
        await this.processEventQueue();
      }
    }, 5000); // Process queue every 5 seconds
  }

  private async processEventQueue(): Promise<void> {
    if (this.isProcessingQueue || this.eventQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    const eventsToProcess = this.eventQueue.splice(0, this.BATCH_SIZE);
    
    try {
      // SECURITY: Send events to backend for validation and logging
      const response = await fetch('/api/v1/events/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          events: eventsToProcess,
          batch_id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          frontend_session_id: this.sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to log events: ${response.status}`);
      }

      const result = await response.json();
      
      // SECURITY: Backend validates all events and returns validation results
      if (result.invalid_events && result.invalid_events.length > 0) {
        console.warn('Some events failed backend validation:', result.invalid_events);
        
        // Log validation failures as security events
        result.invalid_events.forEach((invalidEvent: any) => {
          this.logEvent({
            event_category: EventCategory.SECURITY,
            event_type: EventType.INVALID_ACCESS_ATTEMPT,
            actor_type: ActorType.SYSTEM,
            actor_id: null,
            target_type: TargetType.API,
            severity: EventSeverity.MEDIUM,
            status: EventStatus.FAILED,
            security_level: 'MEDIUM',
            frontend_timestamp: Date.now(),
            frontend_session_id: this.sessionId,
            metadata: {
              validation_error: invalidEvent.error,
              original_event: invalidEvent.event,
              source: 'frontend_event_validation'
            }
          });
        });
      }
    } catch (error) {
      console.error('Failed to process event queue:', error);
      
      // Re-add failed events to queue (with limit to prevent infinite loop)
      if (this.eventQueue.length < this.MAX_QUEUE_SIZE) {
        this.eventQueue.unshift(...eventsToProcess.slice(0, 5));
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Validate event against strict taxonomy rules
  private validateEvent(event: CreateSecurityEventRequest): { valid: boolean; error?: string } {
    const rule = EVENT_VALIDATION_RULES.find(r => r.category === event.event_category);
    
    if (!rule) {
      return { valid: false, error: `No validation rule found for category: ${event.event_category}` };
    }

    // Check if event type is allowed for this category
    if (!rule.allowed_types.includes(event.event_type)) {
      return { 
        valid: false, 
        error: `Event type ${event.event_type} not allowed for category ${event.event_category}` 
      };
    }

    // Check actor type
    if (!rule.required_actor_types.includes(event.actor_type)) {
      return { 
        valid: false, 
        error: `Actor type ${event.actor_type} not allowed for category ${event.event_category}` 
      };
    }

    // Check target type
    if (!rule.required_target_types.includes(event.target_type)) {
      return { 
        valid: false, 
        error: `Target type ${event.target_type} not allowed for category ${event.event_category}` 
      };
    }

    // Validate metadata size
    if (event.metadata) {
      const metadataSize = JSON.stringify(event.metadata).length;
      if (metadataSize > rule.max_metadata_size) {
        return { 
          valid: false, 
          error: `Metadata size ${metadataSize} exceeds maximum ${rule.max_metadata_size}` 
        };
      }
    }

    // Validate required fields in metadata
    if (rule.required_fields.length > 0 && event.metadata) {
      for (const field of rule.required_fields) {
        if (!(field in event.metadata)) {
          return { 
            valid: false, 
            error: `Required metadata field missing: ${field}` 
          };
        }
      }
    }

    return { valid: true };
  }

  // Main method to log an event
  async logEvent(eventData: CreateSecurityEventRequest): Promise<SecurityEventResponse> {
    // SECURITY: Validate event against strict taxonomy
    const validation = this.validateEvent(eventData);
    if (!validation.valid) {
      console.error('Event validation failed:', validation.error);
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error || 'Event validation failed'
        }
      };
    }

    // Add frontend tracking information
    const eventWithTracking: CreateSecurityEventRequest = {
      ...eventData,
      frontend_timestamp: Date.now(),
      frontend_session_id: this.sessionId
    };

    // Add to queue for batch processing
    if (this.eventQueue.length < this.MAX_QUEUE_SIZE) {
      this.eventQueue.push(eventWithTracking);
    } else {
      console.warn('Event queue full, dropping event:', eventData.event_type);
      return {
        success: false,
        error: {
          code: 'QUEUE_FULL',
          message: 'Event queue is full'
        }
      };
    }

    // For critical events, log immediately
    if (eventData.severity === EventSeverity.CRITICAL || 
        eventData.event_category === EventCategory.SECURITY) {
      await this.logEventImmediate(eventWithTracking);
    }

    return {
      success: true,
      event: {
        ...eventWithTracking,
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Log critical events immediately
  private async logEventImmediate(event: CreateSecurityEventRequest): Promise<void> {
    try {
      const response = await fetch('/api/v1/events/immediate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        throw new Error(`Failed to log critical event: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to log critical event immediately:', error);
      // Continue - event is still in queue for retry
    }
  }

  // Query events from backend
  async queryEvents(params: EventQueryParams): Promise<SecurityEvent[]> {
    try {
      const queryString = new URLSearchParams(
        Object.entries(params).filter(([_, value]) => value !== undefined)
          .reduce((acc, [key, value]) => ({ ...acc, [key]: String(value) }), {})
      ).toString();

      const response = await fetch(`/api/v1/events?${queryString}`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to query events: ${response.status}`);
      }

      const result = await response.json();
      return result.events || [];
    } catch (error) {
      console.error('Failed to query events:', error);
      return [];
    }
  }

  // Get event statistics
  async getEventStatistics(): Promise<EventStatistics | null> {
    try {
      const response = await fetch('/api/v1/events/statistics', {
        method: 'GET',
        headers: {
          ...getAuthHeaders()
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get event statistics: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get event statistics:', error);
      return null;
    }
  }

  // Get current session ID
  getSessionId(): string {
    return this.sessionId;
  }

  // Generate a new session ID (useful for login/logout)
  regenerateSessionId(): void {
    this.sessionId = this.generateSessionId();
  }

  // Get queue status
  getQueueStatus(): { size: number; is_processing: boolean } {
    return {
      size: this.eventQueue.length,
      is_processing: this.isProcessingQueue
    };
  }
}

// Export singleton instance
export const eventLoggingService = EventLoggingService.getInstance();

// Convenience functions for common event types
export const logAuthenticationEvent = async (
  eventType: EventType,
  actorId: string,
  metadata?: Record<string, any>
): Promise<SecurityEventResponse> => {
  return eventLoggingService.logEvent({
    event_category: EventCategory.AUTHENTICATION,
    event_type: eventType,
    actor_type: ActorType.USER,
    actor_id: actorId,
    target_type: TargetType.USER,
    target_id: actorId,
    severity: getSeverityForAuthEvent(eventType),
    status: getStatusForAuthEvent(eventType),
    security_level: getSecurityLevelForAuthEvent(eventType),
    metadata,
    frontend_timestamp: Date.now(),
    frontend_session_id: eventLoggingService.getSessionId()
  });
};

export const logAuthorizationEvent = async (
  eventType: EventType,
  actorId: string,
  targetId: string,
  metadata?: Record<string, any>
): Promise<SecurityEventResponse> => {
  return eventLoggingService.logEvent({
    event_category: EventCategory.AUTHORIZATION,
    event_type: eventType,
    actor_type: ActorType.USER,
    actor_id: actorId,
    target_type: TargetType.USER,
    target_id: targetId,
    severity: EventSeverity.MEDIUM,
    status: EventStatus.SUCCESS,
    security_level: 'MEDIUM',
    metadata,
    frontend_timestamp: Date.now(),
    frontend_session_id: eventLoggingService.getSessionId()
  });
};

export const logPaymentEvent = async (
  eventType: EventType,
  actorId: string,
  targetId: string,
  metadata?: Record<string, any>
): Promise<SecurityEventResponse> => {
  return eventLoggingService.logEvent({
    event_category: EventCategory.PAYMENT,
    event_type: eventType,
    actor_type: ActorType.USER,
    actor_id: actorId,
    target_type: TargetType.PAYMENT,
    target_id: targetId,
    severity: getSeverityForPaymentEvent(eventType),
    status: getStatusForPaymentEvent(eventType),
    security_level: getSecurityLevelForPaymentEvent(eventType),
    metadata,
    frontend_timestamp: Date.now(),
    frontend_session_id: eventLoggingService.getSessionId()
  });
};

export const logSecurityEvent = async (
  eventType: EventType,
  actorType: ActorType,
  actorId: string | null,
  metadata?: Record<string, any>
): Promise<SecurityEventResponse> => {
  return eventLoggingService.logEvent({
    event_category: EventCategory.SECURITY,
    event_type: eventType,
    actor_type: actorType,
    actor_id: actorId,
    target_type: TargetType.SYSTEM,
    severity: EventSeverity.HIGH,
    status: EventStatus.SUCCESS,
    security_level: 'HIGH',
    metadata,
    frontend_timestamp: Date.now(),
    frontend_session_id: eventLoggingService.getSessionId()
  });
};

// Helper functions for event severity/status mapping
function getSeverityForAuthEvent(eventType: EventType): EventSeverity {
  switch (eventType) {
    case EventType.LOGIN_FAILURE:
      return EventSeverity.MEDIUM;
    case EventType.PASSWORD_RESET_SUCCESS:
      return EventSeverity.HIGH;
    default:
      return EventSeverity.LOW;
  }
}

function getStatusForAuthEvent(eventType: EventType): EventStatus {
  switch (eventType) {
    case EventType.LOGIN_FAILURE:
      return EventStatus.FAILED;
    case EventType.LOGIN_SUCCESS:
    case EventType.PASSWORD_RESET_SUCCESS:
      return EventStatus.SUCCESS;
    default:
      return EventStatus.PENDING;
  }
}

function getSecurityLevelForAuthEvent(eventType: EventType): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  switch (eventType) {
    case EventType.LOGIN_FAILURE:
      return 'MEDIUM';
    case EventType.PASSWORD_RESET_SUCCESS:
      return 'HIGH';
    default:
      return 'LOW';
  }
}

function getSeverityForPaymentEvent(eventType: EventType): EventSeverity {
  switch (eventType) {
    case EventType.PAYMENT_INTENT_FAILED:
      return EventSeverity.HIGH;
    case EventType.PAYMENT_INTENT_CONFIRMED:
      return EventSeverity.MEDIUM;
    default:
      return EventSeverity.LOW;
  }
}

function getStatusForPaymentEvent(eventType: EventType): EventStatus {
  switch (eventType) {
    case EventType.PAYMENT_INTENT_FAILED:
      return EventStatus.FAILED;
    case EventType.PAYMENT_INTENT_CONFIRMED:
      return EventStatus.SUCCESS;
    default:
      return EventStatus.PENDING;
  }
}

function getSecurityLevelForPaymentEvent(eventType: EventType): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  switch (eventType) {
    case EventType.PAYMENT_INTENT_FAILED:
      return 'HIGH';
    case EventType.PAYMENT_INTENT_CONFIRMED:
      return 'MEDIUM';
    default:
      return 'LOW';
  }
}