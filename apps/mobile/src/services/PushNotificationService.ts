// Push Notification Service
import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';

type NotificationHandler = (notification: any) => void;

class PushNotificationService {
  private handlers: Map<string, NotificationHandler> = new Map();
  private token: string | null = null;

  configure(): void {
    PushNotification.configure({
      onRegister: (token) => {
        this.token = token.token;
        console.log('Push token:', token.token);
        // Send token to server
      },
      onNotification: (notification) => {
        console.log('Push notification:', notification);
        this.handleNotification(notification);
        
        if (Platform.OS === 'ios') {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      },
      onAction: (notification) => {
        console.pushNotification('Push action:', notification);
      },
      onRegistrationError: (error) => {
        console.error('Push registration error:', error);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });
  }

  private handleNotification(notification: any): void {
    const handler = this.handlers.get(notification.data?.type || 'default');
    if (handler) {
      handler(notification);
    }
  }

  subscribe(eventType: string, handler: NotificationHandler): () => void {
    this.handlers.set(eventType, handler);
    return () => this.handlers.delete(eventType);
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return await PushNotificationIOS.requestPermissions({
        alert: true,
        badge: true,
        sound: true,
      });
    }
    return true;
  }

  async getToken(): Promise<string | null> {
    return this.token;
  }

  localNotification(title: string, message: string, data?: any): void {
    PushNotification.localNotification({
      title,
      message,
      data,
      playSound: true,
      soundName: 'default',
    });
  }

  scheduleNotification(title: string, message: string, date: Date, data?: any): void {
    PushNotification.localNotificationSchedule({
      title,
      message,
      date,
      data,
      repeatType: undefined,
    });
  }

  cancelAllNotifications(): void {
    PushNotification.cancelAllLocalNotifications();
  }

  cancelNotification(id: string): void {
    PushNotification.cancelLocalNotifications({ id });
  }

  setApplicationIconBadgeNumber(count: number): void {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.setApplicationIconBadgeNumber(count);
    }
  }

  getApplicationIconBadgeNumber(): Promise<number> {
    if (Platform.OS === 'ios') {
      return PushNotificationIOS.getApplicationIconBadgeNumber();
    }
    return Promise.resolve(0);
  }
}

export const pushNotificationService = new PushNotificationService();
