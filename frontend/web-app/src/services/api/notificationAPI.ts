import { apiClient } from './client';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  typeBreakdown: Record<string, number>;
  connectedClients: number;
}

export interface SendNotificationRequest {
  userId: string;
  type: string;
  title: string;
  message: string;
  email?: string;
  sendEmail?: boolean;
  sendRealTime?: boolean;
  metadata?: Record<string, any>;
}

class NotificationAPI {
  private baseURL = '/api/notifications';

  // Get notifications for current user
  async getNotifications(params?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const response = await apiClient.get(this.baseURL, { params });
    return response.data;
  }

  // Send notification
  async sendNotification(data: SendNotificationRequest) {
    const response = await apiClient.post(`${this.baseURL}/send`, data);
    return response.data;
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    const response = await apiClient.put(`${this.baseURL}/${notificationId}/read`);
    return response.data;
  }

  // Mark all notifications as read
  async markAllAsRead() {
    const response = await apiClient.put(`${this.baseURL}/read-all`);
    return response.data;
  }

  // Delete notification
  async deleteNotification(notificationId: string) {
    const response = await apiClient.delete(`${this.baseURL}/${notificationId}`);
    return response.data;
  }

  // Get notification statistics
  async getStats(): Promise<NotificationStats> {
    const response = await apiClient.get(`${this.baseURL}/stats`);
    return response.data.stats;
  }

  // Send welcome email
  async sendWelcomeEmail(data: { email: string; firstName: string; userId?: string }) {
    const response = await apiClient.post(`${this.baseURL}/welcome-email`, data);
    return response.data;
  }

  // WebSocket connection for real-time notifications
  connectWebSocket(userId: string, onNotification: (notification: Notification) => void) {
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? 'wss://mnbara.com:8080' 
      : 'ws://localhost:8080';
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to notification WebSocket');
      // Authenticate with user ID
      ws.send(JSON.stringify({ type: 'auth', userId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'notification') {
          onNotification(data.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from notification WebSocket');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return ws;
  }
}

export const notificationAPI = new NotificationAPI();