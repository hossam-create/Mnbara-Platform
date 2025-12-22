// ============================================
// 🔔 Push Notifications Service
// ============================================

interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
  // Actions only available when supported by browser/worker; treated as hint
  actions?: { action: string; title: string; icon?: string }[];
}

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
  private swRegistration: ServiceWorkerRegistration | null = null;

  async init(): Promise<boolean> {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return false;
    }

    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('🔔 Service Worker registered');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    return await Notification.requestPermission();
  }

  async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.swRegistration) {
      console.error('Service Worker not registered');
      return null;
    }

    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Subscribe to push
      const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource;

      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');

      if (!p256dhKey || !authKey) {
        throw new Error('Push subscription keys are missing');
      }

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(p256dhKey),
          auth: this.arrayBufferToBase64(authKey),
        },
      };

      console.log('🔔 Push subscription created');
      return subscriptionData;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.swRegistration) return false;

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('🔔 Push subscription removed');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.swRegistration) return null;
    return await this.swRegistration.pushManager.getSubscription();
  }

  // Show local notification
  showNotification(options: PushNotificationOptions): void {
    if (Notification.permission !== 'granted') {
      console.warn('Notifications not permitted');
      return;
    }

    const baseOptions: NotificationOptions = {
      body: options.body,
      icon: options.icon || '/icons/notification-icon.png',
      badge: options.badge || '/icons/badge-icon.png',
      tag: options.tag,
      data: options.data,
      requireInteraction: options.requireInteraction,
    };

    if (this.swRegistration) {
      this.swRegistration.showNotification(options.title, baseOptions);
    } else {
      // Fallback to basic notification (actions not supported)
      new Notification(options.title, baseOptions);
    }
  }

  // Helper: Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Helper: Convert ArrayBuffer to Base64
  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) {
      return '';
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  get permission(): NotificationPermission {
    return Notification.permission;
  }

  get isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }
}

export const pushService = new PushNotificationService();

// ============================================
// 🎯 Notification Types & Helpers
// ============================================

export type NotificationType = 
  | 'order_update'
  | 'new_message'
  | 'bid_outbid'
  | 'auction_won'
  | 'auction_ending'
  | 'payment_received'
  | 'delivery_update'
  | 'new_review'
  | 'price_drop'
  | 'promo';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  link?: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export const getNotificationIcon = (type: NotificationType): string => {
  const icons: Record<NotificationType, string> = {
    order_update: '📦',
    new_message: '💬',
    bid_outbid: '⚠️',
    auction_won: '🎉',
    auction_ending: '⏰',
    payment_received: '💰',
    delivery_update: '🚚',
    new_review: '⭐',
    price_drop: '🏷️',
    promo: '🎁',
  };
  return icons[type] || '🔔';
};

export default pushService;
