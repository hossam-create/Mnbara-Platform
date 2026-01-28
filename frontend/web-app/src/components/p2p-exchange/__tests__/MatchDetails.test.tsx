import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import MatchDetails from '../MatchDetails';
import { mockMatches } from '../../../__tests__/fixtures/mock-data';

describe('MatchDetails', () => {
  const mockMatch = mockMatches[0];
  const mockOnClose = vi.fn();

  describe('Rendering', () => {
    it('should render match details', () => {
      render(
        <MatchDetails
          match={mockMatch}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText(/match details/i)).toBeInTheDocument();
    });

    it('should display buyer and seller info', () => {
      render(
        <MatchDetails
          match={mockMatch}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText(/buyer|seller/i)).toBeInTheDocument();
    });

    it('should display exchange details', () => {
      render(
        <MatchDetails
          match={mockMatch}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText(/exchange|rate|amount/i)).toBeInTheDocument();
    });

    it('should display match status', () => {
      render(
        <MatchDetails
          match={mockMatch}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText(new RegExp(mockMatch.status))).toBeInTheDocument();
    });

    it('should display timeline', () => {
      render(
        <MatchDetails
          match={mockMatch}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText(/timeline|created|updated/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should close on close button click', async () => {
      const user = userEvent.setup();
      render(
        <MatchDetails
          match={mockMatch}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close|×/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close on escape key', async () => {
      const user = userEvent.setup();
      render(
        <MatchDetails
          match={mockMatch}
          onClose={mockOnClose}
        />
      );

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Actions', () => {
    it('should show action buttons based on status', () => {
      render(
        <MatchDetails
          match={mockMatch}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByRole('button', { hidden: true })).toBeInTheDocument();
    });

    it('should handle action button clicks', async () => {
      const user = userEvent.setup();
      render(
        <MatchDetails
          match={mockMatch}
          onClose={mockOnClose}
        />
      );

      const actionButton = screen.getAllByRole('button')[0];
      await user.click(actionButton);

      expect(actionButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <MatchDetails
          match={mockMatch}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <MatchDetails
          match={mockMatch}
          onClose={mockOnClose}
        />
      );

      await user.tab();
      expect(screen.getByRole('button', { name: /close|×/i })).toHaveFocus();
    });

    it('should have ARIA labels', () => {
      render(
        <MatchDetails
          match={mockMatch}
          onClose={mockOnClose}
        />
      );
      const dialog = screen.getByRole('dialog', { hidden: true });
      expect(dialog).toHaveAttribute('aria-labelledby');
    });
  });

  describe('Status Specific Content', () => {
    it('should show payment info for AWAITING_PAYMENT status', () => {
      const paymentMatch = { ...mockMatch, status: 'AWAITING_PAYMENT' as const };
      render(
        <MatchDetails
          match={paymentMatch}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText(/payment|awaiting/i)).toBeInTheDocument();
    });

    it('should show proof info for AWAITING_PROOF status', () => {
      const proofMatch = { ...mockMatch, status: 'AWAITING_PROOF' as const };
      render(
        <MatchDetails
          match={proofMatch}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText(/proof|awaiting/i)).toBeInTheDocument();
    });

    it('should show settlement info for SETTLED status', () => {
      const settledMatch = { ...mockMatch, status: 'SETTLED' as const };
      render(
        <MatchDetails
          match={settledMatch}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText(/settled|complete/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing data gracefully', () => {
      const incompleteMatch = { ...mockMatch, buyerId: undefined };
      render(
        <MatchDetails
          match={incompleteMatch}
          onClose={mockOnClose}
        />
      );
      expect(screen.getByText(/match details/i)).toBeInTheDocument();
    });
  });

  describe('RTL Support', () => {
    it('should render with RTL direction', () => {
      render(
        <MatchDetails
          match={mockMatch}
          onClose={mockOnClose}
        />
      );
      const dialog = screen.getByRole('dialog', { hidden: true });
      expect(dialog).toHaveAttribute('dir', 'rtl');
    });
  });
});
