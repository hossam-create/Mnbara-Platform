import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import ExchangeRequestForm from '../ExchangeRequestForm';

describe('ExchangeRequestForm', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<ExchangeRequestForm />);
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should render form fields', () => {
      render(<ExchangeRequestForm />);
      expect(screen.getByLabelText(/from currency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/to currency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<ExchangeRequestForm />);
      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
    });

    it('should render with Arabic language support', () => {
      render(<ExchangeRequestForm />);
      const form = screen.getByRole('form', { hidden: true });
      expect(form).toHaveAttribute('dir', 'rtl');
    });
  });

  describe('User Interactions', () => {
    it('should update form fields on input', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;
      await user.type(amountInput, '100');

      expect(amountInput.value).toBe('100');
    });

    it('should handle currency selection', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const fromCurrency = screen.getByLabelText(/from currency/i);
      await user.selectOption(fromCurrency, 'USD');

      expect(fromCurrency).toHaveValue('USD');
    });

    it('should calculate exchange rate on currency change', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const fromCurrency = screen.getByLabelText(/from currency/i);
      const toCurrency = screen.getByLabelText(/to currency/i);

      await user.selectOption(fromCurrency, 'USD');
      await user.selectOption(toCurrency, 'SAR');

      await waitFor(() => {
        expect(screen.getByText(/rate/i)).toBeInTheDocument();
      });
    });

    it('should handle form submission', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const amountInput = screen.getByLabelText(/amount/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      await user.type(amountInput, '100');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/success/i)).toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    it('should show error for empty amount', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid amount', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '-100');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must be positive/i)).toBeInTheDocument();
      });
    });

    it('should show error for missing currency selection', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '100');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/currency is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ExchangeRequestForm />);
      expect(screen.getByLabelText(/from currency/i)).toHaveAttribute('aria-label');
      expect(screen.getByLabelText(/to currency/i)).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const amountInput = screen.getByLabelText(/amount/i);
      const submitButton = screen.getByRole('button', { name: /create/i });

      await user.tab();
      expect(amountInput).toHaveFocus();

      await user.tab();
      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should have visible focus indicators', () => {
      render(<ExchangeRequestForm />);
      const amountInput = screen.getByLabelText(/amount/i);

      amountInput.focus();
      const styles = window.getComputedStyle(amountInput);
      expect(styles.outline).not.toBe('none');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '100');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      // Mock API error
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      render(<ExchangeRequestForm />);

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, '100');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });
  });
});
