import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UserPreferences {
  language: string
  currency: string
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  privacy: {
    showProfile: boolean
    showActivity: boolean
    allowMessages: boolean
  }
}

interface UserState {
  preferences: UserPreferences
  watchlist: string[]
  recentlyViewed: string[]
  savedSearches: Array<{
    id: string
    query: string
    filters: any
    name: string
    createdAt: string
  }>
  addresses: Array<{
    id: string
    type: 'shipping' | 'billing'
    name: string
    street: string
    city: string
    state: string
    zipCode: string
    country: string
    isDefault: boolean
  }>
  paymentMethods: Array<{
    id: string
    type: 'card' | 'paypal' | 'bank'
    last4?: string
    brand?: string
    expiryMonth?: number
    expiryYear?: number
    isDefault: boolean
  }>
}

const initialState: UserState = {
  preferences: {
    language: 'en',
    currency: 'USD',
    timezone: 'UTC',
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    privacy: {
      showProfile: true,
      showActivity: false,
      allowMessages: true,
    },
  },
  watchlist: [],
  recentlyViewed: [],
  savedSearches: [],
  addresses: [],
  paymentMethods: [],
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updatePreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload }
    },
    addToWatchlist: (state, action: PayloadAction<string>) => {
      if (!state.watchlist.includes(action.payload)) {
        state.watchlist.push(action.payload)
      }
    },
    removeFromWatchlist: (state, action: PayloadAction<string>) => {
      state.watchlist = state.watchlist.filter(id => id !== action.payload)
    },
    addToRecentlyViewed: (state, action: PayloadAction<string>) => {
      const productId = action.payload
      // Remove if already exists
      state.recentlyViewed = state.recentlyViewed.filter(id => id !== productId)
      // Add to beginning
      state.recentlyViewed.unshift(productId)
      // Keep only last 20 items
      state.recentlyViewed = state.recentlyViewed.slice(0, 20)
    },
    clearRecentlyViewed: (state) => {
      state.recentlyViewed = []
    },
    addSavedSearch: (state, action: PayloadAction<{
      query: string
      filters: any
      name: string
    }>) => {
      const savedSearch = {
        id: Date.now().toString(),
        ...action.payload,
        createdAt: new Date().toISOString(),
      }
      state.savedSearches.push(savedSearch)
    },
    removeSavedSearch: (state, action: PayloadAction<string>) => {
      state.savedSearches = state.savedSearches.filter(search => search.id !== action.payload)
    },
    addAddress: (state, action: PayloadAction<Omit<UserState['addresses'][0], 'id'>>) => {
      const address = {
        id: Date.now().toString(),
        ...action.payload,
      }
      
      // If this is set as default, remove default from others
      if (address.isDefault) {
        state.addresses.forEach(addr => {
          if (addr.type === address.type) {
            addr.isDefault = false
          }
        })
      }
      
      state.addresses.push(address)
    },
    updateAddress: (state, action: PayloadAction<UserState['addresses'][0]>) => {
      const index = state.addresses.findIndex(addr => addr.id === action.payload.id)
      if (index !== -1) {
        // If this is set as default, remove default from others
        if (action.payload.isDefault) {
          state.addresses.forEach(addr => {
            if (addr.type === action.payload.type && addr.id !== action.payload.id) {
              addr.isDefault = false
            }
          })
        }
        state.addresses[index] = action.payload
      }
    },
    removeAddress: (state, action: PayloadAction<string>) => {
      state.addresses = state.addresses.filter(addr => addr.id !== action.payload)
    },
    addPaymentMethod: (state, action: PayloadAction<Omit<UserState['paymentMethods'][0], 'id'>>) => {
      const paymentMethod = {
        id: Date.now().toString(),
        ...action.payload,
      }
      
      // If this is set as default, remove default from others
      if (paymentMethod.isDefault) {
        state.paymentMethods.forEach(method => {
          method.isDefault = false
        })
      }
      
      state.paymentMethods.push(paymentMethod)
    },
    removePaymentMethod: (state, action: PayloadAction<string>) => {
      state.paymentMethods = state.paymentMethods.filter(method => method.id !== action.payload)
    },
    setDefaultPaymentMethod: (state, action: PayloadAction<string>) => {
      state.paymentMethods.forEach(method => {
        method.isDefault = method.id === action.payload
      })
    },
  },
})

export const {
  updatePreferences,
  addToWatchlist,
  removeFromWatchlist,
  addToRecentlyViewed,
  clearRecentlyViewed,
  addSavedSearch,
  removeSavedSearch,
  addAddress,
  updateAddress,
  removeAddress,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
} = userSlice.actions

export default userSlice.reducer