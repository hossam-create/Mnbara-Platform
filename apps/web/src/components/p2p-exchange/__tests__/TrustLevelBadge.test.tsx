import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../../../__tests__/utils/test-utils';
import { TrustLevelBadge } from '../TrustLevelBadge';
import type { TrustLevel } from '../../../types/p2p-exchange.types';

describe('TrustLevelBadge', () => {
  describe('Rendering', () => {
    it('should render trust level badge', () => {
      render(<TrustLevelBadge level={3} />);
      expect(screen.getByTestId('trust-level-badge')).toBeInTheDocument();
    });

    it('should render badge content', () => {
      render(<TrustLevelBadge level={3} />);
      expect(screen.getByTestId('trust-level-badge-content')).toBeInTheDocument();
    });

    it('should render trust level icon', () => {
      render(<TrustLevelBadge level={3} />);
      expect(screen.getByTestId('trust-level-icon')).toBeInTheDocument();
    });

    it('should render trust level text', () => {
      render(<TrustLevelBadge level={3} />);
      expect(screen.getByTestId('trust-level-text')).toBeInTheDocument();
    });
  });

  describe('Trust Level Display', () => {
    it('should display level 0 as New', () => {
      render(<TrustLevelBadge level={0} />);
      expect(screen.getByText(/Level 0 - New/)).toBeInTheDocument();
    });

    it('should display level 1 as Beginner', () => {
      render(<TrustLevelBadge level={1} />);
      expect(screen.getByText(/Level 1 - Beginner/)).toBeInTheDocument();
    });

    it('should display level 2 as Intermediate', () => {
      render(<TrustLevelBadge level={2} />);
      expect(screen.getByText(/Level 2 - Intermediate/)).toBeInTheDocument();
    });

    it('should display level 3 as Advanced', () => {
      render(<TrustLevelBadge level={3} />);
      expect(screen.getByText(/Level 3 - Advanced/)).toBeInTheDocument();
    });

    it('should display level 4 as Expert', () => {
      render(<TrustLevelBadge level={4} />);
      expect(screen.getByText(/Level 4 - Expert/)).toBeInTheDocument();
    });

    it('should display level 5 as Elite', () => {
      render(<TrustLevelBadge level={5} />);
      expect(screen.getByText(/Level 5 - Elite/)).toBeInTheDocument();
    });

    it('should use trustLevel prop when provided', () => {
      const trustLevel: TrustLevel = {
        level: 4,
        maxTransactionAmount: 10000,
        successfulExchanges: 50,
        totalVolume: 500000,
        disputeCount: 0,
      };
      render(<TrustLevelBadge trustLevel={trustLevel} />);
      expect(screen.getByText(/Level 4 - Expert/)).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should render small size', () => {
      render(<TrustLevelBadge level={3} size="sm" />);
      expect(screen.getByTestId('trust-level-badge-content')).toHaveClass('px-2', 'py-1', 'text-xs');
    });

    it('should render medium size (default)', () => {
      render(<TrustLevelBadge level={3} size="md" />);
      expect(screen.getByTestId('trust-level-badge-content')).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('should render large size', () => {
      render(<TrustLevelBadge level={3} size="lg" />);
      expect(screen.getByTestId('trust-level-badge-content')).toHaveClass('px-4', 'py-2', 'text-base');
    });
  });

  describe('Details Display', () => {
    it('should not show details by default', () => {
      const trustLevel: TrustLevel = {
        level: 3,
        maxTransactionAmount: 5000,
        successfulExchanges: 25,
        totalVolume: 250000,
        disputeCount: 0,
      };
      render(<TrustLevelBadge trustLevel={trustLevel} showDetails={false} />);
      expect(screen.queryByTestId('trust-level-details')).not.toBeInTheDocument();
    });

    it('should show details when showDetails is true', () => {
      const trustLevel: TrustLevel = {
        level: 3,
        maxTransactionAmount: 5000,
        successfulExchanges: 25,
        totalVolume: 250000,
        disputeCount: 0,
      };
      render(<TrustLevelBadge trustLevel={trustLevel} showDetails={true} />);
      expect(screen.getByTestId('trust-level-details')).toBeInTheDocument();
    });

    it('should display max transaction amount', () => {
      const trustLevel: TrustLevel = {
        level: 3,
        maxTransactionAmount: 5000,
        successfulExchanges: 25,
        totalVolume: 250000,
        disputeCount: 0,
      };
      render(<TrustLevelBadge trustLevel={trustLevel} showDetails={true} />);
      expect(screen.getByTestId('max-transaction-detail')).toBeInTheDocument();
      expect(screen.getByTestId('max-transaction-amount')).toHaveTextContent('5000');
    });

    it('should display successful exchanges count', () => {
      const trustLevel: TrustLevel = {
        level: 3,
        maxTransactionAmount: 5000,
        successfulExchanges: 25,
        totalVolume: 250000,
        disputeCount: 0,
      };
      render(<TrustLevelBadge trustLevel={trustLevel} showDetails={true} />);
      expect(screen.getByTestId('successful-exchanges-detail')).toBeInTheDocument();
      expect(screen.getByTestId('successful-exchanges-count')).toHaveTextContent('25');
    });

    it('should display total volume', () => {
      const trustLevel: TrustLevel = {
        level: 3,
        maxTransactionAmount: 5000,
        successfulExchanges: 25,
        totalVolume: 250000,
        disputeCount: 0,
      };
      render(<TrustLevelBadge trustLevel={trustLevel} showDetails={true} />);
      expect(screen.getByTestId('total-volume-detail')).toBeInTheDocument();
      expect(screen.getByTestId('total-volume-amount')).toHaveTextContent('250000');
    });

    it('should display disputes when count is greater than 0', () => {
      const trustLevel: TrustLevel = {
        level: 3,
        maxTransactionAmount: 5000,
        successfulExchanges: 25,
        totalVolume: 250000,
        disputeCount: 2,
      };
      render(<TrustLevelBadge trustLevel={trustLevel} showDetails={true} />);
      expect(screen.getByTestId('disputes-detail')).toBeInTheDocument();
      expect(screen.getByTestId('disputes-count')).toHaveTextContent('2');
    });

    it('should not display disputes when count is 0', () => {
      const trustLevel: TrustLevel = {
        level: 3,
        maxTransactionAmount: 5000,
        successfulExchanges: 25,
        totalVolume: 250000,
        disputeCount: 0,
      };
      render(<TrustLevelBadge trustLevel={trustLevel} showDetails={true} />);
      expect(screen.queryByTestId('disputes-detail')).not.toBeInTheDocument();
    });
  });

  describe('Color Variants', () => {
    it('should have gray color for level 0', () => {
      render(<TrustLevelBadge level={0} />);
      const badge = screen.getByTestId('trust-level-badge-content');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800', 'border-gray-300');
    });

    it('should have orange color for level 1', () => {
      render(<TrustLevelBadge level={1} />);
      const badge = screen.getByTestId('trust-level-badge-content');
      expect(badge).toHaveClass('bg-orange-100', 'text-orange-800', 'border-orange-300');
    });

    it('should have yellow color for level 2', () => {
      render(<TrustLevelBadge level={2} />);
      const badge = screen.getByTestId('trust-level-badge-content');
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-300');
    });

    it('should have green color for level 3', () => {
      render(<TrustLevelBadge level={3} />);
      const badge = screen.getByTestId('trust-level-badge-content');
      expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-300');
    });

    it('should have blue color for level 4', () => {
      render(<TrustLevelBadge level={4} />);
      const badge = screen.getByTestId('trust-level-badge-content');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800', 'border-blue-300');
    });

    it('should have purple color for level 5', () => {
      render(<TrustLevelBadge level={5} />);
      const badge = screen.getByTestId('trust-level-badge-content');
      expect(badge).toHaveClass('bg-purple-100', 'text-purple-800', 'border-purple-300');
    });
  });

  describe('Default Values', () => {
    it('should default to level 0 when no level provided', () => {
      render(<TrustLevelBadge />);
      expect(screen.getByText(/Level 0 - New/)).toBeInTheDocument();
    });

    it('should default to medium size', () => {
      render(<TrustLevelBadge level={3} />);
      expect(screen.getByTestId('trust-level-badge-content')).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('should default to not showing details', () => {
      const trustLevel: TrustLevel = {
        level: 3,
        maxTransactionAmount: 5000,
        successfulExchanges: 25,
        totalVolume: 250000,
        disputeCount: 0,
      };
      render(<TrustLevelBadge trustLevel={trustLevel} />);
      expect(screen.queryByTestId('trust-level-details')).not.toBeInTheDocument();
    });
  });
});
