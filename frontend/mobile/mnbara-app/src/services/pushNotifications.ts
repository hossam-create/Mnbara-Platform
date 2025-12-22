/**
 * Push Notification Service for MNBARA Mobile App
 * Handles FCM (Android) and APNs (iOS) push notifications
 * Requirements: 10.1 - Push notification infrastructure
 */

import { Platform, AppState, AppStateStatus } from 'react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  EventType,
  Event as NotifeeEvent,
} from '@notifee/react-native';
import { notificationsService } from './api';

// Types for push notification payloads
export interface AuctionNotificationPayload {
  type: 'outbid' | 'ending_soon' | 'auction_won' | 'auction_ended';
  auctionId: string;
  title: string;
  body: string;
  data?: {
    currentPrice?: number;
    newHighest?: number;
    secondsRemaining?: number;
    winner?: string;
    finalPrice?: number;
  };
}

export interface OrderNotificationPayload {
  type: 'order_status' | 'delivery_update' | 'payment_received';
  orderId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface TravelerNotificationPayload {
  type: 'new_request' | 'request_accepted' | 'delivery_confirmed';
  requestId?: string;
  matchId?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export type NotificationPayload =
  | AuctionNotificationPayload
  | OrderNotificationPayload
  | TravelerNotificationPayload;

// Notification handlers type
type NotificationHandler = (payload: NotificationPayload) => void;

// Notification channel IDs for Android
const CHANNEL_IDS = {
  AUCTIONS: 'mnbara_auctions',
  ORDERS: 'mnbara_orders',
  TRAVELER: 'mnbara_traveler',
  GENERAL: 'mnbara_general',
} as const;

class PushNotificationService {
  private deviceToken: string | null = null;
  private isInitialized = false;
  private handlers: Map<string, Set<NotificationHandler>> = new Map();
  private navigationRef: any = null;
  private appState: AppStateStatus = AppState.currentState;
  private unsubscribeFromForeground: (() => void) | null = null;
  private unsubscribeFromTokenRefresh: (() => void) | null = null;

  /**
   * Initialize push notifications
   * Should be called on app startup after user authentication
   * Requirements: 10.1 - Configure FCM for Android and APNs for iOS
   */
  async initialize(navigationRef?: any): Promise<void> {
    if (this.isInitialized) return;

    this.navigationRef = navigationRef;

    try {
      // Create notification channels for Android
      await this.createNotificationChannels();

      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('[PushNotifications] Permission denied');
        return;
      }

      // Get device token
      const token = await this.getDeviceToken();
      if (token) {
        this.deviceToken = token;
        await this.registerTokenWithServer(token);
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      // Set up app state listener
      this.setupAppStateListener();

      // Set up token refresh listener
      this.setupTokenRefreshListener();

      this.isInitialized = true;
      console.log('[PushNotifications] Initialized successfully');
    } catch (error) {
      console.error('[PushNotifications] Initialization failed:', error);
    }
  }

  /**
   * Create Android notification channels
   * Requirements: 10.1 - Configure FCM for Android
   */
  private async createNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    // Auctions channel - high importance for time-sensitive notifications
    await notifee.createChannel({
      id: CHANNEL_IDS.AUCTIONS,
      name: 'Auction Alerts',
      description: 'Notifications for auction activity (outbid, ending soon)',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      lights: true,
    });

    // Orders channel
    await notifee.createChannel({
      id: CHANNEL_IDS.ORDERS,
      name: 'Order Updates',
      description: 'Notifications for order status and delivery updates',
      importance: AndroidImportance.DEFAULT,
      sound: 'default',
    });

    // Traveler channel
    await notifee.createChannel({
      id: CHANNEL_IDS.TRAVELER,
      name: 'Traveler Requests',
      description: 'Notifications for nearby delivery requests',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    // General channel
    await notifee.createChannel({
      id: CHANNEL_IDS.GENERAL,
      name: 'General',
      description: 'General notifications and updates',
      importance: AndroidImportance.DEFAULT,
    });

    console.log('[PushNotifications] Android channels created');
  }

  /**
   * Request notification permission from user
   * Requirements: 10.1 - Configure APNs for iOS
   */
  private async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('[PushNotifications] Permission granted:', authStatus);
      }

      return enabled;
    } catch (error) {
      console.error('[PushNotifications] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Get device token for push notifications
   * Requirements: 10.1 - Implement device token registration
   */
  private async getDeviceToken(): Promise<string | null> {
    try {
      // Check if APNs token is available (iOS only)
      if (Platform.OS === 'ios') {
        const apnsToken = await messaging().getAPNSToken();
        if (!apnsToken) {
          console.log('[PushNotifications] APNs token not available yet');
          // APNs token might not be available immediately, FCM will handle it
        }
      }

      // Get FCM token
      const fcmToken = await messaging().getToken();
      console.log('[PushNotifications] FCM token obtained');
      return fcmToken;
    } catch (error) {
      console.error('[PushNotifications] Failed to get token:', error);
      return null;
    }
  }

  /**
   * Register device token with backend notification service
   * Requirements: 10.1 - Implement device token registration with notification-service
   */
  private async registerTokenWithServer(token: string): Promise<void> {
    try {
      const platform = Platform.OS as 'ios' | 'android';
      await notificationsService.registerDevice(token, platform);
      console.log('[PushNotifications] Token registered with server');
    } catch (error) {
      console.error('[PushNotifications] Failed to register token:', error);
      throw error;
    }
  }

  /**
   * Set up listeners for incoming notifications
   * Requirements: 10.2 - Handle foreground and background notifications
   */
  private setupNotificationListeners(): void {
    // Handle foreground messages
    this.unsubscribeFromForeground = messaging().onMessage(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        console.log('[PushNotifications] Foreground message received');
        await this.handleRemoteMessage(remoteMessage, false);
      }
    );

    // Handle background/quit state message tap
    messaging().onNotificationOpenedApp(
      (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        console.log('[PushNotifications] Notification opened app');
        this.handleNotificationTap(remoteMessage);
      }
    );

    // Check if app was opened from a notification (quit state)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('[PushNotifications] App opened from quit state notification');
          this.handleNotificationTap(remoteMessage);
        }
      });

