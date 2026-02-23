import { useEffect, useCallback } from 'react';

// Dynamic import for web-vitals to avoid SSR issues
let webVitals: any = null;
if (typeof window !== 'undefined') {
  import('web-vitals').then(module => {
    webVitals = module;
  }).catch(() => {
    console.warn('web-vitals library not available');
  });
}

// Enhanced Core Web Vitals interface
interface CoreWebVitals {
  // First Contentful Paint
  FCP?: number;
  // Largest Contentful Paint
  LCP?: number;
  // First Input Delay
  FID?: number;
  // Interaction to Next Paint (new metric replacing FID)
  INP?: number;
  // Cumulative Layout Shift
  CLS?: number;
  // Time to First Byte
  TTFB?: number;
}

// Performance metrics with marketplace-specific data
interface MarketplacePerformanceMetrics extends CoreWebVitals {
  // Bundle metrics
  bundleSize?: number;
  chunksLoaded?: number;

  // Route performance
  routeChangeTime?: number;
  hydrationTime?: number;

  // API performance
  apiResponseTime?: number;
  apiRequestsCount?: number;

  // Image performance
  imagesLoaded?: number;
  imageLoadTime?: number;
  largestImageLoadTime?: number;

  // User interaction metrics
  interactionsCount?: number;
  interactionDelays?: number[];

  // Marketplace specific
  productsViewed?: number;
  cartAddTime?: number;
  searchTime?: number;
  checkoutTime?: number;
}

