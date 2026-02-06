/**
 * Notification Controller
 * Handles HTTP endpoints for notification management
 */

import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { logger } from '../utils/logger';
import { NotificationChannel, NotificationType, Priority } from '../types/notification.types';

// Extended Request interface
interface AuthenticatedRequest extends Request {
  userId?: string;
}

/**
 * Create notification
 * POST /notifications
 */
export const createNotification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId || req.body.userId;
    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required',
      });
      return;
    }

    const {
      type,
      channel,
      recipient,
      title,
      subject,
      content,
      data,
      priority,
      scheduledFor,
      expiresAt,
    } = req.body;

    if (!type || !channel || !content) {
      res.status(400).json({
        success: false,
        error: 'type, channel, and content are required',
      });
      return;
    }

    const notification = await notificationService.createNotification({
      userId,
      type,
      channel,
      recipient,
      title,
      subject,
      content,
      data,
      priority,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    logger.error('Error creating notification:', error);
    next(error);
  }
};

/**
 * Send templated notification
 * POST /notifications/templated
 */
export const sendTemplatedNotification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId || req.body.userId;
    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required',
      });
      return;
    }

    const { templateName, data, channel, priority, scheduledFor } = req.body;

    if (!templateName || !channel) {
      res.status(400).json({
        success: false,
        error: 'templateName and channel are required',
      });
      return;
    }

    const notification = await notificationService.sendTemplatedNotification({
      userId,
      templateName,
      data: data || {},
      channel,
      priority,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
    });

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error: any) {
    logger.error('Error sending templated notification:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    } else {
      next(error);
    }
  }
};

/**
 * Get user notifications
 * GET /notifications
 */
export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId || req.query.userId as string;
    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required',
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const result = await notificationService.getUserNotifications(
      userId,
      page,
      limit,
      unreadOnly
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error getting notifications:', error);
    next(error);
  }
};

/**
 * Get notification by ID
 * GET /notifications/:id
 */
export const getNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const notification = await notificationService.getNotification(id);

    if (!notification) {
      res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
      return;
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    logger.error('Error getting notification:', error);
    next(error);
  }
};

/**
 * Mark notification as read
 * PUT /notifications/:id/read
 */
export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const notification = await notificationService.markAsRead(id);

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    next(error);
  }
};

/**
 * Mark all notifications as read
 * PUT /notifications/read-all
 */
export const markAllAsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId || req.body.userId;
    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required',
      });
      return;
    }

    const count = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      data: { markedAsRead: count },
    });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    next(error);
  }
};

/**
 * Delete notification
 * DELETE /notifications/:id
 */
export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    await notificationService.deleteNotification(id);

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    next(error);
  }
};

/**
 * Get unread count
 * GET /notifications/unread/count
 */
export const getUnreadCount = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId || req.query.userId as string;
    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required',
      });
      return;
    }

    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    logger.error('Error getting unread count:', error);
    next(error);
  }
};

/**
 * Get delivery status
 * GET /notifications/:id/delivery
 */
export const getDeliveryStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const status = await notificationService.getDeliveryStatus(id);

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    logger.error('Error getting delivery status:', error);
    if (error.message === 'Notification not found') {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    } else {
      next(error);
    }
  }
};

/**
 * Get delivery statistics
 * GET /notifications/stats
 */
export const getDeliveryStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId || req.query.userId as string;
    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required',
      });
      return;
    }

    const stats = await notificationService.getDeliveryStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting delivery stats:', error);
    next(error);
  }
};

/**
 * Send auction notification
 * POST /notifications/auction
 */
export const sendAuctionNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, auctionId, auctionTitle, userId, data } = req.body;

    if (!type || !auctionId || !auctionTitle || !userId) {
      res.status(400).json({
        success: false,
        error: 'type, auctionId, auctionTitle, and userId are required',
      });
      return;
    }

    await notificationService.sendAuctionNotification(
      type,
      auctionId,
      auctionTitle,
      userId,
      data || {}
    );

    res.status(202).json({
      success: true,
      message: 'Auction notification queued',
    });
  } catch (error) {
    logger.error('Error sending auction notification:', error);
    next(error);
  }
};

/**
 * Send order notification
 * POST /notifications/order
 */
export const sendOrderNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, orderId, userId, orderDetails } = req.body;

    if (!type || !orderId || !userId) {
      res.status(400).json({
        success: false,
        error: 'type, orderId, and userId are required',
      });
      return;
    }

    await notificationService.sendOrderNotification(
      type,
      orderId,
      userId,
      orderDetails || {}
    );

    res.status(202).json({
      success: true,
      message: 'Order notification queued',
    });
  } catch (error) {
    logger.error('Error sending order notification:', error);
    next(error);
  }
};

/**
 * Send payment notification
 * POST /notifications/payment
 */
export const sendPaymentNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, transactionId, amount, currency, userId, details } = req.body;

    if (!type || !transactionId || !amount || !currency || !userId) {
      res.status(400).json({
        success: false,
        error: 'type, transactionId, amount, currency, and userId are required',
      });
      return;
    }

    await notificationService.sendPaymentNotification(
      type,
      transactionId,
      amount,
      currency,
      userId,
      details || {}
    );

    res.status(202).json({
      success: true,
      message: 'Payment notification queued',
    });
  } catch (error) {
    logger.error('Error sending payment notification:', error);
    next(error);
  }
};

/**
 * Send chat notification
 * POST /notifications/chat
 */
export const sendChatNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { conversationId, senderId, senderName, recipientId, messagePreview, messageId } = req.body;

    if (!conversationId || !senderId || !recipientId || !messageId) {
      res.status(400).json({
        success: false,
        error: 'conversationId, senderId, recipientId, and messageId are required',
      });
      return;
    }

    await notificationService.sendChatNotification(
      conversationId,
      senderId,
      senderName || 'Someone',
      recipientId,
      messagePreview || '',
      messageId
    );

    res.status(202).json({
      success: true,
      message: 'Chat notification queued',
    });
  } catch (error) {
    logger.error('Error sending chat notification:', error);
    next(error);
  }
};
