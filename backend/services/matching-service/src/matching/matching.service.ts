import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';
import { FindTravelersDto } from './dto/find-travelers.dto';
import { MatchRequestDto } from './dto/match-request.dto';

@Injectable()
export class MatchingService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async findCompatibleTravelers(findDto: FindTravelersDto) {
    // Get order details
    const order = await this.prisma.order.findUnique({
      where: { id: findDto.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order #${findDto.orderId} not found`);
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order is not in PENDING status');
    }

    // Build search criteria
    const where: any = {
      status: 'ACTIVE',
      isPublic: true,
      originCountry: order.pickupCountry,
      destCountry: order.deliveryCountry,
      departureDate: { gte: new Date() },
    };

    if (order.totalWeight) {
      where.availableWeight = { gte: order.totalWeight };
    }

    if (findDto.departureAfter) {
      where.departureDate.gte = new Date(findDto.departureAfter);
    }

    if (findDto.departureBefore) {
      where.departureDate.lte = new Date(findDto.departureBefore);
    }

    // Find compatible trips
    const trips = await this.prisma.trip.findMany({
      where,
      take: findDto.limit || 10,
      include: {
        traveler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rating: true,
            kycStatus: true,
          },
        },
      },
      orderBy: [
        { pricePerKg: 'asc' },
        { departureDate: 'asc' },
      ],
    });

    // Calculate estimated cost for each trip
    const results = trips.map(trip => {
      const estimatedCost = order.totalWeight
        ? Number(trip.pricePerKg) * Number(order.totalWeight) + (Number(trip.basePrice) || 0)
        : Number(trip.basePrice) || 0;

      return {
        trip,
        matchScore: this.calculateMatchScore(order, trip),
        estimatedCost,
        estimatedDelivery: trip.arrivalDate,
      };
    });

    // Sort by match score
    results.sort((a, b) => b.matchScore - a.matchScore);

