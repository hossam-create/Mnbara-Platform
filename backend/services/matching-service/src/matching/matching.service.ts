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
}
