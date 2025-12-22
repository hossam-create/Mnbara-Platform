import { AuctionService } from '../auction.service';
import { PrismaClient } from '@prisma/client';

// Mock Prisma client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    listing: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    bid: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    proxyBid: {
      findMany: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    auctionExtension: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('AUC-002: Proxy bidding and auto-extend', () => {
  let auctionService: AuctionService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
    auctionService = new AuctionService();
  });

  describe('Proxy bidding', () => {
    it('auto-outbids using highest proxy respecting min increment and max cap', async () => {
      const listingId = 1;
      const currentBidAmount = 20;
      const currentBidderId = 5;

      // Current auction config
      mockPrisma.listing.findUnique.mockResolvedValue({
        id: listingId,
        minBidIncrement: 1.0,
      });

      // Two proxies: highest at 30, second at 22
      mockPrisma.proxyBid.findMany.mockResolvedValue([
        { id: 101, bidderId: 2, maxAmount: 30 },
        { id: 102, bidderId: 3, maxAmount: 22 },
      ]);

      // Spy on placeBid to assert computed bid amount
      const placeBidSpy = jest
        .spyOn(auctionService as any, 'placeBid')
        .mockResolvedValue({
          bid: { id: 201, amount: 23, bidderId: 2 },
          auction: { id: listingId, currentBid: 23 },
          wasExtended: false,
          outbidUsers: [],
        });

      mockPrisma.proxyBid.update.mockResolvedValue({ id: 101, currentBid: 23 });

      const result = await auctionService.processProxyBids(
        listingId,
        currentBidAmount,
        currentBidderId
      );

      expect(placeBidSpy).toHaveBeenCalledWith(listingId, 2, 23);
      expect(mockPrisma.proxyBid.update).toHaveBeenCalledWith({
        where: { id: 101 },
        data: { currentBid: 23 },
      });
      expect(result?.auction.currentBid).toBe(23);
    });
  });

  describe('Auto-extend', () => {
    it('extends auction when bid placed within threshold and under max extensions', async () => {
      const listingId = 1;
      const bidderId = 2;
      const amount = 15;

      const now = new Date();
      const endsSoon = new Date(now.getTime() + 30_000); // 30s
      const durationMs = 60_000;

      const auction = {
        id: listingId,
        sellerId: 10,
        isAuction: true,
        status: 'ACTIVE',
        startingBid: 10,
        currentBid: 10,
        minBidIncrement: 1,
        auctionEndsAt: endsSoon,
        autoExtendEnabled: true,
        autoExtendThresholdMs: 120_000,
        autoExtendDurationMs: durationMs,
        extensionCount: 0,
        maxExtensions: 2,
        bids: [],
      };

      const bidRecord = {
        id: 301,
        listingId,
        bidderId,
        amount,
        status: 'WINNING',
        createdAt: now,
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          listing: {
            findUnique: jest.fn().mockResolvedValue(auction),
            update: jest.fn().mockImplementation(async (args: any) => ({
              ...auction,
              ...args.data,
              extensionCount:
                auction.extensionCount +
                (args.data.extensionCount?.increment || 0),
            })),
          },
          bid: {
            create: jest.fn().mockResolvedValue(bidRecord),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          auctionExtension: {
            create: jest.fn().mockResolvedValue({ id: 401 }),
          },
        };
        return callback(tx);
      });

      const result = await auctionService.placeBid(listingId, bidderId, amount);

      expect(result.wasExtended).toBe(true);
      expect(result.extensionInfo?.extensionNumber).toBe(1);
      expect(result.auction.auctionEndsAt.getTime()).toBe(
        endsSoon.getTime() + durationMs
      );
      expect(result.auction.extensionCount).toBe(1);
    });

    it('does not extend when max extensions reached', async () => {
      const listingId = 1;
      const bidderId = 2;
      const amount = 15;

      const now = new Date();
      const endsSoon = new Date(now.getTime() + 30_000); // 30s

      const auction = {
        id: listingId,
        sellerId: 10,
        isAuction: true,
        status: 'ACTIVE',
        startingBid: 10,
        currentBid: 10,
        minBidIncrement: 1,
        auctionEndsAt: endsSoon,
        autoExtendEnabled: true,
        autoExtendThresholdMs: 120_000,
        autoExtendDurationMs: 60_000,
        extensionCount: 2,
        maxExtensions: 2,
        bids: [],
      };

      const bidRecord = {
        id: 302,
        listingId,
        bidderId,
        amount,
        status: 'WINNING',
        createdAt: now,
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          listing: {
            findUnique: jest.fn().mockResolvedValue(auction),
            update: jest.fn().mockImplementation(async (args: any) => ({
              ...auction,
              ...args.data,
            })),
          },
          bid: {
            create: jest.fn().mockResolvedValue(bidRecord),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          auctionExtension: {
            create: jest.fn(),
          },
        };
        return callback(tx);
      });

      const result = await auctionService.placeBid(listingId, bidderId, amount);

      expect(result.wasExtended).toBe(false);
      expect(result.auction.auctionEndsAt.getTime()).toBe(endsSoon.getTime());
    });

    it('does not extend when auto-extend is disabled', async () => {
      const listingId = 1;
      const bidderId = 2;
      const amount = 15;

      const now = new Date();
      const endsSoon = new Date(now.getTime() + 30_000); // 30s

      const auction = {
        id: listingId,
        sellerId: 10,
        isAuction: true,
        status: 'ACTIVE',
        startingBid: 10,
        currentBid: 10,
        minBidIncrement: 1,
        auctionEndsAt: endsSoon,
        autoExtendEnabled: false, // Disabled
        autoExtendThresholdMs: 120_000,
        autoExtendDurationMs: 60_000,
        extensionCount: 0,
        maxExtensions: 2,
        bids: [],
      };

      const bidRecord = {
        id: 303,
        listingId,
        bidderId,
        amount,
        status: 'WINNING',
        createdAt: now,
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          listing: {
            findUnique: jest.fn().mockResolvedValue(auction),
            update: jest.fn().mockImplementation(async (args: any) => ({
              ...auction,
              ...args.data,
            })),
          },
          bid: {
            create: jest.fn().mockResolvedValue(bidRecord),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          auctionExtension: {
            create: jest.fn(),
          },
        };
        return callback(tx);
      });

      const result = await auctionService.placeBid(listingId, bidderId, amount);

      expect(result.wasExtended).toBe(false);
      expect(result.auction.auctionEndsAt.getTime()).toBe(endsSoon.getTime());
    });

    it('does not extend when time remaining exceeds threshold', async () => {
      const listingId = 1;
      const bidderId = 2;
      const amount = 15;

      const now = new Date();
      const endsLater = new Date(now.getTime() + 180_000); // 3 minutes (exceeds 2 min threshold)

      const auction = {
        id: listingId,
        sellerId: 10,
        isAuction: true,
        status: 'ACTIVE',
        startingBid: 10,
        currentBid: 10,
        minBidIncrement: 1,
        auctionEndsAt: endsLater,
        autoExtendEnabled: true,
        autoExtendThresholdMs: 120_000, // 2 minutes
        autoExtendDurationMs: 60_000,
        extensionCount: 0,
        maxExtensions: 2,
        bids: [],
      };

      const bidRecord = {
        id: 304,
        listingId,
        bidderId,
        amount,
        status: 'WINNING',
        createdAt: now,
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          listing: {
            findUnique: jest.fn().mockResolvedValue(auction),
            update: jest.fn().mockImplementation(async (args: any) => ({
              ...auction,
              ...args.data,
            })),
          },
          bid: {
            create: jest.fn().mockResolvedValue(bidRecord),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          auctionExtension: {
            create: jest.fn(),
          },
        };
        return callback(tx);
      });

      const result = await auctionService.placeBid(listingId, bidderId, amount);

      expect(result.wasExtended).toBe(false);
    });
  });

  describe('Proxy bidding edge cases', () => {
    it('respects minimum bid increment when calculating proxy bid', async () => {
      const listingId = 1;
      const currentBidAmount = 20;
      const currentBidderId = 5;
      const minIncrement = 5.0; // Higher increment

      mockPrisma.listing.findUnique.mockResolvedValue({
        id: listingId,
        minBidIncrement: minIncrement,
        status: 'ACTIVE',
      });

      // Proxy with max 30, but must bid at least 25 (20 + 5)
      mockPrisma.proxyBid.findMany.mockResolvedValue([
        { id: 101, bidderId: 2, maxAmount: 30 },
      ]);

      const placeBidSpy = jest
        .spyOn(auctionService as any, 'placeBid')
        .mockResolvedValue({
          bid: { id: 201, amount: 25, bidderId: 2 },
          auction: { id: listingId, currentBid: 25 },
          wasExtended: false,
          outbidUsers: [],
        });

      mockPrisma.proxyBid.update.mockResolvedValue({ id: 101, currentBid: 25 });

      await auctionService.processProxyBids(listingId, currentBidAmount, currentBidderId);

      expect(placeBidSpy).toHaveBeenCalledWith(listingId, 2, 25); // 20 + 5 increment
    });

    it('handles recursive proxy bids correctly', async () => {
      const listingId = 1;
      const currentBidAmount = 20;
      const currentBidderId = 5;

      mockPrisma.listing.findUnique.mockResolvedValue({
        id: listingId,
        minBidIncrement: 1.0,
        status: 'ACTIVE',
      });

      // First proxy bid
      mockPrisma.proxyBid.findMany
        .mockResolvedValueOnce([
          { id: 101, bidderId: 2, maxAmount: 30 },
        ])
        // Second proxy bid (after first one places bid)
        .mockResolvedValueOnce([
          { id: 102, bidderId: 3, maxAmount: 35 },
        ]);

      let callCount = 0;
      const placeBidSpy = jest
        .spyOn(auctionService as any, 'placeBid')
        .mockImplementation(async (lid, bidderId, amount) => {
          callCount++;
          if (callCount === 1) {
            // First proxy bid
            return {
              bid: { id: 201, amount: 21, bidderId: 2 },
              auction: { id: listingId, currentBid: 21 },
              wasExtended: false,
              outbidUsers: [],
            };
          } else {
            // Second proxy bid (recursive)
            return {
              bid: { id: 202, amount: 22, bidderId: 3 },
              auction: { id: listingId, currentBid: 22 },
              wasExtended: false,
              outbidUsers: [2],
            };
          }
        });

      mockPrisma.proxyBid.update
        .mockResolvedValueOnce({ id: 101, currentBid: 21 })
        .mockResolvedValueOnce({ id: 102, currentBid: 22 });

      const result = await auctionService.processProxyBids(
        listingId,
        currentBidAmount,
        currentBidderId
      );

      expect(placeBidSpy).toHaveBeenCalledTimes(2);
      expect(result?.auction.currentBid).toBe(22);
    });

    it('does not bid if proxy max amount is insufficient', async () => {
      const listingId = 1;
      const currentBidAmount = 20;
      const currentBidderId = 5;
      const minIncrement = 1.0;

      mockPrisma.listing.findUnique.mockResolvedValue({
        id: listingId,
        minBidIncrement: minIncrement,
        status: 'ACTIVE',
      });

      // Proxy max is 20.5, but need to bid at least 21 (20 + 1)
      mockPrisma.proxyBid.findMany.mockResolvedValue([
        { id: 101, bidderId: 2, maxAmount: 20.5 },
      ]);

      const placeBidSpy = jest.spyOn(auctionService as any, 'placeBid');

      const result = await auctionService.processProxyBids(
        listingId,
        currentBidAmount,
        currentBidderId
      );

      expect(placeBidSpy).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('Concurrent proxy bids', () => {
    it('handles concurrent bids with proxy bids safely', async () => {
      const listingId = 1;
      const currentBidAmount = 20;
      const currentBidderId = 5;

      mockPrisma.listing.findUnique.mockResolvedValue({
        id: listingId,
        minBidIncrement: 1.0,
        status: 'ACTIVE',
      });

      // Proxy bid that can outbid
      mockPrisma.proxyBid.findMany.mockResolvedValue([
        { id: 101, bidderId: 2, maxAmount: 30 },
      ]);

      // Mock placeBid to simulate concurrent transaction safety
      const placeBidSpy = jest
        .spyOn(auctionService as any, 'placeBid')
        .mockResolvedValue({
          bid: { id: 201, amount: 21, bidderId: 2 },
          auction: { id: listingId, currentBid: 21 },
          wasExtended: false,
          outbidUsers: [currentBidderId],
        });

      mockPrisma.proxyBid.update.mockResolvedValue({ id: 101, currentBid: 21 });

      const result = await auctionService.processProxyBids(
        listingId,
        currentBidAmount,
        currentBidderId
      );

      // Verify proxy bid was placed correctly
      expect(placeBidSpy).toHaveBeenCalledWith(listingId, 2, 21);
      expect(result?.auction.currentBid).toBe(21);
      expect(result?.bid.bidderId).toBe(2);
    });
  });

  describe('Deterministic winning bid', () => {
    it('determines winner correctly when auction ends with proxy bids', async () => {
      const listingId = 1;
      const mockAuction = {
        id: listingId,
        sellerId: 1,
        isAuction: true,
        status: 'ACTIVE',
        startingBid: 10,
        currentBid: 25,
        reservePrice: 10,
        bids: [
          {
            id: 1,
            bidderId: 2,
            amount: 25,
            status: 'WINNING',
          },
        ],
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          listing: {
            findUnique: jest.fn().mockResolvedValue(mockAuction),
            update: jest.fn().mockResolvedValue({
              ...mockAuction,
              status: 'SOLD',
              winnerId: 2,
              finalPrice: 25,
            }),
          },
          bid: {
            update: jest.fn().mockResolvedValue({
              ...mockAuction.bids[0],
              status: 'WON',
            }),
          },
          proxyBid: {
            updateMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return callback(tx);
      });

      const result = await auctionService.endAuction(listingId);

      expect(result.auction.winnerId).toBe(2);
      expect(result.auction.finalPrice).toBe(25);
      expect(result.winner?.userId).toBe(2);
      expect(result.winner?.amount).toBe(25);
    });
  });
});

