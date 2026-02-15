import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(compression());
app.use(express.json());

// In-memory wallet storage for testing
interface Wallet {
  userId: string;
  balance: number;
  heldFunds: HeldFund[];
  transactions: Transaction[];
  createdAt: Date;
  updatedAt: Date;
}

interface HeldFund {
  id: string;
  orderId: string;
  amount: number;
  status: 'held' | 'released' | 'refunded';
  createdAt: Date;
  expiresAt: Date;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'hold' | 'release' | 'refund' | 'transfer';
  amount: number;
  fromUserId?: string;
  toUserId?: string;
  orderId?: string;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  createdAt: Date;
}

const wallets: Record<string, Wallet> = {};

// Initialize test wallets
function initializeTestWallets() {
  const testUsers = [
    'buyer1', 'buyer2', 'buyer3', 'buyer4', 'buyer5',
    'seller1', 'seller2', 'seller3', 'seller4', 'seller5',
    'traveler1', 'traveler2', 'traveler3', 'traveler4', 'traveler5'
  ];

  testUsers.forEach(userId => {
    wallets[userId] = {
      userId,
      balance: Math.floor(Math.random() * 500) + 200, // $200-700 balance
      heldFunds: [],
      transactions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Wallet Service Running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    wallets: Object.keys(wallets).length,
    totalBalance: Object.values(wallets).reduce((sum, wallet) => sum + wallet.balance, 0),
    totalHeld: Object.values(wallets).reduce((sum, wallet) => 
      sum + wallet.heldFunds.filter(h => h.status === 'held').reduce((s, h) => s + h.amount, 0), 0)
  });
});

// Get wallet details
app.get('/wallet/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const wallet = wallets[userId];

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    const activeHeldFunds = wallet.heldFunds.filter(h => h.status === 'held');
    const availableBalance = wallet.balance - activeHeldFunds.reduce((sum, h) => sum + h.amount, 0);

    res.json({
      success: true,
      data: {
        userId: wallet.userId,
        balance: wallet.balance,
        availableBalance: availableBalance,
        heldFunds: activeHeldFunds,
        heldAmount: activeHeldFunds.reduce((sum, h) => sum + h.amount, 0),
        transactionCount: wallet.transactions.length,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt
      }
    });

  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wallet'
    });
  }
});

// Hold funds for order (escrow)
app.post('/wallet/hold', (req, res) => {
  try {
    const { userId, amount, orderId, description = 'Order payment hold' } = req.body;

    if (!userId || !amount || !orderId) {
      return res.status(400).json({
        success: false,
        error: 'userId, amount, and orderId are required'
      });
    }

    const wallet = wallets[userId];
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    // Calculate available balance
    const activeHeldFunds = wallet.heldFunds.filter(h => h.status === 'held');
    const availableBalance = wallet.balance - activeHeldFunds.reduce((sum, h) => sum + h.amount, 0);

    if (availableBalance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient available balance',
        required: amount,
        available: availableBalance,
        balance: wallet.balance,
        heldAmount: activeHeldFunds.reduce((sum, h) => sum + h.amount, 0)
      });
    }

    // Create hold fund record
    const holdFund: HeldFund = {
      id: 'hold_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      orderId: orderId,
      amount: amount,
      status: 'held',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiration
    };

    wallet.heldFunds.push(holdFund);

    // Create transaction record
    const transaction: Transaction = {
      id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type: 'hold',
      amount: amount,
      orderId: orderId,
      status: 'completed',
      description: description,
      createdAt: new Date()
    };

    wallet.transactions.push(transaction);
    wallet.updatedAt = new Date();

    res.json({
      success: true,
      data: {
        holdId: holdFund.id,
        orderId: orderId,
        amount: amount,
        availableBalance: wallet.balance - (activeHeldFunds.reduce((sum, h) => sum + h.amount, 0) + amount),
        wallet: {
          balance: wallet.balance,
          heldAmount: activeHeldFunds.reduce((sum, h) => sum + h.amount, 0) + amount,
          availableBalance: wallet.balance - (activeHeldFunds.reduce((sum, h) => sum + h.amount, 0) + amount)
        }
      },
      message: 'Funds held successfully for order'
    });

  } catch (error) {
    console.error('Hold funds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to hold funds'
    });
  }
});

// Release held funds
app.post('/wallet/release', (req, res) => {
  try {
    const { holdId, fromUserId, toUserId, releaseType = 'complete' } = req.body;

    if (!holdId || !fromUserId) {
      return res.status(400).json({
        success: false,
        error: 'holdId and fromUserId are required'
      });
    }

    const fromWallet = wallets[fromUserId];
    if (!fromWallet) {
      return res.status(404).json({
        success: false,
        error: 'Source wallet not found'
      });
    }

    // Find the hold fund
    const holdFund = fromWallet.heldFunds.find(h => h.id === holdId && h.status === 'held');
    if (!holdFund) {
      return res.status(404).json({
        success: false,
        error: 'Hold fund not found or already released'
      });
    }

    // Release funds
    holdFund.status = 'released';

    // Create release transaction for from wallet
    const releaseTransaction: Transaction = {
      id: 'release_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type: 'release',
      amount: holdFund.amount,
      fromUserId: fromUserId,
      toUserId: toUserId,
      orderId: holdFund.orderId,
      status: 'completed',
      description: `Released funds for order ${holdFund.orderId}`,
      createdAt: new Date()
    };

    fromWallet.transactions.push(releaseTransaction);

    // If releasing to another user, transfer the funds
    if (toUserId && toUserId !== fromUserId) {
      const toWallet = wallets[toUserId];
      if (!toWallet) {
        return res.status(404).json({
          success: false,
          error: 'Destination wallet not found'
        });
      }

      // Transfer funds
      toWallet.balance += holdFund.amount;
      toWallet.updatedAt = new Date();

      // Create transfer transaction for to wallet
      const transferTransaction: Transaction = {
        id: 'transfer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        type: 'transfer',
        amount: holdFund.amount,
        fromUserId: fromUserId,
        toUserId: toUserId,
        orderId: holdFund.orderId,
        status: 'completed',
        description: `Received funds for order ${holdFund.orderId}`,
        createdAt: new Date()
      };

      toWallet.transactions.push(transferTransaction);
    } else {
      // If releasing to same user, just make funds available again
      // No balance change needed since hold doesn't deduct from balance
    }

    fromWallet.updatedAt = new Date();

    res.json({
      success: true,
      data: {
        holdId: holdFund.id,
        amount: holdFund.amount,
        fromWallet: {
          userId: fromWallet.userId,
          balance: fromWallet.balance,
          heldAmount: fromWallet.heldFunds.filter(h => h.status === 'held').reduce((sum, h) => sum + h.amount, 0)
        },
        toWallet: toUserId && toUserId !== fromUserId ? {
          userId: toUserId,
          balance: wallets[toUserId].balance
        } : null
      },
      message: 'Funds released successfully'
    });

  } catch (error) {
    console.error('Release funds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to release funds'
    });
  }
});

// Get transaction history
app.get('/wallet/transactions/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, type } = req.query;

    const wallet = wallets[userId];
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    let filteredTransactions = wallet.transactions;
    if (type) {
      filteredTransactions = wallet.transactions.filter(t => t.type === type);
    }

    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredTransactions.length,
          totalPages: Math.ceil(filteredTransactions.length / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction history'
    });
  }
});

// Get held funds
app.get('/wallet/held-funds/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { status = 'held' } = req.query;

    const wallet = wallets[userId];
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    const filteredHeldFunds = wallet.heldFunds.filter(h => h.status === status);

    res.json({
      success: true,
      data: {
        heldFunds: filteredHeldFunds,
        totalAmount: filteredHeldFunds.reduce((sum, h) => sum + h.amount, 0),
        count: filteredHeldFunds.length
      }
    });

  } catch (error) {
    console.error('Get held funds error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch held funds'
    });
  }
});

// Initialize test data
initializeTestWallets();

app.listen(PORT, () => {
  console.log(`💰 Wallet Service running on port ${PORT}`);
  console.log(`🔒 Wallet endpoints:`);
  console.log(`   GET /wallet/:userId - Get wallet details`);
  console.log(`   POST /wallet/hold - Hold funds for order`);
  console.log(`   POST /wallet/release - Release held funds`);
  console.log(`   GET /wallet/transactions/:userId - Get transaction history`);
  console.log(`   GET /wallet/held-funds/:userId - Get held funds`);
  console.log(`   Test wallets initialized with $200-700 balances`);
});

export default app;