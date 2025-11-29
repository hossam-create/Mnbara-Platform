import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { SearchTripsDto } from './dto/search-trips.dto';

@Injectable()
export class TripsService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async create(travelerId: number, createTripDto: CreateTripDto) {
    const trip = await this.prisma.trip.create({
      data: {
        travelerId,
        originCity: createTripDto.originCity,
        originCountry: createTripDto.originCountry,
        originAirport: createTripDto.originAirport,
        destCity: createTripDto.destCity,
        destCountry: createTripDto.destCountry,
        destAirport: createTripDto.destAirport,
        departureDate: new Date(createTripDto.departureDate),
        arrivalDate: new Date(createTripDto.arrivalDate),
        totalWeight: createTripDto.totalWeight,
        availableWeight: createTripDto.totalWeight, // Initially all weight is available
        totalVolume: createTripDto.totalVolume,
        availableVolume: createTripDto.totalVolume,
        allowedCategories: createTripDto.allowedCategories,
        pricePerKg: createTripDto.pricePerKg,
        basePrice: createTripDto.basePrice,
        isPublic: createTripDto.isPublic ?? true,
        notes: createTripDto.notes,
      },
      include: {
        traveler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rating: true,
          },
        },
      },
    });

    // Clear traveler's trips cache
    await this.cache.clear(`trips:traveler:${travelerId}:*`);
    await this.cache.clear('trips:search:*');

    return trip;
  }

  async search(searchDto: SearchTripsDto) {
    const cacheKey = `trips:search:${JSON.stringify(searchDto)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { page = 1, pageSize = 20, ...filters } = searchDto;
    const skip = (page - 1) * pageSize;

    const where: any = {
      status: 'ACTIVE',
      isPublic: true,
      departureDate: { gte: new Date() }, // Only future trips
    };

    if (filters.originCountry) {
      where.originCountry = filters.originCountry;
    }

    if (filters.destCountry) {
      where.destCountry = filters.destCountry;
    }

    if (filters.departureAfter || filters.departureBefore) {
      where.departureDate = {
        ...(filters.departureAfter && { gte: new Date(filters.departureAfter) }),
        ...(filters.departureBefore && { lte: new Date(filters.departureBefore) }),
      };
    }

    if (filters.minWeight) {
      where.availableWeight = { gte: filters.minWeight };
    }

    const [trips, total] = await Promise.all([
      this.prisma.trip.findMany({
        where,
        skip,
        take: pageSize,
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
      }),
      this.prisma.trip.count({ where }),
    ]);

    const result = {
      data: trips,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };

    await this.cache.set(cacheKey, result, 600); // 10 minutes cache
    return result;
  }

  async findOne(id: number) {
    const cacheKey = `trip:${id}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        traveler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rating: true,
            kycStatus: true,
            phone: true,
          },
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalWeight: true,
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip #${id} not found`);
    }

    await this.cache.set(cacheKey, trip, 600);
    return trip;
  }

  async findMyTrips(travelerId: number) {
    const cacheKey = `trips:traveler:${travelerId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const trips = await this.prisma.trip.findMany({
      where: { travelerId },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
          },
        },
      },
      orderBy: { departureDate: 'desc' },
    });

    await this.cache.set(cacheKey, trips, 300);
    return trips;
  }

  async update(id: number, travelerId: number, updateTripDto: UpdateTripDto) {
    const trip = await this.prisma.trip.findFirst({
      where: { id, travelerId },
    });

    if (!trip) {
      throw new NotFoundException(`Trip #${id} not found`);
    }

    // Prevent updates if trip has matched orders
    if (trip.status !== 'ACTIVE' && updateTripDto.status !== 'CANCELLED') {
      throw new BadRequestException('Cannot update trip that is already matched or in progress');
    }

    const updated = await this.prisma.trip.update({
      where: { id },
      data: {
        ...updateTripDto,
        ...(updateTripDto.departureDate && { departureDate: new Date(updateTripDto.departureDate) }),
        ...(updateTripDto.arrivalDate && { arrivalDate: new Date(updateTripDto.arrivalDate) }),
      },
      include: {
        traveler: true,
        orders: true,
      },
    });

    // Clear caches
    await this.cache.del(`trip:${id}`);
    await this.cache.clear(`trips:traveler:${travelerId}:*`);
    await this.cache.clear('trips:search:*');

    return updated;
  }

  async cancel(id: number, travelerId: number) {
    const trip = await this.prisma.trip.findFirst({
      where: { id, travelerId },
      include: { orders: true },
    });

    if (!trip) {
      throw new NotFoundException(`Trip #${id} not found`);
    }

    if (trip.orders.length > 0) {
      throw new BadRequestException('Cannot cancel trip with matched orders');
    }

    const cancelled = await this.prisma.trip.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Clear caches
    await this.cache.del(`trip:${id}`);
    await this.cache.clear(`trips:traveler:${travelerId}:*`);
    await this.cache.clear('trips:search:*');

    return cancelled;
  }
}
