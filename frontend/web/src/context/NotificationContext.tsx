// ============================================
// 🔔 Notification Context - Real-time Notifications Provider
// ============================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { notificationService } from '../services/notification.service';
import { useAuth } from './AuthContext';
import type { Notification } from '../types';

// ============================================
// Types
// ============================================

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  fetchNotifications: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

interface Toast {
  id: string;
  notification: Notification;
  visible: boolean;
}

// ============================================
// Context
// ============================================

const NotificationContext = createContext<NotificationContextType | null>(null);

// ============================================
// Toast Component
// ============================================

function NotificationToast({ 
  notification, 
  onClose,
  onClick 
}: { 
  notification: Notification; 
  onClose: () => void;
  onClick: () => void;
}) {
  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      order_update: '📦',
      bid_outbid: '⚠️',
      bid_won: '🎉',
      auction_ending: '⏰',
      new_match: '🤝',
      message: '💬',
      review: '⭐',
      reward: '🎁',
      system: '🔔',
    };
    return icons[type] || '🔔';
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-2xl border border-gray-100 p-4 max-w-sm cursor-pointer
                 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{getIcon(notification.type)}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">
            {notification.title}
          </p>
          <p className="text-gray-600 text-sm mt-0.5 line-clamp-2">
            {notification.message}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============================================
// Provider
// ============================================

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Connect to notification service when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      notificationService.connect();
      fetchNotifications();
      fetchUnreadCount();

      // Subscribe to new notifications
      const unsubscribe = notificationService.onNotification((notification) => {
        addNotification(notification);
        showToast(notification);
      });

      return () => {
        unsubscribe();
        notificationService.disconnect();
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const result = await notificationService.fetchNotifications(1);
      if (result) {
        setNotifications(result.items);
        setHasMore(result.page < result.totalPages);
        setPage(1);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Load more notifications
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const result = await notificationService.fetchNotifications(nextPage);
      if (result) {
        setNotifications((prev) => [...prev, ...result.items]);
        setHasMore(result.page < result.totalPages);
        setPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to load more notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  // Add new notification
  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  // Show toast notification
  const showToast = useCallback((notification: Notification) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, notification, visible: true }]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
      );
      // Remove from DOM after animation
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 300);
    }, 5000);
  }, []);

  // Dismiss toast
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    fetchNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-20 right-4 z-[100] space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`transform transition-all duration-300 ${
              toast.visible
                ? 'translate-x-0 opacity-100'
                : 'translate-x-full opacity-0'
            }`}
          >
            <NotificationToast
              notification={toast.notification}
              onClose={() => dismissToast(toast.id)}
              onClick={() => {
                markAsRead(toast.notification.id);
                dismissToast(toast.id);
              }}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

export default NotificationContext;
