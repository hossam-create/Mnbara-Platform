import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import MarketplaceFilters from '../MarketplaceFilters';
import type { MarketplaceFilters as MarketplaceFiltersType } from '../../../types/p2p-exchange.types';

describe('MarketplaceFilters', () => {
  const mockOnFiltersChange = vi.fn();
  const mockOnReset = vi.fn();

  const defaultFilters: MarketplaceFiltersType = {
    fromCurrency: undefined,
    toCurrency: undefined,
    minAmount: undefined,
    maxAmount: undefined,
    minRate: undefined,
    maxRate: undefined,
    minTrustLevel: undefined,
    sortBy: 'time',
    sortOrder: 'desc',
  };

  describe('Rendering', () => {
    it('should render filter panel', () => {
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      expect(screen.getByText(/filters/i)).toBeInTheDocument();
    });

    it('should render currency selects', () => {
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      expect(screen.getByLabelText(/from currency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/to currency/i)).toBeInTheDocument();
    });

    it('should render amount inputs', () => {
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      expect(screen.getByLabelText(/min amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max amount/i)).toBeInTheDocument();
    });

    it('should render rate inputs', () => {
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      expect(screen.getByLabelText(/min rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max rate/i)).toBeInTheDocument();
    });

    it('should render trust level select', () => {
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      expect(screen.getByLabelText(/minimum trust level/i)).toBeInTheDocument();
    });

    it('should render sort options', () => {
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sort order/i)).toBeInTheDocument();
    });

    it('should render reset button', () => {
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      expect(screen.getByRole('button', { name: /reset all/i })).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle from currency selection', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const fromCurrency = screen.getByLabelText(/from currency/i) as HTMLSelectElement;
      await user.selectOption(fromCurrency, 'USD');

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ fromCurrency: 'USD' })
      );
    });

    it('should handle to currency selection', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const toCurrency = screen.getByLabelText(/to currency/i) as HTMLSelectElement;
      await user.selectOption(toCurrency, 'SAR');

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ toCurrency: 'SAR' })
      );
    });

    it('should handle min amount input', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const minAmount = screen.getByLabelText(/min amount/i) as HTMLInputElement;
      await user.type(minAmount, '100');

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ minAmount: 100 })
      );
    });

    it('should handle max amount input', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const maxAmount = screen.getByLabelText(/max amount/i) as HTMLInputElement;
      await user.type(maxAmount, '1000');

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ maxAmount: 1000 })
      );
    });

    it('should handle min rate input', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const minRate = screen.getByLabelText(/min rate/i) as HTMLInputElement;
      await user.type(minRate, '3.5');

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ minRate: 3.5 })
      );
    });

    it('should handle max rate input', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const maxRate = screen.getByLabelText(/max rate/i) as HTMLInputElement;
      await user.type(maxRate, '4.0');

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ maxRate: 4.0 })
      );
    });

    it('should handle trust level selection', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const trustLevel = screen.getByLabelText(/minimum trust level/i) as HTMLSelectElement;
      await user.selectOption(trustLevel, '3');

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ minTrustLevel: 3 })
      );
    });

    it('should handle sort by selection', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const sortBy = screen.getByLabelText(/sort by/i) as HTMLSelectElement;
      await user.selectOption(sortBy, 'rate');

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'rate' })
      );
    });

    it('should handle sort order selection', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const sortOrder = screen.getByLabelText(/sort order/i) as HTMLSelectElement;
      await user.selectOption(sortOrder, 'asc');

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ sortOrder: 'asc' })
      );
    });
  });

  describe('Reset', () => {
    it('should call onReset when reset button clicked', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          onReset={mockOnReset}
        />
      );

      const resetButton = screen.getByRole('button', { name: /reset all/i });
      await user.click(resetButton);

      expect(mockOnReset).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      expect(screen.getByLabelText(/from currency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/to currency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/min amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/min rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/minimum trust level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sort order/i)).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      await user.tab();
      expect(screen.getByRole('button', { name: /reset all/i })).toHaveFocus();
    });

    it('should support form submission with keyboard', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const fromCurrency = screen.getByLabelText(/from currency/i);
      await user.click(fromCurrency);
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(mockOnFiltersChange).toHaveBeenCalled();
    });
  });

  describe('Controlled Component', () => {
    it('should display current filter values', () => {
      const filters: MarketplaceFiltersType = {
        fromCurrency: 'USD',
        toCurrency: 'SAR',
        minAmount: 100,
        maxAmount: 1000,
        minRate: 3.5,
        maxRate: 4.0,
        minTrustLevel: 3,
        sortBy: 'rate',
        sortOrder: 'asc',
      };

      render(
        <MarketplaceFilters
          filters={filters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      expect((screen.getByLabelText(/from currency/i) as HTMLSelectElement).value).toBe('USD');
      expect((screen.getByLabelText(/to currency/i) as HTMLSelectElement).value).toBe('SAR');
      expect((screen.getByLabelText(/min amount/i) as HTMLInputElement).value).toBe('100');
      expect((screen.getByLabelText(/max amount/i) as HTMLInputElement).value).toBe('1000');
    });
  });
});
