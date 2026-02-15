import {
  BuyerRequest,
  TravelerAvailability,
  TravelerOffer,
  Match,
  BuyerRequestState,
  TravelerAvailabilityState,
  OfferState,
  MatchState,
  MarketplaceEventType,
  BuyerRequestRequest,
  BuyerRequestResult,
  TravelerAvailabilityRequest,
  TravelerAvailabilityResult,
  TravelerOfferRequest,
  TravelerOfferResult,
  MatchRequest,
  MatchResult,
  MarketplaceEvent,
  MarketplaceStatistics,
  MatchingEligibility
} from '../types/Marketplace.types';
import {
  marketplaceConfig,
  getBuyerRequestTTL,
  getOfferTTL,
  canBuyerCreateRequest,
  canTravelerCreateAvailability,
  canRequestReceiveMoreOffers,
  isTrustScoreSufficient,
  validateBuyerRequest,
  validateTravelerAvailability,
  validateTravelerOffer
} from '../config/marketplace.config';

/**
 * Marketplace Core Journey Service
 * 
 * Implements CORE MARKETPLACE JOURNEYS for BUYER and TRAVELER
 * This is the CORE VALUE of the platform, not a feature
 * 
 * ABSOLUTE RULES:
 * - Frontend has ZERO authority
 * - All matching, state changes, and eligibility are BACKEND ONLY
 * - Frontend only submits intent and displays backend state
 * - No wallet, escrow, or settlement mutation here
 * - No silent automation — everything logged
 */
export class MarketplaceService {
  private buyerRequests: Map<string, BuyerRequest> = new Map();
  private travelerAvailabilities: Map<string, TravelerAvailability> = new Map();
  private travelerOffers: Map<string, TravelerOffer> = new Map();
  private matches: Map<string, Match> = new Map();
  private eventLog: MarketplaceEvent[] = [];
  private statistics: MarketplaceStatistics = {
    totalBuyerRequests: 0,
    activeBuyerRequests: 0,
    totalTravelerAvailabilities: 0,
    activeTravelerAvailabilities: 0,
    totalOffers: 0,
    pendingOffers: 0,
    totalMatches: 0,
    activeMatches: 0,
    averageResponseTime: 0,
    successRate: 0,
    topDestinations: [],
    topCategories: []
  };

