/**
 * Signal Receiver Service
 * SECURITY-CRITICAL: Bank-facing infrastructure
 * 
 * ABSOLUTE RULES:
 * - Frontend sends SIGNAL only
 * - Backend decides legitimacy
 * - Backend decides to log or reject
 * - No business logic impact
 * - No financial actions triggered
 * - All validation failures are explicit
 */

import { EventLoggerService } from './event-logger.service';
import { EventType, EventCategory, ActorType, TargetType } from '../types/event.enums';

/**
 * Frontend signal types
 * These are the ONLY signals frontend can emit
 */
export enum SignalType {
  SEARCH_PERFORMED = 'SEARCH_PERFORMED',
  PRODUCT_VIEWED = 'PRODUCT_VIEWED',
  AUCTION_VIEWED = 'AUCTION_VIEWED',
  BID_ATTEMPT = 'BID_ATTEMPT',
  BID_REJECTED = 'BID_REJECTED',
  CHECKOUT_STARTED = 'CHECKOUT_STARTED',
  PAYMENT_REDIRECTED = 'PAYMENT_REDIRECTED',
  DISPUTE_OPENED = 'DISPUTE_OPENED',
  DELIVERY_CONFIRMED = 'DELIVERY_CONFIRMED',
}

/**
 * Signal payload from frontend
 */
export interface SignalPayload {
  signal_type: SignalType;
  target_id?: string;
  context?: Record<string, any>;
}

/**
 * Signal receiver context
 */
export interface SignalReceiverContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Signal-to-Event mapping
 * Maps frontend signals to backend events
 */
const SIGNAL_TO_EVENT_MAP: Record<SignalType, {
  eventType: EventType;
  eventCategory: EventCategory;
  targetType: TargetType;
}> = {
  [SignalType.SEARCH_PERFORMED]: {
    eventType: EventType.SEARCH_QUERY_EXECUTED,
    eventCategory: EventCategory.SEARCH,
    targetType: TargetType.AUCTION,
  },
  [SignalType.PRODUCT_VIEWED]: {
    eventType: EventType.PRODUCT_VIEWED,
    eventCategory: EventCategory.PRODUCT,
    targetType: TargetType.PRODUCT,
  },
  [SignalType.AUCTION_VIEWED]: {
    eventType: EventType.SEARCH_RESULT_VIEWED,
    eventCategory: EventCategory.SEARCH,
    targetType: TargetType.AUCTION,
  },
  [SignalType.BID_ATTEMPT]: {
    eventType: EventType.BID_PLACED,
    eventCategory: EventCategory.BID,
    targetType: TargetType.BID,
  },
  [SignalType.BID_REJECTED]: {
    eventType: EventType.BID_INVALIDATED,
    eventCategory: EventCategory.BID,
    targetType: TargetType.BID,
  },
  [SignalType.CHECKOUT_STARTED]: {
    eventType: EventType.PAYMENT_INITIATED,
    eventCategory: EventCategory.PAYMENT,
    targetType: TargetType.PAYMENT,
  },
  [SignalType.PAYMENT_REDIRECTED]: {
    eventType: EventType.PAYMENT_INTENT_CREATED,
    eventCategory: EventCategory.PAYMENT,
    targetType: TargetType.PAYMENT,
  },
  [SignalType.DISPUTE_OPENED]: {
    eventType: EventType.DISPUTE_CREATED,
    eventCategory: EventCategory.DISPUTE,
    targetType: TargetType.DISPUTE,
  },
  [SignalType.DELIVERY_CONFIRMED]: {
    eventType: EventType.DELIVERY_DELIVERED,
    eventCategory: EventCategory.DELIVERY,
    targetType: TargetType.DELIVERY,
  },
};

/**
 * Signal Receiver Service
 * Converts frontend signals to backend events
 */
export class SignalReceiverService {
  constructor(private eventLogger: EventLoggerService) {}

