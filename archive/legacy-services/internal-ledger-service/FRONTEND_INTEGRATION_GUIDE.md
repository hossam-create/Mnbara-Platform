# Financial Dashboard - Frontend Integration Guide

## Quick Start for Frontend Developers

This guide helps you integrate the Financial Dashboard backend APIs into the React frontend.

## Backend Status

✅ **All backend APIs are ready and tested**

Base URL: `http://localhost:3010/api/admin/financial`

## API Endpoints Reference

### 1. Complete Dashboard Data
```typescript
GET /api/admin/financial/overview
```
Returns everything in one call (recommended for initial load).

### 2. Individual Endpoints

#### Metrics Only
```typescript
GET /api/admin/financial/metrics
```

#### Charts
```typescript
GET /api/admin/financial/charts/daily-volume
GET /api/admin/financial/charts/fees-by-category
GET /api/admin/financial/charts/payouts-by-status
```

#### Detailed Data (Paginated)
```typescript
GET /api/admin/financial/escrow-holds?page=1&pageSize=20&status=HELD&startDate=2026-01-01
GET /api/admin/financial/transactions?page=1&pageSize=20&status=COMPLETED
GET /api/admin/financial/pending-payouts?page=1&pageSize=20
```

## Step-by-Step Frontend Implementation

### Step 1: Copy Types

Create `frontend/web-app/src/types/financial.types.ts`:

```typescript
// Copy from backend/services/internal-ledger-service/src/types/financial-dashboard.types.ts
// Or use these simplified versions:

export interface FinancialMetrics {
  totalEscrowHeld: number;
  pendingPayoutsAmount: number;
  platformRevenue: number;
  todayTransactions: {
    count: number;
    value: number;
  };
}

export interface DailyVolume {
  date: string;
  count: number;
  value: number;
}

export interface FeeCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface PayoutStatus {
  status: string;
  count: number;
  amount: number;
}

export interface EscrowHold {
  id: number;
  requestId: number;
  buyerId: number;
  buyerName: string;
  sellerId: number;
  sellerName: string;
  amount: number;
  fee: number;
  status: string;
  heldDate: Date;
  expectedReleaseDate: Date;
}

export interface Transaction {
  id: number;
  userId: number;
  userName: string;
  type: string;
  amount: number;
  status: string;
  timestamp: Date;
  description?: string;
}

export interface PendingPayout {
  id: number;
  userId: number;
  userName: string;
  amount: number;
  requestedDate: Date;
  status: string;
}
```

### Step 2: Create API Client

Create `frontend/web-app/src/api/financialApi.ts`:

```typescript
import axios from 'axios';

const BASE_URL = '/api/admin/financial';

export const financialApi = {
  // Get complete dashboard
  getDashboard: () => 
    axios.get(`${BASE_URL}/overview`),

  // Get metrics only
  getMetrics: () => 
    axios.get(`${BASE_URL}/metrics`),

  // Get chart data
  getDailyVolume: () => 
    axios.get(`${BASE_URL}/charts/daily-volume`),
  
  getFeesByCategory: () => 
    axios.get(`${BASE_URL}/charts/fees-by-category`),
  
  getPayoutsByStatus: () => 
    axios.get(`${BASE_URL}/charts/payouts-by-status`),

  // Get detailed data with pagination
  getEscrowHolds: (params: {
    page?: number;
    pageSize?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => 
    axios.get(`${BASE_URL}/escrow-holds`, { params }),

  getTransactions: (params: {
    page?: number;
    pageSize?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => 
    axios.get(`${BASE_URL}/transactions`, { params }),

  getPendingPayouts: (params: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
  }) => 
    axios.get(`${BASE_URL}/pending-payouts`, { params }),
};
```

### Step 3: Create React Query Hooks

Create `frontend/web-app/src/hooks/useFinancialDashboard.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { financialApi } from '../api/financialApi';

// Complete dashboard (use for initial load)
export const useFinancialDashboard = () => {
  return useQuery({
    queryKey: ['financial-dashboard'],
    queryFn: async () => {
      const response = await financialApi.getDashboard();
      return response.data.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

// Metrics only (use for real-time updates)
export const useFinancialMetrics = () => {
  return useQuery({
    queryKey: ['financial-metrics'],
    queryFn: async () => {
      const response = await financialApi.getMetrics();
      return response.data.data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });
};

// Chart data
export const useDailyVolume = () => {
  return useQuery({
    queryKey: ['daily-volume'],
    queryFn: async () => {
      const response = await financialApi.getDailyVolume();
      return response.data.data;
    },
  });
};

export const useFeesByCategory = () => {
  return useQuery({
    queryKey: ['fees-by-category'],
    queryFn: async () => {
      const response = await financialApi.getFeesByCategory();
      return response.data.data;
    },
  });
};

export const usePayoutsByStatus = () => {
  return useQuery({
    queryKey: ['payouts-by-status'],
    queryFn: async () => {
      const response = await financialApi.getPayoutsByStatus();
      return response.data.data;
    },
  });
};

// Paginated data
export const useEscrowHolds = (filters: any) => {
  return useQuery({
    queryKey: ['escrow-holds', filters],
    queryFn: async () => {
      const response = await financialApi.getEscrowHolds(filters);
      return response.data.data;
    },
  });
};

export const useTransactions = (filters: any) => {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const response = await financialApi.getTransactions(filters);
      return response.data.data;
    },
  });
};

export const usePendingPayouts = (filters: any) => {
  return useQuery({
    queryKey: ['pending-payouts', filters],
    queryFn: async () => {
      const response = await financialApi.getPendingPayouts(filters);
      return response.data.data;
    },
  });
};
```

