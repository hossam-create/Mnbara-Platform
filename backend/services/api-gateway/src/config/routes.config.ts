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
  // MVP: Listing Service - Port 3001
  {
    name: 'listing-service',
    url: getServiceUrl('LISTING_SERVICE_URL', 'http://listing-service:3001'),
    healthPath: '/health',
    routes: [
      {
        path: '/api/products',
        target: getServiceUrl('LISTING_SERVICE_URL', 'http://listing-service:3001'),
        pathRewrite: { '^/api/products': '/api/products' },
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
      },
    ],
  },

  // MVP: Cart Service - Port 3002
  {
    name: 'cart-service',
    url: getServiceUrl('CART_SERVICE_URL', 'http://cart-service:3002'),
    healthPath: '/health',
    routes: [
      {
        path: '/api/cart',
        target: getServiceUrl('CART_SERVICE_URL', 'http://cart-service:3002'),
        pathRewrite: { '^/api/cart': '/api/cart' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
      },
    ],
  },

  // MVP: Payment Service - Port 3003
  {
    name: 'payment-service',
    url: getServiceUrl('PAYMENT_SERVICE_URL', 'http://payment-service:3003'),
    healthPath: '/health',
    routes: [
      {
        path: '/api/payments',
        target: getServiceUrl('PAYMENT_SERVICE_URL', 'http://payment-service:3003'),
        pathRewrite: { '^/api/payments': '/api/payments' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 20 },
      },
    ],
  },

  // MVP: Crowdship Service - Port 3004
  {
    name: 'crowdship-service',
    url: getServiceUrl('CROWDSHIP_SERVICE_URL', 'http://crowdship-service:3004'),
    healthPath: '/health',
    routes: [
      {
        path: '/api/crowdship',
        target: getServiceUrl('CROWDSHIP_SERVICE_URL', 'http://crowdship-service:3004'),
        pathRewrite: { '^/api/crowdship': '/api/crowdship' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 50 },
      },
    ],
  },

  // MVP: Compliance Service - Port 3005
  {
    name: 'compliance-service',
    url: getServiceUrl('COMPLIANCE_SERVICE_URL', 'http://compliance-service:3005'),
    healthPath: '/health',
    routes: [
      {
        path: '/api/compliance',
        target: getServiceUrl('COMPLIANCE_SERVICE_URL', 'http://compliance-service:3005'),
        pathRewrite: { '^/api/compliance': '/api/compliance' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 50 },
      },
    ],
  },

  // Decision Authority Service - Port 3010
  {
    name: 'decision-authority-service',
    url: getServiceUrl('DECISION_AUTHORITY_SERVICE_URL', 'http://decision-authority-service:3010'),
    healthPath: '/health',
    routes: [
      // Decision endpoints (require authentication)
      {
        path: '/api/v1/decisions',
        target: getServiceUrl('DECISION_AUTHORITY_SERVICE_URL', 'http://decision-authority-service:3010'),
        pathRewrite: { '^/api/v1/decisions': '/api/v1/decisions' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
        methods: ['GET', 'POST'],
      },
      {
        path: '/api/v1/decisions/:id',
        target: getServiceUrl('DECISION_AUTHORITY_SERVICE_URL', 'http://decision-authority-service:3010'),
        pathRewrite: { '^/api/v1/decisions': '/api/v1/decisions' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
        methods: ['GET', 'PATCH'],
      },
      {
        path: '/api/v1/decisions/by-decision-id/:decisionId',
        target: getServiceUrl('DECISION_AUTHORITY_SERVICE_URL', 'http://decision-authority-service:3010'),
        pathRewrite: { '^/api/v1/decisions': '/api/v1/decisions' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
        methods: ['GET'],
      },
      {
        path: '/api/v1/decisions/asset/:assetType/:assetId',
        target: getServiceUrl('DECISION_AUTHORITY_SERVICE_URL', 'http://decision-authority-service:3010'),
        pathRewrite: { '^/api/v1/decisions': '/api/v1/decisions' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
        methods: ['GET'],
      },
      // Audit log endpoints (require authentication, admin role)
      {
        path: '/api/v1/audit-logs',
        target: getServiceUrl('DECISION_AUTHORITY_SERVICE_URL', 'http://decision-authority-service:3010'),
        pathRewrite: { '^/api/v1/audit-logs': '/api/v1/audit-logs' },
        requiresAuth: true,
        roles: ['admin'],
        rateLimit: { windowMs: 60000, maxRequests: 50 },
        methods: ['GET'],
      },
      {
        path: '/api/v1/audit-logs/decision/:decisionId',
        target: getServiceUrl('DECISION_AUTHORITY_SERVICE_URL', 'http://decision-authority-service:3010'),
        pathRewrite: { '^/api/v1/audit-logs': '/api/v1/audit-logs' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
        methods: ['GET'],
      },
      // Webhook endpoint (NO authentication - uses HMAC signature validation)
      {
        path: '/api/v1/webhooks/custodii',
        target: getServiceUrl('DECISION_AUTHORITY_SERVICE_URL', 'http://decision-authority-service:3010'),
        pathRewrite: { '^/api/v1/webhooks': '/api/v1/webhooks' },
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 200 },
        methods: ['POST'],
      },
    ],
  },

  // CrafterCMS Content Service - Port 3002
  {
    name: 'content-service',
    url: getServiceUrl('CONTENT_SERVICE_URL', 'http://content-service:3002'),
    healthPath: '/health',
    routes: [
      {
        path: '/api/v1/content',
        target: getServiceUrl('CONTENT_SERVICE_URL', 'http://content-service:3002'),
        pathRewrite: { '^/api/v1/content': '/api/v1/content' },
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 200 },
      },
    ],
  },

  // KYC Service - Port 3007 (integrated from KYC-Website flow)
  {
    name: 'kyc-service',
    url: getServiceUrl('KYC_SERVICE_URL', 'http://kyc-service:3007'),
    healthPath: '/health',
    routes: [
      {
        path: '/api/v1/kyc',
        target: getServiceUrl('KYC_SERVICE_URL', 'http://kyc-service:3007'),
        pathRewrite: { '^/api/v1/kyc': '/kyc' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 20 },
        methods: ['GET', 'POST'],
      },
    ],
  },

  // Plugin System Service - Port 3015
  {
    name: 'plugin-system',
    url: getServiceUrl('PLUGIN_SYSTEM_SERVICE_URL', 'http://plugin-system-service:3015'),
    healthPath: '/health',
    routes: [
      // Plugin management (requires authentication)
      {
        path: '/api/plugins',
        target: getServiceUrl('PLUGIN_SYSTEM_SERVICE_URL', 'http://plugin-system-service:3015'),
        pathRewrite: { '^/api/plugins': '/api/plugins' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      {
        path: '/api/plugins/:id',
        target: getServiceUrl('PLUGIN_SYSTEM_SERVICE_URL', 'http://plugin-system-service:3015'),
        pathRewrite: { '^/api/plugins': '/api/plugins' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
        methods: ['GET', 'PUT', 'DELETE'],
      },
      // Plugin marketplace (public browsing)
      {
        path: '/api/marketplace/plugins',
        target: getServiceUrl('PLUGIN_SYSTEM_SERVICE_URL', 'http://plugin-system-service:3015'),
        pathRewrite: { '^/api/marketplace': '/api/marketplace' },
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 200 },
        methods: ['GET'],
      },
      {
        path: '/api/marketplace/plugins/:id',
        target: getServiceUrl('PLUGIN_SYSTEM_SERVICE_URL', 'http://plugin-system-service:3015'),
        pathRewrite: { '^/api/marketplace': '/api/marketplace' },
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 200 },
        methods: ['GET'],
      },
      // Plugin installation (requires authentication)
      {
        path: '/api/marketplace/plugins/:id/install',
        target: getServiceUrl('PLUGIN_SYSTEM_SERVICE_URL', 'http://plugin-system-service:3015'),
        pathRewrite: { '^/api/marketplace': '/api/marketplace' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 50 },
        methods: ['POST'],
      },
      {
        path: '/api/marketplace/plugins/:id/uninstall',
        target: getServiceUrl('PLUGIN_SYSTEM_SERVICE_URL', 'http://plugin-system-service:3015'),
        pathRewrite: { '^/api/marketplace': '/api/marketplace' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 50 },
        methods: ['DELETE'],
      },
      // Plugin reviews (public read, authenticated write)
      {
        path: '/api/marketplace/plugins/:id/reviews',
        target: getServiceUrl('PLUGIN_SYSTEM_SERVICE_URL', 'http://plugin-system-service:3015'),
        pathRewrite: { '^/api/marketplace': '/api/marketplace' },
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
        methods: ['GET'],
      },
      {
        path: '/api/marketplace/plugins/:id/reviews',
        target: getServiceUrl('PLUGIN_SYSTEM_SERVICE_URL', 'http://plugin-system-service:3015'),
        pathRewrite: { '^/api/marketplace': '/api/marketplace' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 20 },
        methods: ['POST'],
      },
      // Developer dashboard (requires authentication)
      {
        path: '/api/developers/plugins',
        target: getServiceUrl('PLUGIN_SYSTEM_SERVICE_URL', 'http://plugin-system-service:3015'),
        pathRewrite: { '^/api/developers': '/api/developers' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
        methods: ['GET', 'POST'],
      },
      {
        path: '/api/developers/analytics',
        target: getServiceUrl('PLUGIN_SYSTEM_SERVICE_URL', 'http://plugin-system-service:3015'),
        pathRewrite: { '^/api/developers': '/api/developers' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
        methods: ['GET'],
      },
    ],
  },

  // eBay Live Service - Port 3020 (also supports /api/streams, /api/chat, /api/auction, /api/analytics)
  {
    name: 'ebay-live-service',
    url: getServiceUrl('EBAY_LIVE_SERVICE_URL', 'http://ebay-live-service:3020'),
    healthPath: '/health',
    routes: [
      // Mnbarh Live – frontend paths (/api/streams, /api/chat, /api/auction, /api/analytics)
      {
        path: '/api/streams',
        target: getServiceUrl('EBAY_LIVE_SERVICE_URL', 'http://ebay-live-service:3020'),
        pathRewrite: { '^/api/streams': '/api/streams' },
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 200 },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      {
        path: '/api/chat',
        target: getServiceUrl('EBAY_LIVE_SERVICE_URL', 'http://ebay-live-service:3020'),
        pathRewrite: { '^/api/chat': '/api/chat' },
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 200 },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      {
        path: '/api/auction',
        target: getServiceUrl('EBAY_LIVE_SERVICE_URL', 'http://ebay-live-service:3020'),
        pathRewrite: { '^/api/auction': '/api/auction' },
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 200 },
        methods: ['GET', 'POST'],
      },
      {
        path: '/api/analytics',
        target: getServiceUrl('EBAY_LIVE_SERVICE_URL', 'http://ebay-live-service:3020'),
        pathRewrite: { '^/api/analytics': '/api/analytics' },
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
        methods: ['GET'],
      },
      // Live streams (public viewing)
      {
        path: '/api/live-streams',
        target: getServiceUrl('EBAY_LIVE_SERVICE_URL', 'http://ebay-live-service:3020'),
        pathRewrite: { '^/api/live-streams': '/api/live-streams' },
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 200 },
        methods: ['GET'],
      },
      {
        path: '/api/live-streams/:id',
        target: getServiceUrl('EBAY_LIVE_SERVICE_URL', 'http://ebay-live-service:3020'),
        pathRewrite: { '^/api/live-streams': '/api/live-streams' },
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 200 },
        methods: ['GET'],
      },
      // Stream creation (requires authentication, seller role)
      {
        path: '/api/live-streams',
        target: getServiceUrl('EBAY_LIVE_SERVICE_URL', 'http://ebay-live-service:3020'),
        pathRewrite: { '^/api/live-streams': '/api/live-streams' },
        requiresAuth: true,
        roles: ['seller', 'admin'],
        rateLimit: { windowMs: 60000, maxRequests: 50 },
        methods: ['POST'],
      },
      {
        path: '/api/live-streams/:id',
        target: getServiceUrl('EBAY_LIVE_SERVICE_URL', 'http://ebay-live-service:3020'),
        pathRewrite: { '^/api/live-streams': '/api/live-streams' },
        requiresAuth: true,
        roles: ['seller', 'admin'],
        rateLimit: { windowMs: 60000, maxRequests: 50 },
        methods: ['PUT', 'DELETE'],
      },
      // Live auctions (public viewing)
      {
        path: '/api/live-auctions',
        target: getServiceUrl('EBAY_LIVE_SERVICE_URL', 'http://ebay-live-service:3020'),
        pathRewrite: { '^/api/live-auctions': '/api/live-auctions' },
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 200 },
        methods: ['GET'],
      },
      {
        path: '/api/live-auctions/:id',
        target: getServiceUrl('EBAY_LIVE_SERVICE_URL', 'http://ebay-live-service:3020'),
        pathRewrite: { '^/api/live-auctions': '/api/live-auctions' },
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 200 },
        methods: ['GET'],
      },
      // Bidding (requires authentication)
      {
        path: '/api/live-auctions/:id/bids',
        target: getServiceUrl('EBAY_LIVE_SERVICE_URL', 'http://ebay-live-service:3020'),
        pathRewrite: { '^/api/live-auctions': '/api/live-auctions' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
        methods: ['GET', 'POST'],
      },
      // Chat (public read, authenticated write)
      {
        path: '/api/live-streams/:id/chat',
        target: getServiceUrl('EBAY_LIVE_SERVICE_URL', 'http://ebay-live-service:3020'),
        pathRewrite: { '^/api/live-streams': '/api/live-streams' },
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 200 },
        methods: ['GET'],
      },
      {
        path: '/api/live-streams/:id/chat',
        target: getServiceUrl('EBAY_LIVE_SERVICE_URL', 'http://ebay-live-service:3020'),
        pathRewrite: { '^/api/live-streams': '/api/live-streams' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 50 },
        methods: ['POST'],
      },
      // Analytics (public basic, authenticated detailed)
      {
        path: '/api/live-streams/:id/analytics',
        target: getServiceUrl('EBAY_LIVE_SERVICE_URL', 'http://ebay-live-service:3020'),
        pathRewrite: { '^/api/live-streams': '/api/live-streams' },
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
        methods: ['GET'],
      },
      // Stream keys (requires authentication)
      {
        path: '/api/live-streams/stream-key',
        target: getServiceUrl('EBAY_LIVE_SERVICE_URL', 'http://ebay-live-service:3020'),
        pathRewrite: { '^/api/live-streams': '/api/live-streams' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 20 },
        methods: ['GET', 'POST'],
      },
    ],
  },

  // Orders Service - Port 3009 (includes from-live-auction callback for eBay Live)
  {
    name: 'orders-service',
    url: getServiceUrl('ORDERS_SERVICE_URL', 'http://orders-service:3009'),
    healthPath: '/health',
    routes: [
      {
        path: '/api/v1/orders',
        target: getServiceUrl('ORDERS_SERVICE_URL', 'http://orders-service:3009'),
        pathRewrite: { '^/api/v1/orders': '/api/v1/orders' },
        requiresAuth: true,
        rateLimit: { windowMs: 60000, maxRequests: 100 },
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      },
      {
        path: '/api/v1/orders/from-live-auction',
        target: getServiceUrl('ORDERS_SERVICE_URL', 'http://orders-service:3009'),
        pathRewrite: { '^/api/v1/orders': '/api/v1/orders' },
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 50 },
        methods: ['POST'],
      },
      {
        path: '/api/v1/orders/guest',
        target: getServiceUrl('ORDERS_SERVICE_URL', 'http://orders-service:3009'),
        pathRewrite: { '^/api/v1/orders': '/api/v1/orders' },
        requiresAuth: false,
        rateLimit: { windowMs: 60000, maxRequests: 30 },
        methods: ['POST'],
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
