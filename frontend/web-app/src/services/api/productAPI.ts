import { api } from './client'

export interface Product {
  id: string
  title: string
  description: string
  price: number
  originalPrice?: number
  currency: string
  images: string[]
  category: {
    id: string
    name: string
    slug: string
  }
  seller: {
    id: string
    name: string
    rating: number
    avatar?: string
  }
  condition: 'new' | 'used' | 'refurbished'
  location: {
    city: string
    country: string
  }
  shipping: {
    free: boolean
    cost?: number
    estimatedDays: number
  }
  specifications: Record<string, any>
  tags: string[]
  rating: number
  reviewCount: number
  stock: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductsResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters?: {
    categories: Array<{ id: string; name: string; count: number }>
    priceRange: { min: number; max: number }
    conditions: Array<{ value: string; count: number }>
    locations: Array<{ value: string; count: number }>
  }
}

export interface ProductFilters {
  category?: string
  priceMin?: number
  priceMax?: number
  condition?: string[]
  location?: string
  shipping?: boolean
  rating?: number
  sortBy?: 'relevance' | 'price_low' | 'price_high' | 'newest' | 'rating' | 'popularity'
}

export interface CreateProductRequest {
  title: string
  description: string
  price: number
  categoryId: string
  condition: 'new' | 'used' | 'refurbished'
  images: string[]
  specifications?: Record<string, any>
  tags?: string[]
  shipping: {
    free: boolean
    cost?: number
    estimatedDays: number
  }
  stock: number
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  isActive?: boolean
}

export const productAPI = {
  // Get products with filters and pagination
  getProducts: (params: {
    page?: number
    limit?: number
    category?: string
    search?: string
    filters?: ProductFilters
  } = {}) => {
    const queryParams = new URLSearchParams()
    
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.category) queryParams.append('category', params.category)
    if (params.search) queryParams.append('search', params.search)
    
    // Add filters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v.toString()))
          } else {
            queryParams.append(key, value.toString())
          }
        }
      })
    }

    return api.get<ProductsResponse>(`/products?${queryParams.toString()}`)
  },

  // Get single product by ID
  getProductById: (id: string) =>
    api.get<Product>(`/products/${id}`),

  // Get featured products
  getFeaturedProducts: (limit: number = 10) =>
    api.get<Product[]>(`/products/featured?limit=${limit}`),

  // Get recommended products
  getRecommendedProducts: (userId?: string, limit: number = 10) => {
    const params = new URLSearchParams({ limit: limit.toString() })
    if (userId) params.append('userId', userId)
    return api.get<Product[]>(`/products/recommended?${params.toString()}`)
  },

  // Get products by category
  getProductsByCategory: (categorySlug: string, params: {
    page?: number
    limit?: number
    filters?: ProductFilters
  } = {}) => {
    const queryParams = new URLSearchParams()
    
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v.toString()))
          } else {
            queryParams.append(key, value.toString())
          }
        }
      })
    }

    return api.get<ProductsResponse>(`/products/category/${categorySlug}?${queryParams.toString()}`)
  },

  // Get similar products
  getSimilarProducts: (productId: string, limit: number = 8) =>
    api.get<Product[]>(`/products/${productId}/similar?limit=${limit}`),

  // Get product reviews
  getProductReviews: (productId: string, page: number = 1, limit: number = 10) =>
    api.get(`/products/${productId}/reviews?page=${page}&limit=${limit}`),

  // Create product (seller)
  createProduct: (data: CreateProductRequest) =>
    api.post<Product>('/products', data),

  // Update product (seller)
  updateProduct: (id: string, data: UpdateProductRequest) =>
    api.patch<Product>(`/products/${id}`, data),

  // Delete product (seller)
  deleteProduct: (id: string) =>
    api.delete(`/products/${id}`),

  // Upload product images
  uploadProductImages: (files: File[], onProgress?: (progress: number) => void) => {
    const formData = new FormData()
    files.forEach(file => formData.append('images', file))
    
    return api.post<{ urls: string[] }>('/products/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
  },

  // Get categories
  getCategories: () =>
    api.get('/categories'),

  // Get category tree
  getCategoryTree: () =>
    api.get('/categories/tree'),

  // Watchlist operations
  addToWatchlist: (productId: string) =>
    api.post(`/products/${productId}/watchlist`),

  removeFromWatchlist: (productId: string) =>
    api.delete(`/products/${productId}/watchlist`),

  getWatchlist: (page: number = 1, limit: number = 20) =>
    api.get<ProductsResponse>(`/watchlist?page=${page}&limit=${limit}`),

  // Product analytics (seller)
  getProductAnalytics: (productId: string, period: string = '30d') =>
    api.get(`/products/${productId}/analytics?period=${period}`),

  // Bulk operations (seller)
  bulkUpdateProducts: (updates: Array<{ id: string; data: UpdateProductRequest }>) =>
    api.patch('/products/bulk', { updates }),

  bulkDeleteProducts: (productIds: string[]) =>
    api.delete('/products/bulk', { data: { productIds } }),
}