// Web Vitals thresholds (Google recommended 2024)
const WEB_VITALS_THRESHOLDS = {
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  FID: { good: 100, needsImprovement: 300 },
  INP: { good: 200, needsImprovement: 500 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  TTFB: { good: 800, needsImprovement: 1800 },
};

// Performance monitoring service
class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeWebVitals();
      this.initializeRouteMonitoring();
      this.initializeResourceMonitoring();
    }
  }

  // Initialize Core Web Vitals monitoring
  private initializeWebVitals() {
    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformancePaintTiming;
      this.metrics.FCP = lastEntry.startTime;
      this.logMetric('FCP', lastEntry.startTime);
    });
    fcpObserver.observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry;
      this.metrics.LCP = lastEntry.startTime;
      this.logMetric('LCP', lastEntry.startTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const fidEntry = entry as any;
        this.metrics.FID = fidEntry.processingStart - entry.startTime;
        this.logMetric('FID', this.metrics.FID!);
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const layoutShiftEntry = entry as any;
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value;
        }
      });
      this.metrics.CLS = clsValue;
      this.logMetric('CLS', clsValue);
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    this.observers.push(fcpObserver, lcpObserver, fidObserver, clsObserver);
  }

  // Route change monitoring
  private initializeRouteMonitoring() {
    let startTime = performance.now();

    // Monitor Next.js route changes
    const handleRouteChange = () => {
      const endTime = performance.now();
      const routeTime = endTime - startTime;
      this.metrics.routeChangeTime = routeTime;
      this.logMetric('RouteChange', routeTime);

      startTime = performance.now();
    };

    // Listen for browser navigation
    window.addEventListener('beforeunload', handleRouteChange);

    // Monitor for SPA route changes (if using client-side routing)
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      handleRouteChange();
      return originalPushState.apply(this, args);
    };
  }

  // Resource loading monitoring
  private initializeResourceMonitoring() {
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const resourceEntry = entry as PerformanceResourceTiming;

        // Monitor API calls
        if (resourceEntry.name.includes('/api/')) {
          const responseTime = resourceEntry.responseEnd - resourceEntry.requestStart;
          this.logMetric('API_Response', responseTime, { url: resourceEntry.name });
        }

        // Monitor image loading
        if (/\.(jpg|jpeg|png|gif|webp|avif)$/i.test(resourceEntry.name)) {
          const loadTime = resourceEntry.responseEnd - resourceEntry.requestStart;
          this.logMetric('Image_Load', loadTime, { url: resourceEntry.name });
        }
      });
    });

    resourceObserver.observe({ entryTypes: ['resource'] });
    this.observers.push(resourceObserver);
  }

  // Log metrics to analytics/monitoring service
  private logMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metricData = {
      name,
      value,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      metadata,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance Metric: ${name}`, {
        value: `${value.toFixed(2)}ms`,
        ...metadata,
      });
    }

    // Send to analytics service (Google Analytics, etc.)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        event_category: 'performance',
        event_label: name,
        value: Math.round(value),
        custom_parameters: metadata,
      });
    }

    // Store in local storage for debugging
    try {
      const existingMetrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
      existingMetrics.push(metricData);
      // Keep only last 50 metrics
      if (existingMetrics.length > 50) {
        existingMetrics.shift();
      }
      localStorage.setItem('performance_metrics', JSON.stringify(existingMetrics));
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  // Get current metrics
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  // Check if metrics are within acceptable ranges
  getPerformanceScore(): {
    score: 'good' | 'needs-improvement' | 'poor';
    issues: string[];
  } {
    const issues: string[] = [];
    let score: 'good' | 'needs-improvement' | 'poor' = 'good';

    if (this.metrics.FCP && this.metrics.FCP > WEB_VITALS_THRESHOLDS.FCP.needsImprovement) {
      issues.push('First Contentful Paint is too slow');
      score = 'poor';
    } else if (this.metrics.FCP && this.metrics.FCP > WEB_VITALS_THRESHOLDS.FCP.good) {
      issues.push('First Contentful Paint could be improved');
      if (score === 'good') score = 'needs-improvement';
    }

    if (this.metrics.LCP && this.metrics.LCP > WEB_VITALS_THRESHOLDS.LCP.needsImprovement) {
      issues.push('Largest Contentful Paint is too slow');
      score = 'poor';
    } else if (this.metrics.LCP && this.metrics.LCP > WEB_VITALS_THRESHOLDS.LCP.good) {
      issues.push('Largest Contentful Paint could be improved');
      if (score === 'good') score = 'needs-improvement';
    }

    if (this.metrics.FID && this.metrics.FID > WEB_VITALS_THRESHOLDS.FID.needsImprovement) {
      issues.push('First Input Delay is too high');
      score = 'poor';
    } else if (this.metrics.FID && this.metrics.FID > WEB_VITALS_THRESHOLDS.FID.good) {
      issues.push('First Input Delay could be improved');
      if (score === 'good') score = 'needs-improvement';
    }

    if (this.metrics.CLS && this.metrics.CLS > WEB_VITALS_THRESHOLDS.CLS.needsImprovement) {
      issues.push('Cumulative Layout Shift is too high');
      score = 'poor';
    } else if (this.metrics.CLS && this.metrics.CLS > WEB_VITALS_THRESHOLDS.CLS.good) {
      issues.push('Cumulative Layout Shift could be improved');
      if (score === 'good') score = 'needs-improvement';
    }

    return { score, issues };
  }

  // Cleanup observers
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const trackApiCall = useCallback((url: string, startTime: number) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    performanceMonitor['logMetric']('API_Call', duration, { url });
  }, []);

  const trackUserInteraction = useCallback((action: string, element: string) => {
    performanceMonitor['logMetric']('User_Interaction', 0, { action, element });
  }, []);

  const getPerformanceReport = useCallback(() => {
    return {
      metrics: performanceMonitor.getMetrics(),
      score: performanceMonitor.getPerformanceScore(),
    };
  }, []);

  return {
    trackApiCall,
    trackUserInteraction,
    getPerformanceReport,
  };
}

// Performance monitoring component for development
export function PerformanceDevTools() {
  const { getPerformanceReport } = usePerformanceMonitoring();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const report = getPerformanceReport();
      console.log('🚀 Performance Report:', report);
    }
  }, [getPerformanceReport]);

  // Only render in development
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs font-mono max-w-xs">
      <div className="text-green-400 font-bold mb-2">Performance Monitor</div>
      <div>Status: Active</div>
      <div>Check console for metrics</div>
    </div>
  );
}

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).performanceMonitor = performanceMonitor;
}
