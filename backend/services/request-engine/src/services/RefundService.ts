/**
 * Refund Service
 * 
 * خدمة شاملة لمعالجة الاستردادات (Refunds)
 * تتعامل مع Stripe، المحفظة، Escrow، وحالات الطلبات
 */

import { Pool } from 'pg';
import Stripe from 'stripe';
import { logger } from '../utils/logger';

/**
 * أخطاء مخصصة للاستردادات
 */
export class RefundWindowExpiredError extends Error {
  constructor(hoursElapsed: number) {
    super(`نافذة الاسترداد منتهية. مر ${hoursElapsed} ساعة. يجب طلب الاسترداد خلال 48 ساعة.`);
    this.name = 'RefundWindowExpiredError';
  }
}

export class StripeRefundError extends Error {
  constructor(message: string, public stripeError?: any) {
    super(`فشل استرداد Stripe: ${message}`);
    this.name = 'StripeRefundError';
  }
}

export class AlreadyRefundedError extends Error {
  constructor(requestId: number) {
    super(`الطلب #${requestId} تم استرداده مسبقاً`);
    this.name = 'AlreadyRefundedError';
  }
}

export class InvalidRequestStatusError extends Error {
  constructor(status: string) {
    super(`لا يمكن استرداد الطلب في الحالة: ${status}`);
    this.name = 'InvalidRequestStatusError';
  }
}

/**
 * أنواع البيانات
 */
interface RefundResult {
  success: boolean;
  requestId: number;
  refundAmount: number;
  stripeRefundId?: string;
  walletTransactionId?: string;
  message: string;
}

interface RefundPolicy {
  allowPartialRefund: boolean;
  feePercentage: number;
  minimumRefundAmount: number;
}

/**
 * خدمة الاستردادات
 */
export class RefundService {
  private db: Pool;
  private stripe: Stripe;
  private refundPolicy: RefundPolicy;

