/**
 * Marketplace Core Journey Types
 * 
 * Buyer and Traveler core journeys for cross-border auction + delivery platform
 * This is the CORE VALUE of the platform, not a feature
 */

export enum BuyerRequestState {
  PENDING_TRAVELER = 'PENDING_TRAVELER',    // Waiting for traveler offers
  OFFERED = 'OFFERED',                      // Has received offers
  MATCHED = 'MATCHED',                        // Matched with traveler
  LOCKED = 'LOCKED',                          // Match locked, no new offers
  EXPIRED = 'EXPIRED'                        // Request expired
}

export enum TravelerAvailabilityState {
  ACTIVE = 'ACTIVE',                          // Available for matching
  BUSY = 'BUSY',                            // Currently traveling/unavailable
  SUSPENDED = 'SUSPENDED',                    // Suspended by admin
  INACTIVE = 'INACTIVE'                        // Deactivated by traveler
}

export enum OfferState {
  PENDING = 'PENDING',                        // Offer submitted, awaiting response
  ACCEPTED = 'ACCEPTED',                      // Offer accepted by buyer
  REJECTED = 'REJECTED',                      // Offer rejected by buyer
  WITHDRAWN = 'WITHDRAWN',                    // Withdrawn by traveler
  EXPIRED = 'EXPIRED'                        // Offer expired
}

export enum MatchState {
  PENDING = 'PENDING',                        // Match created, awaiting confirmation
  CONFIRMED = 'CONFIRMED',                    // Match confirmed by both parties
  LOCKED = 'LOCKED',                          // Match locked, no changes allowed
  CANCELLED = 'CANCELLED',                    // Match cancelled
  COMPLETED = 'COMPLETED'                      // Match completed successfully
}

export enum MarketplaceEventType {
  // Buyer events
  BUYER_REQUEST_CREATED = 'BUYER_REQUEST_CREATED',
  BUYER_REQUEST_EXPIRED = 'BUYER_REQUEST_EXPIRED',
  BUYER_REQUEST_MATCHED = 'BUYER_REQUEST_MATCHED',
  
  // Traveler events
  TRAVELER_AVAILABILITY_CREATED = 'TRAVELER_AVAILABILITY_CREATED',
  TRAVELER_OFFER_SUBMITTED = 'TRAVELER_OFFER_SUBMITTED',
  TRAVELER_OFFER_WITHDRAWN = 'TRAVELER_OFFER_WITHDRAWN',
  
  // Matching events
  MATCH_LOCKED = 'MATCH_LOCKED',
  OFFER_ACCEPTED = 'OFFER_ACCEPTED',
  OFFER_REJECTED = 'OFFER_REJECTED'
}

export interface BuyerRequest {
  id: string;
  buyerId: string;
  productLink?: string;
  productDescription: string;
  category: string;
  preferredDeliveryDate?: Date;
  maxBudget?: number;
  currency: string;
  destinationCountry: string;
  destinationCity?: string;
  specialInstructions?: string;
  state: BuyerRequestState;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
    matchedAt?: Date;
    lockedAt?: Date;
    offerCount: number;
    viewCount: number;
    ipAddress: string;
    userAgent: string;
  };
  requirements: {
    travelerTrustScore?: number;
    minimumRating?: number;
    preferredLanguages?: string[];
    specialRequirements?: string[];
  };
}

export interface TravelerAvailability {
  id: string;
  travelerId: string;
  route: {
    from: {
      country: string;
      city?: string;
      airport?: string;
    };
    to: {
      country: string;
      city?: string;
      airport?: string;
    };
  };
  dates: {
    availableFrom: Date;
    availableTo: Date;
    flexibleDates: boolean;
  };
  capacity: {
    maxWeight: number;
    maxDimensions: {
      length: number;
      width: number;
      height: number;
    };
    maxItems: number;
  };
  services: {
    canShop: boolean;
    canDeliver: boolean;
    canCustomsClear: boolean;
    canInsurance: boolean;
    additionalServices?: string[];
  };
  pricing: {
    baseRate: number;
    currency: string;
    perKgRate?: number;
    perItemRate?: number;
    customsFee?: number;
    insuranceRate?: number;
  };
  state: TravelerAvailabilityState;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastActiveAt?: Date;
    totalMatches: number;
    successRate: number;
    averageResponseTime: number;
  };
  restrictions: {
    prohibitedItems: string[];
    restrictedCountries: string[];
    maxDistance?: number;
    preferredCategories?: string[];
  };
}

export interface TravelerOffer {
  id: string;
  availabilityId: string;
  requestId: string;
  travelerId: string;
  buyerId: string;
  proposedPrice: number;
  currency: string;
  deliveryDate: Date;
  deliveryMethod: string;
  specialTerms?: string;
  state: OfferState;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    submittedAt: Date;
    respondedAt?: Date;
    withdrawnAt?: Date;
    expiresAt?: Date;
    responseTime?: number;
  };
  terms: {
    canShop: boolean;
    canDeliver: boolean;
    canCustomsClear: boolean;
    canInsurance: boolean;
    insuranceIncluded: boolean;
    trackingIncluded: boolean;
    estimatedDeliveryTime: number; // in days
  };
  communication: {
    initialMessage?: string;
    followUpMessages?: string[];
    lastContactAt?: Date;
  };
}

