import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { searchAPI } from '@/services/api/searchAPI'

// Types
interface SearchResult {
  id: string
  title: string
  price: number
  image: string
  rating: number
  seller: string
  location: string
  relevanceScore: number
}

interface SearchSuggestion {
  text: string
  type: 'product' | 'category' | 'brand' | 'query'
  count?: number
}

interface SearchState {
  query: string
  results: SearchResult[]
  suggestions: SearchSuggestion[]
  recentSearches: string[]
  trendingSearches: string[]
  filters: {
    category?: string
    priceRange?: [number, number]
    condition?: string[]
    location?: string
    shipping?: boolean
    rating?: number
    sortBy?: 'relevance' | 'price_low' | 'price_high' | 'newest' | 'rating'
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  isLoading: boolean
  isLoadingSuggestions: boolean
  error: string | null
  searchTime: number
  lastSearchQuery: string
}

const initialState: SearchState = {
  query: '',
  results: [],
  suggestions: [],
  recentSearches: [],
  trendingSearches: [],
  filters: {
    sortBy: 'relevance',
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  isLoadingSuggestions: false,
  error: null,
  searchTime: 0,
  lastSearchQuery: '',
}

// Async thunks
export const searchProducts = createAsyncThunk(
  'search/searchProducts',
  async (params: {
    query: string
    page?: number
    filters?: any
  }, { rejectWithValue }) => {
    try {
      const startTime = Date.now()
      const response = await searchAPI.searchProducts(params)
      const searchTime = Date.now() - startTime
      
      return {
        ...response.data,
        searchTime,
        query: params.query,
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Search failed')
    }
  }
)

export const getSearchSuggestions = createAsyncThunk(
  'search/getSuggestions',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await searchAPI.getSuggestions(query)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get suggestions')
    }
  }
)

export const getTrendingSearches = createAsyncThunk(
  'search/getTrendingSearches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await searchAPI.getTrendingSearches()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get trending searches')
    }
  }
)

// Search slice
const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload
    },
    clearQuery: (state) => {
      state.query = ''
      state.results = []
      state.suggestions = []
    },
    setFilters: (state, action: PayloadAction<Partial<SearchState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = { sortBy: 'relevance' }
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload
    },
    addRecentSearch: (state, action: PayloadAction<string>) => {
      const query = action.payload.trim()
      if (query && !state.recentSearches.includes(query)) {
        state.recentSearches.unshift(query)
        // Keep only last 10 searches
        state.recentSearches = state.recentSearches.slice(0, 10)
      }
    },
    removeRecentSearch: (state, action: PayloadAction<string>) => {
      state.recentSearches = state.recentSearches.filter(search => search !== action.payload)
    },
    clearRecentSearches: (state) => {
      state.recentSearches = []
    },
    clearSuggestions: (state) => {
      state.suggestions = []
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Search products
    builder
      .addCase(searchProducts.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.isLoading = false
        state.results = action.payload.results
        state.pagination = action.payload.pagination
        state.searchTime = action.payload.searchTime
        state.lastSearchQuery = action.payload.query
        
        // Add to recent searches
        if (action.payload.query.trim()) {
          const query = action.payload.query.trim()
          if (!state.recentSearches.includes(query)) {
            state.recentSearches.unshift(query)
            state.recentSearches = state.recentSearches.slice(0, 10)
          }
        }
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Get suggestions
    builder
      .addCase(getSearchSuggestions.pending, (state) => {
        state.isLoadingSuggestions = true
      })
      .addCase(getSearchSuggestions.fulfilled, (state, action) => {
        state.isLoadingSuggestions = false
        state.suggestions = action.payload
      })
      .addCase(getSearchSuggestions.rejected, (state) => {
        state.isLoadingSuggestions = false
        state.suggestions = []
      })

    // Get trending searches
    builder
      .addCase(getTrendingSearches.fulfilled, (state, action) => {
        state.trendingSearches = action.payload
      })
  },
})

export const {
  setQuery,
  clearQuery,
  setFilters,
  clearFilters,
  setPage,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  clearSuggestions,
  clearError,
} = searchSlice.actions

export default searchSlice.reducer