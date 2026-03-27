export enum JobType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH_NOTIFICATION = 'push-notification',
  IMAGE_PROCESSING = 'image-processing',
  REPORT_GENERATION = 'report-generation',
  DATA_EXPORT = 'data-export',
  AUCTION_REMINDER = 'auction-reminder',
  PAYMENT_PROCESSING = 'payment-processing',
  ORDER_FULFILLMENT = 'order-fulfillment'
}

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface SMSJobData {
  to: string;
  message: string;
}

export interface PushNotificationJobData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface ImageProcessingJobData {
  imageUrl: string;
  operations: {
    resize?: { width: number; height: number };
    crop?: { x: number; y: number; width: number; height: number };
    format?: string;
  };
}

export interface AuctionReminderJobData {
  auctionId: string;
  userId: string;
  minutesRemaining: number;
}

export interface JobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}

export interface JobStatus {
  id: string;
  name: string;
  data: any;
  progress: number;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  attemptsMade: number;
  timestamp: number;
  finishedOn?: number;
  processedOn?: number;
  failedReason?: string;
}
