/**
 * Kafka Producer with Tracing Context Injection
 * 
 * Example: How to inject trace context when publishing messages to Kafka.
 * This ensures distributed traces flow through the Kafka pipeline.
 * 
 * Usage: wallet-service, traveler-service, marketplace-service
 */

import { Kafka, Producer } from 'kafkajs';
import { 
  trace, 
  context, 
  SpanStatusCode,
  SpanKind,
} from '@opentelemetry/api';
import { v4 as uuidv4 } from 'uuid';

// Import your tracing setup
import { tracer, injectContextIntoHeaders } from '../tracing';
import { getCurrentSpanContext } from '../tracing';

// Types
interface KafkaMessageHeaders {
  [key: string]: string;
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

class TracedKafkaProducer {
  private kafka: Kafka;
  private producer: Producer;
  private readonly topic = 'activity-events';

  constructor() {
    this.kafka = new Kafka({
      clientId: 'wallet-service',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    });

    this.producer = this.kafka.producer({
      retry: { initialRetryTime: 100, retries: 3 },
      idempotent: true,
    });
  }

  async connect(): Promise<void> {
    await this.producer.connect();
    console.log('[TracedProducer] Connected to Kafka');
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    console.log('[TracedProducer] Disconnected from Kafka');
  }

  /**
   * Publish event with trace context injection
   * 
   * This ensures the trace continues across services via Kafka.
   */
  async publishEvent(
    event: ActivityEventPayload,
    key?: string
  ): Promise<void> {
    // Get current span context
    const parentSpanContext = getCurrentSpanContext();
    
    // Create a span for the publish operation
    const span = tracer.startSpan(
      'kafka.produce',
      {
        kind: SpanKind.PRODUCER,
        attributes: {
          'messaging.system': 'kafka',
          'messaging.destination': this.topic,
          'messaging.destination_kind': 'topic',
          'messaging.operation': 'send',
          'messaging.kafka.message_key': key || event.userId,
          'messaging.kafka.partition': 0, // Will be determined by partitioner
          'event.id': event.eventId,
          'event.domain': event.domain,
          'event.type': event.title,
          'user.id': event.userId,
        },
      }
    );

    try {
      // Create headers with trace context
      const headers: KafkaMessageHeaders = {
        'content-type': 'application/json',
        'source-service': 'wallet-service',
        'event-type': event.title.toLowerCase().replace(' ', '_'),
      };
      
      // Inject trace context into headers
      // This is the KEY step for distributed tracing across Kafka
      injectContextIntoHeaders(headers);
      
      // Also add span context manually for debugging
      if (parentSpanContext) {
        headers['x-trace-id'] = parentSpanContext.traceId;
        headers['x-span-id'] = parentSpanContext.spanId;
      }

      // Execute the produce within the span context
      await context.with(trace.setSpan(context.active(), span), async () => {
        await this.producer.send({
          topic: this.topic,
          messages: [
            {
              key: key || event.userId,
              value: JSON.stringify(event),
              headers: Object.entries(headers).map(([k, v]) => ({ key: k, value: v })),
            },
          ],
        });
      });

      // Record success
      span.setStatus({ code: SpanStatusCode.OK });
      
      console.log(
        `[TracedProducer] Published event ${event.eventId} to Kafka ` +
        `(traceId: ${parentSpanContext?.traceId.slice(-8)})`
      );
    } catch (error) {
      // Record error
      span.recordException(error as Error);
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: (error as Error).message 
      });
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Example: Publish a deposit event
   */
  async publishDeposit(params: {
    userId: string;
    transactionId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
    paymentMethod?: string;
  }): Promise<void> {
    // This can be called within an existing HTTP span
    // The Kafka span will be a child of the HTTP span
    
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
      },
    };

    await this.publishEvent(event, params.userId);
  }
}

// ============================================
// USAGE EXAMPLES
// ============================================

/*
// Example 1: Within an HTTP request handler
app.post('/deposit', async (req, res) => {
  // HTTP span is automatically created by Express instrumentation
  
  const producer = new TracedKafkaProducer();
  await producer.connect();
  
  await producer.publishDeposit({
    userId: req.user.id,
    transactionId: 'txn-123',
    amount: 100,
    currency: 'USD',
    status: 'completed',
  });
  
  // The resulting trace will show:
  // HTTP POST /deposit (parent)
  //   └── kafka.produce (child)
  
  res.json({ success: true });
});

// Example 2: In a service method
class WalletService {
  async processDeposit(depositData: DepositData): Promise<void> {
    // Create a manual span for the business operation
    const span = tracer.startSpan('wallet.process_deposit', {
      attributes: {
        'wallet.transaction_id': depositData.transactionId,
        'wallet.amount': depositData.amount,
        'wallet.currency': depositData.currency,
      },
    });
    
    try {
      // Save to database...
      await this.saveToDatabase(depositData);
      
      // Publish event - will be child of process_deposit span
      await this.producer.publishDeposit({
        userId: depositData.userId,
        transactionId: depositData.transactionId,
        amount: depositData.amount,
        currency: depositData.currency,
        status: 'completed',
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
      throw error;
    } finally {
      span.end();
    }
  }
}

// Example 3: Batch publishing
async function publishBatchEvents(events: ActivityEventPayload[]): Promise<void> {
  const span = tracer.startSpan('kafka.batch_produce', {
    attributes: {
      'messaging.batch.message_count': events.length,
      'messaging.system': 'kafka',
    },
  });
  
  try {
    await Promise.all(
      events.map(event => producer.publishEvent(event))
    );
    
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
  } finally {
    span.end();
  }
}
*/

export default TracedKafkaProducer;
