import axios from 'axios';

// Paste Orders API Types
export interface PasteOrder {
  id: string;
  buyer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  externalLink: string;
  source: 'amazon' | 'aliexpress' | 'ebay' | 'other';
  productInfo: {
    title: string;
    price: number;
    currency: string;
    imageUrl?: string;
    description?: string;
  };
  targetCountry: string;
  targetCity?: string;
  assignedTraveler?: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
  };
  priceBreakdown: {
    itemPrice: number;
    travelerFee: number;
    serviceFee: number;
    total: number;
    currency: string;
  };
  status: 'requested' | 'matched' | 'in-transit' | 'delivered' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
}

export interface CreatePasteOrderData {
  buyerId: string;
  externalLink: string;
  targetCountry: string;
  targetCity?: string;
  notes?: string;
}

export interface UpdatePasteOrderData {
  status?: PasteOrder['status'];
  assignedTravelerId?: string;
  priceBreakdown?: {
    itemPrice: number;
    travelerFee: number;
    serviceFee: number;
    total: number;
    currency: string;
  };
  notes?: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
}

export interface PasteOrdersResponse {
  orders: PasteOrder[];
  total: number;
  page: number;
  limit: number;
}

export interface PasteOrdersFilters {
  status?: PasteOrder['status'] | 'all';
  source?: 'amazon' | 'aliexpress' | 'ebay' | 'other' | 'all';
  assigned?: 'assigned' | 'unassigned' | 'all';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// API Base URL
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

/**
 * Paste Orders Service - Manages paste-link orders and traveler assignments
 */
export const pasteOrdersService = {
  /**
   * Get all paste orders with optional filtering
   */
  async getOrders(filters: PasteOrdersFilters = {}): Promise<PasteOrdersResponse> {
    const params = new URLSearchParams();
    
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters.source && filters.source !== 'all') {
      params.append('source', filters.source);
    }
    if (filters.assigned && filters.assigned !== 'all') {
      params.append('assigned', filters.assigned);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.dateFrom) {
      params.append('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
      params.append('dateTo', filters.dateTo);
    }
    params.append('page', String(filters.page || 1));
    params.append('limit', String(filters.limit || 20));

    const response = await axios.get<PasteOrdersResponse>(
      `${API_BASE_URL}/admin/paste-orders?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get order by ID
   */
  async getOrderById(id: string): Promise<PasteOrder> {
    const response = await axios.get<PasteOrder>(`${API_BASE_URL}/admin/paste-orders/${id}`);
    return response.data;
  },

  /**
   * Create a new paste order
   */
  async createOrder(data: CreatePasteOrderData): Promise<PasteOrder> {
    const response = await axios.post<PasteOrder>(`${API_BASE_URL}/admin/paste-orders`, data);
    return response.data;
  },

  /**
   * Update an existing order
   */
  async updateOrder(id: string, data: UpdatePasteOrderData): Promise<PasteOrder> {
    const response = await axios.patch<PasteOrder>(`${API_BASE_URL}/api/v1/orders/${id}`, data);
    return response.data;
  },

  /**
   * Assign traveler to order
   */
  async assignTraveler(orderId: string, travelerId: string): Promise<PasteOrder> {
    const response = await axios.put<PasteOrder>(
      `${API_BASE_URL}/admin/paste-orders/${orderId}/assign-traveler`,
      { travelerId }
    );
    return response.data;
  },

  /**
   * Update order status
   */
  async updateStatus(orderId: string, status: PasteOrder['status'], notes?: string): Promise<PasteOrder> {
    const response = await axios.put<PasteOrder>(
      `${API_BASE_URL}/admin/paste-orders/${orderId}/status`,
      { status, notes }
    );
    return response.data;
  },

  /**
   * Delete an order
   */
  async deleteOrder(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/admin/paste-orders/${id}`);
  },

  /**
   * Get order statistics
   */
  async getOrderStats(): Promise<{
    total: number;
    requested: number;
    matched: number;
    inTransit: number;
    delivered: number;
    completed: number;
    cancelled: number;
    totalValue: number;
    averageValue: number;
    bySource: Record<string, number>;
    byCountry: Record<string, number>;
  }> {
    const response = await axios.get(`${API_BASE_URL}/admin/paste-orders/stats`);
    return response.data;
  },

  /**
   * Fetch product info from external link
   */
  async fetchProductInfo(url: string): Promise<{
    title: string;
    price: number;
    currency: string;
    imageUrl?: string;
    description?: string;
    source: 'amazon' | 'aliexpress' | 'ebay' | 'other';
  }> {
    const response = await axios.post(`${API_BASE_URL}/admin/paste-orders/fetch-product`, { url });
    return response.data;
  },

  /**
   * Get available travelers for an order
   */
  async getAvailableTravelers(orderId: string): Promise<Array<{
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    fee: number;
    estimatedDelivery: string;
  }>> {
    const response = await axios.get(
      `${API_BASE_URL}/admin/paste-orders/${orderId}/available-travelers`
    );
    return response.data;
  },
};

export default pasteOrdersService;
