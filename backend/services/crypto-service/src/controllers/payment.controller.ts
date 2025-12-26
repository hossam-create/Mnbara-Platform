import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { CryptoCurrency, PaymentStatus } from '@prisma/client';

export const paymentController = {
  // إنشاء طلب دفع - Create payment
  async createPayment(req: Request, res: Response) {
    try {
      const { orderId, merchantId, amountUsd, currency, callbackUrl, metadata } = req.body;

      if (!orderId || !merchantId || !amountUsd || !currency) {
        return res.status(400).json({
          success: false,
          message: 'orderId, merchantId, amountUsd, and currency are required',
          messageAr: 'معرف الطلب والتاجر والمبلغ والعملة مطلوبة'
        });
      }

      if (!['BTC', 'ETH', 'USDC', 'USDT'].includes(currency)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid currency. Supported: BTC, ETH, USDC, USDT',
          messageAr: 'عملة غير صالحة. المدعومة: BTC, ETH, USDC, USDT'
        });
      }

      const payment = await paymentService.createPayment({
        orderId,
        merchantId,
        amountUsd: parseFloat(amountUsd),
        currency: currency as CryptoCurrency,
        callbackUrl,
        metadata
      });

      res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        messageAr: 'تم إنشاء طلب الدفع بنجاح',
        data: payment
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في إنشاء طلب الدفع'
      });
    }
  },

  // الحصول على حالة الدفع - Get payment status
  async getPaymentStatus(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;

      const status = await paymentService.getPaymentStatus(paymentId);

      res.json({
        success: true,
        data: status
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
        messageAr: 'طلب الدفع غير موجود'
      });
    }
  },

  // تأكيد الدفع (webhook) - Confirm payment
  async confirmPayment(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      const { txHash, receivedAmount } = req.body;

      if (!txHash || receivedAmount === undefined) {
        return res.status(400).json({
          success: false,
          message: 'txHash and receivedAmount are required',
          messageAr: 'معرف المعاملة والمبلغ المستلم مطلوبان'
        });
      }

      const payment = await paymentService.confirmPayment(
        paymentId,
        txHash,
        parseFloat(receivedAmount)
      );

      res.json({
        success: true,
        message: 'Payment confirmed',
        messageAr: 'تم تأكيد الدفع',
        data: payment
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في تأكيد الدفع'
      });
    }
  },

  // استرداد الدفع - Refund payment
  async refundPayment(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      const { refundAddress } = req.body;

      if (!refundAddress) {
        return res.status(400).json({
          success: false,
          message: 'Refund address is required',
          messageAr: 'عنوان الاسترداد مطلوب'
        });
      }

      const refund = await paymentService.refundPayment(paymentId, refundAddress);

      res.json({
        success: true,
        message: 'Refund initiated',
        messageAr: 'تم بدء الاسترداد',
        data: refund
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الاسترداد'
      });
    }
  },

  // الحصول على مدفوعات التاجر - Get merchant payments
  async getMerchantPayments(req: Request, res: Response) {
    try {
      const { merchantId } = req.params;
      const { status, limit, offset } = req.query;

      const payments = await paymentService.getMerchantPayments(merchantId, {
        status: status as PaymentStatus | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      });

      res.json({
        success: true,
        data: payments
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الحصول على المدفوعات'
      });
    }
  },

  // دفع من المحفظة - Pay from wallet
  async payFromWallet(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
          messageAr: 'معرف المستخدم مطلوب'
        });
      }

      const result = await paymentService.payFromWallet(userId, paymentId);

      res.json({
        success: true,
        message: 'Payment successful',
        messageAr: 'تم الدفع بنجاح',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
        messageAr: 'فشل في الدفع'
      });
    }
  }
};
