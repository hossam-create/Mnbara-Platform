// Order Service - Wholesale B2B
// خدمة الطلبات - البيع بالجملة

import { PrismaClient, BulkOrder, OrderStatus, PaymentStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { productService } from './product.service';

const prisma = new PrismaClient();

interface OrderItem {
  productId: string;
  quantity: number;
}

interface CreateOrderDTO {
  buyerId: string;
  supplierId: string;
  items: OrderItem[];
  shippingAddress: {
    name: string;
    phone: string;
    country: string;
    city: string;
    address: string;
    postalCode?: string;
  };
  shippingMethod?: string;
  paymentMethod: string;
  buyerNotes?: string;
}

interface OrderFilters {
  buyerId?: string;
  supplierId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  fromDate?: Date;
  toDate?: Date;
}

export class OrderService {
  // ==========================================
  // 🛒 ORDER MANAGEMENT
  // ==========================================

  // Create bulk order
  async createOrder(data: CreateOrderDTO): Promise<BulkOrder> {
    // Validate items and calculate prices
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of data.items) {
      const pricing = await productService.getPriceForQuantity(item.productId, item.quantity);
      const availability = await productService.checkAvailability(item.productId, item.quantity);

      if (!availability.available) {
        throw new Error(`Product ${item.productId} is not available in requested quantity`);
      }

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: pricing.unitPrice,
        totalPrice: pricing.totalPrice,
        status: 'PENDING'
      });

      subtotal += pricing.totalPrice;
    }

    // Generate order number
    const orderNumber = `WO-${Date.now()}-${uuidv4().slice(0, 4).toUpperCase()}`;

    // Calculate totals
    const shippingCost = 0; // Calculate based on shipping method
    const taxAmount = 0; // Calculate based on region
    const totalAmount = subtotal + shippingCost + taxAmount;

    // Create order with items
    const order = await prisma.bulkOrder.create({
      data: {
        orderNumber,
        buyerId: data.buyerId,
        supplierId: data.supplierId,
        subtotal,
        shippingCost,
        taxAmount,
        totalAmount,
        currency: 'USD',
        shippingMethod: data.shippingMethod,
        shippingAddress: data.shippingAddress,
        paymentMethod: data.paymentMethod,
        buyerNotes: data.buyerNotes,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        items: {
          create: orderItems
        },
        timeline: {
          create: {
            status: 'PENDING',
            description: 'Order created',
            descriptionAr: 'تم إنشاء الطلب'
          }
        }
      },
      include: {
        items: { include: { product: true } },
        supplier: true,
        timeline: true
      }
    });

    // Reserve stock
    for (const item of data.items) {
      await productService.updateStock(item.productId, item.quantity, 'subtract');
    }

    return order;
  }

  // Get order by ID
  async getOrderById(id: string): Promise<BulkOrder | null> {
    return prisma.bulkOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        supplier: true,
        timeline: { orderBy: { createdAt: 'desc' } }
      }
    });
  }

  // Get order by number
  async getOrderByNumber(orderNumber: string): Promise<BulkOrder | null> {
    return prisma.bulkOrder.findUnique({
      where: { orderNumber },
      include: {
        items: { include: { product: true } },
        supplier: true,
        timeline: { orderBy: { createdAt: 'desc' } }
      }
    });
  }

  // Update order status
  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    notes?: string,
    userId?: string
  ): Promise<BulkOrder> {
    const order = await prisma.bulkOrder.update({
      where: { id },
      data: {
        status,
        supplierNotes: notes,
        timeline: {
          create: {
            status,
            description: `Order status changed to ${status}`,
            descriptionAr: `تم تغيير حالة الطلب إلى ${status}`,
            createdBy: userId
          }
        }
      },
      include: {
        items: true,
        timeline: true
      }
    });

    // If cancelled, restore stock
    if (status === 'CANCELLED') {
      for (const item of order.items) {
        await productService.updateStock(item.productId, item.quantity, 'add');
      }
    }

    return order;
  }

  // Update payment status
  async updatePaymentStatus(
    id: string,
    paymentStatus: PaymentStatus,
    paidAt?: Date
  ): Promise<BulkOrder> {
    return prisma.bulkOrder.update({
      where: { id },
      data: {
        paymentStatus,
        paidAt: paymentStatus === 'PAID' ? (paidAt || new Date()) : null,
        timeline: {
          create: {
            status: `PAYMENT_${paymentStatus}`,
            description: `Payment status: ${paymentStatus}`,
            descriptionAr: `حالة الدفع: ${paymentStatus}`
          }
        }
      }
    });
  }

  // Add tracking number
  async addTrackingNumber(id: string, trackingNumber: string, estimatedDelivery?: Date): Promise<BulkOrder> {
    return prisma.bulkOrder.update({
      where: { id },
      data: {
        trackingNumber,
        estimatedDelivery,
        status: 'SHIPPED',
        timeline: {
          create: {
            status: 'SHIPPED',
            description: `Shipped with tracking: ${trackingNumber}`,
            descriptionAr: `تم الشحن برقم التتبع: ${trackingNumber}`
          }
        }
      }
    });
  }

  // List orders with filters
  async listOrders(
    filters: OrderFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ orders: BulkOrder[]; total: number; pages: number }> {
    const where: any = {};

    if (filters.buyerId) where.buyerId = filters.buyerId;
    if (filters.supplierId) where.supplierId = filters.supplierId;
    if (filters.status) where.status = filters.status;
    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }

    const [orders, total] = await Promise.all([
      prisma.bulkOrder.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: true } },
          supplier: {
            select: { id: true, businessName: true, country: true }
          }
        }
      }),
      prisma.bulkOrder.count({ where })
    ]);

    return {
      orders,
      total,
      pages: Math.ceil(total / limit)
    };
  }

  // ==========================================
  // 📊 ORDER ANALYTICS
  // ==========================================

  // Get order stats for supplier
  async getSupplierOrderStats(supplierId: string, period: 'day' | 'week' | 'month' | 'year'): Promise<{
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    statusBreakdown: Record<string, number>;
  }> {
    const startDate = new Date();
    switch (period) {
      case 'day': startDate.setDate(startDate.getDate() - 1); break;
      case 'week': startDate.setDate(startDate.getDate() - 7); break;
      case 'month': startDate.setMonth(startDate.getMonth() - 1); break;
      case 'year': startDate.setFullYear(startDate.getFullYear() - 1); break;
    }

    const [stats, statusCounts] = await Promise.all([
      prisma.bulkOrder.aggregate({
        where: {
          supplierId,
          createdAt: { gte: startDate }
        },
        _count: true,
        _sum: { totalAmount: true },
        _avg: { totalAmount: true }
      }),
      prisma.bulkOrder.groupBy({
        by: ['status'],
        where: {
          supplierId,
          createdAt: { gte: startDate }
        },
        _count: true
      })
    ]);

    const statusBreakdown: Record<string, number> = {};
    statusCounts.forEach(s => {
      statusBreakdown[s.status] = s._count;
    });

    return {
      totalOrders: stats._count,
      totalRevenue: stats._sum.totalAmount || 0,
      avgOrderValue: stats._avg.totalAmount || 0,
      statusBreakdown
    };
  }

  // Get buyer order history
  async getBuyerOrderHistory(buyerId: string): Promise<{
    totalOrders: number;
    totalSpent: number;
    favoriteSuppliers: string[];
  }> {
    const [stats, suppliers] = await Promise.all([
      prisma.bulkOrder.aggregate({
        where: { buyerId },
        _count: true,
        _sum: { totalAmount: true }
      }),
      prisma.bulkOrder.groupBy({
        by: ['supplierId'],
        where: { buyerId },
        _count: true,
        orderBy: { _count: { supplierId: 'desc' } },
        take: 5
      })
    ]);

    return {
      totalOrders: stats._count,
      totalSpent: stats._sum.totalAmount || 0,
      favoriteSuppliers: suppliers.map(s => s.supplierId)
    };
  }
}

export const orderService = new OrderService();
