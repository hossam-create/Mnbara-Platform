import { PrismaClient, PayPalStatus, RefundReason, RefundStatus } from '@prisma/client';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// PayPal API Configuration
const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';

// Get PayPal Access Token
async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await axios.post(
    `${PAYPAL_API_BASE}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  
  return response.data.access_token;
}

export const paypalService = {
  // إنشاء طلب دفع - Create payment order
  async createOrder(data: {
    orderId: string;
    userId: string;
    amount: number;
    currency?: string;
    description?: string;
    returnUrl: string;
    cancelUrl: string;
    metadata?: any;
  }) {
    const { orderId, userId, amount, currency = 'USD', description, returnUrl, cancelUrl, metadata } = data;

    try {
      const accessToken = await getAccessToken();

      // Create PayPal order
      const response = await axios.post(
        `${PAYPAL_API_BASE}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: orderId,
            description: description || `Order ${orderId}`,
            amount: {
              currency_code: currency,
              value: amount.toFixed(2)
            }
          }],
          application_context: {
            brand_name: 'Mnbara',
            landing_page: 'LOGIN',
            user_action: 'PAY_NOW',
            return_url: returnUrl,
            cancel_url: cancelUrl
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const paypalOrder = response.data;

      // Save to database
      const transaction = await prisma.payPalTransaction.create({
        data: {
          paypalOrderId: paypalOrder.id,
          orderId,
          userId,
          amount,
          currency,
          description,
          metadata,
          status: 'CREATED'
        }
      });

      // Get approval URL
      const approvalUrl = paypalOrder.links.find((link: any) => link.rel === 'approve')?.href;

      return {
        transactionId: transaction.id,
        paypalOrderId: paypalOrder.id,
        status: paypalOrder.status,
        approvalUrl,
        links: paypalOrder.links
      };
    } catch (error: any) {
      console.error('PayPal create order error:', error.response?.data || error.message);
      throw new Error('Failed to create PayPal order');
    }
  },

  // التقاط الدفع - Capture payment
  async capturePayment(paypalOrderId: string) {
    try {
      const accessToken = await getAccessToken();

      // Capture the order
      const response = await axios.post(
        `${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const captureData = response.data;
      const capture = captureData.purchase_units[0].payments.captures[0];
      const payer = captureData.payer;

      // Calculate fees
      const paypalFee = capture.seller_receivable_breakdown?.paypal_fee?.value 
        ? parseFloat(capture.seller_receivable_breakdown.paypal_fee.value)
        : 0;
      const netAmount = capture.seller_receivable_breakdown?.net_amount?.value
        ? parseFloat(capture.seller_receivable_breakdown.net_amount.value)
        : parseFloat(capture.amount.value) - paypalFee;

      // Update transaction
      const transaction = await prisma.payPalTransaction.update({
        where: { paypalOrderId },
        data: {
          status: 'CAPTURED',
          captureId: capture.id,
          paypalPayerId: payer.payer_id,
          payerEmail: payer.email_address,
          payerName: `${payer.name?.given_name || ''} ${payer.name?.surname || ''}`.trim(),
          payerCountry: payer.address?.country_code,
          paypalFee,
          netAmount,
          capturedAt: new Date()
        }
      });

      return {
        transactionId: transaction.id,
        paypalOrderId,
        captureId: capture.id,
        status: 'CAPTURED',
        amount: parseFloat(capture.amount.value),
        currency: capture.amount.currency_code,
        paypalFee,
        netAmount,
        payer: {
          id: payer.payer_id,
          email: payer.email_address,
          name: `${payer.name?.given_name || ''} ${payer.name?.surname || ''}`.trim()
        }
      };
    } catch (error: any) {
      console.error('PayPal capture error:', error.response?.data || error.message);
      
      // Update transaction status to failed
      await prisma.payPalTransaction.update({
        where: { paypalOrderId },
        data: { status: 'FAILED' }
      });
      
      throw new Error('Failed to capture PayPal payment');
    }
  },

  // الحصول على تفاصيل الطلب - Get order details
  async getOrderDetails(paypalOrderId: string) {
    try {
      const accessToken = await getAccessToken();

      const response = await axios.get(
        `${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('PayPal get order error:', error.response?.data || error.message);
      throw new Error('Failed to get PayPal order details');
    }
  },

  // استرداد الدفع - Refund payment
  async refundPayment(data: {
    transactionId: string;
    amount?: number;
    reason: RefundReason;
    note?: string;
    initiatedBy: string;
  }) {
    const { transactionId, amount, reason, note, initiatedBy } = data;

    const transaction = await prisma.payPalTransaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (!transaction.captureId) {
      throw new Error('Transaction has not been captured');
    }

    if (['REFUNDED', 'VOIDED', 'FAILED'].includes(transaction.status)) {
      throw new Error('Transaction cannot be refunded');
    }

    try {
      const accessToken = await getAccessToken();
      const refundAmount = amount || Number(transaction.amount);

      const response = await axios.post(
        `${PAYPAL_API_BASE}/v2/payments/captures/${transaction.captureId}/refund`,
        {
          amount: {
            value: refundAmount.toFixed(2),
            currency_code: transaction.currency
          },
          note_to_payer: note || `Refund for order ${transaction.orderId}`
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const refundData = response.data;

      // Create refund record
      const refund = await prisma.payPalRefund.create({
        data: {
          transactionId,
          paypalRefundId: refundData.id,
          amount: refundAmount,
          currency: transaction.currency,
          reason,
          note,
          status: refundData.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
          initiatedBy,
          completedAt: refundData.status === 'COMPLETED' ? new Date() : null
        }
      });

      // Update transaction status
      const isFullRefund = refundAmount >= Number(transaction.amount);
      await prisma.payPalTransaction.update({
        where: { id: transactionId },
        data: {
          status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          refundedAt: new Date()
        }
      });

      return {
        refundId: refund.id,
        paypalRefundId: refundData.id,
        amount: refundAmount,
        currency: transaction.currency,
        status: refund.status
      };
    } catch (error: any) {
      console.error('PayPal refund error:', error.response?.data || error.message);
      throw new Error('Failed to process refund');
    }
  },

  // الحصول على معاملة - Get transaction
  async getTransaction(transactionId: string) {
    const transaction = await prisma.payPalTransaction.findUnique({
      where: { id: transactionId },
      include: {
        refunds: true
      }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction;
  },

  // الحصول على معاملات المستخدم - Get user transactions
  async getUserTransactions(userId: string, options: {
    status?: PayPalStatus;
    limit?: number;
    offset?: number;
  } = {}) {
    const { status, limit = 20, offset = 0 } = options;

    const transactions = await prisma.payPalTransaction.findMany({
      where: {
        userId,
        ...(status && { status })
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        refunds: true
      }
    });

    const total = await prisma.payPalTransaction.count({
      where: {
        userId,
        ...(status && { status })
      }
    });

    return {
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  },

  // إلغاء الطلب - Void order
  async voidOrder(paypalOrderId: string) {
    const transaction = await prisma.payPalTransaction.findUnique({
      where: { paypalOrderId }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'CREATED' && transaction.status !== 'APPROVED') {
      throw new Error('Only pending orders can be voided');
    }

    // PayPal orders expire automatically, we just update our status
    const updated = await prisma.payPalTransaction.update({
      where: { paypalOrderId },
      data: { status: 'VOIDED' }
    });

    return updated;
  }
};
