import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { SubscriptionGate } from './SubscriptionGate';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3016;

// Middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(compression());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Subscription Service Running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get all features and their status
app.get('/features', (req, res) => {
  try {
    const features = SubscriptionGate.getAllFeatures();
    res.json({
      success: true,
      data: features
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch features'
    });
  }
});

// Check feature access (for other services to call)
app.post('/check-access', async (req, res) => {
  try {
    const { userId, featureName } = req.body;

    if (!userId || !featureName) {
      return res.status(400).json({
        success: false,
        error: 'userId and featureName are required'
      });
    }

    const accessCheck = await SubscriptionGate.checkFeatureAccess(userId, featureName);
    
    res.json({
      success: true,
      data: accessCheck
    });

  } catch (error) {
    console.error('Access check error:', error);
    res.status(500).json({
      success: false,
      error: 'Access check failed'
    });
  }
});

// Admin override subscription
app.post('/admin/override-subscription', async (req, res) => {
  try {
    const { userId, action, plan } = req.body;

    if (!userId || !action) {
      return res.status(400).json({
        success: false,
        error: 'userId and action are required'
      });
    }

    if (action !== 'activate' && action !== 'deactivate') {
      return res.status(400).json({
        success: false,
        error: 'action must be activate or deactivate'
      });
    }

    const result = await SubscriptionGate.adminOverrideSubscription(userId, action, plan);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }

  } catch (error) {
    console.error('Admin override error:', error);
    res.status(500).json({
      success: false,
      error: 'Admin override failed'
    });
  }
});

// Create subscription
app.post('/subscriptions', async (req, res) => {
  try {
    const { userId, plan, durationMonths = 1 } = req.body;

    if (!userId || !plan) {
      return res.status(400).json({
        success: false,
        error: 'userId and plan are required'
      });
    }

    const result = await SubscriptionGate.createSubscription(userId, plan, durationMonths);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.subscription,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }

  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🔐 Subscription Service running on port ${PORT}`);
  console.log(`🔍 Features: GET /features`);
  console.log(`✅ Access Check: POST /check-access`);
  console.log(`🔑 Admin Override: POST /admin/override-subscription`);
});

export default app;