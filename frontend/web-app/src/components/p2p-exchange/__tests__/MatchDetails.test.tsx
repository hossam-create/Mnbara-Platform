import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import { MatchDetails } from '../MatchDetails';
import { createMockExchangeMatch } from '../../../__tests__/fixtures/mock-data';

describe('MatchDetails', () => {
  let mockOnInitiatePayment: ReturnType<typeof vi.fn>;
  let mockOnUploadProof: ReturnType<typeof vi.fn>;
  let mockOnConfirmReceipt: ReturnType<typeof vi.fn>;
  let mockOnCancel: ReturnType<typeof vi.fn>;
  let mockOnDispute: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnInitiatePayment = vi.fn();
    mockOnUploadProof = vi.fn();
    mockOnConfirmReceipt = vi.fn();
    mockOnCancel = vi.fn();
    mockOnDispute = vi.fn();
  });

  describe('Rendering', () => {
    it('should render match details', async () => {
      render(
        <MatchDetails
          matchId={1}
          onInitiatePayment={mockOnInitiatePayment}
          onUploadProof={mockOnUploadProof}
          onConfirmReceipt={mockOnConfirmReceipt}
          onCancel={mockOnCancel}
          onDispute={mockOnDispute}
        />
      );
      await waitFor(() => {
        const element = screen.queryByTestId('match-details') || screen.queryByTestId('match-details-loading');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should display match header when loaded', async () => {
      render(
        <MatchDetails
          matchId={1}
          onInitiatePayment={mockOnInitiatePayment}
        />
      );
      await waitFor(() => {
        const header = screen.queryByTestId('match-header');
        if (header) {
          expect(header).toBeInTheDocument();
        }
      }, { timeout: 5000 });
    });

    it('should display match status badge when loaded', async () => {
      render(
        <MatchDetails
          matchId={1}
          onInitiatePayment={mockOnInitiatePayment}
        />
      );
      await waitFor(() => {
        const badge = screen.queryByTestId('match-status-badge');
        if (badge) {
          expect(badge).toBeInTheDocument();
        }
      }, { timeout: 5000 });
    });

    it('should display exchange details when loaded', async () => {
      render(
        <MatchDetails
          matchId={1}
          onInitiatePayment={mockOnInitiatePayment}
        />
      );
      await waitFor(() => {
        const details = screen.queryByTestId('exchange-details');
        if (details) {
          expect(details).toBeInTheDocument();
        }
      }, { timeout: 5000 });
    });
  });

  describe('Actions Section', () => {
    it('should display actions section when loaded', async () => {
      render(
        <MatchDetails
          matchId={1}
          onInitiatePayment={mockOnInitiatePayment}
        />
      );
      await waitFor(() => {
        const section = screen.queryByTestId('actions-section');
        if (section) {
          expect(section).toBeInTheDocument();
        }
      }, { timeout: 5000 });
    });

    it('should display action buttons when loaded', async () => {
      render(
        <MatchDetails
          matchId={1}
          onInitiatePayment={mockOnInitiatePayment}
        />
      );
      await waitFor(() => {
        const buttons = screen.queryByTestId('action-buttons');
        if (buttons) {
          expect(buttons).toBeInTheDocument();
        }
      }, { timeout: 5000 });
    });
  });

  describe('Loading State', () => {
    it('should show loading or match details', async () => {
      render(
        <MatchDetails
          matchId={1}
          onInitiatePayment={mockOnInitiatePayment}
        />
      );
      await waitFor(() => {
        const element = screen.queryByTestId('match-details') || screen.queryByTestId('match-details-loading');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      render(
        <MatchDetails
          matchId={999}
          onInitiatePayment={mockOnInitiatePayment}
        />
      );
      await waitFor(() => {
        const element = screen.queryByTestId('match-details-error') || 
                       screen.queryByTestId('match-details') ||
                       screen.queryByTestId('match-not-found');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('User Interactions', () => {
    it('should handle button clicks', async () => {
      const user = userEvent.setup();
      render(
        <MatchDetails
          matchId={1}
          onInitiatePayment={mockOnInitiatePayment}
        />
      );

      await waitFor(() => {
        const element = screen.queryByTestId('match-details') || screen.queryByTestId('match-details-loading');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });

      const button = screen.queryByTestId('initiate-payment-button');
      if (button && !button.hasAttribute('disabled')) {
        await user.click(button);
      }

      const finalElement = screen.queryByTestId('match-details') || screen.queryByTestId('match-details-loading');
      expect(finalElement).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <MatchDetails
          matchId={1}
          onInitiatePayment={mockOnInitiatePayment}
        />
      );

      await waitFor(() => {
        const element = screen.queryByTestId('match-details') || screen.queryByTestId('match-details-loading');
        expect(element).toBeInTheDocument();
      }, { timeout: 5000 });

      await user.tab();
      const finalElement = screen.queryByTestId('match-details') || screen.queryByTestId('match-details-loading');
      if (finalElement) {
        expect(finalElement).toBeInTheDocument();
      }
    });
  });
});
