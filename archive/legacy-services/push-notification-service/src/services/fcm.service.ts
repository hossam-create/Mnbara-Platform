import admin from 'firebase-admin';
import { logger } from '../utils/logger';
import { PushNotificationPayload } from '../types/notification.types';

export class FCMService {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        
        this.initialized = true;
        logger.info('FCM initialized successfully');
      } else {
        logger.warn('FCM not initialized - FIREBASE_SERVICE_ACCOUNT not provided');
      }
    } catch (error) {
      logger.error('Failed to initialize FCM:', error);
    }
  }

  async sendToDevice(
    token: string,
    payload: PushNotificationPayload
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.initialized) {
      return { success: false, error: 'FCM not initialized' };
    }

    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: this.mapPriority(payload.priority),
          notification: {
            clickAction: payload.actionUrl,
          },
        },
        apns: {
          payload: {
            aps: {
              'content-available': 1,
            },
          },
        },
        webpush: payload.actionUrl ? {
          fcmOptions: {
            link: payload.actionUrl,
          },
        } : undefined,
      };

      const response = await admin.messaging().send(message);
      logger.info(`FCM notification sent: ${response}`);
      
      return { success: true, messageId: response };
    } catch (error: any) {
      logger.error('FCM send error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendToMultipleDevices(
    tokens: string[],
    payload: PushNotificationPayload
  ): Promise<{ success: boolean; successCount: number; failureCount: number }> {
    if (!this.initialized) {
      return { success: false, successCount: 0, failureCount: tokens.length };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: this.mapPriority(payload.priority),
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      logger.info(`FCM bulk notification sent: ${response.successCount}/${tokens.length}`);
      
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error: any) {
      logger.error('FCM bulk send error:', error);
      return { success: false, successCount: 0, failureCount: tokens.length };
    }
  }

  async sendToTopic(
    topic: string,
    payload: PushNotificationPayload
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.initialized) {
      return { success: false, error: 'FCM not initialized' };
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
      };

      const response = await admin.messaging().send(message);
      logger.info(`FCM topic notification sent: ${response}`);
      
      return { success: true, messageId: response };
    } catch (error: any) {
      logger.error('FCM topic send error:', error);
      return { success: false, error: error.message };
    }
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('FCM not initialized');
    }

    await admin.messaging().subscribeToTopic(tokens, topic);
    logger.info(`Subscribed ${tokens.length} tokens to topic: ${topic}`);
  }

  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('FCM not initialized');
    }

    await admin.messaging().unsubscribeFromTopic(tokens, topic);
    logger.info(`Unsubscribed ${tokens.length} tokens from topic: ${topic}`);
  }

  private mapPriority(priority?: string): 'high' | 'normal' {
    return priority === 'HIGH' ? 'high' : 'normal';
  }
}
