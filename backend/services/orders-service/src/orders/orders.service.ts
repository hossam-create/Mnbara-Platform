import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async create(buyerId: number, createOrderDto: CreateOrderDto) {
    // Calculate total amount and weight
    const totalAmount = createOrderDto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const totalWeight = createOrderDto.items.reduce(
      (sum, item) => sum + (item.weight || 0) * item.quantity,
      0,
    );

    const order = await this.prisma.order.create({
      data: {
        buyerId,
        deliveryType: createOrderDto.deliveryType,
        totalAmount,
        totalWeight: totalWeight || null,
        currency: createOrderDto.currency || 'USD',
        pickupCity: createOrderDto.pickupCity,
        pickupCountry: createOrderDto.pickupCountry,
        pickupAddress: createOrderDto.pickupAddress,
        deliveryCity: createOrderDto.deliveryCity,
        deliveryCountry: createOrderDto.deliveryCountry,
        deliveryAddress: createOrderDto.deliveryAddress,
        items: {
          create: createOrderDto.items,
        },
      },
      include: {
        items: true,
        buyer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Clear user's orders cache
    await this.cache.del(`orders:user:${buyerId}`);

    return order;
  }

  async findAll(userId: number, query: QueryOrdersDto) {
    const cacheKey = `orders:user:${userId}:${JSON.stringify(query)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { page = 1, pageSize = 20, status } = query;
    const skip = (page - 1) * pageSize;

    const where = {
      buyerId: userId,
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          items: true,
          traveler: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              rating: true,
            },
          },
          trip: {
            select: {
              id: true,
              originCity: true,
              destCity: true,
              departureDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    const result = {
      data: orders,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };

    await this.cache.set(cacheKey, result, 300); // 5 minutes cache
    return result;
  }

  async findOne(id: number, userId: number) {
    const cacheKey = `order:${id}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const order = await this.prisma.order.findFirst({
      where: { id, buyerId: userId },
      include: {
        items: true,
        buyer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        traveler: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            rating: true,
            phone: true,
          },
        },
        trip: true,
        escrow: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    await this.cache.set(cacheKey, order, 600); // 10 minutes cache
    return order;
  }

  async update(id: number, userId: number, updateOrderDto: UpdateOrderDto) {
    const order = await this.prisma.order.findFirst({
      where: { id, buyerId: userId },
    });

    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    // Validate status transitions
    if (updateOrderDto.status) {
      this.validateStatusTransition(order.status, updateOrderDto.status);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
      include: {
        items: true,
        traveler: true,
        trip: true,
      },
    });

    // Clear caches
    await this.cache.del(`order:${id}`);
    await this.cache.clear(`orders:user:${userId}:*`);

    return updated;
  }

  async cancel(id: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id, buyerId: userId },
    });

    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    if (!['PENDING', 'MATCHED'].includes(order.status)) {
      throw new BadRequestException(
        `Cannot cancel order in ${order.status} status`,
      );
    }

    const cancelled = await this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Clear caches
    await this.cache.del(`order:${id}`);
    await this.cache.clear(`orders:user:${userId}:*`);

    return cancelled;
  }

  async getTracking(id: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id, buyerId: userId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        trackingNumber: true,
        estimatedDelivery: true,
        actualDelivery: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    return order;
  }

  private validateStatusTransition(currentStatus: string, newStatus: string) {
    const validTransitions: Record<string, string[]> = {
      PENDING: ['MATCHED', 'CANCELLED'],
      MATCHED: ['PAID', 'CANCELLED'],
      PAID: ['IN_TRANSIT'],
      IN_TRANSIT: ['DELIVERED', 'DISPUTED'],
      DELIVERED: ['COMPLETED', 'DISPUTED'],
      COMPLETED: [],
      CANCELLED: [],
      DISPUTED: ['COMPLETED', 'CANCELLED'],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