    // Handle notifee foreground events (for local notifications)
    notifee.onForegroundEvent(this.handleNotifeeEvent.bind(this));

    console.log('[PushNotifications] Notification listeners set up');
  }

  /**
   * Set up app state listener for handling background/foreground transitions
   */
  private setupAppStateListener(): void {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      this.appState = nextAppState;
    });
  }

  /**
   * Set up token refresh listener
   * Requirements: 10.1 - Handle token refresh
   */
  private setupTokenRefreshListener(): void {
    this.unsubscribeFromTokenRefresh = messaging().onTokenRefresh(async (token) => {
      console.log('[PushNotifications] Token refreshed');
      this.deviceToken = token;
      await this.registerTokenWithServer(token);
    });
  }

  /**
   * Handle remote message from FCM
   */
  private async handleRemoteMessage(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage,
    isBackground: boolean
  ): Promise<void> {
    const payload = this.parseRemoteMessage(remoteMessage);
    if (!payload) return;

    if (!isBackground) {
      // Show local notification for foreground messages
      await this.displayLocalNotification(payload);
    }

    // Emit to registered handlers
    this.emitToHandlers(payload);
  }

  /**
   * Parse remote message into typed payload
   */
  private parseRemoteMessage(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): NotificationPayload | null {
    const { data, notification } = remoteMessage;
    if (!data?.type) return null;

    const basePayload = {
      type: data.type as string,
      title: notification?.title || data.title || '',
      body: notification?.body || data.body || '',
    };

    // Parse based on notification type
    if (this.isAuctionType(data.type)) {
      return {
        ...basePayload,
        auctionId: data.auctionId || '',
        data: data.payload ? JSON.parse(data.payload) : undefined,
      } as AuctionNotificationPayload;
    }

    if (this.isOrderType(data.type)) {
      return {
        ...basePayload,
        orderId: data.orderId || '',
        data: data.payload ? JSON.parse(data.payload) : undefined,
      } as OrderNotificationPayload;
    }

    if (this.isTravelerType(data.type)) {
      return {
        ...basePayload,
        requestId: data.requestId,
        matchId: data.matchId,
        data: data.payload ? JSON.parse(data.payload) : undefined,
      } as TravelerNotificationPayload;
    }

    return null;
  }

  /**
   * Display local notification using notifee
   * Requirements: 10.2 - Handle foreground notifications with in-app alerts
   */
  private async displayLocalNotification(payload: NotificationPayload): Promise<void> {
    const channelId = this.getChannelForPayload(payload);

    await notifee.displayNotification({
      title: payload.title,
      body: payload.body,
      data: payload as unknown as Record<string, string>,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
        style: payload.body.length > 50
          ? { type: AndroidStyle.BIGTEXT, text: payload.body }
          : undefined,
      },
      ios: {
        sound: 'default',
        foregroundPresentationOptions: {
          badge: true,
          sound: true,
          banner: true,
          list: true,
        },
      },
    });
  }

  /**
   * Get appropriate channel for notification type
   */
  private getChannelForPayload(payload: NotificationPayload): string {
    if (this.isAuctionType(payload.type)) return CHANNEL_IDS.AUCTIONS;
    if (this.isOrderType(payload.type)) return CHANNEL_IDS.ORDERS;
    if (this.isTravelerType(payload.type)) return CHANNEL_IDS.TRAVELER;
    return CHANNEL_IDS.GENERAL;
  }

  /**
   * Handle notifee events (local notification interactions)
   */
  private handleNotifeeEvent({ type, detail }: NotifeeEvent): void {
    if (type === EventType.PRESS && detail.notification?.data) {
      const payload = detail.notification.data as unknown as NotificationPayload;
      this.navigateFromPayload(payload);
    }
  }

  /**
   * Handle notification tap (from FCM)
   * Requirements: 10.2 - Handle background notifications with navigation
   */
  private handleNotificationTap(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): void {
    const payload = this.parseRemoteMessage(remoteMessage);
    if (payload) {
      this.navigateFromPayload(payload);
    }
  }

  /**
   * Navigate based on notification payload
   */
  private navigateFromPayload(payload: NotificationPayload): void {
    if (!this.navigationRef?.current) return;

    if (this.isAuctionNotification(payload)) {
      this.navigationRef.current.navigate('Auction', {
        auctionId: payload.auctionId,
      });
    } else if (this.isOrderNotification(payload)) {
      this.navigationRef.current.navigate('Order', {
        orderId: payload.orderId,
      });
    } else if (this.isTravelerNotification(payload)) {
      // Navigate to appropriate traveler screen
      if (payload.matchId) {
        this.navigationRef.current.navigate('Profile', {
          screen: 'Traveler',
          params: {
            screen: 'DeliveryDetail',
            params: { matchId: payload.matchId },
          },
        });
      }
    }
  }

  /**
   * Emit notification to registered handlers
   */
  private emitToHandlers(payload: NotificationPayload): void {
    const handlers = this.handlers.get(payload.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error('[PushNotifications] Handler error:', error);
        }
      });
    }
  }

  // Type guards
  private isAuctionType(type: string): boolean {
    return ['outbid', 'ending_soon', 'auction_won', 'auction_ended'].includes(type);
  }

  private isOrderType(type: string): boolean {
    return ['order_status', 'delivery_update', 'payment_received'].includes(type);
  }

  private isTravelerType(type: string): boolean {
    return ['new_request', 'request_accepted', 'delivery_confirmed'].includes(type);
  }

  private isAuctionNotification(
    payload: NotificationPayload
  ): payload is AuctionNotificationPayload {
    return this.isAuctionType(payload.type);
  }

  private isOrderNotification(
    payload: NotificationPayload
  ): payload is OrderNotificationPayload {
    return this.isOrderType(payload.type);
  }

  private isTravelerNotification(
    payload: NotificationPayload
  ): payload is TravelerNotificationPayload {
    return this.isTravelerType(payload.type);
  }

  /**
   * Subscribe to specific notification types
   */
  subscribe(type: string, handler: NotificationHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  /**
   * Unregister device from push notifications
   * Should be called on logout
   */
  async unregister(): Promise<void> {
    if (this.deviceToken) {
      try {
        await notificationsService.unregisterDevice(this.deviceToken);
        console.log('[PushNotifications] Device unregistered');
      } catch (error) {
        console.error('[PushNotifications] Failed to unregister:', error);
      }
    }

    // Clean up listeners
    this.unsubscribeFromForeground?.();
    this.unsubscribeFromTokenRefresh?.();

    this.deviceToken = null;
    this.isInitialized = false;
    this.handlers.clear();
  }

  /**
   * Get current device token
   */
  getToken(): string | null {
    return this.deviceToken;
  }

  /**
   * Check if push notifications are initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Update navigation reference
   */
  setNavigationRef(ref: any): void {
    this.navigationRef = ref;
  }

  /**
   * Check current permission status
   */
  async checkPermissionStatus(): Promise<'granted' | 'denied' | 'not_determined'> {
    const authStatus = await messaging().hasPermission();
    if (authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL) {
      return 'granted';
    }
    if (authStatus === messaging.AuthorizationStatus.DENIED) {
      return 'denied';
    }
    return 'not_determined';
  }

  /**
   * Get badge count (iOS only)
   */
  async getBadgeCount(): Promise<number> {
    if (Platform.OS === 'ios') {
      return await notifee.getBadgeCount();
    }
    return 0;
  }

  /**
   * Set badge count (iOS only)
   */
  async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS === 'ios') {
      await notifee.setBadgeCount(count);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await notifee.cancelAllNotifications();
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService();

// Convenience functions for auction notifications
export const auctionNotifications = {
  onOutbid: (handler: (payload: AuctionNotificationPayload) => void) =>
    pushNotificationService.subscribe('outbid', handler as NotificationHandler),

  onEndingSoon: (handler: (payload: AuctionNotificationPayload) => void) =>
    pushNotificationService.subscribe('ending_soon', handler as NotificationHandler),

  onAuctionWon: (handler: (payload: AuctionNotificationPayload) => void) =>
    pushNotificationService.subscribe('auction_won', handler as NotificationHandler),

  onAuctionEnded: (handler: (payload: AuctionNotificationPayload) => void) =>
    pushNotificationService.subscribe('auction_ended', handler as NotificationHandler),
};

// Convenience functions for order notifications
export const orderNotifications = {
  onOrderStatus: (handler: (payload: OrderNotificationPayload) => void) =>
    pushNotificationService.subscribe('order_status', handler as NotificationHandler),

  onDeliveryUpdate: (handler: (payload: OrderNotificationPayload) => void) =>
    pushNotificationService.subscribe('delivery_update', handler as NotificationHandler),

  onPaymentReceived: (handler: (payload: OrderNotificationPayload) => void) =>
    pushNotificationService.subscribe('payment_received', handler as NotificationHandler),
};

// Convenience functions for traveler notifications
export const travelerNotifications = {
  onNewRequest: (handler: (payload: TravelerNotificationPayload) => void) =>
    pushNotificationService.subscribe('new_request', handler as NotificationHandler),

  onRequestAccepted: (handler: (payload: TravelerNotificationPayload) => void) =>
    pushNotificationService.subscribe('request_accepted', handler as NotificationHandler),

  onDeliveryConfirmed: (handler: (payload: TravelerNotificationPayload) => void) =>
    pushNotificationService.subscribe('delivery_confirmed', handler as NotificationHandler),
};

export default pushNotificationService;
