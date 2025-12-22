import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';
import { EmailService } from '../common/email/email.service';
import { EscrowClient } from '../common/payment/escrow.client';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private emailService: EmailService,
    private escrowClient: EscrowClient,
  ) {}

  async create(buyerId: number | null, createOrderDto: CreateOrderDto) {
    // Validate: Either buyerId or guest information must be provided
    const isGuestOrder = !buyerId && (createOrderDto.guestEmail || createOrderDto.guestFirstName);
    
    if (!buyerId && !isGuestOrder) {
      throw new BadRequestException(
        'Either buyerId (for registered users) or guest information (email, firstName) must be provided',
      );
    }

    if (isGuestOrder) {
      // Validate required guest fields
      if (!createOrderDto.guestEmail) {
        throw new BadRequestException('Guest email is required for guest checkout');
      }
      if (!createOrderDto.guestFirstName || !createOrderDto.guestLastName) {
        throw new BadRequestException('Guest first name and last name are required');
      }
    }

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
        buyerId: buyerId || null,
        isGuestOrder,
        guestEmail: isGuestOrder ? createOrderDto.guestEmail : null,
        guestFirstName: isGuestOrder ? createOrderDto.guestFirstName : null,
        guestLastName: isGuestOrder ? createOrderDto.guestLastName : null,
        guestPhone: isGuestOrder ? createOrderDto.guestPhone : null,
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
        buyer: buyerId ? {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        } : false,
      },
    });

    // Clear cache if registered user
    if (buyerId) {
      await this.cache.del(`orders:user:${buyerId}`);
    }

    // Create and hold escrow (must succeed for checkout)
    try {
      const escrow = await this.escrowClient.createEscrow(order.id);
      if (!escrow?.id) {
        throw new Error('Escrow creation failed');
      }
      await this.escrowClient.holdEscrow(escrow.id);
    } catch (error: any) {
      console.error('Escrow hold failed:', error?.message || error);
      throw new BadRequestException('Unable to hold payment in escrow. Please try again.');
    }

    // Send order confirmation email
    const recipientEmail = isGuestOrder 
      ? createOrderDto.guestEmail! 
      : (order.buyer as any)?.email;

    if (recipientEmail) {
      try {
        await this.emailService.sendOrderConfirmation(
          recipientEmail,
          order.orderNumber,
          {
            totalAmount: Number(order.totalAmount),
            currency: order.currency,
            items: order.items.map(item => ({
              productName: item.productName,
              quantity: item.quantity,
              price: Number(item.price),
            })),
            deliveryAddress: `${order.deliveryAddress || ''}, ${order.deliveryCity}, ${order.deliveryCountry}`.trim(),
          },
        );
      } catch (error) {
        // Log but don't fail order creation
        console.error('Failed to send order confirmation email:', error);
      }
    }

    return order;
  }

  /**
   * Create guest order (public endpoint, no authentication required)
   */
  async createGuestOrder(createOrderDto: CreateOrderDto) {
    return this.create(null, createOrderDto);
  }

  async findAll(userId: number | null, email: string | null, query: QueryOrdersDto) {
    // Build cache key
    const cacheKey = userId 
      ? `orders:user:${userId}:${JSON.stringify(query)}`
      : `orders:guest:${email}:${JSON.stringify(query)}`;
    
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { page = 1, pageSize = 20, status } = query;
    const skip = (page - 1) * pageSize;

    // Build where clause for registered user or guest
    const where: any = {
      ...(status && { status }),
    };

    if (userId) {
      where.buyerId = userId;
    } else if (email) {
      where.isGuestOrder = true;
      where.guestEmail = email;
    } else {
      throw new BadRequestException('Either userId or email must be provided');
    }

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

  async findOne(id: number, userId: number | null, email: string | null) {
    const cacheKey = `order:${id}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Build where clause for registered user or guest
    const where: any = { id };
    if (userId) {
      where.buyerId = userId;
    } else if (email) {
      where.isGuestOrder = true;
      where.guestEmail = email;
    } else {
      throw new BadRequestException('Either userId or email must be provided');
    }

    const order = await this.prisma.order.findFirst({
      where,
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

  async update(id: number, userId: number | null, email: string | null, updateOrderDto: UpdateOrderDto) {
    // Build where clause
    const where: any = { id };
    if (userId) {
      where.buyerId = userId;
    } else if (email) {
      where.isGuestOrder = true;
      where.guestEmail = email;
    } else {
      throw new BadRequestException('Either userId or email must be provided');
    }

    const order = await this.prisma.order.findFirst({
      where,
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
    if (userId) {
      await this.cache.clear(`orders:user:${userId}:*`);
    } else if (email) {
      await this.cache.clear(`orders:guest:${email}:*`);
    }

    return updated;
  }

  async cancel(id: number, userId: number | null, email: string | null) {
    // Build where clause
    const where: any = { id };
    if (userId) {
      where.buyerId = userId;
    } else if (email) {
      where.isGuestOrder = true;
      where.guestEmail = email;
    } else {
      throw new BadRequestException('Either userId or email must be provided');
    }

    const order = await this.prisma.order.findFirst({
      where,
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

    // Refund escrow if present
    try {
      const escrow = await this.escrowClient.getEscrowByOrder(id);
      if (escrow?.id) {
        await this.escrowClient.refundEscrow(escrow.id, 'Order cancelled');
      }
    } catch (error) {
      console.error('Failed to refund escrow on cancel', error);
    }

    // Clear caches
    await this.cache.del(`order:${id}`);
    if (userId) {
      await this.cache.clear(`orders:user:${userId}:*`);
    } else if (email) {
      await this.cache.clear(`orders:guest:${email}:*`);
    }

    return cancelled;
  }

  /**
   * Buyer confirms delivery -> release escrow
   */
  async confirmDelivery(orderId: number, userId: number | null) {
    const escrow = await this.escrowClient.getEscrowByOrder(orderId);
    if (!escrow?.id) {
      throw new NotFoundException('Escrow not found for order');
    }

    await this.escrowClient.releaseEscrow(escrow.id, userId ?? undefined);

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
    });

    await this.cache.del(`order:${orderId}`);
    if (userId) {
      await this.cache.clear(`orders:user:${userId}:*`);
    }

    return { success: true };
  }

  async getTracking(id: number, userId: number | null, email: string | null) {
    // Build where clause
    const where: any = { id };
    if (userId) {
      where.buyerId = userId;
    } else if (email) {
      where.isGuestOrder = true;
      where.guestEmail = email;
    } else {
      throw new BadRequestException('Either userId or email must be provided');
    }

    const order = await this.prisma.order.findFirst({
      where,
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

  /**
   * Get guest orders by email (for account creation prompt)
   */
  async getGuestOrdersByEmail(email: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        isGuestOrder: true,
        guestEmail: email,
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        currency: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders;
  }

  /**
   * Link guest orders to a newly created user account
   */
  async linkGuestOrdersToUser(email: string, userId: number) {
    const updated = await this.prisma.order.updateMany({
      where: {
        isGuestOrder: true,
        guestEmail: email,
        buyerId: null,
      },
      data: {
        buyerId: userId,
        isGuestOrder: false,
        guestEmail: null,
        guestFirstName: null,
        guestLastName: null,
        guestPhone: null,
      },
    });

    // Clear guest cache
    await this.cache.clear(`orders:guest:${email}:*`);

    return updated;
  }
}
