/**
 * Unit tests for Performance Monitoring Utilities
 * Requirements: 20.1, 20.2 - Performance monitoring and span creation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Sentry from '@sentry/react';

// Mock Sentry module
vi.mock('@sentry/react', () => ({
  startSpan: vi.fn((options, callback) => callback()),
  addBreadcrumb: vi.fn(),
  setMeasurement: vi.fn(),
}));

// Import after mocking
import {
  TRANSACTION_NAMES,
  OPERATION_TYPES,
  startSpan,
  startAsyncSpan,
  trackApiRequest,
  trackUserAction,
  trackNavigation,
  PerformanceMetrics,
  performanceMetrics,
} from '../performance';

describe('Performance Monitoring Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    performanceMetrics.clear();
  });

  describe('TRANSACTION_NAMES', () => {
    it('should have all required transaction names', () => {
      expect(TRANSACTION_NAMES.PAGE_LOAD).toBe('page.load');
      expect(TRANSACTION_NAMES.AUTH_LOGIN).toBe('auth.login');
      expect(TRANSACTION_NAMES.AUTH_REGISTER).toBe('auth.register');
      expect(TRANSACTION_NAMES.PRODUCT_SEARCH).toBe('product.search');
      expect(TRANSACTION_NAMES.AUCTION_BID).toBe('auction.bid');
      expect(TRANSACTION_NAMES.CHECKOUT_PAYMENT).toBe('checkout.payment');
      expect(TRANSACTION_NAMES.API_REQUEST).toBe('api.request');
    });
  });

  describe('OPERATION_TYPES', () => {
    it('should have all required operation types', () => {
      expect(OPERATION_TYPES.HTTP).toBe('http.client');
      expect(OPERATION_TYPES.DB).toBe('db.query');
      expect(OPERATION_TYPES.UI).toBe('ui.action');
      expect(OPERATION_TYPES.NAVIGATION).toBe('navigation');
      expect(OPERATION_TYPES.TASK).toBe('task');
    });
  });

  describe('startSpan', () => {
    it('should start a span and execute callback', () => {
      const callback = vi.fn(() => 'result');
      
      const result = startSpan('test.operation', 'http.client', callback);
      
      expect(Sentry.startSpan).toHaveBeenCalledWith(
        { name: 'test.operation', op: 'http.client' },
        callback
      );
      expect(result).toBe('result');
    });

    it('should pass through callback return value', () => {
      const callback = vi.fn(() => ({ data: 'test' }));
      
      const result = startSpan('test', 'task', callback);
      
      expect(result).toEqual({ data: 'test' });
    });
  });

  describe('startAsyncSpan', () => {
    it('should start an async span and execute callback', async () => {
      const callback = vi.fn(async () => 'async result');
      
      const result = await startAsyncSpan('async.operation', 'http.client', callback);
      
      expect(Sentry.startSpan).toHaveBeenCalledWith(
        { name: 'async.operation', op: 'http.client' },
        callback
      );
      expect(result).toBe('async result');
    });
  });

  describe('trackApiRequest', () => {
    it('should track successful API request', async () => {
      const callback = vi.fn(async () => ({ data: 'response' }));
      
      const result = await trackApiRequest('/api/products', 'GET', callback);
      
      expect(result).toEqual({ data: 'response' });
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'api',
          message: 'GET /api/products',
          data: expect.objectContaining({
            status: 'success',
          }),
          level: 'info',
        })
      );
    });

    it('should track failed API request', async () => {
      const error = new Error('Network error');
      const callback = vi.fn(async () => {
        throw error;
      });
      
      await expect(trackApiRequest('/api/products', 'POST', callback)).rejects.toThrow('Network error');
      
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'api',
          message: 'POST /api/products',
          data: expect.objectContaining({
            status: 'error',
            error: 'Network error',
          }),
          level: 'error',
        })
      );
    });

    it('should include duration in breadcrumb', async () => {
      const callback = vi.fn(async () => 'result');
      
      await trackApiRequest('/api/test', 'GET', callback);
      
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            duration: expect.stringMatching(/^\d+\.\d+ms$/),
          }),
        })
      );
    });
  });

  describe('trackUserAction', () => {
    it('should track user action with breadcrumb', () => {
      const callback = vi.fn(() => 'action result');
      
      const result = trackUserAction('button.click', callback);
      
      expect(result).toBe('action result');
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'ui.action',
        message: 'button.click',
        level: 'info',
      });
    });
  });

  describe('trackNavigation', () => {
    it('should add navigation breadcrumb', () => {
      trackNavigation('ProductsPage');
      
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'navigation',
        message: 'Navigated to ProductsPage',
        data: undefined,
        level: 'info',
      });
    });

    it('should include params in navigation breadcrumb', () => {
      trackNavigation('ProductDetailPage', { productId: '123' });
      
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'navigation',
        message: 'Navigated to ProductDetailPage',
        data: { productId: '123' },
        level: 'info',
      });
    });
  });

  describe('PerformanceMetrics', () => {
    it('should be a singleton', () => {
      const instance1 = PerformanceMetrics.getInstance();
      const instance2 = PerformanceMetrics.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should record metric values', () => {
      performanceMetrics.record('test.metric', 100);
      performanceMetrics.record('test.metric', 200);
      
      expect(Sentry.setMeasurement).toHaveBeenCalledWith('test.metric', 100, 'millisecond');
      expect(Sentry.setMeasurement).toHaveBeenCalledWith('test.metric', 200, 'millisecond');
    });

    it('should calculate average for recorded metrics', () => {
      performanceMetrics.record('avg.metric', 100);
      performanceMetrics.record('avg.metric', 200);
      performanceMetrics.record('avg.metric', 300);
      
      const average = performanceMetrics.getAverage('avg.metric');
      
      expect(average).toBe(200);
    });

    it('should return null for non-existent metric', () => {
      const average = performanceMetrics.getAverage('non.existent');
      
      expect(average).toBeNull();
    });

    it('should clear all metrics', () => {
      performanceMetrics.record('clear.metric', 100);
      performanceMetrics.clear();
      
      const average = performanceMetrics.getAverage('clear.metric');
      
      expect(average).toBeNull();
    });
  });
});
