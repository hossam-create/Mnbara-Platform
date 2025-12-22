/**
 * Type declarations for @notifee/react-native
 * These types will be replaced by actual package types after npm install
 */

declare module '@notifee/react-native' {
  export enum AndroidImportance {
    DEFAULT = 3,
    HIGH = 4,
    LOW = 2,
    MIN = 1,
    NONE = 0,
  }

  export enum AndroidStyle {
    BIGPICTURE = 0,
    BIGTEXT = 1,
    INBOX = 2,
    MESSAGING = 3,
  }

  export enum EventType {
    DISMISSED = 0,
    PRESS = 1,
    ACTION_PRESS = 2,
    DELIVERED = 3,
    APP_BLOCKED = 4,
    CHANNEL_BLOCKED = 5,
    CHANNEL_GROUP_BLOCKED = 6,
    TRIGGER_NOTIFICATION_CREATED = 7,
  }

  export interface Event {
    type: EventType;
    detail: {
      notification?: {
        id?: string;
        title?: string;
        body?: string;
        data?: Record<string, string>;
      };
      pressAction?: {
        id: string;
      };
    };
  }

  export interface AndroidChannel {
    id: string;
    name: string;
    description?: string;
    importance?: AndroidImportance;
    sound?: string;
    vibration?: boolean;
    lights?: boolean;
  }

  export interface AndroidNotificationSettings {
    channelId: string;
    importance?: AndroidImportance;
    pressAction?: { id: string };
    style?: { type: AndroidStyle; text: string };
  }

  export interface IOSNotificationSettings {
    sound?: string;
    foregroundPresentationOptions?: {
      badge?: boolean;
      sound?: boolean;
      banner?: boolean;
      list?: boolean;
    };
  }

  export interface Notification {
    id?: string;
    title?: string;
    body?: string;
    data?: Record<string, string>;
    android?: AndroidNotificationSettings;
    ios?: IOSNotificationSettings;
  }

  const notifee: {
    createChannel(channel: AndroidChannel): Promise<string>;
    displayNotification(notification: Notification): Promise<string>;
    cancelAllNotifications(): Promise<void>;
    getBadgeCount(): Promise<number>;
    setBadgeCount(count: number): Promise<void>;
    onForegroundEvent(callback: (event: Event) => void): () => void;
    onBackgroundEvent(callback: (event: Event) => Promise<void>): void;
  };

  export default notifee;
}
