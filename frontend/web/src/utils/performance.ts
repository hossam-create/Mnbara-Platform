/**
 * Performance Monitoring Utilities for MNBARA Web Application
 * Requirements: 20.1, 20.2 - Expose Prometheus metrics and implement structured logging
 */

import * as Sentry from '@sentry/react';

/**
 * Performance transaction names for consistent tracking
 */
export const TRANSACTION_NAMES = {
  // Page loads
  PAGE_LOAD: 'page.load',
  
  // Authentication flows
  AUTH_LOGIN: 'auth.login',
  AUTH_REGISTER: 'auth.register',
  AUTH_LOGOUT: 'auth.logout',
  
  // Product flows
  PRODUCT_SEARCH: 'product.search',
  PRODUCT_VIEW: 'product.view',
  PRODUCT_LIST: 'product.list',
  
  // Auction flows
  AUCTION_VIEW: 'auction.view',
  AUCTION_BID: 'auction.bid',
  AUCTION_LIST: 'auction.list',
  
  // Checkout flows
  CHECKOUT_START: 'checkout.start',
  CHECKOUT_PAYMENT: 'checkout.payment',
  CHECKOUT_COMPLETE: 'checkout.complete',
  
  // API calls
  API_REQUEST: 'api.request',
} as const;

/**
 * Operation types for Sentry spans
 */
export const OPERATION_TYPES = {
  HTTP: 'http.client',
  DB: 'db.query',
  UI: 'ui.action',
  NAVIGATION: 'navigation',
  TASK: 'task',
} as const;

/**
 * Start a performance span for tracking an operation
 */
export function startSpan<T>(
  name: string,
  op: string,
  callback: () => T
): T {
  return Sentry.startSpan({ name, op }, callback);
}

/**
 * Start an async performance span
 */
export async function startAsyncSpan<T>(
  name: string,
  op: string,
  callback: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan({ name, op }, callback);
}

/**
 * Track API request performance
 */
export function trackApiRequest<T>(
  endpoint: string,
  method: string,
  callback: () => Promise<T>
): Promise<T> {
  return startAsyncSpan(
    `${method} ${endpoint}`,
    OPERATION_TYPES.HTTP,
    async () => {
      const startTime = performance.now();
      try {
        const result = await callback();
        const duration = performance.now() - startTime;
        
        // Add breadcrumb for successful API call
        Sentry.addBreadcrumb({
          category: 'api',
          message: `${method} ${endpoint}`,
          data: {
            duration: `${duration.toFixed(2)}ms`,
            status: 'success',
          },
          level: 'info',
        });
        
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        // Add breadcrumb for failed API call
        Sentry.addBreadcrumb({
          category: 'api',
          message: `${method} ${endpoint}`,
          data: {
            duration: `${duration.toFixed(2)}ms`,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          level: 'error',
        });
        
        throw error;
      }
    }
  );
}

/**
 * Track user interaction performance
 */
export function trackUserAction<T>(
  actionName: string,
  callback: () => T
): T {
  return startSpan(actionName, OPERATION_TYPES.UI, () => {
    Sentry.addBreadcrumb({
      category: 'ui.action',
      message: actionName,
      level: 'info',
    });
    return callback();
  });
}

/**
 * Track page navigation
 */
export function trackNavigation(pageName: string, params?: Record<string, unknown>): void {
  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Navigated to ${pageName}`,
    data: params,
    level: 'info',
  });
}

/**
 * Measure and report Web Vitals
 */
export function reportWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Core Web Vitals
  try {
    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        Sentry.setMeasurement('lcp', lastEntry.startTime, 'millisecond');
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        // @ts-ignore - processingStart exists on PerformanceEventTiming
        const fid = entry.processingStart - entry.startTime;
        Sentry.setMeasurement('fid', fid, 'millisecond');
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        // @ts-ignore - hadRecentInput exists on LayoutShift
        if (!entry.hadRecentInput) {
          // @ts-ignore - value exists on LayoutShift
          clsValue += entry.value;
        }
      });
      Sentry.setMeasurement('cls', clsValue, 'none');
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    // PerformanceObserver not supported
    console.warn('Web Vitals tracking not supported:', e);
  }
}

/**
 * Create a performance-tracked fetch wrapper
 */
export function createTrackedFetch(baseUrl: string) {
  return async function trackedFetch(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const method = options.method || 'GET';
    const url = `${baseUrl}${endpoint}`;
    
    return trackApiRequest(endpoint, method, async () => {
      const response = await fetch(url, options);
      return response;
    });
  };
}

/**
 * Performance metrics collector for custom metrics
 */
export class PerformanceMetrics {
  private static instance: PerformanceMetrics;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMetrics {
    if (!PerformanceMetrics.instance) {
      PerformanceMetrics.instance = new PerformanceMetrics();
    }
    return PerformanceMetrics.instance;
  }

  /**
   * Record a metric value
   */
  record(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
    
    // Report to Sentry
    Sentry.setMeasurement(name, value, 'millisecond');
  }

  /**
   * Get average for a metric
   */
  getAverage(name: string): number | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}

export const performanceMetrics = PerformanceMetrics.getInstance();
