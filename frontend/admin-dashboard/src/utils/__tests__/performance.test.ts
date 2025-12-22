/**
 * Unit tests for Admin Dashboard Performance Monitoring Utilities
 * Requirements: 20.1, 20.2 - Performance monitoring and span creation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Sentry module before any imports - use inline functions
vi.mock('@sentry/react', () => ({
  startSpan: vi.fn((options, callback) => callback()),
  addBreadcrumb: vi.fn(),
  setMeasurement: vi.fn(),
}));

// Import Sentry mock and source after mocking
import * as Sentry from '@sentry/react';
import {
  TRANSACTION_NAMES,
  OPERATION_TYPES,
  startSpan,
  startAsyncSpan,
  trackAdminAction,
  trackNavigation,
  trackKYCAction,
  trackDisputeResolution,
  trackReportGeneration,
  performanceMetrics,
} from '../performance';

describe('Admin Dashboard Performance Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    performanceMetrics.clear();
  });

  describe('TRANSACTION_NAMES', () => {
    it('should have admin-specific transaction names', () => {
      expect(TRANSACTION_NAMES.USER_LIST).toBe('admin.users.list');
      expect(TRANSACTION_NAMES.USER_DETAIL).toBe('admin.users.detail');
      expect(TRANSACTION_NAMES.KYC_LIST).toBe('admin.kyc.list');
      expect(TRANSACTION_NAMES.KYC_APPROVE).toBe('admin.kyc.approve');
      expect(TRANSACTION_NAMES.DISPUTE_LIST).toBe('admin.disputes.list');
      expect(TRANSACTION_NAMES.DISPUTE_RESOLVE).toBe('admin.disputes.resolve');
      expect(TRANSACTION_NAMES.ANALYTICS_LOAD).toBe('admin.analytics.load');
      expect(TRANSACTION_NAMES.REPORT_EXPORT).toBe('admin.reports.export');
    });
  });

  describe('OPERATION_TYPES', () => {
    it('should have all required operation types', () => {
      expect(OPERATION_TYPES.HTTP).toBe('http.client');
      expect(OPERATION_TYPES.UI).toBe('ui.action');
      expect(OPERATION_TYPES.NAVIGATION).toBe('navigation');
    });
  });

  describe('startSpan', () => {
    it('should start a span and execute callback', () => {
      const callback = vi.fn(() => 'result');
      
      const result = startSpan('admin.action', 'ui.action', callback);
      
      expect(Sentry.startSpan).toHaveBeenCalledWith(
        { name: 'admin.action', op: 'ui.action' },
        callback
      );
      expect(result).toBe('result');
    });
  });

  describe('startAsyncSpan', () => {
    it('should start an async span', async () => {
      const callback = vi.fn(async () => 'async result');
      
      const result = await startAsyncSpan('async.admin.action', 'http.client', callback);
      
      expect(result).toBe('async result');
    });
  });

  describe('trackAdminAction', () => {
    it('should track admin action with breadcrumb', () => {
      const callback = vi.fn(() => 'action result');
      
      const result = trackAdminAction('user.suspend', callback);
      
      expect(result).toBe('action result');
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'admin.action',
        message: 'user.suspend',
        level: 'info',
      });
    });
  });

  describe('trackNavigation', () => {
    it('should add navigation breadcrumb', () => {
      trackNavigation('UsersPage');
      
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'navigation',
        message: 'Navigated to UsersPage',
        data: undefined,
        level: 'info',
      });
    });

    it('should include params in navigation', () => {
      trackNavigation('UserDetailPage', { userId: 'user-123' });
      
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'navigation',
        message: 'Navigated to UserDetailPage',
        data: { userId: 'user-123' },
        level: 'info',
      });
    });
  });

  describe('trackKYCAction', () => {
    it('should track KYC approval action', () => {
      trackKYCAction('approve', 'user-123', 500);
      
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'admin.kyc',
        message: 'KYC approve',
        data: {
          userId: 'user-123',
          duration: '500ms',
        },
        level: 'info',
      });
      expect(Sentry.setMeasurement).toHaveBeenCalledWith('kyc.approve', 500, 'millisecond');
    });

    it('should track KYC rejection action', () => {
      trackKYCAction('reject', 'user-456', 300);
      
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'admin.kyc',
        message: 'KYC reject',
        data: {
          userId: 'user-456',
          duration: '300ms',
        },
        level: 'info',
      });
      expect(Sentry.setMeasurement).toHaveBeenCalledWith('kyc.reject', 300, 'millisecond');
    });
  });

  describe('trackDisputeResolution', () => {
    it('should track dispute resolution', () => {
      trackDisputeResolution('dispute-123', 'refund_buyer', 1500);
      
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'admin.dispute',
        message: 'Dispute resolved: refund_buyer',
        data: {
          disputeId: 'dispute-123',
          duration: '1500ms',
        },
        level: 'info',
      });
      expect(Sentry.setMeasurement).toHaveBeenCalledWith('dispute.resolution', 1500, 'millisecond');
    });
  });

  describe('trackReportGeneration', () => {
    it('should track report generation', () => {
      trackReportGeneration('sales_report', 2000, 500);
      
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'admin.reports',
        message: 'Report generated: sales_report',
        data: {
          duration: '2000ms',
          recordCount: 500,
        },
        level: 'info',
      });
      expect(Sentry.setMeasurement).toHaveBeenCalledWith('report.generation', 2000, 'millisecond');
    });
  });

  describe('performanceMetrics', () => {
    it('should record and retrieve metrics', () => {
      performanceMetrics.record('admin.metric', 100);
      performanceMetrics.record('admin.metric', 200);
      
      const average = performanceMetrics.getAverage('admin.metric');
      
      expect(average).toBe(150);
    });

    it('should return null for non-existent metric', () => {
      const average = performanceMetrics.getAverage('non.existent');
      
      expect(average).toBeNull();
    });

    it('should clear metrics', () => {
      performanceMetrics.record('clear.metric', 100);
      performanceMetrics.clear();
      
      expect(performanceMetrics.getAverage('clear.metric')).toBeNull();
    });
  });
});
