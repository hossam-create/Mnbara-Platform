import { Request, Response } from 'express';

// Simple in-memory payment storage for MVP
interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const payments: Payment[] = [];

/**
 * Process payment for order service fee
 * Simple Stripe-like integration for MVP
 */
export const processPayment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-' + Math.random().toString(36).substr(2, 9);
    const { orderId, amount, paymentMethod = 'card' } = req.body;

    // Validate input
    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Order ID and amount are required'
      });
    }

    // Simulate payment processing (MVP - no real payment gateway)
    const paymentResult = await simulatePayment({
      amount,
      currency: 'USD',
      paymentMethod,
      description: `Service fee for order: ${orderId}`
    });

    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Payment failed',
        message: paymentResult.message
      });
    }

    // Create payment record
    const payment: Payment = {
      id: 'payment-' + Math.random().toString(36).substr(2, 9),
      userId,
      orderId,
      amount,
      currency: 'USD',
      paymentMethod,
      status: 'completed',
      transactionId: paymentResult.transactionId,
      description: `Service fee for order: ${orderId}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    payments.push(payment);

    res.json({
      success: true,
      data: {
        payment,
        orderId,
        message: 'Payment processed successfully'
      }
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process payment'
    });
  }
};

/**
 * Simulate payment processing for MVP
 * In production, this would integrate with Stripe, PayPal, etc.
 */
async function simulatePayment(paymentData: {
  amount: number;
  currency: string;
  paymentMethod: string;
  description: string;
}): Promise<{
  success: boolean;
  transactionId?: string;
  message?: string;
}> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate 95% success rate for MVP
  const successRate = 0.95;
  const isSuccess = Math.random() < successRate;

  if (!isSuccess) {
    return {
      success: false,
      message: 'Card declined - insufficient funds'
    };
  }

  return {
    success: true,
    transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}

/**
 * Get user's payment history
 */
export const getPaymentHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-' + Math.random().toString(36).substr(2, 9);
    const { page = 1, limit = 20 } = req.query;

    const userPayments = payments.filter(payment => payment.userId === userId);
    
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedPayments = userPayments.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedPayments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: userPayments.length,
        totalPages: Math.ceil(userPayments.length / Number(limit))
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment history'
    });
  }
};

/**
 * Get payment details
 */
export const getPaymentDetails = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user-' + Math.random().toString(36).substr(2, 9);
    const { paymentId } = req.params;

    const payment = payments.find(p => p.id === paymentId && p.userId === userId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment details'
    });
  }
};