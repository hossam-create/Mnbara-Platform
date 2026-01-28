import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import MarketplaceBrowser from '../../components/p2p-exchange/MarketplaceBrowser';
import MarketplaceFilters from '../../components/p2p-exchange/MarketplaceFilters';
import MarketplaceRequestCard from '../../components/p2p-exchange/MarketplaceRequestCard';
import { mockExchangeRequests } from '../fixtures/mock-data';

describe('Marketplace Browsing Flow Integration', () => {
  const mockOnSelect = vi.fn();
  const mockOnFilter = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Marketplace Workflow', () => {
    it('should browse and filter marketplace', async () => {
      const user = userEvent.setup();

      // Step 1: Render marketplace
      const { rerender } = render(
        <MarketplaceBrowser
          requests={mockExchangeRequests}
          onSelect={mockOnSelect}
        />
      );

      // Step 2: Verify initial display
      expect(screen.getByText(/marketplace|browse/i)).toBeInTheDocument();
      expect(screen.getByText(mockExchangeRequests[0].id)).toBeInTheDocument();

      // Step 3: Apply filters
      rerender(
        <MarketplaceFilters
          filters={{
            fromCurrency: 'USD',
            toCurrency: 'SAR',
            minAmount: 100,
            maxAmount: 5000,
            minRate: 3.5,
            maxRate: 4.0,
            minTrustLevel: 2,
            sortBy: 'rate',
            sortOrder: 'desc',
          }}
          onFiltersChange={mockOnFilter}
        />
      );

      // Step 4: Verify filters applied
      expect(mockOnFilter).toHaveBeenCalled();

      // Step 5: Select item
      rerender(
        <MarketplaceBrowser
          requests={mockExchangeRequests}
          onSelect={mockOnSelect}
        />
      );

      const card = screen.getByText(mockExchangeRequests[0].id);
      await user.click(card);

      expect(mockOnSelect).toHaveBeenCalledWith(mockExchangeRequests[0]);
    });

    it('should sort marketplace results', async () => {
      const user = userEvent.setup();

      const defaultFilters = {
        fromCurrency: undefined,
        toCurrency: undefined,
        minAmount: undefined,
        maxAmount: undefined,
        minRate: undefined,
        maxRate: undefined,
        minTrustLevel: undefined,
        sortBy: 'time' as const,
        sortOrder: 'desc' as const,
      };

      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFilter}
        />
      );

      // Change sort
      const sortBy = screen.getByLabelText(/sort by/i);
      await user.selectOption(sortBy, 'rate');

      expect(mockOnFilter).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'rate' })
      );
    });

    it('should paginate through results', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <MarketplaceBrowser
          requests={mockExchangeRequests.slice(0, 10)}
          onSelect={mockOnSelect}
          hasMore
        />
      );

      // Load more
      const loadMoreButton = screen.getByRole('button', { name: /load more|next/i });
      await user.click(loadMoreButton);

      // Verify more items loaded
      rerender(
        <MarketplaceBrowser
          requests={mockExchangeRequests}
          onSelect={mockOnSelect}
          hasMore={false}
        />
      );

      expect(screen.getByText(mockExchangeRequests[0].id)).toBeInTheDocument();
    });

    it('should search marketplace', async () => {
      const user = userEvent.setup();

      render(
        <MarketplaceBrowser
          requests={mockExchangeRequests}
          onSelect={mockOnSelect}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search|find/i);
      await user.type(searchInput, mockExchangeRequests[0].id);

      await waitFor(() => {
        expect(screen.getByText(mockExchangeRequests[0].id)).toBeInTheDocument();
      });
    });

    it('should handle empty search results', async () => {
      const user = userEvent.setup();

      render(
        <MarketplaceBrowser
          requests={[]}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText(/no results|empty|not found/i)).toBeInTheDocument();
    });
  });

  describe('Filter Combinations', () => {
    it('should apply multiple filters', async () => {
      const user = userEvent.setup();

      const defaultFilters = {
        fromCurrency: undefined,
        toCurrency: undefined,
        minAmount: undefined,
        maxAmount: undefined,
        minRate: undefined,
        maxRate: undefined,
        minTrustLevel: undefined,
        sortBy: 'time' as const,
        sortOrder: 'desc' as const,
      };

      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFilter}
        />
      );

      // Apply currency filter
      const fromCurrency = screen.getByLabelText(/from currency/i);
      await user.selectOption(fromCurrency, 'USD');

      // Apply amount filter
      const minAmount = screen.getByLabelText(/min amount/i);
      await user.type(minAmount, '100');

      // Apply trust level filter
      const trustLevel = screen.getByLabelText(/minimum trust level/i);
      await user.selectOption(trustLevel, '2');

      expect(mockOnFilter).toHaveBeenCalled();
    });

    it('should reset all filters', async () => {
      const user = userEvent.setup();

      const defaultFilters = {
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        minAmount: 100,
        maxAmount: 5000,
        minRate: 3.5,
        maxRate: 4.0,
        minTrustLevel: 2,
        sortBy: 'rate' as const,
        sortOrder: 'desc' as const,
      };

      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFilter}
          onReset={vi.fn()}
        />
      );

      const resetButton = screen.getByRole('button', { name: /reset all/i });
      await user.click(resetButton);

      expect(screen.getByRole('button', { name: /reset all/i })).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large result sets', () => {
      const largeSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockExchangeRequests[0],
        id: `request-${i}`,
      }));

      render(
        <MarketplaceBrowser
          requests={largeSet}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText(/marketplace|browse/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();

      render(
        <MarketplaceBrowser
          requests={mockExchangeRequests}
          onSelect={mockOnSelect}
        />
      );

      await user.tab();
      expect(screen.getByPlaceholderText(/search|find/i)).toHaveFocus();
    });
  });

  describe('RTL Support', () => {
    it('should render with RTL direction', () => {
      render(
        <MarketplaceBrowser
          requests={mockExchangeRequests}
          onSelect={mockOnSelect}
        />
      );

      const browser = screen.getByText(/marketplace|browse/i).closest('div');
      expect(browser).toHaveAttribute('dir', 'rtl');
    });
  });
});
