import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Test mode - Stripe sandbox or mock
const USE_STRIPE_TEST = process.env.STRIPE_TEST_MODE === 'true';
const stripe = USE_STRIPE_TEST && process.env.STRIPE_SECRET_KEY ? 
  new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(compression());
app.use(express.json());

// In-memory wallet storage for testing
interface Wallet {
  userId: string;
  balance: number;
  heldAmount: number;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  type: 'payment' | 'hold' | 'release' | 'refund';
  amount: number;
  orderId?: string;
  status: 'pending' | 'completed' | 'failed';
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
      balance: Math.floor(Math.random() * 500) + 100, // $100-600 balance
      heldAmount: 0,
      transactions: []
    };
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Payment Service Running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mode: USE_STRIPE_TEST ? 'STRIPE_TEST' : 'MOCK',
    wallets: Object.keys(wallets).length
  });
});

// Get wallet balance
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

    res.json({
      success: true,
      data: {
        userId: wallet.userId,
        balance: wallet.balance,
        heldAmount: wallet.heldAmount,
        availableBalance: wallet.balance - wallet.heldAmount,
        transactionCount: wallet.transactions.length
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

// Process payment (with wallet simulation)
app.post('/payments/process', async (req, res) => {
  try {
    const { userId, amount, orderId, paymentMethod = 'card' } = req.body;

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

    // Check if user has sufficient balance
    const availableBalance = wallet.balance - wallet.heldAmount;
    if (availableBalance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        required: amount,
        available: availableBalance
      });
    }

    let paymentResult;

    if (USE_STRIPE_TEST && stripe) {
      // Use Stripe test mode
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            orderId,
            userId
          }
        });

        paymentResult = {
          success: true,
          transactionId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          status: paymentIntent.status
        };
      } catch (stripeError) {
        console.error('Stripe error:', stripeError);
        paymentResult = {
          success: false,
          error: 'Stripe payment failed',
          message: stripeError.message
        };
      }
    } else {
      // Mock payment processing (95% success rate)
      const successRate = 0.95;
      const isSuccess = Math.random() < successRate;

      if (isSuccess) {
        // Deduct from wallet balance
        wallet.balance -= amount;
        
        // Create transaction
        const transaction: Transaction = {
          id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          type: 'payment',
          amount: amount,
          orderId: orderId,
          status: 'completed',
          createdAt: new Date()
        };

        wallet.transactions.push(transaction);

        paymentResult = {
          success: true,
          transactionId: transaction.id,
          status: 'completed',
          message: 'Payment processed successfully'
        };
      } else {
        paymentResult = {
          success: false,
          error: 'Payment declined',
          message: 'Card declined - insufficient funds or bank rejection'
        };
      }
    }

    if (paymentResult.success) {
      res.json({
        success: true,
        data: {
          payment: paymentResult,
          wallet: {
            balance: wallet.balance,
            heldAmount: wallet.heldAmount,
            availableBalance: wallet.balance - wallet.heldAmount
          }
        },
        message: 'Payment processed successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: paymentResult.error,
        message: paymentResult.message
      });
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Payment processing failed'
    });
  }
});

// Hold funds for escrow
app.post('/payments/hold', (req, res) => {
  try {
    const { userId, amount, orderId } = req.body;

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

    const availableBalance = wallet.balance - wallet.heldAmount;
    if (availableBalance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient available balance for hold',
        required: amount,
        available: availableBalance
      });
    }

    // Hold the funds
    wallet.heldAmount += amount;

    // Create hold transaction
    const transaction: Transaction = {
      id: 'hold_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type: 'hold',
      amount: amount,
      orderId: orderId,
      status: 'completed',
      createdAt: new Date()
    };

    wallet.transactions.push(transaction);

    res.json({
      success: true,
      data: {
        holdId: transaction.id,
        wallet: {
          balance: wallet.balance,
          heldAmount: wallet.heldAmount,
          availableBalance: wallet.balance - wallet.heldAmount
        }
      },
      message: 'Funds held successfully'
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
app.post('/payments/release', (req, res) => {
  try {
    const { holdId, userId, releaseTo = 'seller' } = req.body;

    if (!holdId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'holdId and userId are required'
      });
    }

    const wallet = wallets[userId];
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    // Find the hold transaction
    const holdTransaction = wallet.transactions.find(t => t.id === holdId && t.type === 'hold');
    if (!holdTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Hold transaction not found'
      });
    }

    // Release the funds
    wallet.heldAmount -= holdTransaction.amount;

    // Create release transaction
    const transaction: Transaction = {
      id: 'release_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type: 'release',
      amount: holdTransaction.amount,
      orderId: holdTransaction.orderId,
      status: 'completed',
      createdAt: new Date()
    };

    wallet.transactions.push(transaction);

    res.json({
      success: true,
      data: {
        releaseId: transaction.id,
        wallet: {
          balance: wallet.balance,
          heldAmount: wallet.heldAmount,
          availableBalance: wallet.balance - wallet.heldAmount
        }
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
app.get('/payments/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const wallet = wallets[userId];
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedTransactions = wallet.transactions.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: wallet.transactions.length,
          totalPages: Math.ceil(wallet.transactions.length / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment history'
    });
  }
});

// Initialize test data
initializeTestWallets();

app.listen(PORT, () => {
  console.log(`💳 Payment Service running on port ${PORT}`);
  console.log(`🧪 Mode: ${USE_STRIPE_TEST ? 'STRIPE TEST' : 'MOCK'}`);
  console.log(`💰 Test wallets initialized with random balances`);
  console.log(`🔒 Payment endpoints:`);
  console.log(`   POST /payments/process - Process payment`);
  console.log(`   POST /payments/hold - Hold funds for escrow`);
  console.log(`   POST /payments/release - Release held funds`);
  console.log(`   GET /payments/history/:userId - Get transaction history`);
  console.log(`   GET /wallet/:userId - Get wallet balance`);
});

export default app;