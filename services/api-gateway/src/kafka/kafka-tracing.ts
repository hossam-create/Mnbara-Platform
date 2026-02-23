/**
 * Kafka Tracing Helpers
 * 
 * Provides context propagation for Kafka messages:
 * - Inject trace context when publishing messages
 * - Extract trace context when consuming messages
 * 
 * This ensures distributed traces flow through the Kafka pipeline:
 * Service A → Kafka → Service B (same trace ID)
 */

import { 
  context, 
  propagation, 
  trace, 
  SpanContext,
  TextMapGetter,
  TextMapSetter,
} from '@opentelemetry/api';
import type { MessageHeader } from '../websocket/activity-event.types';

/**
 * TextMapSetter for Kafka headers
 */
const kafkaHeaderSetter: TextMapSetter<MessageHeader[]> = {
  set(carrier: MessageHeader[], key: string, value: string): void {
    // Remove existing header with same key
    const existingIndex = carrier.findIndex(h => h.key === key);
    if (existingIndex >= 0) {
      carrier.splice(existingIndex, 1);
    }
    carrier.push({ key, value });
  },
};

/**
 * TextMapGetter for Kafka headers
 */
const kafkaHeaderGetter: TextMapGetter<MessageHeader[]> = {
  get(carrier: MessageHeader[], key: string): string | undefined {
    const header = carrier.find(h => h.key === key);
    return header?.value;
  },
  
  keys(carrier: MessageHeader[]): string[] {
    return carrier.map(h => h.key);
  },
};

/**
 * Inject current trace context into Kafka message headers
 * 
 * Usage:
 * ```typescript
 * const headers: MessageHeader[] = [];
 * injectTraceContext(headers);
 * 
 * await producer.send({
 *   topic: 'activity-events',
 *   messages: [{ key: userId, value: JSON.stringify(event), headers }]
 * });
 * ```
 */
export function injectTraceContext(headers: MessageHeader[]): void {
  propagation.inject(context.active(), headers, kafkaHeaderSetter);
}

/**
 * Extract trace context from Kafka message headers
 * 
 * Usage:
 * ```typescript
 * const extractedContext = extractTraceContext(message.headers);
 * 
 * await context.with(extractedContext, async () => {
 *   // All spans created here will be children of the original trace
 *   const span = tracer.startSpan('process-kafka-message');
 *   // ... processing logic
 *   span.end();
 * });
 * ```
 */
export function extractTraceContext(headers: MessageHeader[]): ReturnType<typeof propagation.extract> {
  return propagation.extract(context.active(), headers, kafkaHeaderGetter);
}

/**
 * Get current span context as object for manual propagation
 */
export function getCurrentSpanContextForPropagation(): SpanContext | null {
  const span = trace.getSpan(context.active());
  if (!span) return null;
  
  return span.spanContext();
}

/**
 * Create headers with trace context for outgoing Kafka messages
 * 
 * Convenience function that creates headers array and injects context
 */
export function createHeadersWithTraceContext(
  additionalHeaders: Record<string, string> = {}
): MessageHeader[] {
  const headers: MessageHeader[] = [];
  
  // Inject trace context
  injectTraceContext(headers);
  
  // Add additional headers
  Object.entries(additionalHeaders).forEach(([key, value]) => {
    headers.push({ key, value });
  });
  
  return headers;
}

/**
 * Trace context keys for debugging
 */
export const TRACE_CONTEXT_KEYS = [
  'traceparent',  // W3C standard
  'tracestate',   // W3C standard
  'uber-trace-id', // Jaeger
  'x-b3-traceid',  // B3 single
  'x-b3-spanid',
  'x-b3-parentspanid',
  'x-b3-sampled',
  'x-b3-flags',
];

/**
 * Check if message has trace context
 */
export function hasTraceContext(headers: MessageHeader[]): boolean {
  return headers.some(h => TRACE_CONTEXT_KEYS.includes(h.key.toLowerCase()));
}

/**
 * Get trace info from headers for logging
 */
export function getTraceInfoFromHeaders(headers: MessageHeader[]): {
  traceId?: string;
  spanId?: string;
  hasContext: boolean;
} {
  const traceparent = headers.find(h => h.key.toLowerCase() === 'traceparent')?.value;
  
  if (traceparent) {
    // Parse W3C traceparent: version-traceId-spanId-flags
    const parts = traceparent.split('-');
    if (parts.length === 4) {
      return {
        traceId: parts[1],
        spanId: parts[2],
        hasContext: true,
      };
    }
  }
  
  // Check Jaeger format
  const jaegerTrace = headers.find(h => h.key === 'uber-trace-id')?.value;
  if (jaegerTrace) {
    const parts = jaegerTrace.split(':');
    if (parts.length >= 2) {
      return {
        traceId: parts[0],
        spanId: parts[1],
        hasContext: true,
      };
    }
  }
  
  return { hasContext: false };
}
