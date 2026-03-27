import { MarketplaceService } from '../services/Marketplace.service';
import { BuyerRequestState, TravelerAvailabilityState, OfferState, MatchState } from '../types/Marketplace.types';
import { marketplaceConfig } from '../config/marketplace.config';

describe('Marketplace Service', () => {
  let marketplaceService: MarketplaceService;

  beforeEach(() => {
    marketplaceService = new MarketplaceService();
  });

  afterEach(() => {
    marketplaceService.reset();
  });

  describe('Buyer Journey', () => {
    it('should create buyer request successfully', async () => {
      const request = {
        productDescription: 'Test product description',
        category: 'electronics',
        destinationCountry: 'USA',
        currency: 'USD',
        maxBudget: 100
      };

      const result = marketplaceService.createBuyerRequest(request, 'buyer-1');

      expect(result.success).toBe(true);
      expect(result.request).toBeDefined();
      expect(result.request?.state).toBe(BuyerRequestState.PENDING_TRAVELER);
      expect(result.request?.buyerId).toBe('buyer-1');
      expect(result.request?.productDescription).toBe('Test product description');
      expect(result.expiresAt).toBeDefined();
    });

    it('should reject invalid buyer request', async () => {
      const invalidRequest = {
        productDescription: '',
        category: '',
        destinationCountry: '',
        currency: ''
      };

      const result = marketplaceService.createBuyerRequest(invalidRequest, 'buyer-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should enforce maximum active requests limit', async () => {
      // Create maximum requests
      for (let i = 0; i < marketplaceConfig.maxActiveRequestsPerBuyer; i++) {
        marketplaceService.createBuyerRequest({
          productDescription: `Test product ${i}`,
          category: 'electronics',
          destinationCountry: 'USA',
          currency: 'USD'
        }, 'buyer-1');
      }

      // Try to create one more
      const result = marketplaceService.createBuyerRequest({
        productDescription: 'Test product too many',
        category: 'electronics',
        destinationCountry: 'USA',
        currency: 'USD'
      }, 'buyer-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum active requests limit reached');
    });
  });

  describe('Traveler Journey', () => {
    it('should create traveler availability successfully', async () => {
      const availability = {
        route: {
          from: { country: 'UK' },
          to: { country: 'USA' }
        },
        dates: {
          availableFrom: new Date(Date.now() + 24 * 60 * 60 * 1000),
          availableTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          flexibleDates: true
        },
        capacity: {
          maxWeight: 10,
          maxDimensions: { length: 50, width: 30, height: 20 },
          maxItems: 5
        },
        services: {
          canShop: true,
          canDeliver: true,
          canCustomsClear: true,
          canInsurance: true
        },
        pricing: {
          baseRate: 50,
          currency: 'USD'
        }
      };

      const result = marketplaceService.createTravelerAvailability(availability, 'traveler-1');

      expect(result.success).toBe(true);
      expect(result.availability).toBeDefined();
      expect(result.availability?.state).toBe(TravelerAvailabilityState.ACTIVE);
      expect(result.availability?.travelerId).toBe('traveler-1');
    });

    it('should reject invalid traveler availability', async () => {
      const invalidAvailability = {
        route: {
          from: { country: '' },
          to: { country: '' }
        },
        dates: {
          availableFrom: new Date(),
          availableTo: new Date(),
          flexibleDates: true
        },
        capacity: {
          maxWeight: 0,
          maxDimensions: { length: 0, width: 0, height: 0 },
          maxItems: 0
        },
        services: {
          canShop: true,
          canDeliver: true,
          canCustomsClear: true,
          canInsurance: true
        },
        pricing: {
          baseRate: 0,
          currency: ''
        }
      };

      const result = marketplaceService.createTravelerAvailability(invalidAvailability, 'traveler-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('Traveler Offers', () => {
    let requestId: string;

    beforeEach(() => {
      // Create a buyer request for offers
      const requestResult = marketplaceService.createBuyerRequest({
        productDescription: 'Test product for offers',
        category: 'electronics',
        destinationCountry: 'USA',
        currency: 'USD'
      }, 'buyer-1');
      requestId = requestResult.request!.id;

      // Create traveler availability
      marketplaceService.createTravelerAvailability({
        route: {
          from: { country: 'UK' },
          to: { country: 'USA' }
        },
        dates: {
          availableFrom: new Date(Date.now() + 24 * 60 * 60 * 1000),
          availableTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          flexibleDates: true
        },
        capacity: {
          maxWeight: 10,
          maxDimensions: { length: 50, width: 30, height: 20 },
          maxItems: 5
        },
        services: {
          canShop: true,
          canDeliver: true,
          canCustomsClear: true,
          canInsurance: true
        },
        pricing: {
          baseRate: 50,
          currency: 'USD'
        }
      }, 'traveler-1');
    });

    it('should submit traveler offer successfully', async () => {
      const offer = {
        requestId,
        proposedPrice: 75,
        currency: 'USD',
        deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        deliveryMethod: 'Express',
        terms: {
          canShop: true,
          canDeliver: true,
          canCustomsClear: true,
          canInsurance: true,
          insuranceIncluded: true,
          trackingIncluded: true,
          estimatedDeliveryTime: 3
        }
      };

      const result = marketplaceService.submitTravelerOffer(offer, 'traveler-1');

      expect(result.success).toBe(true);
      expect(result.offer).toBeDefined();
      expect(result.offer?.state).toBe(OfferState.PENDING);
      expect(result.offer?.requestId).toBe(requestId);
      expect(result.offer?.travelerId).toBe('traveler-1');
      expect(result.expiresAt).toBeDefined();
    });

    it('should reject duplicate offers for same request', async () => {
      const offer = {
        requestId,
        proposedPrice: 75,
        currency: 'USD',
        deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        deliveryMethod: 'Express'
      };

      // First offer should succeed
      const firstResult = marketplaceService.submitTravelerOffer(offer, 'traveler-1');
      expect(firstResult.success).toBe(true);

      // Second offer should fail
      const secondResult = marketplaceService.submitTravelerOffer(offer, 'traveler-1');
      expect(secondResult.success).toBe(false);
      expect(secondResult.error).toContain('already submitted an offer');
    });
  });

  describe('Matching & State Rules', () => {
    let requestId: string;
    let offerId: string;

    beforeEach(() => {
      // Create buyer request
      const requestResult = marketplaceService.createBuyerRequest({
        productDescription: 'Test product for matching',
        category: 'electronics',
        destinationCountry: 'USA',
        currency: 'USD'
      }, 'buyer-1');
      requestId = requestResult.request!.id;

      // Create traveler availability and offer
      marketplaceService.createTravelerAvailability({
        route: {
          from: { country: 'UK' },
          to: { country: 'USA' }
        },
        dates: {
          availableFrom: new Date(Date.now() + 24 * 60 * 60 * 1000),
          availableTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          flexibleDates: true
        },
        capacity: {
          maxWeight: 10,
          maxDimensions: { length: 50, width: 30, height: 20 },
          maxItems: 5
        },
        services: {
          canShop: true,
          canDeliver: true,
          canCustomsClear: true,
          canInsurance: true
        },
        pricing: {
          baseRate: 50,
          currency: 'USD'
        }
      }, 'traveler-1');

      const offerResult = marketplaceService.submitTravelerOffer({
        requestId,
        proposedPrice: 75,
        currency: 'USD',
        deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        deliveryMethod: 'Express'
      }, 'traveler-1');
      offerId = offerResult.offer!.id;
    });

    it('should accept offer and create match successfully', async () => {
      const result = marketplaceService.acceptOffer(requestId, offerId, 'buyer-1');

      expect(result.success).toBe(true);
      expect(result.match).toBeDefined();
      expect(result.match?.state).toBe(MatchState.PENDING);
      expect(result.match?.requestId).toBe(requestId);
      expect(result.match?.offerId).toBe(offerId);
      expect(result.match?.buyerId).toBe('buyer-1');
      expect(result.match?.travelerId).toBe('traveler-1');
    });

    it('should reject offer successfully', async () => {
      const result = marketplaceService.rejectOffer(offerId, 'buyer-1');

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Check offer state
      const offer = marketplaceService.getOffersForRequest(requestId).find(o => o.id === offerId);
      expect(offer?.state).toBe(OfferState.REJECTED);
    });

    it('should prevent accepting non-pending offers', async () => {
      // First reject the offer
      marketplaceService.rejectOffer(offerId, 'buyer-1');

      // Then try to accept it
      const result = marketplaceService.acceptOffer(requestId, offerId, 'buyer-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not in pending state');
    });
  });

  describe('Event Logging', () => {
    it('should log buyer request created event', async () => {
      marketplaceService.createBuyerRequest({
        productDescription: 'Test product',
        category: 'electronics',
        destinationCountry: 'USA',
        currency: 'USD'
      }, 'buyer-1');

      const events = marketplaceService.getEventLog();
      const requestEvent = events.find(e => e.type === 'BUYER_REQUEST_CREATED');

      expect(requestEvent).toBeDefined();
      expect(requestEvent?.category).toBe('BUYER_REQUEST');
      expect(requestEvent?.data.buyerId).toBe('buyer-1');
    });

    it('should log traveler availability created event', async () => {
      marketplaceService.createTravelerAvailability({
        route: {
          from: { country: 'UK' },
          to: { country: 'USA' }
        },
        dates: {
          availableFrom: new Date(Date.now() + 24 * 60 * 60 * 1000),
          availableTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          flexibleDates: true
        },
        capacity: {
          maxWeight: 10,
          maxDimensions: { length: 50, width: 30, height: 20 },
          maxItems: 5
        },
        services: {
          canShop: true,
          canDeliver: true,
          canCustomsClear: true,
          canInsurance: true
        },
        pricing: {
          baseRate: 50,
          currency: 'USD'
        }
      }, 'traveler-1');

      const events = marketplaceService.getEventLog();
      const availabilityEvent = events.find(e => e.type === 'TRAVELER_AVAILABILITY_CREATED');

      expect(availabilityEvent).toBeDefined();
      expect(availabilityEvent?.category).toBe('TRAVELER_AVAILABILITY');
      expect(availabilityEvent?.data.travelerId).toBe('traveler-1');
    });

    it('should log offer submitted event', async () => {
      const requestResult = marketplaceService.createBuyerRequest({
        productDescription: 'Test product',
        category: 'electronics',
        destinationCountry: 'USA',
        currency: 'USD'
      }, 'buyer-1');

      marketplaceService.createTravelerAvailability({
        route: {
          from: { country: 'UK' },
          to: { country: 'USA' }
        },
        dates: {
          availableFrom: new Date(Date.now() + 24 * 60 * 60 * 1000),
          availableTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          flexibleDates: true
        },
        capacity: {
          maxWeight: 10,
          maxDimensions: { length: 50, width: 30, height: 20 },
          maxItems: 5
        },
        services: {
          canShop: true,
          canDeliver: true,
          canCustomsClear: true,
          canInsurance: true
        },
        pricing: {
          baseRate: 50,
          currency: 'USD'
        }
      }, 'traveler-1');

      marketplaceService.submitTravelerOffer({
        requestId: requestResult.request!.id,
        proposedPrice: 75,
        currency: 'USD',
        deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        deliveryMethod: 'Express'
      }, 'traveler-1');

      const events = marketplaceService.getEventLog();
      const offerEvent = events.find(e => e.type === 'TRAVELER_OFFER_SUBMITTED');

      expect(offerEvent).toBeDefined();
      expect(offerEvent?.category).toBe('OFFER');
      expect(offerEvent?.data.travelerId).toBe('traveler-1');
    });
  });

  describe('Statistics', () => {
    it('should track marketplace statistics correctly', async () => {
      // Create buyer request
      marketplaceService.createBuyerRequest({
        productDescription: 'Test product',
        category: 'electronics',
        destinationCountry: 'USA',
        currency: 'USD'
      }, 'buyer-1');

      // Create traveler availability
      marketplaceService.createTravelerAvailability({
        route: {
          from: { country: 'UK' },
          to: { country: 'USA' }
        },
        dates: {
          availableFrom: new Date(Date.now() + 24 * 60 * 60 * 1000),
          availableTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          flexibleDates: true
        },
        capacity: {
          maxWeight: 10,
          maxDimensions: { length: 50, width: 30, height: 20 },
          maxItems: 5
        },
        services: {
          canShop: true,
          canDeliver: true,
          canCustomsClear: true,
          canInsurance: true
        },
        pricing: {
          baseRate: 50,
          currency: 'USD'
        }
      }, 'traveler-1');

      // Submit offer
      const offerResult = marketplaceService.submitTravelerOffer({
        requestId: 'test-request-id',
        proposedPrice: 75,
        currency: 'USD',
        deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        deliveryMethod: 'Express'
      }, 'traveler-1');

      // Accept offer
      marketplaceService.acceptOffer('test-request-id', offerResult.offer!.id, 'buyer-1');

      const stats = marketplaceService.getStatistics();

      expect(stats.totalBuyerRequests).toBe(1);
      expect(stats.totalTravelerAvailabilities).toBe(1);
      expect(stats.totalOffers).toBe(1);
      expect(stats.totalMatches).toBe(1);
    });
  });

  describe('Data Retrieval', () => {
    it('should retrieve buyer request by ID', async () => {
      const requestResult = marketplaceService.createBuyerRequest({
        productDescription: 'Test product',
        category: 'electronics',
        destinationCountry: 'USA',
        currency: 'USD'
      }, 'buyer-1');

      const request = marketplaceService.getBuyerRequest(requestResult.request!.id);

      expect(request).toBeDefined();
      expect(request?.id).toBe(requestResult.request!.id);
      expect(request?.buyerId).toBe('buyer-1');
    });

    it('should retrieve requests for buyer', async () => {
      marketplaceService.createBuyerRequest({
        productDescription: 'Test product 1',
        category: 'electronics',
        destinationCountry: 'USA',
        currency: 'USD'
      }, 'buyer-1');

      marketplaceService.createBuyerRequest({
        productDescription: 'Test product 2',
        category: 'electronics',
        destinationCountry: 'UK',
        currency: 'USD'
      }, 'buyer-1');

      const requests = marketplaceService.getRequestsForBuyer('buyer-1');

      expect(requests).toHaveLength(2);
      expect(requests.every(req => req.buyerId === 'buyer-1')).toBe(true);
    });

    it('should retrieve pending requests', async () => {
      marketplaceService.createBuyerRequest({
        productDescription: 'Test product',
        category: 'electronics',
        destinationCountry: 'USA',
        currency: 'USD'
      }, 'buyer-1');

      const pendingRequests = marketplaceService.getPendingRequests();

      expect(pendingRequests).toHaveLength(1);
      expect(pendingRequests[0].state).toBe(BuyerRequestState.PENDING_TRAVELER);
    });
  });

  describe('Configuration', () => {
    it('should use configuration values correctly', () => {
      expect(marketplaceConfig.buyerRequestTTLHours).toBeGreaterThan(0);
      expect(marketplaceConfig.offerTTLHours).toBeGreaterThan(0);
      expect(marketplaceConfig.maxOffersPerRequest).toBeGreaterThan(0);
      expect(marketplaceConfig.maxActiveRequestsPerBuyer).toBeGreaterThan(0);
      expect(marketplaceConfig.maxActiveAvailabilitiesPerTraveler).toBeGreaterThan(0);
      expect(marketplaceConfig.minTrustScoreForMatching).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const malformedRequest = {
        productDescription: null,
        category: undefined,
        destinationCountry: '',
        currency: ''
      };

      const result = marketplaceService.createBuyerRequest(malformedRequest, 'buyer-1');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle non-existent entities gracefully', async () => {
      const nonExistentRequest = marketplaceService.getBuyerRequest('non-existent-id');
      const nonExistentOffer = marketplaceService.getOffersForRequest('non-existent-id').find(o => o.id === 'non-existent');
      const nonExistentMatch = marketplaceService.getMatch('non-existent-id');

      expect(nonExistentRequest).toBeNull();
      expect(nonExistentOffer).toBeUndefined();
      expect(nonExistentMatch).toBeNull();
    });
  });
});
