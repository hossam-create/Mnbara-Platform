// Delivery Redux Slice
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import {
  Delivery,
  DeliveryFilter,
  CreateDeliveryRequest,
  UpdateDeliveryRequest,
} from '../../domain/entities/delivery.entity';
import { deliveryRepository } from '../repositories/delivery.repository';

interface DeliveryState {
  deliveries: Delivery[];
  selectedDelivery: Delivery | null;
  loading: boolean;
  error: string | null;
  filters: DeliveryFilter;
  hasMore: boolean;
  page: number;
}

const initialState: DeliveryState = {
  deliveries: [],
  selectedDelivery: null,
  loading: false,
  error: null,
  filters: {},
  hasMore: true,
  page: 1,
};

// Async Thunks
export const fetchDeliveries = createAsyncThunk(
  'delivery/fetchDeliveries',
  async (filter?: DeliveryFilter, { rejectWithValue }) => {
    try {
      const response = await deliveryRepository.getDeliveries(filter);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch deliveries'
      );
    }
  }
);

export const fetchDeliveryById = createAsyncThunk(
  'delivery/fetchDeliveryById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await deliveryRepository.getDeliveryById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch delivery'
      );
    }
  }
);

export const createDelivery = createAsyncThunk(
  'delivery/createDelivery',
  async (request: CreateDeliveryRequest, { rejectWithValue }) => {
    try {
      const response = await deliveryRepository.createDelivery(request);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to create delivery'
      );
    }
  }
);

export const updateDelivery = createAsyncThunk(
  'delivery/updateDelivery',
  async (
    { id, request }: { id: string; request: UpdateDeliveryRequest },
    { rejectWithValue }
  ) => {
    try {
      const response = await deliveryRepository.updateDelivery(id, request);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update delivery'
      );
    }
  }
);

export const cancelDelivery = createAsyncThunk(
  'delivery/cancelDelivery',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await deliveryRepository.cancelDelivery(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to cancel delivery'
      );
    }
  }
);

const deliverySlice = createSlice({
  name: 'delivery',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<DeliveryFilter>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    selectDelivery: (state, action: PayloadAction<string>) => {
      state.selectedDelivery =
        state.deliveries.find((d) => d.id === action.payload) || null;
    },
    clearSelectedDelivery: (state) => {
      state.selectedDelivery = null;
    },
    loadMoreDeliveries: (state) => {
      state.page += 1;
    },
    resetDeliveryState: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch Deliveries
    builder.addCase(fetchDeliveries.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDeliveries.fulfilled, (state, action) => {
      state.loading = false;
      state.deliveries = action.payload.data;
      state.hasMore = action.payload.hasMore;
      state.page = action.payload.page;
    });
    builder.addCase(fetchDeliveries.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Delivery By ID
    builder.addCase(fetchDeliveryById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDeliveryById.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedDelivery = action.payload;
    });
    builder.addCase(fetchDeliveryById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create Delivery
    builder.addCase(createDelivery.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createDelivery.fulfilled, (state, action) => {
      state.loading = false;
      state.deliveries.unshift(action.payload);
    });
    builder.addCase(createDelivery.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update Delivery
    builder.addCase(updateDelivery.fulfilled, (state, action) => {
      const index = state.deliveries.findIndex(
        (d) => d.id === action.payload.id
      );
      if (index !== -1) {
        state.deliveries[index] = action.payload;
      }
      if (state.selectedDelivery?.id === action.payload.id) {
        state.selectedDelivery = action.payload;
      }
    });

    // Cancel Delivery
    builder.addCase(cancelDelivery.fulfilled, (state, action) => {
      const index = state.deliveries.findIndex(
        (d) => d.id === action.payload.id
      );
      if (index !== -1) {
        state.deliveries[index] = action.payload;
      }
      if (state.selectedDelivery?.id === action.payload.id) {
        state.selectedDelivery = action.payload;
      }
    });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  selectDelivery,
  clearSelectedDelivery,
  loadMoreDeliveries,
  resetDeliveryState,
} = deliverySlice.actions;

export default deliverySlice.reducer;
