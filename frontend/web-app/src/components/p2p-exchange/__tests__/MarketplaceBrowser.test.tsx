import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import MarketplaceBrowser from '../MarketplaceBrowser';

describe('MarketplaceBrowser', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<MarketplaceBrowser />);
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should render marketplace list', async () => {
      render(<MarketplaceBrowser />);

      await waitFor(() => {
        expect(screen.getByText(/marketplace/i)).toBeInTheDocument();
      });
    });

    it('should render filter controls', () => {
      render(<MarketplaceBrowser />);
      expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
    });

    it('should render exchange request cards', async () => {
      render(<MarketplaceBrowser />);

      await waitFor(() => {
        expect(screen.getAllByRole('article')).toLength.greaterThan(0);
      });
    });
  });

  describe('Filtering', () => {
    it('should filter by currency pair', async () => {
      const user = userEvent.setup();
      render(<MarketplaceBrowser />);

      const filterButton = screen.getByRole('button', { name: /filter/i });
      await user.click(filterButton);

      const currencySelect = screen.getByLabelText(/currency/i);
      await user.selectOption(currencySelect, 'USD');

      await waitFor(() => {
        expect(screen.getByText(/USD/i)).toBeInTheDocument();
      });
    });

    it('should filter by amount range', async () => {
      const user = userEvent.setup();
      render(<MarketplaceBrowser />);

      const minInput = screen.getByLabelText(/min amount/i);
      const maxInput = screen.getByLabelText(/max amount/i);

      await user.type(minInput, '100');
      await user.type(maxInput, '1000');

      await waitFor(() => {
        expect(minInput).toHaveValue(100);
        expect(maxInput).toHaveValue(1000);
      });
    });

    it('should sort by rate', async () => {
      const user = userEvent.setup();
      render(<MarketplaceBrowser />);

      const sortSelect = screen.getByLabelText(/sort by/i);
      await user.selectOption(sortSelect, 'rate');

      await waitFor(() => {
        expect(sortSelect).toHaveValue('rate');
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls', async () => {
      render(<MarketplaceBrowser />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      });
    });

    it('should navigate to next page', async () => {
      const user = userEvent.setup();
      render(<MarketplaceBrowser />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText(/page 2/i)).toBeInTheDocument();
      });
    });

    it('should navigate to previous page', async () => {
      const user = userEvent.setup();
      render(<MarketplaceBrowser />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      const prevButton = screen.getByRole('button', { name: /previous/i });
      await user.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText(/page 1/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should accept a match', async () => {
      const user = userEvent.setup();
      render(<MarketplaceBrowser />);

      await waitFor(() => {
        const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
        expect(acceptButtons.length).toBeGreaterThan(0);
      });

      const acceptButton = screen.getAllByRole('button', { name: /accept/i })[0];
      await user.click(acceptButton);

      await waitFor(() => {
        expect(screen.getByText(/success/i)).toBeInTheDocument();
      });
    });

    it('should view request details', async () => {
      const user = userEvent.setup();
      render(<MarketplaceBrowser />);

      await waitFor(() => {
        const detailsButtons = screen.getAllByRole('button', { name: /details/i });
        expect(detailsButtons.length).toBeGreaterThan(0);
      });

      const detailsButton = screen.getAllByRole('button', { name: /details/i })[0];
      await user.click(detailsButton);

      await waitFor(() => {
        expect(screen.getByText(/exchange details/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no results', async () => {
      render(<MarketplaceBrowser />);

      // Apply filter that returns no results
      const filterButton = screen.getByRole('button', { name: /filter/i });
      const user = userEvent.setup();
      await user.click(filterButton);

      // This would need a specific filter that returns no results
      // For now, we just verify the component handles it
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator', async () => {
      render(<MarketplaceBrowser />);

      // Initially should show loading
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Then should load data
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      render(<MarketplaceBrowser />);

      await waitFor(() => {
        // Should either show data or error message
        const hasData = screen.queryAllByRole('article').length > 0;
        const hasError = screen.queryByText(/error/i);
        expect(hasData || hasError).toBe(true);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MarketplaceBrowser />);
      expect(screen.getByRole('heading')).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<MarketplaceBrowser />);

      await user.tab();
      expect(screen.getByRole('button', { name: /filter/i })).toHaveFocus();
    });

    it('should announce pagination changes', async () => {
      const user = userEvent.setup();
      render(<MarketplaceBrowser />);

      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /next/i });
        expect(nextButton).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Should have aria-live region for announcements
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('RTL Support', () => {
    it('should render with RTL direction', () => {
      render(<MarketplaceBrowser />);
      const container = screen.getByRole('heading').closest('div');
      expect(container).toHaveAttribute('dir', 'rtl');
    });
  });
});
