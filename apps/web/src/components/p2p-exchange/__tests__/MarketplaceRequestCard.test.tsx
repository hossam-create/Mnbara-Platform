import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import { MarketplaceRequestCard } from '../MarketplaceRequestCard';
import { createMockExchangeRequest } from '../../../__tests__/fixtures/mock-data';

describe('MarketplaceRequestCard', () => {
  const mockRequest = createMockExchangeRequest();
  const mockOnAccept = vi.fn();
  const mockOnViewDetails = vi.fn();

  beforeEach(() => {
    mockOnAccept.mockClear();
    mockOnViewDetails.mockClear();
  });

  describe('Rendering', () => {
    it('should render request card', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getByTestId('marketplace-request-card')).toBeInTheDocument();
    });

    it('should display card header', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
    });

    it('should display currency pair', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getByTestId('currency-pair')).toBeInTheDocument();
    });

    it('should display request ID', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getByTestId('request-id')).toBeInTheDocument();
    });

    it('should display trust level badge', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getByTestId('trust-level-badge')).toBeInTheDocument();
    });

    it('should display exchange details', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getByTestId('exchange-details')).toBeInTheDocument();
      expect(screen.getByTestId('offering-section')).toBeInTheDocument();
      expect(screen.getByTestId('requesting-section')).toBeInTheDocument();
    });

    it('should display offering amount', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getByTestId('offering-amount')).toBeInTheDocument();
      expect(screen.getByTestId('offering-currency')).toBeInTheDocument();
    });

    it('should display requesting amount', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getByTestId('requesting-amount')).toBeInTheDocument();
      expect(screen.getByTestId('requesting-currency')).toBeInTheDocument();
    });

    it('should display exchange rate', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getByTestId('rate-section')).toBeInTheDocument();
      expect(screen.getByTestId('exchange-rate')).toBeInTheDocument();
    });

    it('should display fees section', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getByTestId('fees-section')).toBeInTheDocument();
      expect(screen.getByTestId('platform-fee')).toBeInTheDocument();
      expect(screen.getByTestId('security-deposit')).toBeInTheDocument();
    });

    it('should display expiration', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getByTestId('expiration-section')).toBeInTheDocument();
      expect(screen.getByTestId('expiration-date')).toBeInTheDocument();
    });

    it('should display external escrow badge when applicable', () => {
      const requestWithEscrow = createMockExchangeRequest({
        useExternalEscrow: true,
      });
      render(
        <MarketplaceRequestCard
          request={requestWithEscrow}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getByTestId('external-escrow-badge')).toBeInTheDocument();
    });

    it('should not display external escrow badge when not applicable', () => {
      const requestWithoutEscrow = createMockExchangeRequest({
        useExternalEscrow: false,
      });
      render(
        <MarketplaceRequestCard
          request={requestWithoutEscrow}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.queryByTestId('external-escrow-badge')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onAccept when accept button clicked', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
        />
      );

      const acceptButton = screen.getByTestId('accept-button');
      await user.click(acceptButton);

      expect(mockOnAccept).toHaveBeenCalledWith(mockRequest.id);
    });

    it('should call onViewDetails when view details button clicked', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
        />
      );

      const viewDetailsButton = screen.getByTestId('view-details-button');
      await user.click(viewDetailsButton);

      expect(mockOnViewDetails).toHaveBeenCalledWith(mockRequest);
    });

    it('should disable accept button when accepting', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
          isAccepting={true}
        />
      );

      const acceptButton = screen.getByTestId('accept-button');
      expect(acceptButton).toBeDisabled();
    });

    it('should show accepting text when accepting', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
          isAccepting={true}
        />
      );

      expect(screen.getByText('Accepting...')).toBeInTheDocument();
    });
  });

  describe('Actions Section', () => {
    it('should display actions section', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getByTestId('actions-section')).toBeInTheDocument();
    });

    it('should display both action buttons', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getByTestId('accept-button')).toBeInTheDocument();
      expect(screen.getByTestId('view-details-button')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display correct amounts', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getByTestId('offering-amount')).toHaveTextContent(
        parseFloat(mockRequest.fromAmount).toFixed(2)
      );
      expect(screen.getByTestId('requesting-amount')).toHaveTextContent(
        parseFloat(mockRequest.toAmount).toFixed(2)
      );
    });

    it('should display correct exchange rate', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getByTestId('exchange-rate')).toHaveTextContent(
        parseFloat(mockRequest.desiredRate).toFixed(4)
      );
    });

    it('should display correct fees', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onAccept={mockOnAccept}
          onViewDetails={mockOnViewDetails}
        />
      );
      expect(screen.getByTestId('platform-fee')).toBeInTheDocument();
      expect(screen.getByTestId('security-deposit')).toBeInTheDocument();
    });
  });
});
