// ============================================
// React Query Hooks for Disputes
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disputesApi } from '../api/disputeApi';
import { Dispute, DisputeListResponse, DisputeFilters, AdminDisputeStats } from '../types/dispute.types';

// Query keys
export const disputeKeys = {
  all: ['disputes'] as const,
  my: (filters?: DisputeFilters) => ['disputes', 'my', filters] as const,
  byId: (id: string) => ['disputes', id] as const,
  allAdmin: (filters?: DisputeFilters) => ['disputes', 'admin', 'all', filters] as const,
  adminById: (id: string) => ['disputes', 'admin', id] as const,
  stats: () => ['disputes', 'admin', 'stats'] as const
};

// User hooks
export function useMyDisputes(filters?: DisputeFilters) {
  return useQuery({
    queryKey: disputeKeys.my(filters),
    queryFn: () => disputesApi.getMyDisputes(filters)
  });
}

export function useDispute(disputeId: string) {
  return useQuery({
    queryKey: disputeKeys.byId(disputeId),
    queryFn: () => disputesApi.getById(disputeId),
    enabled: !!disputeId
  });
}

interface CreateDisputeVariables {
  requestId: number;
  reason: string;
  description: string;
  files?: File[];
}

export function useCreateDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: CreateDisputeVariables) =>
      disputesApi.create({
        requestId: variables.requestId,
        reason: variables.reason as any,
        description: variables.description,
        evidenceFiles: variables.files
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disputeKeys.my() });
    }
  });
}

export function useAddEvidence(disputeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (files: File[]) => disputesApi.addEvidence(disputeId, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disputeKeys.byId(disputeId) });
    }
  });
}

// Admin hooks
export function useAllDisputes(filters?: DisputeFilters) {
  return useQuery({
    queryKey: disputeKeys.allAdmin(filters),
    queryFn: () => disputesApi.getAll(filters)
  });
}

export function useAdminDispute(disputeId: string) {
  return useQuery({
    queryKey: disputeKeys.adminById(disputeId),
    queryFn: () => disputesApi.getDetails(disputeId),
    enabled: !!disputeId
  });
}

export function useDisputeStats() {
  return useQuery({
    queryKey: disputeKeys.stats(),
    queryFn: () => disputesApi.getStats()
  });
}

export function useMarkUnderReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (disputeId: string) => disputesApi.markUnderReview(disputeId),
    onSuccess: (_, disputeId) => {
      queryClient.invalidateQueries({ queryKey: disputeKeys.adminById(disputeId) });
      queryClient.invalidateQueries({ queryKey: disputeKeys.stats() });
    }
  });
}

interface ResolveDisputeVariables {
  disputeId: string;
  resolution: string;
  resolutionPercentage?: number;
  adminNotes?: string;
}

export function useResolveDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: ResolveDisputeVariables) =>
      disputesApi.resolve(
        variables.disputeId,
        variables.resolution,
        variables.resolutionPercentage,
        variables.adminNotes
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: disputeKeys.adminById(variables.disputeId) });
      queryClient.invalidateQueries({ queryKey: disputeKeys.stats() });
    }
  });
}

export function useCloseDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (disputeId: string) => disputesApi.close(disputeId),
    onSuccess: (_, disputeId) => {
      queryClient.invalidateQueries({ queryKey: disputeKeys.adminById(disputeId) });
      queryClient.invalidateQueries({ queryKey: disputeKeys.stats() });
    }
  });
}

// Helper hook for dispute status colors
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    OPEN: 'yellow',
    UNDER_REVIEW: 'blue',
    RESOLVED: 'green',
    CLOSED: 'gray'
  };
  return colors[status] || 'gray';
}

// Helper hook for dispute reason labels
export function getReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    NOT_DELIVERED: 'Not Delivered',
    WRONG_ITEM: 'Wrong Item',
    DAMAGED: 'Damaged',
    OTHER: 'Other'
  };
  return labels[reason] || reason;
}

// Helper hook for resolution labels
export function getResolutionLabel(resolution: string): string {
  const labels: Record<string, string> = {
    REFUND_BUYER: 'Refund to Buyer',
    RELEASE_TO_SELLER: 'Release to Seller',
    PARTIAL_REFUND: 'Partial Refund'
  };
  return labels[resolution] || resolution;
}
