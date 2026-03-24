// ============================================================
// P2P Exchange - useSecurity Hook
// React Query hook for security deposit and trust level management
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SecurityAPI } from '../api/p2p-exchange';
import type { AddDepositInput } from '../types/p2p-exchange.types';

// ============================================================
// QUERY KEYS
// ============================================================

export const securityKeys = {
  all: ['security'] as const,
  deposit: () => [...securityKeys.all, 'deposit'] as const,
  trustLevel: () => [...securityKeys.all, 'trustLevel'] as const,
  escrowProviders: () => [...securityKeys.all, 'escrowProviders'] as const,
};

// ============================================================
// HOOKS
// ============================================================

/**
 * Get user's security deposit
 */
export function useSecurityDeposit() {
  return useQuery({
    queryKey: securityKeys.deposit(),
    queryFn: () => SecurityAPI.getSecurityDeposit(),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Get user's trust level
 */
export function useTrustLevel() {
  return useQuery({
    queryKey: securityKeys.trustLevel(),
    queryFn: () => SecurityAPI.getTrustLevel(),
    staleTime: 60000, // 1 minute
  });
}

/**
 * Get external escrow providers
 */
export function useExternalEscrowProviders() {
  return useQuery({
    queryKey: securityKeys.escrowProviders(),
    queryFn: () => SecurityAPI.getExternalEscrowProviders(),
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Add to security deposit mutation
 */
export function useAddToSecurityDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddDepositInput) =>
      SecurityAPI.addToSecurityDeposit(data),
    onSuccess: () => {
      // Invalidate security deposit query
      queryClient.invalidateQueries({ queryKey: securityKeys.deposit() });
    },
  });
}

// ============================================================
// COMBINED HOOK
// ============================================================

/**
 * Combined hook for security operations
 */
export function useSecurityOperations() {
  const deposit = useSecurityDeposit();
  const trustLevel = useTrustLevel();
  const escrowProviders = useExternalEscrowProviders();
  const addToDeposit = useAddToSecurityDeposit();

  return {
    // Queries
    deposit,
    trustLevel,
    escrowProviders,
    // Mutations
    addToDeposit,
    // Helpers
    isLoading: deposit.isLoading || trustLevel.isLoading,
    isError: deposit.isError || trustLevel.isError,
  };
}
