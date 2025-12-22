/**
 * Notification Store
 * Manages notification state and preferences
 * Requirements: 10.2, 10.4 - Notification preferences
 */

import { create } from 'zustand';
import { notificationsService } from '../services/api';

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  orderUpdates: boolean;
  auctionAlerts: boolean;
  travelerRequests: boolean;
  promotions: boolean;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: () => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearError: () => void;
}

const defaultPreferences: NotificationPreferences = {
  pushEnabled: true,
  emailEnabled: true,
  orderUpdates: true,
  auctionAlerts: true,
  travelerRequests: true,
  promotions: false,
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  preferences: defaultPreferences,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await notificationsService.getNotifications({ limit: 50 });
      const notifications = response.data || [];
      const unreadCount = notifications.filter((n: Notification) => !n.read).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch notifications',
        isLoading: false,
      });
    }
  },

  fetchPreferences: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await notificationsService.getPreferences();
      set({
        preferences: { ...defaultPreferences, ...response },
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch preferences',
        isLoading: false,
      });
    }
  },

  updatePreferences: async (newPreferences: Partial<NotificationPreferences>) => {
    const currentPreferences = get().preferences;
    // Optimistic update
    set({ preferences: { ...currentPreferences, ...newPreferences } });

    try {
      await notificationsService.updatePreferences(newPreferences);
    } catch (error: any) {
      // Revert on error
      set({
        preferences: currentPreferences,
        error: error.message || 'Failed to update preferences',
      });
    }
  },

  markAsRead: async (id: string) => {
    const { notifications, unreadCount } = get();
    const notification = notifications.find((n) => n.id === id);
    if (!notification || notification.read) return;

    // Optimistic update
    set({
      notifications: notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, unreadCount - 1),
    });

    try {
      await notificationsService.markAsRead(id);
    } catch (error: any) {
      // Revert on error
      set({
        notifications,
        unreadCount,
        error: error.message || 'Failed to mark as read',
      });
    }
  },

  markAllAsRead: async () => {
    const { notifications } = get();

    // Optimistic update
    set({
      notifications: notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    });

    try {
      await notificationsService.markAllAsRead();
    } catch (error: any) {
      // Revert on error
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
        error: error.message || 'Failed to mark all as read',
      });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useNotificationStore;
