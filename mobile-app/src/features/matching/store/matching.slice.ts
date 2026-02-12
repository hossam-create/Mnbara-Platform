// Matching Redux Slice
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Match,
  MatchFilter,
  AcceptMatchRequest,
} from '../../domain/entities/matching.entity';

interface MatchingState {
  matches: Match[];
  selectedMatch: Match | null;
  suggestedMatches: Match[];
  loading: boolean;
  error: string | null;
  filters: MatchFilter;
  hasMore: boolean;
  page: number;
}

const initialState: MatchingState = {
  matches: [],
  selectedMatch: null,
  suggestedMatches: [],
  loading: false,
  error: null,
  filters: {},
  hasMore: true,
  page: 1,
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.mnbara.com';

// Async Thunks
export const fetchMatches = createAsyncThunk(
  'matching/fetchMatches',
  async (filter?: MatchFilter, { rejectWithValue }) => {
    try {
      const token = '';
      const params = new URLSearchParams();
      if (filter?.status?.length) params.append('status', filter.status.join(','));
      
      const response = await fetch(`${API_BASE_URL}/matches?${params.toString()}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch matches');
      return response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch matches');
    }
  }
);

export const fetchSuggestedMatches = createAsyncThunk(
  'matching/fetchSuggestedMatches',
  async (_, { rejectWithValue }) => {
    try {
      const token = '';
      const response = await fetch(`${API_BASE_URL}/matches/suggested`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to fetch suggested matches');
      return response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch suggested matches');
    }
  }
);

export const acceptMatch = createAsyncThunk(
  'matching/acceptMatch',
  async (request: AcceptMatchRequest, { rejectWithValue }) => {
    try {
      const token = '';
      const response = await fetch(
        `${API_BASE_URL}/matches/${request.matchId}/accept`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ shopperNote: request.shopperNote }),
        }
      );
      
      if (!response.ok) throw new Error('Failed to accept match');
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to accept match');
    }
  }
);

export const declineMatch = createAsyncThunk(
  'matching/declineMatch',
  async (matchId: string, { rejectWithValue }) => {
    try {
      const token = '';
      const response = await fetch(`${API_BASE_URL}/matches/${matchId}/decline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to decline match');
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to decline match');
    }
  }
);

const matchingSlice = createSlice({
  name: 'matching',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null; },
    setFilters: (state, action: PayloadAction<MatchFilter>) => { state.filters = action.payload; },
    selectMatch: (state, action: PayloadAction<string>) => {
      state.selectedMatch = state.matches.find((m) => m.id === action.payload) || null;
    },
    clearSelectedMatch: (state) => { state.selectedMatch = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatches.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.loading = false;
        state.matches = action.payload.data;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchSuggestedMatches.pending, (state) => { state.loading = true; })
      .addCase(fetchSuggestedMatches.fulfilled, (state, action) => {
        state.loading = false;
        state.suggestedMatches = action.payload.data;
      })
      .addCase(fetchSuggestedMatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(acceptMatch.fulfilled, (state, action) => {
        const index = state.matches.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) state.matches[index] = action.payload;
        state.suggestedMatches = state.suggestedMatches.filter(
          (m) => m.id !== action.payload.id
        );
      })
      .addCase(declineMatch.fulfilled, (state, action) => {
        state.matches = state.matches.filter((m) => m.id !== action.payload.id);
        state.suggestedMatches = state.suggestedMatches.filter(
          (m) => m.id !== action.payload.id
        );
      });
  },
});

export const { clearError, setFilters, selectMatch, clearSelectedMatch } = matchingSlice.actions;
export default matchingSlice.reducer;
