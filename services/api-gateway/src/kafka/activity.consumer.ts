/**
 * Kafka Activity Consumer
 * 
 * Consumes activity events from Kafka topic and pushes to connected WebSocket clients.
 * Features:
 * - Subscribe to activity-events topic
 * - Parse and validate event schema
 * - Filter by userId
 * - Push to correct connected socket via WebSocket server
 * - Auto offset commit enabled
 * - Graceful shutdown handling
 */

import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { config } from '../config';
import { activityWebSocketServer } from '../websocket/activity.socket';
import { ActivityEventPayload, ActivityDomain } from '../websocket/activity-event.types';

// Kafka configuration
const KAFKA_BROKERS = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
const KAFKA_GROUP_ID = process.env.KAFKA_ACTIVITY_GROUP_ID || 'activity-gateway-consumer';
const KAFKA_TOPIC = 'activity-events';

export class ActivityKafkaConsumer {
  private kafka: Kafka | null = null;
  private consumer: Consumer | null = null;
  private isRunning = false;

  // Valid domains for validation
  private validDomains: ActivityDomain[] = ['wallet', 'traveler', 'marketplace'];

  /**
   * Initialize Kafka client and consumer
   */
  async initialize(): Promise<void> {
    try {
      this.kafka = new Kafka({
        clientId: 'api-gateway-activity',
        brokers: KAFKA_BROKERS,
        ssl: process.env.KAFKA_SSL === 'true',
        sasl: process.env.KAFKA_SASL_USERNAME
          ? {
              mechanism: 'scram-sha-256',
              username: process.env.KAFKA_SASL_USERNAME,
              password: process.env.KAFKA_SASL_PASSWORD || '',
            }
          : undefined,
        retry: {
          initialRetryTime: 100,
          retries: 5,
          maxRetryTime: 30000,
        },
      });

      this.consumer = this.kafka.consumer({
        groupId: KAFKA_GROUP_ID,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        maxBytesPerPartition: 1048576, // 1MB
        maxBytes: 5242880, // 5MB
        autoCommit: true,
        autoCommitInterval: 5000, // Commit every 5 seconds
        autoCommitThreshold: 100, // Commit after 100 messages
      });

      console.log('[KafkaConsumer] Initialized');
    } catch (error) {
      console.error('[KafkaConsumer] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Start consuming messages from activity-events topic
   */
  async start(): Promise<void> {
    if (!this.consumer) {
      throw new Error('Consumer not initialized');
    }

    if (this.isRunning) {
      console.warn('[KafkaConsumer] Already running');
      return;
    }

    try {
      // Connect to Kafka
      await this.consumer.connect();
      console.log('[KafkaConsumer] Connected to Kafka');

      // Subscribe to topic
      await this.consumer.subscribe({
        topic: KAFKA_TOPIC,
        fromBeginning: false, // Only consume new messages
      });
      console.log(`[KafkaConsumer] Subscribed to topic: ${KAFKA_TOPIC}`);

      // Start consuming
      await this.consumer.run({
        eachMessage: this.handleMessage.bind(this),
      });

      this.isRunning = true;
      console.log('[KafkaConsumer] Started consuming messages');

      // Setup error handling
      this.consumer.on('consumer.crash', (event) => {
        console.error('[KafkaConsumer] Consumer crashed:', event);
        this.isRunning = false;
      });

      this.consumer.on('consumer.disconnect', () => {
        console.warn('[KafkaConsumer] Consumer disconnected');
        this.isRunning = false;
      });

    } catch (error) {
      console.error('[KafkaConsumer] Failed to start:', error);
      throw error;
    }
  }

  /**
   * Handle incoming Kafka message
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      // Parse message value
      const value = message.value?.toString();
      if (!value) {
        console.warn('[KafkaConsumer] Empty message value');
        return;
      }

      // Parse JSON
      let event: ActivityEventPayload;
      try {
        event = JSON.parse(value) as ActivityEventPayload;
      } catch {
        console.error('[KafkaConsumer] Invalid JSON in message:', value);
        return;
      }

      // Validate event schema
      if (!this.validateEvent(event)) {
        console.error('[KafkaConsumer] Invalid event schema:', event);
        return;
      }

      // Log receipt (with latency info)
      const timestamp = message.timestamp
        ? new Date(parseInt(message.timestamp, 10)).toISOString()
        : 'unknown';
      console.log(
        `[KafkaConsumer] Received event ${event.eventId} for user ${event.userId} ` +
        `from ${topic}[${partition}] at ${timestamp}`
      );

      // Push to WebSocket
      await activityWebSocketServer.sendActivityToUser(event.userId, event);

    } catch (error) {
      console.error('[KafkaConsumer] Error processing message:', error);
      // Don't throw - we want to continue processing other messages
    }
  }

  /**
   * Validate activity event schema
   */
  private validateEvent(event: unknown): event is ActivityEventPayload {
    if (!event || typeof event !== 'object') {
      return false;
    }

    const e = event as Record<string, unknown>;

    // Required fields
    const requiredFields = ['eventId', 'userId', 'domain', 'title', 'description', 'timestamp'];
    for (const field of requiredFields) {
      if (!e[field] || typeof e[field] !== 'string') {
        console.error(`[KafkaConsumer] Missing or invalid field: ${field}`);
        return false;
      }
    }

    // Validate domain
    if (!this.validDomains.includes(e.domain as ActivityDomain)) {
      console.error(`[KafkaConsumer] Invalid domain: ${e.domain}`);
      return false;
    }

    // Validate UUID format for eventId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(e.eventId as string)) {
      console.error(`[KafkaConsumer] Invalid eventId format: ${e.eventId}`);
      return false;
    }

    // Validate timestamp is ISO 8601
    const timestamp = new Date(e.timestamp as string);
    if (isNaN(timestamp.getTime())) {
      console.error(`[KafkaConsumer] Invalid timestamp: ${e.timestamp}`);
      return false;
    }

    // Optional field validations
    if (e.amount !== undefined && typeof e.amount !== 'number') {
      console.error(`[KafkaConsumer] Invalid amount: ${e.amount}`);
      return false;
    }

    if (e.currency !== undefined && typeof e.currency !== 'string') {
      console.error(`[KafkaConsumer] Invalid currency: ${e.currency}`);
      return false;
    }

    return true;
  }

  /**
   * Pause consumption (for maintenance)
   */
  async pause(): Promise<void> {
    if (!this.consumer || !this.isRunning) return;

    try {
      await this.consumer.pause([{ topic: KAFKA_TOPIC }]);
      console.log('[KafkaConsumer] Paused');
    } catch (error) {
      console.error('[KafkaConsumer] Failed to pause:', error);
    }
  }

  /**
   * Resume consumption
   */
  async resume(): Promise<void> {
    if (!this.consumer || !this.isRunning) return;

    try {
      await this.consumer.resume([{ topic: KAFKA_TOPIC }]);
      console.log('[KafkaConsumer] Resumed');
    } catch (error) {
      console.error('[KafkaConsumer] Failed to resume:', error);
    }
  }

  /**
   * Get consumer status
   */
  getStatus(): { isRunning: boolean; topic: string; groupId: string } {
    return {
      isRunning: this.isRunning,
      topic: KAFKA_TOPIC,
      groupId: KAFKA_GROUP_ID,
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[KafkaConsumer] Shutting down...');

    this.isRunning = false;

    if (this.consumer) {
      try {
        await this.consumer.disconnect();
        console.log('[KafkaConsumer] Disconnected from Kafka');
      } catch (error) {
        console.error('[KafkaConsumer] Error during shutdown:', error);
      }
    }
  }
}

// Export singleton
export const activityKafkaConsumer = new ActivityKafkaConsumer();
export default activityKafkaConsumer;
