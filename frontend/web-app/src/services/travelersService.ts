import axios from 'axios';

// Travelers API Types
export interface TravelerRoute {
  id: string;
  fromCountry: string;
  toCountry: string;
  fromCity?: string;
  toCity?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'on-demand';
  nextAvailable?: string;
}

export interface Traveler {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  status: 'pending' | 'approved' | 'suspended';
  verificationStatus: {
    idVerified: boolean;
    ratingBadge: boolean;
    backgroundCheck: boolean;
  };
  routes: TravelerRoute[];
  feeModel: {
    type: 'flat' | 'percentage';
    amount: number;
    currency: string;
  };
  rating: number;
  completedOrders: number;
  totalEarnings: number;
  joinedAt: string;
  lastActive: string;
  bio?: string;
  languages: string[];
  preferredCategories: string[];
}

export interface CreateTravelerData {
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  routes: Omit<TravelerRoute, 'id'>[];
  feeModel: {
    type: 'flat' | 'percentage';
    amount: number;
    currency: string;
  };
  bio?: string;
  languages: string[];
  preferredCategories: string[];
}

export interface UpdateTravelerData extends Partial<CreateTravelerData> {
  status?: 'pending' | 'approved' | 'suspended';
  verificationStatus?: {
    idVerified?: boolean;
    ratingBadge?: boolean;
    backgroundCheck?: boolean;
  };
}

export interface TravelersResponse {
  travelers: Traveler[];
  total: number;
  page: number;
  limit: number;
}

export interface TravelersFilters {
  status?: 'pending' | 'approved' | 'suspended' | 'all';
  verification?: 'verified' | 'unverified' | 'all';
  search?: string;
  route?: string;
  page?: number;
  limit?: number;
}

// API Base URL
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

/**
 * Travelers Service - Manages traveler accounts and verification
 */
export const travelersService = {
  /**
   * Get all travelers with optional filtering
   */
  async getTravelers(filters: TravelersFilters = {}): Promise<TravelersResponse> {
    const params = new URLSearchParams();
    
    if (filters.status && filters.status !== 'all') {
      params.append('status', filters.status);
    }
    if (filters.verification && filters.verification !== 'all') {
      params.append('verification', filters.verification);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.route) {
      params.append('route', filters.route);
    }
    params.append('page', String(filters.page || 1));
    params.append('limit', String(filters.limit || 20));

    const response = await axios.get<TravelersResponse>(
      `${API_BASE_URL}/admin/travelers?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get traveler by ID
   */
  async getTravelerById(id: string): Promise<Traveler> {
    const response = await axios.get<Traveler>(`${API_BASE_URL}/admin/travelers/${id}`);
    return response.data;
  },

  /**
   * Create a new traveler
   */
  async createTraveler(data: CreateTravelerData): Promise<Traveler> {
    const response = await axios.post<Traveler>(`${API_BASE_URL}/admin/travelers`, data);
    return response.data;
  },

  /**
   * Update an existing traveler
   */
  async updateTraveler(id: string, data: UpdateTravelerData): Promise<Traveler> {
    const response = await axios.put<Traveler>(`${API_BASE_URL}/admin/travelers/${id}`, data);
    return response.data;
  },

  /**
   * Approve a traveler
   */
  async approveTraveler(id: string): Promise<Traveler> {
    const response = await axios.put<Traveler>(`${API_BASE_URL}/admin/travelers/${id}/approve`);
    return response.data;
  },

  /**
   * Suspend a traveler
   */
  async suspendTraveler(id: string, reason?: string): Promise<Traveler> {
    const response = await axios.put<Traveler>(`${API_BASE_URL}/admin/travelers/${id}/suspend`, {
      reason
    });
    return response.data;
  },

  /**
   * Delete a traveler
   */
  async deleteTraveler(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/admin/travelers/${id}`);
  },

  /**
   * Add route to traveler
   */
  async addRoute(travelerId: string, route: Omit<TravelerRoute, 'id'>): Promise<Traveler> {
    const response = await axios.post<Traveler>(
      `${API_BASE_URL}/admin/travelers/${travelerId}/routes`,
      route
    );
    return response.data;
  },

  /**
   * Remove route from traveler
   */
  async removeRoute(travelerId: string, routeId: string): Promise<Traveler> {
    const response = await axios.delete<Traveler>(
      `${API_BASE_URL}/admin/travelers/${travelerId}/routes/${routeId}`
    );
    return response.data;
  },

  /**
   * Update traveler fee model
   */
  async updateFeeModel(travelerId: string, feeModel: Traveler['feeModel']): Promise<Traveler> {
    const response = await axios.put<Traveler>(
      `${API_BASE_URL}/admin/travelers/${travelerId}/fee-model`,
      feeModel
    );
    return response.data;
  },

  /**
   * Get traveler statistics
   */
  async getTravelerStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    suspended: number;
    verified: number;
    averageRating: number;
    totalOrders: number;
    topRoutes: Array<{
      route: string;
      count: number;
    }>;
  }> {
    const response = await axios.get(`${API_BASE_URL}/admin/travelers/stats`);
    return response.data;
  },

  /**
   * Get available travelers for a route
   */
  async getAvailableTravelers(fromCountry: string, toCountry: string): Promise<Traveler[]> {
    const response = await axios.get<Traveler[]>(
      `${API_BASE_URL}/admin/travelers/available?from=${fromCountry}&to=${toCountry}`
    );
    return response.data;
  },
};

export default travelersService;
