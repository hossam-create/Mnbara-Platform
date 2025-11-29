import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Service URLs (from environment variables or defaults)
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const LISTING_SERVICE_URL = process.env.LISTING_SERVICE_URL || 'http://listing-service:3002';
const AUCTION_SERVICE_URL = process.env.AUCTION_SERVICE_URL || 'http://auction-service:3003';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3004';

// Public Routes (Auth Service)
app.use('/auth', createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/auth': '/auth', // keep /auth prefix if service expects it, or remove if it doesn't
  },
}));

// Protected Routes
// Listings
app.use('/listings', authenticateToken, createProxyMiddleware({
  target: LISTING_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/listings': '/listings',
  },
}));

// Auctions
app.use('/auctions', authenticateToken, createProxyMiddleware({
  target: AUCTION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/auctions': '/auctions',
  },
}));

// Payments
app.use('/payments', authenticateToken, createProxyMiddleware({
  target: PAYMENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/payments': '/payments',
  },
}));

// Start server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
