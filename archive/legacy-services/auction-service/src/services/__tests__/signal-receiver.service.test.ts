/**
 * Signal Receiver Service Tests
 * SECURITY-CRITICAL: Bank-facing infrastructure
 * 
 * Tests signal validation, conversion, and event logging
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SignalReceiverService, SignalType, SignalPayload } from '../signal-receiver.service';
import { EventLoggerService } from '../event-logger.service';
import { EventType, EventCategory, ActorType, TargetType } from '../../types/event.enums';

/**
 * Mock EventLoggerService
 */
class MockEventLoggerService {
  logSearchEvent = vi.fn().mockResolvedValue(undefined);
  logBidEvent = vi.fn().mockResolvedValue(undefined);
  logDisputeEvent = vi.fn().mockResolvedValue(undefined);
}

describe('SignalReceiverService', () => {
  let service: SignalReceiverService;
  let mockEventLogger: MockEventLoggerService;

  beforeEach(() => {
    mockEventLogger = new MockEventLoggerService();
    service = new SignalReceiverService(mockEventLogger as any);
  });

  describe('Signal Type Validation', () => {
    it('should accept valid SEARCH_PERFORMED signal', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.SEARCH_PERFORMED,
        context: { query_type: 'general', result_count: 10 },
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(result.success).toBe(true);
      expect(mockEventLogger.logSearchEvent).toHaveBeenCalled();
    });

    it('should accept valid PRODUCT_VIEWED signal', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.PRODUCT_VIEWED,
        target_id: 'product-123',
        context: { view_duration: 30, source: 'search' },
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(mockEventLogger.logSearchEvent).toHaveBeenCalled();
    });

    it('should accept valid AUCTION_VIEWED signal', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.AUCTION_VIEWED,
        target_id: 'auction-123',
        context: { result_position: 1, rank: 1 },
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(mockEventLogger.logSearchEvent).toHaveBeenCalled();
    });

    it('should accept valid BID_ATTEMPT signal', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.BID_ATTEMPT,
        target_id: 'bid-123',
        context: { bid_amount: 100, is_auto_bid: false, triggered_extension: false },
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(mockEventLogger.logBidEvent).toHaveBeenCalled();
    });

    it('should accept valid BID_REJECTED signal', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.BID_REJECTED,
        target_id: 'bid-123',
        context: { rejection_reason: 'insufficient_funds', bid_amount: 100 },
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(mockEventLogger.logBidEvent).toHaveBeenCalled();
    });

    it('should accept valid CHECKOUT_STARTED signal', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.CHECKOUT_STARTED,
        context: { item_count: 2, total_amount: 250 },
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(mockEventLogger.logSearchEvent).toHaveBeenCalled();
    });

    it('should accept valid PAYMENT_REDIRECTED signal', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.PAYMENT_REDIRECTED,
        target_id: 'payment-123',
        context: { payment_method: 'stripe', amount: 250 },
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(mockEventLogger.logSearchEvent).toHaveBeenCalled();
    });

    it('should accept valid DISPUTE_OPENED signal', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.DISPUTE_OPENED,
        target_id: 'dispute-123',
        context: { dispute_reason: 'item_not_received', description: 'Item never arrived' },
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(mockEventLogger.logDisputeEvent).toHaveBeenCalled();
    });

    it('should accept valid DELIVERY_CONFIRMED signal', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.DELIVERY_CONFIRMED,
        target_id: 'delivery-123',
        context: { delivery_date: '2026-01-16T10:00:00Z', tracking_number: 'TRACK123' },
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      expect(mockEventLogger.logSearchEvent).toHaveBeenCalled();
    });

    it('should reject invalid signal type', async () => {
      const payload: any = {
        signal_type: 'INVALID_SIGNAL',
        context: {},
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid signal type');
    });
  });

  describe('Target ID Validation', () => {
    it('should require target_id for PRODUCT_VIEWED', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.PRODUCT_VIEWED,
        // Missing target_id
        context: {},
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('requires target_id');
    });

    it('should require target_id for AUCTION_VIEWED', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.AUCTION_VIEWED,
        // Missing target_id
        context: {},
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('requires target_id');
    });

    it('should require target_id for BID_ATTEMPT', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.BID_ATTEMPT,
        // Missing target_id
        context: {},
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('requires target_id');
    });

    it('should reject empty target_id', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.PRODUCT_VIEWED,
        target_id: '', // Empty
        context: {},
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('requires target_id');
    });

    it('should allow missing target_id for SEARCH_PERFORMED', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.SEARCH_PERFORMED,
        // No target_id
        context: { query_type: 'general', result_count: 10 },
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
    });

    it('should allow missing target_id for CHECKOUT_STARTED', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.CHECKOUT_STARTED,
        // No target_id
        context: { item_count: 2, total_amount: 250 },
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Context Validation', () => {
    it('should validate SEARCH_PERFORMED context', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.SEARCH_PERFORMED,
        context: { query_type: 'category', result_count: 25 },
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      const call = mockEventLogger.logSearchEvent.mock.calls[0];
      expect(call[3]).toEqual({
        query_type: 'category',
        result_count: 25,
      });
    });

    it('should sanitize negative result_count', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.SEARCH_PERFORMED,
        context: { query_type: 'general', result_count: -5 },
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      const call = mockEventLogger.logSearchEvent.mock.calls[0];
      expect(call[3].result_count).toBe(0);
    });

    it('should validate BID_ATTEMPT context', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.BID_ATTEMPT,
        target_id: 'bid-123',
        context: { bid_amount: 150, is_auto_bid: true, triggered_extension: true },
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      const call = mockEventLogger.logBidEvent.mock.calls[0];
      expect(call[2]).toEqual({
        bid_amount: 150,
        is_auto_bid: true,
        triggered_extension: true,
      });
    });

    it('should sanitize negative bid_amount', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.BID_ATTEMPT,
        target_id: 'bid-123',
        context: { bid_amount: -100, is_auto_bid: false, triggered_extension: false },
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      const call = mockEventLogger.logBidEvent.mock.calls[0];
      expect(call[2].bid_amount).toBe(0);
    });

    it('should validate DISPUTE_OPENED context', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.DISPUTE_OPENED,
        target_id: 'dispute-123',
        context: { dispute_reason: 'damaged_item', description: 'Item arrived damaged' },
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      const call = mockEventLogger.logDisputeEvent.mock.calls[0];
      expect(call[3]).toEqual({
        dispute_reason: 'damaged_item',
        description: 'Item arrived damaged',
      });
    });

    it('should truncate long dispute description', async () => {
      const longDescription = 'x'.repeat(1000);
      const payload: SignalPayload = {
        signal_type: SignalType.DISPUTE_OPENED,
        target_id: 'dispute-123',
        context: { dispute_reason: 'other', description: longDescription },
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(true);
      const call = mockEventLogger.logDisputeEvent.mock.calls[0];
      expect(call[3].description.length).toBeLessThanOrEqual(500);
    });
  });

  describe('User Context', () => {
    it('should use provided userId', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.SEARCH_PERFORMED,
        context: { query_type: 'general', result_count: 10 },
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-456',
      });

      expect(result.success).toBe(true);
      const call = mockEventLogger.logSearchEvent.mock.calls[0];
      expect(call[1]).toBe('user-456');
    });

    it('should use ANONYMOUS when userId not provided', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.SEARCH_PERFORMED,
        context: { query_type: 'general', result_count: 10 },
      };

      const result = await service.receiveSignal(payload, {
        // No userId
      });

      expect(result.success).toBe(true);
      const call = mockEventLogger.logSearchEvent.mock.calls[0];
      expect(call[1]).toBe('ANONYMOUS');
    });

    it('should pass ipAddress to event logger', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.SEARCH_PERFORMED,
        context: { query_type: 'general', result_count: 10 },
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/120',
      });

      expect(result.success).toBe(true);
      const call = mockEventLogger.logSearchEvent.mock.calls[0];
      expect(call[5]).toBe('10.0.0.1');
      expect(call[6]).toBe('Chrome/120');
    });
  });

  describe('Error Handling', () => {
    it('should handle EventLoggerService errors gracefully', async () => {
      mockEventLogger.logSearchEvent.mockRejectedValueOnce(new Error('Database error'));

      const payload: SignalPayload = {
        signal_type: SignalType.SEARCH_PERFORMED,
        context: { query_type: 'general', result_count: 10 },
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Error processing signal');
    });

    it('should handle null payload gracefully', async () => {
      const result = await service.receiveSignal(null as any, {
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
    });

    it('should handle undefined signal_type gracefully', async () => {
      const payload: any = {
        // Missing signal_type
        context: {},
      };

      const result = await service.receiveSignal(payload, {
        userId: 'user-123',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Signal-to-Event Mapping', () => {
    it('should map SEARCH_PERFORMED to SEARCH_QUERY_EXECUTED', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.SEARCH_PERFORMED,
        context: { query_type: 'general', result_count: 10 },
      };

      await service.receiveSignal(payload, { userId: 'user-123' });

      const call = mockEventLogger.logSearchEvent.mock.calls[0];
      expect(call[0]).toBe(EventType.SEARCH_QUERY_EXECUTED);
    });

    it('should map PRODUCT_VIEWED to PRODUCT_VIEWED', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.PRODUCT_VIEWED,
        target_id: 'product-123',
        context: { view_duration: 30, source: 'search' },
      };

      await service.receiveSignal(payload, { userId: 'user-123' });

      const call = mockEventLogger.logSearchEvent.mock.calls[0];
      expect(call[0]).toBe(EventType.PRODUCT_VIEWED);
    });

    it('should map AUCTION_VIEWED to SEARCH_RESULT_VIEWED', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.AUCTION_VIEWED,
        target_id: 'auction-123',
        context: { result_position: 1, rank: 1 },
      };

      await service.receiveSignal(payload, { userId: 'user-123' });

      const call = mockEventLogger.logSearchEvent.mock.calls[0];
      expect(call[0]).toBe(EventType.SEARCH_RESULT_VIEWED);
    });

    it('should map BID_ATTEMPT to BID_PLACED', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.BID_ATTEMPT,
        target_id: 'bid-123',
        context: { bid_amount: 100, is_auto_bid: false, triggered_extension: false },
      };

      await service.receiveSignal(payload, { userId: 'user-123' });

      const call = mockEventLogger.logBidEvent.mock.calls[0];
      expect(call[0]).toBe(EventType.BID_PLACED);
    });

    it('should map BID_REJECTED to BID_INVALIDATED', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.BID_REJECTED,
        target_id: 'bid-123',
        context: { rejection_reason: 'insufficient_funds', bid_amount: 100 },
      };

      await service.receiveSignal(payload, { userId: 'user-123' });

      const call = mockEventLogger.logBidEvent.mock.calls[0];
      expect(call[0]).toBe(EventType.BID_INVALIDATED);
    });

    it('should map CHECKOUT_STARTED to PAYMENT_INITIATED', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.CHECKOUT_STARTED,
        context: { item_count: 2, total_amount: 250 },
      };

      await service.receiveSignal(payload, { userId: 'user-123' });

      const call = mockEventLogger.logSearchEvent.mock.calls[0];
      expect(call[0]).toBe(EventType.PAYMENT_INITIATED);
    });

    it('should map PAYMENT_REDIRECTED to PAYMENT_INTENT_CREATED', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.PAYMENT_REDIRECTED,
        target_id: 'payment-123',
        context: { payment_method: 'stripe', amount: 250 },
      };

      await service.receiveSignal(payload, { userId: 'user-123' });

      const call = mockEventLogger.logSearchEvent.mock.calls[0];
      expect(call[0]).toBe(EventType.PAYMENT_INTENT_CREATED);
    });

    it('should map DISPUTE_OPENED to DISPUTE_CREATED', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.DISPUTE_OPENED,
        target_id: 'dispute-123',
        context: { dispute_reason: 'item_not_received', description: 'Item never arrived' },
      };

      await service.receiveSignal(payload, { userId: 'user-123' });

      const call = mockEventLogger.logDisputeEvent.mock.calls[0];
      expect(call[0]).toBe(EventType.DISPUTE_CREATED);
    });

    it('should map DELIVERY_CONFIRMED to DELIVERY_DELIVERED', async () => {
      const payload: SignalPayload = {
        signal_type: SignalType.DELIVERY_CONFIRMED,
        target_id: 'delivery-123',
        context: { delivery_date: '2026-01-16T10:00:00Z', tracking_number: 'TRACK123' },
      };

      await service.receiveSignal(payload, { userId: 'user-123' });

      const call = mockEventLogger.logSearchEvent.mock.calls[0];
      expect(call[0]).toBe(EventType.DELIVERY_DELIVERED);
    });
  });
});
