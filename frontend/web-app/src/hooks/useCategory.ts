/**
 * useCategory Hook - منصة منبرة
 * 
 * Custom React hook for category operations
 */

import { useQuery } from '@tanstack/react-query';
import { listingService } from '../services/listingService';

export const useCategory = () => {
  /**
   * Get all categories
   */
  const useCategories = (params?: { level?: number; parentId?: number }) => {
    return useQuery({
      queryKey: ['categories', params],
      queryFn: () => listingService.getCategories(params),
      staleTime: 30 * 60 * 1000, // 30 minutes (categories don't change often)
    });
  };

  /**
   * Get category tree
   */
  const useCategoryTree = () => {
    return useQuery({
      queryKey: ['categories', 'tree'],
      queryFn: () => listingService.getCategoryTree(),
      staleTime: 30 * 60 * 1000,
    });
  };

  /**
   * Get popular categories
   */
  const usePopularCategories = () => {
    return useQuery({
      queryKey: ['categories', 'popular'],
      queryFn: () => listingService.getPopularCategories(),
      staleTime: 15 * 60 * 1000, // 15 minutes
    });
  };

  /**
   * Get single category
   */
  const useCategoryById = (id: number) => {
    return useQuery({
      queryKey: ['category', id],
      queryFn: () => listingService.getCategory(id),
      enabled: !!id,
      staleTime: 30 * 60 * 1000,
    });
  };

  /**
   * Get category path (breadcrumb)
   */
  const useCategoryPath = (id: number) => {
    return useQuery({
      queryKey: ['category', id, 'path'],
      queryFn: () => listingService.getCategoryPath(id),
      enabled: !!id,
      staleTime: 30 * 60 * 1000,
    });
  };

  /**
   * Get category statistics
   */
  const useCategoryStats = (id: number) => {
    return useQuery({
      queryKey: ['category', id, 'stats'],
      queryFn: () => listingService.getCategoryStats(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000, // 5 minutes (stats change more frequently)
    });
  };

  /**
   * Search categories
   */
  const useSearchCategories = (query: string) => {
    return useQuery({
      queryKey: ['categories', 'search', query],
      queryFn: () => listingService.searchCategories(query),
      enabled: query.length > 0,
      staleTime: 10 * 60 * 1000,
    });
  };

  return {
    useCategories,
    useCategoryTree,
    usePopularCategories,
    useCategoryById,
    useCategoryPath,
    useCategoryStats,
    useSearchCategories,
  };
};

export default useCategory;
