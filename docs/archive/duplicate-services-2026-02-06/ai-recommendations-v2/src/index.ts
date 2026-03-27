// AI Recommendations Engine v2 - محرك التوصيات الذكي الجيل الثاني
// Advanced ML-based personalized recommendations

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { recommendationService } from './services/recommendation.service';

const app: Express = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3029;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'ai-recommendations-v2',
    version: '2.0.0',
    name: 'Mnbara AI Recommendations Engine v2',
    nameAr: 'محرك منبرة للتوصيات الذكية الجيل الثاني',
    features: [
      'Personalized Recommendations',
      'Similar Items',
      'Frequently Bought Together',
      'Trending Products',
      'Recently Viewed',
      'Cart Recommendations',
      'A/B Testing',
      'Real-time Learning'
    ],
    algorithms: [
      'Collaborative Filtering',
      'Content-Based',
      'Hybrid',
      'Deep Learning',
      'Personalized Ranking'
    ],
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 🎯 RECOMMENDATIONS API
// ==========================================

// Get recommendations
app.post('/api/v1/recommendations', async (req: Request, res: Response) => {
  try {
    const { userId, context, productId, cartItems, limit, excludeIds } = req.body;
    
    const recommendations = await recommendationService.getRecommendations({
      userId,
      context,
      productId,
      cartItems,
      limit,
      excludeIds
    });
    
    res.json({
      success: true,
      data: recommendations,
      total: recommendations.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      messageAr: 'فشل في الحصول على التوصيات'
    });
  }
});

// Get home page recommendations
app.get('/api/v1/recommendations/home/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const recommendations = await recommendationService.getRecommendations({
      userId,
      context: 'HOME_PAGE',
      limit
    });
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get similar items
app.get('/api/v1/recommendations/similar/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.query.userId as string || 'anonymous';
    const limit = parseInt(req.query.limit as string) || 10;
    
    const recommendations = await recommendationService.getRecommendations({
      userId,
      context: 'PRODUCT_PAGE',
      productId,
      limit
    });
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get cart recommendations
app.post('/api/v1/recommendations/cart', async (req: Request, res: Response) => {
  try {
    const { userId, cartItems, limit = 5 } = req.body;
    
    const recommendations = await recommendationService.getRecommendations({
      userId,
      context: 'CART_PAGE',
      cartItems,
      limit,
      excludeIds: cartItems
    });
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 📊 TRACKING API
// ==========================================

// Track interaction
app.post('/api/v1/track/interaction', async (req: Request, res: Response) => {
  try {
    const { userId, productId, type, metadata } = req.body;
    
    await recommendationService.trackInteraction(userId, productId, type, metadata);
    
    res.json({
      success: true,
      message: 'Interaction tracked',
      messageAr: 'تم تسجيل التفاعل'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Track recommendation feedback
app.post('/api/v1/track/feedback', async (req: Request, res: Response) => {
  try {
    const { recommendationId, clicked, purchased, dismissed } = req.body;
    
    await recommendationService.trackRecommendationFeedback(recommendationId, {
      clicked,
      purchased,
      dismissed
    });
    
    res.json({
      success: true,
      message: 'Feedback recorded',
      messageAr: 'تم تسجيل الملاحظات'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 👤 USER PROFILE API
// ==========================================

// Update user profile
app.put('/api/v1/users/:userId/profile', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const profile = await recommendationService.updateUserProfile(userId, req.body);
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 📈 METRICS API
// ==========================================

// Get metrics
app.get('/api/v1/metrics', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const metrics = await recommendationService.getMetrics(days);
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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
  res.status(500).json({
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
║   🎯 Mnbara AI Recommendations v2 - التوصيات الذكية          ║
║                                                              ║
║   "Personalized Shopping Experience"                         ║
║   "تجربة تسوق مخصصة"                                         ║
║                                                              ║
║   🌐 Port: ${PORT}                                             ║
║   🧠 Algorithms: Hybrid ML                                   ║
║   📊 A/B Testing: Enabled                                    ║
║   ⚡ Real-time: Learning                                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down AI Recommendations v2...');
  await prisma.$disconnect();
  process.exit(0);
});

export { app, prisma };
