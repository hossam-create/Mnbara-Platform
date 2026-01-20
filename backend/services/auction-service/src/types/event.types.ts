/**
 * Event Logging System - SECURITY-CRITICAL
 * APPEND-ONLY event types
 * 
 * ABSOLUTE RULES:
 * - Events are APPEND-ONLY (no update, no delete)
 * - Events have NO business logic impact
 * - Events NEVER trigger financial actions
 * - Events are backend-authoritative only
 */

import { EventType, EventCategory, ActorType, TargetType } from './event.enums';

/**
 * Event - Canonical event model
 * IMMUTABLE after creation
 */
export interface Event {
  event_id: string;              // UUID
  event_type: EventType;         // Specific action
  event_category: EventCategory; // High-level grouping
  
  actor_type: ActorType;         // Who performed the action
  actor_id: string;              // ID of the actor
  
  target_type: TargetType;       // What entity was affected
  target_id: string;             // ID of the target entity
  
  context: Record<string, any>;  // Additional validated context
  
  ip_address: string | null;     // IP address of the actor
  user_agent: string | null;     // User agent of the actor
  
  created_at: Date;              // Immutable timestamp
}

/**
 * Event Creation Input
 * Used when creating new events
 */
export interface CreateEventInput {
  event_type: EventType;
  event_category: EventCategory;
  
  actor_type: ActorType;
  actor_id: string;
  
  target_type: TargetType;
  target_id: string;
  
  context?: Record<string, any>;
  
  ip_address?: string | null;
  user_agent?: string | null;
}

/**
 * Event Query Filters
 * Used for querying events (READ-ONLY)
 */
export interface EventQueryFilters {
  event_type?: EventType | EventType[];
  event_category?: EventCategory | EventCategory[];
  
  actor_type?: ActorType;
  actor_id?: string;
  
  target_type?: TargetType;
  target_id?: string;
  
  created_after?: Date;
  created_before?: Date;
  
  limit?: number;
  offset?: number;
}

/**
 * Event Context Schemas
 * Validated context structures for different event types
 */

export interface UserLoginContext {
  success: boolean;
  method: 'email' | 'oauth' | 'sso';
  device_type?: string;
  location?: string;
}

export interface AuctionCreatedContext {
  auction_id: string;
  starting_bid: number;
  reserve_price_set: boolean;
  duration_minutes: number;
}

export interface BidPlacedContext {
  auction_id: string;
  bid_id: string;
  amount: number;
  is_auto_bid: boolean;
  triggered_extension: boolean;
}

export interface DisputeCreatedContext {
  dispute_id: string;
  auction_id: string;
  bid_id: string;
  reason: string;
}

export interface TrustActionCreatedContext {
  trust_action_id: string;
  action_type: string;
  severity: string;
  duration_minutes?: number;
}

export interface EnforcementActionCreatedContext {
  enforcement_action_id: string;
  action_type: string;
  tier: string;
  justification: string;
}

export interface PaymentInitiatedContext {
  payment_id: string;
  order_id: string;
  amount: number;
  currency: string;
  payment_method: string;
}

export interface SecurityAccessDeniedContext {
  resource: string;
  required_permission: string;
  reason: string;
}

/**
 * Event Statistics
 * READ-ONLY aggregated event data
 */
export interface EventStatistics {
  total_events: number;
  events_by_category: Record<EventCategory, number>;
  events_by_actor_type: Record<ActorType, number>;
  events_by_target_type: Record<TargetType, number>;
  time_range: {
    start: Date;
    end: Date;
  };
}
