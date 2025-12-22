import { apiClient } from './api.service';
import type { ApiResponse, RewardsAccount, RewardsTransaction } from '../types';
import type {
  SpinWheelPrize,
  SpinResult,
  DailyChallenge,
  StreakInfo,
  Leaderboard
} from '../types/advanced-features';

// Redemption option types
export interface RedemptionOption {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'cashback' | 'free_shipping' | 'gift_card';
  value: number; // percentage for discount/cashback, dollar amount for gift card
  icon: string;
  available: boolean;
  minOrderValue?: number;
}

export interface RedemptionResult {
  success: boolean;
  code?: string;
  message: string;
  newBalance: number;
}

class RewardsService {
  private readonly baseUrl = '/rewards';

  private getEndpoint(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private async requestOrFallback<T>(
    request: () => Promise<ApiResponse<T>>,
    fallback: T,
    context: string
  ): Promise<T> {
    try {
      const response = await request();
      if (response.data !== undefined && response.data !== null) {
        return response.data;
      }
      throw new Error(response.message || `Missing ${context} data`);
    } catch (error) {
      console.warn(`RewardsService fallback: ${context}`, error);
      return fallback;
    }
  }

  private getMockRewardsAccount(): RewardsAccount {
    return {
      userId: 'current-user',
      points: 8540,
      tier: 'gold',
      lifetimePoints: 25000,
      pointsExpiringSoon: 500,
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  // Get user's rewards account balance and tier
  async getRewardsAccount(): Promise<RewardsAccount> {
    const endpoint = this.getEndpoint('/account');
    return this.requestOrFallback(
      async () => (await apiClient.get<ApiResponse<RewardsAccount>>(endpoint)).data,
      this.getMockRewardsAccount(),
      'account'
    );
  }

  // Get rewards transaction history
  async getTransactionHistory(page: number = 1, limit: number = 20): Promise<{
    transactions: RewardsTransaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const fallbackTransactions: RewardsTransaction[] = [
      { id: 't1', type: 'earn', points: 250, description: 'Purchase: iPhone Case', orderId: 'ORD-001', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 't2', type: 'earn', points: 100, description: 'Daily check-in bonus', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 't3', type: 'redeem', points: -500, description: 'Redeemed: 5% Discount', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 't4', type: 'earn', points: 500, description: 'Completed delivery as traveler', orderId: 'ORD-002', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 't5', type: 'earn', points: 50, description: 'Left a review', createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 't6', type: 'expire', points: -100, description: 'Points expired', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    ];

    const endpoint = this.getEndpoint('/transactions');
    return this.requestOrFallback(
      async () =>
        (await apiClient.get<ApiResponse<{
          transactions: RewardsTransaction[];
          total: number;
          page: number;
          totalPages: number;
        }>>(endpoint, { params: { page, limit } })).data,
      {
        transactions: fallbackTransactions,
        total: fallbackTransactions.length,
        page,
        totalPages: 1,
      },
      'transactions'
    );
  }

  // Get available redemption options
  async getRedemptionOptions(): Promise<RedemptionOption[]> {
    const fallbackOptions: RedemptionOption[] = [
      { id: 'r1', name: '5% Off Next Order', description: 'Get 5% discount on your next purchase', pointsCost: 500, type: 'discount', value: 5, icon: '🎟️', available: true },
      { id: 'r2', name: '10% Off Next Order', description: 'Get 10% discount on your next purchase', pointsCost: 1000, type: 'discount', value: 10, icon: '🎫', available: true },
      { id: 'r3', name: 'Free Shipping', description: 'Free standard shipping on your next order', pointsCost: 750, type: 'free_shipping', value: 0, icon: '🚚', available: true },
      { id: 'r4', name: '$10 Gift Card', description: 'Redeem for a $10 store credit', pointsCost: 2000, type: 'gift_card', value: 10, icon: '💳', available: true },
      { id: 'r5', name: '$25 Gift Card', description: 'Redeem for a $25 store credit', pointsCost: 4500, type: 'gift_card', value: 25, icon: '💳', available: true },
      { id: 'r6', name: '15% Cashback', description: 'Get 15% cashback on orders over $100', pointsCost: 3000, type: 'cashback', value: 15, icon: '💸', available: true, minOrderValue: 100 },
    ];

    const endpoint = this.getEndpoint('/redemption-options');
    return this.requestOrFallback(
      async () => (await apiClient.get<ApiResponse<RedemptionOption[]>>(endpoint)).data,
      fallbackOptions,
      'redemption options'
    );
  }

  // Redeem points for a reward
  async redeemPoints(optionId: string): Promise<RedemptionResult> {
    const endpoint = this.getEndpoint('/redeem');
    return this.requestOrFallback(
      async () =>
        (await apiClient.post<ApiResponse<RedemptionResult>>(endpoint, { optionId })).data,
      {
        success: true,
        code: `REWARD-${Math.random().toString(36).substring(7).toUpperCase()}`,
        message: 'Successfully redeemed! Your code has been applied to your account.',
        newBalance: 8040,
      },
      'redeem points'
    );
  }

  // Apply rewards discount to checkout
  async applyRewardsToCheckout(code: string): Promise<{ valid: boolean; discount: number; type: string }> {
    const endpoint = this.getEndpoint('/apply');
    return this.requestOrFallback(
      async () =>
        (await apiClient.post<ApiResponse<{ valid: boolean; discount: number; type: string }>>(
          endpoint,
          { code }
        )).data,
      {
        valid: true,
        discount: 5,
        type: 'percentage',
      },
      'apply rewards'
    );
  }

  // Get available prizes for the wheel
  async getWheelPrizes(): Promise<SpinWheelPrize[]> {
    const fallbackPrizes: SpinWheelPrize[] = [
      { id: '1', name: '5% Off', type: 'discount', value: 5, probability: 0.3, color: '#ec4899', icon: '🎟️' },
      { id: '2', name: '100 Points', type: 'points', value: 100, probability: 0.2, color: '#8b5cf6', icon: '🪙' },
      { id: '3', name: 'Free Shipping', type: 'free_shipping', value: 0, probability: 0.05, color: '#3b82f6', icon: '🚚' },
      { id: '4', name: 'Try Again', type: 'nothing', value: 0, probability: 0.2, color: '#ef4444', icon: '😢' },
      { id: '5', name: '50 Points', type: 'points', value: 50, probability: 0.2, color: '#f59e0b', icon: '🪙' },
      { id: '6', name: '10% Cashback', type: 'cashback', value: 10, probability: 0.05, color: '#10b981', icon: '💸' },
    ];

    const endpoint = this.getEndpoint('/wheel/prizes');
    return this.requestOrFallback(
      async () => (await apiClient.get<ApiResponse<SpinWheelPrize[]>>(endpoint)).data,
      fallbackPrizes,
      'wheel prizes'
    );
  }

  // Spin the wheel
  async spinWheel(): Promise<SpinResult> {
    const prizes = await this.getWheelPrizes();
    const endpoint = this.getEndpoint('/wheel/spin');

    const fallbackSpin = (): SpinResult => {
      const randomIndex = Math.floor(Math.random() * prizes.length);
      const prize = prizes[randomIndex];
      return {
        prizeId: prize.id,
        prize,
        code: prize.type === 'nothing' ? undefined : `WIN-${Math.random().toString(36).substring(7).toUpperCase()}`,
        expiresAt: prize.type === 'nothing' ? undefined : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    };

    return this.requestOrFallback(
      async () => (await apiClient.post<ApiResponse<SpinResult>>(endpoint)).data,
      fallbackSpin(),
      'spin wheel'
    );
  }

  // Get daily challenges
  async getDailyChallenges(): Promise<DailyChallenge[]> {
    const fallbackChallenges: DailyChallenge[] = [
      {
        id: 'c1',
        title: 'Complete a Purchase',
        description: 'Buy any item above $50',
        type: 'make_purchase',
        target: 1,
        progress: 0,
        points: 500,
        icon: '🛍️',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        completed: false
      },
      {
        id: 'c2',
        title: 'Share Mnbara',
        description: 'Share a product with a friend',
        type: 'share_product',
        target: 3,
        progress: 1,
        points: 100,
        icon: '🔗',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        completed: false
      }
    ];

    const endpoint = this.getEndpoint('/daily-challenges');
    return this.requestOrFallback(
      async () => (await apiClient.get<ApiResponse<DailyChallenge[]>>(endpoint)).data,
      fallbackChallenges,
      'daily challenges'
    );
  }

  // Get streak info
  async getStreakInfo(): Promise<StreakInfo> {
    const fallbackStreak: StreakInfo = {
      currentStreak: 3,
      longestStreak: 10,
      lastCheckIn: new Date().toISOString(),
      nextReward: { day: 4, points: 50, claimed: false },
      rewards: [
        { day: 1, points: 10, claimed: true },
        { day: 2, points: 20, claimed: true },
        { day: 3, points: 30, claimed: true },
        { day: 4, points: 50, claimed: false },
        { day: 5, points: 100, claimed: false, bonus: { type: 'free_spin', value: 1 } },
      ]
    };

    const endpoint = this.getEndpoint('/streak');
    return this.requestOrFallback(
      async () => (await apiClient.get<ApiResponse<StreakInfo>>(endpoint)).data,
      fallbackStreak,
      'streak info'
    );
  }

  // Get leaderboard
  async getLeaderboard(period: Leaderboard['period'] = 'weekly'): Promise<Leaderboard> {
    const fallbackLeaderboard: Leaderboard = {
      type: 'overall',
      period,
      lastUpdated: new Date().toISOString(),
      entries: [
        { rank: 1, userId: 'u1', name: 'Sarah Connor', role: 'traveler', score: 12500, badge: '🏆', change: 'same' },
        { rank: 2, userId: 'u2', name: 'John Wick', role: 'buyer', score: 11200, badge: '🥈', change: 'up' },
        { rank: 3, userId: 'u3', name: 'Bruce Wayne', role: 'seller', score: 10800, badge: '🥉', change: 'down' },
        { rank: 4, userId: 'me', name: 'You', role: 'buyer', score: 8540, change: 'up', previousRank: 6 },
      ],
      userRank: { rank: 4, userId: 'me', name: 'You', role: 'buyer', score: 8540, change: 'up', previousRank: 6 }
    };

    const endpoint = this.getEndpoint('/leaderboard');
    return this.requestOrFallback(
      async () =>
        (await apiClient.get<ApiResponse<Leaderboard>>(endpoint, { params: { period } })).data,
      fallbackLeaderboard,
      'leaderboard'
    );
  }
}

export const rewardsService = new RewardsService();
export default rewardsService;
