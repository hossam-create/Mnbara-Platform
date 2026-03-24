/**
 * useEventSignal Hook - Frontend Signal Emitter
 * SECURITY-CRITICAL: Bank-facing infrastructure
 * 
 * ABSOLUTE RULES:
 * - Frontend does NOT decide event legitimacy
 * - Frontend sends SIGNAL only
 * - Backend decides to log or reject
 * - No retries
 * - No buffering
 * - No offline queue
 * - Fire-and-forget
 * - Zero business logic
 * - No fallback
 */

import { useCallback } from 'react';

/**
 * Signal types - Frontend can only emit these
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
 * Signal payload - Minimal data, backend validates
 */
export interface SignalPayload {
  signal_type: SignalType;
  target_id?: string;
  context?: Record<string, any>;
}

/**
 * useEventSignal Hook
 * Emits signals to backend without any business logic
 * Fire-and-forget: no retries, no buffering, no offline queue
 */
export function useEventSignal() {
  /**
   * Emit signal to backend
   * FIRE-AND-FORGET: No error handling, no retries, no fallback
   */
  const emitSignal = useCallback(
    async (payload: SignalPayload): Promise<void> => {
      // Send signal to backend
      // Backend decides if it's legitimate and logs it
      // Frontend does NOT wait for response
      // Frontend does NOT handle errors
      // Frontend does NOT retry
      fetch('/api/v1/signals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      // Fire-and-forget: no await, no error handling
    },
    []
  );

  /**
   * Emit SEARCH_PERFORMED signal
   */
  const emitSearchPerformed = useCallback(
    (targetId: string, context?: Record<string, any>): void => {
      emitSignal({
        signal_type: SignalType.SEARCH_PERFORMED,
        target_id: targetId,
        context,
      });
    },
    [emitSignal]
  );

  /**
   * Emit PRODUCT_VIEWED signal
   */
  const emitProductViewed = useCallback(
    (productId: string, context?: Record<string, any>): void => {
      emitSignal({
        signal_type: SignalType.PRODUCT_VIEWED,
        target_id: productId,
        context,
      });
    },
    [emitSignal]
  );

  /**
   * Emit AUCTION_VIEWED signal
   */
  const emitAuctionViewed = useCallback(
    (auctionId: string, context?: Record<string, any>): void => {
      emitSignal({
        signal_type: SignalType.AUCTION_VIEWED,
        target_id: auctionId,
        context,
      });
    },
    [emitSignal]
  );

  /**
   * Emit BID_ATTEMPT signal
   */
  const emitBidAttempt = useCallback(
    (auctionId: string, context?: Record<string, any>): void => {
      emitSignal({
        signal_type: SignalType.BID_ATTEMPT,
        target_id: auctionId,
        context,
      });
    },
    [emitSignal]
  );

  /**
   * Emit BID_REJECTED signal
   */
  const emitBidRejected = useCallback(
    (auctionId: string, context?: Record<string, any>): void => {
      emitSignal({
        signal_type: SignalType.BID_REJECTED,
        target_id: auctionId,
        context,
      });
    },
    [emitSignal]
  );

  /**
   * Emit CHECKOUT_STARTED signal
   */
  const emitCheckoutStarted = useCallback(
    (orderId: string, context?: Record<string, any>): void => {
      emitSignal({
        signal_type: SignalType.CHECKOUT_STARTED,
        target_id: orderId,
        context,
      });
    },
    [emitSignal]
  );

  /**
   * Emit PAYMENT_REDIRECTED signal
   */
  const emitPaymentRedirected = useCallback(
    (paymentId: string, context?: Record<string, any>): void => {
      emitSignal({
        signal_type: SignalType.PAYMENT_REDIRECTED,
        target_id: paymentId,
        context,
      });
    },
    [emitSignal]
  );

  /**
   * Emit DISPUTE_OPENED signal
   */
  const emitDisputeOpened = useCallback(
    (disputeId: string, context?: Record<string, any>): void => {
      emitSignal({
        signal_type: SignalType.DISPUTE_OPENED,
        target_id: disputeId,
        context,
      });
    },
    [emitSignal]
  );

  /**
   * Emit DELIVERY_CONFIRMED signal
   */
  const emitDeliveryConfirmed = useCallback(
    (deliveryId: string, context?: Record<string, any>): void => {
      emitSignal({
        signal_type: SignalType.DELIVERY_CONFIRMED,
        target_id: deliveryId,
        context,
      });
    },
    [emitSignal]
  );

  return {
    emitSignal,
    emitSearchPerformed,
    emitProductViewed,
    emitAuctionViewed,
    emitBidAttempt,
    emitBidRejected,
    emitCheckoutStarted,
    emitPaymentRedirected,
    emitDisputeOpened,
    emitDeliveryConfirmed,
  };
}

export default useEventSignal;
