import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import PaymentInitiation from '../PaymentInitiation';
import { mockMatches } from '../../../__tests__/fixtures/mock-data';

describe('PaymentInitiation', () => {
  const mockMatch = mockMatches[0];
  const mockOnPaymentInitiated = vi.fn();
  const mockOnCancel = vi.fn();

  describe('Rendering', () => {
    it('should render payment form', () => {
      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByText(/payment/i)).toBeInTheDocument();
    });

    it('should display payment amount', () => {
      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByText(new RegExp(mockMatch.amount.toString()))).toBeInTheDocument();
    });

    it('should display payment method options', () => {
      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByText(/method|bank|card|wallet/i)).toBeInTheDocument();
    });

    it('should display recipient info', () => {
      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByText(/recipient|seller|account/i)).toBeInTheDocument();
    });

    it('should display terms and conditions', () => {
      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByText(/terms|agree|confirm/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle payment method selection', async () => {
      const user = userEvent.setup();
      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );

      const methodSelect = screen.getByLabelText(/method/i);
      await user.selectOption(methodSelect, 'bank_transfer');

      expect(methodSelect).toHaveValue('bank_transfer');
    });

    it('should handle terms acceptance', async () => {
      const user = userEvent.setup();
      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );

      const termsCheckbox = screen.getByRole('checkbox');
      await user.click(termsCheckbox);

      expect(termsCheckbox).toBeChecked();
    });

    it('should enable submit when terms accepted', async () => {
      const user = userEvent.setup();
      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );

      const termsCheckbox = screen.getByRole('checkbox');
      const submitButton = screen.getByRole('button', { name: /initiate|confirm|pay/i });

      expect(submitButton).toBeDisabled();

      await user.click(termsCheckbox);

      expect(submitButton).not.toBeDisabled();
    });

    it('should call onPaymentInitiated on submit', async () => {
      const user = userEvent.setup();
      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );

      const termsCheckbox = screen.getByRole('checkbox');
      await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /initiate|confirm|pay/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnPaymentInitiated).toHaveBeenCalled();
      });
    });

    it('should call onCancel when cancel clicked', async () => {
      const user = userEvent.setup();
      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should show error for missing payment method', async () => {
      const user = userEvent.setup();
      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );

      const termsCheckbox = screen.getByRole('checkbox');
      await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /initiate|confirm|pay/i });
      await user.click(submitButton);

      expect(screen.queryByText(/select.*method|method.*required/i)).toBeInTheDocument();
    });

    it('should show error for unchecked terms', async () => {
      const user = userEvent.setup();
      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /initiate|confirm|pay/i });
      await user.click(submitButton);

      expect(screen.queryByText(/accept.*terms|terms.*required/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels', () => {
      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByLabelText(/method/i)).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );

      await user.tab();
      expect(screen.getByLabelText(/method/i)).toHaveFocus();
    });

    it('should have ARIA labels for form', () => {
      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );
      const form = screen.getByRole('form', { hidden: true });
      expect(form).toHaveAttribute('aria-label');
    });
  });

  describe('Loading State', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );

      const termsCheckbox = screen.getByRole('checkbox');
      await user.click(termsCheckbox);

      const submitButton = screen.getByRole('button', { name: /initiate|confirm|pay/i });
      await user.click(submitButton);

      expect(submitButton).toHaveAttribute('disabled');
    });
  });

  describe('RTL Support', () => {
    it('should render with RTL direction', () => {
      render(
        <PaymentInitiation
          match={mockMatch}
          onPaymentInitiated={mockOnPaymentInitiated}
          onCancel={mockOnCancel}
        />
      );
      const form = screen.getByRole('form', { hidden: true });
      expect(form).toHaveAttribute('dir', 'rtl');
    });
  });
});
