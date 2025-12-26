// Fraud Detection Service - Entry Point
// خدمة كشف الاحتيال - نقطة الدخول

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fraudRoutes } from './routes/fraud.routes';
import { alertRoutes } from './routes/alert.routes';
import { blacklistRoutes } from './routes/blacklist.routes';
import { ruleRoutes } from './routes/rule.routes';

const app = express();
const PORT = process.env.PORT || 3020;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'fraud-detection-service', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/fraud', fraudRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/blacklist', blacklistRoutes);
app.use('/api/rules', ruleRoutes);

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
  console.log(`🛡️ Fraud Detection Service running on port ${PORT}`);
});

export default app;
