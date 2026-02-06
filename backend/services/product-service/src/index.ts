/**
 * Product Service - Main Entry Point
 * 
 * Product Management Service for Mnbara Platform
 * - CRUD Operations
 * - Image Upload Integration
 * - Category Management
 * - Advanced Search
 * - Auction System (Buy It Now, Auction, Make Offer)
 * - Product Moderation
 */

require('dotenv').config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { productRoutes } from './routes/product.routes';
import { categoryRoutes } from './routes/category.routes';
import { searchRoutes } from './routes/search.routes';
import { moderationRoutes } from './routes/moderation.routes';
import { imageRoutes } from './routes/image.routes';
import { auctionRoutes } from './routes/auction.routes';
import { offerRoutes } from './routes/offer.routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { prisma } from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Health check
app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ 
            status: 'healthy', 
            service: 'product-service',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'unhealthy', 
            error: 'Database connection failed' 
        });
    }
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/offers', offerRoutes);

// Error handling
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
    logger.info(`Product Service started on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
});

export { app };
