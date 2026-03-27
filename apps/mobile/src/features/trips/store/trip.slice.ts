// Trip Redux Slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Trip, TripFilter, CreateTripRequest, UpdateTripRequest } from '../../domain/entities/trip.entity';

interface TripState {
  trips: Trip[];
  selectedTrip: Trip | null;
  loading: boolean;
  error: string | null;
  filters: TripFilter;
  hasMore: boolean;
  page: number;
}

const initialState: TripState = {
  trips: [],
  selectedTrip: null,
  loading: false,
  error: null,
  filters: {},
  hasMore: true,
  page: 1,
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.mnbara.com';

// Async Thunks
export const fetchTrips = createAsyncThunk(
  'trip/fetchTrips',
  async (filter?: TripFilter, { rejectWithValue }) => {
    try {
      const token = ''; // Get from secure storage
      const params = new URLSearchParams();
      if (filter?.originCity) params.append('originCity', filter.originCity);
      if (filter?.destinationCity) params.append('destinationCity', filter.destinationCity);
      if (filter?.dateFrom) params.append('dateFrom', filter.dateFrom);
      if (filter?.dateTo) params.append('dateTo', filter.dateTo);
      
      const response = await fetch(`${API_BASE_URL}/trips?${params.toString()}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch trips');
      return response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch trips');
    }
  }
);

export const fetchTripById = createAsyncThunk(
  'trip/fetchTripById',
  async (id: string, { rejectWithValue }) => {
    try {
      const token = '';
      const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch trip');
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch trip');
    }
  }
);

export const createTrip = createAsyncThunk(
  'trip/createTrip',
  async (request: CreateTripRequest, { rejectWithValue }) => {
    try {
      const token = '';
      const response = await fetch(`${API_BASE_URL}/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error('Failed to create trip');
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create trip');
    }
  }
);

const tripSlice = createSlice({
  name: 'trip',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    setFilters: (state, action: PayloadAction<TripFilter>) => { state.filters = action.payload; },
    selectTrip: (state, action: PayloadAction<string>) => {
      state.selectedTrip = state.trips.find((t) => t.id === action.payload) || null;
    },
    clearSelectedTrip: (state) => { state.selectedTrip = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrips.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.trips = action.payload.data;
        state.hasMore = action.payload.hasMore;
        state.page = action.payload.page;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchTripById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTripById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTrip = action.payload;
      })
      .addCase(fetchTripById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createTrip.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.trips.unshift(action.payload);
      })
      .addCase(createTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setFilters, selectTrip, clearSelectedTrip } = tripSlice.actions;
export default tripSlice.reducer;
