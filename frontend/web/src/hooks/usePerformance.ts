/**
 * Performance Monitoring Hook for MNBARA Web Application
 * Requirements: 20.1, 20.2 - Expose Prometheus metrics and implement structured logging
 */

import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import {
  trackNavigation,
  trackUserAction,
  performanceMetrics,
  TRANSACTION_NAMES,
} from '../utils/performance';

/**
 * Hook to track page load performance
 */
export function usePageLoadTracking(pageName: string): void {
  const location = useLocation();
  const startTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    const loadTime = performance.now() - startTimeRef.current;
    
    // Track navigation
    trackNavigation(pageName, { path: location.pathname });
    
    // Record page load time
    performanceMetrics.record(`page.${pageName}.load`, loadTime);
    
    // Set Sentry tag for current page
    Sentry.setTag('page', pageName);
    
    return () => {
      // Track time spent on page when leaving
      const timeOnPage = performance.now() - startTimeRef.current;
      performanceMetrics.record(`page.${pageName}.duration`, timeOnPage);
    };
  }, [pageName, location.pathname]);
}

/**
 * Hook to track component render performance
 */
export function useRenderTracking(componentName: string): void {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    renderCountRef.current += 1;
    const renderTime = performance.now() - lastRenderTimeRef.current;
    
    if (renderCountRef.current > 1) {
      performanceMetrics.record(`component.${componentName}.rerender`, renderTime);
    }
    
    lastRenderTimeRef.current = performance.now();
  });
}

/**
 * Hook to create tracked action handlers
 */
export function useTrackedAction<T extends (...args: unknown[]) => unknown>(
  actionName: string,
  handler: T
): T {
  return useCallback(
    ((...args: Parameters<T>) => {
      return trackUserAction(actionName, () => handler(...args));
    }) as T,
    [actionName, handler]
  );
}

/**
 * Hook to track async operations
 */
export function useAsyncTracking() {
  const trackAsync = useCallback(
    async <T>(
      operationName: string,
      operation: () => Promise<T>
    ): Promise<T> => {
      const startTime = performance.now();
      
      try {
        const result = await Sentry.startSpan(
          { name: operationName, op: 'task' },
          operation
        );
        
        const duration = performance.now() - startTime;
        performanceMetrics.record(`async.${operationName}`, duration);
        
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        performanceMetrics.record(`async.${operationName}.error`, duration);
        throw error;
      }
    },
    []
  );

  return { trackAsync };
}

/**
 * Hook to track auction-specific performance
 */
export function useAuctionPerformance(auctionId: string) {
  const bidStartTimeRef = useRef<number | null>(null);

  const startBidTracking = useCallback(() => {
    bidStartTimeRef.current = performance.now();
  }, []);

  const endBidTracking = useCallback(
    (success: boolean) => {
      if (bidStartTimeRef.current) {
        const duration = performance.now() - bidStartTimeRef.current;
        performanceMetrics.record(
          success ? 'auction.bid.success' : 'auction.bid.failure',
          duration
        );
        
        Sentry.addBreadcrumb({
          category: 'auction',
          message: `Bid ${success ? 'placed' : 'failed'}`,
          data: {
            auctionId,
            duration: `${duration.toFixed(2)}ms`,
          },
          level: success ? 'info' : 'warning',
        });
        
        bidStartTimeRef.current = null;
      }
    },
    [auctionId]
  );

  return { startBidTracking, endBidTracking };
}

/**
 * Hook to track checkout performance
 */
export function useCheckoutPerformance() {
  const checkoutStartRef = useRef<number | null>(null);
  const stepTimesRef = useRef<Record<string, number>>({});

  const startCheckout = useCallback(() => {
    checkoutStartRef.current = performance.now();
    stepTimesRef.current = {};
    
    Sentry.addBreadcrumb({
      category: 'checkout',
      message: 'Checkout started',
      level: 'info',
    });
  }, []);

  const trackStep = useCallback((stepName: string) => {
    const now = performance.now();
    stepTimesRef.current[stepName] = now;
    
    performanceMetrics.record(`checkout.step.${stepName}`, now - (checkoutStartRef.current || now));
    
    Sentry.addBreadcrumb({
      category: 'checkout',
      message: `Step: ${stepName}`,
      level: 'info',
    });
  }, []);

  const completeCheckout = useCallback((success: boolean) => {
    if (checkoutStartRef.current) {
      const totalDuration = performance.now() - checkoutStartRef.current;
      
      performanceMetrics.record(
        success ? 'checkout.complete.success' : 'checkout.complete.failure',
        totalDuration
      );
      
      Sentry.addBreadcrumb({
        category: 'checkout',
        message: `Checkout ${success ? 'completed' : 'failed'}`,
        data: {
          totalDuration: `${totalDuration.toFixed(2)}ms`,
          steps: Object.keys(stepTimesRef.current),
        },
        level: success ? 'info' : 'error',
      });
      
      checkoutStartRef.current = null;
    }
  }, []);

  return { startCheckout, trackStep, completeCheckout };
}

/**
 * Hook to track search performance
 */
export function useSearchPerformance() {
  const searchStartRef = useRef<number | null>(null);

  const startSearch = useCallback((query: string) => {
    searchStartRef.current = performance.now();
    
    Sentry.addBreadcrumb({
      category: 'search',
      message: 'Search initiated',
      data: { query },
      level: 'info',
    });
  }, []);

  const endSearch = useCallback((resultCount: number) => {
    if (searchStartRef.current) {
      const duration = performance.now() - searchStartRef.current;
      
      performanceMetrics.record('search.duration', duration);
      
      Sentry.addBreadcrumb({
        category: 'search',
        message: 'Search completed',
        data: {
          duration: `${duration.toFixed(2)}ms`,
          resultCount,
        },
        level: 'info',
      });
      
      searchStartRef.current = null;
    }
  }, []);

  return { startSearch, endSearch };
}

export { TRANSACTION_NAMES };
