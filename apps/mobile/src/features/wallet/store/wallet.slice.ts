// Wallet Redux Slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Wallet,
  Transaction,
  TransactionFilter,
  WithdrawalRequest,
  AddPaymentMethodRequest,
  TopUpRequest,
} from '../../domain/entities/wallet.entity';

interface WalletState {
  wallet: Wallet | null;
  transactions: Transaction[];
  paymentMethods: any[];
  loading: boolean;
  error: string | null;
  filters: TransactionFilter;
  hasMore: boolean;
  page: number;
}

const initialState: WalletState = {
  wallet: null,
  transactions: [],
  paymentMethods: [],
  loading: false,
  error: null,
  filters: {},
  hasMore: true,
  page: 1,
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.mnbara.com';

// Async Thunks
export const fetchWallet = createAsyncThunk(
  'wallet/fetchWallet',
  async (_, { rejectWithValue }) => {
    try {
      const token = '';
      const response = await fetch(`${API_BASE_URL}/wallet`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch wallet');
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch wallet');
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'wallet/fetchTransactions',
  async (filter?: TransactionFilter, { rejectWithValue }) => {
    try {
      const token = '';
      const params = new URLSearchParams();
      if (filter?.type?.length) params.append('type', filter.type.join(','));
      
      const response = await fetch(`${API_BASE_URL}/wallet/transactions?${params.toString()}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch transactions');
    }
  }
);

export const withdraw = createAsyncThunk(
  'wallet/withdraw',
  async (request: WithdrawalRequest, { rejectWithValue }) => {
    try {
      const token = '';
      const response = await fetch(`${API_BASE_URL}/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error('Failed to process withdrawal');
      return response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to process withdrawal');
    }
  }
);

export const topUp = createAsyncThunk(
  'wallet/topUp',
  async (request: TopUpRequest, { rejectWithValue }) => {
    try {
      const token = '';
      const response = await fetch(`${API_BASE_URL}/wallet/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error('Failed to process top-up');
      return response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to process top-up');
    }
  }
);

export const addPaymentMethod = createAsyncThunk(
  'wallet/addPaymentMethod',
  async (request: AddPaymentMethodRequest, { rejectWithValue }) => {
    try {
      const token = '';
      const response = await fetch(`${API_BASE_URL}/wallet/payment-methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error('Failed to add payment method');
      return response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add payment method');
    }
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    setFilters: (state, action: PayloadAction<TransactionFilter>) => { state.filters = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWallet.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.wallet = action.payload;
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTransactions.pending, (state) => { state.loading = true; })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.data;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(withdraw.fulfilled, (state, action) => {
        if (state.wallet) {
          state.wallet = action.payload.data;
        }
      })
      .addCase(topUp.fulfilled, (state, action) => {
        if (state.wallet) {
          state.wallet = action.payload.data;
        }
      })
      .addCase(addPaymentMethod.fulfilled, (state, action) => {
        state.paymentMethods.push(action.payload.data);
      });
  },
});

export const { clearError, setFilters } = walletSlice.actions;
export default walletSlice.reducer;
