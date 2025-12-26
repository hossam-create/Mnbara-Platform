// AR Preview Service - Entry Point
// خدمة معاينة الواقع المعزز - نقطة الدخول

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import { modelRoutes } from './routes/model.routes';
import { sessionRoutes } from './routes/session.routes';
import { analyticsRoutes } from './routes/analytics.routes';

const app = express();
const PORT = process.env.PORT || 3022;

// Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max for 3D models
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'ar-preview-service', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/models', modelRoutes);
app.use('/api/sessions', sessionRoutes);
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
  console.log(`🥽 AR Preview Service running on port ${PORT}`);
});

export default app;
