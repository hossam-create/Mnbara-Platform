// Demand Forecasting Service - Entry Point
// خدمة التنبؤ بالطلب - نقطة الدخول

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { forecastRoutes } from './routes/forecast.routes';
import { inventoryRoutes } from './routes/inventory.routes';
import { priceRoutes } from './routes/price.routes';
import { alertRoutes } from './routes/alert.routes';

const app = express();
const PORT = process.env.PORT || 3023;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'demand-forecasting-service', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/forecast', forecastRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/price', priceRoutes);
app.use('/api/alerts', alertRoutes);

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
  console.log(`📊 Demand Forecasting Service running on port ${PORT}`);
});

export default app;
