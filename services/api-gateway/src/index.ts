// Initialize OpenTelemetry tracing FIRST (before any other imports)
import { initTracing, shutdownTracing, tracer, tracingConfig } from './tracing';
initTracing();

import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';

import { config } from './config';
import { router } from './routes';
import { globalRateLimiter, authRateLimiter } from './middleware/rate-limit.middleware';
import { loggingMiddleware } from './middleware/logging.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { corsMiddleware, corsErrorHandler } from './middleware/cors.middleware';
import { securityHeadersMiddleware } from './middleware/security-headers.middleware';
import { activityWebSocketServer } from './websocket/activity.socket';
import { activityKafkaConsumer } from './kafka/activity.consumer';
import { redisPresenceManager } from './websocket/redis-presence.manager';
import { getCircuitBreakerHealth } from './resilience/circuit-breaker.service';
import { getBulkheadHealth } from './resilience/bulkhead.service';
import { getBackpressureHealth } from './resilience/kafka-backpressure.service';
import { 
  getLoadSheddingHealth,
  getSLOHealth,
  getBrownoutHealth,
  getRateLimitMetrics,
  getOverloadHealth,
  initializeBrownoutFeatures,
  startLoadSheddingMonitor,
  startSLOMonitor,
  startOverloadMonitor,
} from './adaptive';
import {
  getPredictiveLoadHealth,
  getAutoScalingHealth,
  getPredictiveBulkheadHealth,
  getPredictiveBrownoutHealth,
  getAnomalyHealth,
  getAdaptiveRetryHealth,
  getPredictiveKafkaHealth,
  getSLOSelfOptimizationHealth,
  initializePredictiveBrownout,
  startPredictiveMonitoring,
  startAutoScalingMonitor,
  startBulkheadMonitor,
  startPredictiveBrownoutMonitor,
  startAnomalyDetection,
  startAdaptiveRetryMonitor,
  startPredictiveKafkaMonitor,
  startSLOSelfOptimizationMonitor,
} from './predictive';

dotenv.config();

const app: Express = express();

// Trust proxy (for accurate IP detection behind load balancer)
app.set('trust proxy', true);

// Security middleware
app.use(helmet());

// Security headers middleware
if (config.enableSecurityHeaders) {
  app.use(securityHeadersMiddleware);
}

// CORS configuration
app.use(corsMiddleware());

