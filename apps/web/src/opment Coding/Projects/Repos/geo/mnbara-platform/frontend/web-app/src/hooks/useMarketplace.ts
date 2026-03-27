// ============================================================
// P2P Exchange - useMarketplace Hook
// React Query hook for marketplace browsing and filtering
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MarketplaceAPI } from '../api/p2p-exchange';
import type { MarketplaceFilters } from '../types/p2p-exchange.types';

// ============================================================
// QUERY KEYS
// ============================================================

export const marketplaceKeys = {
  all: ['marketplace'] as const,
  lists: () => [...marketplaceKeys.all, 'list'] as const,
  list: (filters: MarketplaceFilters) => [...marketplaceKeys.lists(), filters] as const,
  stats: () => [...marketplaceKeys.all, 'stats'] as const,
  currencyPairs: () => [...marketplaceKeys.all, 'currencyPairs'] as const,
  bestRates: (from: string, to: string) => [...marketplaceKeys.all, 'bestRates', from, to] as const,
};

// ============================================================
// HOOKS
// ============================================================

/**
 * Browse marketplace with filters
 */
export function useMarketplace(filters?: MarketplaceFilters) {
  return useQuery({
    queryKey: marketplaceKeys.list(filters || {}),
    queryFn: () => MarketplaceAPI.browseMarketplace(filters),
    staleTime: 10000, // 10 seconds
  });
}

/**
 * Get marketplace statistics
 */
export function useMarketplaceStats() {
  return useQuery({
    queryKey: marketplaceKeys.stats(),
    queryFn: () => MarketplaceAPI.getMarketplaceStats(),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Get available currency pairs
 */
export function useCurrencyPairs() {
  return useQuery({
    queryKey: marketplaceKeys.currencyPairs(),
    queryFn: () => MarketplaceAPI.getCurrencyPairs(),
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Get best rates for a currency pair
 */
export function useBestRates(params: {
  fromCurrency: string;
  toCurrency: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: marketplaceKeys.bestRates(params.fromCurrency, params.toCurrency),
    queryFn: () => MarketplaceAPI.getBestRates(params),
    enabled: !!params.fromCurrency && !!params.toCurrency,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Accept marketplace request mutation
 */
export function useAcceptRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: number) => MarketplaceAPI.acceptRequest(requestId),
    onSuccess: () => {
      // Invalidate marketplace lists to refresh data
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.stats() });
    },
  });
}

// ============================================================
// COMBINED HOOK
// ============================================================

/**
 * Combined hook for marketplace operations
 */
export function useMarketplaceOperations(filters?: MarketplaceFilters) {
  const marketplace = useMarketplace(filters);
  const stats = useMarketplaceStats();
  const currencyPairs = useCurrencyPairs();
  const acceptRequest = useAcceptRequest();

  return {
    // Queries
    marketplace,
    stats,
    currencyPairs,
    // Mutations
    acceptRequest,
    // Helpers
    isLoading: marketplace.isLoading || stats.isLoading,
    isError: marketplace.isError || stats.isError,
  };
}
