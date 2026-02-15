import express from 'express';
import { Pool } from 'pg';
import { KYCService } from './services/KYCService';
import { FileStorageService } from './services/storage/FileStorageService';
import { StorageFactory } from './services/storage/StorageFactory';
import {
  kycVerification,
  requireEmailVerification,
  requirePhoneVerification,
  requireIdVerification,
  checkTransactionLimit,
  checkPayoutEligibility,
} from './middleware/kycVerification';
import { createKYCRoutes } from './routes/kycRoutes';
import { createAdminKYCRoutes } from './routes/adminKYCRoutes';

const app = express();

// Initialize dependencies
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const storageService = StorageFactory.create();
const kycService = new KYCService(db, storageService);

// Global middleware
app.use(express.json());

// ============================================================================
// KYC Routes
// ============================================================================

// Public KYC routes (require authentication)
app.use('/api/verification', createKYCRoutes(db, storageService));

// Admin KYC routes (require admin authentication)
app.use('/api/admin', createAdminKYCRoutes(db, storageService));

// ============================================================================
// Protected Routes with KYC Enforcement
// ============================================================================

// Payment routes - check transaction limit
app.post(
  '/api/payments',
  checkTransactionLimit(kycService),
  async (req, res) => {
    // Payment processing logic
    const verificationStatus = (req as any).verificationStatus;
    
    res.json({
      success: true,
      message: 'Payment processed',
      verificationLevel: verificationStatus.verificationLevel,
      transactionLimit: verificationStatus.transactionLimit,
    });
  }
);

// Payout routes - check payout eligibility
app.post(
  '/api/payouts',
  checkPayoutEligibility(kycService),
  async (req, res) => {
    // Payout processing logic
    const verificationStatus = (req as any).verificationStatus;
    
    res.json({
      success: true,
      message: 'Payout initiated',
      verificationLevel: verificationStatus.verificationLevel,
    });
  }
);

// Dispute routes - require email verification
app.post(
  '/api/disputes',
  requireEmailVerification(kycService),
  async (req, res) => {
    // Dispute creation logic
    res.json({
      success: true,
      message: 'Dispute created',
    });
  }
);

// High-value transactions - require ID verification
app.post(
  '/api/transactions/high-value',
  requireIdVerification(kycService),
  async (req, res) => {
    // High-value transaction logic
    res.json({
      success: true,
      message: 'High-value transaction processed',
    });
  }
);

// ============================================================================
// Example: Custom verification check
// ============================================================================

app.post(
  '/api/custom-action',
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const amount = req.body.amount;

      // Check if user can perform this action
      const check = await kycService.checkTransactionLimit(userId, amount);

      if (!check.allowed) {
        return res.status(403).json({
          success: false,
          error: 'Verification required',
          message: check.message,
          currentLevel: check.currentLevel,
          requiredLevel: check.requiredLevel,
          upgradeUrl: '/api/verification/upgrade',
        });
      }

      // Proceed with action
      res.json({
        success: true,
        message: 'Action completed',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Action failed',
      });
    }
  }
);

// ============================================================================
// Example: Get verification requirements for an action
// ============================================================================

app.get('/api/actions/:action/requirements', async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const action = req.params.action;

    const status = await kycService.getUserVerificationStatus(userId);

    // Define requirements for different actions
    const requirements: Record<string, any> = {
      payment: {
        minLevel: 'UNVERIFIED',
        maxAmount: status.transactionLimit,
        message: `You can make payments up to $${status.transactionLimit}`,
      },
      payout: {
        minLevel: 'EMAIL_VERIFIED',
        maxAmount: status.transactionLimit,
        message: status.canRequestPayout
          ? `You can request payouts up to $${status.transactionLimit}`
          : 'You must verify your email to request payouts',
      },
      dispute: {
        minLevel: 'EMAIL_VERIFIED',
        message: status.emailVerified
          ? 'You can file disputes'
          : 'You must verify your email to file disputes',
      },
      highValue: {
        minLevel: 'ID_VERIFIED',
        message: status.idVerified
          ? 'You can perform high-value transactions'
          : 'You must verify your ID for high-value transactions',
      },
    };

    const requirement = requirements[action];

    if (!requirement) {
      return res.status(404).json({
        success: false,
        error: 'Unknown action',
      });
    }

    res.json({
      success: true,
      data: {
        action,
        currentStatus: status,
        requirements: requirement,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get requirements',
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
  console.log('KYC-Lite system enabled');
});

export default app;