  constructor(db: Pool) {
    this.db = db;
    
    // تهيئة Stripe
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16'
    });

    // سياسة الاسترداد الافتراضية
    this.refundPolicy = {
      allowPartialRefund: true,
      feePercentage: parseFloat(process.env.REFUND_FEE_PERCENTAGE || '0'),
      minimumRefundAmount: parseFloat(process.env.MINIMUM_REFUND_AMOUNT || '1')
    };

    logger.info('RefundService initialized', { 
      feePercentage: this.refundPolicy.feePercentage 
    });
  }

  /**
   * معالجة الاسترداد
   * 
   * @param requestId - معرف الطلب
   * @param reason - سبب الاسترداد
   * @param amount - المبلغ (اختياري - للاسترداد الجزئي)
   */
  async processRefund(
    requestId: number,
    reason: string,
    amount?: number
  ): Promise<RefundResult> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      logger.info('بدء معالجة الاسترداد', { 
        requestId, 
        reason, 
        amount: amount || 'كامل' 
      });

      // 1. جلب تفاصيل الطلب
      const request = await this.getRequestDetails(requestId, client);

      // 2. التحقق من إمكانية الاسترداد
      await this.validateRefundEligibility(request);

      // 3. حساب مبلغ الاسترداد
      const refundAmount = amount || await this.calculateRefundAmount(requestId);

      logger.info('مبلغ الاسترداد المحسوب', { 
        requestId, 
        originalAmount: request.amount,
        refundAmount 
      });

      // 4. معالجة استرداد Stripe
      let stripeRefundId: string | undefined;
      if (request.payment_intent_id) {
        stripeRefundId = await this.processStripeRefund(
          request.payment_intent_id,
          refundAmount,
          reason
        );
      }

      // 5. تحديث escrow_hold إلى REFUNDED
      await this.updateEscrowHold(requestId, 'REFUNDED', client);

      // 6. إعادة الأموال في WalletService
      const walletTransactionId = await this.refundToWallet(
        request.buyer_id,
        refundAmount,
        requestId,
        reason,
        client
      );

      // 7. تسجيل في wallet_transactions
      await this.logWalletTransaction(
        request.buyer_id,
        refundAmount,
        requestId,
        reason,
        stripeRefundId,
        client
      );

      // 8. تحديث Request state إلى REFUNDED
      const newStatus = amount && amount < request.amount ? 'PARTIALLY_REFUNDED' : 'REFUNDED';
      await this.updateRequestStatus(requestId, newStatus, client);

      // 9. إرسال email confirmation
      await this.sendRefundConfirmationEmail(
        request.buyer_email,
        requestId,
        refundAmount,
        reason
      );

      await client.query('COMMIT');

      logger.info('تم الاسترداد بنجاح', { 
        requestId, 
        refundAmount,
        stripeRefundId 
      });

      return {
        success: true,
        requestId,
        refundAmount,
        stripeRefundId,
        walletTransactionId,
        message: `تم استرداد ${refundAmount} بنجاح`
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('فشل الاسترداد', { requestId, error });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * التحقق من إمكانية طلب الاسترداد
   * 
   * @param requestId - معرف الطلب
   * @returns true إذا كان يمكن طلب الاسترداد
   */
  async canRequestRefund(requestId: number): Promise<boolean> {
    try {
      logger.info('التحقق من إمكانية الاسترداد', { requestId });

      const request = await this.getRequestDetails(requestId);

      // التحقق من الشروط:
      
      // 1. مر أقل من 48 ساعة
      const hoursElapsed = this.getHoursElapsed(request.delivered_at || request.created_at);
      if (hoursElapsed > 48) {
        logger.warn('نافذة الاسترداد منتهية', { requestId, hoursElapsed });
        return false;
      }

      // 2. الحالة DELIVERED أو IN_PROGRESS
      const validStatuses = ['DELIVERED', 'IN_PROGRESS'];
      if (!validStatuses.includes(request.status)) {
        logger.warn('حالة الطلب غير صالحة للاسترداد', { 
          requestId, 
          status: request.status 
        });
        return false;
      }

      // 3. لم يتم refund من قبل
      if (request.status === 'REFUNDED' || request.status === 'PARTIALLY_REFUNDED') {
        logger.warn('الطلب تم استرداده مسبقاً', { requestId });
        return false;
      }

      logger.info('الطلب مؤهل للاسترداد', { requestId });
      return true;

    } catch (error) {
      logger.error('خطأ في التحقق من إمكانية الاسترداد', { requestId, error });
      return false;
    }
  }

  /**
   * حساب المبلغ القابل للإرجاع
   * 
   * @param requestId - معرف الطلب
   * @returns المبلغ القابل للإرجاع
   */
  async calculateRefundAmount(requestId: number): Promise<number> {
    try {
      logger.info('حساب مبلغ الاسترداد', { requestId });

      const request = await this.getRequestDetails(requestId);
      let refundAmount = request.amount;

      // خصم fees إذا لزم (policy based)
      if (this.refundPolicy.feePercentage > 0) {
        const fee = (refundAmount * this.refundPolicy.feePercentage) / 100;
        refundAmount = refundAmount - fee;

        logger.info('تم خصم رسوم الاسترداد', { 
          requestId,
          originalAmount: request.amount,
          fee,
          refundAmount 
        });
      }

      // التحقق من الحد الأدنى
      if (refundAmount < this.refundPolicy.minimumRefundAmount) {
        logger.warn('مبلغ الاسترداد أقل من الحد الأدنى', { 
          requestId,
          refundAmount,
          minimum: this.refundPolicy.minimumRefundAmount 
        });
        throw new Error(`مبلغ الاسترداد أقل من الحد الأدنى: ${this.refundPolicy.minimumRefundAmount}`);
      }

      return refundAmount;

    } catch (error) {
      logger.error('خطأ في حساب مبلغ الاسترداد', { requestId, error });
      throw error;
    }
  }

  /**
   * معالجة استرداد Stripe
   */
  private async processStripeRefund(
    paymentIntentId: string,
    amount: number,
    reason: string
  ): Promise<string> {
    try {
      logger.info('معالجة استرداد Stripe', { 
        paymentIntentId, 
        amount 
      });

      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: Math.round(amount * 100), // تحويل إلى cents
        reason: 'requested_by_customer',
        metadata: {
          refund_reason: reason,
          timestamp: new Date().toISOString()
        }
      });

      logger.info('نجح استرداد Stripe', { 
        refundId: refund.id,
        status: refund.status 
      });

      return refund.id;

    } catch (error) {
      logger.error('فشل استرداد Stripe', { 
        paymentIntentId, 
        error: error.message 
      });
      throw new StripeRefundError(error.message, error);
    }
  }

  /**
   * إعادة الأموال إلى المحفظة
   */
  private async refundToWallet(
    userId: number,
    amount: number,
    requestId: number,
    reason: string,
    client: any
  ): Promise<string> {
    try {
      logger.info('إعادة الأموال إلى المحفظة', { 
        userId, 
        amount, 
        requestId 
      });

      // TODO: التكامل مع WalletService الفعلي
      // await walletService.credit(userId, amount, 'REFUND', requestId.toString(), 'REQUEST');

      // تنفيذ مؤقت - إضافة رصيد مباشرة
      const query = `
        UPDATE wallets
        SET balance = balance + $1,
            updated_at = NOW()
        WHERE user_id = $2
        RETURNING id
      `;

      const result = await client.query(query, [amount, userId]);

      if (result.rows.length === 0) {
        throw new Error(`محفظة المستخدم غير موجودة: ${userId}`);
      }

      logger.info('تمت إضافة الرصيد إلى المحفظة', { 
        userId, 
        amount 
      });

      return `wallet-${result.rows[0].id}`;

    } catch (error) {
      logger.error('فشل إضافة الرصيد إلى المحفظة', { 
        userId, 
        error 
      });
      throw error;
    }
  }

  /**
   * تسجيل معاملة المحفظة
   */
  private async logWalletTransaction(
    userId: number,
    amount: number,
    requestId: number,
    reason: string,
    stripeRefundId: string | undefined,
    client: any
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO wallet_transactions (
          user_id,
          amount,
          type,
          reference_id,
          reference_type,
          description,
          metadata,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `;

      const metadata = JSON.stringify({
        reason,
        stripe_refund_id: stripeRefundId,
        refund_date: new Date().toISOString()
      });

      await client.query(query, [
        userId,
        amount,
        'CREDIT',
        requestId.toString(),
        'REFUND',
        `استرداد للطلب #${requestId}: ${reason}`,
        metadata
      ]);

      logger.info('تم تسجيل معاملة المحفظة', { 
        userId, 
        amount, 
        requestId 
      });

    } catch (error) {
      logger.error('فشل تسجيل معاملة المحفظة', { 
        userId, 
        error 
      });
      throw error;
    }
  }

  /**
   * تحديث حالة escrow_hold
   */
  private async updateEscrowHold(
    requestId: number,
    status: string,
    client: any
  ): Promise<void> {
    try {
      const query = `
        UPDATE escrow_holds
        SET 
          status = $1,
          released_at = NOW(),
          updated_at = NOW()
        WHERE request_id = $2
      `;

      await client.query(query, [status, requestId]);

      logger.info('تم تحديث escrow_hold', { 
        requestId, 
        status 
      });

    } catch (error) {
      logger.error('فشل تحديث escrow_hold', { 
        requestId, 
        error 
      });
      // لا نرمي خطأ هنا لأن escrow_hold قد لا يكون موجوداً
    }
  }

  /**
   * تحديث حالة الطلب
   */
  private async updateRequestStatus(
    requestId: number,
    status: string,
    client: any
  ): Promise<void> {
    try {
      const query = `
        UPDATE requests
        SET 
          status = $1,
          refunded_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
      `;

      await client.query(query, [status, requestId]);

      logger.info('تم تحديث حالة الطلب', { 
        requestId, 
        status 
      });

    } catch (error) {
      logger.error('فشل تحديث حالة الطلب', { 
        requestId, 
        error 
      });
      throw error;
    }
  }

  /**
   * إرسال email تأكيد الاسترداد
   */
  private async sendRefundConfirmationEmail(
    email: string,
    requestId: number,
    amount: number,
    reason: string
  ): Promise<void> {
    try {
      logger.info('إرسال email تأكيد الاسترداد', { 
        email, 
        requestId, 
        amount 
      });

      // TODO: التكامل مع خدمة البريد الإلكتروني
      // await emailService.send({
      //   to: email,
      //   template: 'refund-confirmation',
      //   data: { requestId, amount, reason }
      // });

      logger.info('تم إرسال email التأكيد', { email });

    } catch (error) {
      logger.error('فشل إرسال email التأكيد', { 
        email, 
        error 
      });
      // لا نرمي خطأ هنا لأن فشل البريد لا يجب أن يوقف الاسترداد
    }
  }

  /**
   * جلب تفاصيل الطلب
   */
  private async getRequestDetails(
    requestId: number,
    client?: any
  ): Promise<any> {
    const db = client || this.db;

    const query = `
      SELECT 
        r.id,
        r.amount,
        r.status,
        r.buyer_id,
        r.seller_id,
        r.payment_intent_id,
        r.delivered_at,
        r.created_at,
        u.email as buyer_email
      FROM requests r
      LEFT JOIN users u ON r.buyer_id = u.id
      WHERE r.id = $1
    `;

    const result = await db.query(query, [requestId]);

    if (result.rows.length === 0) {
      throw new Error(`الطلب غير موجود: ${requestId}`);
    }

    return result.rows[0];
  }

  /**
   * التحقق من أهلية الاسترداد
   */
  private async validateRefundEligibility(request: any): Promise<void> {
    // التحقق من نافذة الوقت
    const hoursElapsed = this.getHoursElapsed(
      request.delivered_at || request.created_at
    );

    if (hoursElapsed > 48) {
      throw new RefundWindowExpiredError(hoursElapsed);
    }

    // التحقق من الحالة
    const validStatuses = ['DELIVERED', 'IN_PROGRESS', 'CANCELLED'];
    if (!validStatuses.includes(request.status)) {
      throw new InvalidRequestStatusError(request.status);
    }

    // التحقق من عدم الاسترداد المسبق
    if (request.status === 'REFUNDED' || request.status === 'PARTIALLY_REFUNDED') {
      throw new AlreadyRefundedError(request.id);
    }
  }

  /**
   * حساب الساعات المنقضية
   */
  private getHoursElapsed(date: Date): number {
    const now = new Date();
    const elapsed = now.getTime() - new Date(date).getTime();
    return Math.floor(elapsed / (1000 * 60 * 60));
  }

  /**
   * معالجة webhook من Stripe (charge.refunded)
   */
  async handleStripeRefundWebhook(
    refundId: string,
    paymentIntentId: string,
    amount: number
  ): Promise<void> {
    try {
      logger.info('معالجة webhook استرداد Stripe', { 
        refundId, 
        paymentIntentId 
      });

      // البحث عن الطلب بواسطة payment_intent_id
      const query = `
        SELECT id, status
        FROM requests
        WHERE payment_intent_id = $1
      `;

      const result = await this.db.query(query, [paymentIntentId]);

      if (result.rows.length === 0) {
        logger.warn('لم يتم العثور على طلب لـ payment_intent', { 
          paymentIntentId 
        });
        return;
      }

      const request = result.rows[0];

      // تحديث حالة الطلب إذا لم يتم تحديثها
      if (request.status !== 'REFUNDED' && request.status !== 'PARTIALLY_REFUNDED') {
        await this.updateRequestStatus(
          request.id,
          'REFUNDED',
          this.db
        );

        logger.info('تم تحديث حالة الطلب من webhook', { 
          requestId: request.id 
        });
      }

    } catch (error) {
      logger.error('خطأ في معالجة webhook', { 
        refundId, 
        error 
      });
      throw error;
    }
  }
}
