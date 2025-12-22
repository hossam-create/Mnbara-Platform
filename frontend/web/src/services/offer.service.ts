/**
 * Offer Service
 * Connects to crowdship-service for offer submission and management
 */

import { apiClient } from './api.service';
import { API_CONFIG, isFeatureEnabled } from '../config/api.config';
import type { ApiResponse } from '../types';

export interface CreateOfferData {
  productId: string;
  buyerId: string;
  travelerId?: string;
  offerType: 'direct_purchase' | 'crowdship' | 'negotiated';
  price: number;
  quantity?: number;
  deliveryMethod: 'traveler' | 'shipping' | 'pickup';
  deliveryAddress?: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
  message?: string;
  travelDetails?: {
    departureDate: string;
    arrivalDate: string;
    departureLocation: string;
    arrivalLocation: string;
  };
}

export interface Offer {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  travelerId?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'counter_offered' | 'expired' | 'completed';
  offerType: string;
  price: number;
  quantity: number;
  deliveryMethod: string;
  deliveryAddress?: unknown;
  message?: string;
  travelDetails?: unknown;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface OfferAction {
  action: 'accept' | 'reject' | 'counter' | 'withdraw';
  counterPrice?: number;
  message?: string;
}

export interface TravelSubmission {
  travelerId: string;
  departureDate: string;
  arrivalDate: string;
  departureLocation: string;
  arrivalLocation: string;
  availableWeight: number;
  pricePerKg?: number;
}

class OfferService {
  private baseUrl = API_CONFIG.SERVICES.CROWDSHIP;
  private enabled = isFeatureEnabled('CROWDSHIP');
  private loading = false;
  private error: string | null = null;
  private cache: Record<string, { data: unknown; timestamp: number }> = {};
  private readonly CACHE_TTL = 2 * 60 * 1000;

