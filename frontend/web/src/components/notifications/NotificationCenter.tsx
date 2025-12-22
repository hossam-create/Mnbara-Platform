// ============================================
// 🔔 Notification Center - Dropdown Component
// ============================================

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import type { Notification } from '../../types';

// ============================================
// Notification Item Component
// ============================================

function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
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

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getLink = (notification: Notification) => {
    const data = notification.data || {};
    switch (notification.type) {
      case 'order_update':
        return data.orderId ? `/orders/${data.orderId}` : '/orders';
      case 'bid_outbid':
      case 'bid_won':
      case 'auction_ending':
        return data.auctionId ? `/auctions/${data.auctionId}` : '/auctions';
      case 'message':
        return data.conversationId ? `/chat/${data.conversationId}` : '/chat';
      case 'review':
        return '/profile/reviews';
      case 'reward':
        return '/rewards';
      default:
        return '#';
    }
  };

  return (
    <Link
      to={getLink(notification)}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
      className={`block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
        !notification.read ? 'bg-pink-50/50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">{getIcon(notification.type)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm truncate ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
              {notification.title}
            </p>
            {!notification.read && (
              <span className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
            {notification.message}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {getTimeAgo(notification.createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}

// ============================================
// Notification Center Component
// ============================================

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-pink-500 transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-pink-50 to-indigo-50">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-sm text-pink-500 hover:text-pink-600 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <span className="text-4xl">🔔</span>
                <p className="text-gray-500 mt-2">No notifications yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  We'll notify you when something happens
                </p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                  />
                ))}
                {hasMore && (
                  <button
                    onClick={() => loadMore()}
                    disabled={isLoading}
                    className="w-full py-3 text-sm text-pink-500 hover:bg-gray-50 font-medium disabled:opacity-50"
                  >
                    {isLoading ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm text-pink-500 hover:text-pink-600 font-medium"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