  /**
   * Receive and process signal from frontend
   * 
   * RULES:
   * - Validate signal type
   * - Validate target_id (if required)
   * - Convert to event
   * - Log event via EventLoggerService
   * - Return success/failure
   * 
   * FIRE-AND-FORGET from frontend perspective:
   * - Frontend doesn't wait for response
   * - Frontend doesn't retry
   * - Backend decides legitimacy
   */
  async receiveSignal(
    payload: SignalPayload,
    context: SignalReceiverContext
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate signal type
      if (!this.isValidSignalType(payload.signal_type)) {
        return {
          success: false,
          message: `Invalid signal type: ${payload.signal_type}`,
        };
      }

      // Get event mapping
      const mapping = SIGNAL_TO_EVENT_MAP[payload.signal_type];
      if (!mapping) {
        return {
          success: false,
          message: `No event mapping for signal: ${payload.signal_type}`,
        };
      }

      // Validate target_id if required
      if (this.requiresTargetId(payload.signal_type)) {
        if (!payload.target_id || payload.target_id.trim() === '') {
          return {
            success: false,
            message: `Signal ${payload.signal_type} requires target_id`,
          };
        }
      }

      // Get actor ID (user ID from context)
      const actorId = context.userId || 'ANONYMOUS';

      // Build context for event
      const eventContext = this.buildEventContext(
        payload.signal_type,
        payload.context || {}
      );

      // Log event based on signal type
      await this.logEventFromSignal(
        mapping.eventType,
        mapping.eventCategory,
        mapping.targetType,
        actorId,
        payload.target_id,
        eventContext,
        context.ipAddress,
        context.userAgent
      );

      return {
        success: true,
        message: `Signal ${payload.signal_type} processed successfully`,
      };
    } catch (error) {
      // Log error but don't fail the request
      // Frontend is fire-and-forget, so we don't propagate errors
      console.error('[SIGNAL_RECEIVER_ERROR]', error);
      return {
        success: false,
        message: `Error processing signal: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check if signal type is valid
   */
  private isValidSignalType(signalType: any): signalType is SignalType {
    return Object.values(SignalType).includes(signalType);
  }

  /**
   * Check if signal requires target_id
   */
  private requiresTargetId(signalType: SignalType): boolean {
    const noTargetIdSignals = [
      SignalType.SEARCH_PERFORMED,
      SignalType.CHECKOUT_STARTED,
    ];
    return !noTargetIdSignals.includes(signalType);
  }

  /**
   * Build event context from signal context
   * Validates and sanitizes context data
   */
  private buildEventContext(
    signalType: SignalType,
    signalContext: Record<string, any>
  ): Record<string, any> {
    const context: Record<string, any> = {};

    switch (signalType) {
      case SignalType.SEARCH_PERFORMED:
        context.query_type = signalContext.query_type || 'general';
        context.result_count = Math.max(0, signalContext.result_count || 0);
        break;

      case SignalType.PRODUCT_VIEWED:
        context.view_duration = Math.max(0, signalContext.view_duration || 0);
        context.source = signalContext.source || 'search';
        break;

      case SignalType.AUCTION_VIEWED:
        context.result_position = Math.max(0, signalContext.result_position || 0);
        context.rank = Math.max(0, signalContext.rank || 0);
        break;

      case SignalType.BID_ATTEMPT:
        context.bid_amount = Math.max(0, signalContext.bid_amount || 0);
        context.is_auto_bid = Boolean(signalContext.is_auto_bid);
        context.triggered_extension = Boolean(signalContext.triggered_extension);
        break;

      case SignalType.BID_REJECTED:
        context.rejection_reason = signalContext.rejection_reason || 'unknown';
        context.bid_amount = Math.max(0, signalContext.bid_amount || 0);
        break;

      case SignalType.CHECKOUT_STARTED:
        context.item_count = Math.max(0, signalContext.item_count || 0);
        context.total_amount = Math.max(0, signalContext.total_amount || 0);
        break;

      case SignalType.PAYMENT_REDIRECTED:
        context.payment_method = signalContext.payment_method || 'unknown';
        context.amount = Math.max(0, signalContext.amount || 0);
        break;

      case SignalType.DISPUTE_OPENED:
        context.dispute_reason = signalContext.dispute_reason || 'other';
        context.description = String(signalContext.description || '').substring(0, 500);
        break;

      case SignalType.DELIVERY_CONFIRMED:
        context.delivery_date = signalContext.delivery_date || new Date().toISOString();
        context.tracking_number = signalContext.tracking_number || 'unknown';
        break;

      default:
        break;
    }

    return context;
  }

  /**
   * Log event from signal
   * Routes to appropriate EventLoggerService method
   */
  private async logEventFromSignal(
    eventType: EventType,
    eventCategory: EventCategory,
    targetType: TargetType,
    actorId: string,
    targetId: string | undefined,
    context: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    switch (eventCategory) {
      case EventCategory.SEARCH:
        await this.eventLogger.logSearchEvent(
          eventType,
          actorId,
          targetId || 'GENERAL',
          targetType,
          context,
          ipAddress,
          userAgent
        );
        break;

      case EventCategory.PRODUCT:
        await this.eventLogger.logSearchEvent(
          eventType,
          actorId,
          targetId || 'GENERAL',
          targetType,
          context,
          ipAddress,
          userAgent
        );
        break;

      case EventCategory.BID:
        await this.eventLogger.logBidEvent(
          eventType,
          actorId,
          targetId || 'UNKNOWN',
          context,
          ipAddress,
          userAgent
        );
        break;

      case EventCategory.PAYMENT:
        await this.eventLogger.logSearchEvent(
          eventType,
          actorId,
          targetId || 'UNKNOWN',
          targetType,
          context,
          ipAddress,
          userAgent
        );
        break;

      case EventCategory.DISPUTE:
        await this.eventLogger.logDisputeEvent(
          eventType,
          actorId,
          targetId || 'UNKNOWN',
          ActorType.USER,
          context,
          ipAddress,
          userAgent
        );
        break;

      case EventCategory.DELIVERY:
        await this.eventLogger.logSearchEvent(
          eventType,
          actorId,
          targetId || 'UNKNOWN',
          targetType,
          context,
          ipAddress,
          userAgent
        );
        break;

      default:
        // For other categories, use generic logging
        console.warn(`[SIGNAL_RECEIVER] No specific handler for category: ${eventCategory}`);
        break;
    }
  }
}

export default SignalReceiverService;
