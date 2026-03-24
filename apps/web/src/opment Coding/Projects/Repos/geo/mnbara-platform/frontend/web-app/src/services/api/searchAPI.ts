import { api } from './client'

export interface SearchResult {
  id: string
  title: string
  price: number
  image: string
  rating: number
  seller: string
  location: string
  relevanceScore: number
  highlights?: {
    title?: string[]
    description?: string[]
  }
}

export interface SearchSuggestion {
  text: string
  type: 'product' | 'category' | 'brand' | 'query'
  count?: number
  image?: string
}

export interface SearchResponse {
  results: SearchResult[]
  suggestions?: SearchSuggestion[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  facets?: {
    categories: Array<{ name: string; count: number; slug: string }>
    brands: Array<{ name: string; count: number }>
    priceRanges: Array<{ range: string; count: number; min: number; max: number }>
    conditions: Array<{ name: string; count: number }>
    locations: Array<{ name: string; count: number }>
    ratings: Array<{ rating: number; count: number }>
  }
  searchTime: number
  totalResults: number
}

export interface SearchFilters {
  category?: string
  brand?: string
  priceMin?: number
  priceMax?: number
  condition?: string[]
  location?: string
  rating?: number
  shipping?: boolean
  sortBy?: 'relevance' | 'price_low' | 'price_high' | 'newest' | 'rating' | 'popularity' | 'distance'
}

export interface AdvancedSearchParams {
  query: string
  filters?: SearchFilters
  page?: number
  limit?: number
  includeOutOfStock?: boolean
  searchMode?: 'simple' | 'advanced' | 'semantic'
  userLocation?: {
    lat: number
    lng: number
  }
}

export const searchAPI = {
  // Main search function with NLP and semantic search
  searchProducts: (params: AdvancedSearchParams) => {
    const queryParams = new URLSearchParams()
    
    queryParams.append('q', params.query)
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.includeOutOfStock) queryParams.append('includeOutOfStock', 'true')
    if (params.searchMode) queryParams.append('mode', params.searchMode)
    
    // Add user location for distance-based sorting
    if (params.userLocation) {
      queryParams.append('lat', params.userLocation.lat.toString())
      queryParams.append('lng', params.userLocation.lng.toString())
    }
    
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

    return api.get<SearchResponse>(`/search?${queryParams.toString()}`)
  },

  // Get search suggestions with auto-complete
  getSuggestions: (query: string, limit: number = 10) => {
    if (!query.trim()) {
      return Promise.resolve({ data: [] })
    }
    
    return api.get<SearchSuggestion[]>(`/search/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`)
  },

  // Get trending searches
  getTrendingSearches: (limit: number = 10) =>
    api.get<string[]>(`/search/trending?limit=${limit}`),

  // Get popular searches in category
  getPopularSearches: (category?: string, limit: number = 10) => {
    const params = new URLSearchParams({ limit: limit.toString() })
    if (category) params.append('category', category)
    return api.get<string[]>(`/search/popular?${params.toString()}`)
  },

  // Visual search (image-based search)
  visualSearch: (image: File, filters?: SearchFilters) => {
    const formData = new FormData()
    formData.append('image', image)
    
    if (filters) {
      formData.append('filters', JSON.stringify(filters))
    }
    
    return api.post<SearchResponse>('/search/visual', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // Barcode search
  barcodeSearch: (barcode: string) =>
    api.get<SearchResult[]>(`/search/barcode/${barcode}`),

  // Voice search (convert speech to text then search)
  voiceSearch: (audioBlob: Blob, filters?: SearchFilters) => {
    const formData = new FormData()
    formData.append('audio', audioBlob)
    
    if (filters) {
      formData.append('filters', JSON.stringify(filters))
    }
    
    return api.post<{ query: string; results: SearchResponse }>('/search/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // Semantic search (find similar products by meaning)
  semanticSearch: (query: string, filters?: SearchFilters, limit: number = 20) => {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      mode: 'semantic'
    })
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()))
          } else {
            params.append(key, value.toString())
          }
        }
      })
    }

    return api.get<SearchResponse>(`/search/semantic?${params.toString()}`)
  },

  // Search within seller's products
  searchSellerProducts: (sellerId: string, query: string, page: number = 1, limit: number = 20) =>
    api.get<SearchResponse>(`/search/seller/${sellerId}?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),

  // Get search analytics (for sellers/admin)
  getSearchAnalytics: (period: string = '30d') =>
    api.get(`/search/analytics?period=${period}`),

  // Save search query for personalization
  saveSearchQuery: (query: string, filters?: SearchFilters, resultCount?: number) =>
    api.post('/search/save', { query, filters, resultCount }),

  // Get personalized search suggestions based on user history
  getPersonalizedSuggestions: (limit: number = 10) =>
    api.get<SearchSuggestion[]>(`/search/personalized?limit=${limit}`),

  // Search filters and facets
  getSearchFilters: (query?: string) => {
    const params = query ? `?q=${encodeURIComponent(query)}` : ''
    return api.get(`/search/filters${params}`)
  },

  // Advanced filters for power users
  advancedSearch: (params: {
    title?: string
    description?: string
    seller?: string
    brand?: string
    model?: string
    sku?: string
    tags?: string[]
    dateRange?: {
      from: string
      to: string
    }
    priceRange?: {
      min: number
      max: number
    }
    location?: {
      city?: string
      state?: string
      country?: string
      radius?: number // in km
    }
    condition?: string[]
    availability?: 'in_stock' | 'out_of_stock' | 'all'
    shipping?: {
      free?: boolean
      maxDays?: number
    }
    seller_rating?: number
    product_rating?: number
    sortBy?: string
    page?: number
    limit?: number
  }) => {
    return api.post<SearchResponse>('/search/advanced', params)
  },
}