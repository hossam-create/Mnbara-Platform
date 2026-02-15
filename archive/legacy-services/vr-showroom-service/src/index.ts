// VR Showroom Service - Entry Point
// خدمة صالة العرض الافتراضية - نقطة الدخول

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { showroomRoutes } from './routes/showroom.routes';
import { sessionRoutes } from './routes/session.routes';
import { eventRoutes } from './routes/event.routes';
import { avatarRoutes } from './routes/avatar.routes';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

const PORT = process.env.PORT || 3024;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'vr-showroom-service', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/showrooms', showroomRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/avatars', avatarRoutes);

// WebSocket for real-time VR
io.on('connection', (socket) => {
  console.log('VR client connected:', socket.id);

  socket.on('join-showroom', (showroomId: string) => {
    socket.join(`showroom:${showroomId}`);
    io.to(`showroom:${showroomId}`).emit('user-joined', { socketId: socket.id });
  });

  socket.on('leave-showroom', (showroomId: string) => {
    socket.leave(`showroom:${showroomId}`);
    io.to(`showroom:${showroomId}`).emit('user-left', { socketId: socket.id });
  });

  socket.on('position-update', (data: { showroomId: string; position: any; rotation: any }) => {
    socket.to(`showroom:${data.showroomId}`).emit('user-moved', {
      socketId: socket.id,
      position: data.position,
      rotation: data.rotation,
    });
  });

  socket.on('interact-product', (data: { showroomId: string; productId: string; action: string }) => {
    io.to(`showroom:${data.showroomId}`).emit('product-interaction', {
      socketId: socket.id,
      ...data,
    });
  });

  socket.on('disconnect', () => {
    console.log('VR client disconnected:', socket.id);
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
  console.log(`🥽 VR Showroom Service running on port ${PORT}`);
});

export { io };
export default app;
