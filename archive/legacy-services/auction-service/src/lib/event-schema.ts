/**
 * Event Schema & Types
 * 
 * Defines all event types and their schemas for the event streaming infrastructure.
 * Used for event producers and consumers across all services.
 */

// ============================================================
// EVENT TYPES
// ============================================================

export enum EventType {
  // Auction events
  AUCTION_CREATED = 'AUCTION_CREATED',
  AUCTION_STARTED = 'AUCTION_STARTED',
  AUCTION_ENDED = 'AUCTION_ENDED',
  AUCTION_EXTENDED = 'AUCTION_EXTENDED',

  // Bid events
  BID_PLACED = 'BID_PLACED',
  BID_OUTBID = 'BID_OUTBID',
  BID_INVALIDATED = 'BID_INVALIDATED',
  BID_WINNING = 'BID_WINNING',

  // Dispute events
  DISPUTE_CREATED = 'DISPUTE_CREATED',
  DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',
  DISPUTE_ESCALATED = 'DISPUTE_ESCALATED',

  // Trust events
  TRUST_SCORE_CALCULATED = 'TRUST_SCORE_CALCULATED',
  TRUST_ACTION_APPLIED = 'TRUST_ACTION_APPLIED',
  TRUST_ACTION_REVOKED = 'TRUST_ACTION_REVOKED',

  // Appeal events
  APPEAL_CREATED = 'APPEAL_CREATED',
  APPEAL_RESOLVED = 'APPEAL_RESOLVED',

  // Settlement events
  SETTLEMENT_INITIATED = 'SETTLEMENT_INITIATED',
  SETTLEMENT_COMPLETED = 'SETTLEMENT_COMPLETED',
  SETTLEMENT_FAILED = 'SETTLEMENT_FAILED',

  // Analytics events
  USER_ACTIVITY = 'USER_ACTIVITY',
  SYSTEM_HEALTH = 'SYSTEM_HEALTH',
}

// ============================================================
// BASE EVENT INTERFACE
// ============================================================

export interface BaseEvent {
  eventId: string; // UUID
  eventType: EventType;
  timestamp: Date;
  userId: number;
  auctionId?: number;
  bidId?: number;
  sequenceNumber: number; // For ordering
  version: string; // Schema version
  metadata?: Record<string, unknown>;
}

// ============================================================
// AUCTION EVENTS
// ============================================================

export interface AuctionCreatedEvent extends BaseEvent {
  eventType: EventType.AUCTION_CREATED;
  data: {
    sellerId: number;
    title: string;
    startingBid: number;
    reservePrice?: number;
    auctionEndsAt: Date;
  };
}

export interface AuctionStartedEvent extends BaseEvent {
  eventType: EventType.AUCTION_STARTED;
  data: {
    sellerId: number;
    currentBid: number;
  };
}

export interface AuctionEndedEvent extends BaseEvent {
  eventType: EventType.AUCTION_ENDED;
  data: {
    sellerId: number;
    winnerId?: number;
    finalPrice?: number;
    endReason: 'SOLD' | 'EXPIRED' | 'CANCELLED' | 'RESERVE_NOT_MET';
  };
}

export interface AuctionExtendedEvent extends BaseEvent {
  eventType: EventType.AUCTION_EXTENDED;
  data: {
    previousEndTime: Date;
    newEndTime: Date;
    extensionCount: number;
  };
}

// ============================================================
// BID EVENTS
// ============================================================

export interface BidPlacedEvent extends BaseEvent {
  eventType: EventType.BID_PLACED;
  data: {
    bidderId: number;
    amount: number;
    isAutoBid: boolean;
  };
}

export interface BidOutbidEvent extends BaseEvent {
  eventType: EventType.BID_OUTBID;
  data: {
    previousBidderId: number;
    newBidderId: number;
    newAmount: number;
  };
}

export interface BidInvalidatedEvent extends BaseEvent {
  eventType: EventType.BID_INVALIDATED;
  data: {
    bidderId: number;
    reason: string;
    escrowReleased: boolean;
  };
}

export interface BidWinningEvent extends BaseEvent {
  eventType: EventType.BID_WINNING;
  data: {
    bidderId: number;
    amount: number;
  };
}

// ============================================================
// DISPUTE EVENTS
// ============================================================

export interface DisputeCreatedEvent extends BaseEvent {
  eventType: EventType.DISPUTE_CREATED;
  data: {
    disputeId: number;
    reason: string;
    createdBy: string;
  };
}

export interface DisputeResolvedEvent extends BaseEvent {
  eventType: EventType.DISPUTE_RESOLVED;
  data: {
    disputeId: number;
    resolution: string;
    resolvedBy: string;
  };
}

