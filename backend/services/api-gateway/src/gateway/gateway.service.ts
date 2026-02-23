import { Injectable, Logger } from '@nestjs/common';
import { createProxyMiddleware, Options, fixRequestBody } from 'http-proxy-middleware';

export interface RouteConfig {
  path: string;
  target: string;
  pathRewrite?: Record<string, string>;
  requiresAuth: boolean;
  rateLimit?: { windowMs: number; maxRequests: number };
  roles?: string[];
  methods?: string[];
}

export interface ServiceConfig {
  name: string;
  url: string;
  healthPath: string;
  routes: RouteConfig[];
}

const getServiceUrl = (envVar: string, defaultUrl: string): string => process.env[envVar] || defaultUrl;

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);

  getServicesConfig(): ServiceConfig[] {
    return [
      { name: 'auth-service', url: getServiceUrl('AUTH_SERVICE_URL', 'http://auth-service:3001'), healthPath: '/health', routes: [
        { path: '/api/auth', target: getServiceUrl('AUTH_SERVICE_URL', 'http://auth-service:3001'), pathRewrite: { '^/api/auth': '/api/auth' }, requiresAuth: false, rateLimit: { windowMs: 60000, maxRequests: 50 } },
        { path: '/api/v1/auth', target: getServiceUrl('AUTH_SERVICE_URL', 'http://auth-service:3001'), pathRewrite: { '^/api/v1/auth': '/api/auth' }, requiresAuth: false, rateLimit: { windowMs: 60000, maxRequests: 50 } },
        { path: '/api/v1/users', target: getServiceUrl('AUTH_SERVICE_URL', 'http://auth-service:3001'), requiresAuth: true, rateLimit: { windowMs: 60000, maxRequests: 60 } },
        { path: '/api/v1/kyc', target: getServiceUrl('AUTH_SERVICE_URL', 'http://auth-service:3001'), pathRewrite: { '^/api/v1/kyc': '/api/auth/kyc' }, requiresAuth: true, rateLimit: { windowMs: 60000, maxRequests: 20 }, methods: ['GET', 'POST'] },
      ]},
      { name: 'product-service', url: getServiceUrl('PRODUCT_SERVICE_URL', 'http://product-service:3004'), healthPath: '/health', routes: [
        { path: '/api/products', target: getServiceUrl('PRODUCT_SERVICE_URL', 'http://product-service:3004'), requiresAuth: false, rateLimit: { windowMs: 60000, maxRequests: 100 } },
        { path: '/api/v1/listings', target: getServiceUrl('PRODUCT_SERVICE_URL', 'http://product-service:3004'), requiresAuth: false, rateLimit: { windowMs: 60000, maxRequests: 100 } },
        { path: '/api/v1/categories', target: getServiceUrl('PRODUCT_SERVICE_URL', 'http://product-service:3004'), requiresAuth: false, rateLimit: { windowMs: 60000, maxRequests: 200 } },
        { path: '/api/v1/search', target: getServiceUrl('PRODUCT_SERVICE_URL', 'http://product-service:3004'), requiresAuth: false, rateLimit: { windowMs: 60000, maxRequests: 60 } },
      ]},
      { name: 'payment-service', url: getServiceUrl('PAYMENT_SERVICE_URL', 'http://payment-service:3003'), healthPath: '/health', routes: [
        { path: '/api/payments', target: getServiceUrl('PAYMENT_SERVICE_URL', 'http://payment-service:3003'), requiresAuth: true, rateLimit: { windowMs: 60000, maxRequests: 20 } },
        { path: '/api/v1/payments', target: getServiceUrl('PAYMENT_SERVICE_URL', 'http://payment-service:3003'), requiresAuth: true, rateLimit: { windowMs: 60000, maxRequests: 20 } },
        { path: '/api/v1/webhooks/stripe', target: getServiceUrl('PAYMENT_SERVICE_URL', 'http://payment-service:3003'), requiresAuth: false, rateLimit: { windowMs: 60000, maxRequests: 100 } },
      ]},
      { name: 'wallet-service', url: getServiceUrl('WALLET_SERVICE_URL', 'http://wallet-service:3005'), healthPath: '/health', routes: [
        { path: '/api/v1/wallets', target: getServiceUrl('WALLET_SERVICE_URL', 'http://wallet-service:3005'), requiresAuth: true, rateLimit: { windowMs: 60000, maxRequests: 50 } },
        { path: '/api/v2/wallets', target: getServiceUrl('WALLET_SERVICE_URL', 'http://wallet-service:3005'), requiresAuth: true, rateLimit: { windowMs: 60000, maxRequests: 50 } },
      ]},
      { name: 'orders-service', url: getServiceUrl('ORDERS_SERVICE_URL', 'http://orders-service:3006'), healthPath: '/health', routes: [
        { path: '/api/v1/orders', target: getServiceUrl('ORDERS_SERVICE_URL', 'http://orders-service:3006'), requiresAuth: true, rateLimit: { windowMs: 60000, maxRequests: 100 }, methods: ['GET', 'POST', 'PATCH', 'DELETE'] },
        { path: '/api/v1/cart', target: getServiceUrl('ORDERS_SERVICE_URL', 'http://orders-service:3006'), requiresAuth: true, rateLimit: { windowMs: 60000, maxRequests: 100 } },
      ]},
      { name: 'escrow-service', url: getServiceUrl('ESCROW_SERVICE_URL', 'http://escrow-service:3007'), healthPath: '/health', routes: [
        { path: '/api/v1/escrow', target: getServiceUrl('ESCROW_SERVICE_URL', 'http://escrow-service:3007'), requiresAuth: true, rateLimit: { windowMs: 60000, maxRequests: 50 } },
      ]},
      { name: 'settlement-service', url: getServiceUrl('SETTLEMENT_SERVICE_URL', 'http://settlement-service:3008'), healthPath: '/health', routes: [
        { path: '/api/v1/settlements', target: getServiceUrl('SETTLEMENT_SERVICE_URL', 'http://settlement-service:3008'), requiresAuth: true, rateLimit: { windowMs: 60000, maxRequests: 50 } },
      ]},
      { name: 'trips-service', url: getServiceUrl('TRIPS_SERVICE_URL', 'http://trips-service:3009'), healthPath: '/health', routes: [
        { path: '/api/trips', target: getServiceUrl('TRIPS_SERVICE_URL', 'http://trips-service:3009'), requiresAuth: true, rateLimit: { windowMs: 60000, maxRequests: 50 } },
        { path: '/api/v1/trips', target: getServiceUrl('TRIPS_SERVICE_URL', 'http://trips-service:3009'), requiresAuth: true, rateLimit: { windowMs: 60000, maxRequests: 50 } },
        { path: '/api/v1/traveler', target: getServiceUrl('TRIPS_SERVICE_URL', 'http://trips-service:3009'), requiresAuth: true, roles: ['traveler', 'admin'], rateLimit: { windowMs: 60000, maxRequests: 50 } },
      ]},
      { name: 'matching-service', url: getServiceUrl('MATCHING_SERVICE_URL', 'http://matching-service:3010'), healthPath: '/health', routes: [
        { path: '/api/v1/matches', target: getServiceUrl('MATCHING_SERVICE_URL', 'http://matching-service:3010'), requiresAuth: true, rateLimit: { windowMs: 60000, maxRequests: 50 } },
        { path: '/api/v1/travel-requests', target: getServiceUrl('MATCHING_SERVICE_URL', 'http://matching-service:3010'), requiresAuth: true, rateLimit: { windowMs: 60000, maxRequests: 50 } },
      ]},
      { name: 'notification-service', url: getServiceUrl('NOTIFICATION_SERVICE_URL', 'http://notification-service:3011'), healthPath: '/health', routes: [
        { path: '/api/notifications', target: getServiceUrl('NOTIFICATION_SERVICE_URL', 'http://notification-service:3011'), pathRewrite: { '^/api/notifications': '/notifications' }, requiresAuth: true, rateLimit: { windowMs: 60000, maxRequests: 200 } },
        { path: '/api/v1/notifications', target: getServiceUrl('NOTIFICATION_SERVICE_URL', 'http://notification-service:3011'), requiresAuth: true, rateLimit: { windowMs: 60000, maxRequests: 60 } },
      ]},
      { name: 'cart-service', url: getServiceUrl('CART_SERVICE_URL', 'http://cart-service:3013'), healthPath: '/health', routes: [
        { path: '/api/cart', target: getServiceUrl('CART_SERVICE_URL', 'http://cart-service:3013'), requiresAuth: true, rateLimit: { windowMs: 60000, maxRequests: 100 } },
      ]},
      { name: 'feature-management-service', url: getServiceUrl('FEATURE_MANAGEMENT_SERVICE_URL', 'http://feature-management-service:3014'), healthPath: '/health', routes: [
        { path: '/api/plugins', target: getServiceUrl('FEATURE_MANAGEMENT_SERVICE_URL', 'http://feature-management-service:3014'), requiresAuth: true, rateLimit: { windowMs: 60000, maxRequests: 100 } },
        { path: '/api/marketplace/plugins', target: getServiceUrl('FEATURE_MANAGEMENT_SERVICE_URL', 'http://feature-management-service:3014'), pathRewrite: { '^/api/marketplace': '/api/marketplace' }, requiresAuth: false, rateLimit: { windowMs: 60000, maxRequests: 200 } },
      ]},
      { name: 'admin-service', url: getServiceUrl('ADMIN_SERVICE_URL', 'http://admin-service:3015'), healthPath: '/health', routes: [
        { path: '/api/v1/admin', target: getServiceUrl('ADMIN_SERVICE_URL', 'http://admin-service:3015'), requiresAuth: true, roles: ['admin'], rateLimit: { windowMs: 60000, maxRequests: 100 } },
        { path: '/api/v1/disputes', target: getServiceUrl('ADMIN_SERVICE_URL', 'http://admin-service:3015'), requiresAuth: true, roles: ['admin'], rateLimit: { windowMs: 60000, maxRequests: 50 } },
        { path: '/api/v1/analytics', target: getServiceUrl('ADMIN_SERVICE_URL', 'http://admin-service:3015'), requiresAuth: true, roles: ['admin'], rateLimit: { windowMs: 60000, maxRequests: 30 } },
      ]},
      { name: 'country-layer-service', url: getServiceUrl('COUNTRY_LAYER_SERVICE_URL', 'http://country-layer-service:3016'), healthPath: '/health', routes: [
        { path: '/api/countries', target: getServiceUrl('COUNTRY_LAYER_SERVICE_URL', 'http://country-layer-service:3016'), pathRewrite: { '^/api/countries': '/api/v1/countries' }, requiresAuth: false, rateLimit: { windowMs: 60000, maxRequests: 100 } },
        { path: '/api/compliance', target: getServiceUrl('COUNTRY_LAYER_SERVICE_URL', 'http://country-layer-service:3016'), pathRewrite: { '^/api/compliance': '/api/v1/countries' }, requiresAuth: true, rateLimit: { windowMs: 60000, maxRequests: 50 } },
      ]},
    ];
  }

  createProxyOptions(target: string, pathRewrite?: Record<string, string>): Options {
    return {
      target,
      changeOrigin: true,
      pathRewrite,
      timeout: 30000,
      proxyTimeout: 30000,
      onError: (err: Error, req: any, res: any) => {
        this.logger.error(`Proxy error: ${target} ${(req as any).path}`, err.stack);
        if (!res.headersSent) {
          res.status(502).json({ error: 'Bad Gateway', message: 'Service temporarily unavailable' });
        }
      },
      onProxyReq: (proxyReq: any, req: any) => {
        if (req.correlationId) proxyReq.setHeader('x-correlation-id', req.correlationId);
        if (req.user) {
          proxyReq.setHeader('x-user-id', req.user.id);
          proxyReq.setHeader('x-user-email', req.user.email);
          proxyReq.setHeader('x-user-role', req.user.role);
        }
        fixRequestBody(proxyReq, req);
      },
    };
  }

  getAllRoutes(): RouteConfig[] {
    return this.getServicesConfig().flatMap(s => s.routes);
  }
}
