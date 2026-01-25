import express from 'express';
import { Pool } from 'pg';
import { Redis } from 'ioredis';
import { FraudDetectionService } from './services/FraudDetectionService';
import { fraudDetection, checkBlacklist } from './middleware/fraudDetection';
import { advancedRateLimiter } from './middleware/advancedRateLimiter';

const app = express();

// Initialize dependencies
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
});

// Initialize fraud detection service
const fraudService = new FraudDetectionService(db, redis);

// Global middleware
app.use(express.json());

// Apply blacklist check globally
app.use(checkBlacklist(fraudService));

// ============================================================================
// Payment Routes - High Security
// ============================================================================

app.post(
  '/api/payments',
  // Rate limiting
  advancedRateLimiter(redis, {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    keyPrefix: 'payment',
    skipSuccessfulRequests: false,
  }),
  // Fraud detection - block high risk
  fraudDetection(fraudService, {
    checkType: 'PAYMENT',
    blockOnHighRisk: true,
    requireReview: true,
  }),
  async (req, res) => {
    // Payment processing logic
    const fraudCheck = (req as any).fraudCheck;
    
    res.json({
      success: true,
      message: 'Payment processed',
      fraudCheck: {
        riskLevel: fraudCheck.riskLevel,
        riskScore: fraudCheck.riskScore,
      },
    });
  }
);

// ============================================================================
// Payout Routes - Very High Security
// ============================================================================

app.post(
  '/api/payouts',
  // Strict rate limiting
  advancedRateLimiter(redis, {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    keyPrefix: 'payout',
    skipSuccessfulRequests: false,
  }),
  // Fraud detection - block high risk, require review for medium
  fraudDetection(fraudService, {
    checkType: 'PAYOUT',
    blockOnHighRisk: true,
    requireReview: true,
  }),
  async (req, res) => {
    // Payout processing logic
    const fraudCheck = (req as any).fraudCheck;
    
    res.json({
      success: true,
      message: 'Payout initiated',
      fraudCheck: {
        riskLevel: fraudCheck.riskLevel,
        riskScore: fraudCheck.riskScore,
      },
    });
  }
);

// ============================================================================
// Dispute Routes - High Security
// ============================================================================

app.post(
  '/api/disputes',
  // Rate limiting
  advancedRateLimiter(redis, {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyPrefix: 'dispute',
    skipSuccessfulRequests: false,
  }),
  // Fraud detection
  fraudDetection(fraudService, {
    checkType: 'DISPUTE',
    blockOnHighRisk: true,
  }),
  async (req, res) => {
    // Dispute creation logic
    const fraudCheck = (req as any).fraudCheck;
    
    res.json({
      success: true,
      message: 'Dispute created',
      fraudCheck: {
        riskLevel: fraudCheck.riskLevel,
        riskScore: fraudCheck.riskScore,
      },
    });
  }
);

// ============================================================================
// Login Routes - Medium Security
// ============================================================================

app.post(
  '/api/auth/login',
  // Rate limiting
  advancedRateLimiter(redis, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyPrefix: 'login',
    skipSuccessfulRequests: true,
  }),
  // Fraud detection - monitor but don't block
  fraudDetection(fraudService, {
    checkType: 'LOGIN',
    blockOnHighRisk: false,
  }),
  async (req, res) => {
    // Login logic
    const fraudCheck = (req as any).fraudCheck;
    
    // Log suspicious login attempts
    if (fraudCheck.riskLevel === 'HIGH' || fraudCheck.riskLevel === 'CRITICAL') {
      console.warn('Suspicious login attempt', {
        ip: fraudCheck.ipAddress,
        riskScore: fraudCheck.riskScore,
        flags: fraudCheck.flags,
      });
    }
    
    res.json({
      success: true,
      message: 'Login successful',
      token: 'jwt_token_here',
    });
  }
);

// ============================================================================
// Registration Routes - Medium Security
// ============================================================================

app.post(
  '/api/auth/register',
  // Rate limiting
  advancedRateLimiter(redis, {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyPrefix: 'register',
    skipSuccessfulRequests: false,
  }),
  // Fraud detection
  fraudDetection(fraudService, {
    checkType: 'REGISTRATION',
    blockOnHighRisk: true,
  }),
  async (req, res) => {
    // Registration logic
    const fraudCheck = (req as any).fraudCheck;
    
    res.json({
      success: true,
      message: 'Registration successful',
      fraudCheck: {
        riskLevel: fraudCheck.riskLevel,
        riskScore: fraudCheck.riskScore,
      },
    });
  }
);

// ============================================================================
// Admin Routes - Fraud Management
// ============================================================================

// Get user fraud alerts
app.get('/api/admin/fraud/users/:userId/alerts', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit as string) || 10;
    
    const alerts = await fraudService.getUserAlerts(userId, limit);
    
    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alerts',
    });
  }
});

// Get IP fraud alerts
app.get('/api/admin/fraud/ips/:ipAddress/alerts', async (req, res) => {
  try {
    const ipAddress = req.params.ipAddress;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const alerts = await fraudService.getIpAlerts(ipAddress, limit);
    
    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve alerts',
    });
  }
});

// Blacklist IP
app.post('/api/admin/fraud/blacklist', async (req, res) => {
  try {
    const { ipAddress, reason, durationSeconds } = req.body;
    
    await fraudService.blacklistIp(ipAddress, reason, durationSeconds || 86400);
    
    res.json({
      success: true,
      message: 'IP blacklisted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to blacklist IP',
    });
  }
});

// Remove from blacklist
app.delete('/api/admin/fraud/blacklist/:ipAddress', async (req, res) => {
  try {
    const ipAddress = req.params.ipAddress;
    
    await fraudService.removeFromBlacklist(ipAddress);
    
    res.json({
      success: true,
      message: 'IP removed from blacklist',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to remove IP from blacklist',
    });
  }
});

// Manual fraud check
app.post('/api/admin/fraud/check', async (req, res) => {
  try {
    const { userId, ipAddress, checkType, metadata } = req.body;
    
    const result = await fraudService.performFraudCheck(
      userId,
      ipAddress,
      checkType,
      metadata
    );
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Fraud check failed',
    });
  }
});

// ============================================================================
// Error Handler
// ============================================================================

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// ============================================================================
// Start Server
// ============================================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Fraud detection enabled');
});

export default app;
