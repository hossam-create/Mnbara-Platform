import * as OneSignal from 'onesignal-node';
import { logger } from '../utils/logger';
import { PushNotificationPayload } from '../types/notification.types';

export class OneSignalService {
  private client: any;
  private appId: string;

  constructor() {
    this.appId = process.env.ONESIGNAL_APP_ID || '';
    const apiKey = process.env.ONESIGNAL_API_KEY || '';

    if (this.appId && apiKey) {
      this.client = new OneSignal.Client(this.appId, apiKey);
      logger.info('OneSignal initialized successfully');
    } else {
      logger.warn('OneSignal not initialized - credentials not provided');
    }
  }

  async sendToDevice(
    playerId: string,
    payload: PushNotificationPayload
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'OneSignal not initialized' };
    }

    try {
      const notification = {
        contents: { en: payload.body },
        headings: { en: payload.title },
        data: payload.data || {},
        big_picture: payload.imageUrl,
        url: payload.actionUrl,
        priority: this.mapPriority(payload.priority),
        include_player_ids: [playerId],
      };

      const response = await this.client.createNotification(notification);
      logger.info(`OneSignal notification sent: ${response.body.id}`);
      
      return { success: true, notificationId: response.body.id };
    } catch (error: any) {
      logger.error('OneSignal send error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendToMultipleDevices(
    playerIds: string[],
    payload: PushNotificationPayload
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'OneSignal not initialized' };
    }

    try {
      const notification = {
        contents: { en: payload.body },
        headings: { en: payload.title },
        data: payload.data || {},
        big_picture: payload.imageUrl,
        url: payload.actionUrl,
        priority: this.mapPriority(payload.priority),
        include_player_ids: playerIds,
      };

      const response = await this.client.createNotification(notification);
      logger.info(`OneSignal bulk notification sent: ${response.body.id}`);
      
      return { success: true, notificationId: response.body.id };
    } catch (error: any) {
      logger.error('OneSignal bulk send error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendToSegment(
    segment: string,
    payload: PushNotificationPayload
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'OneSignal not initialized' };
    }

    try {
      const notification = {
        contents: { en: payload.body },
        headings: { en: payload.title },
        data: payload.data || {},
        big_picture: payload.imageUrl,
        url: payload.actionUrl,
        priority: this.mapPriority(payload.priority),
        included_segments: [segment],
      };

      const response = await this.client.createNotification(notification);
      logger.info(`OneSignal segment notification sent: ${response.body.id}`);
      
      return { success: true, notificationId: response.body.id };
    } catch (error: any) {
      logger.error('OneSignal segment send error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendToAll(payload: PushNotificationPayload): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    return this.sendToSegment('All', payload);
  }

  private mapPriority(priority?: string): number {
    switch (priority) {
      case 'HIGH':
        return 10;
      case 'LOW':
        return 1;
      default:
        return 5;
    }
  }
}
