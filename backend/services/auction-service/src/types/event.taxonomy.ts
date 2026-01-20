/**
 * STRICT EVENT TAXONOMY - MARKETPLACE PLATFORM
 * VALIDATED ENUMS AGAINST TAXONOMY
 * 
 * RULES:
 * - NO free-text event types
 * - NO dynamic enums
 * - MANDATORY categories only
 * - Strict actor/target validation
 * - Bank-facing auditable
 */

import { EventType, EventCategory, ActorType, TargetType } from './event.enums';

/**
 * Taxonomy Definition - Maps categories to allowed event types
 */
export const EVENT_TAXONOMY = {
  // AUTH Category (5 events)
  [EventCategory.AUTH]: {
    allowed_events: [
      EventType.AUTH_LOGIN_SUCCESS,
      EventType.AUTH_LOGIN_FAILED,
      EventType.AUTH_LOGOUT,
      EventType.AUTH_TOKEN_ISSUED,
      EventType.AUTH_TOKEN_REVOKED,
    ],
    allowed_actors: [ActorType.USER, ActorType.SYSTEM],
    allowed_targets: [TargetType.USER],
  },

  // SEARCH Category (4 events)
  [EventCategory.SEARCH]: {
    allowed_events: [
      EventType.SEARCH_QUERY_EXECUTED,
      EventType.SEARCH_FILTER_APPLIED,
      EventType.SEARCH_RESULT_VIEWED,
      EventType.SEARCH_RECOMMENDATION_SHOWN,
    ],
    allowed_actors: [ActorType.USER, ActorType.SYSTEM],
    allowed_targets: [TargetType.AUCTION, TargetType.PRODUCT],
  },

  // PRODUCT Category (6 events)
  [EventCategory.PRODUCT]: {
    allowed_events: [
      EventType.PRODUCT_CREATED,
      EventType.PRODUCT_UPDATED,
      EventType.PRODUCT_PUBLISHED,
      EventType.PRODUCT_UNPUBLISHED,
      EventType.PRODUCT_DELETED,
      EventType.PRODUCT_VIEWED,
    ],
    allowed_actors: [ActorType.USER, ActorType.ADMIN, ActorType.SYSTEM],
    allowed_targets: [TargetType.PRODUCT, TargetType.AUCTION],
  },

  // AUCTION Category (8 events)
  [EventCategory.AUCTION]: {
    allowed_events: [
      EventType.AUCTION_CREATED,
      EventType.AUCTION_STARTED,
      EventType.AUCTION_ENDED_NORMAL,
      EventType.AUCTION_ENDED_RESERVE_NOT_MET,
      EventType.AUCTION_EXTENDED,
      EventType.AUCTION_CANCELLED,
      EventType.AUCTION_SETTLED,
      EventType.AUCTION_FINALIZED,
    ],
    allowed_actors: [ActorType.USER, ActorType.ADMIN, ActorType.SYSTEM],
    allowed_targets: [TargetType.AUCTION],
  },

  // BID Category (7 events)
  [EventCategory.BID]: {
    allowed_events: [
      EventType.BID_PLACED,
      EventType.BID_OUTBID,
      EventType.BID_WON,
      EventType.BID_CANCELLED,
      EventType.BID_INVALIDATED,
      EventType.BID_THROTTLED,
      EventType.PROXY_BID_ACTIVATED,
    ],
    allowed_actors: [ActorType.USER, ActorType.SYSTEM],
    allowed_targets: [TargetType.BID, TargetType.AUCTION],
  },

  // ESCROW Category (5 events)
  [EventCategory.ESCROW]: {
    allowed_events: [
      EventType.ESCROW_CREATED,
      EventType.ESCROW_HELD,
      EventType.ESCROW_RELEASED,
      EventType.ESCROW_REFUNDED,
      EventType.ESCROW_DISPUTE_FLAGGED,
    ],
    allowed_actors: [ActorType.USER, ActorType.ADMIN, ActorType.SYSTEM],
    allowed_targets: [TargetType.ESCROW, TargetType.BID, TargetType.ORDER],
  },

  // WALLET Category (5 events)
  [EventCategory.WALLET]: {
    allowed_events: [
      EventType.WALLET_CREATED,
      EventType.WALLET_BALANCE_VIEWED,
      EventType.WALLET_TRANSACTION_VIEWED,
      EventType.WALLET_TRANSFER_INITIATED,
      EventType.WALLET_TRANSFER_COMPLETED,
    ],
    allowed_actors: [ActorType.USER, ActorType.ADMIN, ActorType.SYSTEM],
    allowed_targets: [TargetType.WALLET, TargetType.USER],
  },

  // PAYMENT Category (6 events)
  [EventCategory.PAYMENT]: {
    allowed_events: [
      EventType.PAYMENT_INITIATED,
      EventType.PAYMENT_INTENT_CREATED,
      EventType.PAYMENT_COMPLETED,
      EventType.PAYMENT_FAILED,
      EventType.PAYMENT_REFUNDED,
      EventType.PAYMENT_WEBHOOK_RECEIVED,
    ],
    allowed_actors: [ActorType.USER, ActorType.SYSTEM],
    allowed_targets: [TargetType.PAYMENT, TargetType.ORDER],
  },

  // DELIVERY Category (6 events)
  [EventCategory.DELIVERY]: {
    allowed_events: [
      EventType.DELIVERY_CREATED,
      EventType.DELIVERY_PICKED_UP,
      EventType.DELIVERY_IN_TRANSIT,
      EventType.DELIVERY_DELIVERED,
      EventType.DELIVERY_FAILED,
      EventType.DELIVERY_CANCELLED,
    ],
    allowed_actors: [ActorType.USER, ActorType.ADMIN, ActorType.SYSTEM],
    allowed_targets: [TargetType.ORDER, TargetType.DELIVERY],
  },

  // DISPUTE Category (6 events)
  [EventCategory.DISPUTE]: {
    allowed_events: [
      EventType.DISPUTE_CREATED,
      EventType.DISPUTE_EVIDENCE_SUBMITTED,
      EventType.DISPUTE_UNDER_REVIEW,
      EventType.DISPUTE_RESOLVED,
      EventType.DISPUTE_ESCALATED,
      EventType.DISPUTE_APPEALED,
    ],
    allowed_actors: [ActorType.USER, ActorType.ADMIN, ActorType.SYSTEM],
    allowed_targets: [TargetType.DISPUTE, TargetType.BID, TargetType.ORDER],
  },

  // TRUST Category (8 events)
  [EventCategory.TRUST]: {
    allowed_events: [
      EventType.TRUST_SCORE_CALCULATED,
      EventType.TRUST_SCORE_UPDATED,
      EventType.TRUST_ACTION_CREATED,
      EventType.TRUST_ACTION_LIFTED,
      EventType.TRUST_ACTION_EXPIRED,
      EventType.TRUST_APPEAL_SUBMITTED,
      EventType.TRUST_APPEAL_APPROVED,
      EventType.TRUST_APPEAL_REJECTED,
    ],
    allowed_actors: [ActorType.USER, ActorType.ADMIN, ActorType.SYSTEM],
    allowed_targets: [TargetType.USER, TargetType.TRUST_ACTION],
  },

  // SYSTEM Category (6 events)
  [EventCategory.SYSTEM]: {
    allowed_events: [
      EventType.SYSTEM_STARTUP,
      EventType.SYSTEM_SHUTDOWN,
      EventType.SYSTEM_ERROR,
      EventType.SYSTEM_WARNING,
      EventType.SYSTEM_MAINTENANCE_START,
      EventType.SYSTEM_MAINTENANCE_END,
    ],
    allowed_actors: [ActorType.SYSTEM, ActorType.ADMIN],
    allowed_targets: [TargetType.SYSTEM],
  },
} as const;