export interface DisputeEscalatedEvent extends BaseEvent {
  eventType: EventType.DISPUTE_ESCALATED;
  data: {
    disputeId: number;
    escalationReason: string;
  };
}

// ============================================================
// TRUST EVENTS
// ============================================================

export interface TrustScoreCalculatedEvent extends BaseEvent {
  eventType: EventType.TRUST_SCORE_CALCULATED;
  data: {
    score: number;
    level: string;
    breakdown: Record<string, number>;
  };
}

export interface TrustActionAppliedEvent extends BaseEvent {
  eventType: EventType.TRUST_ACTION_APPLIED;
  data: {
    actionType: string;
    severity: string;
    reason: string;
  };
}

export interface TrustActionRevokedEvent extends BaseEvent {
  eventType: EventType.TRUST_ACTION_REVOKED;
  data: {
    actionType: string;
    reason: string;
  };
}

// ============================================================
// APPEAL EVENTS
// ============================================================

export interface AppealCreatedEvent extends BaseEvent {
  eventType: EventType.APPEAL_CREATED;
  data: {
    appealId: number;
    reason: string;
  };
}

export interface AppealResolvedEvent extends BaseEvent {
  eventType: EventType.APPEAL_RESOLVED;
  data: {
    appealId: number;
    resolution: string;
    resolvedBy: string;
  };
}

// ============================================================
// SETTLEMENT EVENTS
// ============================================================

export interface SettlementInitiatedEvent extends BaseEvent {
  eventType: EventType.SETTLEMENT_INITIATED;
  data: {
    winnerId: number;
    finalPrice: number;
  };
}

export interface SettlementCompletedEvent extends BaseEvent {
  eventType: EventType.SETTLEMENT_COMPLETED;
  data: {
    winnerId: number;
    finalPrice: number;
    transactionId: string;
  };
}

export interface SettlementFailedEvent extends BaseEvent {
  eventType: EventType.SETTLEMENT_FAILED;
  data: {
    winnerId: number;
    reason: string;
    retryCount: number;
  };
}

// ============================================================
// ANALYTICS EVENTS
// ============================================================

export interface UserActivityEvent extends BaseEvent {
  eventType: EventType.USER_ACTIVITY;
  data: {
    activityType: string;
    duration: number; // milliseconds
    success: boolean;
  };
}

export interface SystemHealthEvent extends BaseEvent {
  eventType: EventType.SYSTEM_HEALTH;
  data: {
    service: string;
    status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    metrics: Record<string, number>;
  };
}

// ============================================================
// UNION TYPE FOR ALL EVENTS
// ============================================================

export type AuctionEvent =
  | AuctionCreatedEvent
  | AuctionStartedEvent
  | AuctionEndedEvent
  | AuctionExtendedEvent;

export type BidEvent =
  | BidPlacedEvent
  | BidOutbidEvent
  | BidInvalidatedEvent
  | BidWinningEvent;

export type DisputeEvent =
  | DisputeCreatedEvent
  | DisputeResolvedEvent
  | DisputeEscalatedEvent;

export type TrustEvent =
  | TrustScoreCalculatedEvent
  | TrustActionAppliedEvent
  | TrustActionRevokedEvent;

export type AppealEvent =
  | AppealCreatedEvent
  | AppealResolvedEvent;

export type SettlementEvent =
  | SettlementInitiatedEvent
  | SettlementCompletedEvent
  | SettlementFailedEvent;

export type AnalyticsEvent =
  | UserActivityEvent
  | SystemHealthEvent;

export type Event =
  | AuctionEvent
  | BidEvent
  | DisputeEvent
  | TrustEvent
  | AppealEvent
  | SettlementEvent
  | AnalyticsEvent;

// ============================================================
// EVENT SCHEMA VALIDATION
// ============================================================

export function isValidEvent(event: unknown): event is Event {
  if (!event || typeof event !== 'object') {
    return false;
  }

  const e = event as Record<string, unknown>;

  // Check required fields
  if (
    !e.eventId ||
    !e.eventType ||
    !e.timestamp ||
    typeof e.userId !== 'number' ||
    typeof e.sequenceNumber !== 'number'
  ) {
    return false;
  }

  // Check if eventType is valid
  if (!Object.values(EventType).includes(e.eventType as EventType)) {
    return false;
  }

  return true;
}

// ============================================================
// EVENT BUILDER HELPERS
// ============================================================

export function createEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createBaseEvent(
  eventType: EventType,
  userId: number,
  sequenceNumber: number,
  auctionId?: number,
  bidId?: number
): Omit<BaseEvent, 'data'> {
  return {
    eventId: createEventId(),
    eventType,
    timestamp: new Date(),
    userId,
    auctionId,
    bidId,
    sequenceNumber,
    version: '1.0.0',
  };
}
