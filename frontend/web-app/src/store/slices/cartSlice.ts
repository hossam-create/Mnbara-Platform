import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { cartAPI } from '@/services/api/cartAPI'

// Types
interface CartItem {
  id: string
  productId: string
  title: string
  price: number
  image: string
  quantity: number
  seller: {
    id: string
    name: string
  }
  shipping: {
    cost: number
    estimatedDays: number
  }
  selectedVariant?: {
    size?: string
    color?: string
    [key: string]: any
  }
}

interface CartState {
  items: CartItem[]
  totalItems: number
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  currency: string
  isLoading: boolean
  error: string | null
  lastUpdated: number | null
  appliedCoupon?: {
    code: string
    discount: number
    type: 'percentage' | 'fixed'
  }
}

const initialState: CartState = {
  items: [],
  totalItems: 0,
  subtotal: 0,
  shippingCost: 0,
  tax: 0,
  total: 0,
  currency: 'USD',
  isLoading: false,
  error: null,
  lastUpdated: null,
}

// Helper functions
const calculateTotals = (state: CartState) => {
  state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0)
  state.subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  state.shippingCost = state.items.reduce((sum, item) => sum + item.shipping.cost, 0)
  state.tax = state.subtotal * 0.08 // 8% tax rate
  
  let total = state.subtotal + state.shippingCost + state.tax
  
  // Apply coupon discount
  if (state.appliedCoupon) {
    if (state.appliedCoupon.type === 'percentage') {
      total -= (total * state.appliedCoupon.discount / 100)
    } else {
      total -= state.appliedCoupon.discount
    }
  }
  
  state.total = Math.max(0, total)
  state.lastUpdated = Date.now()
}

// Async thunks
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (item: {
    productId: string
    quantity: number
    selectedVariant?: any
  }, { rejectWithValue }) => {
    try {
      const response = await cartAPI.addItem(item)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add item to cart')
    }
  }
)

export const updateCartItem = createAsyncThunk(
  'cart/updateItem',
  async (update: {
    itemId: string
    quantity: number
  }, { rejectWithValue }) => {
    try {
      const response = await cartAPI.updateItem(update.itemId, update.quantity)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update cart item')
    }
  }
)

export const removeFromCart = createAsyncThunk(
  'cart/removeItem',
  async (itemId: string, { rejectWithValue }) => {
    try {
      await cartAPI.removeItem(itemId)
      return itemId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove item from cart')
    }
  }
)

export const applyCoupon = createAsyncThunk(
  'cart/applyCoupon',
  async (couponCode: string, { rejectWithValue }) => {
    try {
      const response = await cartAPI.applyCoupon(couponCode)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Invalid coupon code')
    }
  }
)

export const syncCart = createAsyncThunk(
  'cart/sync',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartAPI.getCart()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to sync cart')
    }
  }
)

// Cart slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCart: (state) => {
      state.items = []
      calculateTotals(state)
    },
    addItemLocal: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(item => 
        item.productId === action.payload.productId &&
        JSON.stringify(item.selectedVariant) === JSON.stringify(action.payload.selectedVariant)
      )
      
      if (existingItem) {
        existingItem.quantity += action.payload.quantity
      } else {
        state.items.push(action.payload)
      }
      
      calculateTotals(state)
    },
    updateItemQuantityLocal: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      const item = state.items.find(item => item.id === action.payload.itemId)
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter(item => item.id !== action.payload.itemId)
        } else {
          item.quantity = action.payload.quantity
        }
        calculateTotals(state)
      }
    },
    removeItemLocal: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload)
      calculateTotals(state)
    },
    removeCoupon: (state) => {
      state.appliedCoupon = undefined
      calculateTotals(state)
    },
  },
  extraReducers: (builder) => {
    // Add to cart
    builder
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false
        const existingItem = state.items.find(item => item.id === action.payload.id)
        if (existingItem) {
          existingItem.quantity = action.payload.quantity
        } else {
          state.items.push(action.payload)
        }
        calculateTotals(state)
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Update cart item
    builder
      .addCase(updateCartItem.fulfilled, (state, action) => {
        const item = state.items.find(item => item.id === action.payload.id)
        if (item) {
          item.quantity = action.payload.quantity
          calculateTotals(state)
        }
      })

    // Remove from cart
    builder
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload)
        calculateTotals(state)
      })

    // Apply coupon
    builder
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.appliedCoupon = action.payload
        calculateTotals(state)
      })

    // Sync cart
    builder
      .addCase(syncCart.fulfilled, (state, action) => {
        state.items = action.payload.items
        state.appliedCoupon = action.payload.appliedCoupon
        calculateTotals(state)
      })
  },
})

export const {
  clearError,
  clearCart,
  addItemLocal,
  updateItemQuantityLocal,
  removeItemLocal,
  removeCoupon,
} = cartSlice.actions

export default cartSlice.reducer