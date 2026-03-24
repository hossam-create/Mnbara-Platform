// Notification enums (matching Prisma schema)
export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
  WEBHOOK = 'WEBHOOK'
}

export enum NotificationType {
  // Auction notifications
  AUCTION_ENDING_SOON = 'AUCTION_ENDING_SOON',
  NEW_BID_RECEIVED = 'NEW_BID_RECEIVED',
  OUTBID = 'OUTBID',
  AUCTION_WON = 'AUCTION_WON',
  AUCTION_LOST = 'AUCTION_LOST',
  AUCTION_CANCELLED = 'AUCTION_CANCELLED',
  
  // Payment notifications
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_ISSUED = 'REFUND_ISSUED',
  
  // Order notifications
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_DISPUTE = 'ORDER_DISPUTE',
  
  // Chat notifications
  NEW_MESSAGE = 'NEW_MESSAGE',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  
  // System notifications
  ACCOUNT_VERIFIED = 'ACCOUNT_VERIFIED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  NEW_REVIEW = 'NEW_REVIEW',
  SYSTEM_ALERT = 'SYSTEM_ALERT'
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  READ = 'READ',
  DISMISSED = 'DISMISSED'
}

export enum Priority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

// DTOs
export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  recipient?: string;
  title?: string;
  subject?: string;
  content: string;
  data?: Record<string, any>;
  priority?: Priority;
  scheduledFor?: Date;
  expiresAt?: Date;
}

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  title?: string;
  subject?: string;
  content: string;
  status: NotificationStatus;
  priority: Priority;
  data?: Record<string, any>;
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
}

export interface NotificationListResponse {
  notifications: NotificationResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface SendTemplatedNotificationDto {
  userId: string;
  templateName: string;
  data: Record<string, any>;
  channel: NotificationChannel;
  priority?: Priority;
  scheduledFor?: Date;
}

// Event types for WebSocket
export interface NotificationEvent {
  type: 'notification' | 'bid' | 'outbid' | 'message' | 'order' | 'payment' | 'auction';
  data: any;
  timestamp: Date;
}

export interface BidNotificationEvent {
  type: 'NEW_BID' | 'OUTBID' | 'AUCTION_ENDING_SOON';
  auctionId: string;
  auctionTitle: string;
  bidAmount: number;
  currentHighBid: number;
  userId: string;
  bidderId: string;
  bidderName: string;
  timestamp: Date;
}

export interface OrderNotificationEvent {
  type: 'ORDER_CONFIRMED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED' | 'ORDER_CANCELLED';
  orderId: string;
  orderDetails: any;
  timestamp: Date;
}

export interface PaymentNotificationEvent {
  type: 'PAYMENT_RECEIVED' | 'PAYMENT_FAILED' | 'REFUND_ISSUED';
  transactionId: string;
  amount: number;
  currency: string;
  details: any;
  timestamp: Date;
}

export interface ChatNotificationEvent {
  type: 'NEW_MESSAGE' | 'MESSAGE_RECEIVED';
  conversationId: string;
  messageId: string;
  senderId: string;
  senderName: string;
  preview: string;
  timestamp: Date;
}

// WebSocket events
export interface WSEvent {
  event: string;
  payload: any;
}

export interface WSMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping';
  channels?: string[];
}

// Channel types for pub/sub
export interface PubSubMessage {
  event: string;
  data: any;
  timestamp: Date;
  source: string;
}

export interface AuctionChannelMessage extends PubSubMessage {
  event: 'AUCTION_STARTED' | 'AUCTION_ENDED' | 'NEW_BID' | 'OUTBID' | 'AUCTION_ENDING_SOON';
  data: {
    auctionId: string;
    title: string;
    currentBid: number;
    endTime: Date;
    users: string[]; // User IDs to notify
  };
}

export interface OrderChannelMessage extends PubSubMessage {
  event: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED';
  data: {
    orderId: string;
    userId: string;
    status: string;
    details: any;
  };
}

export interface ChatChannelMessage extends PubSubMessage {
  event: 'MESSAGE_SENT' | 'MESSAGE_DELIVERED' | 'MESSAGE_READ';
  data: {
    conversationId: string;
    messageId: string;
    recipientId: string;
    senderId: string;
    content: string;
  };
}

// Delivery tracking
export interface DeliveryStatus {
  notificationId: string;
  status: NotificationStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  clickedAt?: Date;
  error?: string;
}

// Queue job types
export interface NotificationJobData {
  notificationId: string;
  type: NotificationType;
  channel: NotificationChannel;
  userId: string;
  recipient: string;
  content: string;
  title?: string;
  data?: Record<string, any>;
  priority: Priority;
  retryCount: number;
}

export interface RetryJobData {
  notificationId: string;
  error: string;
  retryCount: number;
}
