import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import { MarketplaceFilters } from '../MarketplaceFilters';
import type { MarketplaceFilters as MarketplaceFiltersType } from '../../../types/p2p-exchange.types';

describe('MarketplaceFilters', () => {
  let mockOnFiltersChange: ReturnType<typeof vi.fn>;
  let mockOnReset: ReturnType<typeof vi.fn>;

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

  beforeEach(() => {
    mockOnFiltersChange = vi.fn();
    mockOnReset = vi.fn();
  });

  describe('Rendering', () => {
    it('should render filter panel', () => {
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      expect(screen.getByTestId('marketplace-filters')).toBeInTheDocument();
    });

    it('should render currency selects', () => {
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      expect(screen.getByTestId('from-currency-select')).toBeInTheDocument();
      expect(screen.getByTestId('to-currency-select')).toBeInTheDocument();
    });

    it('should render amount inputs', () => {
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      expect(screen.getByTestId('min-amount-input')).toBeInTheDocument();
      expect(screen.getByTestId('max-amount-input')).toBeInTheDocument();
    });

    it('should render rate inputs', () => {
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      expect(screen.getByTestId('min-rate-input')).toBeInTheDocument();
      expect(screen.getByTestId('max-rate-input')).toBeInTheDocument();
    });

    it('should render trust level select', () => {
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      expect(screen.getByTestId('min-trust-level-select')).toBeInTheDocument();
    });

    it('should render sort options', () => {
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      expect(screen.getByTestId('sort-by-select')).toBeInTheDocument();
      expect(screen.getByTestId('sort-order-select')).toBeInTheDocument();
    });

    it('should render reset button', () => {
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );
      expect(screen.getByTestId('reset-filters-button')).toBeInTheDocument();
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

      const fromCurrency = screen.getByTestId('from-currency-select') as HTMLSelectElement;
      await user.selectOptions(fromCurrency, 'USD');

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

      const toCurrency = screen.getByTestId('to-currency-select') as HTMLSelectElement;
      await user.selectOptions(toCurrency, 'SAR');

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

      const minAmount = screen.getByTestId('min-amount-input') as HTMLInputElement;
      await user.clear(minAmount);
      await user.type(minAmount, '100');

      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it('should handle max amount input', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const maxAmount = screen.getByTestId('max-amount-input') as HTMLInputElement;
      await user.clear(maxAmount);
      await user.type(maxAmount, '1000');

      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it('should handle min rate input', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const minRate = screen.getByTestId('min-rate-input') as HTMLInputElement;
      await user.clear(minRate);
      await user.type(minRate, '3.5');

      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it('should handle max rate input', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const maxRate = screen.getByTestId('max-rate-input') as HTMLInputElement;
      await user.clear(maxRate);
      await user.type(maxRate, '4.0');

      expect(mockOnFiltersChange).toHaveBeenCalled();
    });

    it('should handle trust level selection', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceFilters
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      const trustLevel = screen.getByTestId('min-trust-level-select') as HTMLSelectElement;
      await user.selectOptions(trustLevel, '3');

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

      const sortBy = screen.getByTestId('sort-by-select') as HTMLSelectElement;
      await user.selectOptions(sortBy, 'rate');

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

      const sortOrder = screen.getByTestId('sort-order-select') as HTMLSelectElement;
      await user.selectOptions(sortOrder, 'asc');

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

      const resetButton = screen.getByTestId('reset-filters-button');
      await user.click(resetButton);

      expect(mockOnReset).toHaveBeenCalled();
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

      expect((screen.getByTestId('from-currency-select') as HTMLSelectElement).value).toBe('USD');
      expect((screen.getByTestId('to-currency-select') as HTMLSelectElement).value).toBe('SAR');
      expect((screen.getByTestId('min-amount-input') as HTMLInputElement).value).toBe('100');
      expect((screen.getByTestId('max-amount-input') as HTMLInputElement).value).toBe('1000');
    });
  });
});
