import express, { Application } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import auctionRoutes from './routes/auction.routes';
import bidRoutes from './routes/bid.routes';
import webhookRoutes from './routes/webhook.routes';
import disputeRoutes from './routes/dispute.routes';
import bidDisputeRoutes from './routes/bid-dispute.routes';
import auctionDisputeRoutes from './routes/auction-dispute.routes';
import reservePriceRoutes from './routes/reserve-price.routes';
import appealsWindowRoutes from './routes/appeals-window.routes';
import sellerProtectionRoutes from './routes/seller-protection.routes';
import analyticsRoutes from './routes/analytics.routes';
import safeguardRoutes from './routes/safeguard.routes';
import trustActionRoutes from './routes/trust-action.routes';
import trustEnforcementRoutes from './routes/trust-enforcement.routes';
import appealTrustActionRoutes from './routes/appeal-trust-action.routes';
import { createSignalReceiverRoutes } from './routes/signal-receiver.routes';

// Import middleware & utilities
import { setupSocketHandlers } from './sockets/auction.socket';
import { setSocketIO } from './controllers/bid.controller';
import { errorHandler } from './middleware/errorHandler';
import { getAuctionService } from './lib/service-container';
import { disconnectPrisma } from './lib/prisma';

dotenv.config();

// ============================================================
// APPLICATION SETUP
// ============================================================

const app: Application = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3003;

// Inject socket.io into bid controller for real-time updates
setSocketIO(io);

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    service: 'auction-service',
    timestamp: new Date().toISOString(),
    features: [
      'Auto-Extend',
      'Proxy Bidding',
      'Outbid Webhooks',
      'Disputes & Invalidations (Phase 5.2)',
      'Reserve Price & Hidden Minimums (Phase 5.3)',
      'Appeals Window (Phase 5.5)',
      'Seller Protection (Phase 5.6)',
      'Analytics (Phase 5.7)',
      'Trust Enforcement (Phase 6.0)',
      'Safeguards (Phase 6.1)',
      'Trust Actions (Phase 6.2)',
      'Appeals (Phase 6.3)',
      'Trust Scoring (Phase 6.4)',
    ],
  });
});

// ============================================================
// API ROUTES
// ============================================================

// Phase 5.1-5.2: Core auction & bidding
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/webhooks/auctions', webhookRoutes);

// Phase 5.2: Dispute & Invalidation
app.use('/api/v1/disputes', disputeRoutes);
app.use('/api/v1/bids', bidDisputeRoutes);
app.use('/api/v1/auctions', auctionDisputeRoutes);

// Phase 5.3: Reserve Price
app.use('/api/v1/auctions', reservePriceRoutes);

// Phase 5.5: Appeals Window
app.use('/api/v1/appeals-window', appealsWindowRoutes);

// Phase 5.6: Seller Protection
app.use('/api/v1/seller-protection', sellerProtectionRoutes);

// Phase 5.7: Analytics
app.use('/api/v1/analytics', analyticsRoutes);

// Phase 6.0: Trust Enforcement
app.use('/api/v1/trust-enforcement', trustEnforcementRoutes);

// Phase 6.1: Safeguards
app.use('/api/v1/safeguards', safeguardRoutes);

// Phase 6.2: Trust Actions
app.use('/api/v1/trust-actions', trustActionRoutes);

// Phase 6.3: Appeal Trust Actions
app.use('/api/v1/appeal-trust-actions', appealTrustActionRoutes);

// Event Logging: Signal Receiver
app.use('/api/v1/signals', createSignalReceiverRoutes());

// ============================================================
// SOCKET.IO SETUP
// ============================================================

setupSocketHandlers(io);

// ============================================================
// ERROR HANDLING
// ============================================================

app.use(errorHandler);

// ============================================================
// BACKGROUND JOBS
// ============================================================

const auctionService = getAuctionService();
const AUCTION_CHECK_INTERVAL = 60 * 1000; // 1 minute

const auctionCheckJob = setInterval(async () => {
  try {
    const results = await auctionService.endExpiredAuctions();
    if (results.length > 0) {
      console.log(`[AUCTION_CHECK] Processed ${results.length} expired auctions`);

      // Emit auction ended events
      for (const result of results) {
        if (result.success) {
          io.to(`auction:${result.auctionId}`).emit('auction:ended', {
            auctionId: result.auctionId,
            winner: result.result?.winner,
            finalPrice: result.result?.auction?.finalPrice,
            reserveMet: result.result?.reserveMet,
          });
        }
      }
    }
  } catch (error) {
    console.error('[AUCTION_CHECK_ERROR]', error);
  }
}, AUCTION_CHECK_INTERVAL);

// ============================================================
// SERVER STARTUP
// ============================================================

const server = httpServer.listen(PORT, () => {
  console.log(`🚀 Auction Service running on port ${PORT}`);
  console.log('🔌 WebSocket Server ready');
  console.log('⏰ Auction expiration checker started (every 1 minute)');
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

async function gracefulShutdown() {
  console.log('\n📋 Shutting down gracefully...');

  // Stop accepting new connections
  server.close(async () => {
    console.log('✅ HTTP server closed');

    // Clear background jobs
    clearInterval(auctionCheckJob);
    console.log('✅ Background jobs stopped');

    // Disconnect database
    await disconnectPrisma();
    console.log('✅ Database disconnected');

    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export { io };
export default app;
