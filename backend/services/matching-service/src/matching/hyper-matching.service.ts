import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';
import { GeoService } from '../geo/geo.service';

export interface MatchCandidate {
  orderId: string;
  tripId: string;
  travelerId: string;
  
  // Scoring components
  totalScore: number;
  distanceScore: number;
  priceScore: number;
  ratingScore: number;
  timingScore: number;
  trustScore: number;
  availabilityScore: number;
  
  // Metadata
  pickupDistanceKm: number;
  deliveryDistanceKm: number;
  estimatedCost: number;
  departureDate: Date;
  arrivalDate: Date;
  travelerRating: number;
  travelerTrustScore: number;
  
  // Priority
  priority: number;
  confidence: number;
}

export interface MatchingOptions {
  maxPickupRadiusKm?: number;
  maxDeliveryRadiusKm?: number;
  minScoreThreshold?: number;
  maxResults?: number;
  weightConfig?: WeightConfig;
  prioritizeSpeed?: boolean;
  prioritizePrice?: boolean;
  prioritizeTrust?: boolean;
}

export interface WeightConfig {
  distance: number;      // Default: 0.25
  price: number;         // Default: 0.20
  rating: number;        // Default: 0.20
  timing: number;         // Default: 0.15
  trust: number;          // Default: 0.10
  availability: number;   // Default: 0.10
}

export interface MatchingResult {
  success: boolean;
  totalCandidates: number;
  matchedCandidates: MatchCandidate[];
  executionTime: number;
  algorithm: string;
  weightConfig: WeightConfig;
}

/**
 * Hyper-Matching Algorithm Service
 * خوارزمية المطابقة الفائقة للطلبات مع المسافرين
 * 
 * Scoring Factors (0-100 scale):
 * - Distance: Lower is better (weighted by deviation)
 * - Price: Competitive pricing preferred
 * - Rating: Higher traveler rating preferred
 * - Timing: Earlier/suitable departure preferred
 * - Trust: KYC, verification, history
 * - Availability: Capacity and schedule fit
 */
@Injectable()
export class HyperMatchingService {
  private readonly logger = new Logger(HyperMatchingService.name);

  // Default weight configuration
  private readonly DEFAULT_WEIGHTS: WeightConfig = {
    distance: 0.25,
    price: 0.20,
    rating: 0.20,
    timing: 0.15,
    trust: 0.10,
    availability: 0.10,
  };

  // Speed-optimized weights
  private readonly SPEED_WEIGHTS: WeightConfig = {
    distance: 0.40,
    price: 0.15,
    rating: 0.15,
    timing: 0.20,
    trust: 0.05,
    availability: 0.05,
  };

  // Price-optimized weights
  private readonly PRICE_WEIGHTS: WeightConfig = {
    distance: 0.15,
    price: 0.40,
    rating: 0.15,
    timing: 0.10,
    trust: 0.10,
    availability: 0.10,
  };

