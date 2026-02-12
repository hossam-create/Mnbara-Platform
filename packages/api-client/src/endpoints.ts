// API Endpoints Configuration
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
  },

  // Users
  users: {
    base: '/users',
    me: '/users/me',
    profile: '/users/me/profile',
    preferences: '/users/me/preferences',
    byId: (id: string) => `/users/${id}`,
    addresses: '/users/me/addresses',
    addressById: (id: string) => `/users/me/addresses/${id}`,
  },

  // Vendors
  vendors: {
    base: '/vendors',
    byId: (id: string) => `/vendors/${id}`,
    products: (id: string) => `/vendors/${id}/products`,
    orders: (id: string) => `/vendors/${id}/orders`,
    earnings: (id: string) => `/vendors/${id}/earnings`,
    reviews: (id: string) => `/vendors/${id}/reviews`,
  },

  // Drivers
  drivers: {
    base: '/drivers',
    byId: (id: string) => `/drivers/${id}`,
    location: (id: string) => `/drivers/${id}/location`,
    status: (id: string) => `/drivers/${id}/status`,
    deliveries: (id: string) => `/drivers/${id}/deliveries`,
    earnings: (id: string) => `/drivers/${id}/earnings`,
  },

  // Orders
  orders: {
    base: '/orders',
    byId: (id: string) => `/orders/${id}`,
    items: (id: string) => `/orders/${id}/items`,
    status: (id: string) => `/orders/${id}/status`,
    tracking: (id: string) => `/orders/${id}/tracking`,
    cancel: (id: string) => `/orders/${id}/cancel`,
    dispute: (id: string) => `/orders/${id}/dispute`,
    customer: (customerId: string) => `/customers/${customerId}/orders`,
    vendor: (vendorId: string) => `/vendors/${vendorId}/orders`,
    driver: (driverId: string) => `/drivers/${driverId}/orders`,
  },

  // Payments
  payments: {
    base: '/payments',
    byId: (id: string) => `/payments/${id}`,
    process: '/payments/process',
    refund: '/payments/refund',
    methods: '/payments/methods',
    methodById: (id: string) => `/payments/methods/${id}`,
    transactions: '/payments/transactions',
    wallet: '/payments/wallet',
    withdraw: '/payments/withdraw',
    deposits: '/payments/deposits',
  },

  // Deliveries
  deliveries: {
    base: '/deliveries',
    byId: (id: string) => `/deliveries/${id}`,
    track: (id: string) => `/deliveries/${id}/track`,
    status: (id: string) => `/deliveries/${id}/status`,
    location: (id: string) => `/deliveries/${id}/location`,
    assign: '/deliveries/assign',
    accept: (id: string) => `/deliveries/${id}/accept`,
    pickup: (id: string) => `/deliveries/${id}/pickup`,
    deliver: (id: string) => `/deliveries/${id}/deliver`,
    proof: (id: string) => `/deliveries/${id}/proof`,
    available: '/deliveries/available',
  },

  // Products
  products: {
    base: '/products',
    byId: (id: string) => `/products/${id}`,
    search: '/products/search',
    byVendor: (vendorId: string) => `/vendors/${vendorId}/products`,
    categories: '/products/categories',
    categoryById: (id: string) => `/products/categories/${id}`,
    reviews: (id: string) => `/products/${id}/reviews`,
    rate: (id: string) => `/products/${id}/rate`,
  },

  // Cart
  cart: {
    base: '/cart',
    items: '/cart/items',
    addItem: '/cart/items',
    updateItem: (id: string) => `/cart/items/${id}`,
    removeItem: (id: string) => `/cart/items/${id}`,
    clear: '/cart/clear',
    checkout: '/cart/checkout',
  },

  // Notifications
  notifications: {
    base: '/notifications',
    unread: '/notifications/unread',
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
  },

  // Reviews
  reviews: {
    base: '/reviews',
    byId: (id: string) => `/reviews/${id}`,
    byOrder: (orderId: string) => `/orders/${orderId}/reviews`,
    byVendor: (vendorId: string) => `/vendors/${vendorId}/reviews`,
    byDriver: (driverId: string) => `/drivers/${driverId}/reviews`,
  },

  // Analytics
  analytics: {
    dashboard: '/analytics/dashboard',
    orders: '/analytics/orders',
    revenue: '/analytics/revenue',
    users: '/analytics/users',
    deliveries: '/analytics/deliveries',
    vendor: (vendorId: string) => `/vendors/${vendorId}/analytics`,
    driver: (driverId: string) => `/drivers/${driverId}/analytics`,
  },

  // Settings
  settings: {
    base: '/settings',
    app: '/settings/app',
    notifications: '/settings/notifications',
    privacy: '/settings/privacy',
    terms: '/settings/terms',
    about: '/settings/about',
  },
};

// Endpoint helper function
export function getEndpoint(endpoint: string, params?: Record<string, string>): string {
  let result = endpoint;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      result = result.replace(`:${key}`, value);
    });
  }
  return result;
}
