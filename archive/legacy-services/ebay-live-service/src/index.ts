import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { logger } from '@/utils/logger';
import { errorHandler } from '@/utils/error-handler';
import { validateEnv } from '@/utils/env-validator';

import { RTMPServer } from '@/streaming/rtmp-server';
import { HLSConverter } from '@/streaming/hls-converter';
import { WebRTCGateway } from '@/streaming/webrtc-gateway';
import { WebSocketServer } from '@/chat/websocket-server';
import { ChatModeration } from '@/chat/moderation';
import { LiveAuctionEngine } from '@/auction/live-auction-engine';
import { ProductCarouselManager } from '@/auction/product-carousel';

import { streamRoutes } from '@/core/routes/streams';
import { chatRoutes } from '@/core/routes/chat';
import { auctionRoutes } from '@/core/routes/auction';
import { analyticsRoutes } from '@/core/routes/analytics';
import { databaseService } from '@/core/database';

dotenv.config();

async function main() {
  try {
    // Validate environment variables
    validateEnv();
    
    // Initialize database
    await databaseService.connect();
    
    const app = express();
    const server = createServer(app);
    const io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    // Middleware
    app.use(helmet());
    app.use(cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true
    }));
    app.use(compression());
    app.use(morgan('combined'));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Health check
    app.get('/health', async (req, res) => {
      const databaseHealthy = await databaseService.healthCheck();
      
      res.json({
        status: databaseHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: databaseHealthy ? 'healthy' : 'unhealthy',
          rtmp: rtmpServer.isRunning() ? 'healthy' : 'stopped',
          hls: hlsConverter.isRunning() ? 'healthy' : 'stopped',
          webrtc: webrtcGateway.isRunning() ? 'healthy' : 'stopped',
          websocket: wsServer.isRunning() ? 'healthy' : 'stopped',
          auction: auctionEngine.isRunning() ? 'healthy' : 'stopped',
        }
      });
    });

    // Initialize core services
    logger.info('Initializing eBay Live Service...');

    // Initialize streaming services
    const rtmpServer = new RTMPServer();
    const hlsConverter = new HLSConverter();
    const webrtcGateway = new WebRTCGateway();

    // Initialize chat services
    const wsServer = new WebSocketServer(io);
    const chatModeration = new ChatModeration();

    // Initialize auction services
    const auctionEngine = new LiveAuctionEngine();
    const productCarousel = new ProductCarouselManager();

    // Start streaming services
    await rtmpServer.start();
    await hlsConverter.start();
    await webrtcGateway.start();

    // Start chat services
    await wsServer.start();
    await chatModeration.start();

    // Start auction services
    await auctionEngine.start();
    await productCarousel.start();

    // API routes
    app.use('/api/streams', streamRoutes);
    app.use('/api/chat', chatRoutes);
    app.use('/api/auction', auctionRoutes);
    app.use('/api/analytics', analyticsRoutes);

    // Error handling middleware
    app.use(errorHandler);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      
      await databaseService.disconnect();
      await rtmpServer.stop();
      await hlsConverter.stop();
      await webrtcGateway.stop();
      await wsServer.stop();
      await chatModeration.stop();
      await auctionEngine.stop();
      await productCarousel.stop();
      
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      
      await databaseService.disconnect();
      await rtmpServer.stop();
      await hlsConverter.stop();
      await webrtcGateway.stop();
      await wsServer.stop();
      await chatModeration.stop();
      await auctionEngine.stop();
      await productCarousel.stop();
      
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });

    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    server.listen(port, () => {
      logger.info(`🚀 eBay Live Service running on port ${port}`);
      logger.info(`📡 RTMP Server: rtmp://localhost:1935/live`);
      logger.info(`🎬 HLS Stream: http://localhost:${port}/hls/{stream-key}/index.m3u8`);
      logger.info(`💬 WebSocket: ws://localhost:${port}`);
      logger.info(`🔨 WebRTC: http://localhost:${port}/webrtc`);
    });

  } catch (error) {
    logger.error('Failed to start eBay Live Service:', error);
    process.exit(1);
  }
}

main();