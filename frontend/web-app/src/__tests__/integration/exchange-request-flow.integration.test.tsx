import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import ExchangeRequestForm from '../../components/p2p-exchange/ExchangeRequestForm';
import ExchangeRequestList from '../../components/p2p-exchange/ExchangeRequestList';
import ExchangeRequestDetails from '../../components/p2p-exchange/ExchangeRequestDetails';
import { mockExchangeRequests } from '../fixtures/mock-data';

describe('Exchange Request Flow Integration', () => {
  const mockOnCreate = vi.fn();
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Exchange Request Workflow', () => {
    it('should create and display exchange request', async () => {
      const user = userEvent.setup();

      // Step 1: Render form
      const { rerender } = render(
        <ExchangeRequestForm onRequestCreated={mockOnCreate} />
      );

      // Step 2: Fill form
      const fromCurrency = screen.getByLabelText(/from currency/i);
      const toCurrency = screen.getByLabelText(/to currency/i);
      const amount = screen.getByLabelText(/amount/i);

      await user.selectOption(fromCurrency, 'USD');
      await user.selectOption(toCurrency, 'SAR');
      await user.type(amount, '1000');

      // Step 3: Submit form
      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      // Step 4: Verify creation
      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalled();
      });

      // Step 5: Display list
      rerender(
        <ExchangeRequestList
          requests={mockExchangeRequests}
          onSelect={mockOnSelect}
        />
      );

      // Step 6: Verify list displays
      expect(screen.getByText(mockExchangeRequests[0].id)).toBeInTheDocument();
    });

    it('should navigate from list to details', async () => {
      const user = userEvent.setup();

      // Step 1: Render list
      const { rerender } = render(
        <ExchangeRequestList
          requests={mockExchangeRequests}
          onSelect={mockOnSelect}
        />
      );

      // Step 2: Click item
      const firstRequest = mockExchangeRequests[0];
      const listItem = screen.getByText(firstRequest.id);
      await user.click(listItem);

      // Step 3: Verify selection
      expect(mockOnSelect).toHaveBeenCalledWith(firstRequest);

      // Step 4: Render details
      rerender(
        <ExchangeRequestDetails
          request={firstRequest}
          onClose={vi.fn()}
        />
      );

      // Step 5: Verify details display
      expect(screen.getByText(/exchange request details/i)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(firstRequest.fromCurrency))).toBeInTheDocument();
    });

    it('should handle form validation errors', async () => {
      const user = userEvent.setup();

      render(<ExchangeRequestForm onRequestCreated={mockOnCreate} />);

      // Try to submit without filling form
      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      // Verify validation errors
      expect(screen.getByText(/required|invalid/i)).toBeInTheDocument();
      expect(mockOnCreate).not.toHaveBeenCalled();
    });

    it('should handle amount validation', async () => {
      const user = userEvent.setup();

      render(<ExchangeRequestForm onRequestCreated={mockOnCreate} />);

      const amount = screen.getByLabelText(/amount/i);
      await user.type(amount, '-100');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      expect(screen.getByText(/positive|invalid/i)).toBeInTheDocument();
    });

    it('should handle currency pair validation', async () => {
      const user = userEvent.setup();

      render(<ExchangeRequestForm onRequestCreated={mockOnCreate} />);

      const fromCurrency = screen.getByLabelText(/from currency/i);
      const toCurrency = screen.getByLabelText(/to currency/i);

      await user.selectOption(fromCurrency, 'USD');
      await user.selectOption(toCurrency, 'USD');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      expect(screen.getByText(/same currency|different/i)).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should recover from submission error', async () => {
      const user = userEvent.setup();

      render(<ExchangeRequestForm onRequestCreated={mockOnCreate} />);

      const fromCurrency = screen.getByLabelText(/from currency/i);
      const toCurrency = screen.getByLabelText(/to currency/i);
      const amount = screen.getByLabelText(/amount/i);

      await user.selectOption(fromCurrency, 'USD');
      await user.selectOption(toCurrency, 'SAR');
      await user.type(amount, '1000');

      // First submission fails
      mockOnCreate.mockRejectedValueOnce(new Error('Network error'));

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });

      // Second submission succeeds
      mockOnCreate.mockResolvedValueOnce({ id: 'new-request' });

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('RTL Support', () => {
    it('should work with RTL direction', async () => {
      const user = userEvent.setup();

      render(<ExchangeRequestForm onRequestCreated={mockOnCreate} />);

      const form = screen.getByRole('form', { hidden: true });
      expect(form).toHaveAttribute('dir', 'rtl');

      const fromCurrency = screen.getByLabelText(/from currency/i);
      await user.selectOption(fromCurrency, 'USD');

      expect(fromCurrency).toHaveValue('USD');
    });
  });

  describe('Accessibility', () => {
    it('should be fully keyboard navigable', async () => {
      const user = userEvent.setup();

      render(<ExchangeRequestForm onRequestCreated={mockOnCreate} />);

      // Tab through form
      await user.tab();
      expect(screen.getByLabelText(/from currency/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/to currency/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/amount/i)).toHaveFocus();
    });

    it('should have proper ARIA labels', () => {
      render(<ExchangeRequestForm onRequestCreated={mockOnCreate} />);

      expect(screen.getByLabelText(/from currency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/to currency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    });
  });
});
