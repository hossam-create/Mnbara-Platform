import { Request, Response } from 'express';
import { BidController } from '../bid.controller';
import { AuctionService } from '../services/auction.service';

// Mock dependencies
jest.mock('../services/auction.service');

describe('AUC-001: Bid Controller', () => {
  let bidController: BidController;
  let mockAuctionService: jest.Mocked<AuctionService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuctionService = {
      placeBid: jest.fn(),
      getBids: jest.fn(),
      setupProxyBid: jest.fn(),
    } as any;

    (AuctionService as jest.Mock).mockImplementation(() => mockAuctionService);

    bidController = new BidController();

    mockRequest = {
      params: { auctionId: '1' },
      body: { amount: 15.00 },
    } as any;
    (mockRequest as any).userId = 2;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;

    mockNext = jest.fn();
  });

  describe('Users can place bids on active auctions', () => {
    it('should place bid successfully on active auction', async () => {
      const mockResult = {
        bid: {
          id: 1,
          listingId: 1,
          bidderId: 2,
          amount: 15.00,
          status: 'WINNING',
          createdAt: new Date(),
          bidder: { id: 2, firstName: 'John', lastName: 'Doe' },
        },
        auction: {
          id: 1,
          currentBid: 15.00,
          auctionEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        wasExtended: false,
        outbidUsers: [],
      };

      mockAuctionService.placeBid.mockResolvedValue(mockResult as any);

      await bidController.placeBid(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuctionService.placeBid).toHaveBeenCalledWith(1, 2, 15.00);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            bid: expect.objectContaining({
              amount: 15.00,
            }),
            currentBid: 15.00,
          }),
        })
      );
    });
  });

  describe('Bids must be higher than the current highest bid', () => {
    it('should reject bid that is too low', async () => {
      const error = new Error('Bid must be higher than the current highest bid. Minimum bid: 16.00 (current: 15.00, min increment: 1.00)');
      mockAuctionService.placeBid.mockRejectedValue(error);

      await bidController.placeBid(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Bid must be higher'),
        })
      );
    });
  });

  describe('Bids must be rejected if the auction is not ACTIVE', () => {
    it('should reject bid when auction is not active', async () => {
      const error = new Error('Auction is not active. Current status: ENDED. Only ACTIVE auctions accept bids.');
      mockAuctionService.placeBid.mockRejectedValue(error);

      await bidController.placeBid(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Auction is not active'),
        })
      );
    });

    it('should reject bid when auction has ended', async () => {
      const error = new Error('Auction has ended');
      mockAuctionService.placeBid.mockRejectedValue(error);

      await bidController.placeBid(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Auction has ended',
        })
      );
    });
  });
});