export interface Match {
  id: string;
  requestId: string;
  offerId: string;
  buyerId: string;
  travelerId: string;
  state: MatchState;
  finalPrice: number;
  currency: string;
  deliveryDate: Date;
  deliveryMethod: string;
  specialTerms?: string;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    matchedAt: Date;
    confirmedAt?: Date;
    lockedAt?: Date;
    completedAt?: Date;
    cancelledAt?: Date;
    responseTime: number;
    negotiationRounds: number;
  };
  agreement: {
    buyerAcceptedAt?: Date;
    travelerAcceptedAt?: Date;
    bothConfirmedAt?: Date;
    terms: {
      canShop: boolean;
      canDeliver: boolean;
      canCustomsClear: boolean;
      canInsurance: boolean;
      insuranceIncluded: boolean;
      trackingIncluded: boolean;
      estimatedDeliveryTime: number;
    };
  };
  tracking: {
    status: 'PREPARING' | 'IN_TRANSIT' | 'CUSTOMS' | 'DELIVERED' | 'CANCELLED';
    currentLocation?: string;
    estimatedDelivery?: Date;
    trackingNumber?: string;
    updates: Array<{
      timestamp: Date;
      status: string;
      location?: string;
      description: string;
    }>;
  };
}

export interface MarketplaceEvent {
  id: string;
  category: 'BUYER_REQUEST' | 'TRAVELER_AVAILABILITY' | 'OFFER' | 'MATCH';
  type: MarketplaceEventType;
  timestamp: Date;
  data: {
    requestId?: string;
    offerId?: string;
    matchId?: string;
    buyerId?: string;
    travelerId?: string;
    availabilityId?: string;
    reason?: string;
    metadata?: Record<string, any>;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface BuyerRequestRequest {
  productLink?: string;
  productDescription: string;
  category: string;
  preferredDeliveryDate?: Date;
  maxBudget?: number;
  currency: string;
  destinationCountry: string;
  destinationCity?: string;
  specialInstructions?: string;
  requirements?: {
    travelerTrustScore?: number;
    minimumRating?: number;
    preferredLanguages?: string[];
    specialRequirements?: string[];
  };
}

export interface BuyerRequestResult {
  success: boolean;
  request?: BuyerRequest;
  error?: string;
  expiresAt?: Date;
}

export interface TravelerAvailabilityRequest {
  route: {
    from: {
      country: string;
      city?: string;
      airport?: string;
    };
    to: {
      country: string;
      city?: string;
      airport?: string;
    };
  };
  dates: {
    availableFrom: Date;
    availableTo: Date;
    flexibleDates: boolean;
  };
  capacity: {
    maxWeight: number;
    maxDimensions: {
      length: number;
      width: number;
      height: number;
    };
    maxItems: number;
  };
  services: {
    canShop: boolean;
    canDeliver: boolean;
    canCustomsClear: boolean;
    canInsurance: boolean;
    additionalServices?: string[];
  };
  pricing: {
    baseRate: number;
    currency: string;
    perKgRate?: number;
    perItemRate?: number;
    customsFee?: number;
    insuranceRate?: number;
  };
  restrictions?: {
    prohibitedItems: string[];
    restrictedCountries: string[];
    maxDistance?: number;
    preferredCategories?: string[];
  };
}

export interface TravelerAvailabilityResult {
  success: boolean;
  availability?: TravelerAvailability;
  error?: string;
}

export interface TravelerOfferRequest {
  requestId: string;
  proposedPrice: number;
  currency: string;
  deliveryDate: Date;
  deliveryMethod: string;
  specialTerms?: string;
  terms: {
    canShop: boolean;
    canDeliver: boolean;
    canCustomsClear: boolean;
    canInsurance: boolean;
    insuranceIncluded: boolean;
    trackingIncluded: boolean;
    estimatedDeliveryTime: number;
  };
  communication?: {
    initialMessage?: string;
  };
}

export interface TravelerOfferResult {
  success: boolean;
  offer?: TravelerOffer;
  error?: string;
  expiresAt?: Date;
}

export interface MatchRequest {
  requestId: string;
  offerId: string;
  finalPrice?: number;
  specialTerms?: string;
}

export interface MatchResult {
  success: boolean;
  match?: Match;
  error?: string;
}

export interface MarketplaceStatistics {
  totalBuyerRequests: number;
  activeBuyerRequests: number;
  totalTravelerAvailabilities: number;
  activeTravelerAvailabilities: number;
  totalOffers: number;
  pendingOffers: number;
  totalMatches: number;
  activeMatches: number;
  averageResponseTime: number;
  successRate: number;
  topDestinations: Array<{
    country: string;
    count: number;
  }>;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
}

export interface MarketplaceConfig {
  buyerRequestTTLHours: number;
  offerTTLHours: number;
  maxOffersPerRequest: number;
  maxActiveRequestsPerBuyer: number;
  maxActiveAvailabilitiesPerTraveler: number;
  minTrustScoreForMatching: number;
  allowAutoMatching: boolean;
  enableNotifications: boolean;
  defaultCurrency: string;
}

export interface MarketplaceValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MatchingEligibility {
  eligible: boolean;
  reason?: string;
  score?: number;
  factors: {
    routeMatch: number;
    timingMatch: number;
    capacityMatch: number;
    trustScoreMatch: number;
    priceMatch: number;
  };
}
