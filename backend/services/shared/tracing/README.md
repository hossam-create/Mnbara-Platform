# OpenTelemetry Tracing for MNBARA Services

This module provides distributed tracing capabilities for all MNBARA backend services using OpenTelemetry.

## Quick Start

Initialize tracing at the very beginning of your service entry point (before any other imports):

```typescript
// This MUST be the first import in your service
import { initTracing } from '@mnbara/shared/tracing';

// Initialize tracing before any other code
initTracing({
  serviceName: 'your-service-name',
  serviceVersion: '1.0.0',
});

// Now import other modules
import express from 'express';
// ... rest of your imports
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry Collector URL | `http://otel-collector:4317` |
| `OTEL_SAMPLING_RATIO` | Sampling ratio (0.0 - 1.0) | `0.1` |
| `NODE_ENV` | Environment name | `development` |
| `CLUSTER_NAME` | Kubernetes cluster name | `mnbara-production` |

### Programmatic Configuration

```typescript
initTracing({
  serviceName: 'payment-service',
  serviceVersion: '2.1.0',
  environment: 'production',
  collectorUrl: 'http://otel-collector:4317',
  samplingRatio: 0.1,  // Sample 10% of traces
  enableMetrics: true,
  enableLogging: false,
});
```

## Auto-Instrumentation

The following libraries are automatically instrumented:

- **HTTP/HTTPS** - All outgoing and incoming HTTP requests
- **Express** - Express.js middleware and routes
- **Fastify** - Fastify routes and hooks
- **PostgreSQL** - Database queries via pg driver
- **Redis** - Redis commands
- **gRPC** - gRPC client and server calls
- **RabbitMQ** - AMQP message publishing and consuming
- **Prisma** - Prisma ORM queries
- **Socket.io** - WebSocket events

## Custom Spans

Create custom spans for business logic:

```typescript
import { trace, SpanKind, SpanStatusCode } from '@mnbara/shared/tracing';

const tracer = trace.getTracer('my-service');

async function processPayment(orderId: string, amount: number) {
  return tracer.startActiveSpan('process-payment', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'order.id': orderId,
      'payment.amount': amount,
    },
  }, async (span) => {
    try {
      // Your business logic here
      const result = await paymentGateway.charge(amount);
      
      span.setAttribute('payment.transaction_id', result.transactionId);
      span.setStatus({ code: SpanStatusCode.OK });
      
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}
```

## Context Propagation

Trace context is automatically propagated via W3C Trace Context headers:
- `traceparent`
- `tracestate`

For manual propagation (e.g., in message queues):

```typescript
import { context, propagation } from '@opentelemetry/api';

// Inject context into message headers
const headers = {};
propagation.inject(context.active(), headers);
await queue.publish({ data, headers });

// Extract context from message headers
const ctx = propagation.extract(context.active(), message.headers);
context.with(ctx, () => {
  // Process message with correct trace context
});
```

## Viewing Traces

Traces are exported to Jaeger via the OpenTelemetry Collector.

- **Jaeger UI**: http://jaeger-query:16686
- **Grafana**: Integrated via Jaeger datasource

## Sampling Strategies

The OpenTelemetry Collector uses tail-based sampling with the following policies:

1. **Always sample errors** - All traces with error status
2. **Always sample slow requests** - Requests taking > 2 seconds
3. **Higher sampling for critical services** - Payment and Auction services
4. **Probabilistic sampling** - 10% of remaining traces

## Troubleshooting

### Traces not appearing in Jaeger

1. Check OTEL Collector is running: `kubectl get pods -n monitoring -l app.kubernetes.io/name=otel-collector`
2. Check service logs for tracing initialization
3. Verify `OTEL_EXPORTER_OTLP_ENDPOINT` is correct
4. Check OTEL Collector logs for export errors

### High memory usage

Reduce batch size in tracing config:
```typescript
spanProcessor: new BatchSpanProcessor(traceExporter, {
  maxQueueSize: 1024,  // Reduce from 2048
  maxExportBatchSize: 256,  // Reduce from 512
});
```

### Missing spans

Ensure tracing is initialized before any other imports in your service entry point.
