/**
 * Role-based API Service Integration
 * Provides real backend API calls with proper authentication and error handling
 * Every visible number maps to backend response
 * Every action has API call + response handling
 * Error states handled (403 / 409 / 500)
 */

import { apiService } from './api.service';
import { toast } from 'react-hot-toast';

/**
 * Admin Dashboard API Service
 * Provides admin-specific data with proper error handling
 */
export const adminDashboardService = {
  /**
   * Get admin dashboard statistics
   * Maps directly to backend analytics endpoints
   */
  getDashboardStats: async (period: string = '30d') => {
    try {
      // Fetch from real backend endpoints
      const [overview, userAnalytics, orderAnalytics] = await Promise.all([
        apiService.analytics.getOverview(period),
        apiService.analytics.getUserAnalytics(period),
        apiService.analytics.getOrderAnalytics(period)
      ]);

      // Map backend response to frontend format
      return {
        success: true,
        data: {
          totalUsers: overview.data.activeUsers || 0,
          activeUsers: userAnalytics.data.activeUsers || 0,
          totalOrders: overview.data.totalOrders || 0,
          revenue: overview.data.revenue || 0,
          avgOrderValue: overview.data.avgOrderValue || 0,
          userGrowth: overview.data.userGrowth || '0%',
          orderGrowth: overview.data.orderGrowth || '0%',
          period
        }
      };
    } catch (error: any) {
      console.error('Admin dashboard API error:', error);
      
      // Handle specific error codes
      if (error.response?.status === 403) {
        toast.error('Admin access required for dashboard statistics');
        return {
          success: false,
          error: 'Access denied. Admin privileges required.',
          code: 403
        };
      } else if (error.response?.status === 500) {
        toast.error('Server error while loading dashboard statistics');
        return {
          success: false,
          error: 'Server error. Please try again later.',
          code: 500
        };
      } else if (error.response?.status === 409) {
        toast.error('Conflict while loading dashboard data');
        return {
          success: false,
          error: 'Data conflict. Please refresh and try again.',
          code: 409
        };
      } else {
        toast.error('Network error while loading dashboard');
        return {
          success: false,
          error: 'Network error. Please check your connection.',
          code: error.response?.status || 0
        };
      }
    }
  },

  /**
   * Get user management data
   */
  getUserManagementData: async (params: {
    page?: number;
    limit?: number;
    role?: string;
    kycStatus?: string;
  } = {}) => {
    try {
      const response = await apiService.admin.getAllUsers(params);
      
      return {
        success: true,
        data: {
          users: response.data.users || [],
          total: response.data.total || 0,
          page: params.page || 1,
          limit: params.limit || 20
        }
      };
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Admin access required for user management');
        return { success: false, error: 'Access denied', code: 403 };
      }
      return { success: false, error: 'Failed to load users', code: error.response?.status || 0 };
    }
  }
};

/**
 * Operations Dashboard API Service
 * Provides operations-specific data with proper error handling
 */
export const opsDashboardService = {
  /**
   * Get escrow statistics from backend
   */
  getEscrowStats: async () => {
    try {
      // Fetch from real backend endpoints
      const [escrows, totals] = await Promise.all([
        apiService.admin.getAllEscrows({ limit: 100 }),
        apiService.admin.getEscrowTotals()
      ]);

      // Calculate statistics from real backend data
      const totalEscrow = escrows.data.reduce((sum: number, escrow: any) => {
        return sum + (escrow.amount || 0);
      }, 0);

      const pendingEscrow = escrows.data
        .filter((e: any) => e.status === 'PENDING')
        .reduce((sum: number, escrow: any) => sum + (escrow.amount || 0), 0);

      const releasedEscrow = escrows.data
        .filter((e: any) => e.status === 'RELEASED')
        .reduce((sum: number, escrow: any) => sum + (escrow.amount || 0), 0);

      const disputeEscrow = escrows.data
        .filter((e: any) => e.status === 'DISPUTED')
        .reduce((sum: number, escrow: any) => sum + (escrow.amount || 0), 0);

      return {
        success: true,
        data: {
          totalEscrow,
          pendingEscrow,
          releasedEscrow,
          disputeEscrow,
          processingFees: totals.data.processingFees || 0,
          pendingRefunds: totals.data.pendingRefunds || 0
        }
      };
    } catch (error: any) {
      console.error('Ops dashboard API error:', error);
      
      if (error.response?.status === 403) {
        toast.error('Operations access required for financial data');
        return { success: false, error: 'Access denied. Operations privileges required.', code: 403 };
      } else if (error.response?.status === 500) {
        toast.error('Server error while loading financial statistics');
        return { success: false, error: 'Server error. Please try again later.', code: 500 };
      } else {
        toast.error('Network error while loading operations data');
        return { success: false, error: 'Network error. Please check your connection.', code: error.response?.status || 0 };
      }
    }
  },

  /**
   * Get dispute statistics from backend
   */
  getDisputeStats: async () => {
    try {
      const response = await apiService.admin.getAllDisputes({
        status: ['PENDING', 'IN_PROGRESS', 'RESOLVED'],
        limit: 100
      });

      const disputes = response.data.disputes || [];

      const activeDisputes = disputes.filter((d: any) => 
        d.status === 'PENDING' || d.status === 'IN_PROGRESS'
      ).length;

      const resolvedToday = disputes.filter((d: any) => {
        const resolvedDate = new Date(d.resolvedAt || 0);
        const today = new Date();
        return resolvedDate.toDateString() === today.toDateString();
      }).length;

      const escalationQueue = disputes.filter((d: any) => d.escalated).length;

      return {
        success: true,
        data: {
          activeDisputes,
          pendingResolution: activeDisputes,
          resolvedToday,
          escalationQueue
        }
      };
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Operations access required for dispute data');
        return { success: false, error: 'Access denied', code: 403 };
      }
      return { success: false, error: 'Failed to load disputes', code: error.response?.status || 0 };
    }
  }
};

/**
 * User Dashboard API Service
 * Provides user-specific data with proper error handling
 */
export const userDashboardService = {
  /**
   * Get user dashboard statistics
   */
  getUserStats: async (userId: string) => {
    try {
      const [orders, wallet] = await Promise.all([
        apiService.orders.getUserOrders(userId, { limit: 10 }),
        apiService.wallet.getUserWallet(userId)
      ]);

      return {
        success: true,
        data: {
          recentOrders: orders.data.orders || [],
          totalOrders: orders.data.total || 0,
          walletBalance: wallet.data.balance || 0,
          currency: wallet.data.currency || 'USD'
        }
      };
    } catch (error: any) {
      console.error('User dashboard API error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Please login to view your dashboard');
        return { success: false, error: 'Authentication required', code: 401 };
      } else if (error.response?.status === 500) {
        toast.error('Server error while loading user data');
        return { success: false, error: 'Server error', code: 500 };
      } else {
        return { success: false, error: 'Failed to load user data', code: error.response?.status || 0 };
      }
    }
  }
};

export default {
  adminDashboardService,
  opsDashboardService,
  userDashboardService
};