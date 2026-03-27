/**
 * API Gateway Routing Configuration
 * 
 * Centralized routing rules for all service-to-service communication.
 * This configuration defines:
 * - Route prefixes and their target services
 * - Authentication requirements
 * - Rate limiting policies
 * - Request/response transformations
 * - Circuit breaker settings
 */

import { Request, Response } from 'express';

export interface RouteConfig {
  /** Route prefix (e.g., '/auth', '/users') */
  prefix: string;
  
  /** Target service name (must match serviceUrls key) */
  service: string;
  
  /** Whether authentication is required */
  requiresAuth: boolean;
  
  /** Rate limit policy name */
  rateLimitPolicy: 'public' | 'authenticated' | 'strict' | 'none';
  
  /** Circuit breaker settings */
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
  };
  
  /** Request timeout in milliseconds */
  timeout: number;
  
  /** Retry policy */
  retry: {
    enabled: boolean;
    maxAttempts: number;
    backoffMs: number;
  };
  
  /** Request/response logging */
  logging: {
    enabled: boolean;
    logBody: boolean;
    redactFields: string[];
  };
  
  /** CORS settings */
  cors: {
    enabled: boolean;
    credentials: boolean;
  };
  
  /** Description of this route */
  description: string;
}

export interface ServiceRouteMap {
  [prefix: string]: RouteConfig;
}

/**
 * Complete routing configuration for all services
 */
export const routingConfig: ServiceRouteMap = {
  // ============================================
  // Core Services
  // ============================================
  
  '/auth': {
    prefix: '/auth',
    service: 'auth',
    requiresAuth: false,
    rateLimitPolicy: 'public',
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
    },
    timeout: 10000,
    retry: {
      enabled: true,
      maxAttempts: 3,
      backoffMs: 100,
    },
    logging: {
      enabled: true,
      logBody: false,
      redactFields: ['password', 'token', 'secret'],
    },
    cors: {
      enabled: true,
      credentials: true,
    },
    description: 'Authentication service - login, register, token management',
  },

  '/users': {
    prefix: '/users',
    service: 'user',
    requiresAuth: true,
    rateLimitPolicy: 'authenticated',
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
    },
    timeout: 10000,
    retry: {
      enabled: true,
      maxAttempts: 2,
      backoffMs: 100,
    },
    logging: {
      enabled: true,
      logBody: true,
      redactFields: ['password', 'email', 'phone'],
    },
    cors: {
      enabled: true,
      credentials: true,
    },
    description: 'User service - user profiles, preferences, addresses',
  },

  '/notifications': {
    prefix: '/notifications',
    service: 'notification',
    requiresAuth: true,
    rateLimitPolicy: 'authenticated',
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
    },
    timeout: 10000,
    retry: {
      enabled: true,
      maxAttempts: 2,
      backoffMs: 100,
    },
    logging: {
      enabled: true,
      logBody: true,
      redactFields: [],
    },
    cors: {
      enabled: true,
      credentials: true,
    },
    description: 'Notification service - emails, SMS, push notifications',
  },

  // ============================================
  // Marketplace Services
  // ============================================

  '/products': {
    prefix: '/products',
    service: 'marketplace',
    requiresAuth: false,
    rateLimitPolicy: 'public',
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
    },
    timeout: 10000,
    retry: {
      enabled: true,
      maxAttempts: 2,
      backoffMs: 100,
    },
    logging: {
      enabled: true,
      logBody: false,
      redactFields: [],
    },
    cors: {
      enabled: true,
      credentials: false,
    },
    description: 'Product service - product catalog, search, details',
  },

  '/orders': {
    prefix: '/orders',
    service: 'marketplace',
    requiresAuth: true,
    rateLimitPolicy: 'authenticated',
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
    },
    timeout: 15000,
    retry: {
      enabled: true,
      maxAttempts: 2,
      backoffMs: 200,
    },
    logging: {
      enabled: true,
      logBody: true,
      redactFields: [],
    },
    cors: {
      enabled: true,
      credentials: true,
    },
    description: 'Order service - create, list, update orders',
  },

  '/cart': {
    prefix: '/cart',
    service: 'marketplace',
    requiresAuth: true,
    rateLimitPolicy: 'authenticated',
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
    },
    timeout: 10000,
    retry: {
      enabled: true,
      maxAttempts: 2,
      backoffMs: 100,
    },
    logging: {
      enabled: true,
      logBody: true,
      redactFields: [],
    },
    cors: {
      enabled: true,
      credentials: true,
    },
    description: 'Cart service - shopping cart management',
  },

  // ============================================
  // Financial Services
  // ============================================

  '/payments': {
    prefix: '/payments',
    service: 'payment',
    requiresAuth: true,
    rateLimitPolicy: 'strict',
    circuitBreaker: {
      enabled: true,
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 30000,
    },
    timeout: 30000,
    retry: {
      enabled: true,
      maxAttempts: 3,
      backoffMs: 500,
    },
    logging: {
      enabled: true,
      logBody: false,
      redactFields: ['cardNumber', 'cvv', 'pin', 'token'],
    },
    cors: {
      enabled: true,
      credentials: true,
    },
    description: 'Payment service - payment processing, refunds',
  },

  '/wallet': {
    prefix: '/wallet',
    service: 'payment',
    requiresAuth: true,
    rateLimitPolicy: 'authenticated',
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
    },
    timeout: 10000,
    retry: {
      enabled: true,
      maxAttempts: 2,
      backoffMs: 100,
    },
    logging: {
      enabled: true,
      logBody: true,
      redactFields: [],
    },
    cors: {
      enabled: true,
      credentials: true,
    },
    description: 'Wallet service - balance, transactions, transfers',
  },

  '/escrow': {
    prefix: '/escrow',
    service: 'payment',
    requiresAuth: true,
    rateLimitPolicy: 'strict',
    circuitBreaker: {
      enabled: true,
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 30000,
    },
    timeout: 15000,
    retry: {
      enabled: true,
      maxAttempts: 2,
      backoffMs: 200,
    },
    logging: {
      enabled: true,
      logBody: true,
      redactFields: [],
    },
    cors: {
      enabled: true,
      credentials: true,
    },
    description: 'Escrow service - escrow management, releases',
  },

  '/settlement': {
    prefix: '/settlement',
    service: 'payment',
    requiresAuth: true,
    rateLimitPolicy: 'authenticated',
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
    },
    timeout: 20000,
    retry: {
      enabled: true,
      maxAttempts: 2,
      backoffMs: 200,
    },
    logging: {
      enabled: true,
      logBody: true,
      redactFields: [],
    },
    cors: {
      enabled: true,
      credentials: true,
    },
    description: 'Settlement service - financial settlements, payouts',
  },

  // ============================================
  // Delivery Services
  // ============================================

  '/delivery': {
    prefix: '/delivery',
    service: 'delivery',
    requiresAuth: true,
    rateLimitPolicy: 'authenticated',
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
    },
    timeout: 10000,
    retry: {
      enabled: true,
      maxAttempts: 2,
      backoffMs: 100,
    },
    logging: {
      enabled: true,
      logBody: true,
      redactFields: [],
    },
    cors: {
      enabled: true,
      credentials: true,
    },
    description: 'Delivery service - delivery tracking, status updates',
  },

  '/trips': {
    prefix: '/trips',
    service: 'delivery',
    requiresAuth: true,
    rateLimitPolicy: 'authenticated',
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
    },
    timeout: 10000,
    retry: {
      enabled: true,
      maxAttempts: 2,
      backoffMs: 100,
    },
    logging: {
      enabled: true,
      logBody: true,
      redactFields: [],
    },
    cors: {
      enabled: true,
      credentials: true,
    },
    description: 'Trips service - trip management, scheduling',
  },

  '/matching': {
    prefix: '/matching',
    service: 'delivery',
    requiresAuth: true,
    rateLimitPolicy: 'authenticated',
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 30000,
    },
    timeout: 15000,
    retry: {
      enabled: true,
      maxAttempts: 2,
      backoffMs: 100,
    },
    logging: {
      enabled: true,
      logBody: true,
      redactFields: [],
    },
    cors: {
      enabled: true,
      credentials: true,
    },
    description: 'Matching service - driver-order matching, optimization',
  },
};

