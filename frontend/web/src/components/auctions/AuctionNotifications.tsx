// ============================================
// 🔔 AuctionNotifications - Real-time Auction Alerts
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { wsService } from '../../services/websocket';

interface AuctionNotification {
  id: string;
  type: 'outbid' | 'ending_soon' | 'auction_won' | 'auction_ended' | 'bid_placed';
  auctionId: string;
  message: string;
  data?: {
    newHighest?: number;
    winner?: { id: string; fullName: string };
    finalPrice?: number;
    bidAmount?: number;
  };
  timestamp: Date;
}

interface AuctionNotificationsProps {
  auctionId?: string;
  userId?: string;
  onOutbid?: (data: { auctionId: string; newHighest: number }) => void;
  onAuctionEnd?: (data: { auctionId: string; winner: { id: string; fullName: string }; finalPrice: number }) => void;
}

export function AuctionNotifications({
  auctionId,
  userId,
  onOutbid,
  onAuctionEnd,
}: AuctionNotificationsProps) {
  const [notifications, setNotifications] = useState<AuctionNotification[]>([]);

  // Add notification helper
  const addNotification = useCallback((notification: Omit<AuctionNotification, 'id' | 'timestamp'>) => {
    const newNotification: AuctionNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 5));

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  }, []);

  // Subscribe to outbid events
  useEffect(() => {
    const unsubscribe = wsService.subscribe('auction:outbid', (data: unknown) => {
      const outbidData = data as { auctionId: string; newHighest: number; bidderId: string };
      
      // Only show if it's for the current auction and user was outbid
      if (auctionId && outbidData.auctionId !== auctionId) return;
      if (userId && outbidData.bidderId === userId) return; // Don't notify if user placed the bid

      addNotification({
        type: 'outbid',
        auctionId: outbidData.auctionId,
        message: `You've been outbid! New highest: $${outbidData.newHighest.toLocaleString()}`,
        data: { newHighest: outbidData.newHighest },
      });

      onOutbid?.(outbidData);
    });

    return () => unsubscribe();
  }, [auctionId, userId, addNotification, onOutbid]);

  // Subscribe to ending soon events
  useEffect(() => {
    const unsubscribe = wsService.subscribe('auction:ending_soon', (data: unknown) => {
      const endingData = data as { auctionId: string; secondsRemaining: number };
      
      if (auctionId && endingData.auctionId !== auctionId) return;

      const minutes = Math.floor(endingData.secondsRemaining / 60);
      addNotification({
        type: 'ending_soon',
        auctionId: endingData.auctionId,
        message: `⚡ Auction ending in ${minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : 'less than a minute'}!`,
      });
    });

    return () => unsubscribe();
  }, [auctionId, addNotification]);

  // Subscribe to auction end events
  useEffect(() => {
    const unsubscribe = wsService.subscribe('auction:end', (data: unknown) => {
      const endData = data as { auctionId: string; winner: { id: string; fullName: string }; finalPrice: number };
      
      if (auctionId && endData.auctionId !== auctionId) return;

      const isWinner = userId && endData.winner.id === userId;
      
      addNotification({
        type: isWinner ? 'auction_won' : 'auction_ended',
        auctionId: endData.auctionId,
        message: isWinner 
          ? `🎉 Congratulations! You won the auction for $${endData.finalPrice.toLocaleString()}!`
          : `Auction ended. Won by ${endData.winner.fullName} for $${endData.finalPrice.toLocaleString()}`,
        data: { winner: endData.winner, finalPrice: endData.finalPrice },
      });

      onAuctionEnd?.(endData);
    });

    return () => unsubscribe();
  }, [auctionId, userId, addNotification, onAuctionEnd]);

  // Subscribe to bid placed confirmation
  useEffect(() => {
    const unsubscribe = wsService.subscribe('auction:bid_confirmed', (data: unknown) => {
      const bidData = data as { auctionId: string; amount: number; bidderId: string };
      
      if (auctionId && bidData.auctionId !== auctionId) return;
      if (userId && bidData.bidderId !== userId) return;

      addNotification({
        type: 'bid_placed',
        auctionId: bidData.auctionId,
        message: `✓ Your bid of $${bidData.amount.toLocaleString()} was placed successfully!`,
        data: { bidAmount: bidData.amount },
      });
    });

    return () => unsubscribe();
  }, [auctionId, userId, addNotification]);

  // Dismiss notification
  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={() => dismissNotification(notification.id)}
        />
      ))}
    </div>
  );
}

// Notification Toast Component
interface NotificationToastProps {
  notification: AuctionNotification;
  onDismiss: () => void;
}

function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
  const getStyles = () => {
    switch (notification.type) {
      case 'outbid':
        return {
          bg: 'bg-orange-50 border-orange-300',
          icon: '⚠️',
          iconBg: 'bg-orange-100',
        };
      case 'ending_soon':
        return {
          bg: 'bg-red-50 border-red-300',
          icon: '⚡',
          iconBg: 'bg-red-100',
        };
      case 'auction_won':
        return {
          bg: 'bg-green-50 border-green-300',
          icon: '🎉',
          iconBg: 'bg-green-100',
        };
      case 'auction_ended':
        return {
          bg: 'bg-gray-50 border-gray-300',
          icon: '🔨',
          iconBg: 'bg-gray-100',
        };
      case 'bid_placed':
        return {
          bg: 'bg-blue-50 border-blue-300',
          icon: '✓',
          iconBg: 'bg-blue-100',
        };
      default:
        return {
          bg: 'bg-white border-gray-200',
          icon: '📢',
          iconBg: 'bg-gray-100',
        };
    }
  };

  const styles = getStyles();

  return (
    <div 
      className={`
        ${styles.bg} border rounded-xl p-4 shadow-lg 
        animate-slide-in-right
        flex items-start gap-3
      `}
    >
      <div className={`${styles.iconBg} w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`}>
        <span className="text-lg">{styles.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{notification.message}</p>
        <p className="text-xs text-gray-500 mt-1">
          {notification.timestamp.toLocaleTimeString()}
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Hook for using auction notifications
export function useAuctionNotifications(auctionId?: string, userId?: string) {
  const [lastOutbid, setLastOutbid] = useState<{ auctionId: string; newHighest: number } | null>(null);
  const [auctionEnded, setAuctionEnded] = useState<{ auctionId: string; winner: { id: string; fullName: string }; finalPrice: number } | null>(null);

  useEffect(() => {
    const unsubOutbid = wsService.subscribe('auction:outbid', (data: unknown) => {
      const outbidData = data as { auctionId: string; newHighest: number };
      if (!auctionId || outbidData.auctionId === auctionId) {
        setLastOutbid(outbidData);
      }
    });

    const unsubEnd = wsService.subscribe('auction:end', (data: unknown) => {
      const endData = data as { auctionId: string; winner: { id: string; fullName: string }; finalPrice: number };
      if (!auctionId || endData.auctionId === auctionId) {
        setAuctionEnded(endData);
      }
    });

    return () => {
      unsubOutbid();
      unsubEnd();
    };
  }, [auctionId]);

  return {
    lastOutbid,
    auctionEnded,
    isWinner: auctionEnded && userId ? auctionEnded.winner.id === userId : false,
    clearOutbid: () => setLastOutbid(null),
    clearEnded: () => setAuctionEnded(null),
  };
}

export default AuctionNotifications;
