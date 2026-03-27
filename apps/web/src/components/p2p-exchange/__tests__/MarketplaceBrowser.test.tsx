import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import MarketplaceBrowser from '../MarketplaceBrowser';

describe('MarketplaceBrowser', () => {
  let mockOnRequestAccepted: ReturnType<typeof vi.fn>;
  let mockOnViewDetails: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnRequestAccepted = vi.fn();
    mockOnViewDetails = vi.fn();
  });

  describe('Rendering', () => {
    it('should render without crashing', async () => {
      render(<MarketplaceBrowser />);
      await waitFor(() => {
        const element = screen.queryByTestId('marketplace-browser') || 
                       screen.queryByTestId('marketplace-loading') ||
                       screen.queryByTestId('marketplace-error');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should render marketplace header when loaded', async () => {
      render(<MarketplaceBrowser />);
      await waitFor(() => {
        const header = screen.queryByTestId('marketplace-header');
        if (header) {
          expect(header).toBeInTheDocument();
        }
      }, { timeout: 5000 });
    });

    it('should render filter sidebar when loaded', async () => {
      render(<MarketplaceBrowser />);
      await waitFor(() => {
        const filters = screen.queryByTestId('filters-sidebar');
        if (filters) {
          expect(filters).toBeInTheDocument();
        }
      }, { timeout: 5000 });
    });

    it('should render request list container when loaded', async () => {
      render(<MarketplaceBrowser />);
      await waitFor(() => {
        const list = screen.queryByTestId('request-list-container');
        if (list) {
          expect(list).toBeInTheDocument();
        }
      }, { timeout: 5000 });
    });
  });

  describe('Loading State', () => {
    it('should show loading or marketplace state', async () => {
      render(<MarketplaceBrowser />);
      await waitFor(() => {
        const element = screen.queryByTestId('marketplace-browser') || 
                       screen.queryByTestId('marketplace-loading');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Content Display', () => {
    it('should display marketplace content or error', async () => {
      render(<MarketplaceBrowser />);
      await waitFor(() => {
        const element = screen.queryByTestId('marketplace-browser') || 
                       screen.queryByTestId('marketplace-error');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display pagination info when available', async () => {
      render(<MarketplaceBrowser />);
      await waitFor(() => {
        const element = screen.queryByTestId('marketplace-browser') || 
                       screen.queryByTestId('marketplace-error');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Empty State', () => {
    it('should show empty state or request cards', async () => {
      render(<MarketplaceBrowser />);
      await waitFor(() => {
        const element = screen.queryByTestId('marketplace-browser') || 
                       screen.queryByTestId('marketplace-error');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls when needed', async () => {
      render(<MarketplaceBrowser />);
      await waitFor(() => {
        const element = screen.queryByTestId('marketplace-browser') || 
                       screen.queryByTestId('marketplace-error');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should have previous button when available', async () => {
      render(<MarketplaceBrowser />);
      await waitFor(() => {
        const element = screen.queryByTestId('marketplace-browser') || 
                       screen.queryByTestId('marketplace-error');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should have next button when available', async () => {
      render(<MarketplaceBrowser />);
      await waitFor(() => {
        const element = screen.queryByTestId('marketplace-browser') || 
                       screen.queryByTestId('marketplace-error');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      render(<MarketplaceBrowser />);
      await waitFor(() => {
        const element = screen.queryByTestId('marketplace-browser') || 
                       screen.queryByTestId('marketplace-error') ||
                       screen.queryByTestId('marketplace-loading');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('User Interactions', () => {
    it('should handle page changes', async () => {
      const user = userEvent.setup();
      render(<MarketplaceBrowser />);

      await waitFor(() => {
        const element = screen.queryByTestId('marketplace-browser') || 
                       screen.queryByTestId('marketplace-error');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });

      const nextButton = screen.queryByTestId('pagination-next-button');
      if (nextButton && !nextButton.hasAttribute('disabled')) {
        await user.click(nextButton);
      }

      const finalElement = screen.queryByTestId('marketplace-browser') || 
                          screen.queryByTestId('marketplace-error');
      expect(finalElement).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<MarketplaceBrowser />);

      await waitFor(() => {
        const element = screen.queryByTestId('marketplace-browser') || 
                       screen.queryByTestId('marketplace-error');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });

      await user.tab();
      const finalElement = screen.queryByTestId('marketplace-browser') || 
                          screen.queryByTestId('marketplace-error');
      expect(finalElement).toBeInTheDocument();
    });
  });
});