/**
 * Rate limiting policies
 */
export const rateLimitPolicies = {
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again later.',
  },
  authenticated: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 500,
    message: 'Too many requests, please try again later.',
  },
  strict: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many requests, please try again later.',
  },
  none: {
    windowMs: 0,
    maxRequests: 0,
    message: 'Rate limiting disabled',
  },
};

/**
 * Get routing configuration for a specific prefix
 */
export function getRouteConfig(prefix: string): RouteConfig | undefined {
  return routingConfig[prefix];
}

/**
 * Get all route prefixes
 */
export function getAllRoutePrefixes(): string[] {
  return Object.keys(routingConfig);
}

/**
 * Get all routes for a specific service
 */
export function getServiceRoutes(serviceName: string): RouteConfig[] {
  return Object.values(routingConfig).filter(
    (route) => route.service === serviceName
  );
}

/**
 * Get rate limit policy for a route
 */
export function getRateLimitPolicy(prefix: string) {
  const route = getRouteConfig(prefix);
  if (!route) return rateLimitPolicies.public;
  return rateLimitPolicies[route.rateLimitPolicy];
}

/**
 * Check if route requires authentication
 */
export function requiresAuthentication(prefix: string): boolean {
  const route = getRouteConfig(prefix);
  return route?.requiresAuth ?? false;
}

/**
 * Get circuit breaker settings for a route
 */
export function getCircuitBreakerSettings(prefix: string) {
  const route = getRouteConfig(prefix);
  if (!route) return { enabled: false };
  return route.circuitBreaker;
}

/**
 * Get retry policy for a route
 */
export function getRetryPolicy(prefix: string) {
  const route = getRouteConfig(prefix);
  if (!route) return { enabled: false, maxAttempts: 1, backoffMs: 0 };
  return route.retry;
}

/**
 * Get timeout for a route
 */
export function getRouteTimeout(prefix: string): number {
  const route = getRouteConfig(prefix);
  return route?.timeout ?? 10000;
}

/**
 * Get logging settings for a route
 */
export function getLoggingSettings(prefix: string) {
  const route = getRouteConfig(prefix);
  if (!route) return { enabled: false, logBody: false, redactFields: [] };
  return route.logging;
}

/**
 * Redact sensitive fields from logs
 */
export function redactSensitiveData(
  data: any,
  redactFields: string[]
): any {
  if (!data || typeof data !== 'object') return data;

  const redacted = { ...data };
  redactFields.forEach((field) => {
    if (field in redacted) {
      redacted[field] = '[REDACTED]';
    }
  });
  return redacted;
}

export default routingConfig;
