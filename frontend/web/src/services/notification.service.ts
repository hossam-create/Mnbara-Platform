// ============================================
// 🔔 Notification Service - Real-time Notifications
// ============================================

import { wsService } from './websocket';
import { notificationApi } from './api';
import type { Notification } from '../types';

type NotificationHandler = (notification: Notification) => void;

class NotificationService {
  private handlers: Set<NotificationHandler> = new Set();
  private unsubscribe: (() => void) | null = null;
  private isConnected = false;

  // Connect to notification WebSocket channel
  connect(): void {
    if (this.isConnected) return;

    // Subscribe to notification events from WebSocket
    this.unsubscribe = wsService.subscribe('notification', (data) => {
      const notification = data as Notification;
      this.notifyHandlers(notification);
    });

    // Also subscribe to specific notification types
    wsService.subscribe('notification:new', (data) => {
      const notification = data as Notification;
      this.notifyHandlers(notification);
    });

    this.isConnected = true;
    console.log('🔔 Notification service connected');
  }

  // Disconnect from notification channel
  disconnect(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.isConnected = false;
    console.log('🔔 Notification service disconnected');
  }

  // Subscribe to notifications
  onNotification(handler: NotificationHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  // Notify all handlers
  private notifyHandlers(notification: Notification): void {
    this.handlers.forEach((handler) => handler(notification));
  }

  // Fetch notifications from API
  async fetchNotifications(page = 1) {
    const response = await notificationApi.list(page);
    return response.data.data;
  }

  // Mark notification as read
  async markAsRead(id: string) {
    await notificationApi.markAsRead(id);
  }

  // Mark all notifications as read
  async markAllAsRead() {
    await notificationApi.markAllAsRead();
  }

  // Get unread count
  async getUnreadCount() {
    const response = await notificationApi.getUnreadCount();
    return response.data.data?.count ?? 0;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