// CORS error handler
app.use(corsErrorHandler);

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.headers['x-request-id'] = req.headers['x-request-id'] || 
    `gw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.headers['x-request-id']);
  next();
});

// Logging middleware
app.use(loggingMiddleware);

// Rate limiting (global)
app.use(globalRateLimiter);

// Mount API routes (prefixed with /api)
app.use('/api', router);

// Health check endpoints
app.get('/health', async (req: Request, res: Response) => {
  const wsStats = activityWebSocketServer.getStats();
  const kafkaStatus = activityKafkaConsumer.getStatus();
  const redisHealth = await redisPresenceManager.healthCheck();
  const circuitHealth = getCircuitBreakerHealth();
  const bulkheadHealth = getBulkheadHealth();
  const backpressureHealth = getBackpressureHealth(kafkaStatus.groupId);
  const loadSheddingHealth = getLoadSheddingHealth();
  const sloHealth = getSLOHealth();
  const brownoutHealth = getBrownoutHealth();
  const overloadHealth = getOverloadHealth();
  
  // Predictive layer health
  const predictiveLoadHealth = getPredictiveLoadHealth();
  const autoScalingHealth = getAutoScalingHealth();
  const predictiveBulkheadHealth = getPredictiveBulkheadHealth();
  const predictiveBrownoutHealth = getPredictiveBrownoutHealth();
  const anomalyHealth = getAnomalyHealth();
  const adaptiveRetryHealth = getAdaptiveRetryHealth();
  const predictiveKafkaHealth = getPredictiveKafkaHealth();
  const sloSelfOptimizationHealth = getSLOSelfOptimizationHealth();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    features: {
      websocket: {
        enabled: true,
        localConnections: wsStats.localConnections,
      },
      kafka: {
        enabled: kafkaStatus.isRunning,
        topic: kafkaStatus.topic,
        groupId: kafkaStatus.groupId,
        backpressure: backpressureHealth,
      },
      redis: redisHealth,
      observability: {
        tracing: true,
        exporter: 'otlp',
        serviceName: tracingConfig.serviceName,
        environment: tracingConfig.environment,
        samplingRate: tracingConfig.samplingRate,
      },
      resilience: {
        circuitBreakers: circuitHealth,
        bulkheads: bulkheadHealth,
        enabled: true,
      },
      adaptiveProtection: {
        enabled: true,
        brownoutMode: brownoutHealth.brownoutActive,
        overloadState: loadSheddingHealth.state,
        sloStatus: sloHealth.status.healthy ? 'healthy' : 'violated',
        rateLimiterActive: true,
        loadShedding: {
          active: loadSheddingHealth.sheddingActive,
          state: loadSheddingHealth.state,
          metrics: loadSheddingHealth.metrics,
        },
        slo: {
          p95LatencyMs: sloHealth.status.latencyP95Ms,
          p99LatencyMs: sloHealth.status.latencyP99Ms,
          errorRatePercent: sloHealth.status.errorRatePercent,
          availabilityPercent: sloHealth.status.availabilityPercent,
        },
        brownout: {
          active: brownoutHealth.brownoutActive,
          disabledFeatures: brownoutHealth.disabledCount,
          inRecovery: brownoutHealth.inRecovery,
        },
        overload: {
          isOverloaded: overloadHealth.isOverloaded,
          lastSnapshot: overloadHealth.lastSnapshot,
        },
      },
      predictive: {
        enabled: true,
        level: 'Self-Driving Platform',
        predictiveLoad: {
          isRunning: predictiveLoadHealth.isRunning,
          servicesMonitored: predictiveLoadHealth.servicesMonitored,
          latestPredictions: predictiveLoadHealth.latestPredictions.map(p => ({
            service: p.service,
            currentLoad: p.currentLoad,
            predictedLoad: p.predictedLoad,
            confidence: p.confidence,
            recommendation: p.recommendation,
          })),
        },
        autoScaling: {
          enabled: autoScalingHealth.enabled,
          strategy: autoScalingHealth.strategy,
          totalScaleUps24h: autoScalingHealth.totalScaleUps24h,
          totalScaleDowns24h: autoScalingHealth.totalScaleDowns24h,
          services: autoScalingHealth.services.map(s => ({
            service: s.service,
            currentReplicas: s.currentReplicas,
            predictedLoad: s.predictedLoad,
          })),
        },
        predictiveBulkhead: {
          enabled: predictiveBulkheadHealth.enabled,
          isRunning: predictiveBulkheadHealth.isRunning,
          services: predictiveBulkheadHealth.services.map(s => ({
            service: s.service,
            maxConcurrency: s.maxConcurrency,
            maxQueueSize: s.maxQueueSize,
            predictedLoad: s.predictedLoad,
          })),
        },
        predictiveBrownout: {
          enabled: predictiveBrownoutHealth.enabled,
          isRunning: predictiveBrownoutHealth.isRunning,
          isActive: predictiveBrownoutHealth.isActive,
          disabledFeatures: predictiveBrownoutHealth.activeFeatures.length,
          totalActivations24h: predictiveBrownoutHealth.totalActivations24h,
        },
        anomalyDetection: {
          enabled: anomalyHealth.enabled,
          isRunning: anomalyHealth.isRunning,
          totalAnomalies24h: anomalyHealth.stats.last24h,
          autoHealSuccessRate: Math.round(anomalyHealth.stats.autoHealSuccessRate * 100),
          recentAnomalies: anomalyHealth.recentAnomalies.slice(0, 3).map(a => ({
            service: a.service,
            metric: a.metric,
            severity: a.severity,
            autoHealAction: a.autoHealAction,
          })),
        },
        adaptiveRetry: {
          enabled: adaptiveRetryHealth.enabled,
          isRunning: adaptiveRetryHealth.isRunning,
          policies: adaptiveRetryHealth.policies.map(p => ({
            service: p.service,
            baseDelayMs: p.baseDelayMs,
            trend: p.trend,
            successRate: Math.round(p.successRate * 100),
          })),
        },
        predictiveKafka: {
          enabled: predictiveKafkaHealth.enabled,
          isRunning: predictiveKafkaHealth.isRunning,
          topics: predictiveKafkaHealth.topics.map(t => ({
            topic: t.topic,
            totalLag: t.totalLag,
            isThrottled: t.producerState?.isThrottled || false,
          })),
          pausedConsumers: predictiveKafkaHealth.consumers.filter(c => c.isPaused).length,
        },
        sloSelfOptimization: {
          enabled: sloSelfOptimizationHealth.enabled,
          isRunning: sloSelfOptimizationHealth.isRunning,
          currentParameters: sloSelfOptimizationHealth.currentParameters,
          totalOptimizations24h: sloSelfOptimizationHealth.totalOptimizations24h,
        },
      },
    },
  });
});

app.get('/ready', async (req: Request, res: Response) => {
  const { httpClient } = await import('./services/http-client');
  const services = await httpClient.allHealthChecks();
  const allHealthy = Object.values(services).every(Boolean);
  
  if (allHealthy) {
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      services,
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      services,
    });
  }
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.port;
const HOST = '0.0.0.0';

// Create HTTP server (required for WebSocket)
const server = createServer(app);

// Initialize WebSocket server
activityWebSocketServer.initialize(server);

// Initialize and start Kafka consumer
async function startKafkaConsumer(): Promise<void> {
  try {
    await activityKafkaConsumer.initialize();
    await activityKafkaConsumer.start();
  } catch (error) {
    console.warn('[Bootstrap] Kafka consumer failed to start:', error);
    console.log('[Bootstrap] Continuing without real-time streaming (REST endpoint still available)');
  }
}

// Start HTTP server
server.listen(PORT, HOST, async () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 API Gateway Started Successfully!                   ║
║                                                           ║
║   Environment: ${config.nodeEnv.padEnd(37)}║
║   Port: ${PORT.toString().padEnd(47)}║
║   Tracing: ${tracingConfig.serviceName} (${tracingConfig.environment})${' '.repeat(35 - tracingConfig.serviceName.length - tracingConfig.environment.length)}║
║   OTLP: ${tracingConfig.endpoint.slice(0, 30).padEnd(47)}║
║   Health: http://${HOST}:${PORT}/health${' '.repeat(39 - PORT.toString().length)}║
║   WebSocket: ws://${HOST}:${PORT}/ws/activity${' '.repeat(28 - PORT.toString().length)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Start Kafka consumer after server is up
  await startKafkaConsumer();
  
  // Initialize Adaptive Intelligence Layer
  try {
    initializeBrownoutFeatures();
    startLoadSheddingMonitor(5000);
    startSLOMonitor(30000);
    startOverloadMonitor(2000);
    console.log('✅ Adaptive Intelligence Layer initialized');
  } catch (error) {
    console.error('⚠️ Adaptive layer initialization error:', error);
  }
  
  // Initialize Self-Driving (Predictive) Platform Layer
  try {
    initializePredictiveBrownout();
    startPredictiveMonitoring();
    startAutoScalingMonitor();
    startBulkheadMonitor();
    startPredictiveBrownoutMonitor();
    startAnomalyDetection();
    startAdaptiveRetryMonitor();
    startPredictiveKafkaMonitor();
    startSLOSelfOptimizationMonitor();
    console.log('✅ Self-Driving Platform Layer initialized');
    console.log('🤖 ML-based prediction active');
    console.log('📊 Auto-scaling enabled');
    console.log('🔍 Anomaly detection running');
  } catch (error) {
    console.error('⚠️ Predictive layer initialization error:', error);
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  
  // Shutdown predictive layer monitors
  try {
    const {
      stopPredictiveMonitoring,
      stopAutoScalingMonitor,
      stopBulkheadMonitor,
      stopPredictiveBrownoutMonitor,
      stopAnomalyDetection,
      stopAdaptiveRetryMonitor,
      stopPredictiveKafkaMonitor,
      stopSLOSelfOptimizationMonitor,
    } = await import('./predictive');
    stopPredictiveMonitoring();
    stopAutoScalingMonitor();
    stopBulkheadMonitor();
    stopPredictiveBrownoutMonitor();
    stopAnomalyDetection();
    stopAdaptiveRetryMonitor();
    stopPredictiveKafkaMonitor();
    stopSLOSelfOptimizationMonitor();
    console.log('✅ Predictive layer shut down.');
  } catch (error) {
    console.error('❌ Predictive layer shutdown error:', error);
  }
  
  // Shutdown adaptive layer monitors
  try {
    const { 
      stopLoadSheddingMonitor, 
      stopSLOMonitor, 
      stopOverloadMonitor,
      shutdownBrownout,
      shutdownRateLimiter 
    } = await import('./adaptive');
    stopLoadSheddingMonitor();
    stopSLOMonitor();
    stopOverloadMonitor();
    shutdownBrownout();
    await shutdownRateLimiter();
    console.log('✅ Adaptive layer shut down.');
  } catch (error) {
    console.error('❌ Adaptive layer shutdown error:', error);
  }
  
  // Shutdown tracing first
  try {
    await shutdownTracing();
  } catch (error) {
    console.error('❌ Tracing shutdown error:', error);
  }
  
  // Shutdown resilience layer
  try {
    const { shutdownAllCircuitBreakers, shutdownAllBackpressure } = await import('./resilience');
    shutdownAllCircuitBreakers();
    shutdownAllBackpressure();
    console.log('✅ Resilience layer shut down.');
  } catch (error) {
    console.error('❌ Resilience shutdown error:', error);
  }
  
  // Shutdown WebSocket server
  try {
    await activityWebSocketServer.shutdown();
  } catch (error) {
    console.error('❌ WebSocket shutdown error:', error);
  }
  
  // Shutdown Kafka consumer
  try {
    await activityKafkaConsumer.shutdown();
  } catch (error) {
    console.error('❌ Kafka consumer shutdown error:', error);
  }
  
  server.close(() => {
    console.log('✅ HTTP server closed.');
    process.exit(0);
  });

  // Force close after 30 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout.');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
