/**
 * Push Notifications Service Tests
 * Tests for token registration and notification routing
 * Requirements: 10.1, 10.2 - Push notification infrastructure and handlers
 */

import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import {
  pushNotificationService,
  auctionNotifications,
  orderNotifications,
  travelerNotifications,
  AuctionNotificationPayload,
  OrderNotificationPayload,
  TravelerNotificationPayload,
} from '../../services/pushNotifications';
import { notificationsService } from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  notificationsService: {
    registerDevice: jest.fn().mockResolvedValue({ success: true }),
    unregisterDevice: jest.fn().mockResolvedValue({ success: true }),
    getNotifications: jest.fn().mockResolvedValue({ data: [] }),
    getPreferences: jest.fn().mockResolvedValue({}),
    updatePreferences: jest.fn().mockResolvedValue({}),
    markAsRead: jest.fn().mockResolvedValue({}),
    markAllAsRead: jest.fn().mockResolvedValue({}),
  },
}));

describe('PushNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the service state
    pushNotificationService['isInitialized'] = false;
    pushNotificationService['deviceToken'] = null;
    pushNotificationService['handlers'].clear();
  });

  describe('Token Registration', () => {
    it('should request permission and get FCM token on initialize', async () => {
      await pushNotificationService.initialize();

      expect(messaging().requestPermission).toHaveBeenCalled();
      expect(messaging().getToken).toHaveBeenCalled();
    });

    it('should register device token with server', async () => {
      await pushNotificationService.initialize();

      expect(notificationsService.registerDevice).toHaveBeenCalledWith(
        'mock-fcm-token',
        Platform.OS
      );
    });

    it('should not initialize twice', async () => {
      await pushNotificationService.initialize();
      await pushNotificationService.initialize();

      // Should only call getToken once
      expect(messaging().getToken).toHaveBeenCalledTimes(1);
    });

    it('should return token after initialization', async () => {
      await pushNotificationService.initialize();

      expect(pushNotificationService.getToken()).toBe('mock-fcm-token');
    });

    it('should handle permission denied', async () => {
      (messaging().requestPermission as jest.Mock).mockResolvedValueOnce(
        messaging.AuthorizationStatus.DENIED
      );

      await pushNotificationService.initialize();

      expect(notificationsService.registerDevice).not.toHaveBeenCalled();
    });

    it('should unregister device on logout', async () => {
      await pushNotificationService.initialize();
      await pushNotificationService.unregister();

      expect(notificationsService.unregisterDevice).toHaveBeenCalledWith('mock-fcm-token');
      expect(pushNotificationService.getToken()).toBeNull();
      expect(pushNotificationService.isReady()).toBe(false);
    });

    it('should handle token refresh', async () => {
      let tokenRefreshCallback: ((token: string) => void) | null = null;
      (messaging().onTokenRefresh as jest.Mock).mockImplementation((callback) => {
        tokenRefreshCallback = callback;
        return jest.fn();
      });

      await pushNotificationService.initialize();
      jest.clearAllMocks();

      // Simulate token refresh
      tokenRefreshCallback?.('new-fcm-token');

      expect(notificationsService.registerDevice).toHaveBeenCalledWith(
        'new-fcm-token',
        Platform.OS
      );
    });
  });

  describe('Notification Routing', () => {
    describe('Auction Notifications', () => {
      it('should route outbid notifications to handlers', async () => {
        const handler = jest.fn();
        const unsubscribe = auctionNotifications.onOutbid(handler);

        const payload: AuctionNotificationPayload = {
          type: 'outbid',
          auctionId: 'auction-123',
          title: 'You have been outbid',
          body: 'Someone placed a higher bid',
          data: { newHighest: 150 },
        };

        // Simulate emitting to handlers
        pushNotificationService['emitToHandlers'](payload);

        expect(handler).toHaveBeenCalledWith(payload);
        unsubscribe();
      });

      it('should route ending_soon notifications to handlers', async () => {
        const handler = jest.fn();
        const unsubscribe = auctionNotifications.onEndingSoon(handler);

        const payload: AuctionNotificationPayload = {
          type: 'ending_soon',
          auctionId: 'auction-123',
          title: 'Auction ending soon',
          body: '2 minutes remaining',
          data: { secondsRemaining: 120 },
        };

        pushNotificationService['emitToHandlers'](payload);

        expect(handler).toHaveBeenCalledWith(payload);
        unsubscribe();
      });

      it('should route auction_won notifications to handlers', async () => {
        const handler = jest.fn();
        const unsubscribe = auctionNotifications.onAuctionWon(handler);

        const payload: AuctionNotificationPayload = {
          type: 'auction_won',
          auctionId: 'auction-123',
          title: 'Congratulations!',
          body: 'You won the auction',
          data: { finalPrice: 200 },
        };

        pushNotificationService['emitToHandlers'](payload);

        expect(handler).toHaveBeenCalledWith(payload);
        unsubscribe();
      });
    });

    describe('Order Notifications', () => {
      it('should route order_status notifications to handlers', async () => {
        const handler = jest.fn();
        const unsubscribe = orderNotifications.onOrderStatus(handler);

        const payload: OrderNotificationPayload = {
          type: 'order_status',
          orderId: 'order-123',
          title: 'Order Shipped',
          body: 'Your order is on its way',
        };

        pushNotificationService['emitToHandlers'](payload);

        expect(handler).toHaveBeenCalledWith(payload);
        unsubscribe();
      });

      it('should route delivery_update notifications to handlers', async () => {
        const handler = jest.fn();
        const unsubscribe = orderNotifications.onDeliveryUpdate(handler);

        const payload: OrderNotificationPayload = {
          type: 'delivery_update',
          orderId: 'order-123',
          title: 'Delivery Update',
          body: 'Package out for delivery',
        };

        pushNotificationService['emitToHandlers'](payload);

        expect(handler).toHaveBeenCalledWith(payload);
        unsubscribe();
      });
    });

    describe('Traveler Notifications', () => {
      it('should route new_request notifications to handlers', async () => {
        const handler = jest.fn();
        const unsubscribe = travelerNotifications.onNewRequest(handler);

        const payload: TravelerNotificationPayload = {
          type: 'new_request',
          requestId: 'request-123',
          title: 'New Delivery Request',
          body: 'A buyer needs delivery near your route',
        };

        pushNotificationService['emitToHandlers'](payload);

        expect(handler).toHaveBeenCalledWith(payload);
        unsubscribe();
      });

      it('should route delivery_confirmed notifications to handlers', async () => {
        const handler = jest.fn();
        const unsubscribe = travelerNotifications.onDeliveryConfirmed(handler);

        const payload: TravelerNotificationPayload = {
          type: 'delivery_confirmed',
          matchId: 'match-123',
          title: 'Delivery Confirmed',
          body: 'The buyer confirmed receipt',
        };

        pushNotificationService['emitToHandlers'](payload);

        expect(handler).toHaveBeenCalledWith(payload);
        unsubscribe();
      });
    });

    describe('Handler Management', () => {
      it('should allow multiple handlers for same notification type', async () => {
        const handler1 = jest.fn();
        const handler2 = jest.fn();

        const unsub1 = auctionNotifications.onOutbid(handler1);
        const unsub2 = auctionNotifications.onOutbid(handler2);

        const payload: AuctionNotificationPayload = {
          type: 'outbid',
          auctionId: 'auction-123',
          title: 'Outbid',
          body: 'You were outbid',
        };

        pushNotificationService['emitToHandlers'](payload);

        expect(handler1).toHaveBeenCalledWith(payload);
        expect(handler2).toHaveBeenCalledWith(payload);

        unsub1();
        unsub2();
      });

      it('should unsubscribe handler correctly', async () => {
        const handler = jest.fn();
        const unsubscribe = auctionNotifications.onOutbid(handler);

        unsubscribe();

        const payload: AuctionNotificationPayload = {
          type: 'outbid',
          auctionId: 'auction-123',
          title: 'Outbid',
          body: 'You were outbid',
        };

        pushNotificationService['emitToHandlers'](payload);

        expect(handler).not.toHaveBeenCalled();
      });

      it('should handle errors in handlers gracefully', async () => {
        const errorHandler = jest.fn().mockImplementation(() => {
          throw new Error('Handler error');
        });
        const goodHandler = jest.fn();

        const unsub1 = auctionNotifications.onOutbid(errorHandler);
        const unsub2 = auctionNotifications.onOutbid(goodHandler);

        const payload: AuctionNotificationPayload = {
          type: 'outbid',
          auctionId: 'auction-123',
          title: 'Outbid',
          body: 'You were outbid',
        };

        // Should not throw
        expect(() => pushNotificationService['emitToHandlers'](payload)).not.toThrow();
        expect(goodHandler).toHaveBeenCalledWith(payload);

        unsub1();
        unsub2();
      });
    });
  });

  describe('Permission Status', () => {
    it('should return granted when authorized', async () => {
      (messaging().hasPermission as jest.Mock).mockResolvedValueOnce(
        messaging.AuthorizationStatus.AUTHORIZED
      );

      const status = await pushNotificationService.checkPermissionStatus();
      expect(status).toBe('granted');
    });

    it('should return denied when denied', async () => {
      (messaging().hasPermission as jest.Mock).mockResolvedValueOnce(
        messaging.AuthorizationStatus.DENIED
      );

      const status = await pushNotificationService.checkPermissionStatus();
      expect(status).toBe('denied');
    });

    it('should return not_determined when not determined', async () => {
      (messaging().hasPermission as jest.Mock).mockResolvedValueOnce(
        messaging.AuthorizationStatus.NOT_DETERMINED
      );

      const status = await pushNotificationService.checkPermissionStatus();
      expect(status).toBe('not_determined');
    });
  });

  describe('Badge and Notification Management', () => {
    it('should clear all notifications', async () => {
      await pushNotificationService.clearAllNotifications();
      expect(notifee.cancelAllNotifications).toHaveBeenCalled();
    });

    it('should get badge count on iOS', async () => {
      Platform.OS = 'ios';
      const count = await pushNotificationService.getBadgeCount();
      expect(notifee.getBadgeCount).toHaveBeenCalled();
      expect(count).toBe(0);
      Platform.OS = 'android'; // Reset
    });

    it('should set badge count on iOS', async () => {
      Platform.OS = 'ios';
      await pushNotificationService.setBadgeCount(5);
      expect(notifee.setBadgeCount).toHaveBeenCalledWith(5);
      Platform.OS = 'android'; // Reset
    });
  });
});
