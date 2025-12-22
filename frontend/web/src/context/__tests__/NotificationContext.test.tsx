import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { NotificationProvider, useNotifications } from '../NotificationContext';
import { notificationService } from '../../services/notification.service';
import { AuthProvider } from '../AuthContext';
import type { ReactNode } from 'react';
import type { Notification } from '../../types';

// Mock dependencies
vi.mock('../../services/notification.service', () => ({
  notificationService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    onNotification: vi.fn(() => vi.fn()),
    fetchNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    getUnreadCount: vi.fn(),
  },
}));

vi.mock('../../services/api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    getProfile: vi.fn().mockResolvedValue({ data: { data: null } }),
  },
}));

vi.mock('../../services/websocket', () => ({
  wsService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
  },
}));

// Mock notification data
const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'order_update',
    title: 'Order Shipped',
    message: 'Your order #123 has been shipped',
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    type: 'bid_outbid',
    title: 'You were outbid',
    message: 'Someone placed a higher bid on Vintage Watch',
    read: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

// Test wrapper with auth context
const createWrapper = (isAuthenticated: boolean) => {
  return ({ children }: { children: ReactNode }) => {
    // Set up localStorage for authenticated state
    if (isAuthenticated) {
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('user_data', JSON.stringify({ id: 'user-1', email: 'test@test.com' }));
    }
    return (
      <AuthProvider>
        <NotificationProvider>{children}</NotificationProvider>
      </AuthProvider>
    );
  };
};

describe('NotificationContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    (notificationService.fetchNotifications as Mock).mockResolvedValue({
      items: mockNotifications,
      page: 1,
      totalPages: 1,
    });
    (notificationService.getUnreadCount as Mock).mockResolvedValue(1);
  });

  describe('Initialization', () => {
    it('should initialize with empty notifications when not authenticated', async () => {
      const wrapper = createWrapper(false);
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
      expect(notificationService.connect).not.toHaveBeenCalled();
    });
  });

  describe('Notification Display', () => {
    it('should display notifications from the service', async () => {
      const wrapper = createWrapper(true);
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications.length).toBeGreaterThan(0);
      });

      expect(result.current.notifications).toEqual(mockNotifications);
    });

    it('should display correct unread count', async () => {
      const wrapper = createWrapper(true);
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(1);
      });
    });
  });

  describe('Mark as Read', () => {
    it('should mark a notification as read', async () => {
      (notificationService.markAsRead as Mock).mockResolvedValue(undefined);
      const wrapper = createWrapper(true);
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.markAsRead('notif-1');
      });

      expect(notificationService.markAsRead).toHaveBeenCalledWith('notif-1');
      expect(result.current.notifications.find(n => n.id === 'notif-1')?.read).toBe(true);
    });

    it('should mark all notifications as read', async () => {
      (notificationService.markAllAsRead as Mock).mockResolvedValue(undefined);
      const wrapper = createWrapper(true);
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.markAllAsRead();
      });

      expect(notificationService.markAllAsRead).toHaveBeenCalled();
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.notifications.every(n => n.read)).toBe(true);
    });
  });

  describe('Add Notification', () => {
    it('should add a new notification to the list', async () => {
      const wrapper = createWrapper(true);
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.notifications.length).toBeGreaterThan(0);
      });

      const newNotification: Notification = {
        id: 'notif-3',
        type: 'bid_won',
        title: 'You won!',
        message: 'Congratulations! You won the auction',
        read: false,
        createdAt: new Date().toISOString(),
      };

      act(() => {
        result.current.addNotification(newNotification);
      });

      expect(result.current.notifications[0]).toEqual(newNotification);
      expect(result.current.unreadCount).toBe(2);
    });
  });

  describe('Load More', () => {
    it('should load more notifications when available', async () => {
      (notificationService.fetchNotifications as Mock)
        .mockResolvedValueOnce({
          items: mockNotifications,
          page: 1,
          totalPages: 2,
        })
        .mockResolvedValueOnce({
          items: [{
            id: 'notif-3',
            type: 'system',
            title: 'System Update',
            message: 'New features available',
            read: true,
            createdAt: new Date().toISOString(),
          }],
          page: 2,
          totalPages: 2,
        });

      const wrapper = createWrapper(true);
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.hasMore).toBe(true);
      });

      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.notifications.length).toBe(3);
      expect(result.current.hasMore).toBe(false);
    });
  });

  describe('useNotifications hook', () => {
    it('should throw error when used outside NotificationProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useNotifications());
      }).toThrow('useNotifications must be used within NotificationProvider');
      
      consoleSpy.mockRestore();
    });
  });
});