    return {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        pickupCity: order.pickupCity,
        deliveryCity: order.deliveryCity,
        totalWeight: order.totalWeight,
      },
      matches: results,
    };
  }

  async requestMatch(matchDto: MatchRequestDto, buyerId: number) {
    // Verify order belongs to buyer
    const order = await this.prisma.order.findFirst({
      where: { id: matchDto.orderId, buyerId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order is not in PENDING status');
    }

    // Verify trip exists and is available
    const trip = await this.prisma.trip.findUnique({
      where: { id: matchDto.tripId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.status !== 'ACTIVE') {
      throw new BadRequestException('Trip is not available');
    }

    // Check capacity
    if (order.totalWeight && Number(trip.availableWeight) < Number(order.totalWeight)) {
      throw new BadRequestException('Trip does not have enough capacity');
    }

    // Update order with trip match
    const updatedOrder = await this.prisma.order.update({
      where: { id: matchDto.orderId },
      data: {
        status: 'MATCHED',
        tripId: matchDto.tripId,
        travelerId: trip.travelerId,
      },
      include: {
        trip: true,
        traveler: true,
      },
    });

    // Update trip capacity
    if (order.totalWeight) {
      await this.prisma.trip.update({
        where: { id: matchDto.tripId },
        data: {
          availableWeight: {
            decrement: order.totalWeight,
          },
        },
      });
    }

    // Clear caches
    await this.cache.del(`order:${matchDto.orderId}`);
    await this.cache.del(`trip:${matchDto.tripId}`);

    return {
      message: 'Match request successful',
      order: updatedOrder,
    };
  }

  async acceptMatch(matchDto: MatchRequestDto, travelerId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: matchDto.orderId,
        tripId: matchDto.tripId,
        travelerId,
        status: 'MATCHED',
      },
    });

    if (!order) {
      throw new NotFoundException('Match not found or already processed');
    }

    // Update trip status
    await this.prisma.trip.update({
      where: { id: matchDto.tripId },
      data: { status: 'MATCHED' },
    });

    // Clear caches
    await this.cache.del(`order:${matchDto.orderId}`);
    await this.cache.del(`trip:${matchDto.tripId}`);

    return {
      message: 'Match accepted',
      orderId: order.id,
      tripId: matchDto.tripId,
    };
  }

  async rejectMatch(matchDto: MatchRequestDto, travelerId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: matchDto.orderId,
        tripId: matchDto.tripId,
        travelerId,
        status: 'MATCHED',
      },
    });

    if (!order) {
      throw new NotFoundException('Match not found');
    }

    // Get trip to restore capacity
    const trip = await this.prisma.trip.findUnique({
      where: { id: matchDto.tripId },
    });

    // Reset order
    await this.prisma.order.update({
      where: { id: matchDto.orderId },
      data: {
        status: 'PENDING',
        tripId: null,
        travelerId: null,
      },
    });

    // Restore trip capacity
    if (order.totalWeight && trip) {
      await this.prisma.trip.update({
        where: { id: matchDto.tripId },
        data: {
          availableWeight: {
            increment: order.totalWeight,
          },
        },
      });
    }

    // Clear caches
    await this.cache.del(`order:${matchDto.orderId}`);
    await this.cache.del(`trip:${matchDto.tripId}`);

    return {
      message: 'Match rejected',
      orderId: order.id,
    };
  }

  private calculateMatchScore(order: any, trip: any): number {
    let score = 100;

    // Price factor (lower is better)
    const estimatedCost = order.totalWeight
      ? Number(trip.pricePerKg) * Number(order.totalWeight)
      : 0;
    if (estimatedCost > 0) {
      score -= Math.min(estimatedCost / 10, 30); // Max -30 points
    }

    // Traveler rating (higher is better)
    if (trip.traveler.rating) {
      score += Number(trip.traveler.rating) * 10; // Max +50 points
    }

    // KYC status
    if (trip.traveler.kycStatus) {
      score += 20;
    }

    // Departure date (sooner is better, within reason)
    const daysUntilDeparture = Math.ceil(
      (trip.departureDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntilDeparture <= 7) {
      score += 15;
    } else if (daysUntilDeparture <= 14) {
      score += 10;
    } else if (daysUntilDeparture <= 30) {
      score += 5;
    }

    return Math.max(0, Math.min(200, score)); // Clamp between 0-200
  }

  /**
   * Find nearby delivery requests for a traveler based on their current location
   * البحث عن طلبات التوصيل القريبة للمسافر بناءً على موقعه الحالي
   */
  async findNearbyRequests(travelerId: number, lat: number, lon: number, radiusKm: number = 50) {
    // Get traveler's active trips
    const travelerTrips = await this.prisma.trip.findMany({
      where: {
        travelerId,
        status: 'ACTIVE',
        departureDate: { gte: new Date() },
      },
      select: {
        id: true,
        originCountry: true,
        destCountry: true,
        originCity: true,
        destCity: true,
        availableWeight: true,
      },
    });

    if (travelerTrips.length === 0) {
      return {
        success: true,
        message: 'No active trips found',
        requests: [],
      };
    }

    // Get origin and destination countries from trips
    const originCountries = [...new Set(travelerTrips.map(t => t.originCountry))];
    const destCountries = [...new Set(travelerTrips.map(t => t.destCountry))];

    // Find pending orders that match the traveler's routes
    const nearbyOrders = await this.prisma.order.findMany({
      where: {
        status: 'PENDING',
        OR: [
          {
            pickupCountry: { in: originCountries },
            deliveryCountry: { in: destCountries },
          },
        ],
      },
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rating: true,
          },
        },
        items: true,
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    // Calculate distance and filter by radius
    const requestsWithDistance = nearbyOrders.map(order => {
      // Use order pickup location if available, otherwise use city-based estimation
      const orderLat = order.pickupLat || 0;
      const orderLon = order.pickupLon || 0;
      
      const distance = this.calculateDistance(lat, lon, orderLat, orderLon);
      
      // Find matching trip for this order
      const matchingTrip = travelerTrips.find(
        trip => trip.originCountry === order.pickupCountry && 
                trip.destCountry === order.deliveryCountry
      );

      // Calculate potential earnings
      const potentialEarning = matchingTrip && order.totalWeight
        ? Number(order.totalWeight) * 5 // Assuming $5/kg average
        : order.estimatedFee || 0;

      return {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          pickupCity: order.pickupCity,
          pickupCountry: order.pickupCountry,
          deliveryCity: order.deliveryCity,
          deliveryCountry: order.deliveryCountry,
          totalWeight: order.totalWeight,
          estimatedFee: order.estimatedFee,
          createdAt: order.createdAt,
        },
        buyer: order.buyer,
        itemCount: order.items.length,
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal
        potentialEarning,
        matchingTripId: matchingTrip?.id,
        canDeliver: !!matchingTrip && 
                    (!order.totalWeight || Number(matchingTrip.availableWeight) >= Number(order.totalWeight)),
      };
    });

    // Filter by radius and sort by distance
    const filteredRequests = requestsWithDistance
      .filter(r => r.distance <= radiusKm || r.matchingTripId) // Include if within radius OR has matching trip
      .sort((a, b) => {
        // Prioritize deliverable orders
        if (a.canDeliver !== b.canDeliver) return a.canDeliver ? -1 : 1;
        return a.distance - b.distance;
      });

    return {
      success: true,
      travelerLocation: { lat, lon },
      radiusKm,
      totalFound: filteredRequests.length,
      requests: filteredRequests.slice(0, 20), // Limit to top 20
    };
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

