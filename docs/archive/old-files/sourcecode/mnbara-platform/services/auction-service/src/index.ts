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
import { errorHandler } from './middleware/errorHandler';

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

httpServer.listen(PORT, () => {
    console.log(`🚀 Auction Service running on port ${PORT}`);
    console.log(`🔌 WebSocket Server ready`);
});

export default app;
