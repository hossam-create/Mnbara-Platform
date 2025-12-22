import express, { Application } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import auctionRoutes from './routes/auction.routes';
import bidRoutes from './routes/bid.routes';
import { setupSocketHandlers } from './sockets/auction.socket';
import { setSocketIO } from './controllers/bid.controller';
import { errorHandler } from './middleware/errorHandler';
import { AuctionService } from './services/auction.service';

dotenv.config();

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

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auction-service' });
});

app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);

// Socket.IO Setup
setupSocketHandlers(io);

// Error handling
app.use(errorHandler);

// Cron job to end expired auctions (runs every minute)
const auctionService = new AuctionService();
const AUCTION_CHECK_INTERVAL = 60 * 1000; // 1 minute

setInterval(async () => {
  try {
    const results = await auctionService.endExpiredAuctions();
    if (results.length > 0) {
      console.log(`Processed ${results.length} expired auctions`);
      
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
    console.error('Error processing expired auctions:', error);
  }
}, AUCTION_CHECK_INTERVAL);

httpServer.listen(PORT, () => {
  console.log(`🚀 Auction Service running on port ${PORT}`);
  console.log('🔌 WebSocket Server ready');
  console.log('⏰ Auction expiration checker started (every 1 minute)');
});

export { io };
export default app;