  /**
   * Create buyer request
   * 
   * @param request Buyer request data
   * @returns Buyer request result
   */
  createBuyerRequest(request: BuyerRequestRequest, buyerId: string): BuyerRequestResult {
    try {
      // Validate request
      const validation = validateBuyerRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Check buyer limits
      const activeRequests = this.getActiveRequestsForBuyer(buyerId);
      if (!canBuyerCreateRequest(activeRequests.length)) {
        return {
          success: false,
          error: 'Maximum active requests limit reached'
        };
      }

      // Create request
      const requestId = `buyer_request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + getBuyerRequestTTL());

      const buyerRequest: BuyerRequest = {
        id: requestId,
        buyerId,
        productLink: request.productLink,
        productDescription: request.productDescription,
        category: request.category,
        preferredDeliveryDate: request.preferredDeliveryDate,
        maxBudget: request.maxBudget,
        currency: request.currency,
        destinationCountry: request.destinationCountry,
        destinationCity: request.destinationCity,
        specialInstructions: request.specialInstructions,
        state: BuyerRequestState.PENDING_TRAVELER,
        metadata: {
          createdAt: now,
          updatedAt: now,
          expiresAt,
          offerCount: 0,
          viewCount: 0,
          ipAddress: '127.0.0.1', // Would come from request
          userAgent: 'Marketplace-Service' // Would come from request
        },
        requirements: {
          travelerTrustScore: request.requirements?.travelerTrustScore,
          minimumRating: request.requirements?.minimumRating,
          preferredLanguages: request.requirements?.preferredLanguages,
          specialRequirements: request.requirements?.specialRequirements
        }
      };

      // Store request
      this.buyerRequests.set(requestId, buyerRequest);

      // Update statistics
      this.statistics.totalBuyerRequests++;
      this.statistics.activeBuyerRequests++;

      // Log event
      this.logMarketplaceEvent(MarketplaceEventType.BUYER_REQUEST_CREATED, {
        requestId,
        buyerId,
        metadata: {
          category: request.category,
          destinationCountry: request.destinationCountry,
          expiresAt: expiresAt.toISOString()
        }
      });

      console.log(`[Marketplace] Created buyer request ${requestId} for buyer ${buyerId}`);

      return {
        success: true,
        request: buyerRequest,
        expiresAt
      };

    } catch (error) {
      console.error('[Marketplace] Error creating buyer request:', error);
      return {
        success: false,
        error: 'Internal server error during request creation'
      };
    }
  }

  /**
   * Create traveler availability
   * 
   * @param request Traveler availability data
   * @param travelerId Traveler ID
   * @returns Traveler availability result
   */
  createTravelerAvailability(request: TravelerAvailabilityRequest, travelerId: string): TravelerAvailabilityResult {
    try {
      // Validate request
      const validation = validateTravelerAvailability(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Check traveler limits
      const activeAvailabilities = this.getActiveAvailabilitiesForTraveler(travelerId);
      if (!canTravelerCreateAvailability(activeAvailabilities.length)) {
        return {
          success: false,
          error: 'Maximum active availabilities limit reached'
        };
      }

      // Create availability
      const availabilityId = `traveler_availability_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const availability: TravelerAvailability = {
        id: availabilityId,
        travelerId,
        route: request.route,
        dates: request.dates,
        capacity: request.capacity,
        services: request.services,
        pricing: request.pricing,
        state: TravelerAvailabilityState.ACTIVE,
        metadata: {
          createdAt: now,
          updatedAt: now,
          totalMatches: 0,
          successRate: 0,
          averageResponseTime: 0
        },
        restrictions: request.restrictions || {
          prohibitedItems: [],
          restrictedCountries: [],
          preferredCategories: []
        }
      };

      // Store availability
      this.travelerAvailabilities.set(availabilityId, availability);

      // Update statistics
      this.statistics.totalTravelerAvailabilities++;
      this.statistics.activeTravelerAvailabilities++;

      // Log event
      this.logMarketplaceEvent(MarketplaceEventType.TRAVELER_AVAILABILITY_CREATED, {
        availabilityId,
        travelerId,
        metadata: {
          route: request.route,
          availableFrom: request.dates.availableFrom,
          availableTo: request.dates.availableTo
        }
      });

      console.log(`[Marketplace] Created traveler availability ${availabilityId} for traveler ${travelerId}`);

      return {
        success: true,
        availability
      };

    } catch (error) {
      console.error('[Marketplace] Error creating traveler availability:', error);
      return {
        success: false,
        error: 'Internal server error during availability creation'
      };
    }
  }

