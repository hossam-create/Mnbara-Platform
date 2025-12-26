import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { orderAPI } from '@/services/api/orderAPI'

// Types
interface OrderItem {
  id: string
  productId: string
  title: string
  price: number
  quantity: number
  image: string
  seller: {
    id: string
    name: string
  }
}

interface Order {
  id: string
  orderNumber: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  currency: string
  shippingAddress: {
    name: string
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  billingAddress: {
    name: string
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  paymentMethod: {
    type: string
    last4?: string
  }
  tracking?: {
    number: string
    carrier: string
    url: string
  }
  estimatedDelivery?: string
  createdAt: string
  updatedAt: string
}

interface OrderState {
  orders: Order[]
  currentOrder: Order | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    status?: string
    dateRange?: [string, string]
  }
  isLoading: boolean
  error: string | null
}

const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},
  isLoading: false,
  error: null,
}

// Async thunks
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (params: {
    page?: number
    limit?: number
    status?: string
    dateRange?: [string, string]
  } = {}, { rejectWithValue }) => {
    try {
      const response = await orderAPI.getOrders(params)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders')
    }
  }
)

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await orderAPI.getOrderById(orderId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order')
    }
  }
)

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData: {
    items: Array<{
      productId: string
      quantity: number
      price: number
    }>
    shippingAddress: any
    billingAddress: any
    paymentMethodId: string
  }, { rejectWithValue }) => {
    try {
      const response = await orderAPI.createOrder(orderData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create order')
    }
  }
)

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await orderAPI.cancelOrder(orderId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel order')
    }
  }
)

export const trackOrder = createAsyncThunk(
  'orders/trackOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const response = await orderAPI.trackOrder(orderId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to track order')
    }
  }
)

// Order slice
const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setFilters: (state, action: PayloadAction<Partial<OrderState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = {}
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null
    },
    updateOrderStatus: (state, action: PayloadAction<{ orderId: string; status: Order['status'] }>) => {
      const order = state.orders.find(o => o.id === action.payload.orderId)
      if (order) {
        order.status = action.payload.status
        order.updatedAt = new Date().toISOString()
      }
      if (state.currentOrder?.id === action.payload.orderId) {
        state.currentOrder.status = action.payload.status
        state.currentOrder.updatedAt = new Date().toISOString()
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch orders
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false
        state.orders = action.payload.orders
        state.pagination = action.payload.pagination
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Fetch order by ID
    builder
      .addCase(fetchOrderById.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentOrder = action.payload
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Create order
    builder
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false
        state.orders.unshift(action.payload)
        state.currentOrder = action.payload
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Cancel order
    builder
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const order = state.orders.find(o => o.id === action.payload.id)
        if (order) {
          order.status = action.payload.status
          order.updatedAt = action.payload.updatedAt
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder.status = action.payload.status
          state.currentOrder.updatedAt = action.payload.updatedAt
        }
      })

    // Track order
    builder
      .addCase(trackOrder.fulfilled, (state, action) => {
        const order = state.orders.find(o => o.id === action.payload.id)
        if (order) {
          order.tracking = action.payload.tracking
          order.status = action.payload.status
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder.tracking = action.payload.tracking
          state.currentOrder.status = action.payload.status
        }
      })
  },
})

export const {
  clearError,
  setFilters,
  clearFilters,
  setPage,
  clearCurrentOrder,
  updateOrderStatus,
} = orderSlice.actions

export default orderSlice.reducer