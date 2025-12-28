import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://mnbara:mnbara_dev_password@rabbitmq:5672';

/**
 * Transaction Event Publisher
 * ناشر أحداث المعاملات - Publishes transaction events for real-time processing
 */

export interface TransactionEvent {
  eventId: string;
  eventType: 'INITIATED' | 'COMPLETED' | 'FAILED' | 'REVERSED' | 'PENDING';
  transactionId: string;
  userId: string;
  amount: number;
  currency: string;
  transactionType: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'CONVERSION' | 'PAYMENT';
  timestamp: Date;
  metadata?: {
    fromCurrency?: string;
    toCurrency?: string;
    exchangeRate?: number;
    fee?: number;
    referenceId?: string;
    ipAddress?: string;
    deviceId?: string;
    location?: { country?: string; city?: string };
  };
}

export interface FraudAlertEvent {
  alertId: string;
  transactionId: string;
  userId: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  signals: {
    type: string;
    severity: number;
    description: string;
  }[];
  recommendation: 'APPROVE' | 'MANUAL_REVIEW' | 'DECLINE' | 'CHALLENGE';
  timestamp: Date;
}

export interface SecurityEvent {
  eventId: string;
  eventType: 'BIOMETRIC_FAILED' | 'LIMIT_EXCEEDED' | 'SUSPICIOUS_ACTIVITY' | 'LOGIN_ANOMALY' | 'DEVICE_CHANGED';
  userId: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  details: Record<string, unknown>;
  timestamp: Date;
}

// Connection management
let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

async function getChannel(): Promise<amqp.Channel> {
  if (channel) return channel;
  
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Ensure exchanges exist
    await channel.assertExchange('mnbara.transactions', 'topic', { durable: true });
    await channel.assertExchange('mnbara.fraud', 'topic', { durable: true });
    await channel.assertExchange('mnbara.audit', 'fanout', { durable: true });
    
    console.log('[EventPublisher] RabbitMQ channel created');
    return channel;
  } catch (error) {
    console.error('[EventPublisher] Failed to connect to RabbitMQ:', error);
    throw error;
  }
}

export class TransactionEventPublisher {
  /**
   * Publish transaction event
   */
  static async publishTransactionEvent(event: TransactionEvent): Promise<void> {
    try {
      const ch = await getChannel();
      const routingKey = `transaction.${event.eventType.toLowerCase()}`;
      const message = Buffer.from(JSON.stringify({
        ...event,
        publishedAt: new Date().toISOString()
      }));
      
      ch.publish('mnbara.transactions', routingKey, message, { persistent: true });
      console.log(`[EventPublisher] Published ${routingKey} for transaction ${event.transactionId}`);
    } catch (error) {
      console.error('[EventPublisher] Failed to publish transaction event:', error);
    }
  }

  /**
   * Publish fraud alert
   */
  static async publishFraudAlert(alert: FraudAlertEvent): Promise<void> {
    try {
      const ch = await getChannel();
      const routingKey = `fraud.${alert.riskLevel.toLowerCase()}`;
      const message = Buffer.from(JSON.stringify({
        ...alert,
        publishedAt: new Date().toISOString()
      }));
      
      ch.publish('mnbara.fraud', routingKey, message, { persistent: true });

      // Send notification for high-risk alerts
      if (alert.riskLevel === 'CRITICAL' || alert.riskLevel === 'HIGH') {
        const notification = Buffer.from(JSON.stringify({
          type: 'FRAUD_ALERT',
          userId: alert.userId,
          title: 'Security Alert',
          titleAr: 'تنبيه أمني',
          message: `Suspicious activity detected. Transaction ${alert.transactionId} is being reviewed.`,
          messageAr: `تم اكتشاف نشاط مشبوه. المعاملة ${alert.transactionId} قيد المراجعة.`,
          priority: 'high',
          timestamp: new Date().toISOString()
        }));
        
        await ch.assertQueue('notifications', { durable: true });
        ch.sendToQueue('notifications', notification, { persistent: true });
      }

      console.log(`[EventPublisher] Published fraud alert ${alert.alertId} - Level: ${alert.riskLevel}`);
    } catch (error) {
      console.error('[EventPublisher] Failed to publish fraud alert:', error);
    }
  }

  /**
   * Publish security event
   */
  static async publishSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const ch = await getChannel();
      const routingKey = `security.${event.eventType.toLowerCase()}`;
      const message = Buffer.from(JSON.stringify({
        ...event,
        publishedAt: new Date().toISOString()
      }));
      
      ch.publish('mnbara.fraud', routingKey, message, { persistent: true });

      if (event.severity === 'CRITICAL') {
        await ch.assertQueue('security-events', { durable: true });
        ch.sendToQueue('security-events', message, { persistent: true });
      }

      console.log(`[EventPublisher] Published security event ${event.eventType} for user ${event.userId}`);
    } catch (error) {
      console.error('[EventPublisher] Failed to publish security event:', error);
    }
  }

  /**
   * Publish limit exceeded event
   */
  static async publishLimitExceeded(data: {
    userId: string;
    limitType: string;
    currentUsage: number;
    limit: number;
    attemptedAmount: number;
    transactionType: string;
  }): Promise<void> {
    try {
      const ch = await getChannel();
      const message = Buffer.from(JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      }));
      
      await ch.assertQueue('limit-exceeded', { durable: true });
      ch.sendToQueue('limit-exceeded', message, { persistent: true });

      // Send user notification
      const notification = Buffer.from(JSON.stringify({
        type: 'LIMIT_EXCEEDED',
        userId: data.userId,
        title: 'Transaction Limit Reached',
        titleAr: 'تم الوصول إلى حد المعاملات',
        message: `Your ${data.limitType} limit of ${data.limit} has been reached.`,
        messageAr: `تم الوصول إلى الحد ${data.limitType} البالغ ${data.limit}.`,
        priority: 'normal',
        timestamp: new Date().toISOString()
      }));
      
      await ch.assertQueue('notifications', { durable: true });
      ch.sendToQueue('notifications', notification, { persistent: true });

      console.log(`[EventPublisher] Published limit exceeded for user ${data.userId}`);
    } catch (error) {
      console.error('[EventPublisher] Failed to publish limit exceeded:', error);
    }
  }

  /**
   * Publish audit log event
   */
  static async publishAuditLog(data: {
    eventType: string;
    userId: string;
    action: string;
    details: Record<string, unknown>;
    outcome: 'SUCCESS' | 'FAILURE' | 'PENDING' | 'BLOCKED';
  }): Promise<void> {
    try {
      const ch = await getChannel();
      const message = Buffer.from(JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      }));
      
      ch.publish('mnbara.audit', '', message, { persistent: true });
      console.log(`[EventPublisher] Published audit log: ${data.eventType}`);
    } catch (error) {
      console.error('[EventPublisher] Failed to publish audit log:', error);
    }
  }
}

export const transactionEventPublisher = TransactionEventPublisher;
