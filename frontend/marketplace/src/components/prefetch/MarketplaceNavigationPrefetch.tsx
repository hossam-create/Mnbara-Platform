'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import { prefetchManager, MARKETPLACE_PREFETCH_STRATEGIES } from '@/utils/prefetch';

// Automatic prefetching for marketplace navigation flows
export function useMarketplaceNavigationPrefetch() {
  const router = useRouter();

  // Prefetch common marketplace routes on app load
  useEffect(() => {
    // Prefetch high-priority pages after initial load
    const prefetchCommonRoutes = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for initial page load

      const commonRoutes = [
        '/search',
        '/cart',
        '/user/dashboard',
        '/categories',
      ];

      for (const route of commonRoutes) {
        router.prefetch(route);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Prefetched common marketplace routes');
      }
    };

    prefetchCommonRoutes();
  }, [router]);

  // Prefetch product pages on hover
  const prefetchProductOnHover = useCallback((productId: string) => {
    const productUrl = `/product/${productId}`;
    prefetchManager.prefetch(productUrl, 'high');
  }, []);

  // Prefetch category pages on hover
  const prefetchCategoryOnHover = useCallback((categorySlug: string) => {
    const categoryUrl = `/category/${categorySlug}`;
    prefetchManager.prefetch(categoryUrl, 'medium');
  }, []);

  // Prefetch search results on query change
  const prefetchSearchResults = useCallback((query: string) => {
    if (query.length > 2) {
      const searchUrl = `/search?q=${encodeURIComponent(query)}`;
      prefetchManager.prefetch(searchUrl, 'medium');
    }
  }, []);

  // Prefetch next page in listings
  const prefetchNextPage = useCallback((currentPath: string, nextPage: number) => {
    const nextPageUrl = `${currentPath}?page=${nextPage}`;
    prefetchManager.prefetch(nextPageUrl, 'low');
  }, []);

  // Prefetch related products
  const prefetchRelatedProducts = useCallback((productIds: string[]) => {
    const productUrls = productIds.slice(0, 3).map(id => `/product/${id}`);
    prefetchManager.prefetchBatch(productUrls, 'low');
  }, []);

  return {
    prefetchProductOnHover,
    prefetchCategoryOnHover,
    prefetchSearchResults,
    prefetchNextPage,
    prefetchRelatedProducts,
  };
}

// Component for automatic prefetching in navigation
export function MarketplaceNavigationPrefetch() {
  const { prefetchProductOnHover, prefetchCategoryOnHover } = useMarketplaceNavigationPrefetch();

  // Set up global event listeners for marketplace navigation
  useEffect(() => {
    const handleProductHover = (event: Event) => {
      const target = event.target as HTMLElement;
      const productLink = target.closest('[data-product-id]') as HTMLElement;
      if (productLink) {
        const productId = productLink.getAttribute('data-product-id');
        if (productId) {
          prefetchProductOnHover(productId);
        }
      }
    };

    const handleCategoryHover = (event: Event) => {
      const target = event.target as HTMLElement;
      const categoryLink = target.closest('[data-category-slug]') as HTMLElement;
      if (categoryLink) {
        const categorySlug = categoryLink.getAttribute('data-category-slug');
        if (categorySlug) {
          prefetchCategoryOnHover(categorySlug);
        }
      }
    };

    // Add event listeners
    document.addEventListener('mouseenter', handleProductHover, true);
    document.addEventListener('mouseenter', handleCategoryHover, true);

    return () => {
      document.removeEventListener('mouseenter', handleProductHover, true);
      document.removeEventListener('mouseenter', handleCategoryHover, true);
    };
  }, [prefetchProductOnHover, prefetchCategoryOnHover]);

  return null; // This component only sets up event listeners
}

// HOC for marketplace components that need automatic prefetching
export function withMarketplacePrefetch<P extends object>(
  Component: React.ComponentType<P>,
  prefetchStrategy?: keyof typeof MARKETPLACE_PREFETCH_STRATEGIES
) {
  return function PrefetchedComponent(props: P) {
    const router = useRouter();

    useEffect(() => {
      // Prefetch related routes based on component type
      switch (prefetchStrategy) {
        case MARKETPLACE_PREFETCH_STRATEGIES.PRODUCT_HOVER:
          // Already handled by global listeners
          break;
        case MARKETPLACE_PREFETCH_STRATEGIES.CATEGORY_NAVIGATION:
          // Prefetch search page when on category pages
          router.prefetch('/search');
          break;
        case MARKETPLACE_PREFETCH_STRATEGIES.SEARCH_TYPEAHEAD:
          // Prefetch category pages when on search
          router.prefetch('/categories');
          break;
      }
    }, [router, prefetchStrategy]);

    return <Component {...props} />;
  };
}

// Search prefetch hook
export function useSearchPrefetch() {
  const { prefetchSearchResults } = useMarketplaceNavigationPrefetch();

  return useCallback((query: string) => {
    prefetchSearchResults(query);
  }, [prefetchSearchResults]);
}

// Pagination prefetch hook
export function usePaginationPrefetch(currentPath: string) {
  const { prefetchNextPage } = useMarketplaceNavigationPrefetch();

  return useCallback((page: number) => {
    prefetchNextPage(currentPath, page);
  }, [prefetchNextPage, currentPath]);
}
