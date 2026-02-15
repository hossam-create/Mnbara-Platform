/**
 * EventLoggerService - Backend-Only Event Logging
 * SECURITY-CRITICAL: Bank-facing infrastructure
 * 
 * ABSOLUTE RULES:
 * - Frontend CANNOT write directly
 * - No public endpoint
 * - Validates: taxonomy, actor permissions, context schema
 * - If validation fails → reject (no silent logging)
 * - No try/catch swallowing
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  EventType,
  EventCategory,
  ActorType,
  TargetType,
} from '../types/event.enums';
import {
  validateEventAgainstTaxonomy,
  getAllowedEventTypes,
  getAllowedActorTypes,
  getAllowedTargetTypes,
} from '../types/event.taxonomy';
import { EventValidationError } from './event-logger.errors';
import {
  validateAuthEventContext,
  validateSearchEventContext,
  validateAuctionEventContext,
  validateBidEventContext,
  validateEscrowEventContext,
  validateWalletEventContext,
  validateDisputeEventContext,
  validateSystemEventContext,
} from './event-logger.validators';

/**
 * Event Logger Input
 */
export interface LogEventInput {
  event_type: EventType;
  event_category: EventCategory;
  actor_type: ActorType;
  actor_id: string;
  target_type: TargetType;
  target_id: string;
  context: Record<string, any>;
  ip_address?: string | null;
  user_agent?: string | null;
}

/**
 * EventLoggerService - Backend-only event logging with strict validation
 */
