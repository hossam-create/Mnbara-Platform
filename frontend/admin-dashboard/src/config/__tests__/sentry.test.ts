/**
 * Unit tests for Admin Dashboard Sentry configuration
 * Requirements: 20.1, 20.3 - Error tracking and monitoring integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Sentry module before any imports - use inline functions
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  setUser: vi.fn(),
  withScope: vi.fn((callback) => callback({ setLevel: vi.fn(), setExtras: vi.fn() })),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({})),
  replayIntegration: vi.fn(() => ({})),
}));

// Import Sentry mock and source after mocking
import * as Sentry from '@sentry/react';
import {
  initSentry,
  setSentryUser,
  captureError,
  captureMessage,
  addBreadcrumb,
} from '../sentry';

describe('Admin Dashboard Sentry Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initSentry', () => {
    it('should warn when DSN is not configured', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      initSentry();
      
      expect(consoleSpy).toHaveBeenCalledWith('[Sentry] DSN not configured. Error tracking disabled.');
      
      consoleSpy.mockRestore();
    });
  });

  describe('setSentryUser', () => {
    it('should set admin user context', () => {
      const user = { id: 'admin-123', email: 'admin@example.com', role: 'admin' };
      
      setSentryUser(user);
      
      expect(Sentry.setUser).toHaveBeenCalledWith({
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      });
    });

    it('should clear user context on logout', () => {
      setSentryUser(null);
      
      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe('captureError', () => {
    it('should capture admin action errors', () => {
      const error = new Error('KYC approval failed');
      
      captureError(error);
      
      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should capture error with admin context', () => {
      const error = new Error('Dispute resolution failed');
      const context = { disputeId: 'dispute-123', action: 'resolve' };
      
      captureError(error, context);
      
      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(error);
    });
  });

  describe('captureMessage', () => {
    it('should capture admin action messages', () => {
      captureMessage('User suspended', 'warning', { userId: 'user-123' });
      
      expect(Sentry.withScope).toHaveBeenCalled();
      expect(Sentry.captureMessage).toHaveBeenCalledWith('User suspended');
    });
  });

  describe('addBreadcrumb', () => {
    it('should add admin action breadcrumb', () => {
      addBreadcrumb('KYC approved', 'admin.kyc', { userId: 'user-123' });
      
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: 'KYC approved',
        category: 'admin.kyc',
        data: { userId: 'user-123' },
        level: 'info',
      });
    });
  });
});
