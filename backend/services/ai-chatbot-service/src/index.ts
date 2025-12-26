// AI Chatbot Service - Entry Point
// خدمة الدردشة الذكية - نقطة الدخول

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { chatRoutes } from './routes/chat.routes';
import { intentRoutes } from './routes/intent.routes';
import { knowledgeRoutes } from './routes/knowledge.routes';
import { agentRoutes } from './routes/agent.routes';
import { analyticsRoutes } from './routes/analytics.routes';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3025;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'ai-chatbot-service', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/intents', intentRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/analytics', analyticsRoutes);

// WebSocket for real-time chat
io.on('connection', (socket) => {
  console.log('Chat client connected:', socket.id);

  socket.on('join-conversation', (conversationId: string) => {
    socket.join(`conv:${conversationId}`);
  });

  socket.on('leave-conversation', (conversationId: string) => {
    socket.leave(`conv:${conversationId}`);
  });

  socket.on('send-message', async (data: { conversationId: string; content: string }) => {
    // Process message and emit response
    io.to(`conv:${data.conversationId}`).emit('new-message', {
      content: data.content,
      senderType: 'USER',
      timestamp: new Date(),
    });
  });

  socket.on('typing', (data: { conversationId: string; isTyping: boolean }) => {
    socket.to(`conv:${data.conversationId}`).emit('user-typing', data);
  });

  socket.on('disconnect', () => {
    console.log('Chat client disconnected:', socket.id);
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    errorAr: 'حدث خطأ في الخادم',
  });
});

httpServer.listen(PORT, () => {
  console.log(`🤖 AI Chatbot Service running on port ${PORT}`);
});

export { io };
export default app;
