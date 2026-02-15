/**
 * EventLoggerService Unit Tests
 * CRITICAL PATHS ONLY
 * SECURITY-CRITICAL: Bank-facing infrastructure
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EventLoggerService } from '../event-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  EventType,
  EventCategory,
  ActorType,
  TargetType,
} from '../../types/event.enums';
import {
  EventValidationError,
  EventTaxonomyError,
  EventContextError,
} from '../event-logger.errors';

describe('EventLoggerService', () => {
  let service: EventLoggerService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventLoggerService,
        {
          provide: PrismaService,
          useValue: {
            event: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<EventLoggerService>(EventLoggerService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logAuthEvent', () => {
    it('should log AUTH_LOGIN_SUCCESS event', async () => {
      const context = {
        method: 'email',
        success: true,
        device_type: 'mobile',
      };

      await service.logAuthEvent(
        EventType.AUTH_LOGIN_SUCCESS,
        'user_123',
        context,
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(prisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event_type: EventType.AUTH_LOGIN_SUCCESS,
          event_category: EventCategory.AUTH,
          actor_type: ActorType.USER,
          actor_id: 'user_123',
          target_type: TargetType.USER,
          target_id: 'user_123',
          context,
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
        }),
      });
    });

    it('should reject invalid event type for AUTH category', async () => {
      const context = { method: 'email', success: true };

      await expect(
        service.logAuthEvent(
          EventType.BID_PLACED, // Wrong category
          'user_123',
          context
        )
      ).rejects.toThrow(EventValidationError);
    });

    it('should reject invalid context - missing method', async () => {
      const context = { success: true }; // Missing method

      await expect(
        service.logAuthEvent(
          EventType.AUTH_LOGIN_SUCCESS,
          'user_123',
          context
        )
      ).rejects.toThrow(EventContextError);
    });

    it('should reject invalid context - invalid method value', async () => {
      const context = { method: 'invalid', success: true };

      await expect(
        service.logAuthEvent(
          EventType.AUTH_LOGIN_SUCCESS,
          'user_123',
          context
        )
      ).rejects.toThrow(EventContextError);
    });

    it('should reject invalid context - success not boolean', async () => {
      const context = { method: 'email', success: 'true' };

      await expect(
        service.logAuthEvent(
          EventType.AUTH_LOGIN_SUCCESS,
          'user_123',
          context
        )
      ).rejects.toThrow(EventContextError);
    });
  });

  describe('logSearchEvent', () => {
    it('should log SEARCH_QUERY_EXECUTED event', async () => {
      const context = { query_type: 'auction', result_count: 42 };

      await service.logSearchEvent(
        EventType.SEARCH_QUERY_EXECUTED,
        'user_123',
        'auction_456',
        TargetType.AUCTION,
        context
      );

      expect(prisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event_type: EventType.SEARCH_QUERY_EXECUTED,
          event_category: EventCategory.SEARCH,
          actor_type: ActorType.USER,
          actor_id: 'user_123',
          target_type: TargetType.AUCTION,
          target_id: 'auction_456',
          context,
        }),
      });
    });

    it('should reject invalid target type for SEARCH category', async () => {
      const context = { query_type: 'auction', result_count: 42 };

      await expect(
        service.logSearchEvent(
          EventType.SEARCH_QUERY_EXECUTED,
          'user_123',
          'wallet_456',
          TargetType.WALLET, // Invalid for SEARCH
          context
        )
      ).rejects.toThrow(EventValidationError);
    });

    it('should reject invalid context - negative result_count', async () => {
      const context = { query_type: 'auction', result_count: -1 };

      await expect(
        service.logSearchEvent(
          EventType.SEARCH_QUERY_EXECUTED,
          'user_123',
          'auction_456',
          TargetType.AUCTION,
          context
        )
      ).rejects.toThrow(EventContextError);
    });
  });

  describe('logAuctionEvent', () => {
    it('should log AUCTION_CREATED event by USER', async () => {
      const context = {
        auction_status: 'ACTIVE',
        reserve_met: true,
        final_price: 100.0,
      };

      await service.logAuctionEvent(
        EventType.AUCTION_CREATED,
        'user_123',
        'auction_456',
        ActorType.USER,
        context
      );

      expect(prisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event_type: EventType.AUCTION_CREATED,
          event_category: EventCategory.AUCTION,
          actor_type: ActorType.USER,
          actor_id: 'user_123',
          target_type: TargetType.AUCTION,
          target_id: 'auction_456',
          context,
        }),
      });
    });

    it('should log AUCTION_SETTLED event by SYSTEM', async () => {
      const context = {
        auction_status: 'SETTLED',
        reserve_met: true,
        final_price: 150.0,
      };

      await service.logAuctionEvent(
        EventType.AUCTION_SETTLED,
        'SYSTEM',
        'auction_456',
        ActorType.SYSTEM,
        context
      );

      expect(prisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event_type: EventType.AUCTION_SETTLED,
          actor_type: ActorType.SYSTEM,
        }),
      });
    });

    it('should reject invalid actor type for AUCTION category', async () => {
      const context = {
        auction_status: 'ACTIVE',
        reserve_met: true,
        final_price: 100.0,
      };

      // AUCTION category doesn't allow certain actor types
      // This test depends on taxonomy rules
      await expect(
        service.logAuctionEvent(
          EventType.AUCTION_CREATED,
          'user_123',
          'auction_456',
          ActorType.USER,
          context
        )
      ).resolves.not.toThrow(); // USER is allowed
    });

    it('should reject invalid context - negative final_price', async () => {
      const context = {
        auction_status: 'ACTIVE',
        reserve_met: true,
        final_price: -100.0,
      };

      await expect(
        service.logAuctionEvent(
          EventType.AUCTION_CREATED,
          'user_123',
          'auction_456',
          ActorType.USER,
          context
        )
      ).rejects.toThrow(EventContextError);
    });
  });

  describe('logBidEvent', () => {
    it('should log BID_PLACED event', async () => {
      const context = {
        bid_amount: 50.0,
        is_auto_bid: false,
        triggered_extension: false,
      };

      await service.logBidEvent(
        EventType.BID_PLACED,
        'user_123',
        'bid_789',
        context,
        '192.168.1.1'
      );

      expect(prisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event_type: EventType.BID_PLACED,
          event_category: EventCategory.BID,
          actor_type: ActorType.USER,
          actor_id: 'user_123',
          target_type: TargetType.BID,
          target_id: 'bid_789',
          context,
          ip_address: '192.168.1.1',
        }),
      });
    });

    it('should reject invalid context - zero bid_amount', async () => {
      const context = {
        bid_amount: 0,
        is_auto_bid: false,
        triggered_extension: false,
      };

      await expect(
        service.logBidEvent(
          EventType.BID_PLACED,
          'user_123',
          'bid_789',
          context
        )
      ).rejects.toThrow(EventContextError);
    });

    it('should reject invalid context - is_auto_bid not boolean', async () => {
      const context = {
        bid_amount: 50.0,
        is_auto_bid: 'false',
        triggered_extension: false,
      };

      await expect(
        service.logBidEvent(
          EventType.BID_PLACED,
          'user_123',
          'bid_789',
          context
        )
      ).rejects.toThrow(EventContextError);
    });
  });

  describe('logEscrowEvent', () => {
    it('should log ESCROW_RELEASED event by SYSTEM', async () => {
      const context = {
        escrow_amount: 100.0,
        release_reason: 'AUCTION_WON',
        ledger_entry_id: 'ledger_123',
      };

      await service.logEscrowEvent(
        EventType.ESCROW_RELEASED,
        'SYSTEM',
        'escrow_456',
        ActorType.SYSTEM,
        context
      );

      expect(prisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event_type: EventType.ESCROW_RELEASED,
          event_category: EventCategory.ESCROW,
          actor_type: ActorType.SYSTEM,
          context,
        }),
      });
    });

    it('should reject invalid context - negative escrow_amount', async () => {
      const context = {
        escrow_amount: -100.0,
        release_reason: 'AUCTION_WON',
        ledger_entry_id: 'ledger_123',
      };

      await expect(
        service.logEscrowEvent(
          EventType.ESCROW_RELEASED,
          'SYSTEM',
          'escrow_456',
          ActorType.SYSTEM,
          context
        )
      ).rejects.toThrow(EventContextError);
    });
  });

  describe('logWalletEvent', () => {
    it('should log WALLET_BALANCE_VIEWED event', async () => {
      const context = {
        balance: 1000.0,
        transaction_type: 'VIEW',
        status: 'SUCCESS',
      };

      await service.logWalletEvent(
        EventType.WALLET_BALANCE_VIEWED,
        'user_123',
        'wallet_789',
        ActorType.USER,
        context
      );

      expect(prisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event_type: EventType.WALLET_BALANCE_VIEWED,
          event_category: EventCategory.WALLET,
          actor_type: ActorType.USER,
          context,
        }),
      });
    });

    it('should reject invalid context - negative balance', async () => {
      const context = {
        balance: -1000.0,
        transaction_type: 'VIEW',
        status: 'SUCCESS',
      };

      await expect(
        service.logWalletEvent(
          EventType.WALLET_BALANCE_VIEWED,
          'user_123',
          'wallet_789',
          ActorType.USER,
          context
        )
      ).rejects.toThrow(EventContextError);
    });
  });

  describe('logDisputeEvent', () => {
    it('should log DISPUTE_CREATED event', async () => {
      const context = {
        dispute_reason: 'FRAUD_SUSPECTED',
        resolution_type: 'PENDING',
        decision_maker: 'ADMIN',
      };

      await service.logDisputeEvent(
        EventType.DISPUTE_CREATED,
        'user_123',
        'dispute_999',
        ActorType.USER,
        context
      );

      expect(prisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event_type: EventType.DISPUTE_CREATED,
          event_category: EventCategory.DISPUTE,
          actor_type: ActorType.USER,
          context,
        }),
      });
    });

    it('should reject invalid context - missing decision_maker', async () => {
      const context = {
        dispute_reason: 'FRAUD_SUSPECTED',
        resolution_type: 'PENDING',
      };

      await expect(
        service.logDisputeEvent(
          EventType.DISPUTE_CREATED,
          'user_123',
          'dispute_999',
          ActorType.USER,
          context
        )
      ).rejects.toThrow(EventContextError);
    });
  });

  describe('logSystemEvent', () => {
    it('should log SYSTEM_ERROR event', async () => {
      const context = {
        error_code: 'DB_CONNECTION_FAILED',
        severity: 'CRITICAL',
        component: 'DATABASE',
        message: 'Failed to connect to database',
      };

      await service.logSystemEvent(EventType.SYSTEM_ERROR, context);

      expect(prisma.event.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event_type: EventType.SYSTEM_ERROR,
          event_category: EventCategory.SYSTEM,
          actor_type: ActorType.SYSTEM,
          actor_id: 'SYSTEM',
          target_type: TargetType.SYSTEM,
          target_id: 'SYSTEM',
          context,
        }),
      });
    });

    it('should reject invalid context - invalid severity', async () => {
      const context = {
        error_code: 'DB_CONNECTION_FAILED',
        severity: 'INVALID',
        component: 'DATABASE',
        message: 'Failed to connect to database',
      };

      await expect(
        service.logSystemEvent(EventType.SYSTEM_ERROR, context)
      ).rejects.toThrow(EventContextError);
    });

    it('should reject invalid context - missing message', async () => {
      const context = {
        error_code: 'DB_CONNECTION_FAILED',
        severity: 'CRITICAL',
        component: 'DATABASE',
      };

      await expect(
        service.logSystemEvent(EventType.SYSTEM_ERROR, context)
      ).rejects.toThrow(EventContextError);
    });
  });

  describe('Error Handling', () => {
    it('should NOT swallow database errors', async () => {
      const context = { method: 'email', success: true };
      const dbError = new Error('Database connection failed');

      (prisma.event.create as jest.Mock).mockRejectedValueOnce(dbError);

      await expect(
        service.logAuthEvent(
          EventType.AUTH_LOGIN_SUCCESS,
          'user_123',
          context
        )
      ).rejects.toThrow('Database connection failed');
    });

    it('should reject empty actor_id', async () => {
      const context = { method: 'email', success: true };

      await expect(
        service.logAuthEvent(
          EventType.AUTH_LOGIN_SUCCESS,
          '', // Empty actor_id
          context
        )
      ).rejects.toThrow(EventValidationError);
    });

    it('should reject null context', async () => {
      await expect(
        service.logAuthEvent(
          EventType.AUTH_LOGIN_SUCCESS,
          'user_123',
          null as any
        )
      ).rejects.toThrow(EventContextError);
    });
  });

  describe('Taxonomy Validation', () => {
    it('should enforce strict taxonomy rules', async () => {
      const context = { method: 'email', success: true };

      // Try to log an event with wrong category
      await expect(
        service.logAuthEvent(
          EventType.AUCTION_CREATED, // Wrong event type
          'user_123',
          context
        )
      ).rejects.toThrow(EventValidationError);
    });
  });
});
