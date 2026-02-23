/**
 * WebSocket Tracing Helpers
 * 
 * Provides manual span creation for WebSocket operations:
 * - Connection establishment
 * - Message handling
 * - Event pushing to clients
 * 
 * WebSocket is not auto-instrumented by OpenTelemetry, so we need
 * manual span creation for full visibility.
 */

import { 
  trace, 
  context, 
  SpanStatusCode,
  SpanKind,
  type Span,
  type SpanContext,
} from '@opentelemetry/api';
import type { WebSocket } from 'ws';

const tracer = trace.getTracer('websocket-operations');

/**
 * Extended WebSocket with tracing metadata
 */
export interface TracedWebSocket extends WebSocket {
  socketId?: string;
  userId?: string;
  connectedAt?: string;
  traceContext?: SpanContext;
}

/**
 * Create a span for WebSocket connection
 */
export function createConnectionSpan(
  socket: TracedWebSocket,
  clientMetadata: { ip: string; userAgent?: string; userId?: string }
): Span {
  const span = tracer.startSpan(
    'websocket.connect',
    {
      kind: SpanKind.SERVER,
      attributes: {
        'websocket.event': 'connect',
        'websocket.client.ip': clientMetadata.ip,
        'websocket.client.user_agent': clientMetadata.userAgent || 'unknown',
        'user.id': clientMetadata.userId || 'anonymous',
      },
    }
  );

  // Store trace context on socket for later use
  socket.traceContext = span.spanContext();

  return span;
}

/**
 * Create a span for WebSocket disconnection
 */
export function createDisconnectionSpan(
  socket: TracedWebSocket,
  reason?: string
): Span {
  const parentContext = socket.traceContext 
    ? trace.setSpan(context.active(), trace.wrapSpanContext(socket.traceContext))
    : undefined;

  const span = tracer.startSpan(
    'websocket.disconnect',
    {
      kind: SpanKind.SERVER,
      attributes: {
        'websocket.event': 'disconnect',
        'websocket.socket_id': socket.socketId || 'unknown',
        'user.id': socket.userId || 'anonymous',
        'websocket.disconnect.reason': reason || 'unknown',
        'websocket.connection_duration_ms': socket.connectedAt 
          ? Date.now() - new Date(socket.connectedAt).getTime()
          : 0,
      },
    },
    parentContext
  );

  return span;
}

/**
 * Create a span for WebSocket message handling
 */
export function createMessageSpan(
  socket: TracedWebSocket,
  messageType: string,
  messageSize?: number
): Span {
  const parentContext = socket.traceContext 
    ? trace.setSpan(context.active(), trace.wrapSpanContext(socket.traceContext))
    : undefined;

  const span = tracer.startSpan(
    `websocket.message.${messageType}`,
    {
      kind: SpanKind.SERVER,
      attributes: {
        'websocket.event': 'message',
        'websocket.message.type': messageType,
        'websocket.message.size': messageSize || 0,
        'websocket.socket_id': socket.socketId || 'unknown',
        'user.id': socket.userId || 'anonymous',
      },
    },
    parentContext
  );

  return span;
}

/**
 * Create a span for pushing event to WebSocket client
 */
export function createPushEventSpan(
  socket: TracedWebSocket,
  eventType: string,
  eventId: string,
  payloadSize?: number
): Span {
  const parentContext = socket.traceContext 
    ? trace.setSpan(context.active(), trace.wrapSpanContext(socket.traceContext))
    : undefined;

  const span = tracer.startSpan(
    `websocket.push.${eventType}`,
    {
      kind: SpanKind.PRODUCER,
      attributes: {
        'websocket.event': 'push',
        'websocket.push.event_type': eventType,
        'websocket.push.event_id': eventId,
        'websocket.push.payload_size': payloadSize || 0,
        'websocket.socket_id': socket.socketId || 'unknown',
        'user.id': socket.userId || 'anonymous',
      },
    },
    parentContext
  );

  return span;
}

/**
 * Create a span for heartbeat operation
 */
export function createHeartbeatSpan(
  socket: TracedWebSocket,
  operation: 'ping' | 'pong' | 'timeout'
): Span {
  const parentContext = socket.traceContext 
    ? trace.setSpan(context.active(), trace.wrapSpanContext(socket.traceContext))
    : undefined;

  const span = tracer.startSpan(
    `websocket.heartbeat.${operation}`,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'websocket.event': 'heartbeat',
        'websocket.heartbeat.operation': operation,
        'websocket.socket_id': socket.socketId || 'unknown',
        'user.id': socket.userId || 'anonymous',
      },
    },
    parentContext
  );

  return span;
}

/**
 * Wrap WebSocket operation with span
 */
export async function withWebSocketSpan<T>(
  operation: string,
  socket: TracedWebSocket,
  fn: (span: Span) => Promise<T>,
  attributes: Record<string, string | number | boolean> = {}
): Promise<T> {
  const parentContext = socket.traceContext 
    ? trace.setSpan(context.active(), trace.wrapSpanContext(socket.traceContext))
    : undefined;

  const span = tracer.startSpan(
    `websocket.${operation}`,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'websocket.socket_id': socket.socketId || 'unknown',
        'user.id': socket.userId || 'anonymous',
        ...attributes,
      },
    },
    parentContext
  );

  try {
    const result = await fn(span);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
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
 * Get trace info for logging correlation
 */
export function getWebSocketTraceInfo(socket: TracedWebSocket): {
  traceId?: string;
  spanId?: string;
  socketId?: string;
  userId?: string;
} {
  return {
    traceId: socket.traceContext?.traceId,
    spanId: socket.traceContext?.spanId,
    socketId: socket.socketId,
    userId: socket.userId,
  };
}
