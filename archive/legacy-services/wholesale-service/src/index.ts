// Wholesale Service - B2B Marketplace
// خدمة البيع بالجملة - سوق B2B

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';

// Routes
import supplierRoutes from './routes/supplier.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import pricingRoutes from './routes/pricing.routes';
import analyticsRoutes from './routes/analytics.routes';
import inquiryRoutes from './routes/inquiry.routes';

const app: Express = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3026;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'wholesale-service',
    version: '1.0.0',
    name: 'Mnbara B2B Wholesale',
    nameAr: 'منبرة للبيع بالجملة',
    description: 'B2B Wholesale Marketplace for bulk orders',
    descriptionAr: 'سوق البيع بالجملة للطلبات الكبيرة',
    features: [
      'Supplier Management',
      'Bulk Product Listings',
      'Tiered Pricing',
      'Bulk Orders',
      'RFQ System',
      'Analytics Dashboard',
      'Multi-currency Support'
    ],
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/pricing', pricingRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/inquiries', inquiryRoutes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    messageAr: 'المسار غير موجود'
  });
});

// Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    messageAr: 'خطأ في الخادم'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🏢 Mnbara B2B Wholesale - منبرة للبيع بالجملة              ║
║                                                              ║
║   "Your Gateway to Bulk Trading"                             ║
║   "بوابتك للتجارة بالجملة"                                   ║
║                                                              ║
║   🌐 Port: ${PORT}                                             ║
║   📦 Products: Unlimited                                     ║
║   💰 Pricing: Tiered                                         ║
║   🌍 Markets: Global                                         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down Wholesale Service...');
  await prisma.$disconnect();
  process.exit(0);
});

export { app, prisma };
