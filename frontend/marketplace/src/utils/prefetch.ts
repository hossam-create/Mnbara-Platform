import { useRouter } from 'next/navigation';
import { useCallback, useRef } from 'react';

// Prefetch strategies for marketplace flows
export const MARKETPLACE_PREFETCH_STRATEGIES = {
  // Prefetch product page on hover
  PRODUCT_HOVER: 'product_hover',
  // Prefetch search results based on typing
  SEARCH_TYPEAHEAD: 'search_typeahead',
  // Prefetch category page on navigation hover
  CATEGORY_NAVIGATION: 'category_navigation',
  // Prefetch related products on product view
  RELATED_PRODUCTS: 'related_products',
  // Prefetch next page in pagination
  PAGINATION_NEXT: 'pagination_next',
} as const;

type PrefetchStrategy = typeof MARKETPLACE_PREFETCH_STRATEGIES[keyof typeof MARKETPLACE_PREFETCH_STRATEGIES];

// Intelligent prefetch manager
class PrefetchManager {
  private prefetchedUrls = new Set<string>();
  private prefetchTimeouts = new Map<string, NodeJS.Timeout>();
  private prefetchQueue: string[] = [];
  private isProcessing = false;

  // Prefetch with debouncing and prioritization
  async prefetch(url: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    if (this.prefetchedUrls.has(url)) return;

    // Clear existing timeout for this URL
    const existingTimeout = this.prefetchTimeouts.get(url);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const delay = priority === 'high' ? 50 : priority === 'medium' ? 150 : 300;

    return new Promise((resolve) => {
      const timeout = setTimeout(async () => {
        try {
          // Use Next.js router prefetch
          if (typeof window !== 'undefined') {
            const router = (await import('next/navigation')).useRouter();
            // Note: This would need to be called from a component context
            // For now, we'll use the browser's prefetch API as fallback
            if ('prefetch' in document) {
              const link = document.createElement('link');
              link.rel = 'prefetch';
              link.href = url;
              link.as = 'document';
              document.head.appendChild(link);
            }
          }

          this.prefetchedUrls.add(url);
          this.prefetchTimeouts.delete(url);
          resolve();
        } catch (error) {
          console.warn('Prefetch failed for:', url, error);
          resolve();
        }
      }, delay);

      this.prefetchTimeouts.set(url, timeout);
    });
  }

  // Batch prefetch multiple URLs
  async prefetchBatch(urls: string[], priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    const promises = urls.map(url => this.prefetch(url, priority));
    await Promise.allSettled(promises);
  }

  // Clear prefetch cache
  clearCache(): void {
    this.prefetchedUrls.clear();
    this.prefetchTimeouts.forEach(timeout => clearTimeout(timeout));
    this.prefetchTimeouts.clear();
  }
}

// Global prefetch manager instance
export const prefetchManager = new PrefetchManager();

// React hooks for intelligent prefetching
export function useMarketplacePrefetch() {
  const router = useRouter();
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Prefetch on hover with debounce
  const prefetchOnHover = useCallback((url: string, delay = 100) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      router.prefetch(url);
    }, delay);
  }, [router]);

  // Cancel hover prefetch
  const cancelHoverPrefetch = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = undefined;
    }
  }, []);

  // Prefetch search results based on query
  const prefetchSearchResults = useCallback((query: string, delay = 200) => {
    if (!query || query.length < 2) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      const searchUrl = `/search?q=${encodeURIComponent(query)}`;
      router.prefetch(searchUrl);
    }, delay);
  }, [router]);

  // Prefetch category page
  const prefetchCategory = useCallback((categorySlug: string) => {
    const categoryUrl = `/category/${categorySlug}`;
    router.prefetch(categoryUrl);
  }, [router]);

  // Prefetch related products
  const prefetchRelatedProducts = useCallback((productIds: string[]) => {
    const productUrls = productIds.map(id => `/product/${id}`);
    productUrls.forEach(url => router.prefetch(url));
  }, [router]);

  // Prefetch next page in pagination
  const prefetchNextPage = useCallback((baseUrl: string, currentPage: number) => {
    const nextPageUrl = `${baseUrl}?page=${currentPage + 1}`;
    router.prefetch(nextPageUrl);
  }, [router]);

  return {
    prefetchOnHover,
    cancelHoverPrefetch,
    prefetchSearchResults,
    prefetchCategory,
    prefetchRelatedProducts,
    prefetchNextPage,
  };
}

// HOC for automatic prefetching on product links
export function withProductPrefetch<T extends object>(
  Component: React.ComponentType<T>
) {
  return function ProductPrefetchWrapper(props: T) {
    const { prefetchOnHover, cancelHoverPrefetch } = useMarketplacePrefetch();

    const handleMouseEnter = () => {
      // Extract product URL from props or context
      const productUrl = (props as any).href || (props as any).to;
      if (productUrl) {
        prefetchOnHover(productUrl);
      }
    };

    const handleMouseLeave = () => {
      cancelHoverPrefetch();
    };

    return (
      <Component
        {...props}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    );
  };
}

// Search input with automatic prefetching
export function useSearchPrefetch() {
  const { prefetchSearchResults } = useMarketplacePrefetch();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSearchChange = useCallback((query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      prefetchSearchResults(query);
    }, 150);
  }, [prefetchSearchResults]);

  return { handleSearchChange };
}

// Performance monitoring for prefetching
export function logPrefetchPerformance(url: string, startTime: number): void {
  const duration = Date.now() - startTime;
  if (process.env.NODE_ENV === 'development') {
    console.log(`Prefetch completed for ${url}: ${duration}ms`);
  }

  // In production, send to analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'prefetch_complete', {
      event_category: 'performance',
      event_label: url,
      value: duration,
    });
  }
}
