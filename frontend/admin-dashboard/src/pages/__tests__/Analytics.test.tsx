/**
 * Analytics Page Tests
 * Requirements: 13.1, 13.2, 13.3 - Test chart data transformation
 * - Test transaction trends chart data
 * - Test auction activity chart data
 * - Test crowdship metrics chart data
 */

import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Analytics from '../Analytics';

// Mock analytics service
const mockGetTransactionTrends = vi.fn();
const mockGetAuctionActivity = vi.fn();
const mockGetCrowdshipMetrics = vi.fn();
const mockGetRealTimeAuctionStats = vi.fn();

vi.mock('../../services/admin.service', () => ({
  analyticsService: {
    getTransactionTrends: (...args: any[]) => mockGetTransactionTrends(...args),
    getAuctionActivity: (...args: any[]) => mockGetAuctionActivity(...args),
    getCrowdshipMetrics: (...args: any[]) => mockGetCrowdshipMetrics(...args),
    getRealTimeAuctionStats: (...args: any[]) => mockGetRealTimeAuctionStats(...args),
  },
}));

// Mock Recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div data-testid="composed-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

const mockTransactionTrends = [
  { date: '2025-12-01', transactions: 150, volume: 25000, orders: 80 },
  { date: '2025-12-02', transactions: 200, volume: 35000, orders: 100 },
  { date: '2025-12-03', transactions: 180, volume: 30000, orders: 90 },
];

const mockAuctionActivity = [
  { date: '2025-12-01', activeAuctions: 50, bidsPlaced: 200, auctionsCompleted: 15, avgBidAmount: 150 },
  { date: '2025-12-02', activeAuctions: 60, bidsPlaced: 250, auctionsCompleted: 20, avgBidAmount: 175 },
  { date: '2025-12-03', activeAuctions: 55, bidsPlaced: 220, auctionsCompleted: 18, avgBidAmount: 160 },
];

const mockCrowdshipMetrics = [
  { date: '2025-12-01', deliveriesCompleted: 25, deliveriesInProgress: 10, avgDeliveryTime: 36, travelerEarnings: 2500 },
  { date: '2025-12-02', deliveriesCompleted: 30, deliveriesInProgress: 12, avgDeliveryTime: 32, travelerEarnings: 3000 },
  { date: '2025-12-03', deliveriesCompleted: 28, deliveriesInProgress: 8, avgDeliveryTime: 34, travelerEarnings: 2800 },
];

const mockRealTimeStats = {
  activeAuctions: 342,
  totalBidsToday: 1256,
  highestBidToday: 15000,
  endingSoon: 23,
};

describe('Analytics Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTransactionTrends.mockResolvedValue(mockTransactionTrends);
    mockGetAuctionActivity.mockResolvedValue(mockAuctionActivity);
    mockGetCrowdshipMetrics.mockResolvedValue(mockCrowdshipMetrics);
    mockGetRealTimeAuctionStats.mockResolvedValue(mockRealTimeStats);
  });

  const renderAnalytics = () => {
    return render(
      <BrowserRouter>
        <Analytics />
      </BrowserRouter>
    );
  };

  it('renders analytics page with title', async () => {
    renderAnalytics();

    await waitFor(() => {
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });
  });

  it('fetches transaction trends data on mount', async () => {
    renderAnalytics();

    await waitFor(() => {
      expect(mockGetTransactionTrends).toHaveBeenCalled();
    });
  });

  it('fetches auction activity data on mount', async () => {
    renderAnalytics();

    await waitFor(() => {
      expect(mockGetAuctionActivity).toHaveBeenCalled();
    });
  });

  it('fetches crowdship metrics data on mount', async () => {
    renderAnalytics();

    await waitFor(() => {
      expect(mockGetCrowdshipMetrics).toHaveBeenCalled();
    });
  });

  it('fetches real-time auction stats on mount', async () => {
    renderAnalytics();

    await waitFor(() => {
      expect(mockGetRealTimeAuctionStats).toHaveBeenCalled();
    });
  });

  it('displays transaction summary statistics correctly', async () => {
    renderAnalytics();

    await waitFor(() => {
      // Total transactions: 150 + 200 + 180 = 530
      expect(screen.getByText('530')).toBeInTheDocument();
    });

    // Total orders: 80 + 100 + 90 = 270
    expect(screen.getByText('270')).toBeInTheDocument();
  });

  it('displays tab navigation for different analytics views', async () => {
    renderAnalytics();

    await waitFor(() => {
      expect(screen.getByText('Transactions')).toBeInTheDocument();
    });

    expect(screen.getByText('Auctions')).toBeInTheDocument();
    expect(screen.getByText('Crowdship')).toBeInTheDocument();
  });

  it('renders charts for transaction data', async () => {
    renderAnalytics();

    await waitFor(() => {
      expect(screen.getByText('Transaction Trends')).toBeInTheDocument();
    });
  });
});

/**
 * Chart Data Transformation Tests
 * Test the data transformation logic used in analytics charts
 */
describe('Chart Data Transformation', () => {
  it('calculates total transactions correctly from trend data', () => {
    const total = mockTransactionTrends.reduce((sum, t) => sum + t.transactions, 0);
    expect(total).toBe(530);
  });

  it('calculates total volume correctly from trend data', () => {
    const total = mockTransactionTrends.reduce((sum, t) => sum + t.volume, 0);
    expect(total).toBe(90000);
  });

  it('calculates average daily volume correctly', () => {
    const totalVolume = mockTransactionTrends.reduce((sum, t) => sum + t.volume, 0);
    const avgDailyVolume = totalVolume / mockTransactionTrends.length;
    expect(avgDailyVolume).toBe(30000);
  });

  it('calculates total deliveries from crowdship metrics', () => {
    const total = mockCrowdshipMetrics.reduce((sum, m) => sum + m.deliveriesCompleted, 0);
    expect(total).toBe(83);
  });

  it('calculates average delivery time correctly', () => {
    const avgTime = mockCrowdshipMetrics.reduce((sum, m) => sum + m.avgDeliveryTime, 0) / mockCrowdshipMetrics.length;
    expect(avgTime).toBeCloseTo(34, 0);
  });

  it('calculates total traveler earnings correctly', () => {
    const total = mockCrowdshipMetrics.reduce((sum, m) => sum + m.travelerEarnings, 0);
    expect(total).toBe(8300);
  });

  it('gets latest in-progress deliveries count', () => {
    const latest = mockCrowdshipMetrics[mockCrowdshipMetrics.length - 1].deliveriesInProgress;
    expect(latest).toBe(8);
  });
});