  /**
   * Check if crowdship/offers are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  isLoading(): boolean {
    return this.loading;
  }

  getError(): string | null {
    return this.error;
  }

  /**
   * Create a new offer
   */
  async createOffer(data: CreateOfferData): Promise<Offer> {
    if (!this.enabled) {
      throw new Error('Crowdship feature is disabled');
    }

    this.loading = true;
    this.error = null;

    try {
      const response = await apiClient.post<ApiResponse<Offer>>(
        `${this.baseUrl}/offers`,
        data
      );

      if (response.data.success && response.data.data) {
        this.cache = {};
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to create offer');
    } catch (error: unknown) {
      console.error('Failed to create offer:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        err.response?.data?.message ||
        (error instanceof Error ? error.message : 'Failed to create offer');
      this.error = errorMessage;
      throw new Error(errorMessage);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get offer by ID
   */
  async getOffer(offerId: string): Promise<Offer> {
    if (!this.enabled) {
      throw new Error('Crowdship feature is disabled');
    }

    const cacheKey = `offer_${offerId}`;
    const cached = this.cache[cacheKey];

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as Offer;
    }

    this.loading = true;
    this.error = null;

    try {
      const response = await apiClient.get<ApiResponse<Offer>>(
        `${this.baseUrl}/offers/${offerId}`
      );

      if (response.data.success && response.data.data) {
        this.cache[cacheKey] = {
          data: response.data.data,
          timestamp: Date.now(),
        };
        return response.data.data;
      }

      throw new Error(response.data.message || 'Offer not found');
    } catch (error: unknown) {
      console.error('Failed to get offer:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        err.response?.data?.message ||
        (error instanceof Error ? error.message : 'Failed to load offer');
      this.error = errorMessage;
      throw new Error(errorMessage);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Buyer action on offer
   */
  async buyerAction(offerId: string, action: OfferAction): Promise<Offer> {
    if (!this.enabled) {
      throw new Error('Crowdship feature is disabled');
    }

    this.loading = true;
    this.error = null;

    try {
      const response = await apiClient.post<ApiResponse<Offer>>(
        `${this.baseUrl}/offers/${offerId}/buyer`,
        action
      );

      if (response.data.success && response.data.data) {
        this.cache = {};
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to perform buyer action');
    } catch (error: unknown) {
      console.error('Failed to perform buyer action:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        err.response?.data?.message ||
        (error instanceof Error ? error.message : 'Failed to perform action');
      this.error = errorMessage;
      throw new Error(errorMessage);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Traveler action on offer
   */
  async travelerAction(offerId: string, action: OfferAction): Promise<Offer> {
    if (!this.enabled) {
      throw new Error('Crowdship feature is disabled');
    }

    this.loading = true;
    this.error = null;

    try {
      const response = await apiClient.post<ApiResponse<Offer>>(
        `${this.baseUrl}/offers/${offerId}/traveler`,
        action
      );

      if (response.data.success && response.data.data) {
        this.cache = {};
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to perform traveler action');
    } catch (error: unknown) {
      console.error('Failed to perform traveler action:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        err.response?.data?.message ||
        (error instanceof Error ? error.message : 'Failed to perform action');
      this.error = errorMessage;
      throw new Error(errorMessage);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Submit travel details to an offer
   */
  async submitTravel(offerId: string, travelData: TravelSubmission): Promise<Offer> {
    if (!this.enabled) {
      throw new Error('Crowdship feature is disabled');
    }

    this.loading = true;
    this.error = null;

    try {
      const response = await apiClient.post<ApiResponse<Offer>>(
        `${this.baseUrl}/offers/${offerId}/travel`,
        travelData
      );

      if (response.data.success && response.data.data) {
        this.cache = {};
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to submit travel details');
    } catch (error: unknown) {
      console.error('Failed to submit travel details:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        err.response?.data?.message ||
        (error instanceof Error ? error.message : 'Failed to submit travel details');
      this.error = errorMessage;
      throw new Error(errorMessage);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Buyer decision on travel proposal
   */
  async buyerTravelDecision(
    offerId: string,
    decision: { accept: boolean; message?: string }
  ): Promise<Offer> {
    if (!this.enabled) {
      throw new Error('Crowdship feature is disabled');
    }

    this.loading = true;
    this.error = null;

    try {
      const response = await apiClient.post<ApiResponse<Offer>>(
        `${this.baseUrl}/offers/${offerId}/travel/decision`,
        decision
      );

      if (response.data.success && response.data.data) {
        this.cache = {};
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to submit travel decision');
    } catch (error: unknown) {
      console.error('Failed to submit travel decision:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        err.response?.data?.message ||
        (error instanceof Error ? error.message : 'Failed to submit decision');
      this.error = errorMessage;
      throw new Error(errorMessage);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Convert offer to order
   */
  async convertToOrder(offerId: string): Promise<{ orderId: string; offer: Offer }> {
    if (!this.enabled) {
      throw new Error('Crowdship feature is disabled');
    }

    this.loading = true;
    this.error = null;

    try {
      const response = await apiClient.post<ApiResponse<{ orderId: string; offer: Offer }>>(
        `${this.baseUrl}/offers/${offerId}/convert`
      );

      if (response.data.success && response.data.data) {
        this.cache = {};
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to convert offer to order');
    } catch (error: unknown) {
      console.error('Failed to convert offer to order:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        err.response?.data?.message ||
        (error instanceof Error ? error.message : 'Failed to convert to order');
      this.error = errorMessage;
      throw new Error(errorMessage);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get AI recommendation for an offer (feature-flagged)
   */
  async getAIRecommendation(offerId: string): Promise<{
    recommendation: string;
    confidence: number;
    factors: Array<{ name: string; value: string; weight: number }>;
    alternatives?: Array<{ action: string; description: string }>;
  }> {
    if (!this.enabled) {
      throw new Error('Crowdship feature is disabled');
    }

    if (!isFeatureEnabled('AI_ADVISORY')) {
      throw new Error('AI recommendations are disabled');
    }

    this.loading = true;
    this.error = null;

    try {
      const response = await apiClient.get<ApiResponse<{
        recommendation: string;
        confidence: number;
        factors: Array<{ name: string; value: string; weight: number }>;
        alternatives?: Array<{ action: string; description: string }>;
      }>>(
        `${this.baseUrl}/offers/${offerId}/ai/recommendation`
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.message || 'Failed to get AI recommendation');
    } catch (error: unknown) {
      console.error('Failed to get AI recommendation:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        err.response?.data?.message ||
        (error instanceof Error ? error.message : 'Failed to get recommendation');
      this.error = errorMessage;
      throw new Error(errorMessage);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get my offers (buyer view)
   */
  async getMyOffers(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<Offer[]> {
    if (!this.enabled) {
      return [];
    }

    const cacheKey = `myOffers_${JSON.stringify(params ?? {})}`;
    const cached = this.cache[cacheKey];

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as Offer[];
    }

    this.loading = true;
    this.error = null;

    try {
      const response = await apiClient.get<ApiResponse<Offer[]>>(
        `${this.baseUrl}/offers`,
        { params }
      );

      const offers = response.data.data || [];
      this.cache[cacheKey] = {
        data: offers,
        timestamp: Date.now(),
      };
      return offers;
    } catch (error: unknown) {
      console.error('Failed to get my offers:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        err.response?.data?.message ||
        (error instanceof Error ? error.message : 'Failed to get my offers');
      this.error = errorMessage;
      return [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get offers for a product
   */
  async getProductOffers(productId: string): Promise<Offer[]> {
    if (!this.enabled) {
      return [];
    }

    const cacheKey = `productOffers_${productId}`;
    const cached = this.cache[cacheKey];

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as Offer[];
    }

    this.loading = true;
    this.error = null;

    try {
      const response = await apiClient.get<ApiResponse<Offer[]>>(
        `${this.baseUrl}/offers`,
        { params: { productId } }
      );

      const offers = response.data.data || [];
      this.cache[cacheKey] = {
        data: offers,
        timestamp: Date.now(),
      };
      return offers;
    } catch (error: unknown) {
      console.error('Failed to get product offers:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        err.response?.data?.message ||
        (error instanceof Error ? error.message : 'Failed to get product offers');
      this.error = errorMessage;
      return [];
    } finally {
      this.loading = false;
    }
  }
}

export const offerService = new OfferService();
export default offerService;
