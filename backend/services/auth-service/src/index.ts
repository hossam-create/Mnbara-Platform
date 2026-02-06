import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import sessionRoutes from './routes/session.routes';
import { logger } from './utils/logger';
import { configureGoogleStrategy } from './strategies/google.strategy';
import { configureFacebookStrategy } from './strategies/facebook.strategy';
import { configureAppleStrategy } from './strategies/apple.strategy';
import { configureJwtStrategy } from './strategies/jwt.strategy';
import { sessionService } from './services/session.service';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3014;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Session (required for OAuth)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport strategies
configureGoogleStrategy();
configureFacebookStrategy();
configureAppleStrategy();
configureJwtStrategy();

// Passport serialization (required for session)
passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/sessions', sessionRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Auth Service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      register: 'POST /auth/register',
      login: 'POST /auth/login',
      refresh: 'POST /auth/refresh',
      logout: 'POST /auth/logout',
      me: 'GET /auth/me',
      google: 'GET /auth/google',
      facebook: 'GET /auth/facebook',
      apple: 'GET /auth/apple',
      sessions: 'GET /sessions/me, DELETE /sessions/current',
    },
  });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Check Redis connection
    await sessionService.connect();
    res.json({ status: 'healthy', redis: 'connected' });
  } catch (error) {
    res.json({ status: 'healthy', redis: 'disconnected' });
  }
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Auth Service running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
