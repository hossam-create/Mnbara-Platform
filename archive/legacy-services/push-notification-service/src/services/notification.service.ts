import { PrismaClient } from '@prisma/client';
import { FCMService } from './fcm.service';
import { OneSignalService } from './onesignal.service';
import { logger } from '../utils/logger';
import {
  SendNotificationDto,
  SendBulkNotificationDto,
  RegisterDeviceDto,
  NotificationResponse,
  BulkNotificationResponse,
} from '../types/notification.types';

export class NotificationService {
  private prisma: PrismaClient;
  private fcmService: FCMService;
  private onesignalService: OneSignalService;

  constructor() {
    this.prisma = new PrismaClient();
    this.fcmService = new FCMService();
    this.onesignalService = new OneSignalService();
  }

  async registerDevice(data: RegisterDeviceDto): Promise<void> {
    logger.info(`Registering device for user: ${data.userId}`);

    // Deactivate old tokens for this user/platform
    await this.prisma.deviceToken.updateMany({
      where: {
        userId: data.userId,
        platform: data.platform,
        provider: data.provider,
      },
      data: { isActive: false },
    });

    // Create or update token
    await this.prisma.deviceToken.upsert({
      where: { token: data.token },
      create: {
        userId: data.userId,
        token: data.token,
        platform: data.platform,
        provider: data.provider,
        isActive: true,
      },
      update: {
        userId: data.userId,
        isActive: true,
        lastUsed: new Date(),
      },
    });

    logger.info(`Device registered: ${data.token.substring(0, 20)}...`);
  }

  async unregisterDevice(token: string): Promise<void> {
    await this.prisma.deviceToken.update({
      where: { token },
      data: { isActive: false },
    });

    logger.info(`Device unregistered: ${token.substring(0, 20)}...`);
  }

  async sendNotification(data: SendNotificationDto): Promise<NotificationResponse> {
    logger.info(`Sending notification to user: ${data.userId}`);

    // Get active device tokens for user
    const devices = await this.prisma.deviceToken.findMany({
      where: {
        userId: data.userId,
        isActive: true,
      },
    });

    if (devices.length === 0) {
      return { success: false, error: 'No active devices found' };
    }

    const results = await Promise.all(
      devices.map((device) => this.sendToDevice(device.id, device.token, device.provider, data))
    );

    const successCount = results.filter((r) => r.success).length;
    
    if (successCount === 0) {
      return { success: false, error: 'Failed to send to all devices' };
    }

    return { success: true, notificationId: results[0].notificationId };
  }

  async sendBulkNotification(data: SendBulkNotificationDto): Promise<BulkNotificationResponse> {
    logger.info(`Sending bulk notification to ${data.userIds.length} users`);

    const results = await Promise.all(
      data.userIds.map((userId) =>
        this.sendNotification({ ...data, userId })
      )
    );

    const sent = results.filter((r) => r.success).length;
    const failed = results.length - sent;
    const errors = results.filter((r) => !r.success).map((r) => r.error || 'Unknown error');

    return { success: sent > 0, sent, failed, errors };
  }

  async sendToTopic(topic: string, data: Omit<SendNotificationDto, 'userId'>): Promise<NotificationResponse> {
    logger.info(`Sending notification to topic: ${topic}`);

    const fcmResult = await this.fcmService.sendToTopic(topic, {
      title: data.title,
      body: data.body,
      data: data.data,
      imageUrl: data.imageUrl,
      actionUrl: data.actionUrl,
      priority: data.priority,
    });

    return {
      success: fcmResult.success,
      notificationId: fcmResult.messageId,
      error: fcmResult.error,
    };
  }

  async sendToSegment(segment: string, data: Omit<SendNotificationDto, 'userId'>): Promise<NotificationResponse> {
    logger.info(`Sending notification to segment: ${segment}`);

    const result = await this.onesignalService.sendToSegment(segment, {
      title: data.title,
      body: data.body,
      data: data.data,
      imageUrl: data.imageUrl,
      actionUrl: data.actionUrl,
      priority: data.priority,
    });

    return {
      success: result.success,
      notificationId: result.notificationId,
      error: result.error,
    };
  }

  private async sendToDevice(
    deviceId: string,
    token: string,
    provider: string,
    data: SendNotificationDto
  ): Promise<NotificationResponse> {
    // Create notification record
    const notification = await this.prisma.pushNotification.create({
      data: {
        deviceTokenId: deviceId,
        userId: data.userId,
        title: data.title,
        body: data.body,
        data: data.data || {},
        imageUrl: data.imageUrl,
        actionUrl: data.actionUrl,
        priority: data.priority || 'NORMAL',
        provider: provider as any,
        status: 'PENDING',
      },
    });

    // Send via appropriate provider
    let result;
    if (provider === 'FCM') {
      result = await this.fcmService.sendToDevice(token, {
        title: data.title,
        body: data.body,
        data: data.data,
        imageUrl: data.imageUrl,
        actionUrl: data.actionUrl,
        priority: data.priority,
      });
    } else {
      result = await this.onesignalService.sendToDevice(token, {
        title: data.title,
        body: data.body,
        data: data.data,
        imageUrl: data.imageUrl,
        actionUrl: data.actionUrl,
        priority: data.priority,
      });
    }

    // Update notification status
    await this.prisma.pushNotification.update({
      where: { id: notification.id },
      data: {
        status: result.success ? 'SENT' : 'FAILED',
        providerMsgId: result.messageId || result.notificationId,
        error: result.error,
        sentAt: result.success ? new Date() : null,
      },
    });

    return {
      success: result.success,
      notificationId: notification.id,
      error: result.error,
    };
  }

  async getNotificationHistory(userId: string, limit = 50) {
    return await this.prisma.pushNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getNotificationStats(userId: string) {
    const [total, sent, delivered, clicked, failed] = await Promise.all([
      this.prisma.pushNotification.count({ where: { userId } }),
      this.prisma.pushNotification.count({ where: { userId, status: 'SENT' } }),
      this.prisma.pushNotification.count({ where: { userId, status: 'DELIVERED' } }),
      this.prisma.pushNotification.count({ where: { userId, status: 'CLICKED' } }),
      this.prisma.pushNotification.count({ where: { userId, status: 'FAILED' } }),
    ]);

    return { total, sent, delivered, clicked, failed };
  }
}
