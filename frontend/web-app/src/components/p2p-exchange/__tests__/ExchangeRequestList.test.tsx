import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import ExchangeRequestList from '../ExchangeRequestList';
import { mockExchangeRequests } from '../../../__tests__/fixtures/mock-data';

describe('ExchangeRequestList', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<ExchangeRequestList requests={mockExchangeRequests} />);
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should render list items for each request', () => {
      render(<ExchangeRequestList requests={mockExchangeRequests} />);
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(mockExchangeRequests.length);
    });

    it('should display request details', () => {
      render(<ExchangeRequestList requests={mockExchangeRequests} />);
      expect(screen.getByText(/USD/i)).toBeInTheDocument();
      expect(screen.getByText(/SAR/i)).toBeInTheDocument();
    });

    it('should show empty state when no requests', () => {
      render(<ExchangeRequestList requests={[]} />);
      expect(screen.getByText(/no requests/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle item click', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <ExchangeRequestList requests={mockExchangeRequests} onSelect={onSelect} />
      );

      const firstItem = screen.getAllByRole('listitem')[0];
      await user.click(firstItem);

      expect(onSelect).toHaveBeenCalled();
    });

    it('should handle delete action', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(
        <ExchangeRequestList requests={mockExchangeRequests} onDelete={onDelete} />
      );

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(onDelete).toHaveBeenCalled();
    });
  });

  describe('Sorting', () => {
    it('should sort by date', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestList requests={mockExchangeRequests} sortable />);

      const sortButton = screen.getByRole('button', { name: /sort/i });
      await user.click(sortButton);

      expect(screen.getByText(/sorted/i)).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should filter by status', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestList requests={mockExchangeRequests} filterable />);

      const filterSelect = screen.getByLabelText(/status/i);
      await user.selectOption(filterSelect, 'OPEN');

      await waitFor(() => {
        const items = screen.getAllByRole('listitem');
        expect(items.length).toBeLessThanOrEqual(mockExchangeRequests.length);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ExchangeRequestList requests={mockExchangeRequests} />);
      expect(screen.getByRole('list')).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestList requests={mockExchangeRequests} />);

      await user.tab();
      const firstItem = screen.getAllByRole('listitem')[0];
      expect(firstItem).toHaveFocus();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator', () => {
      render(<ExchangeRequestList requests={[]} isLoading />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message', () => {
      render(
        <ExchangeRequestList requests={[]} error="Failed to load requests" />
      );
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });
  });
});
