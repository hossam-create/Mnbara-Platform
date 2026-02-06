/**
 * Main Notification Service
 * Coordinates all notification channels, templates, and delivery
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { 
  NotificationType, 
  NotificationChannel, 
  NotificationStatus, 
  Priority,
  CreateNotificationDto,
  NotificationResponse,
  NotificationListResponse,
  SendTemplatedNotificationDto,
} from '../types/notification.types';
import { eventWorkerService } from './event-worker.service';
import { fcmService } from './fcm.service';
import { websocketService } from './websocket.service';
import Handlebars from 'handlebars';

const prisma = new PrismaClient();

// Template cache
const templateCache = new Map<string, { title?: string; subject?: string; template: string }>();

export class NotificationService {
  /**
   * Create and send notification
   */
  async createNotification(dto: CreateNotificationDto): Promise<NotificationResponse> {
    const { userId, type, channel, recipient, title, subject, content, data, priority, scheduledFor, expiresAt } = dto;

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        channel,
        recipient: recipient || userId,
        title,
        subject,
        content,
        data,
        status: scheduledFor ? 'PENDING' : 'QUEUED',
        priority: priority || 'NORMAL',
        scheduledFor,
        expiresAt,
      },
    });

    logger.info(`Created notification ${notification.id} (${type}/${channel})`);

    // If scheduled, return without queuing
    if (scheduledFor) {
      return this.toResponse(notification);
    }

    // Enqueue for processing
    await eventWorkerService.enqueueNotification({
      notificationId: notification.id,
      type,
      channel,
      userId,
      recipient: notification.recipient,
      content,
      title,
      data,
      priority: priority || 'NORMAL',
      retryCount: 0,
    });

    return this.toResponse(notification);
  }

  /**
   * Send notification using template
   */
  async sendTemplatedNotification(dto: SendTemplatedNotificationDto): Promise<NotificationResponse> {
    const { userId, templateName, data, channel, priority, scheduledFor } = dto;

    // Get template
    const template = await this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    // Render template content
    const compiledTitle = template.title ? Handlebars.compile(template.title)(data) : undefined;
    const compiledSubject = template.subject ? Handlebars.compile(template.subject)(data) : undefined;
    const compiledContent = Handlebars.compile(template.template)(data);

    return await this.createNotification({
      userId,
      type: template.type,
      channel,
      title: compiledTitle,
      subject: compiledSubject,
      content: compiledContent,
      data,
      priority,
      scheduledFor,
    });
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<NotificationListResponse> {
    const where: any = { userId };
    if (unreadOnly) {
      where.status = { not: 'READ' };
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications: notifications.map(n => this.toResponse(n)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get notification by ID
   */
  async getNotification(notificationId: string): Promise<NotificationResponse | null> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    return notification ? this.toResponse(notification) : null;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<NotificationResponse> {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });

    // Log delivery
    await prisma.notificationDeliveryLog.create({
      data: {
        notificationId,
        event: 'READ',
      },
    });

    return this.toResponse(notification);
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        status: { not: 'READ' },
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    await prisma.notification.delete({
      where: { id: notificationId },
    });
    return true;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: {
        userId,
        status: { not: 'READ' },
      },
    });
  }

  /**
   * Get delivery status
   */
  async getDeliveryStatus(notificationId: string): Promise<{
    status: NotificationStatus;
    sentAt?: Date;
    deliveredAt?: Date;
    logs: Array<{ event: string; timestamp: Date }>;
  }> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    const logs = await prisma.notificationDeliveryLog.findMany({
      where: { notificationId },
      orderBy: { timestamp: 'asc' },
      select: { event: true, timestamp: true },
    });

    return {
      status: notification.status as NotificationStatus,
      sentAt: notification.sentAt || undefined,
      deliveredAt: notification.deliveredAt || undefined,
      logs: logs.map(l => ({ event: l.event, timestamp: l.timestamp })),
    };
  }

  /**
   * Send auction notification
   */
  async sendAuctionNotification(
    type: 'AUCTION_ENDING_SOON' | 'NEW_BID_RECEIVED' | 'OUTBID' | 'AUCTION_WON' | 'AUCTION_LOST',
    auctionId: string,
    auctionTitle: string,
    userId: string,
    data: Record<string, any>
  ): Promise<void> {
    const templateMap: Record<string, string> = {
      AUCTION_ENDING_SOON: 'auction-ending-soon',
      NEW_BID_RECEIVED: 'new-bid-received',
      OUTBID: 'outbid',
      AUCTION_WON: 'auction-won',
      AUCTION_LOST: 'auction-lost',
    };

    const templateName = templateMap[type];
    const titleMap: Record<string, string> = {
      AUCTION_ENDING_SOON: 'Auction Ending Soon!',
      NEW_BID_RECEIVED: 'New Bid Received',
      OUTBID: 'You Have Been Outbid!',
      AUCTION_WON: 'Congratulations! You Won the Auction!',
      AUCTION_LOST: 'Auction Ended',
    };

    const priority: Priority = type === 'AUCTION_ENDING_SOON' ? 'HIGH' : 'NORMAL';

    // Send to all channels
    await Promise.all([
      this.sendTemplatedNotification({
        userId,
        templateName,
        data: { auctionTitle, ...data },
        channel: 'PUSH',
        priority,
      }),
      this.sendTemplatedNotification({
        userId,
        templateName,
        data: { auctionTitle, ...data },
        channel: 'IN_APP',
        priority,
      }),
    ]);

    // Also send real-time WebSocket notification
    await websocketService.sendToUser(userId, {
      type: 'auction',
      data: {
        type,
        auctionId,
        auctionTitle,
        ...data,
      },
      timestamp: new Date(),
    });

    logger.info(`Auction notification ${type} sent to user ${userId}`);
  }

  /**
   * Send order notification
   */
  async sendOrderNotification(
    type: 'ORDER_CONFIRMED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED' | 'ORDER_CANCELLED',
    orderId: string,
    userId: string,
    orderDetails: Record<string, any>
  ): Promise<void> {
    const templateMap: Record<string, string> = {
      ORDER_CONFIRMED: 'order-confirmed',
      ORDER_SHIPPED: 'order-shipped',
      ORDER_DELIVERED: 'order-delivered',
      ORDER_CANCELLED: 'order-cancelled',
    };

    const templateName = templateMap[type];

    await this.sendTemplatedNotification({
      userId,
      templateName,
      data: { orderId, ...orderDetails },
      channel: 'PUSH',
    });

    await websocketService.sendToUser(userId, {
      type: 'order',
      data: {
        type,
        orderId,
        ...orderDetails,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Send payment notification
   */
  async sendPaymentNotification(
    type: 'PAYMENT_RECEIVED' | 'PAYMENT_FAILED' | 'REFUND_ISSUED',
    transactionId: string,
    amount: number,
    currency: string,
    userId: string,
    details: Record<string, any>
  ): Promise<void> {
    const templateMap: Record<string, string> = {
      PAYMENT_RECEIVED: 'payment-received',
      PAYMENT_FAILED: 'payment-failed',
      REFUND_ISSUED: 'refund-issued',
    };

    const templateName = templateMap[type];

    await this.sendTemplatedNotification({
      userId,
      templateName,
      data: { transactionId, amount, currency, ...details },
      channel: 'PUSH',
      priority: type === 'PAYMENT_FAILED' ? 'HIGH' : 'NORMAL',
    });

    await websocketService.sendToUser(userId, {
      type: 'payment',
      data: {
        type,
        transactionId,
        amount,
        currency,
        ...details,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Send chat notification
   */
  async sendChatNotification(
    conversationId: string,
    senderId: string,
    senderName: string,
    recipientId: string,
    messagePreview: string,
    messageId: string
  ): Promise<void> {
    await this.sendTemplatedNotification({
      userId: recipientId,
      templateName: 'new-message',
      data: {
        senderName,
        conversationId,
        messagePreview,
        senderId,
        messageId,
      },
      channel: 'PUSH',
    });

    await websocketService.sendToUser(recipientId, {
      type: 'message',
      data: {
        type: 'NEW_MESSAGE',
        conversationId,
        senderId,
        senderName,
        preview: messagePreview,
        messageId,
      },
      timestamp: new Date(),
    });
  }

  /**
   * Get template from cache or database
   */
  private async getTemplate(name: string): Promise<{
    type: NotificationType;
    title?: string;
    subject?: string;
    template: string;
  } | null> {
    // Check cache first
    if (templateCache.has(name)) {
      return templateCache.get(name)!;
    }

    const template = await prisma.notificationTemplate.findUnique({
      where: { name },
    });

    if (template) {
      const cached = {
        type: template.type as NotificationType,
        title: template.title || undefined,
        subject: template.subject || undefined,
        template: template.template,
      };
      templateCache.set(name, cached);
      return cached;
    }

    return null;
  }

  /**
   * Create notification template
   */
  async createTemplate(
    name: string,
    type: NotificationType,
    channel: NotificationChannel,
    title: string | null,
    subject: string | null,
    template: string,
    variables?: string[]
  ): Promise<void> {
    await prisma.notificationTemplate.create({
      data: {
        name,
        type,
        channel,
        title,
        subject,
        template,
        variables: variables ? JSON.stringify(variables) : null,
      },
    });

    // Invalidate cache
    templateCache.delete(name);
  }

  /**
   * Get delivery statistics for user
   */
  async getDeliveryStats(userId: string): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    read: number;
    deliveryRate: number;
    readRate: number;
  }> {
    const [total, sent, delivered, failed, read] = await Promise.all([
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, status: 'SENT' } }),
      prisma.notification.count({ where: { userId, status: 'DELIVERED' } }),
      prisma.notification.count({ where: { userId, status: 'FAILED' } }),
      prisma.notification.count({ where: { userId, status: 'READ' } }),
    ]);

    return {
      total,
      sent,
      delivered,
      failed,
      read,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      readRate: delivered > 0 ? (read / delivered) * 100 : 0,
    };
  }

  /**
   * Convert notification to response format
   */
  private toResponse(notification: any): NotificationResponse {
    return {
      id: notification.id,
      type: notification.type as NotificationType,
      channel: notification.channel as NotificationChannel,
      title: notification.title,
      subject: notification.subject,
      content: notification.content,
      status: notification.status as NotificationStatus,
      priority: notification.priority as Priority,
      data: notification.data,
      createdAt: notification.createdAt,
      sentAt: notification.sentAt,
      deliveredAt: notification.deliveredAt,
      readAt: notification.readAt,
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
