// ============================================================
// P2P Exchange - useExchangeRequest Hook
// React Query hook for exchange request management
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExchangeRequestAPI } from '../api/p2p-exchange';
import type {
  CreateExchangeRequestInput,
  UpdateExchangeRequestInput,
} from '../types/p2p-exchange.types';

// ============================================================
// QUERY KEYS
// ============================================================

export const exchangeRequestKeys = {
  all: ['exchangeRequests'] as const,
  lists: () => [...exchangeRequestKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...exchangeRequestKeys.lists(), filters] as const,
  details: () => [...exchangeRequestKeys.all, 'detail'] as const,
  detail: (id: number) => [...exchangeRequestKeys.details(), id] as const,
  stats: () => [...exchangeRequestKeys.all, 'stats'] as const,
};

// ============================================================
// HOOKS
// ============================================================

/**
 * Get exchange request by ID
 */
export function useExchangeRequest(id?: number) {
  return useQuery({
    queryKey: exchangeRequestKeys.detail(id!),
    queryFn: () => ExchangeRequestAPI.getRequest(id!),
    enabled: !!id,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Get user's exchange requests
 */
export function useExchangeRequests(params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: exchangeRequestKeys.list(params || {}),
    queryFn: () => ExchangeRequestAPI.getUserRequests(params),
    staleTime: 10000, // 10 seconds
  });
}

/**
 * Get request statistics
 */
export function useExchangeRequestStats() {
  return useQuery({
    queryKey: exchangeRequestKeys.stats(),
    queryFn: () => ExchangeRequestAPI.getRequestStats(),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Create exchange request mutation
 */
export function useCreateExchangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExchangeRequestInput) =>
      ExchangeRequestAPI.createRequest(data),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: exchangeRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: exchangeRequestKeys.stats() });
    },
  });
}

/**
 * Update exchange request mutation
 */
export function useUpdateExchangeRequest(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateExchangeRequestInput) =>
      ExchangeRequestAPI.updateRequest(id, data),
    onSuccess: () => {
      // Invalidate specific request and lists
      queryClient.invalidateQueries({ queryKey: exchangeRequestKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: exchangeRequestKeys.lists() });
    },
  });
}

/**
 * Cancel exchange request mutation
 */
export function useCancelExchangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ExchangeRequestAPI.cancelRequest(id),
    onSuccess: (_, id) => {
      // Invalidate specific request and lists
      queryClient.invalidateQueries({ queryKey: exchangeRequestKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: exchangeRequestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: exchangeRequestKeys.stats() });
    },
  });
}

// ============================================================
// COMBINED HOOK
// ============================================================

/**
 * Combined hook for exchange request operations
 */
export function useExchangeRequestOperations(id?: number) {
  const request = useExchangeRequest(id);
  const requests = useExchangeRequests();
  const stats = useExchangeRequestStats();
  const createRequest = useCreateExchangeRequest();
  const updateRequest = useUpdateExchangeRequest(id!);
  const cancelRequest = useCancelExchangeRequest();

  return {
    // Queries
    request,
    requests,
    stats,
    // Mutations
    createRequest,
    updateRequest,
    cancelRequest,
    // Helpers
    isLoading: request.isLoading || requests.isLoading,
    isError: request.isError || requests.isError,
  };
}
