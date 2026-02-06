import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import searchRoutes from './routes/search.routes';
import { SearchService } from './services/search.service';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3023;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/search', searchRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'search-service' });
});

// Initialize Meilisearch
const searchService = new SearchService();

async function startServer() {
  try {
    // Initialize search indexes
    await searchService.initialize();
    logger.info('Meilisearch initialized successfully');

    app.listen(PORT, () => {
      logger.info(`Search Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
