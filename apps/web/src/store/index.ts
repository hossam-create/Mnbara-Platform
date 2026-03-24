import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from '@reduxjs/toolkit'

// Import slices
import authSlice from './slices/authSlice'
import productSlice from './slices/productSlice'
import cartSlice from './slices/cartSlice'
import searchSlice from './slices/searchSlice'
import userSlice from './slices/userSlice'
import orderSlice from './slices/orderSlice'
import notificationSlice from './slices/notificationSlice'
import uiSlice from './slices/uiSlice'

// Root reducer
const rootReducer = combineReducers({
  auth: authSlice,
  products: productSlice,
  cart: cartSlice,
  search: searchSlice,
  user: userSlice,
  orders: orderSlice,
  notifications: notificationSlice,
  ui: uiSlice,
})

// Persist configuration
const persistConfig = {
  key: 'mnbara-root',
  storage,
  whitelist: ['auth', 'cart', 'user'], // Only persist these slices
  blacklist: ['ui', 'notifications'], // Don't persist UI state
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

// Configure store with eBay-level middleware
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

export const persistor = persistStore(store)

// Types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch