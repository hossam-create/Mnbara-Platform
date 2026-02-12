import { Request, Response, NextFunction } from 'express';
import { PluginIntegrationService } from '../services/plugin-integration.service';
import { prisma } from '../index';

// Initialize plugin integration service
const pluginService = PluginIntegrationService.getInstance(prisma);

export const pluginWalletMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Store original send method
    const originalSend = res.send;
    
    // Override send method to capture response data
    res.send = function(data: any) {
      // Parse the response data if it's a string
      let responseData;
      try {
        responseData = typeof data === 'string' ? JSON.parse(data) : data;
      } catch {
        responseData = data;
      }

      // Check if this is a wallet-related operation
      if (req.route && req.route.path) {
        const path = req.route.path;
        const method = req.method;

        // Handle wallet creation
        if (method === 'POST' && path.includes('/wallets') && responseData.success && responseData.data) {
          pluginService.onWalletCreated(responseData.data).catch(console.error);
        }
        
        // Handle wallet updates
        if (method === 'PUT' && path.includes('/wallets') && responseData.success && responseData.data) {
          pluginService.onWalletUpdated(responseData.data).catch(console.error);
        }
        
        // Handle wallet deletion
        if (method === 'DELETE' && path.includes('/wallets') && responseData.success) {
          pluginService.onWalletDeleted({ id: req.params.id, ...req.body }).catch(console.error);
        }
      }

      // Call original send method
      return originalSend.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Plugin wallet middleware error:', error);
    next();
  }
};

export const pluginTransactionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Store original send method
    const originalSend = res.send;
    
    // Override send method to capture response data
    res.send = function(data: any) {
      // Parse the response data if it's a string
      let responseData;
      try {
        responseData = typeof data === 'string' ? JSON.parse(data) : data;
      } catch {
        responseData = data;
      }

      // Check if this is a transaction-related operation
      if (req.route && req.route.path) {
        const path = req.route.path;
        const method = req.method;

        // Handle transaction initiation
        if (method === 'POST' && path.includes('/transactions') && responseData.success && responseData.data) {
          pluginService.onTransactionInitiated(responseData.data).catch(console.error);
        }
        
        // Handle transaction completion (status updates)
        if (method === 'PUT' && path.includes('/transactions') && responseData.success && responseData.data) {
          const transactionData = responseData.data;
          if (transactionData.status === 'completed') {
            pluginService.onTransactionCompleted(transactionData).catch(console.error);
          } else if (transactionData.status === 'failed') {
            pluginService.onTransactionFailed(transactionData).catch(console.error);
          } else if (transactionData.status === 'refunded') {
            pluginService.onTransactionRefunded(transactionData).catch(console.error);
          }
        }
      }

      // Call original send method
      return originalSend.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Plugin transaction middleware error:', error);
    next();
  }
};

export const pluginPayoutMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Store original send method
    const originalSend = res.send;
    
    // Override send method to capture response data
    res.send = function(data: any) {
      // Parse the response data if it's a string
      let responseData;
      try {
        responseData = typeof data === 'string' ? JSON.parse(data) : data;
      } catch {
        responseData = data;
      }

      // Check if this is a payout-related operation
      if (req.route && req.route.path) {
        const path = req.route.path;
        const method = req.method;

        // Handle payout creation
        if (method === 'POST' && path.includes('/payouts') && responseData.success && responseData.data) {
          pluginService.onPayoutCreated(responseData.data).catch(console.error);
        }
        
        // Handle payout status updates
        if (method === 'PUT' && path.includes('/payouts') && responseData.success && responseData.data) {
          const payoutData = responseData.data;
          if (payoutData.status === 'processed') {
            pluginService.onPayoutProcessed(payoutData).catch(console.error);
          } else if (payoutData.status === 'failed') {
            pluginService.onPayoutFailed(payoutData).catch(console.error);
          }
        }
      }

      // Call original send method
      return originalSend.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Plugin payout middleware error:', error);
    next();
  }
};

export const pluginKYCMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Store original send method
    const originalSend = res.send;
    
    // Override send method to capture response data
    res.send = function(data: any) {
      // Parse the response data if it's a string
      let responseData;
      try {
        responseData = typeof data === 'string' ? JSON.parse(data) : data;
      } catch {
        responseData = data;
      }

      // Check if this is a KYC-related operation
      if (req.route && req.route.path) {
        const path = req.route.path;
        const method = req.method;

        // Handle KYC submission
        if (method === 'POST' && path.includes('/kyc') && responseData.success && responseData.data) {
          pluginService.onKYCSubmitted(responseData.data).catch(console.error);
        }
        
        // Handle KYC status updates
        if (method === 'PUT' && path.includes('/kyc') && responseData.success && responseData.data) {
          const kycData = responseData.data;
          if (kycData.status === 'approved') {
            pluginService.onKYCApproved(kycData).catch(console.error);
          } else if (kycData.status === 'rejected') {
            pluginService.onKYCRejected(kycData).catch(console.error);
          }
        }
      }

      // Call original send method
      return originalSend.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Plugin KYC middleware error:', error);
    next();
  }
};

export const pluginSettlementMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Store original send method
    const originalSend = res.send;
    
    // Override send method to capture response data
    res.send = function(data: any) {
      // Parse the response data if it's a string
      let responseData;
      try {
        responseData = typeof data === 'string' ? JSON.parse(data) : data;
      } catch {
        responseData = data;
      }

      // Check if this is a settlement-related operation
      if (req.route && req.route.path) {
        const path = req.route.path;
        const method = req.method;

        // Handle settlement initiation
        if (method === 'POST' && path.includes('/settlements') && responseData.success && responseData.data) {
          pluginService.onSettlementInitiated(responseData.data).catch(console.error);
        }
        
        // Handle settlement status updates
        if (method === 'PUT' && path.includes('/settlements') && responseData.success && responseData.data) {
          const settlementData = responseData.data;
          if (settlementData.status === 'completed') {
            pluginService.onSettlementCompleted(settlementData).catch(console.error);
          } else if (settlementData.status === 'failed') {
            pluginService.onSettlementFailed(settlementData).catch(console.error);
          }
        }
      }

      // Call original send method
      return originalSend.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Plugin settlement middleware error:', error);
    next();
  }
};

// Export plugin service for direct access in controllers
export { pluginService };