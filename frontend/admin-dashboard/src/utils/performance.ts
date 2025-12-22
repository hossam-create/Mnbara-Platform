/**
 * Performance Monitoring Utilities for MNBARA Admin Dashboard
 * Requirements: 20.1, 20.2 - Expose Prometheus metrics and implement structured logging
 */

import * as Sentry from '@sentry/react';

/**
 * Performance transaction names for admin dashboard
 */
export const TRANSACTION_NAMES = {
  // Page loads
  PAGE_LOAD: 'page.load',
  
  // User management
  USER_LIST: 'admin.users.list',
  USER_DETAIL: 'admin.users.detail',
  USER_ACTION: 'admin.users.action',
  
  // KYC management
  KYC_LIST: 'admin.kyc.list',
  KYC_REVIEW: 'admin.kyc.review',
  KYC_APPROVE: 'admin.kyc.approve',
  
  // Dispute resolution
  DISPUTE_LIST: 'admin.disputes.list',
  DISPUTE_DETAIL: 'admin.disputes.detail',
  DISPUTE_RESOLVE: 'admin.disputes.resolve',
  
  // Analytics
  ANALYTICS_LOAD: 'admin.analytics.load',
  REPORT_GENERATE: 'admin.reports.generate',
  REPORT_EXPORT: 'admin.reports.export',
  
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
 * Track admin action performance
 */
export function trackAdminAction<T>(
  actionName: string,
  callback: () => T
): T {
  Sentry.addBreadcrumb({
    category: 'admin.action',
    message: actionName,
    level: 'info',
  });
  
  return startSpan(actionName, OPERATION_TYPES.UI, callback);
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
 * Track KYC review action
 */
export function trackKYCAction(
  action: 'approve' | 'reject',
  userId: string,
  duration: number
): void {
  Sentry.addBreadcrumb({
    category: 'admin.kyc',
    message: `KYC ${action}`,
    data: {
      userId,
      duration: `${duration}ms`,
    },
    level: 'info',
  });
  
  Sentry.setMeasurement(`kyc.${action}`, duration, 'millisecond');
}

/**
 * Track dispute resolution action
 */
export function trackDisputeResolution(
  disputeId: string,
  outcome: string,
  duration: number
): void {
  Sentry.addBreadcrumb({
    category: 'admin.dispute',
    message: `Dispute resolved: ${outcome}`,
    data: {
      disputeId,
      duration: `${duration}ms`,
    },
    level: 'info',
  });
  
  Sentry.setMeasurement('dispute.resolution', duration, 'millisecond');
}

/**
 * Track report generation
 */
export function trackReportGeneration(
  reportType: string,
  duration: number,
  recordCount: number
): void {
  Sentry.addBreadcrumb({
    category: 'admin.reports',
    message: `Report generated: ${reportType}`,
    data: {
      duration: `${duration}ms`,
      recordCount,
    },
    level: 'info',
  });
  
  Sentry.setMeasurement('report.generation', duration, 'millisecond');
}

/**
 * Performance metrics collector
 */
class PerformanceMetrics {
  private metrics: Map<string, number[]> = new Map();

  record(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
    Sentry.setMeasurement(name, value, 'millisecond');
  }

  getAverage(name: string): number | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  clear(): void {
    this.metrics.clear();
  }
}

export const performanceMetrics = new PerformanceMetrics();

// Export Sentry for direct access
export { Sentry };
