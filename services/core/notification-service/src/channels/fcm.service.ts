import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface PushPayload {
  title: string; body: string; data?: Record<string, string>;
  imageUrl?: string; actionUrl?: string; priority?: 'high' | 'normal';
}

interface SendResult {
  success: boolean; messageId?: string; error?: string;
  successCount?: number; failureCount?: number;
}

@Injectable()
export class FcmChannelService implements OnModuleInit {
  private readonly logger = new Logger(FcmChannelService.name);
  private admin: any = null;
  private initialized = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.initialize();
  }

  private initialize() {
    try {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
      const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

      const firebaseAdmin = require('firebase-admin');

      if (projectId && clientEmail && privateKey) {
        firebaseAdmin.initializeApp({
          credential: firebaseAdmin.credential.cert({ projectId, clientEmail, privateKey }),
        });
        this.admin = firebaseAdmin;
        this.initialized = true;
        this.logger.log('FCM initialized');
      } else {
        const sa = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT');
        if (sa) {
          firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.cert(JSON.parse(sa)) });
          this.admin = firebaseAdmin;
          this.initialized = true;
          this.logger.log('FCM initialized with service account JSON');
        } else {
          this.logger.warn('FCM not initialized - missing credentials');
        }
      }
    } catch (err) {
      this.logger.warn('Firebase Admin module not available or init failed');
    }
  }

  async sendToDevice(token: string, payload: PushPayload): Promise<SendResult> {
    if (!this.initialized) return { success: false, error: 'FCM not initialized' };
    try {
      const message = {
        token, notification: { title: payload.title, body: payload.body, imageUrl: payload.imageUrl },
        data: payload.data || {},
        android: { priority: payload.priority || 'normal', notification: { channelId: 'mnbara_notifications' } },
      };
      const response = await this.admin.messaging().send(message);
      return { success: true, messageId: response };
    } catch (error: any) {
      this.logger.error('FCM send error:', error);
      return { success: false, error: error.message };
    }
  }

  async sendToDevices(tokens: string[], payload: PushPayload): Promise<SendResult> {
    if (!this.initialized) return { success: false, successCount: 0, failureCount: tokens.length };
    try {
      const message = {
        tokens, notification: { title: payload.title, body: payload.body, imageUrl: payload.imageUrl },
        data: payload.data || {},
        android: { priority: payload.priority || 'normal', notification: { channelId: 'mnbara_notifications' } },
      };
      const response = await this.admin.messaging().sendEachForMulticast(message);
      return { success: true, successCount: response.successCount, failureCount: response.failureCount };
    } catch (error: any) {
      this.logger.error('FCM bulk send error:', error);
      return { success: false, successCount: 0, failureCount: tokens.length, error: error.message };
    }
  }

  async sendToTopic(topic: string, payload: PushPayload): Promise<SendResult> {
    if (!this.initialized) return { success: false, error: 'FCM not initialized' };
    try {
      const message = { topic, notification: { title: payload.title, body: payload.body }, data: payload.data || {} };
      const response = await this.admin.messaging().send(message);
      return { success: true, messageId: response };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async processNotificationJob(userId: string, title: string, content: string, data?: Record<string, any>, priority?: string): Promise<boolean> {
    const deviceTokens = await this.prisma.deviceToken.findMany({
      where: { userId, isActive: true, provider: 'FCM' }, select: { token: true },
    });
    if (deviceTokens.length === 0) return false;

    const tokens = deviceTokens.map((t: any) => t.token);
    const fcmPriority: 'high' | 'normal' = priority === 'HIGH' || priority === 'URGENT' ? 'high' : 'normal';

    const result = await this.sendToDevices(tokens, {
      title, body: content,
      data: data ? this.flattenData(data) : undefined,
      priority: fcmPriority,
    });

    return result.success;
  }

  private flattenData(data: Record<string, any>, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      const newKey = prefix ? `${prefix}_${key}` : key;
      if (typeof value === 'object' && value !== null) Object.assign(result, this.flattenData(value, newKey));
      else result[newKey] = String(value);
    }
    return result;
  }
}