@Injectable()
export class EventLoggerService {
  private readonly logger = new Logger(EventLoggerService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Log authentication event
   * Allowed event types: AUTH_LOGIN_SUCCESS, AUTH_LOGIN_FAILED, AUTH_LOGOUT, AUTH_TOKEN_ISSUED, AUTH_TOKEN_REVOKED
   */
  async logAuthEvent(
    eventType: EventType,
    actorId: string,
    context: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Validate event type is in AUTH category
    if (!getAllowedEventTypes(EventCategory.AUTH).includes(eventType)) {
      throw new EventValidationError(
        `Event type ${eventType} not allowed in AUTH category`
      );
    }

    // Validate context
    validateAuthEventContext(context);

    // Log event
    await this.logEvent({
      event_type: eventType,
      event_category: EventCategory.AUTH,
      actor_type: ActorType.USER,
      actor_id: actorId,
      target_type: TargetType.USER,
      target_id: actorId,
      context,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  /**
   * Log search event
   * Allowed event types: SEARCH_QUERY_EXECUTED, SEARCH_FILTER_APPLIED, SEARCH_RESULT_VIEWED, SEARCH_RECOMMENDATION_SHOWN
   */
  async logSearchEvent(
    eventType: EventType,
    actorId: string,
    targetId: string,
    targetType: TargetType,
    context: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Validate event type is in SEARCH category
    if (!getAllowedEventTypes(EventCategory.SEARCH).includes(eventType)) {
      throw new EventValidationError(
        `Event type ${eventType} not allowed in SEARCH category`
      );
    }

    // Validate target type
    if (!getAllowedTargetTypes(EventCategory.SEARCH).includes(targetType)) {
      throw new EventValidationError(
        `Target type ${targetType} not allowed in SEARCH category`
      );
    }

    // Validate context
    validateSearchEventContext(context);

    // Log event
    await this.logEvent({
      event_type: eventType,
      event_category: EventCategory.SEARCH,
      actor_type: ActorType.USER,
      actor_id: actorId,
      target_type: targetType,
      target_id: targetId,
      context,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  /**
   * Log auction event
   * Allowed event types: AUCTION_CREATED, AUCTION_STARTED, AUCTION_ENDED_NORMAL, AUCTION_ENDED_RESERVE_NOT_MET, AUCTION_EXTENDED, AUCTION_CANCELLED, AUCTION_SETTLED, AUCTION_FINALIZED
   */
  async logAuctionEvent(
    eventType: EventType,
    actorId: string,
    auctionId: string,
    actorType: ActorType,
    context: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Validate event type is in AUCTION category
    if (!getAllowedEventTypes(EventCategory.AUCTION).includes(eventType)) {
      throw new EventValidationError(
        `Event type ${eventType} not allowed in AUCTION category`
      );
    }

    // Validate actor type
    if (!getAllowedActorTypes(EventCategory.AUCTION).includes(actorType)) {
      throw new EventValidationError(
        `Actor type ${actorType} not allowed in AUCTION category`
      );
    }

    // Validate context
    validateAuctionEventContext(context);

    // Log event
    await this.logEvent({
      event_type: eventType,
      event_category: EventCategory.AUCTION,
      actor_type: actorType,
      actor_id: actorId,
      target_type: TargetType.AUCTION,
      target_id: auctionId,
      context,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  /**
   * Log bid event
   * Allowed event types: BID_PLACED, BID_OUTBID, BID_WON, BID_CANCELLED, BID_INVALIDATED, BID_THROTTLED, PROXY_BID_ACTIVATED
   */
  async logBidEvent(
    eventType: EventType,
    actorId: string,
    bidId: string,
    context: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Validate event type is in BID category
    if (!getAllowedEventTypes(EventCategory.BID).includes(eventType)) {
      throw new EventValidationError(
        `Event type ${eventType} not allowed in BID category`
      );
    }

    // Validate context
    validateBidEventContext(context);

    // Log event
    await this.logEvent({
      event_type: eventType,
      event_category: EventCategory.BID,
      actor_type: ActorType.USER,
      actor_id: actorId,
      target_type: TargetType.BID,
      target_id: bidId,
      context,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  /**
   * Log escrow event
   * Allowed event types: ESCROW_CREATED, ESCROW_HELD, ESCROW_RELEASED, ESCROW_REFUNDED, ESCROW_DISPUTE_FLAGGED
   */
  async logEscrowEvent(
    eventType: EventType,
    actorId: string,
    escrowId: string,
    actorType: ActorType,
    context: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Validate event type is in ESCROW category
    if (!getAllowedEventTypes(EventCategory.ESCROW).includes(eventType)) {
      throw new EventValidationError(
        `Event type ${eventType} not allowed in ESCROW category`
      );
    }

    // Validate actor type
    if (!getAllowedActorTypes(EventCategory.ESCROW).includes(actorType)) {
      throw new EventValidationError(
        `Actor type ${actorType} not allowed in ESCROW category`
      );
    }

    // Validate context
    validateEscrowEventContext(context);

    // Log event
    await this.logEvent({
      event_type: eventType,
      event_category: EventCategory.ESCROW,
      actor_type: actorType,
      actor_id: actorId,
      target_type: TargetType.ESCROW,
      target_id: escrowId,
      context,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  /**
   * Log wallet event
   * Allowed event types: WALLET_CREATED, WALLET_BALANCE_VIEWED, WALLET_TRANSACTION_VIEWED, WALLET_TRANSFER_INITIATED, WALLET_TRANSFER_COMPLETED
   */
  async logWalletEvent(
    eventType: EventType,
    actorId: string,
    walletId: string,
    actorType: ActorType,
    context: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Validate event type is in WALLET category
    if (!getAllowedEventTypes(EventCategory.WALLET).includes(eventType)) {
      throw new EventValidationError(
        `Event type ${eventType} not allowed in WALLET category`
      );
    }

    // Validate actor type
    if (!getAllowedActorTypes(EventCategory.WALLET).includes(actorType)) {
      throw new EventValidationError(
        `Actor type ${actorType} not allowed in WALLET category`
      );
    }

    // Validate context
    validateWalletEventContext(context);

    // Log event
    await this.logEvent({
      event_type: eventType,
      event_category: EventCategory.WALLET,
      actor_type: actorType,
      actor_id: actorId,
      target_type: TargetType.WALLET,
      target_id: walletId,
      context,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  /**
   * Log dispute event
   * Allowed event types: DISPUTE_CREATED, DISPUTE_EVIDENCE_SUBMITTED, DISPUTE_UNDER_REVIEW, DISPUTE_RESOLVED, DISPUTE_ESCALATED, DISPUTE_APPEALED
   */
  async logDisputeEvent(
    eventType: EventType,
    actorId: string,
    disputeId: string,
    actorType: ActorType,
    context: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    // Validate event type is in DISPUTE category
    if (!getAllowedEventTypes(EventCategory.DISPUTE).includes(eventType)) {
      throw new EventValidationError(
        `Event type ${eventType} not allowed in DISPUTE category`
      );
    }

    // Validate actor type
    if (!getAllowedActorTypes(EventCategory.DISPUTE).includes(actorType)) {
      throw new EventValidationError(
        `Actor type ${actorType} not allowed in DISPUTE category`
      );
    }

    // Validate context
    validateDisputeEventContext(context);

    // Log event
    await this.logEvent({
      event_type: eventType,
      event_category: EventCategory.DISPUTE,
      actor_type: actorType,
      actor_id: actorId,
      target_type: TargetType.DISPUTE,
      target_id: disputeId,
      context,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  }

  /**
   * Log system event
   * Allowed event types: SYSTEM_STARTUP, SYSTEM_SHUTDOWN, SYSTEM_ERROR, SYSTEM_WARNING, SYSTEM_MAINTENANCE_START, SYSTEM_MAINTENANCE_END
   */
  async logSystemEvent(
    eventType: EventType,
    context: Record<string, any>,
    actorId: string = 'SYSTEM'
  ): Promise<void> {
    // Validate event type is in SYSTEM category
    if (!getAllowedEventTypes(EventCategory.SYSTEM).includes(eventType)) {
      throw new EventValidationError(
        `Event type ${eventType} not allowed in SYSTEM category`
      );
    }

    // Validate context
    validateSystemEventContext(context);

    // Log event
    await this.logEvent({
      event_type: eventType,
      event_category: EventCategory.SYSTEM,
      actor_type: ActorType.SYSTEM,
      actor_id: actorId,
      target_type: TargetType.SYSTEM,
      target_id: 'SYSTEM',
      context,
    });
  }

  /**
   * Internal: Log event with full validation
   * PRIVATE METHOD - NOT EXPOSED TO FRONTEND
   */
  private async logEvent(input: LogEventInput): Promise<void> {
    // Validate against taxonomy
    const taxonomyValidation = validateEventAgainstTaxonomy(
      input.event_type,
      input.event_category,
      input.actor_type,
      input.target_type
    );

    if (!taxonomyValidation.valid) {
      const errors = taxonomyValidation.errors.join('; ');
      throw new EventValidationError(`Taxonomy validation failed: ${errors}`);
    }

    // Validate actor ID is not empty
    if (!input.actor_id || input.actor_id.trim() === '') {
      throw new EventValidationError('actor_id cannot be empty');
    }

    // Validate target ID is not empty
    if (!input.target_id || input.target_id.trim() === '') {
      throw new EventValidationError('target_id cannot be empty');
    }

    // Validate context is object
    if (typeof input.context !== 'object' || input.context === null) {
      throw new EventValidationError('context must be a valid object');
    }

    // Log to database
    try {
      await this.prisma.event.create({
        data: {
          event_type: input.event_type,
          event_category: input.event_category,
          actor_type: input.actor_type,
          actor_id: input.actor_id,
          target_type: input.target_type,
          target_id: input.target_id,
          context: input.context,
          ip_address: input.ip_address || null,
          user_agent: input.user_agent || null,
        },
      });

      this.logger.debug(
        `Event logged: ${input.event_type} by ${input.actor_id}`
      );
    } catch (error) {
      // Do NOT swallow errors
      this.logger.error(
        `Failed to log event: ${input.event_type}`,
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }
}