  // Trust-optimized weights
  private readonly TRUST_WEIGHTS: WeightConfig = {
    distance: 0.15,
    price: 0.10,
    rating: 0.15,
    timing: 0.10,
    trust: 0.40,
    availability: 0.10,
  };

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private geoService: GeoService,
  ) {}

  /**
   * Find optimal matches for an order
   * البحث عن مطابقات مثالية للطلب
   */
  async findOptimalMatches(
    orderId: string,
    options: MatchingOptions = {},
  ): Promise<MatchingResult> {
    const startTime = Date.now();
    const weights = this.getWeightConfig(options);

    try {
      // Get order details
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          buyer: true,
        },
      });

      if (!order) {
        return {
          success: false,
          totalCandidates: 0,
          matchedCandidates: [],
          executionTime: Date.now() - startTime,
          algorithm: 'HYPER_MATCH_V3',
          weightConfig: weights,
        };
      }

      // Find potential trips using PostGIS
      const candidateTrips = await this.findCandidateTrips(order, options);

      if (candidateTrips.length === 0) {
        return {
          success: true,
          totalCandidates: 0,
          matchedCandidates: [],
          executionTime: Date.now() - startTime,
          algorithm: 'HYPER_MATCH_V3',
          weightConfig: weights,
        };
      }

      // Score each candidate
      const scoredCandidates = await this.scoreCandidates(
        order,
        candidateTrips,
        weights,
      );

      // Filter and sort by score
      const threshold = options.minScoreThreshold ?? 30;
      const maxResults = options.maxResults ?? 20;
      
      const matchedCandidates = scoredCandidates
        .filter((c) => c.totalScore >= threshold)
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, maxResults);

      // Log optimization metrics
      await this.logOptimization({
        algorithm: 'HYPER_MATCH_V3',
        parameters: weights,
        executionTime: Date.now() - startTime,
        resultsCount: matchedCandidates.length,
        avgScore: matchedCandidates.length > 0 
          ? matchedCandidates.reduce((sum, c) => sum + c.totalScore, 0) / matchedCandidates.length 
          : 0,
      });

      return {
        success: true,
        totalCandidates: candidateTrips.length,
        matchedCandidates,
        executionTime: Date.now() - startTime,
        algorithm: 'HYPER_MATCH_V3',
        weightConfig: weights,
      };
    } catch (error) {
      this.logger.error(`Error in hyper-matching: ${error.message}`);
      return {
        success: false,
        totalCandidates: 0,
        matchedCandidates: [],
        executionTime: Date.now() - startTime,
        algorithm: 'HYPER_MATCH_V3',
        weightConfig: weights,
      };
    }
  }

  /**
   * Find candidate trips for an order
   */
  private async findCandidateTrips(order: any, options: MatchingOptions) {
    const maxPickup = options.maxPickupRadiusKm ?? 100;
    const maxDelivery = options.maxDeliveryRadiusKm ?? 100;

    try {
      // Use PostGIS for geospatial queries
      const center = {
        lat: order.pickupLat || 0,
        lon: order.pickupLon || 0,
      };

      const trips = await this.prisma.trip.findMany({
        where: {
          status: 'ACTIVE',
          departureDate: { gte: new Date() },
          availableWeight: { gte: order.totalWeight || 0 },
          originCountry: order.pickupCountry,
          destCountry: order.deliveryCountry,
        },
        include: {
          traveler: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              rating: true,
              kycStatus: true,
              trustScore: true,
              totalDeliveries: true,
              successRate: true,
            },
          },
        },
        take: 100,
      });

      return trips;
    } catch (error) {
      this.logger.error(`Error finding candidate trips: ${error.message}`);
      return [];
    }
  }

  /**
   * Score all candidate trips
   */
  private async scoreCandidates(
    order: any,
    trips: any[],
    weights: WeightConfig,
  ): Promise<MatchCandidate[]> {
    const candidates: MatchCandidate[] = [];

    for (const trip of trips) {
      // Calculate individual scores
      const distanceScore = this.calculateDistanceScore(order, trip, weights.distance);
      const priceScore = this.calculatePriceScore(order, trip, weights.price);
      const ratingScore = this.calculateRatingScore(trip.traveler, weights.rating);
      const timingScore = this.calculateTimingScore(trip, weights.timing);
      const trustScore = this.calculateTrustScore(trip.traveler, weights.trust);
      const availabilityScore = this.calculateAvailabilityScore(trip, weights.availability);

      // Calculate total weighted score
      const totalScore = 
        (distanceScore * weights.distance) +
        (priceScore * weights.price) +
        (ratingScore * weights.rating) +
        (timingScore * weights.timing) +
        (trustScore * weights.trust) +
        (availabilityScore * weights.availability);

      // Calculate distances
      const pickupDistance = this.geoService.haversineDistance(
        order.pickupLat || 0,
        order.pickupLon || 0,
        trip.originLat || 0,
        trip.originLon || 0,
      );

      const deliveryDistance = this.geoService.haversineDistance(
        order.deliveryLat || 0,
        order.deliveryLon || 0,
        trip.destLat || 0,
        trip.destLon || 0,
      );

      // Calculate estimated cost
      const estimatedCost = order.totalWeight
        ? Number(trip.pricePerKg) * Number(order.totalWeight) + (Number(trip.basePrice) || 0)
        : Number(trip.basePrice) || 0;

      // Calculate priority (higher = more urgent)
      const priority = this.calculatePriority(order, trip, totalScore);

      // Calculate confidence based on data completeness
      const confidence = this.calculateConfidence(order, trip);

      candidates.push({
        orderId: order.id,
        tripId: trip.id,
        travelerId: trip.travelerId,
        totalScore,
        distanceScore,
        priceScore,
        ratingScore,
        timingScore,
        trustScore,
        availabilityScore,
        pickupDistanceKm: Math.round(pickupDistance * 100) / 100,
        deliveryDistanceKm: Math.round(deliveryDistance * 100) / 100,
        estimatedCost: Math.round(estimatedCost * 100) / 100,
        departureDate: trip.departureDate,
        arrivalDate: trip.arrivalDate,
        travelerRating: Number(trip.traveler.rating) || 0,
        travelerTrustScore: Number(trip.traveler.trustScore) || 0,
        priority,
        confidence,
      });
    }

    return candidates;
  }

  /**
   * Calculate distance score (0-100)
   * Lower distance = Higher score
   */
  private calculateDistanceScore(order: any, trip: any, weight: number): number {
    // Calculate pickup deviation
    const pickupDistance = this.geoService.haversineDistance(
      order.pickupLat || 0,
      order.pickupLon || 0,
      trip.originLat || 0,
      trip.originLon || 0,
    );

    // Calculate delivery deviation
    const deliveryDistance = this.geoService.haversineDistance(
      order.deliveryLat || 0,
      order.deliveryLon || 0,
      trip.destLat || 0,
      trip.destLon || 0,
    );

    const totalDeviation = pickupDistance + deliveryDistance;

    // Score based on deviation (0 = perfect, 100+ = bad)
    if (totalDeviation <= 5) return 100;
    if (totalDeviation <= 10) return 95;
    if (totalDeviation <= 25) return 85;
    if (totalDeviation <= 50) return 70;
    if (totalDeviation <= 100) return 50;
    if (totalDeviation <= 200) return 30;
    return 10;
  }

  /**
   * Calculate price score (0-100)
   * Lower reasonable price = Higher score
   */
  private calculatePriceScore(order: any, trip: any, weight: number): number {
    const estimatedCost = order.totalWeight
      ? Number(trip.pricePerKg) * Number(order.totalWeight)
      : 0;

    // Calculate price per kg if applicable
    const pricePerKg = order.totalWeight 
      ? estimatedCost / order.totalWeight 
      : estimatedCost;

    // Market-based scoring
    const marketAvgPrice = 10; // Assume $10/kg average market rate
    const priceRatio = pricePerKg / marketAvgPrice;

    if (priceRatio <= 0.5) return 100; // Very cheap
    if (priceRatio <= 0.8) return 90;  // Good deal
    if (priceRatio <= 1.0) return 75;  // Average
    if (priceRatio <= 1.2) return 60;  // Slightly above average
    if (priceRatio <= 1.5) return 40; // Expensive
    if (priceRatio <= 2.0) return 20;  // Very expensive
    return 5;                           // Excessive
  }

  /**
   * Calculate rating score (0-100)
   * Higher rating = Higher score
   */
  private calculateRatingScore(traveler: any, weight: number): number {
    const rating = Number(traveler.rating) || 0;
    
    if (rating >= 4.8) return 100;
    if (rating >= 4.5) return 90;
    if (rating >= 4.0) return 75;
    if (rating >= 3.5) return 60;
    if (rating >= 3.0) return 45;
    if (rating >= 2.5) return 30;
    if (rating >= 2.0) return 15;
    return 5;
  }

  /**
   * Calculate timing score (0-100)
   * Optimal timing = Higher score
   */
  private calculateTimingScore(trip: any, weight: number): number {
    const now = new Date();
    const departure = new Date(trip.departureDate);
    const daysUntilDeparture = (departure.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    // Optimal window: 1-7 days (quick but not rushed)
    if (daysUntilDeparture >= 1 && daysUntilDeparture <= 7) return 100;
    if (daysUntilDeparture > 7 && daysUntilDeparture <= 14) return 85;
    if (daysUntilDeparture > 14 && daysUntilDeparture <= 30) return 70;
    if (daysUntilDeparture > 30 && daysUntilDeparture <= 60) return 50;
    if (daysUntilDeparture > 60) return 30;
    if (daysUntilDeparture < 0) return 0; // Already departed
    if (daysUntilDeparture < 1) return 40; // Same day/next day (rushed)
    
    return 50;
  }

  /**
   * Calculate trust score (0-100)
   * Higher trust signals = Higher score
   */
  private calculateTrustScore(traveler: any, weight: number): number {
    let score = 0;

    // KYC status (30 points)
    if (traveler.kycStatus === 'VERIFIED') score += 30;
    else if (traveler.kycStatus === 'PENDING') score += 15;

    // Trust score (40 points)
    const trustScore = Number(traveler.trustScore) || 0;
    score += Math.min(trustScore, 40);

    // Success rate (20 points)
    const successRate = Number(traveler.successRate) || 0;
    score += (successRate / 100) * 20;

    // Experience bonus (10 points)
    if (traveler.totalDeliveries >= 100) score += 10;
    else if (traveler.totalDeliveries >= 50) score += 7;
    else if (traveler.totalDeliveries >= 10) score += 4;
    else if (traveler.totalDeliveries >= 1) score += 2;

    return Math.min(score, 100);
  }

  /**
   * Calculate availability score (0-100)
   * Better capacity/schedule fit = Higher score
   */
  private calculateAvailabilityScore(trip: any, weight: number): number {
    const availableWeight = Number(trip.availableWeight) || 0;
    const totalCapacity = Number(trip.totalCapacity) || 1;
    const utilization = 1 - (availableWeight / totalCapacity);

    // Lower utilization = higher score (more flexible)
    if (utilization <= 0.2) return 100;
    if (utilization <= 0.4) return 85;
    if (utilization <= 0.6) return 70;
    if (utilization <= 0.8) return 50;
    if (utilization <= 0.9) return 30;
    return 15;
  }

  /**
   * Calculate priority score (0-100)
   * Higher = more urgent/important
   */
  private calculatePriority(order: any, trip: any, totalScore: number): number {
    let priority = 50; // Base priority

    // Urgency factor
    const now = new Date();
    const orderDate = new Date(order.createdAt);
    const hoursSinceOrder = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceOrder > 72) priority += 20; // Urgent (old order)
    else if (hoursSinceOrder > 48) priority += 15;
    else if (hoursSinceOrder > 24) priority += 10;

    // High-value order bonus
    if (order.totalValue > 1000) priority += 15;
    else if (order.totalValue > 500) priority += 10;

    // Match quality bonus
    if (totalScore >= 80) priority += 10;
    else if (totalScore >= 60) priority += 5;

    return Math.min(priority, 100);
  }

  /**
   * Calculate confidence score (0-1)
   * Based on data completeness
   */
  private calculateConfidence(order: any, trip: any): number {
    let knownFields = 0;
    let totalFields = 6;

    // Check location data
    if (order.pickupLat && order.pickupLon) knownFields++;
    if (order.deliveryLat && order.deliveryLon) knownFields++;
    if (trip.originLat && trip.originLon) knownFields++;
    if (trip.destLat && trip.destLon) knownFields++;
    if (order.totalWeight) knownFields++;
    if (trip.pricePerKg) knownFields++;

    return knownFields / totalFields;
  }

  /**
   * Get weight configuration based on options
   */
  private getWeightConfig(options: MatchingOptions): WeightConfig {
    if (options.weightConfig) {
      return options.weightConfig;
    }
    if (options.prioritizeSpeed) {
      return this.SPEED_WEIGHTS;
    }
    if (options.prioritizePrice) {
      return this.PRICE_WEIGHTS;
    }
    if (options.prioritizeTrust) {
      return this.TRUST_WEIGHTS;
    }
    return this.DEFAULT_WEIGHTS;
  }

  /**
   * Log optimization metrics
   */
  private async logOptimization(data: {
    algorithm: string;
    parameters: WeightConfig;
    executionTime: number;
    resultsCount: number;
    avgScore: number;
  }): Promise<void> {
    try {
      await this.prisma.matchingOptimization.create({
        data: {
          algorithm: data.algorithm,
          parameters: data.parameters as any,
          executionTime: data.executionTime,
          resultsCount: data.resultsCount,
          avgScore: data.avgScore,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to log optimization metrics: ${error.message}`);
    }
  }

  /**
   * Get available weight configurations
   */
  getWeightConfigurations(): Record<string, WeightConfig> {
    return {
      DEFAULT: this.DEFAULT_WEIGHTS,
      SPEED_PRIORITY: this.SPEED_WEIGHTS,
      PRICE_PRIORITY: this.PRICE_WEIGHTS,
      TRUST_PRIORITY: this.TRUST_WEIGHTS,
    };
  }

  /**
   * Create custom weight configuration
   */
  createWeightConfig(overrides: Partial<WeightConfig>): WeightConfig {
    return {
      ...this.DEFAULT_WEIGHTS,
      ...overrides,
    };
  }
}
