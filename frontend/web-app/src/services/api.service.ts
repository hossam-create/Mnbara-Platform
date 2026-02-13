import axios from 'axios';

// API base configuration
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// API service functions
export const apiService = {
  // Auth endpoints
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiClient.post('/api/v1/auth/login', credentials),
    register: (userData: any) =>
      apiClient.post('/api/v1/auth/register', userData),
    logout: () =>
      apiClient.post('/api/v1/auth/logout'),
    refreshToken: () =>
      apiClient.post('/api/v1/auth/refresh'),
    verifyEmail: (token: string) =>
      apiClient.post('/api/v1/auth/verify-email', { token }),
    forgotPassword: (email: string) =>
      apiClient.post('/api/v1/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string) =>
      apiClient.post('/api/v1/auth/reset-password', { token, password }),
  },

  // Product/Listing endpoints
  products: {
    search: (params: {
      q?: string;
      category?: string;
      condition?: string;
      minPrice?: number;
      maxPrice?: number;
      sort?: string;
      page?: number;
      limit?: number;
    }) => apiClient.get('/api/v1/listings/search', { params }),
    
    getFeatured: () =>
      apiClient.get('/api/v1/listings/featured'),
    
    getTrending: () =>
      apiClient.get('/api/v1/listings/trending'),
    
    getDeals: () =>
      apiClient.get('/api/v1/listings/deals'),
    
    getById: (id: string) =>
      apiClient.get(`/api/v1/listings/${id}`),
    
    create: (productData: any) =>
      apiClient.post('/api/v1/listings', productData),
    
    update: (id: string, productData: any) =>
      apiClient.put(`/api/v1/listings/${id}`, productData),
    
    delete: (id: string) =>
      apiClient.delete(`/api/v1/listings/${id}`),
  },

  // Category endpoints
  categories: {
    getAll: () =>
      apiClient.get('/api/v1/categories'),
    
    getById: (id: string) =>
      apiClient.get(`/api/v1/categories/${id}`),
    
    getProducts: (categoryId: string, params?: any) =>
      apiClient.get(`/api/v1/categories/${categoryId}/products`, { params }),
  },

  // User endpoints
  users: {
    getProfile: () =>
      apiClient.get('/api/v1/users/profile'),
    
    updateProfile: (userData: any) =>
      apiClient.put('/api/v1/users/profile', userData),
    
    getWatchlist: () =>
      apiClient.get('/api/v1/users/watchlist'),
    
    addToWatchlist: (productId: string) =>
      apiClient.post(`/api/v1/users/watchlist/${productId}`),
    
    removeFromWatchlist: (productId: string) =>
      apiClient.delete(`/api/v1/users/watchlist/${productId}`),
    
    getOrders: () =>
      apiClient.get('/api/v1/users/orders'),
    
    getOrderById: (orderId: string) =>
      apiClient.get(`/api/v1/users/orders/${orderId}`),
  },

  // Cart endpoints
  cart: {
    get: () =>
      apiClient.get('/api/v1/cart'),
    
    addItem: (productId: string, quantity: number) =>
      apiClient.post('/api/v1/cart/items', { productId, quantity }),
    
    updateItem: (itemId: string, quantity: number) =>
      apiClient.put(`/api/v1/cart/items/${itemId}`, { quantity }),
    
    removeItem: (itemId: string) =>
      apiClient.delete(`/api/v1/cart/items/${itemId}`),
    
    clear: () =>
      apiClient.delete('/api/v1/cart'),
  },

  // Auction endpoints
  auctions: {
    getActive: () =>
      apiClient.get('/api/v1/auctions/active'),
    
    getById: (id: string) =>
      apiClient.get(`/api/v1/auctions/${id}`),
    
    placeBid: (auctionId: string, amount: number) =>
      apiClient.post(`/api/v1/auctions/${auctionId}/bid`, { amount }),
    
    getBids: (auctionId: string) =>
      apiClient.get(`/api/v1/auctions/${auctionId}/bids`),
  },

  // Payment endpoints
  payments: {
    createPaymentIntent: (orderData: any) =>
      apiClient.post('/api/v1/payments/create-intent', orderData),
    
    confirmPayment: (paymentIntentId: string) =>
      apiClient.post('/api/v1/payments/confirm', { paymentIntentId }),
  },

  // Wallet v2 endpoints
  walletV2: {
    getByOwner: (ownerType: string, ownerId: string, currency?: string) =>
      apiClient.get(`/api/v2/wallets/owner/${ownerType}/${ownerId}`, { params: { currency } }),
    getBalance: (walletId: string) =>
      apiClient.get(`/api/v2/wallets/${walletId}/balance`),
    listLedger: (walletId: string, params?: {
      entryType?: string;
      reason?: string;
      referenceType?: string;
      referenceId?: string;
      fromDate?: string;
      toDate?: string;
      limit?: number;
      offset?: number;
    }) => apiClient.get(`/api/v2/wallets/${walletId}/ledger`, { params }),
  },

  // Escrow endpoints
  escrow: {
    getById: (escrowId: string) =>
      apiClient.get(`/api/v1/escrow/${escrowId}`),
    getUserEscrows: (userId: string, params?: {
      role?: 'buyer' | 'seller' | 'all'
      status?: 'HELD' | 'RELEASED' | 'REFUNDED' | 'DISPUTED' | 'CANCELLED'
      limit?: number
      offset?: number
    }) =>
      apiClient.get(`/api/v1/escrow/user/${userId}`, { params }),
    getByOrder: (orderId: string) =>
      apiClient.get(`/api/v1/escrow/order/${orderId}`),
    getStatus: (escrowId: string) =>
      apiClient.get(`/api/v1/escrow/${escrowId}/status`),
  },

  // Auction service
  auction: {
    // Get auction details with current bid, bid count, and phase
    getById: (auctionId: string) =>
      apiClient.get(`/api/v2/auctions/${auctionId}`),
    
    // Get bid history
    getBids: (auctionId: string, params?: {
      limit?: number
      offset?: number
    }) =>
      apiClient.get(`/api/v2/auctions/${auctionId}/bids`, { params }),
    
    // Place a bid
    placeBid: (auctionId: string, amount: number) =>
      apiClient.post(`/api/v2/auctions/${auctionId}/bids`, { amount }),
    
    // Get auction extensions (anti-sniping)
    getExtensions: (auctionId: string) =>
      apiClient.get(`/api/v2/auctions/${auctionId}/extensions`),
    
    // Get active auctions
    getActive: (params?: {
      category?: string
      status?: string[]
      endingSoon?: boolean
      limit?: number
      offset?: number
    }) =>
      apiClient.get('/api/v2/auctions', { params }),
  },

  // Payment gateway service
  payment: {
    // Create payment intent via backend only
    createIntent: (data: {
      amount: number
      currency: string
      orderId: string
      buyerId: string
      sellerId: string
      provider?: 'stripe' | 'paymob'
      paymentMethod?: 'card' | 'bank_transfer' | 'wallet'
      metadata?: Record<string, any>
    }) =>
      apiClient.post('/api/payments/escrow/create', data),
    
    // Get payment status with backend confirmation
    getStatus: (orderId: string) =>
      apiClient.get(`/api/payments/escrow/state/${orderId}`),
    
    // Poll payment status (success/failed/pending)
    pollStatus: (orderId: string, maxAttempts = 30, intervalMs = 2000) => {
      return new Promise(async (resolve, reject) => {
        let attempts = 0;
        const poll = async () => {
          try {
            attempts++;
            const response = await apiClient.get(`/api/payments/escrow/state/${orderId}`);
            const status = response.data.data?.paymentState?.status;
            
            if (status === 'succeeded' || status === 'failed' || status === 'cancelled') {
              resolve(response.data);
            } else if (attempts >= maxAttempts) {
              reject(new Error('Payment status polling timeout'));
            } else {
              setTimeout(poll, intervalMs);
            }
          } catch (error) {
            reject(error);
          }
        };
        poll();
      });
    },
    
    // Get available payment providers
    getProviders: (currency?: string) =>
      apiClient.get('/api/payments/escrow/providers', { params: { currency } }),
    
    // Confirm payment capture to escrow
    confirmPayment: (data: {
      orderId: string
      paymentIntentId: string
      provider: string
    }) =>
      apiClient.post('/api/payments/escrow/capture', data),
  },

  // Dispute service
  dispute: {
    // Get dispute by ID
    getById: (disputeId: string) =>
      apiClient.get(`/api/v1/disputes/${disputeId}`),
    
    // Get user disputes
    getUserDisputes: (userId: string, params?: {
      status?: string
      limit?: number
      offset?: number
    }) =>
      apiClient.get(`/api/v1/disputes/user/${userId}`, { params }),
    
    // Open a new dispute
    openDispute: (data: {
      escrowId: string
      initiatedBy: string
      initiatorRole: 'BUYER' | 'SELLER' | 'ADMIN'
      reason: string
      description: string
      evidence?: any[]
    }) =>
      apiClient.post('/api/v1/disputes', data),
    
    // Add message to dispute
    addMessage: (disputeId: string, data: {
      senderId: string
      senderRole: 'BUYER' | 'SELLER' | 'ADMIN'
      message: string
      attachments?: any[]
      isInternal?: boolean
    }) =>
      apiClient.post(`/api/v1/disputes/${disputeId}/messages`, data),
    
    // Add evidence to dispute
    addEvidence: (disputeId: string, evidence: any[]) =>
      apiClient.post(`/api/v1/disputes/${disputeId}/evidence`, { evidence }),
    
    // Escalate dispute
    escalateDispute: (disputeId: string, reason: string) =>
      apiClient.post(`/api/v1/disputes/${disputeId}/escalate`, { reason }),
  },

  // Analytics endpoints
  analytics: {
    getOverview: (period: string = '30d') =>
      apiClient.get(`/api/v1/analytics/overview?period=${period}`),
    getUserAnalytics: (period: string = '30d') =>
      apiClient.get(`/api/v1/analytics/users?period=${period}`),
    getOrderAnalytics: (period: string = '30d') =>
      apiClient.get(`/api/v1/analytics/orders?period=${period}`),
    getRevenueAnalytics: (period: string = '30d') =>
      apiClient.get(`/api/v1/analytics/revenue?period=${period}`),
  },

  // Admin endpoints (require admin role)
  admin: {
    // User management
    getAllUsers: (params?: {
      page?: number;
      limit?: number;
      role?: string;
      kycStatus?: string;
    }) => apiClient.get('/api/v1/admin/users', { params }),
    
    getUserById: (id: string) =>
      apiClient.get(`/api/v1/admin/users/${id}`),
    
    getUserSessions: (id: string) =>
      apiClient.get(`/api/v1/admin/users/${id}/sessions`),
    
    getUserActivity: (id: string) =>
      apiClient.get(`/api/v1/admin/users/${id}/activity`),
    
    // System analytics
    getSystemAnalytics: (period: string = '30d') =>
      apiClient.get(`/api/v1/admin/analytics?period=${period}`),
    
    // Escrow management
    getAllEscrows: (params?: {
      status?: string;
      ownerType?: string;
      limit?: number;
      offset?: number;
    }) => apiClient.get('/api/v1/admin/escrows', { params }),
    
    getEscrowTotals: () =>
      apiClient.get('/api/v1/admin/escrows/totals'),
    
    // Dispute management
    getAllDisputes: (params?: {
      status?: string[];
      limit?: number;
      offset?: number;
    }) => apiClient.get('/api/v1/admin/disputes', { params }),
  },

  // Health check
  health: () =>
    apiClient.get('/health'),

  // Plugin Marketplace (via API Gateway -> plugin-system)
  marketplace: {
    getPlugins: () => apiClient.get<{ plugins: any[] }>('/api/marketplace/plugins'),
    getPlugin: (id: string) => apiClient.get(`/api/marketplace/plugins/${id}`),
    installPlugin: (id: string) => apiClient.post(`/api/marketplace/plugins/${id}/install`),
    uninstallPlugin: (id: string) => apiClient.delete(`/api/marketplace/plugins/${id}/uninstall`),
  },
};

export default apiService;
export { apiClient };