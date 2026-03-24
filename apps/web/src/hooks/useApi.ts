import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api.service';

// Generic API hook for fetching data
export const useApi = <T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  return { data, loading, error, refetch: fetchData };
};

// Specific hooks for common API calls
export const useProducts = (params?: {
  q?: string;
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
}) => {
  return useApi(
    () => apiService.products.search(params || {}),
    [JSON.stringify(params)]
  );
};

export const useFeaturedProducts = () => {
  return useApi(() => apiService.products.getFeatured());
};

export const useTrendingProducts = () => {
  return useApi(() => apiService.products.getTrending());
};

export const useDeals = () => {
  return useApi(() => apiService.products.getDeals());
};

export const useProduct = (id: string) => {
  return useApi(() => apiService.products.getById(id), [id]);
};

export const useCategories = () => {
  return useApi(() => apiService.categories.getAll());
};

export const useCategoryProducts = (categoryId: string, params?: any) => {
  return useApi(
    () => apiService.categories.getProducts(categoryId, params),
    [categoryId, JSON.stringify(params)]
  );
};

export const useWatchlist = () => {
  return useApi(() => apiService.users.getWatchlist());
};

export const useOrders = () => {
  return useApi(() => apiService.users.getOrders());
};

export const useCart = () => {
  return useApi(() => apiService.cart.get());
};

export const useActiveAuctions = () => {
  return useApi(() => apiService.auctions.getActive());
};

export const useAuction = (id: string) => {
  return useApi(() => apiService.auctions.getById(id), [id]);
};

// Mutation hooks
export const useApiMutation = <T, V = void>(
  apiCall: (variables?: V) => Promise<T>
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const mutate = useCallback(async (variables?: V) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall(variables);
      setData(result);
      return result;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  return { mutate, loading, error, data };
};

// Specific mutation hooks
export const useLogin = () => {
  return useApiMutation(apiService.auth.login);
};

export const useRegister = () => {
  return useApiMutation(apiService.auth.register);
};

export const useAddToWatchlist = () => {
  return useApiMutation((productId: string) => 
    apiService.users.addToWatchlist(productId)
  );
};

export const useRemoveFromWatchlist = () => {
  return useApiMutation((productId: string) => 
    apiService.users.removeFromWatchlist(productId)
  );
};

export const useAddToCart = () => {
  return useApiMutation(({ productId, quantity }: { productId: string; quantity: number }) => 
    apiService.cart.addItem(productId, quantity)
  );
};

export const useUpdateCartItem = () => {
  return useApiMutation(({ itemId, quantity }: { itemId: string; quantity: number }) => 
    apiService.cart.updateItem(itemId, quantity)
  );
};

export const useRemoveFromCart = () => {
  return useApiMutation((itemId: string) => 
    apiService.cart.removeItem(itemId)
  );
};

export const usePlaceBid = () => {
  return useApiMutation(({ auctionId, amount }: { auctionId: string; amount: number }) => 
    apiService.auctions.placeBid(auctionId, amount)
  );
};

export const useCreatePaymentIntent = () => {
  return useApiMutation(apiService.payments.createPaymentIntent);
};
