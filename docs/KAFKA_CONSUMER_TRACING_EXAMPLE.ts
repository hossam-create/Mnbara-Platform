/**
 * Kafka Consumer with Tracing Context Extraction
 * 
 * Example: How to extract trace context when consuming messages from Kafka.
 * This ensures the trace continues from the producer through to processing.
 * 
 * Usage: api-gateway (already implemented in activity.consumer.ts)
 */

import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { 
  trace, 
  context, 
  SpanStatusCode,
  SpanKind,
  propagation,
  type Span,
} from '@opentelemetry/api';

// Import tracing utilities
import { tracer } from '../tracing';

// Types
interface KafkaMessageHeader {
  key: string;
  value: Buffer;
}

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

// TextMapGetter for Kafka headers
const kafkaHeaderGetter = {
  get(carrier: KafkaMessageHeader[], key: string): string | undefined {
    const header = carrier.find(h => h.key === key);
    return header?.value?.toString();
  },
  keys(carrier: KafkaMessageHeader[]): string[] {
    return carrier.map(h => h.key);
  },
};

class TracedKafkaConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private readonly topic = 'activity-events';
  private readonly groupId = 'activity-gateway-consumer';
  private isRunning = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'api-gateway-consumer',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    });

    this.consumer = this.kafka.consumer({
      groupId: this.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
  }

  async connect(): Promise<void> {
    await this.consumer.connect();
    console.log('[TracedConsumer] Connected to Kafka');
  }

  async disconnect(): Promise<void> {
    this.isRunning = false;
    await this.consumer.disconnect();
    console.log('[TracedConsumer] Disconnected from Kafka');
  }

  /**
   * Start consuming with trace extraction
   */
  async start(): Promise<void> {
    await this.consumer.subscribe({ topic: this.topic, fromBeginning: false });
    this.isRunning = true;

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.processMessage(payload);
      },
    });
  }

  /**
   * Process message with trace context extraction
   */
  private async processMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    
    // Extract trace context from Kafka headers
    // This is the KEY step for continuing the trace from the producer
    const headers: KafkaMessageHeader[] = Object.entries(message.headers || {})
      .map(([key, value]) => ({
        key,
        value: value as Buffer,
      }));
    
    // Extract the parent context using OpenTelemetry propagation
    const extractedContext = propagation.extract(context.active(), headers, kafkaHeaderGetter);

    // Get the extracted trace info for logging
    const parentSpanFromHeader = headers.find(h => h.key === 'x-trace-id')?.value?.toString();
    const parentSpanFromContext = trace.getSpan(extractedContext)?.spanContext();

    // Create a span as child of the extracted context
    const span = tracer.startSpan(
      'kafka.consume',
      {
        kind: SpanKind.CONSUMER,
        attributes: {
          'messaging.system': 'kafka',
          'messaging.destination': topic,
          'messaging.destination_kind': 'topic',
          'messaging.operation': 'receive',
          'messaging.kafka.partition': partition,
          'messaging.kafka.offset': message.offset,
          'messaging.kafka.consumer_group': this.groupId,
          'messaging.message_id': message.key?.toString(),
        },
        links: parentSpanFromContext ? [{ context: parentSpanFromContext }] : undefined,
      },
      extractedContext // Use the extracted context as parent
    );

    // Execute processing within the span context
    await context.with(trace.setSpan(context.active(), span), async () => {
      try {
        // Parse the message
        const event: ActivityEventPayload = JSON.parse(message.value?.toString() || '{}');
        
        // Add event attributes to span
        span.setAttributes({
          'event.id': event.eventId,
          'event.domain': event.domain,
          'event.type': event.title,
          'user.id': event.userId,
          'parent.trace_id': parentSpanFromHeader || 'unknown',
        });

        console.log(
          `[TracedConsumer] Processing event ${event.eventId} ` +
          `(traceId: ${parentSpanFromContext?.traceId.slice(-8) || 'new'})`
        );

        // Validate event
        if (!this.validateEvent(event)) {
          span.setStatus({ code: SpanStatusCode.ERROR, message: 'Invalid event schema' });
          span.setAttribute('error.type', 'validation_error');
          throw new Error('Invalid event schema');
        }

        // Process the event (e.g., push to WebSocket)
        await this.processEvent(event, span);

        // Record success
        span.setStatus({ code: SpanStatusCode.OK });
        
        // Commit offset
        await this.consumer.commitOffsets([
          { topic, partition, offset: (Number(message.offset) + 1).toString() },
        ]);

      } catch (error) {
        // Record error
        span.recordException(error as Error);
        span.setStatus({ 
          code: SpanStatusCode.ERROR, 
          message: (error as Error).message 
        });
        
        // Log with trace context
        console.error(
          `[TracedConsumer] Error processing message: ${(error as Error).message} ` +
          `(traceId: ${span.spanContext().traceId.slice(-8)})`
        );
        
        // Don't re-throw to continue processing other messages
        // In production, consider sending to DLQ (Dead Letter Queue)
      } finally {
        span.end();
      }
    });
  }

  /**
   * Validate event schema
   */
  private validateEvent(event: ActivityEventPayload): boolean {
    return !!(
      event.eventId &&
      event.userId &&
      event.domain &&
      event.title &&
      event.timestamp
    );
  }

  /**
   * Process the event (e.g., push to WebSocket clients)
   */
  private async processEvent(event: ActivityEventPayload, parentSpan: Span): Promise<void> {
    // Create child span for WebSocket push
    const pushSpan = tracer.startSpan(
      'websocket.push_event',
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          'websocket.event_type': 'activity:new',
          'websocket.target_user': event.userId,
          'event.id': event.eventId,
        },
      }
    );

    try {
      // Example: Push to connected WebSocket clients
      // await webSocketServer.pushToUser(event.userId, {
      //   type: 'activity:new',
      //   payload: event,
      // });

      pushSpan.setStatus({ code: SpanStatusCode.OK });
      console.log(
        `[TracedConsumer] Pushed event to user ${event.userId} ` +
        `(spanId: ${pushSpan.spanContext().spanId.slice(-8)})`
      );
    } catch (error) {
      pushSpan.recordException(error as Error);
      pushSpan.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
      throw error;
    } finally {
      pushSpan.end();
    }
  }

  getStatus(): { isRunning: boolean; topic: string; groupId: string } {
    return {
      isRunning: this.isRunning,
      topic: this.topic,
      groupId: this.groupId,
    };
  }
}

