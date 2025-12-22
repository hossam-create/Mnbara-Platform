import { PrismaClient } from '@prisma/client';
import { MatchingService } from '../matching.service';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    shopperRequest: {
      findUnique: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

describe('MatchingService', () => {
  let matchingService: MatchingService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    matchingService = new MatchingService();
    mockPrisma = new PrismaClient();
  });

  describe('getSuggestedTravelers', () => {
    it('should rank travelers correctly by score', async () => {
      const requestId = 1;
      const mockRequest = {
        id: requestId,
        buyerId: 1,
        sourceCountry: 'USA',
        destinationCountry: 'UAE',
        buyer: { id: 1 },
        offers: [],
      };

      const mockTravelers = [
        {
          id: 2,
          firstName: 'Traveler',
          lastName: 'High',
          email: 'high@test.com',
          role: 'TRAVELER',
          rating: 5.0, // High trust
          travelerLocation: { country: 'USA' },
          travelerAvailability: [
            {
              origin: 'USA',
              destination: 'UAE',
              departTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
              arriveTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
              isActive: true,
            },
          ],
        },
        {
          id: 3,
          firstName: 'Traveler',
          lastName: 'Low',
          email: 'low@test.com',
          role: 'TRAVELER',
          rating: 2.0, // Low trust
          travelerLocation: { country: 'USA' },
          travelerAvailability: [
            {
              origin: 'USA',
              destination: 'UAE',
              departTime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
              arriveTime: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
              isActive: true,
            },
          ],
        },
      ];

      mockPrisma.shopperRequest.findUnique = jest.fn().mockResolvedValue(mockRequest);
      mockPrisma.user.findMany = jest.fn().mockResolvedValue(mockTravelers);

      const suggestions = await matchingService.getSuggestedTravelers(requestId);

      expect(suggestions).toHaveLength(2);
      // High score traveler should be first
      expect(suggestions[0].travelerId).toBe(2);
      expect(suggestions[0].totalScore).toBeGreaterThan(suggestions[1].totalScore);
      expect(suggestions[0].scoreBreakdown.trustScore).toBe(30); // 5.0 / 5 * 30
      expect(suggestions[1].scoreBreakdown.trustScore).toBe(12); // 2.0 / 5 * 30
    });

    it('should exclude travelers outside source/destination countries', async () => {
      const requestId = 1;
      const mockRequest = {
        id: requestId,
        buyerId: 1,
        sourceCountry: 'USA',
        destinationCountry: 'UAE',
        buyer: { id: 1 },
        offers: [],
      };

      const mockTravelers = [
        {
          id: 2,
          firstName: 'Traveler',
          lastName: 'Match',
          email: 'match@test.com',
          role: 'TRAVELER',
          rating: 4.0,
          travelerLocation: { country: 'USA' },
          travelerAvailability: [
            {
              origin: 'USA',
              destination: 'UAE',
              departTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
              arriveTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
              isActive: true,
            },
          ],
        },
        {
          id: 3,
          firstName: 'Traveler',
          lastName: 'NoMatch',
          email: 'nomatch@test.com',
          role: 'TRAVELER',
          rating: 4.0,
          travelerLocation: { country: 'UK' }, // Wrong country
          travelerAvailability: [
            {
              origin: 'UK',
              destination: 'FRANCE', // Wrong destination
              departTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
              arriveTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
              isActive: true,
            },
          ],
        },
      ];

      mockPrisma.shopperRequest.findUnique = jest.fn().mockResolvedValue(mockRequest);
      mockPrisma.user.findMany = jest.fn().mockResolvedValue(mockTravelers);

      const suggestions = await matchingService.getSuggestedTravelers(requestId);

      // Only matching traveler should be included
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].travelerId).toBe(2);
      expect(suggestions[0].scoreBreakdown.sourceCountryMatch).toBe(20);
      expect(suggestions[0].scoreBreakdown.destinationCountryMatch).toBe(20);
    });

    it('should factor trust score into ranking', async () => {
      const requestId = 1;
      const mockRequest = {
        id: requestId,
        buyerId: 1,
        sourceCountry: 'USA',
        destinationCountry: 'UAE',
        buyer: { id: 1 },
        offers: [],
      };

      const mockTravelers = [
        {
          id: 2,
          firstName: 'Traveler',
          lastName: 'Trusted',
          email: 'trusted@test.com',
          role: 'TRAVELER',
          rating: 5.0, // Perfect rating
          travelerLocation: { country: 'USA' },
          travelerAvailability: [
            {
              origin: 'USA',
              destination: 'UAE',
              departTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
              arriveTime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
              isActive: true,
            },
          ],
        },
        {
          id: 3,
          firstName: 'Traveler',
          lastName: 'New',
          email: 'new@test.com',
          role: 'TRAVELER',
          rating: 0, // No rating
          travelerLocation: { country: 'USA' },
          travelerAvailability: [
            {
              origin: 'USA',
              destination: 'UAE',
              departTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
              arriveTime: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
              isActive: true,
            },
          ],
        },
      ];

      mockPrisma.shopperRequest.findUnique = jest.fn().mockResolvedValue(mockRequest);
      mockPrisma.user.findMany = jest.fn().mockResolvedValue(mockTravelers);

      const suggestions = await matchingService.getSuggestedTravelers(requestId);

      expect(suggestions).toHaveLength(2);
      // Trusted traveler should rank higher despite same date proximity
      expect(suggestions[0].travelerId).toBe(2);
      expect(suggestions[0].scoreBreakdown.trustScore).toBe(30);
      expect(suggestions[1].scoreBreakdown.trustScore).toBe(0);
    });

    it('should return top N travelers (default 5)', async () => {
      const requestId = 1;
      const mockRequest = {
        id: requestId,
        buyerId: 1,
        sourceCountry: 'USA',
        destinationCountry: 'UAE',
        buyer: { id: 1 },
        offers: [],
      };

      // Create 10 travelers
      const mockTravelers = Array.from({ length: 10 }, (_, i) => ({
        id: i + 2,
        firstName: 'Traveler',
        lastName: `${i}`,
        email: `traveler${i}@test.com`,
        role: 'TRAVELER',
        rating: 4.0,
        travelerLocation: { country: 'USA' },
        travelerAvailability: [
          {
            origin: 'USA',
            destination: 'UAE',
            departTime: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
            arriveTime: new Date(Date.now() + (i + 6) * 24 * 60 * 60 * 1000),
            isActive: true,
          },
        ],
      }));

      mockPrisma.shopperRequest.findUnique = jest.fn().mockResolvedValue(mockRequest);
      mockPrisma.user.findMany = jest.fn().mockResolvedValue(mockTravelers);

      const suggestions = await matchingService.getSuggestedTravelers(requestId);

      expect(suggestions).toHaveLength(5); // Default topN
    });

    it('should exclude travelers who already made offers', async () => {
      const requestId = 1;
      const mockRequest = {
        id: requestId,
        buyerId: 1,
        sourceCountry: 'USA',
        destinationCountry: 'UAE',
        buyer: { id: 1 },
        offers: [{ travelerId: 2 }], // Traveler 2 already made an offer
      };

      const mockTravelers = [
        {
          id: 2, // Already has an offer
          firstName: 'Traveler',
          lastName: 'Excluded',
          email: 'excluded@test.com',
          role: 'TRAVELER',
          rating: 5.0,
          travelerLocation: { country: 'USA' },
          travelerAvailability: [],
        },
        {
          id: 3,
          firstName: 'Traveler',
          lastName: 'Included',
          email: 'included@test.com',
          role: 'TRAVELER',
          rating: 4.0,
          travelerLocation: { country: 'USA' },
          travelerAvailability: [
            {
              origin: 'USA',
              destination: 'UAE',
              departTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
              arriveTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
              isActive: true,
            },
          ],
        },
      ];

      mockPrisma.shopperRequest.findUnique = jest.fn().mockResolvedValue(mockRequest);
      mockPrisma.user.findMany = jest.fn().mockResolvedValue([mockTravelers[1]]); // Only traveler 3

      const suggestions = await matchingService.getSuggestedTravelers(requestId);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].travelerId).toBe(3);
    });

    it('should throw error if request not found', async () => {
      mockPrisma.shopperRequest.findUnique = jest.fn().mockResolvedValue(null);

      await expect(matchingService.getSuggestedTravelers(999)).rejects.toThrow(
        'ShopperRequest 999 not found',
      );
    });

    it('should throw error if sourceCountry or destinationCountry missing', async () => {
      const mockRequest = {
        id: 1,
        buyerId: 1,
        sourceCountry: null,
        destinationCountry: 'UAE',
        buyer: { id: 1 },
        offers: [],
      };

      mockPrisma.shopperRequest.findUnique = jest.fn().mockResolvedValue(mockRequest);

      await expect(matchingService.getSuggestedTravelers(1)).rejects.toThrow(
        'Request must have both sourceCountry and destinationCountry',
      );
    });
  });
});





