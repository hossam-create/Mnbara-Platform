/**
 * Performance Monitoring Utilities for MNBARA Mobile Application
 * Requirements: 20.1, 20.2 - Expose Prometheus metrics and implement structured logging
 */

import * as Sentry from '@sentry/react-native';

/**
 * Performance transaction names for consistent tracking
 */
export const TRANSACTION_NAMES = {
  // Screen loads
  SCREEN_LOAD: 'screen.load',
  
  // Authentication flows
  AUTH_LOGIN: 'auth.login',
  AUTH_REGISTER: 'auth.register',
  AUTH_BIOMETRIC: 'auth.biometric',
  
  // Product flows
  PRODUCT_SEARCH: 'product.search',
  PRODUCT_VIEW: 'product.view',
  
  // Auction flows
  AUCTION_VIEW: 'auction.view',
  AUCTION_BID: 'auction.bid',
  
  // Traveler flows
  TRIP_CREATE: 'trip.create',
  DELIVERY_UPDATE: 'delivery.update',
  LOCATION_UPDATE: 'location.update',
  
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
export async function trackApiRequest<T>(
  endpoint: string,
  method: string,
  callback: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await Sentry.startSpan(
      { name: `${method} ${endpoint}`, op: OPERATION_TYPES.HTTP },
      callback
    );
    
    const duration = Date.now() - startTime;
    
    // Add breadcrumb for successful API call
    Sentry.addBreadcrumb({
      category: 'api',
      message: `${method} ${endpoint}`,
      data: {
        duration: `${duration}ms`,
        status: 'success',
      },
      level: 'info',
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Add breadcrumb for failed API call
    Sentry.addBreadcrumb({
      category: 'api',
      message: `${method} ${endpoint}`,
      data: {
        duration: `${duration}ms`,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      level: 'error',
    });
    
    throw error;
  }
}

/**
 * Track user interaction performance
 */
export function trackUserAction<T>(
  actionName: string,
  callback: () => T
): T {
  Sentry.addBreadcrumb({
    category: 'ui.action',
    message: actionName,
    level: 'info',
  });
  
  return startSpan(actionName, OPERATION_TYPES.UI, callback);
}

/**
 * Track screen navigation
 */
export function trackNavigation(screenName: string, params?: Record<string, unknown>): void {
  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Navigated to ${screenName}`,
    data: params,
    level: 'info',
  });
}

/**
 * Performance metrics collector for custom metrics
 */
class PerformanceMetrics {
  private metrics: Map<string, number[]> = new Map();

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

export const performanceMetrics = new PerformanceMetrics();

/**
 * Track screen render time
 */
export function trackScreenRender(screenName: string, renderTime: number): void {
  performanceMetrics.record(`screen.${screenName}.render`, renderTime);
  
  // Warn about slow renders
  if (renderTime > 500) {
    Sentry.captureMessage(`Slow screen render: ${screenName}`, {
      level: 'warning',
      extra: { renderTime },
    });
  }
}

/**
 * Track auction bid latency
 */
export function trackBidLatency(auctionId: string, latency: number, success: boolean): void {
  const metricName = success ? 'auction.bid.success' : 'auction.bid.failure';
  performanceMetrics.record(metricName, latency);
  
  Sentry.addBreadcrumb({
    category: 'auction',
    message: `Bid ${success ? 'placed' : 'failed'}`,
    data: {
      auctionId,
      latency: `${latency}ms`,
    },
    level: success ? 'info' : 'warning',
  });
}

/**
 * Track location update performance
 */
export function trackLocationUpdate(latency: number, success: boolean): void {
  const metricName = success ? 'location.update.success' : 'location.update.failure';
  performanceMetrics.record(metricName, latency);
}

// Export Sentry for direct access
export { Sentry };
