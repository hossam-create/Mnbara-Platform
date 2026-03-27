import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import locationRoutes from './routes/location.routes';
import routeRoutes from './routes/route.routes';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3021;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/locations', locationRoutes);
app.use('/api', routeRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'location-service' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  logger.info(`Location Service running on port ${PORT}`);
});
