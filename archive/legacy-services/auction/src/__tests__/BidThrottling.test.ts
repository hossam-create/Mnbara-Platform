import { BidThrottling } from '../services/BidThrottling.service';
import { BidThrottlingRequest, ThrottlingDecision, ThrottlingReason } from '../types/BidThrottling.types';
import { bidThrottlingConfig } from '../config/bidThrottling.config';

describe('BidThrottling Service', () => {
  let bidThrottling: BidThrottling;

  beforeEach(() => {
    bidThrottling = new BidThrottling();
  });

  afterEach(() => {
    bidThrottling.reset();
  });

  describe('Basic Functionality', () => {
    it('should allow first bid from legitimate user', async () => {
      const request: BidThrottlingRequest = {
        userId: 'user-1',
        auctionId: 'auction-1',
        ipAddress: '192.168.1.1',
        bidAmount: 100,
        timestamp: new Date()
      };

      const result = await bidThrottling.evaluateBid(request);

      expect(result.decision).toBe(ThrottlingDecision.ALLOW);
      expect(result.message).toBe('Bid allowed');
      expect(result.metadata.userId).toBe('user-1');
      expect(result.metadata.auctionId).toBe('auction-1');
    });

    it('should track statistics correctly', async () => {
      const request: BidThrottlingRequest = {
        userId: 'user-1',
        auctionId: 'auction-1',
        ipAddress: '192.168.1.1',
        bidAmount: 100,
        timestamp: new Date()
      };

      await bidThrottling.evaluateBid(request);
      const stats = bidThrottling.getStatistics();

      expect(stats.totalRequests).toBe(1);
      expect(stats.allowedRequests).toBe(1);
      expect(stats.tempBlockedRequests).toBe(0);
      expect(stats.flaggedRequests).toBe(0);
    });
  });

  describe('User Rate Limits', () => {
    it('should temporarily block user exceeding per-minute limit', async () => {
      const request: BidThrottlingRequest = {
        userId: 'user-1',
        auctionId: 'auction-1',
        ipAddress: '192.168.1.1',
        bidAmount: 100,
        timestamp: new Date()
      };

      // Submit bids up to the limit
      for (let i = 0; i < bidThrottlingConfig.maxBidsPerMinutePerUser; i++) {
        const result = await bidThrottling.evaluateBid(request);
        expect(result.decision).toBe(ThrottlingDecision.ALLOW);
      }

      // Next bid should be blocked
      const blockResult = await bidThrottling.evaluateBid(request);
      expect(blockResult.decision).toBe(ThrottlingDecision.TEMP_BLOCK);
      expect(blockResult.reason).toBe(ThrottlingReason.USER_RATE_LIMIT_EXCEEDED);
      expect(blockResult.metadata.blockedUntil).toBeDefined();
    });

    it('should temporarily block user exceeding per-hour limit', async () => {
      const request: BidThrottlingRequest = {
        userId: 'user-1',
        auctionId: 'auction-1',
        ipAddress: '192.168.1.1',
        bidAmount: 100,
        timestamp: new Date()
      };

      // Simulate bids over an hour period
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      for (let i = 0; i < bidThrottlingConfig.maxBidsPerHourPerUser; i++) {
        const bidRequest = {
          ...request,
          timestamp: new Date(oneHourAgo.getTime() + i * 60 * 1000) // 1 minute apart
        };
        await bidThrottling.evaluateBid(bidRequest);
      }

      // Next bid should be blocked
      const blockResult = await bidThrottling.evaluateBid(request);
      expect(blockResult.decision).toBe(ThrottlingDecision.TEMP_BLOCK);
      expect(blockResult.reason).toBe(ThrottlingReason.USER_RATE_LIMIT_EXCEEDED);
    });

    it('should block user exceeding per-auction limit', async () => {
      const request: BidThrottlingRequest = {
        userId: 'user-1',
        auctionId: 'auction-1',
        ipAddress: '192.168.1.1',
        bidAmount: 100,
        timestamp: new Date()
      };

      // Submit bids up to the per-auction limit
      for (let i = 0; i < bidThrottlingConfig.maxBidsPerAuctionPerUser; i++) {
        const bidRequest = {
          ...request,
          timestamp: new Date(Date.now() + i * 60 * 1000) // 1 minute apart
        };
        const result = await bidThrottling.evaluateBid(bidRequest);
        if (i < bidThrottlingConfig.maxBidsPerAuctionPerUser - 1) {
          expect(result.decision).toBe(ThrottlingDecision.ALLOW);
        }
      }

      // Next bid should be blocked
      const blockResult = await bidThrottling.evaluateBid(request);
      expect(blockResult.decision).toBe(ThrottlingDecision.TEMP_BLOCK);
      expect(blockResult.reason).toBe(ThrottlingReason.USER_RATE_LIMIT_EXCEEDED);
    });
  });

  describe('Auction Rate Limits', () => {
    it('should temporarily block when auction exceeds per-minute limit', async () => {
      const baseRequest: BidThrottlingRequest = {
        userId: 'user-1',
        auctionId: 'auction-1',
        ipAddress: '192.168.1.1',
        bidAmount: 100,
        timestamp: new Date()
      };

      // Submit bids from different users to exceed auction limit
      for (let i = 0; i < bidThrottlingConfig.maxBidsPerMinutePerAuction; i++) {
        const request = {
          ...baseRequest,
          userId: `user-${i}`,
          ipAddress: `192.168.1.${i + 1}`
        };
        const result = await bidThrottling.evaluateBid(request);
        expect(result.decision).toBe(ThrottlingDecision.ALLOW);
      }

      // Next bid should be blocked
      const blockResult = await bidThrottling.evaluateBid(baseRequest);
      expect(blockResult.decision).toBe(ThrottlingDecision.TEMP_BLOCK);
      expect(blockResult.reason).toBe(ThrottlingReason.AUCTION_RATE_LIMIT_EXCEEDED);
    });
  });

  describe('IP Rate Limits', () => {
    it('should flag when IP exceeds per-minute limit', async () => {
      const request: BidThrottlingRequest = {
        userId: 'user-1',
        auctionId: 'auction-1',
        ipAddress: '192.168.1.1',
        bidAmount: 100,
        timestamp: new Date()
      };

      // Submit bids from different users with same IP
      for (let i = 0; i < bidThrottlingConfig.maxBidsPerMinutePerIP; i++) {
        const bidRequest = {
          ...request,
          userId: `user-${i}`
        };
        const result = await bidThrottling.evaluateBid(bidRequest);
        if (i < bidThrottlingConfig.maxBidsPerMinutePerIP - 1) {
          expect(result.decision).toBe(ThrottlingDecision.ALLOW);
        }
      }

      // Next bid should be flagged (not blocked, since IP is secondary signal)
      const flagResult = await bidThrottling.evaluateBid(request);
      expect(flagResult.decision).toBe(ThrottlingDecision.FLAG);
      expect(flagResult.reason).toBe(ThrottlingReason.IP_RATE_LIMIT_EXCEEDED);
    });
  });

  describe('Suspicious Pattern Detection', () => {
    it('should flag consecutive blocks pattern', async () => {
      const request: BidThrottlingRequest = {
        userId: 'user-1',
        auctionId: 'auction-1',
        ipAddress: '192.168.1.1',
        bidAmount: 100,
        timestamp: new Date()
      };

      // Simulate consecutive blocks by exceeding limits repeatedly
      for (let i = 0; i < bidThrottlingConfig.flagThresholdConsecutiveBlocks; i++) {
        // Exceed per-minute limit to get blocked
        for (let j = 0; j <= bidThrottlingConfig.maxBidsPerMinutePerUser; j++) {
          await bidThrottling.evaluateBid(request);
        }
        
        // Wait for block to expire
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Next bid should be flagged
      const flagResult = await bidThrottling.evaluateBid(request);
      expect(flagResult.decision).toBe(ThrottlingDecision.FLAG);
      expect(flagResult.reason).toBe(ThrottlingReason.SUSPICIOUS_PATTERN);
    });

    it('should flag high frequency bidding', async () => {
      const request: BidThrottlingRequest = {
        userId: 'user-1',
        auctionId: 'auction-1',
        ipAddress: '192.168.1.1',
        bidAmount: 100,
        timestamp: new Date()
      };

      // Submit many bids in a short time to trigger high frequency flag
      for (let i = 0; i < bidThrottlingConfig.flagThresholdHighFrequency; i++) {
        const bidRequest = {
          ...request,
          userId: `user-${i % 10}`, // Rotate between users to avoid user limits
          auctionId: `auction-${i % 5}` // Rotate between auctions
        };
        await bidThrottling.evaluateBid(bidRequest);
      }

      // Next bid should be flagged
      const flagResult = await bidThrottling.evaluateBid(request);
      expect(flagResult.decision).toBe(ThrottlingDecision.FLAG);
      expect(flagResult.reason).toBe(ThrottlingReason.SUSPICIOUS_PATTERN);
    });
  });

  describe('Temporary Blocking', () => {
    it('should block for configured duration', async () => {
      const request: BidThrottlingRequest = {
        userId: 'user-1',
        auctionId: 'auction-1',
        ipAddress: '192.168.1.1',
        bidAmount: 100,
        timestamp: new Date()
      };

      // Exceed limit to get blocked
      for (let i = 0; i <= bidThrottlingConfig.maxBidsPerMinutePerUser; i++) {
        await bidThrottling.evaluateBid(request);
      }

      const blockResult = await bidThrottling.evaluateBid(request);
      expect(blockResult.decision).toBe(ThrottlingDecision.TEMP_BLOCK);
      
      const blockedUntil = blockResult.metadata.blockedUntil;
      const expectedBlockTime = new Date(Date.now() + bidThrottlingConfig.tempBlockDurationMinutes * 60 * 1000);
      
      // Allow 1 second tolerance
      expect(Math.abs(blockedUntil.getTime() - expectedBlockTime.getTime())).toBeLessThan(1000);
    });

    it('should allow bids after block expires', async () => {
      const request: BidThrottlingRequest = {
        userId: 'user-1',
        auctionId: 'auction-1',
        ipAddress: '192.168.1.1',
        bidAmount: 100,
        timestamp: new Date()
      };

      // Exceed limit to get blocked
      for (let i = 0; i <= bidThrottlingConfig.maxBidsPerMinutePerUser; i++) {
        await bidThrottling.evaluateBid(request);
      }

      const blockResult = await bidThrottling.evaluateBid(request);
      expect(blockResult.decision).toBe(ThrottlingDecision.TEMP_BLOCK);

      // Simulate time passing (block duration + 1 second)
      const futureTime = new Date(Date.now() + (bidThrottlingConfig.tempBlockDurationMinutes + 1) * 60 * 1000);
      const futureRequest = {
        ...request,
        timestamp: futureTime
      };

      const allowResult = await bidThrottling.evaluateBid(futureRequest);
      expect(allowResult.decision).toBe(ThrottlingDecision.ALLOW);
    });
  });

  describe('Event Logging', () => {
    it('should log all throttling decisions', async () => {
      const request: BidThrottlingRequest = {
        userId: 'user-1',
        auctionId: 'auction-1',
        ipAddress: '192.168.1.1',
        bidAmount: 100,
        timestamp: new Date()
      };

      // Generate different types of decisions
      await bidThrottling.evaluateBid(request); // ALLOW

      // Exceed limit for TEMP_BLOCK
      for (let i = 0; i <= bidThrottlingConfig.maxBidsPerMinutePerUser; i++) {
        await bidThrottling.evaluateBid(request);
      }

      const events = bidThrottling.getEventLog();
      
      expect(events.length).toBeGreaterThan(0);
      
      // Check that events have correct structure
      events.forEach(event => {
        expect(event.category).toBe('AUCTION_SECURITY');
        expect(event.type).toBe('BID_THROTTLING_DECISION');
        expect(event.timestamp).toBeInstanceOf(Date);
        expect(event.data.userId).toBe('user-1');
        expect(event.data.auctionId).toBe('auction-1');
        expect(event.data.decision).toBeDefined();
        expect(event.data.reason).toBeDefined();
      });
    });

    it('should limit event log when requested', async () => {
      const request: BidThrottlingRequest = {
        userId: 'user-1',
        auctionId: 'auction-1',
        ipAddress: '192.168.1.1',
        bidAmount: 100,
        timestamp: new Date()
      };

      // Generate multiple events
      for (let i = 0; i < 10; i++) {
        await bidThrottling.evaluateBid(request);
      }

      const allEvents = bidThrottling.getEventLog();
      const limitedEvents = bidThrottling.getEventLog(5);

      expect(allEvents.length).toBeGreaterThan(limitedEvents.length);
      expect(limitedEvents.length).toBe(5);
    });
  });

  describe('Data Cleanup', () => {
    it('should clean old data', async () => {
      const request: BidThrottlingRequest = {
        userId: 'user-1',
        auctionId: 'auction-1',
        ipAddress: '192.168.1.1',
        bidAmount: 100,
        timestamp: new Date()
      };

      // Generate some data
      await bidThrottling.evaluateBid(request);

      // Verify data exists
      const eventsBefore = bidThrottling.getEventLog();
      expect(eventsBefore.length).toBeGreaterThan(0);

      // Clean old data
      bidThrottling.clearOldData(0); // Clean everything

      // Verify data is cleaned
      const eventsAfter = bidThrottling.getEventLog();
      expect(eventsAfter.length).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should track decision statistics correctly', async () => {
      const request: BidThrottlingRequest = {
        userId: 'user-1',
        auctionId: 'auction-1',
        ipAddress: '192.168.1.1',
        bidAmount: 100,
        timestamp: new Date()
      };

      // Generate different types of decisions
      await bidThrottling.evaluateBid(request); // ALLOW

      // Exceed limit for TEMP_BLOCK
      for (let i = 0; i <= bidThrottlingConfig.maxBidsPerMinutePerUser; i++) {
        await bidThrottling.evaluateBid(request);
      }

      const stats = bidThrottling.getStatistics();
      
      expect(stats.totalRequests).toBeGreaterThan(0);
      expect(stats.allowedRequests).toBeGreaterThan(0);
      expect(stats.tempBlockedRequests).toBeGreaterThan(0);
      expect(stats.averageResponseTime).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const malformedRequest = {
        userId: '',
        auctionId: '',
        ipAddress: '',
        bidAmount: -100,
        timestamp: new Date()
      } as BidThrottlingRequest;

      // Should not throw, should handle gracefully
      const result = await bidThrottling.evaluateBid(malformedRequest);
      expect(result).toBeDefined();
      expect(result.decision).toBeDefined();
    });

    it('should handle missing metadata gracefully', async () => {
      const request: BidThrottlingRequest = {
        userId: 'user-1',
        auctionId: 'auction-1',
        ipAddress: '192.168.1.1',
        bidAmount: 100,
        timestamp: new Date()
        // No userAgent or sessionId
      };

      const result = await bidThrottling.evaluateBid(request);
      expect(result.decision).toBe(ThrottlingDecision.ALLOW);
    });
  });

  describe('Configuration', () => {
    it('should use configuration values correctly', () => {
      expect(bidThrottlingConfig.maxBidsPerMinutePerUser).toBeGreaterThan(0);
      expect(bidThrottlingConfig.maxBidsPerHourPerUser).toBeGreaterThan(0);
      expect(bidThrottlingConfig.maxBidsPerAuctionPerUser).toBeGreaterThan(0);
      expect(bidThrottlingConfig.tempBlockDurationMinutes).toBeGreaterThan(0);
      expect(bidThrottlingConfig.flagThresholdConsecutiveBlocks).toBeGreaterThan(0);
    });
  });

  describe('Multiple Users and Auctions', () => {
    it('should handle multiple users independently', async () => {
      const user1Request: BidThrottlingRequest = {
        userId: 'user-1',
        auctionId: 'auction-1',
        ipAddress: '192.168.1.1',
        bidAmount: 100,
        timestamp: new Date()
      };

      const user2Request: BidThrottlingRequest = {
        userId: 'user-2',
        auctionId: 'auction-1',
        ipAddress: '192.168.1.2',
        bidAmount: 100,
        timestamp: new Date()
      };

      // User 1 exceeds limit
      for (let i = 0; i <= bidThrottlingConfig.maxBidsPerMinutePerUser; i++) {
        await bidThrottling.evaluateBid(user1Request);
      }

      // User 1 should be blocked
      const user1Result = await bidThrottling.evaluateBid(user1Request);
      expect(user1Result.decision).toBe(ThrottlingDecision.TEMP_BLOCK);

      // User 2 should still be allowed
      const user2Result = await bidThrottling.evaluateBid(user2Request);
      expect(user2Result.decision).toBe(ThrottlingDecision.ALLOW);
    });

    it('should handle multiple auctions independently', async () => {
      const request: BidThrottlingRequest = {
        userId: 'user-1',
        auctionId: 'auction-1',
        ipAddress: '192.168.1.1',
        bidAmount: 100,
        timestamp: new Date()
      };

      const auction2Request: BidThrottlingRequest = {
        userId: 'user-1',
        auctionId: 'auction-2',
        ipAddress: '192.168.1.1',
        bidAmount: 100,
        timestamp: new Date()
      };

      // Exceed limit for auction 1
      for (let i = 0; i < bidThrottlingConfig.maxBidsPerAuctionPerUser; i++) {
        await bidThrottling.evaluateBid(request);
      }

      // Should be blocked for auction 1
      const auction1Result = await bidThrottling.evaluateBid(request);
      expect(auction1Result.decision).toBe(ThrottlingDecision.TEMP_BLOCK);

      // Should still be allowed for auction 2
      const auction2Result = await bidThrottling.evaluateBid(auction2Request);
      expect(auction2Result.decision).toBe(ThrottlingDecision.ALLOW);
    });
  });
});
