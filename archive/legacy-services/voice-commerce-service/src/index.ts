// Voice Commerce Service - Entry Point
// خدمة التجارة الصوتية - نقطة الدخول

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import { voiceRoutes } from './routes/voice.routes';
import { intentRoutes } from './routes/intent.routes';
import { analyticsRoutes } from './routes/analytics.routes';

const app = express();
const PORT = process.env.PORT || 3021;

// Multer for audio uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'voice-commerce-service', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/voice', voiceRoutes);
app.use('/api/intents', intentRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    errorAr: 'حدث خطأ في الخادم',
  });
});

app.listen(PORT, () => {
  console.log(`🎤 Voice Commerce Service running on port ${PORT}`);
});

export default app;
