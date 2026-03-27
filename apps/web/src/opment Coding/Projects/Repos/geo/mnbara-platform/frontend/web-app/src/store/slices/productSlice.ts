import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { productAPI } from '@/services/api/productAPI'

// Types
interface Product {
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

interface ProductState {
  products: Product[]
  featuredProducts: Product[]
  recommendedProducts: Product[]
  currentProduct: Product | null
  categories: any[]
  filters: {
    category?: string
    priceRange?: [number, number]
    condition?: string[]
    location?: string
    shipping?: boolean
    rating?: number
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  isLoading: boolean
  error: string | null
  lastFetch: number | null
}

const initialState: ProductState = {
  products: [],
  featuredProducts: [],
  recommendedProducts: [],
  currentProduct: null,
  categories: [],
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  error: null,
  lastFetch: null,
}

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params: {
    page?: number
    limit?: number
    category?: string
    search?: string
    filters?: any
  } = {}, { rejectWithValue }) => {
    try {
      const response = await productAPI.getProducts(params)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products')
    }
  }
)

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await productAPI.getProductById(productId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch product')
    }
  }
)

export const fetchFeaturedProducts = createAsyncThunk(
  'products/fetchFeaturedProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await productAPI.getFeaturedProducts()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch featured products')
    }
  }
)

export const fetchRecommendedProducts = createAsyncThunk(
  'products/fetchRecommendedProducts',
  async (userId?: string, { rejectWithValue }) => {
    try {
      const response = await productAPI.getRecommendedProducts(userId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recommendations')
    }
  }
)

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await productAPI.getCategories()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories')
    }
  }
)

// Product slice
const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setFilters: (state, action: PayloadAction<Partial<ProductState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = {}
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null
    },
    updateProductInList: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex(p => p.id === action.payload.id)
      if (index !== -1) {
        state.products[index] = action.payload
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch products
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false
        state.products = action.payload.products
        state.pagination = action.payload.pagination
        state.lastFetch = Date.now()
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Fetch product by ID
    builder
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentProduct = action.payload
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Fetch featured products
    builder
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.featuredProducts = action.payload
      })

    // Fetch recommended products
    builder
      .addCase(fetchRecommendedProducts.fulfilled, (state, action) => {
        state.recommendedProducts = action.payload
      })

    // Fetch categories
    builder
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload
      })
  },
})

export const {
  clearError,
  setFilters,
  clearFilters,
  setPage,
  clearCurrentProduct,
  updateProductInList,
} = productSlice.actions

export default productSlice.reducer