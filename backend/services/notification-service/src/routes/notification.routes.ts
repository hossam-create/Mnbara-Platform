/**
 * Notification Routes
 * HTTP endpoints for notification management
 */

import { Router } from 'express';
import {
  createNotification,
  sendTemplatedNotification,
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  getDeliveryStatus,
  getDeliveryStats,
  sendAuctionNotification,
  sendOrderNotification,
  sendPaymentNotification,
  sendChatNotification,
} from '../controllers/notification.controller';

const router = Router();

/**
 * @route POST /notifications
 * @description Create and send a notification
 */
router.post('/', createNotification);

/**
 * @route POST /notifications/templated
 * @description Send notification using a template
 */
router.post('/templated', sendTemplatedNotification);

/**
 * @route GET /notifications
 * @description Get user notifications with pagination
 */
router.get('/', getNotifications);

/**
 * @route GET /notifications/unread/count
 * @description Get unread notification count
 */
router.get('/unread/count', getUnreadCount);

/**
 * @route GET /notifications/stats
 * @description Get delivery statistics
 */
router.get('/stats', getDeliveryStats);

/**
 * @route POST /notifications/auction
 * @description Send auction-related notification
 */
router.post('/auction', sendAuctionNotification);

/**
 * @route POST /notifications/order
 * @description Send order-related notification
 */
router.post('/order', sendOrderNotification);

/**
 * @route POST /notifications/payment
 * @description Send payment-related notification
 */
router.post('/payment', sendPaymentNotification);

/**
 * @route POST /notifications/chat
 * @description Send chat/message notification
 */
router.post('/chat', sendChatNotification);

/**
 * @route GET /notifications/:id
 * @description Get notification by ID
 */
router.get('/:id', getNotification);

/**
 * @route PUT /notifications/:id/read
 * @description Mark notification as read
 */
router.put('/:id/read', markAsRead);

/**
 * @route PUT /notifications/read-all
 * @description Mark all notifications as read
 */
router.put('/read-all', markAllAsRead);

/**
 * @route GET /notifications/:id/delivery
 * @description Get delivery status for notification
 */
router.get('/:id/delivery', getDeliveryStatus);

/**
 * @route DELETE /notifications/:id
 * @description Delete notification
 */
router.delete('/:id', deleteNotification);

export default router;
