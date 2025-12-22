/**
 * Mock for @sentry/react module
 * Used in tests to avoid requiring the actual Sentry package
 */

import { vi } from 'vitest';

export const init = vi.fn();
export const setUser = vi.fn();
export const withScope = vi.fn((callback) => callback({ setLevel: vi.fn(), setExtras: vi.fn() }));
export const captureException = vi.fn();
export const captureMessage = vi.fn();
export const addBreadcrumb = vi.fn();
export const startSpan = vi.fn((options, callback) => callback());
export const startInactiveSpan = vi.fn(() => ({ end: vi.fn() }));
export const setMeasurement = vi.fn();
export const browserTracingIntegration = vi.fn(() => ({}));
export const replayIntegration = vi.fn(() => ({}));

// Export as default and named
export default {
  init,
  setUser,
  withScope,
  captureException,
  captureMessage,
  addBreadcrumb,
  startSpan,
  startInactiveSpan,
  setMeasurement,
  browserTracingIntegration,
  replayIntegration,
};
