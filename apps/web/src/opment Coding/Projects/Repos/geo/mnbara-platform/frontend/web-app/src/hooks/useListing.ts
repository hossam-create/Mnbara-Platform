/**
 * useListing Hook - منصة منبرة
 * 
 * Custom React hook for listing operations
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listingService } from '../services/listingService';
import type {
  Listing,
  CreateListingInput,
  UpdateListingInput,
  ListingFilters,
} from '../types/listing.types';
import toast from 'react-hot-toast';

export const useListing = () => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ============ QUERIES ============

  /**
   * Get listings with filters
   */
  const useListings = (filters?: ListingFilters) => {
    return useQuery({
      queryKey: ['listings', filters],
      queryFn: () => listingService.getListings(filters),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  /**
   * Get single listing
   */
  const useListingById = (id: number) => {
    return useQuery({
      queryKey: ['listing', id],
      queryFn: () => listingService.getListing(id),
      enabled: !!id,
    });
  };

  /**
   * Get featured listings
   */
  const useFeaturedListings = (limit: number = 10) => {
    return useQuery({
      queryKey: ['listings', 'featured', limit],
      queryFn: () => listingService.getFeaturedListings(limit),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  // ============ MUTATIONS ============

  /**
   * Create listing mutation
   */
  const createListingMutation = useMutation({
    mutationFn: (data: CreateListingInput) => listingService.createListing(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast.success('تم إنشاء الإعلان بنجاح');
      return data;
    },
    onError: (error: Error) => {
      toast.error(`فشل إنشاء الإعلان: ${error.message}`);
      throw error;
    },
  });

  /**
   * Update listing mutation
   */
  const updateListingMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateListingInput }) =>
      listingService.updateListing(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['listing', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast.success('تم تحديث الإعلان بنجاح');
      return data;
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث الإعلان: ${error.message}`);
      throw error;
    },
  });

  /**
   * Delete listing mutation
   */
  const deleteListingMutation = useMutation({
    mutationFn: (id: number) => listingService.deleteListing(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.removeQueries({ queryKey: ['listing', id] });
      toast.success('تم حذف الإعلان بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل حذف الإعلان: ${error.message}`);
      throw error;
    },
  });

  /**
   * Mark as sold mutation
   */
  const markAsSoldMutation = useMutation({
    mutationFn: (id: number) => listingService.markAsSold(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast.success('تم تحديث حالة الإعلان إلى "مباع"');
      return data;
    },
    onError: (error: Error) => {
      toast.error(`فشل تحديث الحالة: ${error.message}`);
      throw error;
    },
  });

  /**
   * Upload images mutation
   */
  const uploadImagesMutation = useMutation({
    mutationFn: ({ listingId, files }: { listingId: number; files: File[] }) =>
      listingService.uploadImages(listingId, files),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['listing', variables.listingId] });
      toast.success('تم رفع الصور بنجاح');
    },
    onError: (error: Error) => {
      toast.error(`فشل رفع الصور: ${error.message}`);
      throw error;
    },
  });

  // ============ HELPER FUNCTIONS ============

  /**
   * Create listing
   */
  const createListing = useCallback(
    async (data: CreateListingInput): Promise<Listing> => {
      return createListingMutation.mutateAsync(data);
    },
    [createListingMutation]
  );

  /**
   * Update listing
   */
  const updateListing = useCallback(
    async (id: number, data: UpdateListingInput): Promise<Listing> => {
      return updateListingMutation.mutateAsync({ id, data });
    },
    [updateListingMutation]
  );

  /**
   * Delete listing
   */
  const deleteListing = useCallback(
    async (id: number): Promise<void> => {
      return deleteListingMutation.mutateAsync(id);
    },
    [deleteListingMutation]
  );

  /**
   * Mark as sold
   */
  const markAsSold = useCallback(
    async (id: number): Promise<Listing> => {
      return markAsSoldMutation.mutateAsync(id);
    },
    [markAsSoldMutation]
  );

  /**
   * Upload images
   */
  const uploadImages = useCallback(
    async (listingId: number, files: File[]): Promise<string[]> => {
      return uploadImagesMutation.mutateAsync({ listingId, files });
    },
    [uploadImagesMutation]
  );

  return {
    // Queries
    useListings,
    useListingById,
    useFeaturedListings,

    // Mutations
    createListing,
    updateListing,
    deleteListing,
    markAsSold,
    uploadImages,

    // States
    isLoading:
      createListingMutation.isPending ||
      updateListingMutation.isPending ||
      deleteListingMutation.isPending ||
      markAsSoldMutation.isPending ||
      uploadImagesMutation.isPending,
    error: error ||
      createListingMutation.error ||
      updateListingMutation.error ||
      deleteListingMutation.error ||
      markAsSoldMutation.error ||
      uploadImagesMutation.error,
  };
};

export default useListing;
