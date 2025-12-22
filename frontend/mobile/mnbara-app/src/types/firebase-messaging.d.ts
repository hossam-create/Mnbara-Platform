/**
 * Type declarations for @react-native-firebase/messaging
 * These types will be replaced by actual package types after npm install
 */

declare module '@react-native-firebase/messaging' {
  export interface RemoteMessage {
    messageId?: string;
    data?: Record<string, string>;
    notification?: {
      title?: string;
      body?: string;
    };
  }

  export namespace FirebaseMessagingTypes {
    export interface RemoteMessage {
      messageId?: string;
      data?: Record<string, string>;
      notification?: {
        title?: string;
        body?: string;
      };
    }
  }

  export interface Messaging {
    requestPermission(): Promise<number>;
    hasPermission(): Promise<number>;
    getToken(): Promise<string>;
    getAPNSToken(): Promise<string | null>;
    onMessage(callback: (message: RemoteMessage) => void): () => void;
    onNotificationOpenedApp(callback: (message: RemoteMessage) => void): () => void;
    getInitialNotification(): Promise<RemoteMessage | null>;
    onTokenRefresh(callback: (token: string) => void): () => void;
    setBackgroundMessageHandler(handler: (message: RemoteMessage) => Promise<void>): void;
  }

  interface MessagingStatic extends Messaging {
    AuthorizationStatus: {
      NOT_DETERMINED: -1;
      DENIED: 0;
      AUTHORIZED: 1;
      PROVISIONAL: 2;
    };
  }

  const messaging: (() => Messaging) & MessagingStatic;
  export default messaging;
}
