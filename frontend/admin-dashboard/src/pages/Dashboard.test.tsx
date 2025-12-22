import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { AuthProvider } from '../contexts/AuthContext';
import { vi } from 'vitest';

// Mock Recharts to avoid rendering issues in tests
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => <div style={{ width: 800, height: 800 }}>{children}</div>,
    AreaChart: () => <div>AreaChart</div>,
    BarChart: () => <div>BarChart</div>,
    PieChart: () => <div>PieChart</div>,
    LineChart: () => <div>LineChart</div>,
    ComposedChart: () => <div>ComposedChart</div>,
  };
});

// Mock dayjs relativeTime plugin
vi.mock('dayjs/plugin/relativeTime', () => ({
  default: () => {},
}));

describe('Dashboard Page', () => {
  it('renders dashboard title and KPI cards', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText(/Dashboard Overview/i)).toBeInTheDocument();
    });

    // Check for KPI cards
    expect(screen.getByText(/Gross Merchandise Value/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Users/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Orders/i)).toBeInTheDocument();
    expect(screen.getByText(/Active Auctions/i)).toBeInTheDocument();
  });

  it('renders secondary KPI cards', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Escrow Held/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Crowdship Deliveries/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending Disputes/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending KYC/i)).toBeInTheDocument();
  });

  it('renders pending actions section', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Pending Actions/i)).toBeInTheDocument();
    });
  });
});