/**
 * Validation function - Ensures event conforms to taxonomy
 */
export function validateEventAgainstTaxonomy(
  eventType: EventType,
  eventCategory: EventCategory,
  actorType: ActorType,
  targetType: TargetType
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if category exists in taxonomy
  if (!EVENT_TAXONOMY[eventCategory]) {
    errors.push(`Invalid category: ${eventCategory}`);
    return { valid: false, errors };
  }

  const categoryRules = EVENT_TAXONOMY[eventCategory];

  // Check if event type is allowed in category
  if (!categoryRules.allowed_events.includes(eventType)) {
    errors.push(
      `Event type ${eventType} not allowed in category ${eventCategory}`
    );
  }

  // Check if actor type is allowed
  if (!categoryRules.allowed_actors.includes(actorType)) {
    errors.push(
      `Actor type ${actorType} not allowed in category ${eventCategory}`
    );
  }

  // Check if target type is allowed
  if (!categoryRules.allowed_targets.includes(targetType)) {
    errors.push(
      `Target type ${targetType} not allowed in category ${eventCategory}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get allowed event types for a category
 */
export function getAllowedEventTypes(
  category: EventCategory
): EventType[] {
  return EVENT_TAXONOMY[category]?.allowed_events || [];
}

/**
 * Get allowed actor types for a category
 */
export function getAllowedActorTypes(
  category: EventCategory
): ActorType[] {
  return EVENT_TAXONOMY[category]?.allowed_actors || [];
}

/**
 * Get allowed target types for a category
 */
export function getAllowedTargetTypes(
  category: EventCategory
): TargetType[] {
  return EVENT_TAXONOMY[category]?.allowed_targets || [];
}

/**
 * Get category for an event type
 */
export function getCategoryForEventType(eventType: EventType): EventCategory | null {
  for (const [category, rules] of Object.entries(EVENT_TAXONOMY)) {
    if (rules.allowed_events.includes(eventType)) {
      return category as EventCategory;
    }
  }
  return null;
}

/**
 * Taxonomy Statistics
 */
export const TAXONOMY_STATS = {
  total_categories: 12,
  total_event_types: 68,
  categories: {
    AUTH: 5,
    SEARCH: 4,
    PRODUCT: 6,
    AUCTION: 8,
    BID: 7,
    ESCROW: 5,
    WALLET: 5,
    PAYMENT: 6,
    DELIVERY: 6,
    DISPUTE: 6,
    TRUST: 8,
    SYSTEM: 6,
  },
} as const;
