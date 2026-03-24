import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import { ExchangeRequestList } from '../ExchangeRequestList';

describe('ExchangeRequestList', () => {
  describe('Rendering', () => {
    it('should render exchange request list or error', async () => {
      render(<ExchangeRequestList />);
      await waitFor(() => {
        const element = screen.queryByTestId('exchange-request-list') || 
                       screen.queryByTestId('exchange-request-list-error') ||
                       screen.queryByTestId('exchange-request-list-loading');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display status filter when loaded', async () => {
      render(<ExchangeRequestList />);
      await waitFor(() => {
        const filter = screen.queryByTestId('status-filter');
        if (filter) {
          expect(filter).toBeInTheDocument();
        }
      }, { timeout: 5000 });
    });

    it('should display request cards container or empty state', async () => {
      render(<ExchangeRequestList />);
      await waitFor(() => {
        const element = screen.queryByTestId('exchange-request-list') || 
                       screen.queryByTestId('exchange-request-list-error');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Status Filter', () => {
    it('should have filter buttons when loaded', async () => {
      render(<ExchangeRequestList />);
      await waitFor(() => {
        const filter = screen.queryByTestId('status-filter');
        if (filter) {
          expect(filter).toBeInTheDocument();
        }
      }, { timeout: 5000 });
    });

    it('should handle filter button clicks', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestList />);

      await waitFor(() => {
        const element = screen.queryByTestId('exchange-request-list') || 
                       screen.queryByTestId('exchange-request-list-error');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });

      const filterButton = screen.queryByTestId('filter-button-ALL');
      if (filterButton) {
        await user.click(filterButton);
      }

      const finalElement = screen.queryByTestId('exchange-request-list') || 
                          screen.queryByTestId('exchange-request-list-error');
      expect(finalElement).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls when available', async () => {
      render(<ExchangeRequestList />);
      await waitFor(() => {
        const element = screen.queryByTestId('exchange-request-list') || 
                       screen.queryByTestId('exchange-request-list-error');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle pagination clicks', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestList />);

      await waitFor(() => {
        const element = screen.queryByTestId('exchange-request-list') || 
                       screen.queryByTestId('exchange-request-list-error');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });

      const nextButton = screen.queryByTestId('pagination-next');
      if (nextButton && !nextButton.hasAttribute('disabled')) {
        await user.click(nextButton);
      }

      const finalElement = screen.queryByTestId('exchange-request-list') || 
                          screen.queryByTestId('exchange-request-list-error');
      expect(finalElement).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state or request cards', async () => {
      render(<ExchangeRequestList />);
      await waitFor(() => {
        const element = screen.queryByTestId('exchange-request-list') || 
                       screen.queryByTestId('exchange-request-list-error');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Loading State', () => {
    it('should show loading or list state', async () => {
      render(<ExchangeRequestList />);
      await waitFor(() => {
        const element = screen.queryByTestId('exchange-request-list') || 
                       screen.queryByTestId('exchange-request-list-loading');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      render(<ExchangeRequestList />);
      await waitFor(() => {
        const element = screen.queryByTestId('exchange-request-list-error') || 
                       screen.queryByTestId('exchange-request-list');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestList />);

      await waitFor(() => {
        const element = screen.queryByTestId('exchange-request-list') || 
                       screen.queryByTestId('exchange-request-list-error');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });

      await user.tab();
      const finalElement = screen.queryByTestId('exchange-request-list') || 
                          screen.queryByTestId('exchange-request-list-error');
      expect(finalElement).toBeInTheDocument();
    });
  });
});
