import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OrderService {
  async getOrder(id: string) {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true
      }
    });
  }

  async listOrders(filters: {
    customerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.status) where.status = filters.status;

    const [orders, count] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true
        },
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ]);

    return { orders, count };
  }

  async updateOrderStatus(id: string, status: string) {
    return await prisma.order.update({
      where: { id },
      data: { status }
    });
  }

  async updateFulfillmentStatus(id: string, fulfillmentStatus: string) {
    return await prisma.order.update({
      where: { id },
      data: { fulfillmentStatus }
    });
  }

  async updatePaymentStatus(id: string, paymentStatus: string) {
    return await prisma.order.update({
      where: { id },
      data: { paymentStatus }
    });
  }

  async cancelOrder(id: string) {
    return await prisma.order.update({
      where: { id },
      data: {
        status: 'canceled',
        canceledAt: new Date()
      }
    });
  }

  async getOrderTotal(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const subtotal = order.items.reduce((sum, item) => {
      return sum + (item.unitPrice * item.quantity);
    }, 0);

    return {
      subtotal,
      total: subtotal,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0)
    };
  }

  async getOrdersByCustomer(customerId: string) {
    return await prisma.order.findMany({
      where: { customerId },
      include: {
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
