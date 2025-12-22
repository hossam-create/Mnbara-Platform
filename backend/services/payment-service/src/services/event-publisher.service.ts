/**
 * Event Publisher Service
 * Publishes payment events to RabbitMQ for notification and order services
 */

// @ts-ignore - amqplib types will be installed via npm
import amqp from 'amqplib';
import type { Connection, Channel } from 'amqplib';

// Event types
export interface PaymentSucceededEvent {
  provider: string;
  paymentId: string;
  amount: number;
  currency?: string;
  orderId?: string;
  userId?: string;
}

export interface PaymentFailedEvent {
  provider: string;
  paymentId: string;
  error?: string;
  orderId?: string;
  userId?: string;
}

export interface PaymentRefundedEvent {
  provider: string;
  paymentId: string;
  amount: number;
  isPartial?: boolean;
  orderId?: string;
}

export interface DisputeCreatedEvent {
  provider: string;
  paymentId: string;
  disputeId: string;
  reason?: string;
  amount?: number;
}

export interface EscrowReleasedEvent {
  escrowId: number;
  orderId: number;
  amount: number;
  recipientId: number;
  recipientType: 'seller' | 'traveler';
}

export interface EscrowRefundedEvent {
  escrowId: number;
  orderId: number;
  amount: number;
  buyerId: number;
  reason: string;
}

// Exchange and queue names
const EXCHANGE_NAME = 'mnbara.payments';
const QUEUES = {
  PAYMENT_EVENTS: 'payment.events',
  NOTIFICATION_EVENTS: 'payment.notifications',
  ORDER_EVENTS: 'payment.orders'
};

// Routing keys
const ROUTING_KEYS = {
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',
  DISPUTE_CREATED: 'payment.dispute.created',
  ESCROW_RELEASED: 'escrow.released',
  ESCROW_REFUNDED: 'escrow.refunded'
};

class EventPublisherService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  /**
   * Initialize connection to RabbitMQ
   */
  async connect(): Promise<void> {
    if (this.connection && this.channel) return;
    if (this.isConnecting) return;

    this.isConnecting = true;

    try {
      const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      console.log('Connecting to RabbitMQ...');
      
      this.connection = await amqp.connect(rabbitUrl);
      this.channel = await this.connection.createChannel();

      // Setup exchange
      await this.channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

      // Setup queues
      await this.channel.assertQueue(QUEUES.PAYMENT_EVENTS, { durable: true });
      await this.channel.assertQueue(QUEUES.NOTIFICATION_EVENTS, { durable: true });
      await this.channel.assertQueue(QUEUES.ORDER_EVENTS, { durable: true });

      // Bind queues to exchange
      await this.channel.bindQueue(QUEUES.PAYMENT_EVENTS, EXCHANGE_NAME, 'payment.*');
      await this.channel.bindQueue(QUEUES.NOTIFICATION_EVENTS, EXCHANGE_NAME, 'payment.*');
      await this.channel.bindQueue(QUEUES.NOTIFICATION_EVENTS, EXCHANGE_NAME, 'escrow.*');
      await this.channel.bindQueue(QUEUES.ORDER_EVENTS, EXCHANGE_NAME, 'payment.succeeded');
      await this.channel.bindQueue(QUEUES.ORDER_EVENTS, EXCHANGE_NAME, 'escrow.*');

      // Handle connection close
      this.connection.on('close', () => {
        console.log('RabbitMQ connection closed');
        this.connection = null;
        this.channel = null;
        this.scheduleReconnect();
      });

      this.connection.on('error', (err?: Error) => {
        console.error('RabbitMQ connection error:', err);
      });

      this.reconnectAttempts = 0;
      console.log('Connected to RabbitMQ successfully');

    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      this.scheduleReconnect();
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    setTimeout(() => this.connect(), delay);
  }

  /**
   * Publish event to exchange
   */
  private async publish(routingKey: string, event: any): Promise<boolean> {
    try {
      if (!this.channel) {
        await this.connect();
      }

      if (!this.channel) {
        console.error('Cannot publish event: no channel available');
        // Store event for later retry (could use Redis or DB)
        return false;
      }

      const message = Buffer.from(JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
        source: 'payment-service'
      }));

      this.channel.publish(EXCHANGE_NAME, routingKey, message, {
        persistent: true,
        contentType: 'application/json'
      });

      console.log(`Published event: ${routingKey}`, { paymentId: event.paymentId });
      return true;

    } catch (error) {
      console.error(`Failed to publish event ${routingKey}:`, error);
      return false;
    }
  }

  /**
   * Publish payment succeeded event
   */
  async publishPaymentSucceeded(event: PaymentSucceededEvent): Promise<boolean> {
    return this.publish(ROUTING_KEYS.PAYMENT_SUCCEEDED, event);
  }

  /**
   * Publish payment failed event
   */
  async publishPaymentFailed(event: PaymentFailedEvent): Promise<boolean> {
    return this.publish(ROUTING_KEYS.PAYMENT_FAILED, event);
  }

  /**
   * Publish payment refunded event
   */
  async publishPaymentRefunded(event: PaymentRefundedEvent): Promise<boolean> {
    return this.publish(ROUTING_KEYS.PAYMENT_REFUNDED, event);
  }

  /**
   * Publish dispute created event
   */
  async publishDisputeCreated(event: DisputeCreatedEvent): Promise<boolean> {
    return this.publish(ROUTING_KEYS.DISPUTE_CREATED, event);
  }

  /**
   * Publish escrow released event
   */
  async publishEscrowReleased(event: EscrowReleasedEvent): Promise<boolean> {
    return this.publish(ROUTING_KEYS.ESCROW_RELEASED, event);
  }

  /**
   * Publish escrow refunded event
   */
  async publishEscrowRefunded(event: EscrowRefundedEvent): Promise<boolean> {
    return this.publish(ROUTING_KEYS.ESCROW_REFUNDED, event);
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      console.log('RabbitMQ connection closed');
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }
}

// Export singleton instance
export const EventPublisher = new EventPublisherService();

export default EventPublisher;
