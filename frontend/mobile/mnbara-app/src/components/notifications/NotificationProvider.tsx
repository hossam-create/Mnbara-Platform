/**
 * Notification Provider
 * Provides notification context and handles displaying in-app notifications
 * Requirements: 10.2 - Handle foreground notifications with in-app alerts
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { InAppNotification, InAppNotificationData } from './InAppNotification';
import {
  pushNotificationService,
  NotificationPayload,
  AuctionNotificationPayload,
  OrderNotificationPayload,
  TravelerNotificationPayload,
} from '../../services/pushNotifications';
import { RootStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/authStore';

interface NotificationContextValue {
  showNotification: (notification: InAppNotificationData) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [currentNotification, setCurrentNotification] = useState<InAppNotificationData | null>(null);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { isAuthenticated } = useAuthStore();
  const unsubscribeRefs = useRef<(() => void)[]>([]);

  const showNotification = useCallback((notification: InAppNotificationData) => {
    setCurrentNotification(notification);
  }, []);

  const hideNotification = useCallback(() => {
    setCurrentNotification(null);
  }, []);

  // Handle notification press - navigate to appropriate screen
  const handleNotificationPress = useCallback(
    (notification: InAppNotificationData) => {
      const { type, data } = notification;

      // Auction notifications
      if (['outbid', 'ending_soon', 'auction_won', 'auction_ended'].includes(type)) {
        const auctionId = (data as any)?.auctionId || (notification as any).auctionId;
        if (auctionId) {
          navigation.navigate('Auction', { auctionId });
        }
      }

      // Order notifications
      if (['order_status', 'delivery_update', 'payment_received'].includes(type)) {
        const orderId = (data as any)?.orderId || (notification as any).orderId;
        if (orderId) {
          navigation.navigate('Order', { orderId });
        }
      }

      // Traveler notifications
      if (['new_request', 'request_accepted', 'delivery_confirmed'].includes(type)) {
        const matchId = (data as any)?.matchId;
        if (matchId) {
          // Navigate to traveler delivery detail
          navigation.navigate('Profile' as any, {
            screen: 'Traveler',
            params: {
              screen: 'DeliveryDetail',
              params: { matchId },
            },
          });
        }
      }
    },
    [navigation]
  );

  // Convert push notification payload to in-app notification data
  const convertPayloadToNotification = useCallback(
    (payload: NotificationPayload): InAppNotificationData => {
      return {
        id: `${payload.type}_${Date.now()}`,
        title: payload.title,
        body: payload.body,
        type: payload.type,
        data: payload as unknown as Record<string, unknown>,
      };
    },
    []
  );

  // Set up push notification handlers
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleAuctionNotification = (payload: AuctionNotificationPayload) => {
      showNotification(convertPayloadToNotification(payload));
    };

    const handleOrderNotification = (payload: OrderNotificationPayload) => {
      showNotification(convertPayloadToNotification(payload));
    };

    const handleTravelerNotification = (payload: TravelerNotificationPayload) => {
      showNotification(convertPayloadToNotification(payload));
    };

    // Subscribe to all notification types
    const unsubscribes = [
      // Auction notifications
      pushNotificationService.subscribe('outbid', handleAuctionNotification as any),
      pushNotificationService.subscribe('ending_soon', handleAuctionNotification as any),
      pushNotificationService.subscribe('auction_won', handleAuctionNotification as any),
      pushNotificationService.subscribe('auction_ended', handleAuctionNotification as any),
      // Order notifications
      pushNotificationService.subscribe('order_status', handleOrderNotification as any),
      pushNotificationService.subscribe('delivery_update', handleOrderNotification as any),
      pushNotificationService.subscribe('payment_received', handleOrderNotification as any),
      // Traveler notifications
      pushNotificationService.subscribe('new_request', handleTravelerNotification as any),
      pushNotificationService.subscribe('request_accepted', handleTravelerNotification as any),
      pushNotificationService.subscribe('delivery_confirmed', handleTravelerNotification as any),
    ];

    unsubscribeRefs.current = unsubscribes;

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [isAuthenticated, showNotification, convertPayloadToNotification]);

  const contextValue: NotificationContextValue = {
    showNotification,
    hideNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <InAppNotification
        notification={currentNotification}
        onPress={handleNotificationPress}
        onDismiss={hideNotification}
        duration={4000}
      />
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
