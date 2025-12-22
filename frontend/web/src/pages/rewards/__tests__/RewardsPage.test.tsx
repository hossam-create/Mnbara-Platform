import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RewardsPage } from '../RewardsPage';
import rewardsService from '../../../services/rewards.service';

// Mock the rewards service
vi.mock('../../../services/rewards.service', () => ({
  default: {
    getRewardsAccount: vi.fn(),
    getWheelPrizes: vi.fn(),
    getDailyChallenges: vi.fn(),
    getStreakInfo: vi.fn(),
    getLeaderboard: vi.fn(),
    getTransactionHistory: vi.fn(),
    getRedemptionOptions: vi.fn(),
    redeemPoints: vi.fn(),
    spinWheel: vi.fn(),
  },
}));

// Mock SpinWheel component
vi.mock('../../../components/gamification/SpinWheel', () => ({
  default: ({ spinsRemaining }: { spinsRemaining: number }) => (
    <div data-testid="spin-wheel">Spin Wheel (Spins: {spinsRemaining})</div>
  ),
}));

describe('RewardsPage', () => {
  const mockAccount = {
    userId: 'test-user',
    points: 8540,
    tier: 'gold' as const,
    lifetimePoints: 25000,
    pointsExpiringSoon: 500,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const mockTransactions = {
    transactions: [
      { id: 't1', type: 'earn' as const, points: 250, description: 'Purchase: iPhone Case', createdAt: new Date().toISOString() },
      { id: 't2', type: 'redeem' as const, points: -500, description: 'Redeemed: 5% Discount', createdAt: new Date().toISOString() },
    ],
    total: 2,
    page: 1,
    totalPages: 1,
  };

  const mockRedemptionOptions = [
    { id: 'r1', name: '5% Off Next Order', description: 'Get 5% discount', pointsCost: 500, type: 'discount' as const, value: 5, icon: '🎟️', available: true },
    { id: 'r2', name: '$10 Gift Card', description: 'Redeem for $10 credit', pointsCost: 2000, type: 'gift_card' as const, value: 10, icon: '💳', available: true },
  ];

  const mockStreak = {
    currentStreak: 3,
    longestStreak: 10,
    lastCheckIn: new Date().toISOString(),
    nextReward: { day: 4, points: 50, claimed: false },
    rewards: [
      { day: 1, points: 10, claimed: true },
      { day: 2, points: 20, claimed: true },
      { day: 3, points: 30, claimed: true },
      { day: 4, points: 50, claimed: false },
      { day: 5, points: 100, claimed: false },
    ],
  };

  const mockLeaderboard = {
    type: 'overall' as const,
    period: 'weekly' as const,
    lastUpdated: new Date().toISOString(),
    entries: [
      { rank: 1, userId: 'u1', name: 'Sarah Connor', role: 'traveler' as const, score: 12500, badge: '🏆', change: 'same' as const },
      { rank: 2, userId: 'me', name: 'You', role: 'buyer' as const, score: 8540, change: 'up' as const },
    ],
    userRank: { rank: 2, userId: 'me', name: 'You', role: 'buyer' as const, score: 8540, change: 'up' as const },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rewardsService.getRewardsAccount).mockResolvedValue(mockAccount);
    vi.mocked(rewardsService.getWheelPrizes).mockResolvedValue([]);
    vi.mocked(rewardsService.getDailyChallenges).mockResolvedValue([]);
    vi.mocked(rewardsService.getStreakInfo).mockResolvedValue(mockStreak);
    vi.mocked(rewardsService.getLeaderboard).mockResolvedValue(mockLeaderboard);
    vi.mocked(rewardsService.getTransactionHistory).mockResolvedValue(mockTransactions);
    vi.mocked(rewardsService.getRedemptionOptions).mockResolvedValue(mockRedemptionOptions);
  });

  describe('Balance Display', () => {
    it('should display user points balance', async () => {
      render(<RewardsPage />);

      await waitFor(() => {
        expect(screen.getByText('8,540')).toBeInTheDocument();
      });
    });

    it('should display user tier', async () => {
      render(<RewardsPage />);

      await waitFor(() => {
        expect(screen.getByText(/gold Member/i)).toBeInTheDocument();
      });
    });

    it('should display lifetime points', async () => {
      render(<RewardsPage />);

      await waitFor(() => {
        expect(screen.getByText('25,000')).toBeInTheDocument();
      });
    });

    it('should display current streak', async () => {
      render(<RewardsPage />);

      await waitFor(() => {
        expect(screen.getByText(/3/)).toBeInTheDocument();
      });
    });

    it('should display expiring points warning', async () => {
      render(<RewardsPage />);

      await waitFor(() => {
        expect(screen.getByText('500')).toBeInTheDocument();
        expect(screen.getByText(/Expiring Soon/i)).toBeInTheDocument();
      });
    });
  });

  describe('Redemption Flow', () => {
    it('should display redemption options in redeem tab', async () => {
      render(<RewardsPage />);

      await waitFor(() => {
        expect(screen.getByText('8,540')).toBeInTheDocument();
      });

      // Click on Redeem tab
      const redeemTab = screen.getByText('🎁 Redeem');
      fireEvent.click(redeemTab);

      await waitFor(() => {
        expect(screen.getByText('5% Off Next Order')).toBeInTheDocument();
        expect(screen.getByText('$10 Gift Card')).toBeInTheDocument();
      });
    });

    it('should show points cost for each redemption option', async () => {
      render(<RewardsPage />);

      await waitFor(() => {
        expect(screen.getByText('8,540')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('🎁 Redeem'));

      await waitFor(() => {
        expect(screen.getByText('500 pts')).toBeInTheDocument();
        expect(screen.getByText('2,000 pts')).toBeInTheDocument();
      });
    });

    it('should call redeemPoints when clicking redeem button', async () => {
      vi.mocked(rewardsService.redeemPoints).mockResolvedValue({
        success: true,
        code: 'REWARD-ABC123',
        message: 'Successfully redeemed!',
        newBalance: 8040,
      });

      render(<RewardsPage />);

      await waitFor(() => {
        expect(screen.getByText('8,540')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('🎁 Redeem'));

      await waitFor(() => {
        expect(screen.getByText('5% Off Next Order')).toBeInTheDocument();
      });

      // Click the first redeem button
      const redeemButtons = screen.getAllByText('Redeem');
      fireEvent.click(redeemButtons[0]);

      await waitFor(() => {
        expect(rewardsService.redeemPoints).toHaveBeenCalledWith('r1');
      });
    });

    it('should display success message after redemption', async () => {
      vi.mocked(rewardsService.redeemPoints).mockResolvedValue({
        success: true,
        code: 'REWARD-ABC123',
        message: 'Successfully redeemed!',
        newBalance: 8040,
      });

      render(<RewardsPage />);

      await waitFor(() => {
        expect(screen.getByText('8,540')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('🎁 Redeem'));

      await waitFor(() => {
        expect(screen.getByText('5% Off Next Order')).toBeInTheDocument();
      });

      const redeemButtons = screen.getAllByText('Redeem');
      fireEvent.click(redeemButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Successfully redeemed!')).toBeInTheDocument();
        expect(screen.getByText(/REWARD-ABC123/)).toBeInTheDocument();
      });
    });

    it('should update balance after successful redemption', async () => {
      vi.mocked(rewardsService.redeemPoints).mockResolvedValue({
        success: true,
        code: 'REWARD-ABC123',
        message: 'Successfully redeemed!',
        newBalance: 8040,
      });

      render(<RewardsPage />);

      await waitFor(() => {
        expect(screen.getByText('8,540')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('🎁 Redeem'));

      await waitFor(() => {
        expect(screen.getByText('5% Off Next Order')).toBeInTheDocument();
      });

      const redeemButtons = screen.getAllByText('Redeem');
      fireEvent.click(redeemButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('8,040')).toBeInTheDocument();
      });
    });

    it('should display error message on failed redemption', async () => {
      vi.mocked(rewardsService.redeemPoints).mockRejectedValue(new Error('Network error'));

      render(<RewardsPage />);

      await waitFor(() => {
        expect(screen.getByText('8,540')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('🎁 Redeem'));

      await waitFor(() => {
        expect(screen.getByText('5% Off Next Order')).toBeInTheDocument();
      });

      const redeemButtons = screen.getAllByText('Redeem');
      fireEvent.click(redeemButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Failed to redeem. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Transaction History', () => {
    it('should display transaction history in history tab', async () => {
      render(<RewardsPage />);

      await waitFor(() => {
        expect(screen.getByText('8,540')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('📜 History'));

      await waitFor(() => {
        expect(screen.getByText('Purchase: iPhone Case')).toBeInTheDocument();
        expect(screen.getByText('Redeemed: 5% Discount')).toBeInTheDocument();
      });
    });

    it('should show earn transactions with positive sign', async () => {
      render(<RewardsPage />);

      await waitFor(() => {
        expect(screen.getByText('8,540')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('📜 History'));

      await waitFor(() => {
        expect(screen.getByText('+250')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between tabs', async () => {
      render(<RewardsPage />);

      await waitFor(() => {
        expect(screen.getByText('8,540')).toBeInTheDocument();
      });

      // Default is play tab
      expect(screen.getByTestId('spin-wheel')).toBeInTheDocument();

      // Switch to leaderboard
      fireEvent.click(screen.getByText('🏆 Leaderboard'));

      await waitFor(() => {
        expect(screen.getByText('Top Earners')).toBeInTheDocument();
      });
    });
  });
});
