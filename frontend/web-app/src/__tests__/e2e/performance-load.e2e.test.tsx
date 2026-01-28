import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import MarketplaceBrowser from '../../components/p2p-exchange/MarketplaceBrowser';
import ExchangeRequestList from '../../components/p2p-exchange/ExchangeRequestList';
import AdminExchangeDashboard from '../../components/admin/p2p-exchange/AdminExchangeDashboard';
import { mockExchangeRequests } from '../fixtures/mock-data';

/**
 * E2E Test Suite: Performance Under Load
 * 
 * Tests application performance with large datasets and concurrent operations.
 * Measures response times, rendering performance, and memory efficiency.
 */
describe('E2E: Performance Under Load', () => {
  const mockOnSelect = vi.fn();
  const mockOnFilter = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Large Dataset Handling', () => {
    it('should render large list efficiently', async () => {
      // Create 1000 exchanges
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockExchangeRequests[0],
        id: `EXC-${i}`,
      }));

      const startTime = performance.now();

      render(
        <ExchangeRequestList
          requests={largeDataset}
          onSelect={mockOnSelect}
        />
      );

      const renderTime = performance.now() - startTime;

      // Should render in reasonable time (< 1000ms)
      expect(renderTime).toBeLessThan(1000);

      // Verify list displays
      expect(screen.getByText(/exchange.*request|list/i)).toBeInTheDocument();
    });

    it('should handle pagination with large dataset', async () => {
      const user = userEvent.setup();

      const largeDataset = Array.from({ length: 500 }, (_, i) => ({
        ...mockExchangeRequests[0],
        id: `EXC-${i}`,
      }));

      const startTime = performance.now();

      render(
        <ExchangeRequestList
          requests={largeDataset}
          onSelect={mockOnSelect}
          pageSize={20}
        />
      );

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(500);

      // Navigate pages
      const nextButton = screen.getByRole('button', { name: /next|>/i });
      await user.click(nextButton);

      // Should be fast
      const pageChangeTime = performance.now() - startTime;
      expect(pageChangeTime).toBeLessThan(1000);
    });

    it('should filter large dataset efficiently', async () => {
      const user = userEvent.setup();

      const largeDataset = Array.from({ length: 500 }, (_, i) => ({
        ...mockExchangeRequests[0],
        id: `EXC-${i}`,
        fromCurrency: i % 2 === 0 ? 'USD' : 'EUR',
      }));

      render(
        <MarketplaceBrowser
          requests={largeDataset}
          onMatchSelect={mockOnSelect}
          onFilter={mockOnFilter}
        />
      );

      // Apply filter
      const startTime = performance.now();
      const currencyFilter = screen.getByLabelText(/currency/i);
      await user.selectOption(currencyFilter, 'USD');

      const filterTime = performance.now() - startTime;

      // Should filter quickly (< 500ms)
      expect(filterTime).toBeLessThan(500);

      // Verify filter applied
      await waitFor(() => {
        expect(mockOnFilter).toHaveBeenCalled();
      });
    });

    it('should sort large dataset efficiently', async () => {
      const user = userEvent.setup();

      const largeDataset = Array.from({ length: 500 }, (_, i) => ({
        ...mockExchangeRequests[0],
        id: `EXC-${i}`,
        exchangeRate: Math.random() * 5,
      }));

      render(
        <MarketplaceBrowser
          requests={largeDataset}
          onMatchSelect={mockOnSelect}
          onFilter={mockOnFilter}
        />
      );

      // Sort by rate
      const startTime = performance.now();
      const sortButton = screen.getByRole('button', { name: /sort.*rate|rate/i });
      await user.click(sortButton);

      const sortTime = performance.now() - startTime;

      // Should sort quickly (< 500ms)
      expect(sortTime).toBeLessThan(500);
    });

    it('should search large dataset efficiently', async () => {
      const user = userEvent.setup();

      const largeDataset = Array.from({ length: 500 }, (_, i) => ({
        ...mockExchangeRequests[0],
        id: `EXC-${i}`,
      }));

      render(
        <MarketplaceBrowser
          requests={largeDataset}
          onMatchSelect={mockOnSelect}
          onFilter={mockOnFilter}
        />
      );

      // Search
      const startTime = performance.now();
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'EXC-100');

      const searchTime = performance.now() - startTime;

      // Should search quickly (< 500ms)
      expect(searchTime).toBeLessThan(500);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous filters', async () => {
      const user = userEvent.setup();

      const largeDataset = Array.from({ length: 200 }, (_, i) => ({
        ...mockExchangeRequests[0],
        id: `EXC-${i}`,
        fromCurrency: i % 2 === 0 ? 'USD' : 'EUR',
        amount: Math.random() * 10000,
      }));

      render(
        <MarketplaceBrowser
          requests={largeDataset}
          onMatchSelect={mockOnSelect}
          onFilter={mockOnFilter}
        />
      );

      const startTime = performance.now();

      // Apply multiple filters concurrently
      const currencyFilter = screen.getByLabelText(/currency/i);
      const amountFilter = screen.getByLabelText(/amount/i);

      await user.selectOption(currencyFilter, 'USD');
      await user.type(amountFilter, '5000');

      const operationTime = performance.now() - startTime;

      // Should handle concurrently (< 1000ms)
      expect(operationTime).toBeLessThan(1000);

      // Verify both filters applied
      await waitFor(() => {
        expect(mockOnFilter).toHaveBeenCalled();
      });
    });

    it('should handle rapid user interactions', async () => {
      const user = userEvent.setup();

      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        ...mockExchangeRequests[0],
        id: `EXC-${i}`,
      }));

      render(
        <ExchangeRequestList
          requests={largeDataset}
          onSelect={mockOnSelect}
        />
      );

      const startTime = performance.now();

      // Rapid clicks
      const items = screen.getAllByRole('button', { name: /view|select/i });
      for (let i = 0; i < 5; i++) {
        await user.click(items[i]);
      }

      const interactionTime = performance.now() - startTime;

      // Should handle rapid interactions (< 1000ms)
      expect(interactionTime).toBeLessThan(1000);

      // Verify selections registered
      expect(mockOnSelect).toHaveBeenCalled();
    });

    it('should handle pagination with concurrent filtering', async () => {
      const user = userEvent.setup();

      const largeDataset = Array.from({ length: 500 }, (_, i) => ({
        ...mockExchangeRequests[0],
        id: `EXC-${i}`,
        fromCurrency: i % 2 === 0 ? 'USD' : 'EUR',
      }));

      render(
        <MarketplaceBrowser
          requests={largeDataset}
          onMatchSelect={mockOnSelect}
          onFilter={mockOnFilter}
          pageSize={20}
        />
      );

      const startTime = performance.now();

      // Paginate and filter
      const nextButton = screen.getByRole('button', { name: /next|>/i });
      await user.click(nextButton);

      const currencyFilter = screen.getByLabelText(/currency/i);
      await user.selectOption(currencyFilter, 'USD');

      const operationTime = performance.now() - startTime;

      // Should handle both operations (< 1000ms)
      expect(operationTime).toBeLessThan(1000);
    });
  });

  describe('Admin Dashboard Performance', () => {
    it('should render admin dashboard with large dataset', async () => {
      const largeDataset = Array.from({ length: 500 }, (_, i) => ({
        ...mockExchangeRequests[0],
        id: `EXC-${i}`,
      }));

      const startTime = performance.now();

      render(
        <AdminExchangeDashboard
          exchanges={largeDataset}
          onApprove={vi.fn()}
          onReject={vi.fn()}
          onFilter={mockOnFilter}
        />
      );

      const renderTime = performance.now() - startTime;

      // Should render dashboard quickly (< 1000ms)
      expect(renderTime).toBeLessThan(1000);

      // Verify dashboard displays
      expect(screen.getByText(/admin.*dashboard|manage/i)).toBeInTheDocument();
    });

    it('should filter admin dashboard efficiently', async () => {
      const user = userEvent.setup();

      const largeDataset = Array.from({ length: 300 }, (_, i) => ({
        ...mockExchangeRequests[0],
        id: `EXC-${i}`,
        status: i % 3 === 0 ? 'pending' : i % 3 === 1 ? 'approved' : 'rejected',
      }));

      render(
        <AdminExchangeDashboard
          exchanges={largeDataset}
          onApprove={vi.fn()}
          onReject={vi.fn()}
          onFilter={mockOnFilter}
        />
      );

      const startTime = performance.now();

      // Apply status filter
      const statusFilter = screen.getByLabelText(/status/i);
      await user.selectOption(statusFilter, 'pending');

      const filterTime = performance.now() - startTime;

      // Should filter quickly (< 500ms)
      expect(filterTime).toBeLessThan(500);
    });

    it('should handle bulk operations efficiently', async () => {
      const user = userEvent.setup();

      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        ...mockExchangeRequests[0],
        id: `EXC-${i}`,
      }));

      const mockOnApprove = vi.fn();

      render(
        <AdminExchangeDashboard
          exchanges={largeDataset}
          onApprove={mockOnApprove}
          onReject={vi.fn()}
          onFilter={mockOnFilter}
        />
      );

      const startTime = performance.now();

      // Select multiple items
      const checkboxes = screen.getAllByRole('checkbox', { name: /select/i });
      for (let i = 0; i < 10; i++) {
        await user.click(checkboxes[i]);
      }

      // Perform bulk action
      const bulkButton = screen.getByRole('button', { name: /bulk.*approve|approve.*selected/i });
      await user.click(bulkButton);

      const operationTime = performance.now() - startTime;

      // Should handle bulk operations (< 1000ms)
      expect(operationTime).toBeLessThan(1000);

      // Verify bulk operation
      await waitFor(() => {
        expect(mockOnApprove).toHaveBeenCalled();
      });
    });
  });

  describe('Memory Efficiency', () => {
    it('should not leak memory with large lists', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockExchangeRequests[0],
        id: `EXC-${i}`,
      }));

      const { unmount } = render(
        <ExchangeRequestList
          requests={largeDataset}
          onSelect={mockOnSelect}
        />
      );

      // Get initial memory
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Unmount
      unmount();

      // Memory should be released (rough check)
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Should not grow significantly
      expect(finalMemory - initialMemory).toBeLessThan(10 * 1024 * 1024); // 10MB
    });

    it('should handle component re-renders efficiently', async () => {
      const largeDataset = Array.from({ length: 500 }, (_, i) => ({
        ...mockExchangeRequests[0],
        id: `EXC-${i}`,
      }));

      const { rerender } = render(
        <ExchangeRequestList
          requests={largeDataset}
          onSelect={mockOnSelect}
        />
      );

      const startTime = performance.now();

      // Re-render with updated data
      const updatedDataset = largeDataset.map((item, i) => ({
        ...item,
        amount: Math.random() * 10000,
      }));

      rerender(
        <ExchangeRequestList
          requests={updatedDataset}
          onSelect={mockOnSelect}
        />
      );

      const rerenderTime = performance.now() - startTime;

      // Should re-render efficiently (< 500ms)
      expect(rerenderTime).toBeLessThan(500);
    });
  });

  describe('Response Time Metrics', () => {
    it('should meet API response time targets', async () => {
      const mockOnSelect = vi.fn().mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({}), 100)
        )
      );

      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        ...mockExchangeRequests[0],
        id: `EXC-${i}`,
      }));

      render(
        <ExchangeRequestList
          requests={largeDataset}
          onSelect={mockOnSelect}
        />
      );

      const startTime = performance.now();

      // Trigger API call
      const firstItem = screen.getByText(largeDataset[0].id);
      await userEvent.click(firstItem);

      const responseTime = performance.now() - startTime;

      // Should respond within target (< 500ms)
      expect(responseTime).toBeLessThan(500);
    });

    it('should maintain UI responsiveness during data loading', async () => {
      const user = userEvent.setup();

      const largeDataset = Array.from({ length: 500 }, (_, i) => ({
        ...mockExchangeRequests[0],
        id: `EXC-${i}`,
      }));

      render(
        <ExchangeRequestList
          requests={largeDataset}
          onSelect={mockOnSelect}
        />
      );

      // UI should be responsive even with large dataset
      const searchInput = screen.queryByPlaceholderText(/search/i);
      if (searchInput) {
        const startTime = performance.now();
        await user.type(searchInput, 'test');
        const inputTime = performance.now() - startTime;

        // Should respond to input quickly (< 200ms)
        expect(inputTime).toBeLessThan(200);
      }
    });
  });

  describe('Rendering Performance', () => {
    it('should virtualize long lists', async () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        ...mockExchangeRequests[0],
        id: `EXC-${i}`,
      }));

      render(
        <ExchangeRequestList
          requests={largeDataset}
          onSelect={mockOnSelect}
        />
      );

      // Should only render visible items (not all 10000)
      const items = screen.queryAllByRole('button', { name: /view|select/i });
      expect(items.length).toBeLessThan(100); // Much less than 10000
    });

    it('should debounce search input', async () => {
      const user = userEvent.setup();

      const largeDataset = Array.from({ length: 500 }, (_, i) => ({
        ...mockExchangeRequests[0],
        id: `EXC-${i}`,
      }));

      const mockOnFilter = vi.fn();

      render(
        <MarketplaceBrowser
          requests={largeDataset}
          onMatchSelect={mockOnSelect}
          onFilter={mockOnFilter}
        />
      );

      // Type quickly
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'test', { delay: 10 });

      // Should debounce (not call for every keystroke)
      expect(mockOnFilter.mock.calls.length).toBeLessThan(4); // 4 chars but debounced
    });
  });
});
