// ============================================
// Redux Store Configuration
// ============================================

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

// Import reducers
import authReducer from '../features/auth/store/auth.slice';
import deliveryReducer from '../features/delivery/store/delivery.slice';
import tripReducer from '../features/trips/store/trip.slice';
import matchingReducer from '../features/matching/store/matching.slice';
import chatReducer from '../features/chat/store/chat.slice';
import walletReducer from '../features/wallet/store/wallet.slice';

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  delivery: deliveryReducer,
  trip: tripReducer,
  matching: matchingReducer,
  chat: chatReducer,
  wallet: walletReducer,
});

// Persist configuration
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth'], // Only persist auth state
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Persistor
export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
