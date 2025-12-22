// ============================================
// 📜 useInfiniteScroll Hook - Infinite Scroll
// ============================================

import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  /** Callback when scroll reaches threshold */
  onLoadMore: () => void;
  /** Whether more data is available */
  hasMore: boolean;
  /** Whether currently loading */
  isLoading: boolean;
  /** Threshold in pixels from bottom (default: 200) */
  threshold?: number;
  /** Root element for intersection observer */
  root?: Element | null;
}

/**
 * Hook for implementing infinite scroll pagination
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 200,
  root = null,
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      root,
      rootMargin: `${threshold}px`,
      threshold: 0,
    });

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, root, threshold]);

  return { loadMoreRef };
}

export default useInfiniteScroll;
