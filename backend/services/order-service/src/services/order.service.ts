import { prisma } from '../utils/prisma';
import { Order, OrderStatus, PaymentStatus, Prisma } from '@prisma/client';

export interface CreateOrderDto {
  userId: string;
  items: {
    productId: string;
    variantId?: string;
    title: string;
    price: number;
    quantity: number;
    sku?: string;
    properties?: any;
  }[];
  shippingAddress?: {
    firstName: string;
    lastName: string;
    address1: string;
    city: string;
    country: string;
    countryCode: string;
    postalCode: string;
    phone?: string;
  };
  paymentMethodId?: string;
}

export class OrderService {
  /**
   * Create a new order with items and address
   */
  async createOrder(data: CreateOrderDto) {
    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxTotal = 0; // TODO: Implement tax calculation service integration
    const shippingTotal = 0; // TODO: Implement shipping calculation
    const total = subtotal + taxTotal + shippingTotal;
    
    // Generate Order Number (Simple timestamp based for now, ideally sequential)
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return await prisma.$transaction(async (tx) => {
      // Create Shipping Address if provided
      let shippingAddressId = null;
      if (data.shippingAddress) {
        const address = await tx.address.create({
          data: {
            ...data.shippingAddress,
            // Provide defaults for required fields if missing in DTO
            address2: '', 
            company: '',
            province: '',
            provinceCode: ''
          }
        });
        shippingAddressId = address.id;
      }

      // Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: data.userId,
          currency: 'USD',
          subtotal: new Prisma.Decimal(subtotal),
          taxTotal: new Prisma.Decimal(taxTotal),
          shippingTotal: new Prisma.Decimal(shippingTotal),
          total: new Prisma.Decimal(total),
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          shippingAddressId,
          paymentMethodId: data.paymentMethodId,
          
          // Create Items
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              title: item.title,
              price: new Prisma.Decimal(item.price),
              quantity: item.quantity,
              sku: item.sku,
              properties: item.properties,
              requiresShipping: true
            }))
          },
          
          // Initial Event
          events: {
            create: {
              type: 'ORDER_CREATED',
              message: 'Order created successfully',
              userId: data.userId
            }
          }
        },
        include: {
          items: true,
          shippingAddress: true
        }
      });

      return order;
    });
  }

  /**
   * Get Order by ID
   */
  async getOrder(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
        events: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  /**
   * Get User Orders
   */
  async getUserOrders(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true
        }
      }),
      prisma.order.count({ where: { userId } })
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update Order Status
   */
  async updateStatus(orderId: string, status: OrderStatus, userId?: string) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { 
          status,
          events: {
            create: {
              type: 'STATUS_CHANGE',
              message: `Order status updated to ${status}`,
              userId: userId || 'SYSTEM'
            }
          }
        }
      });
      return order;
    });
  }

  /**
   * Update Payment Status
   */
    async updatePaymentStatus(orderId: string, status: PaymentStatus, paymentIntentId?: string) {
    return await prisma.order.update({
      where: { id: orderId },
      data: { 
        paymentStatus: status,
        paymentIntentId,
        events: {
          create: {
            type: 'PAYMENT_UPDATE',
            message: `Payment status updated to ${status}`,
            metadata: { paymentIntentId }
          }
        }
      }
    });
  }
}
