// Mnbara AI Engine - Custom AI like Siri for Shopping & Travel
// محرك منبرة للذكاء الاصطناعي - مساعد ذكي للتسوق والسفر

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

// Routes
import assistantRoutes from './routes/assistant.routes';
import modelRoutes from './routes/model.routes';
import trainingRoutes from './routes/training.routes';
import knowledgeRoutes from './routes/knowledge.routes';
import voiceRoutes from './routes/voice.routes';
import devOpsAIRoutes from './routes/devops-ai.routes';
import marketingAIRoutes from './routes/marketing-ai.routes';
import analyticsAIRoutes from './routes/analytics-ai.routes';

const app: Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3025;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
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
    service: 'mnbara-ai-engine',
    version: '1.0.0',
    name: 'Mnbara AI',
    nameAr: 'ذكاء منبرة',
    description: 'Your personal AI shopping & travel assistant',
    descriptionAr: 'مساعدك الذكي الشخصي للتسوق والسفر',
    capabilities: [
      'Voice Commands (50+ languages)',
      'Smart Product Search',
      'Price Negotiation Assistant',
      'Travel Planning',
      'Customs & Regulations Info',
      'Real-time Translation',
      'Personalized Recommendations',
      'Order Tracking',
      'Continuous Learning',
      'DevOps AI (System Monitoring, Code Analysis, Deployment)',
      'Marketing AI (Content Generation, Campaign Optimization, Growth)',
      'Analytics AI (Sales Trends, Customer Segmentation, Predictions)'
    ],
    models: {
      base: 'Mistral-7B / Llama-2-7B',
      fineTuned: 'mnbara-shopping-v1',
      embedding: 'all-MiniLM-L6-v2'
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/assistant', assistantRoutes);
app.use('/api/v1/models', modelRoutes);
app.use('/api/v1/training', trainingRoutes);
app.use('/api/v1/knowledge', knowledgeRoutes);
app.use('/api/v1/voice', voiceRoutes);
app.use('/api/v1/devops', devOpsAIRoutes);
app.use('/api/v1/marketing', marketingAIRoutes);
app.use('/api/v1/analytics', analyticsAIRoutes);

// WebSocket for real-time voice assistant
io.on('connection', (socket) => {
  console.log('🎤 Voice client connected:', socket.id);

  // Join user session
  socket.on('join_session', (sessionId: string) => {
    socket.join(sessionId);
    console.log(`Session ${sessionId} started`);
  });

  // Voice input stream
  socket.on('voice_input', async (data: { sessionId: string; audio: Buffer; language: string }) => {
    try {
      // Process voice input
      io.to(data.sessionId).emit('processing', { status: 'listening' });
      
      // Transcribe -> Process -> Respond (handled by voice service)
      io.to(data.sessionId).emit('processing', { status: 'thinking' });
      
    } catch (error) {
      io.to(data.sessionId).emit('error', { message: 'Voice processing failed' });
    }
  });

  // Text input
  socket.on('text_input', async (data: { sessionId: string; text: string; userId?: string }) => {
    io.to(data.sessionId).emit('processing', { status: 'thinking' });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible
app.set('io', io);

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
httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🧠 Mnbara AI Engine - محرك منبرة للذكاء الاصطناعي          ║
║                                                              ║
║   "مرحباً! أنا ذكاء منبرة، مساعدك الشخصي للتسوق والسفر"      ║
║   "Hi! I'm Mnbara AI, your personal shopping & travel buddy" ║
║                                                              ║
║   🌐 Port: ${PORT}                                             ║
║   🎤 Voice: Enabled                                          ║
║   🌍 Languages: 50+                                          ║
║   📚 Learning: Continuous                                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down Mnbara AI...');
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

export { app, io, prisma };
