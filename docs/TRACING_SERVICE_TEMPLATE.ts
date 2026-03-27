/**
 * OpenTelemetry Tracing Bootstrap Template
 * 
 * Copy this file to each microservice and update SERVICE_NAME:
 * - api-gateway (already done)
 * - wallet-service
 * - traveler-service
 * - marketplace-service
 * - auth-service
 * - order-service
 * - etc.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { trace, context, propagation, SpanStatusCode } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { JaegerPropagator } from '@opentelemetry/propagator-jaeger';
import { B3Propagator, B3InjectEncoding } from '@opentelemetry/propagator-b3';
import { CompositePropagator, W3CTraceContextPropagator } from '@opentelemetry/core';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import type { Span, SpanContext } from '@opentelemetry/api';

// ============================================
// CONFIGURATION - Update this for each service
// ============================================
const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'wallet-service';  // CHANGE THIS
const OTEL_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';
const OTEL_ENVIRONMENT = process.env.OTEL_ENVIRONMENT || 'development';
const OTEL_SAMPLING_RATE = parseFloat(process.env.OTEL_SAMPLING_RATE || '0.2');

// Initialize propagator for context propagation
const propagator = new CompositePropagator({
  propagators: [
    new W3CTraceContextPropagator(),  // W3C standard (traceparent/tracestate)
    new JaegerPropagator(),            // Jaeger format
    new B3Propagator({ injectEncoding: B3InjectEncoding.MULTI_HEADER }), // B3 format
  ],
});

// Configure OTLP trace exporter
const traceExporter = new OTLPTraceExporter({
  url: OTEL_ENDPOINT,
  headers: {},
  concurrencyLimit: 10,
});

// Create the Node SDK
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: SERVICE_NAME,
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: OTEL_ENVIRONMENT,
    [SemanticResourceAttributes.HOST_NAME]: process.env.HOSTNAME || 'localhost',
    'service.namespace': 'mnbara-platform',
    'service.instance.id': process.env.POD_NAME || process.env.HOSTNAME || 'instance-1',
  }),
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-dns': { enabled: false },
    }),
    new HttpInstrumentation({
      headersToSpanAttributes: {
        client: {
          requestHeaders: ['x-request-id', 'authorization', 'x-user-id'],
          responseHeaders: ['x-request-id'],
        },
        server: {
          requestHeaders: ['x-request-id', 'authorization', 'x-user-id'],
          responseHeaders: ['x-request-id'],
        },
      },
    }),
    new ExpressInstrumentation(),
    new IORedisInstrumentation({
      dbStatementSerializer: (cmd: string, args: unknown[]) => {
        return `${cmd} [${Array.isArray(args) ? args.length : 0} args]`;
      },
    }),
  ],
  contextManager: new AsyncLocalStorageContextManager(),
  textMapPropagator: propagator,
});

// Initialize the SDK
export function initTracing(): void {
  sdk.start();
  console.log(`[Tracing] OpenTelemetry initialized for ${SERVICE_NAME}`);
  console.log(`[Tracing] OTLP endpoint: ${OTEL_ENDPOINT}`);
  console.log(`[Tracing] Sampling rate: ${OTEL_SAMPLING_RATE}`);
  
  process.on('SIGTERM', async () => await shutdownTracing());
  process.on('SIGINT', async () => await shutdownTracing());
}

export async function shutdownTracing(): Promise<void> {
  try {
    await sdk.shutdown();
    console.log('[Tracing] OpenTelemetry SDK shut down successfully');
  } catch (error) {
    console.error('[Tracing] Error shutting down OpenTelemetry SDK:', error);
  }
}

export const tracer = trace.getTracer(SERVICE_NAME, process.env.npm_package_version || '1.0.0');

/**
 * Extract trace context from headers (for incoming requests)
 */
export function extractContextFromHeaders(headers: Record<string, string>): ReturnType<typeof propagation.extract> {
  const getter = {
    get: (carrier: Record<string, string>, key: string) => carrier[key],
    keys: (carrier: Record<string, string>) => Object.keys(carrier),
  };
  return propagation.extract(context.active(), headers, getter);
}

/**
 * Inject trace context into headers (for outgoing requests)
 */
export function injectContextIntoHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const setter = {
    set: (carrier: Record<string, string>, key: string, value: string) => {
      carrier[key] = value;
    },
  };
  propagation.inject(context.active(), headers, setter);
  return headers;
}

/**
 * Get current span context
 */
export function getCurrentSpanContext(): SpanContext | undefined {
  const span = trace.getSpan(context.active());
  return span?.spanContext();
}

/**
 * Wrap function with span
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes: Record<string, string | number | boolean> = {}
): Promise<T> {
  const span = tracer.startSpan(name, { attributes });
  
  try {
    const result = await context.with(trace.setSpan(context.active(), span), () => fn(span));
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
    throw error;
  } finally {
    span.end();
  }
}

export const tracingConfig = {
  serviceName: SERVICE_NAME,
  endpoint: OTEL_ENDPOINT,
  environment: OTEL_ENVIRONMENT,
  samplingRate: OTEL_SAMPLING_RATE,
};
