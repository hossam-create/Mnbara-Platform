import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import ReceiptConfirmation from '../ReceiptConfirmation';
import { mockMatches } from '../../../__tests__/fixtures/mock-data';

describe('ReceiptConfirmation', () => {
  const mockMatch = mockMatches[0];
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  describe('Rendering', () => {
    it('should render receipt confirmation', () => {
      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByText(/receipt|confirm|received/i)).toBeInTheDocument();
    });

    it('should display transaction details', () => {
      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByText(/amount|currency|rate/i)).toBeInTheDocument();
    });

    it('should display sender info', () => {
      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByText(/sender|from|buyer/i)).toBeInTheDocument();
    });

    it('should display receiver info', () => {
      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByText(/receiver|to|seller/i)).toBeInTheDocument();
    });

    it('should display confirmation checkbox', () => {
      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('should display confirm button', () => {
      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByRole('button', { name: /confirm|received/i })).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle confirmation checkbox', async () => {
      const user = userEvent.setup();
      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      expect(checkbox).toBeChecked();
    });

    it('should enable confirm button when checked', async () => {
      const user = userEvent.setup();
      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      const confirmButton = screen.getByRole('button', { name: /confirm|received/i });

      expect(confirmButton).toBeDisabled();

      await user.click(checkbox);

      expect(confirmButton).not.toBeDisabled();
    });

    it('should call onConfirm when confirmed', async () => {
      const user = userEvent.setup();
      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      const confirmButton = screen.getByRole('button', { name: /confirm|received/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled();
      });
    });

    it('should call onCancel when cancelled', async () => {
      const user = userEvent.setup();
      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should show error when confirming without checkbox', async () => {
      const user = userEvent.setup();
      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm|received/i });
      expect(confirmButton).toBeDisabled();
    });

    it('should prevent double submission', async () => {
      const user = userEvent.setup();
      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      const confirmButton = screen.getByRole('button', { name: /confirm|received/i });
      await user.click(confirmButton);
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels', () => {
      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      await user.tab();
      expect(screen.getByRole('checkbox')).toHaveFocus();
    });

    it('should have ARIA labels for dialog', () => {
      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      const dialog = screen.getByRole('dialog', { hidden: true });
      expect(dialog).toHaveAttribute('aria-labelledby');
    });
  });

  describe('Display Formatting', () => {
    it('should format amount correctly', () => {
      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByText(new RegExp(mockMatch.amount.toString()))).toBeInTheDocument();
    });

    it('should display currency symbols', () => {
      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      expect(screen.getByText(new RegExp(mockMatch.fromCurrency))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(mockMatch.toCurrency))).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state during confirmation', async () => {
      const user = userEvent.setup();
      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      const confirmButton = screen.getByRole('button', { name: /confirm|received/i });
      await user.click(confirmButton);

      expect(confirmButton).toHaveAttribute('disabled');
    });
  });

  describe('RTL Support', () => {
    it('should render with RTL direction', () => {
      render(
        <ReceiptConfirmation
          match={mockMatch}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );
      const dialog = screen.getByRole('dialog', { hidden: true });
      expect(dialog).toHaveAttribute('dir', 'rtl');
    });
  });
});
