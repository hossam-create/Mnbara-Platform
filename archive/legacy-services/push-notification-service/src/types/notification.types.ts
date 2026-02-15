export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
}

export interface SendNotificationDto {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
}

export interface SendBulkNotificationDto {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
}

export interface RegisterDeviceDto {
  userId: string;
  token: string;
  platform: 'IOS' | 'ANDROID' | 'WEB';
  provider: 'FCM' | 'ONESIGNAL';
}

export interface NotificationResponse {
  success: boolean;
  notificationId?: string;
  error?: string;
}

export interface BulkNotificationResponse {
  success: boolean;
  sent: number;
  failed: number;
  errors?: string[];
}