### Step 4: Create Components

#### 4.1 Metric Cards Component

Create `frontend/web-app/src/components/admin/FinancialOverviewCards.tsx`:

```typescript
import React from 'react';
import { FinancialMetrics } from '../../types/financial.types';

interface Props {
  metrics: FinancialMetrics;
  loading?: boolean;
}

export const FinancialOverviewCards: React.FC<Props> = ({ metrics, loading }) => {
  if (loading) {
    return <div>Loading metrics...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Escrow Held */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Total Escrow Held</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">
          ${metrics.totalEscrowHeld.toLocaleString()}
        </p>
      </div>

      {/* Pending Payouts */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Pending Payouts</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">
          ${metrics.pendingPayoutsAmount.toLocaleString()}
        </p>
      </div>

      {/* Platform Revenue */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Platform Revenue</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">
          ${metrics.platformRevenue.toLocaleString()}
        </p>
      </div>

      {/* Today's Transactions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Today's Transactions</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">
          {metrics.todayTransactions.count}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          ${metrics.todayTransactions.value.toLocaleString()}
        </p>
      </div>
    </div>
  );
};
```

#### 4.2 Daily Volume Chart

Create `frontend/web-app/src/components/admin/DailyVolumeChart.tsx`:

```typescript
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DailyVolume } from '../../types/financial.types';

interface Props {
  data: DailyVolume[];
}

export const DailyVolumeChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Daily Transaction Volume (Last 30 Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="count" stroke="#8884d8" name="Count" />
          <Line yAxisId="right" type="monotone" dataKey="value" stroke="#82ca9d" name="Value ($)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
```

#### 4.3 Main Dashboard Component

Create `frontend/web-app/src/components/admin/FinancialDashboard.tsx`:

```typescript
import React from 'react';
import { useFinancialDashboard } from '../../hooks/useFinancialDashboard';
import { FinancialOverviewCards } from './FinancialOverviewCards';
import { DailyVolumeChart } from './DailyVolumeChart';
// Import other components...

export const FinancialDashboard: React.FC = () => {
  const { data, isLoading, error } = useFinancialDashboard();

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div>Error loading dashboard</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Financial Overview</h1>

      {/* Metrics Cards */}
      <FinancialOverviewCards metrics={data.metrics} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyVolumeChart data={data.charts.dailyVolume} />
        {/* Add other charts */}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-6">
        {/* Add tables for escrow holds, transactions, pending payouts */}
      </div>
    </div>
  );
};
```

### Step 5: Add Route

In your router configuration:

```typescript
import { FinancialDashboard } from './components/admin/FinancialDashboard';

// Add route
<Route path="/admin/financial" element={<FinancialDashboard />} />
```

## Component Checklist

Create these components following the patterns above:

- [x] `FinancialOverviewCards.tsx` - 4 metric cards
- [x] `DailyVolumeChart.tsx` - Line chart
- [ ] `FeesByCategoryChart.tsx` - Pie chart
- [ ] `PayoutsByStatusChart.tsx` - Bar chart
- [ ] `EscrowHoldsTable.tsx` - Paginated table
- [ ] `RecentTransactionsTable.tsx` - Paginated table
- [ ] `PendingPayoutsTable.tsx` - Paginated table
- [ ] `FinancialFilters.tsx` - Date range and status filters
- [x] `FinancialDashboard.tsx` - Main page

## Styling Tips

Use Tailwind CSS classes:

```typescript
// Card
className="bg-white p-6 rounded-lg shadow"

// Metric value
className="text-3xl font-bold text-gray-900"

// Chart container
className="bg-white p-6 rounded-lg shadow"

// Table
className="min-w-full divide-y divide-gray-200"

// Button
className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
```

## Real-Time Updates

For real-time updates, use React Query's `refetchInterval`:

```typescript
useQuery({
  queryKey: ['financial-metrics'],
  queryFn: fetchMetrics,
  refetchInterval: 30000, // 30 seconds
});
```

## Error Handling

```typescript
const { data, isLoading, error } = useFinancialDashboard();

if (error) {
  return (
    <div className="p-4 bg-red-50 text-red-800 rounded">
      Failed to load dashboard. Please try again.
    </div>
  );
}
```

## Loading States

```typescript
if (isLoading) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
```

## Testing the Backend

Before starting frontend work, test the backend:

```bash
# Start the service
cd backend/services/internal-ledger-service
npm run dev

# Test endpoints (use Postman or curl)
curl http://localhost:3010/api/admin/financial/overview \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Dependencies

Install these if not already present:

```bash
npm install @tanstack/react-query recharts
npm install -D @types/recharts
```

## Reference Implementation

Look at the existing Payout Dashboard for patterns:
- `frontend/web-app/src/components/admin/PayoutDashboard.tsx`
- `frontend/web-app/src/hooks/usePayouts.ts`
- `frontend/web-app/src/api/payoutApi.ts`

## Support

If you encounter issues:
1. Check backend logs: `backend/services/internal-ledger-service/logs`
2. Verify authentication token is valid
3. Check network tab in browser DevTools
4. Review backend documentation: `FINANCIAL_DASHBOARD_BACKEND_COMPLETE.md`

## Summary

✅ Backend is ready
✅ All APIs tested
✅ Types defined
✅ Integration guide provided

Follow the steps above to build the frontend dashboard. Start with the main dashboard component and metric cards, then add charts and tables incrementally.