// ============================================
// USAGE EXAMPLES
// ============================================

/*
// Example 1: Basic setup
const consumer = new TracedKafkaConsumer();

async function bootstrap(): Promise<void> {
  await consumer.connect();
  await consumer.start();
}

// Example 2: With graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down consumer...');
  await consumer.disconnect();
  process.exit(0);
});

// Example 3: Full trace visualization
// 
// When you open Jaeger UI, you'll see a trace like:
// 
// Trace ID: abc123...
// 
// Service: wallet-service
//   ├─ HTTP POST /deposit (1.2ms)
//   ├─ wallet.process_deposit (2.3ms)
//   └─ kafka.produce (0.5ms) ──▶ traceparent header injected
// 
// Service: api-gateway
//   ├─ kafka.consume (0.8ms) ──▶ traceparent header extracted
//   │   └─ websocket.push_event (0.3ms)
//   └─ websocket.send (0.2ms)
// 
// This shows the FULL end-to-end flow!
// 

// Example 4: Error tracking
// If an error occurs, you'll see it in the trace:
// 
// Service: api-gateway
//   ├─ kafka.consume [ERROR: Invalid event schema]
//   │   └─ Tags: error=true, error.message="Invalid event schema"
//   └─ Next message processing...
*/

export default TracedKafkaConsumer;
