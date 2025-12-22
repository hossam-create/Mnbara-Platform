/**
 * usePushNotifications Hook
 * Provides easy access to push notification functionality in components
 * Requirements: 10.1, 10.2 - Push notification infrastructure and handlers
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigation, NavigationContainerRef } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import {
  pushNotificationService,
  auctionNotifications,
  orderNotifications,
  travelerNotifications,
  AuctionNotificationPayload,
  OrderNotificationPayload,
  TravelerNotificationPayload,
} from '../services/pushNotifications';
import { useAuthStore } from '../store/authStore';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UsePushNotificationsOptions {
  // Auction handlers
  onOutbid?: (payload: AuctionNotificationPayload) => void;
  onEndingSoon?: (payload: AuctionNotificationPayload) => void;
  onAuctionWon?: (payload: AuctionNotificationPayload) => void;
  onAuctionEnded?: (payload: AuctionNotificationPayload) => void;
  // Order handlers
  onOrderStatus?: (payload: OrderNotificationPayload) => void;
  onDeliveryUpdate?: (payload: OrderNotificationPayload) => void;
  onPaymentReceived?: (payload: OrderNotificationPayload) => void;
  // Traveler handlers
  onNewRequest?: (payload: TravelerNotificationPayload) => void;
  onRequestAccepted?: (payload: TravelerNotificationPayload) => void;
  onDeliveryConfirmed?: (payload: TravelerNotificationPayload) => void;
}

interface UsePushNotificationsReturn {
  isReady: boolean;
  permissionStatus: 'granted' | 'denied' | 'not_determined' | 'loading';
  navigateToAuction: (auctionId: string) => void;
  navigateToOrder: (orderId: string) => void;
  unregister: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  clearAllNotifications: () => Promise<void>;
  setBadgeCount: (count: number) => Promise<void>;
}

export const usePushNotifications = (
  options: UsePushNotificationsOptions = {}
): UsePushNotificationsReturn => {
  const navigation = useNavigation<NavigationProp>();
  const { isAuthenticated } = useAuthStore();
  const unsubscribeRefs = useRef<(() => void)[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<
    'granted' | 'denied' | 'not_determined' | 'loading'
  >('loading');
  const [isReady, setIsReady] = useState(false);

  // Check permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      const status = await pushNotificationService.checkPermissionStatus();
      setPermissionStatus(status);
    };
    checkPermission();
  }, []);

  // Initialize push notifications when user is authenticated
  useEffect(() => {
    const initializeNotifications = async () => {
      if (isAuthenticated) {
        await pushNotificationService.initialize();
        setIsReady(pushNotificationService.isReady());
        const status = await pushNotificationService.checkPermissionStatus();
        setPermissionStatus(status);
      }
    };

    initializeNotifications();

    return () => {
      // Cleanup subscriptions on unmount
      unsubscribeRefs.current.forEach((unsub) => unsub());
    };
  }, [isAuthenticated]);

  // Set up notification handlers
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // Auction handlers
    if (options.onOutbid) {
      unsubscribes.push(auctionNotifications.onOutbid(options.onOutbid));
    }
    if (options.onEndingSoon) {
      unsubscribes.push(auctionNotifications.onEndingSoon(options.onEndingSoon));
    }
    if (options.onAuctionWon) {
      unsubscribes.push(auctionNotifications.onAuctionWon(options.onAuctionWon));
    }
    if (options.onAuctionEnded) {
      unsubscribes.push(auctionNotifications.onAuctionEnded(options.onAuctionEnded));
    }

    // Order handlers
    if (options.onOrderStatus) {
      unsubscribes.push(orderNotifications.onOrderStatus(options.onOrderStatus));
    }
    if (options.onDeliveryUpdate) {
      unsubscribes.push(orderNotifications.onDeliveryUpdate(options.onDeliveryUpdate));
    }
    if (options.onPaymentReceived) {
      unsubscribes.push(orderNotifications.onPaymentReceived(options.onPaymentReceived));
    }

    // Traveler handlers
    if (options.onNewRequest) {
      unsubscribes.push(travelerNotifications.onNewRequest(options.onNewRequest));
    }
    if (options.onRequestAccepted) {
      unsubscribes.push(travelerNotifications.onRequestAccepted(options.onRequestAccepted));
    }
    if (options.onDeliveryConfirmed) {
      unsubscribes.push(travelerNotifications.onDeliveryConfirmed(options.onDeliveryConfirmed));
    }

    unsubscribeRefs.current = unsubscribes;

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [
    options.onOutbid,
    options.onEndingSoon,
    options.onAuctionWon,
    options.onAuctionEnded,
    options.onOrderStatus,
    options.onDeliveryUpdate,
    options.onPaymentReceived,
    options.onNewRequest,
    options.onRequestAccepted,
    options.onDeliveryConfirmed,
  ]);

  // Navigate to auction from notification
  const navigateToAuction = useCallback(
    (auctionId: string) => {
      navigation.navigate('Auction', { auctionId });
    },
    [navigation]
  );

  // Navigate to order from notification
  const navigateToOrder = useCallback(
    (orderId: string) => {
      navigation.navigate('Order', { orderId });
    },
    [navigation]
  );

  // Unregister device (for logout)
  const unregister = useCallback(async () => {
    await pushNotificationService.unregister();
    setIsReady(false);
  }, []);

  // Request permission manually
  const requestPermission = useCallback(async () => {
    await pushNotificationService.initialize();
    const status = await pushNotificationService.checkPermissionStatus();
    setPermissionStatus(status);
    setIsReady(pushNotificationService.isReady());
    return status === 'granted';
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    await pushNotificationService.clearAllNotifications();
  }, []);

  // Set badge count
  const setBadgeCount = useCallback(async (count: number) => {
    await pushNotificationService.setBadgeCount(count);
  }, []);

  return {
    isReady,
    permissionStatus,
    navigateToAuction,
    navigateToOrder,
    unregister,
    requestPermission,
    clearAllNotifications,
    setBadgeCount,
  };
};

/**
 * Hook for setting up navigation ref for push notifications
 * Should be used in the root component
 */
export const useNotificationNavigation = (
  navigationRef: React.RefObject<NavigationContainerRef<RootStackParamList>>
) => {
  useEffect(() => {
    if (navigationRef.current) {
      pushNotificationService.setNavigationRef(navigationRef);
    }
  }, [navigationRef]);
};

export default usePushNotifications;
