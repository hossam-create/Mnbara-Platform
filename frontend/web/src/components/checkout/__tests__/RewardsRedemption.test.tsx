import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RewardsRedemption } from '../RewardsRedemption';
import rewardsService from '../../../services/rewards.service';

// Mock the rewards service
vi.mock('../../../services/rewards.service', () => ({
  default: {
    getRewardsAccount: vi.fn(),
  },
}));

describe('RewardsRedemption', () => {
  const defaultProps = {
    subtotal: 100,
    onApplyDiscount: vi.fn(),
    onRemoveDiscount: vi.fn(),
    appliedDiscount: 0,
    disabled: false,
  };

  const mockAccount = {
    userId: 'test-user',
    points: 5000,
    tier: 'gold' as const,
    lifetimePoints: 10000,
    pointsExpiringSoon: 200,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rewardsService.getRewardsAccount).mockResolvedValue(mockAccount);
  });

  describe('Balance Display', () => {
    it('should display available points balance', async () => {
      render(<RewardsRedemption {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/5,000 pts available/)).toBeInTheDocument();
      });
    });

    it('should display dollar value of points', async () => {
      render(<RewardsRedemption {...defaultProps} />);

      await waitFor(() => {
        // 5000 points = $50 value (100 points = $1)
        expect(screen.getByText(/\$50\.00 value/)).toBeInTheDocument();
      });
    });

    it('should not render when user has insufficient points', async () => {
      vi.mocked(rewardsService.getRewardsAccount).mockResolvedValue({
        ...mockAccount,
        points: 50, // Less than 100 points minimum
      });

      const { container } = render(<RewardsRedemption {...defaultProps} />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('should show loading state initially', () => {
      render(<RewardsRedemption {...defaultProps} />);
      
      // Should show loading skeleton
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Redemption Flow', () => {
    it('should expand panel when clicked', async () => {
      render(<RewardsRedemption {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Use Rewards Points/)).toBeInTheDocument();
      });

      const expandButton = screen.getByText(/Use Rewards Points/).closest('button');
      fireEvent.click(expandButton!);

      expect(screen.getByText(/Convert your points to savings/)).toBeInTheDocument();
    });

    it('should allow selecting points via slider', async () => {
      render(<RewardsRedemption {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Use Rewards Points/)).toBeInTheDocument();
      });

      // Expand the panel
      const expandButton = screen.getByText(/Use Rewards Points/).closest('button');
      fireEvent.click(expandButton!);

      // Find and interact with the slider
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '2000' } });

      // Should show 2000 points = $20
      expect(screen.getByText(/2,000 pts = \$20\.00/)).toBeInTheDocument();
    });

    it('should call onApplyDiscount when applying points', async () => {
      render(<RewardsRedemption {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Use Rewards Points/)).toBeInTheDocument();
      });

      // Expand the panel
      fireEvent.click(screen.getByText(/Use Rewards Points/).closest('button')!);

      // Set points via slider
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '2000' } });

      // Click apply button
      const applyButton = screen.getByText(/Apply \$20\.00 Discount/);
      fireEvent.click(applyButton);

      expect(defaultProps.onApplyDiscount).toHaveBeenCalledWith(20, 2000);
    });

    it('should show applied discount and allow removal', async () => {
      render(<RewardsRedemption {...defaultProps} appliedDiscount={20} />);

      await waitFor(() => {
        expect(screen.getByText(/Use Rewards Points/)).toBeInTheDocument();
      });

      // Should show the applied discount badge
      expect(screen.getByText(/-\$20\.00/)).toBeInTheDocument();

      // Expand and check for remove button
      fireEvent.click(screen.getByText(/Use Rewards Points/).closest('button')!);

      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);

      expect(defaultProps.onRemoveDiscount).toHaveBeenCalled();
    });

    it('should use quick select buttons to set points', async () => {
      render(<RewardsRedemption {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Use Rewards Points/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Use Rewards Points/).closest('button')!);

      // Click Max button
      const maxButton = screen.getByText('Max');
      fireEvent.click(maxButton);

      // Max discount is 50% of $100 subtotal = $50 = 5000 points
      expect(screen.getByText(/5,000 pts = \$50\.00/)).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable interactions when disabled prop is true', async () => {
      render(<RewardsRedemption {...defaultProps} disabled={true} />);

      await waitFor(() => {
        expect(screen.getByText(/Use Rewards Points/)).toBeInTheDocument();
      });

      const expandButton = screen.getByText(/Use Rewards Points/).closest('button');
      expect(expandButton).toBeDisabled();
    });
  });

  describe('Max Discount Calculation', () => {
    it('should limit discount to 50% of subtotal', async () => {
      // User has 10000 points ($100 value) but subtotal is $100
      // Max should be 50% = $50 = 5000 points
      vi.mocked(rewardsService.getRewardsAccount).mockResolvedValue({
        ...mockAccount,
        points: 10000,
      });

      render(<RewardsRedemption {...defaultProps} subtotal={100} />);

      await waitFor(() => {
        expect(screen.getByText(/Use Rewards Points/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Use Rewards Points/).closest('button')!);

      // Max should be 5000 points (50% of $100)
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('max', '5000');
    });

    it('should limit discount to available points when less than 50%', async () => {
      // User has 2000 points ($20 value), subtotal is $100
      // Max should be $20 (limited by points, not 50%)
      vi.mocked(rewardsService.getRewardsAccount).mockResolvedValue({
        ...mockAccount,
        points: 2000,
      });

      render(<RewardsRedemption {...defaultProps} subtotal={100} />);

      await waitFor(() => {
        expect(screen.getByText(/Use Rewards Points/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Use Rewards Points/).closest('button')!);

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('max', '2000');
    });
  });
});
