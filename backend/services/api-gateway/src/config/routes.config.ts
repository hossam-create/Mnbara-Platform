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
