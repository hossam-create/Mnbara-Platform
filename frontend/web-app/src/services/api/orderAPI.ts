import { apiClient } from './client';

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  currency: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentIntentId?: string;
  clientSecret?: string;
  shippingAddress?: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    title?: string;
    price: number;
    quantity: number;
  }>;
  shippingAddress?: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  paymentMethodId?: string;
  userId: string;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  statusBreakdown: Record<string, number>;
  paymentStatusBreakdown: Record<string, number>;
}

class OrderAPI {
  private baseURL = '/api/orders';

  // Create new order
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const response = await apiClient.post(this.baseURL, data);
    return response.data.order;
  }

  // Get order by ID
  async getOrderById(orderId: string): Promise<Order> {
    const response = await apiClient.get(`${this.baseURL}/${orderId}`);
    return response.data.order;
  }

  // Get orders for user
  async getOrders(params?: {
    userId: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const response = await apiClient.get(this.baseURL, { params });
    return response.data;
  }

  // Update order status
  async updateOrderStatus(orderId: string, data: {
    status?: Order['status'];
    paymentStatus?: Order['paymentStatus'];
  }) {
    const response = await apiClient.put(`${this.baseURL}/${orderId}/status`, data);
    return response.data.order;
  }

  // Cancel order
  async cancelOrder(orderId: string) {
    const response = await apiClient.delete(`${this.baseURL}/${orderId}`);
    return response.data;
  }

  // Get order statistics
  async getOrderStats(userId?: string): Promise<OrderStats> {
    const params = userId ? { userId } : {};
    const response = await apiClient.get(`${this.baseURL}/stats/summary`, { params });
    return response.data.stats;
  }

  // Track order (placeholder for future implementation)
  async trackOrder(orderId: string) {
    // This would integrate with shipping providers
    return {
      orderId,
      status: 'In Transit',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      trackingNumber: `TRK${orderId.slice(-8)}`,
      updates: [
        {
          status: 'Order Confirmed',
          timestamp: new Date().toISOString(),
          location: 'Warehouse'
        }
      ]
    };
  }
}

export const orderAPI = new OrderAPI();