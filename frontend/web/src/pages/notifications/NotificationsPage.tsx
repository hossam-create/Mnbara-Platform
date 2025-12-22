// ============================================
// 🔔 Notifications Page - Full Notification List
// ============================================

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import type { Notification } from '../../types';

// ============================================
// Notification Card Component
// ============================================

function NotificationCard({
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
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
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

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      order_update: 'Order',
      bid_outbid: 'Auction',
      bid_won: 'Auction',
      auction_ending: 'Auction',
      new_match: 'Match',
      message: 'Message',
      review: 'Review',
      reward: 'Rewards',
      system: 'System',
    };
    return labels[type] || 'Notification';
  };

  return (
    <Link
      to={getLink(notification)}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
      className={`block bg-white rounded-xl border transition-all hover:shadow-md ${
        !notification.read ? 'border-pink-200 bg-pink-50/30' : 'border-gray-100'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-indigo-100 flex items-center justify-center text-2xl flex-shrink-0">
            {getIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-pink-500 uppercase tracking-wide">
                {getTypeLabel(notification.type)}
              </span>
              {!notification.read && (
                <span className="w-2 h-2 bg-pink-500 rounded-full" />
              )}
            </div>
            <h3 className={`text-base ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
              {notification.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {notification.message}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {getTimeAgo(notification.createdAt)}
            </p>
          </div>
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

// ============================================
// Notifications Page Component
// ============================================

export function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    fetchNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-500 mt-1">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="px-4 py-2 text-sm font-medium text-pink-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="space-y-3">
          {notifications.length === 0 && !isLoading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <span className="text-6xl">🔔</span>
              <h3 className="text-lg font-semibold text-gray-900 mt-4">No notifications</h3>
              <p className="text-gray-500 mt-2">
                When you get notifications, they'll show up here
              </p>
              <Link
                to="/"
                className="inline-block mt-6 px-6 py-2 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-medium rounded-lg hover:shadow-lg transition-all"
              >
                Explore Mnbara
              </Link>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => loadMore()}
                    disabled={isLoading}
                    className="px-6 py-2 text-sm font-medium text-pink-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Loading...' : 'Load more notifications'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Loading State */}
          {isLoading && notifications.length === 0 && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-200" />
                    <div className="flex-1">
                      <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
                      <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
                      <div className="h-3 w-full bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsPage;
