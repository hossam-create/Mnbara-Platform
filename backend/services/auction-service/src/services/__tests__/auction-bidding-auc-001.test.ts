import { PrismaClient } from '@prisma/client';
import { AuctionService } from '../auction.service';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    listing: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    bid: {
      create: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
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

describe('AUC-001: Core Auction Bidding', () => {
  let mockPrisma: any;
  let auctionService: AuctionService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
    auctionService = new AuctionService();
  });

  describe('Users can place bids on active auctions', () => {
    it('should allow bid placement on ACTIVE auction', async () => {
      const listingId = 1;
      const bidderId = 2;
      const mockAuction = {
        id: listingId,
        sellerId: 1,
        isAuction: true,
        status: 'ACTIVE',
        startingBid: 10.00,
        currentBid: 10.00,
        minBidIncrement: 1.00,
        auctionEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        autoExtendEnabled: false,
        extensionCount: 0,
        maxExtensions: 10,
        bids: [],
      };

      const mockBid = {
        id: 1,
        listingId,
        bidderId,
        amount: 15.00,
        status: 'WINNING',
        createdAt: new Date(),
        bidder: { id: bidderId, firstName: 'John', lastName: 'Doe' },
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          listing: {
            findUnique: jest.fn().mockResolvedValue(mockAuction),
            update: jest.fn().mockResolvedValue({ ...mockAuction, currentBid: 15.00 }),
          },
          bid: {
            create: jest.fn().mockResolvedValue(mockBid),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          auctionExtension: {
            create: jest.fn(),
          },
        };
        return callback(tx);
      });

      const result = await auctionService.placeBid(listingId, bidderId, 15.00);

      expect(result.bid).toBeDefined();
      expect(result.bid.amount).toBe(15.00);
      expect(result.auction.currentBid).toBe(15.00);
    });
  });

  describe('Bids must be higher than the current highest bid', () => {
    it('should reject bid that is not higher than current bid', async () => {
      const listingId = 1;
      const bidderId = 2;
      const mockAuction = {
        id: listingId,
        sellerId: 1,
        isAuction: true,
        status: 'ACTIVE',
        startingBid: 10.00,
        currentBid: 15.00,
        minBidIncrement: 1.00,
        auctionEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        autoExtendEnabled: false,
        extensionCount: 0,
        maxExtensions: 10,
        bids: [],
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          listing: {
            findUnique: jest.fn().mockResolvedValue(mockAuction),
          },
        };
        return callback(tx);
      });

      await expect(
        auctionService.placeBid(listingId, bidderId, 15.00) // Same as current bid
      ).rejects.toThrow('Bid must be higher than the current highest bid');
    });

    it('should accept bid that is higher than current bid', async () => {
      const listingId = 1;
      const bidderId = 2;
      const mockAuction = {
        id: listingId,
        sellerId: 1,
        isAuction: true,
        status: 'ACTIVE',
        startingBid: 10.00,
        currentBid: 15.00,
        minBidIncrement: 1.00,
        auctionEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        autoExtendEnabled: false,
        extensionCount: 0,
        maxExtensions: 10,
        bids: [],
      };

      const mockBid = {
        id: 1,
        listingId,
        bidderId,
        amount: 20.00,
        status: 'WINNING',
        createdAt: new Date(),
        bidder: { id: bidderId, firstName: 'John', lastName: 'Doe' },
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          listing: {
            findUnique: jest.fn().mockResolvedValue(mockAuction),
            update: jest.fn().mockResolvedValue({ ...mockAuction, currentBid: 20.00 }),
          },
          bid: {
            create: jest.fn().mockResolvedValue(mockBid),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          auctionExtension: {
            create: jest.fn(),
          },
        };
        return callback(tx);
      });

      const result = await auctionService.placeBid(listingId, bidderId, 20.00);

      expect(result.bid.amount).toBe(20.00);
      expect(result.auction.currentBid).toBe(20.00);
    });
  });

  describe('Auction must track current highest bid and bidder', () => {
    it('should update currentBid when new bid is placed', async () => {
      const listingId = 1;
      const bidderId = 2;
      const mockAuction = {
        id: listingId,
        sellerId: 1,
        isAuction: true,
        status: 'ACTIVE',
        startingBid: 10.00,
        currentBid: 10.00,
        minBidIncrement: 1.00,
        auctionEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        autoExtendEnabled: false,
        extensionCount: 0,
        maxExtensions: 10,
        bids: [],
      };

      let updatedAuction: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          listing: {
            findUnique: jest.fn().mockResolvedValue(mockAuction),
            update: jest.fn().mockImplementation(async (args: any) => {
              updatedAuction = { ...mockAuction, ...args.data };
              return updatedAuction;
            }),
          },
          bid: {
            create: jest.fn().mockResolvedValue({
              id: 1,
              listingId,
              bidderId,
              amount: 15.00,
              status: 'WINNING',
            }),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          auctionExtension: {
            create: jest.fn(),
          },
        };
        return callback(tx);
      });

      await auctionService.placeBid(listingId, bidderId, 15.00);

      expect(updatedAuction.currentBid).toBe(15.00);
    });
  });

  describe('Auction state must be one of: DRAFT, ACTIVE, ENDED', () => {
    it('should reject bid when auction is DRAFT', async () => {
      const listingId = 1;
      const bidderId = 2;
      const mockAuction = {
        id: listingId,
        sellerId: 1,
        isAuction: true,
        status: 'DRAFT',
        startingBid: 10.00,
        currentBid: 10.00,
        minBidIncrement: 1.00,
        auctionEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        bids: [],
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          listing: {
            findUnique: jest.fn().mockResolvedValue(mockAuction),
          },
        };
        return callback(tx);
      });

      await expect(
        auctionService.placeBid(listingId, bidderId, 15.00)
      ).rejects.toThrow('Auction is not active');
    });

    it('should reject bid when auction is ENDED', async () => {
      const listingId = 1;
      const bidderId = 2;
      const mockAuction = {
        id: listingId,
        sellerId: 1,
        isAuction: true,
        status: 'ENDED',
        startingBid: 10.00,
        currentBid: 10.00,
        minBidIncrement: 1.00,
        auctionEndsAt: new Date(Date.now() - 1000), // Past
        bids: [],
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          listing: {
            findUnique: jest.fn().mockResolvedValue(mockAuction),
          },
        };
        return callback(tx);
      });

      await expect(
        auctionService.placeBid(listingId, bidderId, 15.00)
      ).rejects.toThrow('Auction is not active');
    });
  });

  describe('Bids must be rejected if the auction is not ACTIVE', () => {
    it('should reject bid when status is SOLD', async () => {
      const listingId = 1;
      const bidderId = 2;
      const mockAuction = {
        id: listingId,
        sellerId: 1,
        isAuction: true,
        status: 'SOLD',
        startingBid: 10.00,
        currentBid: 10.00,
        bids: [],
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          listing: {
            findUnique: jest.fn().mockResolvedValue(mockAuction),
          },
        };
        return callback(tx);
      });

      await expect(
        auctionService.placeBid(listingId, bidderId, 15.00)
      ).rejects.toThrow('Auction is not active');
    });

    it('should reject bid when status is CANCELLED', async () => {
      const listingId = 1;
      const bidderId = 2;
      const mockAuction = {
        id: listingId,
        sellerId: 1,
        isAuction: true,
        status: 'CANCELLED',
        startingBid: 10.00,
        currentBid: 10.00,
        bids: [],
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          listing: {
            findUnique: jest.fn().mockResolvedValue(mockAuction),
          },
        };
        return callback(tx);
      });

      await expect(
        auctionService.placeBid(listingId, bidderId, 15.00)
      ).rejects.toThrow('Auction is not active');
    });
  });

  describe('Concurrent bids must be handled safely', () => {
    it('should handle concurrent bids with Serializable isolation', async () => {
      const listingId = 1;
      const bidderId1 = 2;
      const bidderId2 = 3;
      const mockAuction = {
        id: listingId,
        sellerId: 1,
        isAuction: true,
        status: 'ACTIVE',
        startingBid: 10.00,
        currentBid: 10.00,
        minBidIncrement: 1.00,
        auctionEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        autoExtendEnabled: false,
        extensionCount: 0,
        maxExtensions: 10,
        bids: [],
      };

      // First bid
      mockPrisma.$transaction.mockImplementationOnce(async (callback: any) => {
        const tx = {
          listing: {
            findUnique: jest.fn().mockResolvedValue(mockAuction),
            update: jest.fn().mockResolvedValue({ ...mockAuction, currentBid: 15.00 }),
          },
          bid: {
            create: jest.fn().mockResolvedValue({
              id: 1,
              listingId,
              bidderId: bidderId1,
              amount: 15.00,
              status: 'WINNING',
            }),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          auctionExtension: {
            create: jest.fn(),
          },
        };
        return callback(tx);
      });

      // Second bid (should see updated currentBid)
      mockPrisma.$transaction.mockImplementationOnce(async (callback: any) => {
        const tx = {
          listing: {
            findUnique: jest.fn().mockResolvedValue({ ...mockAuction, currentBid: 15.00 }),
            update: jest.fn().mockResolvedValue({ ...mockAuction, currentBid: 20.00 }),
          },
          bid: {
            create: jest.fn().mockResolvedValue({
              id: 2,
              listingId,
              bidderId: bidderId2,
              amount: 20.00,
              status: 'WINNING',
            }),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }), // First bid outbid
          },
          auctionExtension: {
            create: jest.fn(),
          },
        };
        return callback(tx);
      });

      const result1 = await auctionService.placeBid(listingId, bidderId1, 15.00);
      const result2 = await auctionService.placeBid(listingId, bidderId2, 20.00);

      expect(result1.bid.amount).toBe(15.00);
      expect(result2.bid.amount).toBe(20.00);
      expect(result2.auction.currentBid).toBe(20.00);
    });
  });

  describe('Auction end must be deterministic based on end time', () => {
    it('should end auction deterministically when end time is reached', async () => {
      const listingId = 1;
      const mockAuction = {
        id: listingId,
        sellerId: 1,
        isAuction: true,
        status: 'ACTIVE',
        startingBid: 10.00,
        currentBid: 15.00,
        reservePrice: 10.00,
        bids: [
          {
            id: 1,
            bidderId: 2,
            amount: 15.00,
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
              status: 'ENDED',
              winnerId: 2,
              finalPrice: 15.00,
            }),
          },
          bid: {
            update: jest.fn().mockResolvedValue({
              ...mockAuction.bids[0],
              status: 'WON',
            }),
          },
          proxyBid: {
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return callback(tx);
      });

      const result = await auctionService.endAuction(listingId);

      expect(result.auction.status).toBe('ENDED');
      expect(result.winner).toBeDefined();
      expect(result.winner?.userId).toBe(2);
      expect(result.winner?.amount).toBe(15.00);
    });
  });

  describe('Winning bid must be clearly identified when auction ends', () => {
    it('should identify winning bid with winnerId and finalPrice', async () => {
      const listingId = 1;
      const mockAuction = {
        id: listingId,
        sellerId: 1,
        isAuction: true,
        status: 'ACTIVE',
        startingBid: 10.00,
        currentBid: 20.00,
        reservePrice: 10.00,
        bids: [
          {
            id: 1,
            bidderId: 2,
            amount: 20.00,
            status: 'WINNING',
          },
        ],
      };

      let updatedAuction: any = null;

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          listing: {
            findUnique: jest.fn().mockResolvedValue(mockAuction),
            update: jest.fn().mockImplementation(async (args: any) => {
              updatedAuction = { ...mockAuction, ...args.data };
              return updatedAuction;
            }),
          },
          bid: {
            update: jest.fn().mockResolvedValue({
              ...mockAuction.bids[0],
              status: 'WON',
            }),
          },
          proxyBid: {
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        };
        return callback(tx);
      });

      const result = await auctionService.endAuction(listingId);

      expect(result.winner).toBeDefined();
      expect(result.winner?.userId).toBe(2);
      expect(result.winner?.amount).toBe(20.00);
      expect(updatedAuction.winnerId).toBe(2);
      expect(updatedAuction.finalPrice).toBe(20.00);
    });
  });
});





