/**
 * OpenTelemetry Tracing Configuration for MNBARA Backend Services
 * 
 * This module configures distributed tracing using OpenTelemetry SDK.
 * Traces are exported to the OpenTelemetry Collector which forwards to Jaeger.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// Configuration interface
export interface TracingConfig {
  serviceName: string;
  serviceVersion?: string;
  environment?: string;
  collectorUrl?: string;
  samplingRatio?: number;
  enableMetrics?: boolean;
  enableLogging?: boolean;
}

// Default configuration
const defaultConfig: Partial<TracingConfig> = {
  serviceVersion: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  collectorUrl: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4317',
  samplingRatio: parseFloat(process.env.OTEL_SAMPLING_RATIO || '0.1'),
  enableMetrics: true,
  enableLogging: process.env.NODE_ENV !== 'production',
};

let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry tracing for a service
 */
export function initTracing(config: TracingConfig): NodeSDK {
  const finalConfig = { ...defaultConfig, ...config };

  // Enable diagnostic logging in development
  if (finalConfig.enableLogging) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
  }

  // Create resource with service information
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: finalConfig.serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: finalConfig.serviceVersion,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: finalConfig.environment,
    'service.namespace': 'mnbara',
    'cluster.name': process.env.CLUSTER_NAME || 'mnbara-production',
  });

  // Configure trace exporter
  const traceExporter = new OTLPTraceExporter({
    url: finalConfig.collectorUrl,
  });

  // Configure metric exporter (optional)
  const metricReader = finalConfig.enableMetrics
    ? new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({
          url: finalConfig.collectorUrl,
        }),
        exportIntervalMillis: 30000,
      })
    : undefined;

  // Create SDK with auto-instrumentation
  sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader,
    spanProcessor: new BatchSpanProcessor(traceExporter, {
      maxQueueSize: 2048,
      maxExportBatchSize: 512,
      scheduledDelayMillis: 5000,
      exportTimeoutMillis: 30000,
    }),
    textMapPropagator: new W3CTraceContextPropagator(),
    instrumentations: [
      getNodeAutoInstrumentations({
        // HTTP instrumentation
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingPaths: ['/health', '/metrics', '/ready', '/live'],
          requestHook: (span, request) => {
            // Add custom attributes
            span.setAttribute('http.request_id', request.headers['x-request-id'] || '');
            span.setAttribute('http.correlation_id', request.headers['x-correlation-id'] || '');
          },
        },
        // Express instrumentation
        '@opentelemetry/instrumentation-express': {
          enabled: true,
        },
        // Fastify instrumentation
        '@opentelemetry/instrumentation-fastify': {
          enabled: true,
        },
        // PostgreSQL instrumentation
        '@opentelemetry/instrumentation-pg': {
          enabled: true,
          enhancedDatabaseReporting: true,
        },
        // Redis instrumentation
        '@opentelemetry/instrumentation-redis-4': {
          enabled: true,
        },
        // gRPC instrumentation
        '@opentelemetry/instrumentation-grpc': {
          enabled: true,
        },
        // AMQP (RabbitMQ) instrumentation
        '@opentelemetry/instrumentation-amqplib': {
          enabled: true,
        },
        // Prisma instrumentation
        '@opentelemetry/instrumentation-prisma': {
          enabled: true,
        },
        // Socket.io instrumentation
        '@opentelemetry/instrumentation-socket.io': {
          enabled: true,
        },
        // Disable file system instrumentation (too noisy)
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
        // Disable DNS instrumentation (too noisy)
        '@opentelemetry/instrumentation-dns': {
          enabled: false,
        },
      }),
    ],
  });

  // Start the SDK
  sdk.start();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk?.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.error('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });

  console.log(`OpenTelemetry tracing initialized for ${finalConfig.serviceName}`);
  return sdk;
}

/**
 * Shutdown tracing gracefully
 */
export async function shutdownTracing(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
  }
}

/**
 * Get the current SDK instance
 */
export function getTracingSDK(): NodeSDK | null {
  return sdk;
}

// Export types for use in services
export { trace, context, SpanKind, SpanStatusCode } from '@opentelemetry/api';
export type { Span, Tracer } from '@opentelemetry/api';
