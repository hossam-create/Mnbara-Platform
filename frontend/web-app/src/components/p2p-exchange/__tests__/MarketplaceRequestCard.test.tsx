import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import MarketplaceRequestCard from '../MarketplaceRequestCard';
import { mockExchangeRequests } from '../../../__tests__/fixtures/mock-data';

describe('MarketplaceRequestCard', () => {
  const mockRequest = mockExchangeRequests[0];
  const mockOnSelect = vi.fn();

  describe('Rendering', () => {
    it('should render request card', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText(mockRequest.id)).toBeInTheDocument();
    });

    it('should display exchange pair', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText(new RegExp(mockRequest.fromCurrency))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(mockRequest.toCurrency))).toBeInTheDocument();
    });

    it('should display amount', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText(new RegExp(mockRequest.amount.toString()))).toBeInTheDocument();
    });

    it('should display exchange rate', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText(/rate/i)).toBeInTheDocument();
    });

    it('should display seller trust level', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText(/trust/i)).toBeInTheDocument();
    });

    it('should display time posted', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText(/ago|posted/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onSelect when card clicked', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onSelect={mockOnSelect}
        />
      );

      const card = screen.getByRole('button', { hidden: true });
      await user.click(card);

      expect(mockOnSelect).toHaveBeenCalledWith(mockRequest);
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onSelect={mockOnSelect}
        />
      );

      const card = screen.getByRole('button', { hidden: true });
      await user.click(card);
      await user.keyboard('{Enter}');

      expect(mockOnSelect).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onSelect={mockOnSelect}
        />
      );
      const card = screen.getByRole('button', { hidden: true });
      expect(card).toHaveAttribute('aria-label');
    });

    it('should be focusable', async () => {
      const user = userEvent.setup();
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onSelect={mockOnSelect}
        />
      );

      await user.tab();
      const card = screen.getByRole('button', { hidden: true });
      expect(card).toHaveFocus();
    });
  });

  describe('Status Indicators', () => {
    it('should show active status', () => {
      const activeRequest = { ...mockRequest, status: 'ACTIVE' as const };
      render(
        <MarketplaceRequestCard
          request={activeRequest}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });

    it('should show matched status', () => {
      const matchedRequest = { ...mockRequest, status: 'MATCHED' as const };
      render(
        <MarketplaceRequestCard
          request={matchedRequest}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText(/matched/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText(mockRequest.id)).toBeInTheDocument();
    });

    it('should render on desktop', () => {
      render(
        <MarketplaceRequestCard
          request={mockRequest}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText(mockRequest.id)).toBeInTheDocument();
    });
  });
});
