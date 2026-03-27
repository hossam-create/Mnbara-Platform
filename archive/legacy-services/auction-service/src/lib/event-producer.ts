/**
 * Event Producer
 * 
 * Publishes events to the event streaming infrastructure.
 * Handles event serialization, validation, and delivery.
 */

import { Event, EventType, isValidEvent, createEventId } from './event-schema';

// ============================================================
// EVENT PRODUCER INTERFACE
// ============================================================

export interface EventProducerConfig {
  brokerUrl?: string;
  topic?: string;
  retries?: number;
  timeout?: number;
}

// ============================================================
// EVENT PRODUCER
// ============================================================

export class EventProducer {
  private brokerUrl: string;
  private topic: string;
  private retries: number;
  private timeout: number;
  private eventQueue: Event[] = [];
  private isConnected: boolean = false;
  private sequenceNumber: number = 0;

  constructor(config: EventProducerConfig = {}) {
    this.brokerUrl = config.brokerUrl || process.env.EVENT_BROKER_URL || 'http://localhost:9092';
    this.topic = config.topic || process.env.EVENT_TOPIC || 'auction-events';
    this.retries = config.retries || 3;
    this.timeout = config.timeout || 5000;
  }

  /**
   * Connect to event broker
   */
  async connect(): Promise<void> {
    try {
      // In production, this would connect to Kafka/RabbitMQ
      // For now, we'll use a simple HTTP-based approach
      console.log(`[EVENT_PRODUCER] Connecting to ${this.brokerUrl}`);
      this.isConnected = true;
      console.log('[EVENT_PRODUCER] Connected successfully');
    } catch (error) {
      console.error('[EVENT_PRODUCER] Connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from event broker
   */
  async disconnect(): Promise<void> {
    try {
      // Flush any pending events
      await this.flush();
      this.isConnected = false;
      console.log('[EVENT_PRODUCER] Disconnected');
    } catch (error) {
      console.error('[EVENT_PRODUCER] Disconnection error:', error);
    }
  }

  /**
   * Publish a single event
   */
  async publishEvent(event: Event): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Event producer not connected');
    }

    // Validate event
    if (!isValidEvent(event)) {
      throw new Error('Invalid event schema');
    }

    // Add sequence number
    const eventWithSequence = {
      ...event,
      sequenceNumber: ++this.sequenceNumber,
    };

    // Add to queue
    this.eventQueue.push(eventWithSequence);

    // Log event
    console.log(`[EVENT_PUBLISHED] ${event.eventType}:`, {
      eventId: event.eventId,
      userId: event.userId,
      auctionId: event.auctionId,
      timestamp: event.timestamp,
    });

    // Send immediately for critical events
    if (this.isCriticalEvent(event.eventType)) {
      await this.flush();
    }
  }

  /**
   * Publish multiple events
   */
  async publishEvents(events: Event[]): Promise<void> {
    for (const event of events) {
      await this.publishEvent(event);
    }
  }

  /**
   * Flush pending events to broker
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.sendToBroker(eventsToSend);
      console.log(`[EVENT_PRODUCER] Flushed ${eventsToSend.length} events`);
    } catch (error) {
      // Re-queue events on failure
      this.eventQueue.unshift(...eventsToSend);
      console.error('[EVENT_PRODUCER] Flush failed, re-queued events:', error);
      throw error;
    }
  }

  /**
   * Send events to broker with retry logic
   */
  private async sendToBroker(events: Event[], attempt: number = 1): Promise<void> {
    try {
      // In production, this would send to Kafka/RabbitMQ
      // For now, we'll simulate with a simple HTTP POST
      const response = await this.postEvents(events);

      if (!response.ok) {
        throw new Error(`Broker returned ${response.status}`);
      }

      console.log(`[EVENT_PRODUCER] Successfully sent ${events.length} events to broker`);
    } catch (error) {
      if (attempt < this.retries) {
        const backoffMs = Math.pow(2, attempt) * 100; // Exponential backoff
        console.warn(
          `[EVENT_PRODUCER] Send failed (attempt ${attempt}/${this.retries}), retrying in ${backoffMs}ms`,
          error
        );
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        return this.sendToBroker(events, attempt + 1);
      }

      throw new Error(`Failed to send events after ${this.retries} attempts: ${error}`);
    }
  }

  /**
   * Post events to broker (HTTP-based for now)
   */
  private async postEvents(events: Event[]): Promise<Response> {
    // This is a placeholder for actual broker communication
    // In production, use Kafka client or RabbitMQ client
    return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
  }

  /**
   * Check if event is critical (should be sent immediately)
   */
  private isCriticalEvent(eventType: EventType): boolean {
    const criticalEvents = [
      EventType.DISPUTE_CREATED,
      EventType.DISPUTE_ESCALATED,
      EventType.TRUST_ACTION_APPLIED,
      EventType.SETTLEMENT_FAILED,
      EventType.BID_INVALIDATED,
    ];

    return criticalEvents.includes(eventType);
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.eventQueue.length;
  }

  /**
   * Get current sequence number
   */
  getSequenceNumber(): number {
    return this.sequenceNumber;
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

let eventProducerInstance: EventProducer | null = null;

export function getEventProducer(config?: EventProducerConfig): EventProducer {
  if (!eventProducerInstance) {
    eventProducerInstance = new EventProducer(config);
  }
  return eventProducerInstance;
}

export async function initializeEventProducer(config?: EventProducerConfig): Promise<EventProducer> {
  const producer = getEventProducer(config);
  await producer.connect();
  return producer;
}
