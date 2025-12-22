/**
 * API Gateway Route Configuration
 * Defines all service routes, authentication requirements, and rate limits
 */

export interface RouteConfig {
  path: string;
  target: string;
  pathRewrite?: Record<string, string>;
  requiresAuth: boolean;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  roles?: string[];
  methods?: string[];
}

export interface ServiceConfig {
  name: string;
  url: string;
  healthPath: string;
  routes: RouteConfig[];
}

// Service URLs from environment
const getServiceUrl = (envVar: string, defaultUrl: string): string => {
  return process.env[envVar] || defaultUrl;
};

export const servicesConfig: ServiceConfig[] = [
  // Auth Service - Port 3001
  {
    name: 'auth-service',
    url: getServiceUrl('AUTH_SERVICE_URL', 'http://auth-service:3001'),
    healthPath: '/health',
    routes: [
      {
        path: '/api/v1/auth/register',
        target: getServiceUrl('AUTH_SERVICE_URL', 'http://auth-service:3001'),
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 5 }, // 5 per minute
        methods: ['POST'],
      },
      {
        path: '/api/v1/auth/login',
        target: getServiceUrl('AUTH_SERVICE_URL', 'http://auth-service:3001'),
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 10 }, // 10 per minute
        methods: ['POST'],
      },
      {
        path: '/api/v1/auth/refresh',
        target: getServiceUrl('AUTH_SERVICE_URL', 'http://auth-service:3001'),
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 20 },
        methods: ['POST'],
      },
      {
        path: '/api/v1/auth/oauth',
        target: getServiceUrl('AUTH_SERVICE_URL', 'http://auth-service:3001'),
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 10 },
      },
      {
        path: '/api/v1/auth/mfa',
        target: getServiceUrl('AUTH_SERVICE_URL', 'http://auth-service:3001'),
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 10 },
      },
      {
        path: '/api/v1/auth/password',
        target: getServiceUrl('AUTH_SERVICE_URL', 'http://auth-service:3001'),
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 3 }, // Strict for password reset
      },
      {
        path: '/api/v1/users',
        target: getServiceUrl('AUTH_SERVICE_URL', 'http://auth-service:3001'),
        requiresAuth: true,
      },
      {
        path: '/api/v1/kyc',
        target: getServiceUrl('AUTH_SERVICE_URL', 'http://auth-service:3001'),
        requiresAuth: true,
      },
    ],
  },

  // Listing Service - Port 3002
  {
    name: 'listing-service',
    url: getServiceUrl('LISTING_SERVICE_URL', 'http://listing-service:3002'),
    healthPath: '/health',
    routes: [
      {
        path: '/api/v1/listings',
        target: getServiceUrl('LISTING_SERVICE_URL', 'http://listing-service:3002'),
        requiresAuth: false, // Public read, auth for write
        rateLimit: { windowMs: 60000, maxRequests: 100 },
      },
      {
        path: '/api/v1/products',
        target: getServiceUrl('LISTING_SERVICE_URL', 'http://listing-service:3002'),
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
      },
      {
        path: '/api/v1/categories',
        target: getServiceUrl('LISTING_SERVICE_URL', 'http://listing-service:3002'),
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 200 },
      },
      {
        path: '/api/v1/search',
        target: getServiceUrl('LISTING_SERVICE_URL', 'http://listing-service:3002'),
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 60 },
      },
    ],
  },

  // Auction Service - Port 3003
  {
    name: 'auction-service',
    url: getServiceUrl('AUCTION_SERVICE_URL', 'http://auction-service:3003'),
    healthPath: '/health',
    routes: [
      {
        path: '/api/v1/auctions',
        target: getServiceUrl('AUCTION_SERVICE_URL', 'http://auction-service:3003'),
        requiresAuth: false, // Public read, auth for bidding
        rateLimit: { windowMs: 60000, maxRequests: 100 },
      },
      {
        path: '/api/v1/bids',
        target: getServiceUrl('AUCTION_SERVICE_URL', 'http://auction-service:3003'),
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 30 }, // Limit bid frequency
      },
    ],
  },

  // Payment Service - Port 3004
  {
    name: 'payment-service',
    url: getServiceUrl('PAYMENT_SERVICE_URL', 'http://payment-service:3004'),
    healthPath: '/health',
    routes: [
      {
        path: '/api/v1/payments',
        target: getServiceUrl('PAYMENT_SERVICE_URL', 'http://payment-service:3004'),
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 20 },
      },
      {
        path: '/api/v1/wallets',
        target: getServiceUrl('PAYMENT_SERVICE_URL', 'http://payment-service:3004'),
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 50 },
      },
      {
        path: '/api/v1/escrow',
        target: getServiceUrl('PAYMENT_SERVICE_URL', 'http://payment-service:3004'),
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 20 },
      },
      {
        path: '/api/v1/webhooks/stripe',
        target: getServiceUrl('PAYMENT_SERVICE_URL', 'http://payment-service:3004'),
        requiresAuth: false, // Webhook endpoints
        rateLimit: { windowMs: 60000, maxRequests: 100 },
      },
      {
        path: '/api/v1/webhooks/paypal',
        target: getServiceUrl('PAYMENT_SERVICE_URL', 'http://payment-service:3004'),
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
      },
      {
        path: '/api/v1/webhooks/paymob',
        target: getServiceUrl('PAYMENT_SERVICE_URL', 'http://payment-service:3004'),
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
      },
    ],
  },

  // Crowdship Service - Port 3005
  {
    name: 'crowdship-service',
    url: getServiceUrl('CROWDSHIP_SERVICE_URL', 'http://crowdship-service:3005'),
    healthPath: '/health',
    routes: [
      {
        path: '/api/v1/crowdship',
        target: getServiceUrl('CROWDSHIP_SERVICE_URL', 'http://crowdship-service:3005'),
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 50 },
      },
      {
        path: '/api/v1/deliveries',
        target: getServiceUrl('CROWDSHIP_SERVICE_URL', 'http://crowdship-service:3005'),
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 50 },
      },
    ],
  },

  // Notification Service - Port 3006
  {
    name: 'notification-service',
    url: getServiceUrl('NOTIFICATION_SERVICE_URL', 'http://notification-service:3006'),
    healthPath: '/health',
    routes: [
      {
        path: '/api/v1/notifications',
        target: getServiceUrl('NOTIFICATION_SERVICE_URL', 'http://notification-service:3006'),
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 60 },
      },
      {
        path: '/api/v1/push-tokens',
        target: getServiceUrl('NOTIFICATION_SERVICE_URL', 'http://notification-service:3006'),
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 10 },
      },
    ],
  },

  // Recommendation Service - Port 3007
  {
    name: 'recommendation-service',
    url: getServiceUrl('RECOMMENDATION_SERVICE_URL', 'http://recommendation-service:3007'),
    healthPath: '/health',
    routes: [
      {
        path: '/api/v1/recommendations',
        target: getServiceUrl('RECOMMENDATION_SERVICE_URL', 'http://recommendation-service:3007'),
        requiresAuth: false, // Can work with or without auth
        rateLimit: { windowMs: 60000, maxRequests: 60 },
      },
    ],
  },

  // Rewards Service - Port 3008
  {
    name: 'rewards-service',
    url: getServiceUrl('REWARDS_SERVICE_URL', 'http://rewards-service:3008'),
    healthPath: '/health',
    routes: [
      {
        path: '/api/v1/rewards',
        target: getServiceUrl('REWARDS_SERVICE_URL', 'http://rewards-service:3008'),
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 50 },
      },
      {
        path: '/api/v1/leaderboard',
        target: getServiceUrl('REWARDS_SERVICE_URL', 'http://rewards-service:3008'),
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 30 },
      },
    ],
  },

  // Orders Service - Port 3009
  {
    name: 'orders-service',
    url: getServiceUrl('ORDERS_SERVICE_URL', 'http://orders-service:3009'),
    healthPath: '/health',
    routes: [
      {
        path: '/api/v1/orders',
        target: getServiceUrl('ORDERS_SERVICE_URL', 'http://orders-service:3009'),
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 50 },
      },
      {
        path: '/api/v1/cart',
        target: getServiceUrl('ORDERS_SERVICE_URL', 'http://orders-service:3009'),
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
      },
    ],
  },

  // Trips Service - Port 3010
  {
    name: 'trips-service',
    url: getServiceUrl('TRIPS_SERVICE_URL', 'http://trips-service:3010'),
    healthPath: '/health',
    routes: [
      {
        path: '/api/v1/trips',
        target: getServiceUrl('TRIPS_SERVICE_URL', 'http://trips-service:3010'),
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 50 },
      },
      {
        path: '/api/v1/traveler',
        target: getServiceUrl('TRIPS_SERVICE_URL', 'http://trips-service:3010'),
        requiresAuth: true,
        roles: ['traveler', 'admin'],
        rateLimit: { windowMs: 60000, maxRequests: 50 },
      },
    ],
  },

  // Matching Service - Port 3011
  {
    name: 'matching-service',
    url: getServiceUrl('MATCHING_SERVICE_URL', 'http://matching-service:3011'),
    healthPath: '/health',
    routes: [
      {
        path: '/api/v1/matches',
        target: getServiceUrl('MATCHING_SERVICE_URL', 'http://matching-service:3011'),
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 50 },
      },
      {
        path: '/api/v1/travel-requests',
        target: getServiceUrl('MATCHING_SERVICE_URL', 'http://matching-service:3011'),
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 50 },
      },
      {
        path: '/api/v1/geo',
        target: getServiceUrl('MATCHING_SERVICE_URL', 'http://matching-service:3011'),
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
      },
    ],
  },

  // Admin Service - Port 3012
  {
    name: 'admin-service',
    url: getServiceUrl('ADMIN_SERVICE_URL', 'http://admin-service:3012'),
    healthPath: '/health',
    routes: [
      {
        path: '/api/v1/admin',
        target: getServiceUrl('ADMIN_SERVICE_URL', 'http://admin-service:3012'),
        requiresAuth: true,
        roles: ['admin'],
        rateLimit: { windowMs: 60000, maxRequests: 100 },
      },
      {
        path: '/api/v1/disputes',
        target: getServiceUrl('ADMIN_SERVICE_URL', 'http://admin-service:3012'),
        requiresAuth: true,
        roles: ['admin'],
        rateLimit: { windowMs: 60000, maxRequests: 50 },
      },
      {
        path: '/api/v1/analytics',
        target: getServiceUrl('ADMIN_SERVICE_URL', 'http://admin-service:3012'),
        requiresAuth: true,
        roles: ['admin'],
        rateLimit: { windowMs: 60000, maxRequests: 30 },
      },
      // Legal endpoints - public access for documents, auth for consent
      {
        path: '/api/legal/documents',
        target: getServiceUrl('ADMIN_SERVICE_URL', 'http://admin-service:3012'),
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
      },
      {
        path: '/api/legal/documents/*',
        target: getServiceUrl('ADMIN_SERVICE_URL', 'http://admin-service:3012'),
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
      },
      {
        path: '/api/legal/consent',
        target: getServiceUrl('ADMIN_SERVICE_URL', 'http://admin-service:3012'),
        requiresAuth: false, // Allow guest consents
        rateLimit: { windowMs: 60000, maxRequests: 20 },
      },
      {
        path: '/api/legal/consent/status',
        target: getServiceUrl('ADMIN_SERVICE_URL', 'http://admin-service:3012'),
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 50 },
      },
      {
        path: '/api/legal/consent/enforce',
        target: getServiceUrl('ADMIN_SERVICE_URL', 'http://admin-service:3012'),
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 30 },
      },
    ],
  },
];

// Default rate limit for unspecified routes
export const defaultRateLimit = {
  windowMs: 60000, // 1 minute
  maxRequests: 100, // 100 requests per minute
};

// Get all routes flattened
export const getAllRoutes = (): RouteConfig[] => {
  return servicesConfig.flatMap((service) => service.routes);
};

// Get service by name
export const getServiceByName = (name: string): ServiceConfig | undefined => {
  return servicesConfig.find((service) => service.name === name);
};
