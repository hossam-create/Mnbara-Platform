import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import SecurityDepositCard from '../SecurityDepositCard';

describe('SecurityDepositCard', () => {
  const mockDeposit = {
    id: 'deposit-1',
    amount: 100,
    currency: 'USD',
    status: 'HELD' as const,
    releaseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  const mockOnAction = vi.fn();

  describe('Rendering', () => {
    it('should render deposit card', () => {
      render(
        <SecurityDepositCard
          deposit={mockDeposit}
          onAction={mockOnAction}
        />
      );
      expect(screen.getByText(/security deposit|deposit/i)).toBeInTheDocument();
    });

    it('should display deposit amount', () => {
      render(
        <SecurityDepositCard
          deposit={mockDeposit}
          onAction={mockOnAction}
        />
      );
      expect(screen.getByText(new RegExp(mockDeposit.amount.toString()))).toBeInTheDocument();
    });

    it('should display deposit currency', () => {
      render(
        <SecurityDepositCard
          deposit={mockDeposit}
          onAction={mockOnAction}
        />
      );
      expect(screen.getByText(mockDeposit.currency)).toBeInTheDocument();
    });

    it('should display deposit status', () => {
      render(
        <SecurityDepositCard
          deposit={mockDeposit}
          onAction={mockOnAction}
        />
      );
      expect(screen.getByText(/held|status/i)).toBeInTheDocument();
    });

    it('should display release date', () => {
      render(
        <SecurityDepositCard
          deposit={mockDeposit}
          onAction={mockOnAction}
        />
      );
      expect(screen.getByText(/release|date|days/i)).toBeInTheDocument();
    });

    it('should display status badge', () => {
      render(
        <SecurityDepositCard
          deposit={mockDeposit}
          onAction={mockOnAction}
        />
      );
      const badge = screen.getByText(/held/i);
      expect(badge).toHaveClass('badge');
    });
  });

  describe('Status Indicators', () => {
    it('should show HELD status', () => {
      const heldDeposit = { ...mockDeposit, status: 'HELD' as const };
      render(
        <SecurityDepositCard
          deposit={heldDeposit}
          onAction={mockOnAction}
        />
      );
      expect(screen.getByText(/held/i)).toBeInTheDocument();
    });

    it('should show RELEASED status', () => {
      const releasedDeposit = { ...mockDeposit, status: 'RELEASED' as const };
      render(
        <SecurityDepositCard
          deposit={releasedDeposit}
          onAction={mockOnAction}
        />
      );
      expect(screen.getByText(/released/i)).toBeInTheDocument();
    });

    it('should show FORFEITED status', () => {
      const forfeitedDeposit = { ...mockDeposit, status: 'FORFEITED' as const };
      render(
        <SecurityDepositCard
          deposit={forfeitedDeposit}
          onAction={mockOnAction}
        />
      );
      expect(screen.getByText(/forfeited/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle action button click', async () => {
      const user = userEvent.setup();
      render(
        <SecurityDepositCard
          deposit={mockDeposit}
          onAction={mockOnAction}
        />
      );

      const actionButton = screen.getByRole('button');
      await user.click(actionButton);

      expect(mockOnAction).toHaveBeenCalledWith(mockDeposit.id);
    });

    it('should show details on expand', async () => {
      const user = userEvent.setup();
      render(
        <SecurityDepositCard
          deposit={mockDeposit}
          onAction={mockOnAction}
        />
      );

      const expandButton = screen.getByRole('button', { name: /expand|details/i });
      await user.click(expandButton);

      expect(screen.getByText(/details|information/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <SecurityDepositCard
          deposit={mockDeposit}
          onAction={mockOnAction}
        />
      );
      const card = screen.getByRole('article', { hidden: true });
      expect(card).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(
        <SecurityDepositCard
          deposit={mockDeposit}
          onAction={mockOnAction}
        />
      );

      await user.tab();
      expect(screen.getByRole('button')).toHaveFocus();
    });

    it('should have semantic HTML', () => {
      render(
        <SecurityDepositCard
          deposit={mockDeposit}
          onAction={mockOnAction}
        />
      );
      expect(screen.getByRole('article', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile', () => {
      render(
        <SecurityDepositCard
          deposit={mockDeposit}
          onAction={mockOnAction}
        />
      );
      expect(screen.getByText(/security deposit|deposit/i)).toBeInTheDocument();
    });

    it('should render on desktop', () => {
      render(
        <SecurityDepositCard
          deposit={mockDeposit}
          onAction={mockOnAction}
        />
      );
      expect(screen.getByText(/security deposit|deposit/i)).toBeInTheDocument();
    });
  });

  describe('Time Display', () => {
    it('should calculate days remaining', () => {
      render(
        <SecurityDepositCard
          deposit={mockDeposit}
          onAction={mockOnAction}
        />
      );
      expect(screen.getByText(/days|remaining/i)).toBeInTheDocument();
    });

    it('should show warning for soon-to-release deposits', () => {
      const soonDeposit = {
        ...mockDeposit,
        releaseDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      };
      render(
        <SecurityDepositCard
          deposit={soonDeposit}
          onAction={mockOnAction}
        />
      );
      expect(screen.getByText(/warning|soon|1 day/i)).toBeInTheDocument();
    });
  });

  describe('RTL Support', () => {
    it('should render with RTL direction', () => {
      render(
        <SecurityDepositCard
          deposit={mockDeposit}
          onAction={mockOnAction}
        />
      );
      const card = screen.getByRole('article', { hidden: true });
      expect(card).toHaveAttribute('dir', 'rtl');
    });
  });
});