  /**
   * Submit traveler offer
   * 
   * @param request Traveler offer data
   * @param travelerId Traveler ID
   * @returns Traveler offer result
   */
  submitTravelerOffer(request: TravelerOfferRequest, travelerId: string): TravelerOfferResult {
    try {
      // Validate request
      const validation = validateTravelerOffer(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Check if request exists and is in correct state
      const buyerRequest = this.buyerRequests.get(request.requestId);
      if (!buyerRequest) {
        return {
          success: false,
          error: 'Buyer request not found'
        };
      }

      if (buyerRequest.state !== BuyerRequestState.PENDING_TRAVELER && buyerRequest.state !== BuyerRequestState.OFFERED) {
        return {
          success: false,
          error: 'Buyer request is not accepting offers'
        };
      }

      // Check if request can receive more offers
      if (!canRequestReceiveMoreOffers(buyerRequest.metadata.offerCount)) {
        return {
          success: false,
          error: 'Maximum offers limit reached for this request'
        };
      }

      // Check if traveler already has an offer for this request
      const existingOffer = Array.from(this.travelerOffers.values()).find(
        offer => offer.requestId === request.requestId && offer.travelerId === travelerId
      );
      if (existingOffer) {
        return {
          success: false,
          error: 'Traveler has already submitted an offer for this request'
        };
      }

      // Check if traveler has active availability
      const activeAvailabilities = this.getActiveAvailabilitiesForTraveler(travelerId);
      if (activeAvailabilities.length === 0) {
        return {
          success: false,
          error: 'Traveler must have active availability to submit offers'
        };
      }

      // Create offer
      const offerId = `traveler_offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + getOfferTTL());

      const offer: TravelerOffer = {
        id: offerId,
        availabilityId: activeAvailabilities[0].id, // Use first active availability
        requestId: request.requestId,
        travelerId,
        buyerId: buyerRequest.buyerId,
        proposedPrice: request.proposedPrice,
        currency: request.currency,
        deliveryDate: request.deliveryDate,
        deliveryMethod: request.deliveryMethod,
        specialTerms: request.specialTerms,
        state: OfferState.PENDING,
        metadata: {
          createdAt: now,
          updatedAt: now,
          submittedAt: now,
          expiresAt
        },
        terms: request.terms,
        communication: {
          initialMessage: request.communication?.initialMessage
        }
      };

      // Store offer
      this.travelerOffers.set(offerId, offer);

      // Update request state and metadata
      buyerRequest.state = BuyerRequestState.OFFERED;
      buyerRequest.metadata.offerCount++;
      buyerRequest.metadata.updatedAt = now;

      // Update statistics
      this.statistics.totalOffers++;
      this.statistics.pendingOffers++;

      // Log events
      this.logMarketplaceEvent(MarketplaceEventType.TRAVELER_OFFER_SUBMITTED, {
        requestId: request.requestId,
        offerId,
        travelerId,
        buyerId: buyerRequest.buyerId,
        metadata: {
          proposedPrice: request.proposedPrice,
          currency: request.currency,
          expiresAt: expiresAt.toISOString()
        }
      });

      console.log(`[Marketplace] Submitted traveler offer ${offerId} for request ${request.requestId}`);

      return {
        success: true,
        offer,
        expiresAt
      };

    } catch (error) {
      console.error('[Marketplace] Error submitting traveler offer:', error);
      return {
        success: false,
        error: 'Internal server error during offer submission'
      };
    }
  }

  /**
   * Accept traveler offer
   * 
   * @param requestId Request ID
   * @param offerId Offer ID
   * @param buyerId Buyer ID
   * @returns Match result
   */
  acceptOffer(requestId: string, offerId: string, buyerId: string): MatchResult {
    try {
      // Validate request and offer
      const buyerRequest = this.buyerRequests.get(requestId);
      const offer = this.travelerOffers.get(offerId);

      if (!buyerRequest) {
        return {
          success: false,
          error: 'Buyer request not found'
        };
      }

      if (!offer) {
        return {
          success: false,
          error: 'Offer not found'
        };
      }

      if (buyerRequest.buyerId !== buyerId) {
        return {
          success: false,
          error: 'Buyer ID does not match request'
        };
      }

      if (offer.buyerId !== buyerId) {
        return {
          success: false,
          error: 'Offer does not belong to this buyer'
        };
      }

      if (offer.state !== OfferState.PENDING) {
        return {
          success: false,
          error: 'Offer is not in pending state'
        };
      }

      if (buyerRequest.state !== BuyerRequestState.OFFERED) {
        return {
          success: false,
          error: 'Request is not in offered state'
        };
      }

      // Create match
      const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      const match: Match = {
        id: matchId,
        requestId,
        offerId,
        buyerId,
        travelerId: offer.travelerId,
        state: MatchState.PENDING,
        finalPrice: offer.proposedPrice,
        currency: offer.currency,
        deliveryDate: offer.deliveryDate,
        deliveryMethod: offer.deliveryMethod,
        specialTerms: offer.specialTerms,
        metadata: {
          createdAt: now,
          updatedAt: now,
          matchedAt: now,
          responseTime: now.getTime() - offer.metadata.submittedAt.getTime(),
          negotiationRounds: 1
        },
        agreement: {
          buyerAcceptedAt: now,
          terms: offer.terms
        },
        tracking: {
          status: 'PREPARING',
          updates: []
        }
      };

      // Store match
      this.matches.set(matchId, match);

      // Update offer state
      offer.state = OfferState.ACCEPTED;
      offer.metadata.respondedAt = now;
      offer.metadata.responseTime = now.getTime() - offer.metadata.submittedAt.getTime();
      offer.metadata.updatedAt = now;

      // Update request state
      buyerRequest.state = BuyerRequestState.MATCHED;
      buyerRequest.metadata.matchedAt = now;
      buyerRequest.metadata.updatedAt = now;

      // Update statistics
      this.statistics.totalMatches++;
      this.statistics.activeMatches++;
      this.statistics.pendingOffers--;

      // Log events
      this.logMarketplaceEvent(MarketplaceEventType.OFFER_ACCEPTED, {
        requestId,
        offerId,
        matchId,
        buyerId,
        travelerId: offer.travelerId,
        metadata: {
          finalPrice: offer.proposedPrice,
          responseTime: offer.metadata.responseTime
        }
      });

      this.logMarketplaceEvent(MarketplaceEventType.BUYER_REQUEST_MATCHED, {
        requestId,
        buyerId,
        matchId,
        metadata: {
          matchedAt: now.toISOString(),
          finalPrice: offer.proposedPrice
        }
      });

      console.log(`[Marketplace] Created match ${matchId} for request ${requestId} and offer ${offerId}`);

      return {
        success: true,
        match
      };

    } catch (error) {
      console.error('[Marketplace] Error accepting offer:', error);
      return {
        success: false,
        error: 'Internal server error during offer acceptance'
      };
    }
  }

  /**
   * Reject traveler offer
   * 
   * @param offerId Offer ID
   * @param buyerId Buyer ID
   * @returns Success status
   */
  rejectOffer(offerId: string, buyerId: string): { success: boolean; error?: string } {
    try {
      const offer = this.travelerOffers.get(offerId);
      if (!offer) {
        return {
          success: false,
          error: 'Offer not found'
        };
      }

      if (offer.buyerId !== buyerId) {
        return {
          success: false,
          error: 'Offer does not belong to this buyer'
        };
      }

      if (offer.state !== OfferState.PENDING) {
        return {
          success: false,
          error: 'Offer is not in pending state'
        };
      }

      // Update offer state
      const now = new Date();
      offer.state = OfferState.REJECTED;
      offer.metadata.respondedAt = now;
      offer.metadata.responseTime = now.getTime() - offer.metadata.submittedAt.getTime();
      offer.metadata.updatedAt = now;

      // Update statistics
      this.statistics.pendingOffers--;

      // Log event
      this.logMarketplaceEvent(MarketplaceEventType.OFFER_REJECTED, {
        requestId: offer.requestId,
        offerId,
        buyerId,
        travelerId: offer.travelerId,
        metadata: {
          responseTime: offer.metadata.responseTime
        }
      });

      console.log(`[Marketplace] Rejected offer ${offerId}`);

      return { success: true };

    } catch (error) {
      console.error('[Marketplace] Error rejecting offer:', error);
      return {
        success: false,
        error: 'Internal server error during offer rejection'
      };
    }
  }

  /**
   * Get buyer request by ID
   */
  getBuyerRequest(requestId: string): BuyerRequest | null {
    return this.buyerRequests.get(requestId) || null;
  }

  /**
   * Get requests for buyer
   */
  getRequestsForBuyer(buyerId: string): BuyerRequest[] {
    return Array.from(this.buyerRequests.values()).filter(
      request => request.buyerId === buyerId
    );
  }

  /**
   * Get pending requests for travelers
   */
  getPendingRequests(): BuyerRequest[] {
    return Array.from(this.buyerRequests.values()).filter(
      request => request.state === BuyerRequestState.PENDING_TRAVELER || request.state === BuyerRequestState.OFFERED
    );
  }

  /**
   * Get traveler availability by ID
   */
  getTravelerAvailability(availabilityId: string): TravelerAvailability | null {
    return this.travelerAvailabilities.get(availabilityId) || null;
  }

  /**
   * Get availabilities for traveler
   */
  getAvailabilitiesForTraveler(travelerId: string): TravelerAvailability[] {
    return Array.from(this.travelerAvailabilities.values()).filter(
      availability => availability.travelerId === travelerId
    );
  }

  /**
   * Get offers for request
   */
  getOffersForRequest(requestId: string): TravelerOffer[] {
    return Array.from(this.travelerOffers.values()).filter(
      offer => offer.requestId === requestId
    );
  }

  /**
   * Get offers for traveler
   */
  getOffersForTraveler(travelerId: string): TravelerOffer[] {
    return Array.from(this.travelerOffers.values()).filter(
      offer => offer.travelerId === travelerId
    );
  }

  /**
   * Get match by ID
   */
  getMatch(matchId: string): Match | null {
    return this.matches.get(matchId) || null;
  }

  /**
   * Get matches for buyer
   */
  getMatchesForBuyer(buyerId: string): Match[] {
    return Array.from(this.matches.values()).filter(
      match => match.buyerId === buyerId
    );
  }

  /**
   * Get matches for traveler
   */
  getMatchesForTraveler(travelerId: string): Match[] {
    return Array.from(this.matches.values()).filter(
      match => match.travelerId === travelerId
    );
  }

  /**
   * Get marketplace statistics
   */
  getStatistics(): MarketplaceStatistics {
    return { ...this.statistics };
  }

  /**
   * Get event log
   */
  getEventLog(limit?: number): MarketplaceEvent[] {
    if (limit) {
      return this.eventLog.slice(-limit);
    }
    return [...this.eventLog];
  }

  /**
   * Process expired requests and offers
   */
  processExpiredItems(): void {
    const now = new Date();
    
    // Process expired buyer requests
    for (const [requestId, request] of this.buyerRequests.entries()) {
      if (request.metadata.expiresAt && now > request.metadata.expiresAt) {
        if (request.state === BuyerRequestState.PENDING_TRAVELER || request.state === BuyerRequestState.OFFERED) {
          request.state = BuyerRequestState.EXPIRED;
          request.metadata.updatedAt = now;
          
          this.statistics.activeBuyerRequests--;
          
          this.logMarketplaceEvent(MarketplaceEventType.BUYER_REQUEST_EXPIRED, {
            requestId,
            buyerId: request.buyerId,
            metadata: {
              expiredAt: now.toISOString(),
              originalState: request.state
            }
          });
          
          console.log(`[Marketplace] Expired buyer request ${requestId}`);
        }
      }
    }

    // Process expired offers
    for (const [offerId, offer] of this.travelerOffers.entries()) {
      if (offer.metadata.expiresAt && now > offer.metadata.expiresAt) {
        if (offer.state === OfferState.PENDING) {
          offer.state = OfferState.EXPIRED;
          offer.metadata.updatedAt = now;
          
          this.statistics.pendingOffers--;
          
          this.logMarketplaceEvent(MarketplaceEventType.TRAVELER_OFFER_WITHDRAWN, {
            requestId: offer.requestId,
            offerId,
            travelerId: offer.travelerId,
            buyerId: offer.buyerId,
            metadata: {
              expiredAt: now.toISOString(),
              reason: 'EXPIRED'
            }
          });
          
          console.log(`[Marketplace] Expired traveler offer ${offerId}`);
        }
      }
    }
  }

  /**
   * Get active requests for buyer
   */
  private getActiveRequestsForBuyer(buyerId: string): BuyerRequest[] {
    return Array.from(this.buyerRequests.values()).filter(
      request => request.buyerId === buyerId && 
      (request.state === BuyerRequestState.PENDING_TRAVELER || 
       request.state === BuyerRequestState.OFFERED || 
       request.state === BuyerRequestState.MATCHED)
    );
  }

  /**
   * Get active availabilities for traveler
   */
  private getActiveAvailabilitiesForTraveler(travelerId: string): TravelerAvailability[] {
    return Array.from(this.travelerAvailabilities.values()).filter(
      availability => availability.travelerId === travelerId && 
      availability.state === TravelerAvailabilityState.ACTIVE
    );
  }

  /**
   * Log marketplace event
   */
  private logMarketplaceEvent(type: MarketplaceEventType, data: any): void {
    const event: MarketplaceEvent = {
      id: `marketplace_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category: this.getEventCategory(type),
      type,
      timestamp: new Date(),
      data,
      severity: this.getEventSeverity(type)
    };

    this.eventLog.push(event);
    console.log(`[Marketplace] Event: ${type} for ${data.requestId || data.offerId || data.matchId}`);
  }

  /**
   * Get event category based on type
   */
  private getEventCategory(type: MarketplaceEventType): 'BUYER_REQUEST' | 'TRAVELER_AVAILABILITY' | 'OFFER' | 'MATCH' {
    switch (type) {
      case MarketplaceEventType.BUYER_REQUEST_CREATED:
      case MarketplaceEventType.BUYER_REQUEST_EXPIRED:
      case MarketplaceEventType.BUYER_REQUEST_MATCHED:
        return 'BUYER_REQUEST';
      case MarketplaceEventType.TRAVELER_AVAILABILITY_CREATED:
        return 'TRAVELER_AVAILABILITY';
      case MarketplaceEventType.TRAVELER_OFFER_SUBMITTED:
      case MarketplaceEventType.TRAVELER_OFFER_WITHDRAWN:
        return 'OFFER';
      case MarketplaceEventType.MATCH_LOCKED:
      case MarketplaceEventType.OFFER_ACCEPTED:
      case MarketplaceEventType.OFFER_REJECTED:
        return 'MATCH';
      default:
        return 'BUYER_REQUEST';
    }
  }

  /**
   * Get event severity based on type
   */
  private getEventSeverity(type: MarketplaceEventType): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (type) {
      case MarketplaceEventType.BUYER_REQUEST_CREATED:
        return 'LOW';
      case MarketplaceEventType.BUYER_REQUEST_EXPIRED:
        return 'MEDIUM';
      case MarketplaceEventType.BUYER_REQUEST_MATCHED:
        return 'MEDIUM';
      case MarketplaceEventType.TRAVELER_AVAILABILITY_CREATED:
        return 'LOW';
      case MarketplaceEventType.TRAVELER_OFFER_SUBMITTED:
        return 'MEDIUM';
      case MarketplaceEventType.TRAVELER_OFFER_WITHDRAWN:
        return 'LOW';
      case MarketplaceEventType.MATCH_LOCKED:
        return 'HIGH';
      case MarketplaceEventType.OFFER_ACCEPTED:
        return 'HIGH';
      case MarketplaceEventType.OFFER_REJECTED:
        return 'LOW';
      default:
        return 'LOW';
    }
  }

  /**
   * Reset all data (for testing)
   */
  reset(): void {
    this.buyerRequests.clear();
    this.travelerAvailabilities.clear();
    this.travelerOffers.clear();
    this.matches.clear();
    this.eventLog = [];
    this.statistics = {
      totalBuyerRequests: 0,
      activeBuyerRequests: 0,
      totalTravelerAvailabilities: 0,
      activeTravelerAvailabilities: 0,
      totalOffers: 0,
      pendingOffers: 0,
      totalMatches: 0,
      activeMatches: 0,
      averageResponseTime: 0,
      successRate: 0,
      topDestinations: [],
      topCategories: []
    };
  }
}

// Singleton instance
export const marketplaceService = new MarketplaceService();
