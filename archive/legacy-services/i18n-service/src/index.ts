import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import translationRoutes from './routes/translation.routes';
import languageRoutes from './routes/language.routes';
import { logger } from './utils/logger';
import { initI18n } from './config/i18n.config';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3026;

// Initialize i18next
initI18n();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'i18n-service' });
});

// Routes
app.use('/api/translations', translationRoutes);
app.use('/api/languages', languageRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`i18n Service running on port ${PORT}`);
});

export default app;
