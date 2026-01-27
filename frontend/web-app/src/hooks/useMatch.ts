// ============================================================
// P2P Exchange - useMatch Hook
// React Query hook for match management
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MatchAPI } from '../api/p2p-exchange';
import type { UploadProofInput } from '../types/p2p-exchange.types';

// ============================================================
// QUERY KEYS
// ============================================================

export const matchKeys = {
  all: ['matches'] as const,
  lists: () => [...matchKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...matchKeys.lists(), filters] as const,
  details: () => [...matchKeys.all, 'detail'] as const,
  detail: (id: number) => [...matchKeys.details(), id] as const,
  timeline: (id: number) => [...matchKeys.all, 'timeline', id] as const,
};

// ============================================================
// HOOKS
// ============================================================

/**
 * Get match by ID
 */
export function useMatch(id?: number) {
  return useQuery({
    queryKey: matchKeys.detail(id!),
    queryFn: () => MatchAPI.getMatch(id!),
    enabled: !!id,
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds for status updates
  });
}

/**
 * Get user's matches
 */
export function useMatches(params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: matchKeys.list(params || {}),
    queryFn: () => MatchAPI.getUserMatches(params),
    staleTime: 10000, // 10 seconds
  });
}

/**
 * Get match timeline
 */
export function useMatchTimeline(matchId?: number) {
  return useQuery({
    queryKey: matchKeys.timeline(matchId!),
    queryFn: () => MatchAPI.getMatchTimeline(matchId!),
    enabled: !!matchId,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Initiate payment mutation
 */
export function useInitiatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchId: number) => MatchAPI.initiatePayment(matchId),
    onSuccess: (_, matchId) => {
      // Invalidate match details and timeline
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
      queryClient.invalidateQueries({ queryKey: matchKeys.timeline(matchId) });
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
    },
  });
}

/**
 * Upload proof of payment mutation
 */
export function useUploadProof() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, data }: { matchId: number; data: UploadProofInput }) =>
      MatchAPI.uploadProof(matchId, data),
    onSuccess: (_, { matchId }) => {
      // Invalidate match details and timeline
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
      queryClient.invalidateQueries({ queryKey: matchKeys.timeline(matchId) });
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
    },
  });
}

/**
 * Confirm receipt mutation
 */
export function useConfirmReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchId: number) => MatchAPI.confirmReceipt(matchId),
    onSuccess: (_, matchId) => {
      // Invalidate match details and timeline
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
      queryClient.invalidateQueries({ queryKey: matchKeys.timeline(matchId) });
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
    },
  });
}

/**
 * Cancel match mutation
 */
export function useCancelMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, reason }: { matchId: number; reason: string }) =>
      MatchAPI.cancelMatch(matchId, reason),
    onSuccess: (_, { matchId }) => {
      // Invalidate match details and timeline
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
      queryClient.invalidateQueries({ queryKey: matchKeys.timeline(matchId) });
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
    },
  });
}

/**
 * Dispute match mutation
 */
export function useDisputeMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      matchId,
      data,
    }: {
      matchId: number;
      data: {
        reason: string;
        description: string;
        evidence?: File[];
      };
    }) => MatchAPI.disputeMatch(matchId, data),
    onSuccess: (_, { matchId }) => {
      // Invalidate match details and timeline
      queryClient.invalidateQueries({ queryKey: matchKeys.detail(matchId) });
      queryClient.invalidateQueries({ queryKey: matchKeys.timeline(matchId) });
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() });
    },
  });
}

// ============================================================
// COMBINED HOOK
// ============================================================

/**
 * Combined hook for match operations
 */
export function useMatchOperations(matchId?: number) {
  const match = useMatch(matchId);
  const matches = useMatches();
  const timeline = useMatchTimeline(matchId);
  const initiatePayment = useInitiatePayment();
  const uploadProof = useUploadProof();
  const confirmReceipt = useConfirmReceipt();
  const cancelMatch = useCancelMatch();
  const disputeMatch = useDisputeMatch();

  return {
    // Queries
    match,
    matches,
    timeline,
    // Mutations
    initiatePayment,
    uploadProof,
    confirmReceipt,
    cancelMatch,
    disputeMatch,
    // Helpers
    isLoading: match.isLoading || matches.isLoading,
    isError: match.isError || matches.isError,
  };
}
