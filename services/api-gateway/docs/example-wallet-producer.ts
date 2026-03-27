/**
 * Example: Wallet Service Kafka Producer
 * 
 * This is a reference implementation showing how wallet-service
 * should publish activity events to Kafka.
 * 
 * Copy this pattern into wallet-service, traveler-service, and marketplace-service.
 */

import { Kafka, Producer } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

// Types (should be shared across services via npm package or shared types repo)
interface ActivityEventPayload {
  eventId: string;
  userId: string;
  domain: 'wallet' | 'traveler' | 'marketplace';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  currency?: string;
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  metadata?: Record<string, unknown>;
}

class WalletActivityProducer {
  private kafka: Kafka;
  private producer: Producer;
  private readonly topic = 'activity-events';

  constructor() {
    this.kafka = new Kafka({
      clientId: 'wallet-service',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      ssl: process.env.KAFKA_SSL === 'true',
      sasl: process.env.KAFKA_SASL_USERNAME
        ? {
            mechanism: 'scram-sha-256',
            username: process.env.KAFKA_SASL_USERNAME,
            password: process.env.KAFKA_SASL_PASSWORD || '',
          }
        : undefined,
    });

    this.producer = this.kafka.producer({
      retry: {
        initialRetryTime: 100,
        retries: 3,
      },
      idempotent: true, // Enable idempotent producer for exactly-once semantics
    });
  }

  async connect(): Promise<void> {
    await this.producer.connect();
    console.log('[WalletProducer] Connected to Kafka');
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    console.log('[WalletProducer] Disconnected from Kafka');
  }

  /**
   * Publish a deposit event
   */
  async publishDeposit(params: {
    userId: string;
    transactionId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
    paymentMethod?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const event: ActivityEventPayload = {
      eventId: uuidv4(),
      userId: params.userId,
      domain: 'wallet',
      title: 'Deposit',
      description: `Deposit of ${params.amount} ${params.currency} ${params.status}`,
      timestamp: new Date().toISOString(),
      amount: params.amount,
      currency: params.currency,
      status: params.status,
      metadata: {
        transactionId: params.transactionId,
        paymentMethod: params.paymentMethod,
        ...params.metadata,
      },
    };

    await this.publish(event);
  }

  /**
   * Publish a withdrawal event
   */
  async publishWithdrawal(params: {
    userId: string;
    transactionId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
    withdrawalMethod?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const event: ActivityEventPayload = {
      eventId: uuidv4(),
      userId: params.userId,
      domain: 'wallet',
      title: 'Withdrawal',
      description: `Withdrawal of ${params.amount} ${params.currency} ${params.status}`,
      timestamp: new Date().toISOString(),
      amount: params.amount,
      currency: params.currency,
      status: params.status,
      metadata: {
        transactionId: params.transactionId,
        withdrawalMethod: params.withdrawalMethod,
        ...params.metadata,
      },
    };

    await this.publish(event);
  }

  /**
   * Publish an escrow hold event
   */
  async publishEscrowHold(params: {
    userId: string;
    transactionId: string;
    escrowId: string;
    orderId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const event: ActivityEventPayload = {
      eventId: uuidv4(),
      userId: params.userId,
      domain: 'wallet',
      title: 'Escrow Hold',
      description: `Funds held in escrow for order #${params.orderId}`,
      timestamp: new Date().toISOString(),
      amount: params.amount,
      currency: params.currency,
      status: params.status,
      metadata: {
        transactionId: params.transactionId,
        escrowId: params.escrowId,
        orderId: params.orderId,
        ...params.metadata,
      },
    };

    await this.publish(event);
  }

  /**
   * Publish a transfer event
   */
  async publishTransfer(params: {
    userId: string;
    transactionId: string;
    amount: number;
    currency: string;
    recipientId: string;
    status: 'pending' | 'completed' | 'failed';
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const event: ActivityEventPayload = {
      eventId: uuidv4(),
      userId: params.userId,
      domain: 'wallet',
      title: 'Transfer',
      description: `Transfer of ${params.amount} ${params.currency} to ${params.recipientId}`,
      timestamp: new Date().toISOString(),
      amount: params.amount,
      currency: params.currency,
      status: params.status,
      metadata: {
        transactionId: params.transactionId,
        recipientId: params.recipientId,
        ...params.metadata,
      },
    };

    await this.publish(event);
  }

  /**
   * Generic publish method
   */
  private async publish(event: ActivityEventPayload): Promise<void> {
    try {
      await this.producer.send({
        topic: this.topic,
        messages: [
          {
            key: event.userId, // Partition by userId for ordering
            value: JSON.stringify(event),
            headers: {
              'content-type': 'application/json',
              'source-service': 'wallet-service',
              'event-type': event.title.toLowerCase().replace(' ', '_'),
            },
          },
        ],
      });

      console.log(`[WalletProducer] Published event ${event.eventId} for user ${event.userId}`);
    } catch (error) {
      console.error('[WalletProducer] Failed to publish event:', error);
      // In production: retry with exponential backoff or store in dead letter queue
      throw error;
    }
  }
}

// Usage example in wallet-service:
/*
const producer = new WalletActivityProducer();
await producer.connect();

// When deposit is completed:
await producer.publishDeposit({
  userId: 'user-123',
  transactionId: 'txn-456',
  amount: 250.00,
  currency: 'USD',
  status: 'completed',
  paymentMethod: 'credit_card',
  metadata: { last4: '4242' }
});

// On graceful shutdown:
await producer.disconnect();
*/

export default WalletActivityProducer;
