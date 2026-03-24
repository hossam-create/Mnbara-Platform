// React Query hooks for Payouts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payoutApi } from '../api/payoutApi';
import { PayoutFilters } from '../types/payout.types';
import { toast } from 'react-hot-toast';

export const usePayouts = (filters?: PayoutFilters) => {
  return useQuery({
    queryKey: ['payouts', filters],
    queryFn: () => payoutApi.getAllPayouts(filters),
    staleTime: 30000, // 30 seconds
  });
};

export const usePendingPayouts = (filters?: PayoutFilters) => {
  return useQuery({
    queryKey: ['payouts', 'pending', filters],
    queryFn: () => payoutApi.getPendingPayouts(filters),
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const usePayoutDetails = (id: string | null) => {
  return useQuery({
    queryKey: ['payout', id],
    queryFn: () => payoutApi.getPayoutDetails(id!),
    enabled: !!id,
  });
};

export const usePayoutStats = () => {
  return useQuery({
    queryKey: ['payout-stats'],
    queryFn: () => payoutApi.getPayoutStats(),
    staleTime: 60000, // 1 minute
    refetchInterval: 60000,
  });
};

export const useUserWalletHistory = (userId: number | null) => {
  return useQuery({
    queryKey: ['wallet-history', userId],
    queryFn: () => payoutApi.getUserWalletHistory(userId!),
    enabled: !!userId,
  });
};

export const useApprovePayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => payoutApi.approvePayout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      queryClient.invalidateQueries({ queryKey: ['payout-stats'] });
      toast.success('تم الموافقة على طلب السحب بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'فشل في الموافقة على الطلب');
    },
  });
};

export const useRejectPayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      payoutApi.rejectPayout(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      queryClient.invalidateQueries({ queryKey: ['payout-stats'] });
      toast.success('تم رفض طلب السحب');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'فشل في رفض الطلب');
    },
  });
};

export const useMarkAsProcessing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => payoutApi.markAsProcessing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      toast.success('تم تحديث حالة الطلب إلى "قيد المعالجة"');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'فشل في تحديث الحالة');
    },
  });
};

export const useCompletePayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      payoutApi.completePayout(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      queryClient.invalidateQueries({ queryKey: ['payout-stats'] });
      toast.success('تم إتمام السحب بنجاح');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'فشل في إتمام السحب');
    },
  });
};
