import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import recognitionRoutes from './routes/recognition.routes';
import { logger } from './utils/logger';
import { RecognitionService } from './services/recognition.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3019;

// Initialize ML models on startup
const recognitionService = new RecognitionService();
recognitionService.initialize().catch(err => {
  logger.error('Failed to initialize recognition service:', err);
  process.exit(1);
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/recognition', recognitionRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'image-recognition-service' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  logger.info(`Image Recognition Service running on port ${PORT}`);
});
